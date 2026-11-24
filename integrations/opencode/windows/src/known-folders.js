import {loadKoffi} from '../node_modules/@finogeeks2026/finsafe-sdk/src/native.js';

/** Native known folders in the current user context; resolved values cross the handoff explicitly. */
export function readKnownFolders() {
  const koffi=loadKoffi();
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
