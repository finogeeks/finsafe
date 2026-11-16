#!/usr/bin/env python3
"""Independent PII kit checks. No private repository modules or fixtures."""
from __future__ import annotations
import argparse
import concurrent.futures
import ctypes
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
import tomllib
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parents[1]


def sources(root):
    for directory, children, names in os.walk(root):
        children[:] = sorted(x for x in children if x not in {"target", ".git", "__pycache__"})
        for child in children:
            assert not (Path(directory) / child).is_symlink(), f"source directory symlink: {child}"
        for name in sorted(names):
            yield Path(directory) / name


def boundary(root):
    root = root.resolve()

    def inside(path):
        assert path.resolve().is_relative_to(root), f"path leaves kit: {path}"
        assert path.exists(), f"missing source: {path}"

    def dependencies(value, manifest):
        if not isinstance(value, dict):
            return
        for key, item in value.items():
            if key == "path" and isinstance(item, str):
                inside(manifest.parent / item)
            elif isinstance(item, dict):
                dependencies(item, manifest)

    for path in sources(root):
        assert not path.is_symlink(), f"source symlink is not exportable: {path}"
        if path.name == "Cargo.toml":
            dependencies(tomllib.loads(path.read_text(encoding="utf-8")), path)
        if path.suffix == ".rs":
            text = path.read_text(encoding="utf-8")
            assert not re.search(r"\bfinsafe_(json|net_proxy|winsafe)\b", text), path
            for include in re.findall(r'include(?:_str|_bytes)?!\(\s*"([^"]+)"', text):
                inside(path.parent / include)
    print("PASSED: independent local dependency and include graph", flush=True)


def command(root, *args, capture=False):
    print("+", " ".join(map(str, args)), flush=True)
    return subprocess.run(args, cwd=root, check=True, text=True, encoding="utf-8",
                          stdout=subprocess.PIPE if capture else None)


def api(url, route, data=None, headers=None):
    payload = None if data is None else json.dumps(data).encode()
    request = urllib.request.Request(url.rstrip("/") + route, data=payload,
                                     headers={"Content-Type": "application/json", **(headers or {})})
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.load(response)


def alive(pid):
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.OpenProcess.argtypes = [ctypes.c_uint32, ctypes.c_int, ctypes.c_uint32]
    kernel.OpenProcess.restype = ctypes.c_void_p
    kernel.WaitForSingleObject.argtypes = [ctypes.c_void_p, ctypes.c_uint32]
    kernel.CloseHandle.argtypes = [ctypes.c_void_p]
    handle = kernel.OpenProcess(0x100000, 0, pid)
    if not handle:
        return False
    try:
        return kernel.WaitForSingleObject(handle, 0) == 258
    finally:
        kernel.CloseHandle(handle)


def stopped(pid):
    deadline = time.monotonic() + 5
    while alive(pid) and time.monotonic() < deadline:
        time.sleep(.02)
    assert not alive(pid), f"owned plugin survived cleanup: {pid}"


