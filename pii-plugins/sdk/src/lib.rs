//! Implement a callback; the SDK handles framed requests and the Windows pipe client.
pub use finsafe_pii_protocol::{read_frame, write_frame, Edit, Finding, Output, Segment};
use finsafe_pii_protocol::{Request, Response, VERSION};
use std::io::{self, Read, Write};
/// A returned Err becomes a failed check, never an empty successful finding list.
pub fn run(
    stream: &mut (impl Read + Write),
    mut process: impl FnMut(&[Segment]) -> Result<Output, ()>,
) -> io::Result<()> {
    loop {
        let request: Request = match read_frame(stream) {
            Ok(value) => value,
            Err(error) if error.kind() == io::ErrorKind::UnexpectedEof => return Ok(()),
            Err(error) => return Err(error),
        };
        if request.schema_version != VERSION || request.segments.len() > 512 {
            return Err(io::Error::other("unsupported plugin request"));
        }
        let output = process(&request.segments).ok();
        write_frame(
            stream,
            &Response {
                schema_version: VERSION,
                request_id: request.request_id,
                output,
            },
        )?;
    }
}
/// Entry point for a Windows EXE. The host supplies --socket; callback initialization happens once.
#[cfg(windows)]
pub fn serve(process: impl FnMut(&[Segment]) -> Result<Output, ()>) -> io::Result<()> {
    let args: Vec<_> = std::env::args_os().skip(1).collect();
    if args.len() != 2 || args[0] != "--socket" {
        return Err(io::Error::other("expected --socket endpoint"));
    }
    use std::os::windows::fs::OpenOptionsExt;
    use windows_sys::Win32::Storage::FileSystem::{SECURITY_IDENTIFICATION, SECURITY_SQOS_PRESENT};
    let mut pipe = std::fs::OpenOptions::new()
        .read(true)
        .write(true)
        .access_mode(0x00100083) // Data-only pipe access; no create-instance right.
        .custom_flags(SECURITY_SQOS_PRESENT | SECURITY_IDENTIFICATION)
        .open(&args[1])?;
    // The SDK does not print user input through a panic hook or exception formatter.
    std::panic::set_hook(Box::new(|_| {}));
    run(&mut pipe, process)
}
#[cfg(not(windows))]
pub fn serve(_: impl FnMut(&[Segment]) -> Result<Output, ()>) -> io::Result<()> {
    Err(io::Error::other("Windows plugin transport required"))
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn truncated_and_oversize_frames_are_rejected() {
        assert!(read_frame::<Request>(&mut &u32::MAX.to_be_bytes()[..]).is_err());
        assert!(read_frame::<Request>(&mut &[0, 0, 0, 9, b'{'][..]).is_err());
    }
    #[test]
    fn output_validation_rejects_invalid_labels_and_utf16_offsets() {
        let request = Request {
            schema_version: VERSION,
            request_id: "x".into(),
            segments: vec![Segment {
                id: "s".into(),
                role: "user".into(),
                text: "张三".into(),
            }],
        };
        let mut output = Output {
            findings: vec![Finding {
                segment_id: "s".into(),
                category: "acme.name".into(),
                start: 0,
                end: 2,
                confidence: 1.0,
            }],
            edits: vec![],
        };
        assert!(output.validate(&request).is_err());
        output.findings[0].end = 6;
        assert!(output.validate(&request).is_ok());
        output.findings[0].category = "invalid\r\nlabel".into();
        assert!(output.validate(&request).is_err());
        output.findings[0].category = "vendor.new_type".into();
        assert!(output.validate(&request).is_ok());
        output.edits.push(Edit {
            segment_id: "s".into(),
            text: "[NAME]".into(),
        });
        assert!(output.validate(&request).is_ok());
        output.edits.push(output.edits[0].clone());
        assert!(output.validate(&request).is_err());
    }
}
