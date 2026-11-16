//! Standalone text -> plugin -> result developer host. No FinShield product dependency.
mod native;
use finsafe_pii_protocol::{Output, Request, Response, Segment, FRAME_LIMIT, VERSION};
use serde::Deserialize;
use serde_json::{json, Value};
use std::{
    io::{self, BufRead, Read, Write},
    net::{Shutdown, TcpListener, TcpStream},
    os::windows::io::AsRawHandle,
    path::{Path, PathBuf},
    process::{Command, Stdio},
    time::{Duration, Instant},
};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::windows::named_pipe::{NamedPipeServer, ServerOptions},
};
use windows_sys::Win32::{
    Security::{
        Authorization::ConvertStringSecurityDescriptorToSecurityDescriptorW, SECURITY_ATTRIBUTES,
    },
    System::Pipes::GetNamedPipeClientProcessId,
};
type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;
#[derive(Clone)]
struct Options {
    mode: String,
    exe: Option<PathBuf>,
    project: Option<PathBuf>,
    bin: Option<String>,
    text: String,
    timeout: Duration,
}
fn absolute(path: PathBuf) -> Result<PathBuf> {
    Ok(if path.is_absolute() {
        path
    } else {
        std::env::current_dir()?.join(path)
    })
}
fn options() -> Result<Options> {
    let mut args = std::env::args().skip(1);
    let mode = args.next().unwrap_or_default();
    if mode == "--help" || mode == "-h" || mode.is_empty() {
        return Err("usage: finshield-pii-dev run|ui --exe PATH | --project DIR [--bin NAME] [--text TEXT] [--timeout-ms 2000]".into());
    }
    if mode != "run" && mode != "ui" {
        return Err("expected run or ui".into());
    }
    let mut o = Options {
        mode,
        exe: None,
        project: None,
        bin: None,
        text: "ACME-1234".into(),
        timeout: Duration::from_secs(2),
    };
    while let Some(key) = args.next() {
        match key.as_str() {
            "--exe" => o.exe = Some(absolute(args.next().ok_or("missing executable")?.into())?),
            "--project" => {
                o.project = Some(absolute(args.next().ok_or("missing project")?.into())?)
            }
            "--bin" => o.bin = Some(args.next().ok_or("missing binary name")?),
            "--text" => o.text = args.next().ok_or("missing text")?,
            "--timeout-ms" => {
                let ms: u64 = args.next().ok_or("missing timeout")?.parse()?;
                if ms == 0 {
                    return Err("timeout must be positive".into());
                }
                o.timeout = Duration::from_millis(ms);
            }
            _ => return Err(format!("unknown option {key}").into()),
        }
    }
    if o.exe.is_some() == o.project.is_some() {
        return Err("select exactly one of --exe or --project".into());
    }
    Ok(o)
}
fn build(o: &Options) -> Result<PathBuf> {
    if let Some(exe) = &o.exe {
        if !exe.is_file() {
            return Err("executable does not exist".into());
        }
        return Ok(exe.clone());
    }
    let project = o.project.as_ref().ok_or("missing project")?;
    let manifest = if project.is_dir() {
        project.join("Cargo.toml")
    } else {
        project.clone()
    };
    let mut command = Command::new("cargo");
    command
        .current_dir(manifest.parent().ok_or("project directory")?)
        .args(["build", "--manifest-path"])
        .arg(&manifest)
        .arg("--message-format=json")
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit());
    if let Some(bin) = &o.bin {
        command.args(["--bin", bin]);
    }
    let mut child = command.spawn()?;
    let mut executables = std::collections::BTreeSet::new();
    for line in io::BufReader::new(child.stdout.take().ok_or("cargo stdout")?).lines() {
        let line = line?;
        let Ok(value) = serde_json::from_str::<Value>(&line) else {
            continue;
        };
        if value["reason"] == "compiler-artifact"
            && value["target"]["kind"]
                .as_array()
                .is_some_and(|k| k.iter().any(|v| v == "bin"))
        {
            if let Some(exe) = value["executable"].as_str() {
                executables.insert(PathBuf::from(exe));
            }
        }
        if let Some(message) = value["message"]["rendered"].as_str() {
            eprint!("{message}");
        }
    }
    if !child.wait()?.success() {
        return Err("cargo build failed; see compiler output".into());
    }
    if executables.len() != 1 {
        return Err("project must select one executable; pass --bin when needed".into());
    }
    Ok(executables.into_iter().next().unwrap())
}
struct Session {
    child: native::Process,
    pipe: NamedPipeServer,
}
impl Session {
    async fn start(exe: &Path, timeout: Duration) -> Result<Self> {
        let deadline = tokio::time::Instant::now() + timeout;
        let endpoint = format!(r"\\.\pipe\FinShield.Pii.Dev.{}", uuid::Uuid::new_v4());
        let user = native::user_sid()?;
        let sddl = native::wide(&format!("D:P(A;;GA;;;{user})"));
        let mut raw = std::ptr::null_mut();
        if unsafe {
            ConvertStringSecurityDescriptorToSecurityDescriptorW(
                sddl.as_ptr(),
                1,
                &mut raw,
                std::ptr::null_mut(),
            )
        } == 0
        {
            return Err(io::Error::last_os_error().into());
        }
        let descriptor = native::Local(raw);
        let mut security = SECURITY_ATTRIBUTES {
            nLength: std::mem::size_of::<SECURITY_ATTRIBUTES>() as u32,
            lpSecurityDescriptor: descriptor.0,
            bInheritHandle: 0,
        };
        let pipe = unsafe {
            ServerOptions::new()
                .first_pipe_instance(true)
                .reject_remote_clients(true)
                .create_with_security_attributes_raw(
                    &endpoint,
                    (&mut security as *mut SECURITY_ATTRIBUTES).cast(),
                )
        }?;
        let child = native::Process::spawn(exe, &endpoint)?;
        let connect = async {
            let connected = pipe.connect();
            tokio::pin!(connected);
            loop {
                tokio::select! { r=&mut connected=>{r?;break;}, _=tokio::time::sleep(Duration::from_millis(20))=>{if child.exited(){return Err(io::Error::other("plugin exited before IPC connection"));}}}
            }
            Ok::<(), io::Error>(())
        };
        tokio::time::timeout_at(deadline, connect)
            .await
            .map_err(|_| "plugin startup timed out")??;
        let mut pid = 0;
        if unsafe { GetNamedPipeClientProcessId(pipe.as_raw_handle() as isize, &mut pid) } == 0
            || pid != child.pid
            || child.exited()
        {
            return Err("plugin peer identity mismatch".into());
        }
        Ok(Self { child, pipe })
    }
    async fn process(&mut self, text: String, timeout: Duration) -> Result<Value> {
        let request = Request {
            schema_version: VERSION,
            request_id: uuid::Uuid::new_v4().to_string(),
            segments: vec![Segment {
                id: "s0".into(),
                role: "user".into(),
                text,
            }],
        };
        let started = Instant::now();
        let operation = async {
            let bytes = serde_json::to_vec(&request)?;
            if bytes.len() > FRAME_LIMIT {
                return Err("input exceeds frame limit".into());
            }
            self.pipe
                .write_all(&(bytes.len() as u32).to_be_bytes())
                .await?;
            self.pipe.write_all(&bytes).await?;
            let size = self.pipe.read_u32().await? as usize;
            if size == 0 || size > FRAME_LIMIT {
                return Err("invalid response frame length".into());
            }
            let mut bytes = vec![0; size];
            self.pipe.read_exact(&mut bytes).await?;
            let response: Response = serde_json::from_slice(&bytes)?;
            if response.schema_version != VERSION || response.request_id != request.request_id {
                return Err("response version/request identity mismatch".into());
            }
            let output: Output = response.output.ok_or("plugin reported failed checking")?;
            output.validate(&request).map_err(io::Error::other)?;
            Ok::<Output, Box<dyn std::error::Error + Send + Sync>>(output)
        };
        let output = tokio::time::timeout(timeout, operation)
            .await
            .map_err(|_| "plugin call timed out")??;
        let mut preview = request.segments[0].text.clone();
        if let Some(edit) = output.edits.first() {
            preview = edit.text.clone();
        }
        Ok(
            json!({"pid":self.child.pid,"findings":output.findings,"edits":output.edits,"preview":preview,"elapsed_ms":started.elapsed().as_millis()}),
        )
    }
}
const MAX: usize = 1024 * 1024;
// Cookies are shared by every port on 127.0.0.1. A real developer browser can
// therefore send much larger headers than a fresh browser or an API client.
const HEADER_LIMIT: usize = 64 * 1024;
#[derive(Debug)]
struct HeaderLimit;
impl std::fmt::Display for HeaderLimit {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Request headers exceed the {HEADER_LIMIT}-byte limit")
    }
}
impl std::error::Error for HeaderLimit {}
fn headers(stream: &mut impl Read) -> Result<String> {
    let mut bytes = vec![];
    while !bytes.ends_with(b"\r\n\r\n") {
        if bytes.len() >= HEADER_LIMIT {
            return Err(HeaderLimit.into());
        }
        let mut b = [0];
        Read::read_exact(stream, &mut b)?;
        bytes.push(b[0]);
    }
    if bytes.len() > 8192 {
        // Log only the size, never cookies, text, or other header contents.
        eprintln!("HTTP: accepted {} bytes of request headers", bytes.len());
    }
    Ok(String::from_utf8(bytes)?)
}
fn body(stream: &mut TcpStream, head: &str) -> Result<Vec<u8>> {
    if head.to_ascii_lowercase().contains("transfer-encoding:") {
        return Err("use Content-Length for this local tool".into());
    }
    let size = head
        .lines()
        .find_map(|line| {
            line.split_once(':')
                .filter(|(k, _)| k.eq_ignore_ascii_case("content-length"))
                .and_then(|(_, v)| v.trim().parse::<usize>().ok())
        })
        .ok_or("missing Content-Length")?;
    if size > MAX {
        return Err("input limit".into());
    }
    let mut bytes = vec![0; size];
    Read::read_exact(stream, &mut bytes)?;
    Ok(bytes)
}
fn reply(stream: &mut TcpStream, code: u16, kind: &str, bytes: &[u8]) -> Result<()> {
    write!(stream,"HTTP/1.1 {code} Response\r\nContent-Type: {kind}\r\nContent-Length: {}\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n",bytes.len())?;
    Write::write_all(stream, bytes)?;
    Ok(())
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Input {
    text: String,
}
pub fn run() -> Result<()> {
    let o = options()?;
    let runtime = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;
    let mut exe = build(&o)?;
    let mut session = Some(runtime.block_on(Session::start(&exe, o.timeout))?);
    if o.mode == "run" {
        let output = runtime.block_on(session.as_mut().unwrap().process(o.text, o.timeout))?;
        println!("{}", serde_json::to_string_pretty(&output)?);
        return Ok(());
    }
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let address = listener.local_addr()?;
    let origin = format!("http://{address}");
    println!("{origin}/");
    io::stdout().flush()?;
    let mut ready = true;
    for incoming in listener.incoming() {
        let mut stream = incoming?;
        stream.set_read_timeout(Some(Duration::from_secs(3)))?;
        let result = (|| -> Result<()> {
            let head = headers(&mut stream)?;
            let route = head
                .lines()
                .next()
                .unwrap_or("")
                .split_whitespace()
                .collect::<Vec<_>>();
            if route.len() < 2 {
                return Err("invalid HTTP request".into());
            }
            if route[0] == "GET" && route[1] == "/" {
                return reply(
                    &mut stream,
                    200,
                    "text/html; charset=utf-8",
                    include_bytes!("ui.html"),
                );
            }
            if route[0] == "GET" && route[1] == "/status" {
                return reply(
                    &mut stream,
                    200,
                    "application/json",
                    &serde_json::to_vec(
                        &json!({"pid":session.as_ref().map(|s|s.child.pid),"ready":ready,"executable":exe}),
                    )?,
                );
            }
            if route[0] != "POST" {
                return reply(&mut stream, 404, "text/plain", b"Not found");
            }
            let request_origin = head.lines().find_map(|line| {
                line.split_once(':')
                    .filter(|(k, _)| k.eq_ignore_ascii_case("origin"))
                    .map(|(_, v)| v.trim())
            });
            if request_origin.is_some_and(|value| value != origin) {
                return reply(&mut stream, 403, "text/plain", b"Origin refused");
            }
            let bytes = body(&mut stream, &head)?;
            match route[1] {
                "/stop" => {
                    session = None;
                    ready = false;
                    reply(&mut stream, 200, "application/json", b"{}")
                }
                "/restart" => {
                    session = None;
                    ready = false;
                    exe = build(&o)?;
                    session = Some(runtime.block_on(Session::start(&exe, o.timeout))?);
                    ready = true;
                    reply(
                        &mut stream,
                        200,
                        "application/json",
                        &serde_json::to_vec(
                            &json!({"pid":session.as_ref().unwrap().child.pid,"ready":ready}),
                        )?,
                    )
                }
                "/inspect" => {
                    if !ready || session.is_none() {
                        return reply(&mut stream,409,"application/json",b"{\"error\":\"Plugin is stopped. Click Rebuild and restart before sending input.\"}");
                    }
                    let input: Input = serde_json::from_slice(&bytes)?;
                    let output =
                        runtime.block_on(session.as_mut().unwrap().process(input.text, o.timeout));
                    match output {
                        Ok(value) => reply(
                            &mut stream,
                            200,
                            "application/json; charset=utf-8",
                            &serde_json::to_vec(&value)?,
                        ),
                        Err(error) => {
                            session = None;
                            ready = false;
                            Err(error)
                        }
                    }
                }
                _ => reply(&mut stream, 404, "text/plain", b"Not found"),
            }
        })();
        if let Err(error) = result {
            let code = if error.is::<HeaderLimit>() {
                eprintln!("HTTP 431: {error}");
                431
            } else {
                400
            };
            let _ = reply(
                &mut stream,
                code,
                "application/json; charset=utf-8",
                &serde_json::to_vec(&json!({"error":error.to_string()}))?,
            );
            if code == 431 {
                // Closing a Windows socket with unread incoming bytes can
                // reset it and discard the error response. Send FIN first,
                // then drain a bounded amount with a short read timeout.
                let _ = stream.shutdown(Shutdown::Write);
                let _ = stream.set_read_timeout(Some(Duration::from_millis(100)));
                let _ = io::copy(
                    &mut Read::take(&mut stream, HEADER_LIMIT as u64),
                    &mut io::sink(),
                );
            }
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn request_of_size(size: usize) -> Vec<u8> {
        let prefix = b"GET / HTTP/1.1\r\nHost: 127.0.0.1\r\nCookie: test=";
        let suffix = b"\r\n\r\n";
        let mut request = prefix.to_vec();
        request.resize(size - suffix.len(), b'x');
        request.extend_from_slice(suffix);
        request
    }

    #[test]
    fn browser_headers_larger_than_eight_kib_are_accepted() {
        let request = request_of_size(32 * 1024);
        assert_eq!(
            headers(&mut request.as_slice()).unwrap().len(),
            request.len()
        );
    }

    #[test]
    fn header_limit_is_bounded_and_inclusive() {
        let request = request_of_size(HEADER_LIMIT);
        assert_eq!(
            headers(&mut request.as_slice()).unwrap().len(),
            HEADER_LIMIT
        );
        let oversized = request_of_size(HEADER_LIMIT + 1);
        assert!(headers(&mut oversized.as_slice())
            .unwrap_err()
            .is::<HeaderLimit>());
    }

    #[test]
    fn header_read_preserves_the_request_body() {
        let mut input = &b"POST /inspect HTTP/1.1\r\nContent-Length: 2\r\n\r\n{}"[..];
        let head = headers(&mut input).unwrap();
        assert!(head.ends_with("\r\n\r\n"));
        assert_eq!(input, b"{}");
    }
}