def launcher(root, selection=()):
    """Use only the public PowerShell launcher, from an unrelated directory."""
    assert (root / "start-workbench.cmd").is_file()
    state_file = root / "target/workbench.json"
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.OpenProcess.argtypes = [ctypes.c_uint32, ctypes.c_int, ctypes.c_uint32]
    kernel.OpenProcess.restype = ctypes.c_void_p
    kernel.TerminateProcess.argtypes = [ctypes.c_void_p, ctypes.c_uint32]
    kernel.WaitForSingleObject.argtypes = [ctypes.c_void_p, ctypes.c_uint32]
    kernel.CloseHandle.argtypes = [ctypes.c_void_p]
    host_handle = None
    plugin_pid = None
    with tempfile.TemporaryFile(mode="w+t", encoding="utf-8") as log:
        process = subprocess.Popen([
            "powershell.exe", "-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass",
            "-File", str(root / "scripts/start-workbench.ps1"), *selection, "-NoBrowser",
        ], cwd=tempfile.gettempdir(), stdout=log, stderr=log)
        try:
            deadline = time.monotonic() + 300
            state = None
            while time.monotonic() < deadline:
                if state_file.is_file():
                    candidate = json.loads(state_file.read_text(encoding="utf-8-sig"))
                    if candidate["launcher_pid"] == process.pid:
                        state = candidate
                        break
                if process.poll() is not None:
                    break
                time.sleep(.1)
            if state is None:
                log.seek(0)
                raise AssertionError("public launcher did not become ready:\n" + log.read())
            host_handle = kernel.OpenProcess(0x100001, 0, state["host_pid"])
            assert host_handle, "cannot retain the owned launcher host"
            with urllib.request.urlopen(state["url"], timeout=10) as page:
                assert b"PII Plugin Workbench" in page.read()
            status = api(state["url"], "/status")
            plugin_pid = status["pid"]
            assert status["ready"]
            output = api(state["url"], "/inspect", {"text": "My ID is 11010119900101123X."})
            assert output["preview"] == "My ID is 110XXX123X.", output
            # End this owned host with exit code 0; the launcher must return and
            # the host's existing kill-on-close Job must end its plugin.
            assert kernel.TerminateProcess(host_handle, 0)
            assert process.wait(timeout=15) == 0
            stopped(plugin_pid)
            if state_file.is_file():
                saved = json.loads(state_file.read_text(encoding="utf-8-sig"))
                assert saved["launcher_pid"] != process.pid, "exited launcher left a stale URL record"
        finally:
            if host_handle:
                kernel.TerminateProcess(host_handle, 0)
                kernel.WaitForSingleObject(host_handle, 5000)
                kernel.CloseHandle(host_handle)
            if process.poll() is None:
                process.terminate()
                process.wait(timeout=10)
            if plugin_pid:
                stopped(plugin_pid)
    mode = selection[0] if selection else "default example"
    print(f"PASSED: public launcher ({mode}) builds, serves HTML, processes text and cleans up", flush=True)


