import { createRequire } from 'node:module';
import { join } from 'node:path';

/** Native known folders in the current user context; resolved values cross the handoff explicitly. */
export function readKnownFolders(runtimeRoot) {
  const require=createRequire(join(runtimeRoot,'node_modules','@deepseek-ai','dsh','package.json'));
  const koffi=require('koffi');
  const ole=koffi.load('ole32.dll'),shell=koffi.load('shell32.dll');
  const guid=ole.func('int32_t __stdcall CLSIDFromString(str16 text, void* value)');
  const folder=shell.func('int32_t __stdcall SHGetKnownFolderPath(void* id, uint32_t flags, void* token, void* path)');
  const free=ole.func('void __stdcall CoTaskMemFree(void* value)');
  const result={};
  for(const [key,id] of Object.entries({programFiles:'{905E63B6-C1BF-494E-B29C-65B732D3D21A}',
    programData:'{62AB5D82-FDC1-4DC3-A9DD-070D1D495D97}',localAppData:'{F1B32785-6FBA-4FCF-9D55-7B8E7F157091}'})) {
    const value=Buffer.alloc(16),out=Buffer.alloc(koffi.sizeof('void*'));
    if(guid(id,value)!==0) throw new Error('Invalid known-folder identifier');
    // Preserve the user's current known-folder relocation, without package redirection.
    const code=folder(value,0x00010000,null,out); // KF_FLAG_NO_PACKAGE_REDIRECTION
    if(code!==0) throw new Error(`SHGetKnownFolderPath ${key}: HRESULT ${code}`);
    const pointer=koffi.decode(out,'void*');
    try { result[key]=koffi.decode(out,'str16'); } finally { free(pointer); }
  }
  return result;
}

export function readCurrentUserSid(runtimeRoot) {
  const require = createRequire(join(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh', 'package.json'));
  const koffi = require('koffi');
  const kernel = koffi.load('kernel32.dll'), security = koffi.load('advapi32.dll');
  const current = kernel.func('void* __stdcall GetCurrentProcess()');
  const close = kernel.func('int __stdcall CloseHandle(void* handle)');
  const free = kernel.func('void* __stdcall LocalFree(void* handle)');
  const open = security.func('int __stdcall OpenProcessToken(void* process, uint32_t access, void* token)');
  const info = security.func('int __stdcall GetTokenInformation(void* token, int kind, void* data, uint32_t size, void* needed)');
  const convert = security.func('int __stdcall ConvertSidToStringSidW(void* sid, void* text)');
  const out = Buffer.alloc(koffi.sizeof('void*'));
  if (!open(current(),8,out)) throw new Error('Cannot read current user token');
  const token = koffi.decode(out,'void*');
  let text;
  try {
    const needed = Buffer.alloc(4);
    info(token,1,null,0,needed);
    const data = Buffer.alloc(needed.readUInt32LE());
    if (!info(token,1,data,data.length,needed)) throw new Error('Cannot read TokenUser');
    if (!convert(koffi.decode(data,'void*'),out)) throw new Error('Cannot format current user SID');
    text = koffi.decode(out,'void*');
    return koffi.decode(out,'str16');
  } finally { if (text) free(text); close(token); }
}

/** Read the current native token using the Koffi already carried by installed DSH. */
export function readCurrentToken(runtimeRoot, expectedSid) {
  const require = createRequire(join(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh', 'package.json'));
  const koffi = require('koffi');
  const kernel = koffi.load('kernel32.dll');
  const security = koffi.load('advapi32.dll');
  const current = kernel.func('void* __stdcall GetCurrentProcess()');
  const close = kernel.func('int __stdcall CloseHandle(void* handle)');
  const free = kernel.func('void* __stdcall LocalFree(void* handle)');
  const lastError = kernel.func('uint32_t __stdcall GetLastError()');
  const open = security.func('int __stdcall OpenProcessToken(void* process, uint32_t access, void* token)');
  const info = security.func('int __stdcall GetTokenInformation(void* token, int kind, void* data, uint32_t size, void* needed)');
  const convertSid = security.func('int __stdcall ConvertStringSidToSidW(str16 text, void* sid)');
  const equalSid = security.func('int __stdcall EqualSid(void* left, void* right)');
  const checked = (ok, operation) => { if (!ok) throw new Error(`${operation}: Win32 ${lastError()}`); };
  const pointerBytes = koffi.sizeof('void*');
  const tokenOut = Buffer.alloc(pointerBytes);
  checked(open(current(), 8, tokenOut), 'OpenProcessToken');
  const token = koffi.decode(tokenOut, 'void*');
  let expected = null;
  try {
    const needed = Buffer.alloc(4), value = Buffer.alloc(4);
    checked(info(token, 29, value, value.length, needed), 'TokenIsAppContainer');
    if (value.readUInt32LE() === 0) return { appContainer: false, expectedPackage: false };
    if (!expectedSid) return { appContainer: true, expectedPackage: false };
    info(token, 31, null, 0, needed);
    const packageInfo = Buffer.alloc(needed.readUInt32LE());
    checked(info(token, 31, packageInfo, packageInfo.length, needed), 'TokenAppContainerSid');
    const expectedOut = Buffer.alloc(pointerBytes);
    checked(convertSid(expectedSid, expectedOut), 'ConvertStringSidToSidW');
    expected = koffi.decode(expectedOut, 'void*');
    return { appContainer: true, expectedPackage: equalSid(koffi.decode(packageInfo, 'void*'), expected) !== 0 };
  } finally {
    if (expected !== null) free(expected);
    close(token);
  }
}
