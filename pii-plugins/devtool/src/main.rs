#[cfg(windows)]
mod windows;
#[cfg(windows)]
fn main() {
    if let Err(error) = windows::run() {
        eprintln!("{error}");
        std::process::exit(1);
    }
}
#[cfg(not(windows))]
fn main() {
    eprintln!("The EXE/IPC development host currently requires Windows. Protocol, SDK and callback unit tests are portable.");
    std::process::exit(1);
}