def native(root, target):
    # Exported fresh EXEs can incur Windows cold image scanning. This is a
    # protocol/lifecycle smoke, not a two-second cold-start performance test.
    fixture = json.loads((root / "fixtures/employee.json").read_text(encoding="utf-8"))
    resident = json.loads((root / "fixtures/resident-id.json").read_text(encoding="utf-8"))
    tool = target / "debug/finshield-pii-dev.exe"
    employee = target / "debug/finsafe-pii-example.exe"
    result = json.loads(command(root, str(tool), "run", "--timeout-ms", "12000", "--exe", str(employee),
                                "--text", fixture["text"], capture=True).stdout)
    assert result["findings"][0]["category"] == fixture["category"], result
    assert result["preview"] == fixture["text"] and not result["edits"], result
    stopped(result["pid"])
    # Project resolution uses Cargo artifact metadata, including a fresh public target.
    result = json.loads(command(root, str(tool), "run", "--timeout-ms", "12000", "--project",
                                str(root / "examples/redactor"), "--text",
                                resident["text"], capture=True).stdout)
    assert result["preview"] == resident["preview"], result
    stopped(result["pid"])
    with tempfile.TemporaryFile(mode="w+t", encoding="utf-8") as log:
        process = subprocess.Popen([str(tool), "ui", "--project",
                                   str(root / "examples/redactor"),
                                   "--timeout-ms", "12000"],
                                  cwd=root, stdout=subprocess.PIPE, stderr=log,
                                  text=True, encoding="utf-8")
        pid = None
        try:
            with concurrent.futures.ThreadPoolExecutor(1) as pool:
                url = pool.submit(process.stdout.readline).result(timeout=60).strip()
            assert url.startswith("http://127.0.0.1:"), url
            with urllib.request.urlopen(url, timeout=5) as page:
                html = page.read()
                assert b"PII Plugin Workbench" in html
                assert b"Rebuild and restart" in html
                assert b"Debugger attached" not in html
            state = api(url, "/status")
            pid = state["pid"]
            assert state["ready"] and alive(pid), state
            # Browsers share loopback cookies across ports. The old 8 KiB
            # parser returned HTTP 400 in a real Chrome profile, while clean
            # browser/API smoke tests passed. Exercise GET and same-origin POST.
            browser_headers = {"Cookie": "synthetic_test=" + "x" * (32 * 1024),
                               "Origin": url.rstrip("/")}
            with urllib.request.urlopen(urllib.request.Request(url, headers=browser_headers), timeout=5) as page:
                assert page.status == 200 and b"PII Plugin Workbench" in page.read()
            assert api(url, "/status", headers=browser_headers)["ready"]
            result = api(url, "/inspect", {"text": resident["text"]}, headers=browser_headers)
            assert result["preview"] == resident["preview"], result
            try:
                urllib.request.urlopen(urllib.request.Request(url, headers={
                    "Cookie": "synthetic_test=" + "x" * (64 * 1024)}), timeout=5)
            except urllib.error.HTTPError as error:
                assert error.code == 431, error
                assert "65536-byte limit" in error.read().decode()
            else:
                raise AssertionError("unbounded request headers were accepted")
            print("PASSED: large browser headers on HTML/status/inspect; oversized headers return 431", flush=True)
            result = api(url, "/inspect", {"text": resident["text"]})
            assert result["preview"] == resident["preview"], result
            old = pid
            state = api(url, "/restart", {})
            pid = state["pid"]
            assert pid != old and alive(pid) and state["ready"], state
            stopped(old)
            assert api(url, "/inspect", {"text": resident["text"]})["preview"] == resident["preview"]
            api(url, "/stop", {})
            stopped(pid)
            assert api(url, "/status")["pid"] is None
            pid = api(url, "/restart", {})["pid"]
            assert alive(pid)
        finally:
            process.terminate()
            process.wait(timeout=10)
            process.stdout.close()
            if pid:
                stopped(pid)
            log.seek(0)
            diagnostics = log.read()
            if diagnostics:
                print(diagnostics, flush=True)
    print("PASSED: real EXEs, CLI/project, HTML input/output, rebuild and cleanup", flush=True)


def verify(root, target):
    boundary(root)
    command(root, "cargo", "fmt", "--all", "--", "--check")
    for action in ("test", "clippy", "build"):
        args = ["cargo", action, "--workspace", "--all-targets", "--locked",
                "--target-dir", str(target)]
        if action == "clippy":
            args += ["--", "-D", "warnings"]
        command(root, *args)
    native(root, target)
    launcher(root)
    launcher(root, ("-Project", str(root / "examples/redactor")))
    launcher(root, ("-Executable", str(target / "debug/finsafe-pii-redactor.exe")))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--export", action="store_true", help="copy only this kit outside its checkout and verify the copy")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if args.dry_run:
        print("Plan: check local paths; cargo fmt, locked workspace test/clippy/build; "
              "Windows EXE CLI/HTML/rebuild/restart/cleanup and public launcher smoke. "
              + ("First copy only this kit to an external temporary directory." if args.export else "Use this kit directory."))
        return
    if sys.platform != "win32" or ctypes.sizeof(ctypes.c_void_p) != 8:
        parser.error("native kit acceptance requires Windows x64")
    if args.export:
        with tempfile.TemporaryDirectory(prefix="finshield-pii-export-") as directory:
            copy = Path(directory) / "pii plugins standalone copy"
            boundary(ROOT)
            shutil.copytree(ROOT, copy, ignore=shutil.ignore_patterns("target", ".git", "__pycache__", "*.pdb"))
            print(f"Exported kit: {copy}", flush=True)
            verify(copy, copy / "target")
    else:
        verify(ROOT, ROOT / "target")
    print("PASSED: public PII developer kit", flush=True)


if __name__ == "__main__":
    main()
