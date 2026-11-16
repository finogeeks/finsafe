//! Ordinary Windows process and pipe ownership for the public developer tool.
use std::{io, os::windows::ffi::OsStrExt, path::Path, ptr};
use windows_sys::Win32::{
    Foundation::{CloseHandle, LocalFree, HANDLE},
    Security::{Authorization::*, GetTokenInformation, TokenUser, TOKEN_QUERY, TOKEN_USER},
    System::{JobObjects::*, Threading::*},
};
type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;
pub fn wide(value: &str) -> Vec<u16> {
    value.encode_utf16().chain(Some(0)).collect()
}
pub struct Local(pub *mut core::ffi::c_void);
impl Drop for Local {
    fn drop(&mut self) {
        unsafe {
            LocalFree(self.0);
        }
    }
}
struct Handle(HANDLE);
impl Drop for Handle {
    fn drop(&mut self) {
        unsafe {
            CloseHandle(self.0);
        }
    }
}
pub fn user_sid() -> Result<String> {
    let mut token = 0;
    if unsafe { OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token) } == 0 {
        return Err(io::Error::last_os_error().into());
    }
    let token = Handle(token);
    let mut size = 0;
    unsafe {
        GetTokenInformation(token.0, TokenUser, ptr::null_mut(), 0, &mut size);
    }
    let mut storage = vec![0u64; (size as usize).div_ceil(8)];
    if unsafe {
        GetTokenInformation(
            token.0,
            TokenUser,
            storage.as_mut_ptr().cast(),
            size,
            &mut size,
        )
    } == 0
    {
        return Err(io::Error::last_os_error().into());
    }
    let user = unsafe { &*storage.as_ptr().cast::<TOKEN_USER>() };
    let mut sid = ptr::null_mut();
    if unsafe { ConvertSidToStringSidW(user.User.Sid, &mut sid) } == 0 {
        return Err(io::Error::last_os_error().into());
    }
    let owner = Local(sid.cast());
    let mut length = 0;
    unsafe {
        while *sid.add(length) != 0 {
            length += 1;
        }
    }
    let result = unsafe { String::from_utf16(std::slice::from_raw_parts(sid, length))? };
    drop(owner);
    Ok(result)
}
fn quoted(value: &[u16]) -> Vec<u16> {
    let mut result = vec![34];
    let mut slashes = 0;
    for &ch in value {
        if ch == 92 {
            slashes += 1;
            continue;
        }
        result.extend(std::iter::repeat_n(
            92,
            if ch == 34 { slashes * 2 + 1 } else { slashes },
        ));
        slashes = 0;
        result.push(ch);
    }
    result.extend(std::iter::repeat_n(92, slashes * 2));
    result.push(34);
    result
}
pub struct Process {
    handle: Handle,
    job: Handle,
    pub pid: u32,
}
impl Process {
    pub fn spawn(exe: &Path, endpoint: &str) -> Result<Self> {
        let job = Handle(unsafe { CreateJobObjectW(ptr::null(), ptr::null()) });
        if job.0 == 0 {
            return Err(io::Error::last_os_error().into());
        }
        let mut limits: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = unsafe { std::mem::zeroed() };
        limits.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
        if unsafe {
            SetInformationJobObject(
                job.0,
                JobObjectExtendedLimitInformation,
                (&limits as *const JOBOBJECT_EXTENDED_LIMIT_INFORMATION).cast(),
                std::mem::size_of_val(&limits) as u32,
            )
        } == 0
        {
            return Err(io::Error::last_os_error().into());
        }
        let path: Vec<u16> = exe.as_os_str().encode_wide().chain(Some(0)).collect();
        let mut command = quoted(&path[..path.len() - 1]);
        command.extend(" --socket ".encode_utf16());
        command.extend(quoted(&endpoint.encode_utf16().collect::<Vec<_>>()));
        command.push(0);
        let cwd: Vec<u16> = exe
            .parent()
            .ok_or("executable directory")?
            .as_os_str()
            .encode_wide()
            .chain(Some(0))
            .collect();
        let mut startup: STARTUPINFOW = unsafe { std::mem::zeroed() };
        startup.cb = std::mem::size_of_val(&startup) as u32;
        let mut info: PROCESS_INFORMATION = unsafe { std::mem::zeroed() };
        if unsafe {
            CreateProcessW(
                path.as_ptr(),
                command.as_mut_ptr(),
                ptr::null(),
                ptr::null(),
                0,
                CREATE_SUSPENDED | CREATE_NO_WINDOW,
                ptr::null(),
                cwd.as_ptr(),
                &startup,
                &mut info,
            )
        } == 0
        {
            return Err(io::Error::last_os_error().into());
        }
        let process = Self {
            handle: Handle(info.hProcess),
            job,
            pid: info.dwProcessId,
        };
        let thread = Handle(info.hThread);
        if unsafe { AssignProcessToJobObject(process.job.0, process.handle.0) } == 0
            || unsafe { ResumeThread(thread.0) } == u32::MAX
        {
            return Err(io::Error::last_os_error().into());
        }
        Ok(process)
    }
    pub fn exited(&self) -> bool {
        unsafe {
            WaitForSingleObject(self.handle.0, 0) != windows_sys::Win32::Foundation::WAIT_TIMEOUT
        }
    }
}
impl Drop for Process {
    fn drop(&mut self) {
        unsafe {
            TerminateJobObject(self.job.0, 1);
            TerminateProcess(self.handle.0, 1);
            WaitForSingleObject(self.handle.0, 2000);
        }
    }
}
