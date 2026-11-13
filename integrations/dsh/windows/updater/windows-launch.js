import {createRequire} from 'node:module';
import {EventEmitter} from 'node:events';
import {Worker} from 'node:worker_threads';

// Fixed Windows x64 Wrap transport. Authorization still uses the existing DLL.
export function createWindowsLauncher(vendor=createRequire(import.meta.url)) {
  if(process.platform!=='win32'||process.arch!=='x64')throw Error('Wrap launcher requires Windows x64');
  const koffi=vendor('koffi'),kernel=koffi.load('kernel32.dll'),fn=signature=>kernel.func(signature);
  const api={
    error:fn('uint32 __stdcall GetLastError()'),close:fn('int __stdcall CloseHandle(uintptr_t)'),
    pipe:fn('int __stdcall CreatePipe(void*, void*, void*, uint32)'),
    inherit:fn('int __stdcall SetHandleInformation(uintptr_t, uint32, uint32)'),
    input:fn('uintptr_t __stdcall CreateFileW(str16, uint32, uint32, void*, uint32, uint32, uintptr_t)'),
    init:fn('int __stdcall InitializeProcThreadAttributeList(void*, uint32, uint32, void*)'),
    update:fn('int __stdcall UpdateProcThreadAttribute(void*, uint32, uintptr_t, void*, uintptr_t, void*, void*)'),
    destroy:fn('void __stdcall DeleteProcThreadAttributeList(void*)'),
    create:fn('int __stdcall CreateProcessW(str16, void*, void*, void*, int, uint32, void*, str16, void*, void*)'),
    wait:fn('uint32 __stdcall WaitForSingleObject(uintptr_t, uint32)'),
    kill:fn('int __stdcall TerminateProcess(uintptr_t, uint32)'),
    compare:fn('int __stdcall CompareStringOrdinal(str16, int, str16, int, int)'),
  };
  const check=(ok,operation)=>{if(!ok)throw Error(`${operation}: Win32 ${api.error()}`);};
  const compare=(a,b)=>{const result=api.compare(a,-1,b,-1,1);check(result,'CompareStringOrdinal');return result-2;};
  const quote=value=>'"'+value.replace(/(\\*)"/g,'$1$1\\"').replace(/\\+$/g,'$&$&')+'"';
  return (executable,args,{env=process.env}={})=>{
    const child=new EventEmitter(),handles=new Set();
    child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.exitCode=null;
    child.stdout.destroy=child.stderr.destroy=child.unref=()=>{};
    let processHandle,workers=0,closed=false,failed=false;
    const close=handle=>{if(handles.delete(handle))api.close(handle);};
    const finish=()=>{
      if(workers||closed)return;closed=true;
      for(const handle of handles)close(handle);
      if(child.pid&&!failed)child.emit('exit',child.exitCode);
      child.emit('close',child.exitCode,null);
    };
    child.kill=()=>{
      if(!closed&&processHandle&&api.wait(processHandle,0)===258)check(api.kill(processHandle,1),'TerminateProcess');
    };
    const fail=error=>{
      if(failed)return;failed=true;
      try{child.kill();}catch(cleanup){error.cleanupError=cleanup;}
      child.emit('error',error);
    };
    queueMicrotask(()=>{
      let attributes,initialized=false;
      try {
        const parts=[executable,...args];
        let entries=Object.entries(env).filter(([key,value])=>value!==undefined&&compare(key,'ELECTRON_RUN_AS_NODE')!==0);
        entries.sort(([a],[b])=>compare(a,b));
        entries=entries.filter(([key],i)=>i===entries.length-1||compare(key,entries[i+1][0])!==0);
        const values=entries.map(([key,value])=>key+'='+String(value));
        if([...parts,...values].some(value=>value.includes('\0')))throw Error('Launcher input contains NUL');
        const command=Buffer.from(parts.map(quote).join(' ')+'\0','utf16le');
        if(command.length/2>32767)throw Error('Launcher command exceeds Windows length limit');
        const environment=Buffer.from(values.join('\0')+'\0\0','utf16le');
        const security=Buffer.alloc(24);security.writeUInt32LE(24);security.writeUInt32LE(1,16);
        const pipe=()=>{
          const read=Buffer.alloc(8),write=Buffer.alloc(8);check(api.pipe(read,write,security,0),'CreatePipe');
          const pair=[read.readBigUInt64LE(),write.readBigUInt64LE()];pair.forEach(handle=>handles.add(handle));
          check(api.inherit(pair[0],1,0),'SetHandleInformation');return pair;
        };
        const [stdout,stdoutWrite]=pipe(),[stderr,stderrWrite]=pipe();
        const input=BigInt(api.input('NUL',0x80000000,3,security,3,0x80,0));
        check(input!==0xffffffffffffffffn,'CreateFileW NUL');handles.add(input);
        const inherited=Buffer.alloc(24);[input,stdoutWrite,stderrWrite].forEach((handle,i)=>inherited.writeBigUInt64LE(handle,i*8));
        const size=Buffer.alloc(8);api.init(null,1,0,size);
        attributes=Buffer.alloc(Number(size.readBigUInt64LE()));check(api.init(attributes,1,0,size),'InitializeProcThreadAttributeList');initialized=true;
        check(api.update(attributes,0,0x20002,inherited,inherited.length,null,null),'UpdateProcThreadAttribute');
        const startup=Buffer.alloc(112),info=Buffer.alloc(24);
        startup.writeUInt32LE(112);startup.writeUInt32LE(0x140,60); // USESTDHANDLES | FORCEONFEEDBACK
        [input,stdoutWrite,stderrWrite].forEach((handle,i)=>startup.writeBigUInt64LE(handle,80+i*8));
        startup.writeBigUInt64LE(koffi.address(attributes),104);
        check(api.create(executable,command,null,null,1,0x09080400,environment,null,startup,info),'CreateProcessW');
        processHandle=info.readBigUInt64LE();handles.add(processHandle);
        handles.add(info.readBigUInt64LE(8));close(info.readBigUInt64LE(8));
        child.pid=info.readUInt32LE(16);[input,stdoutWrite,stderrWrite].forEach(close);
        for(const [stream,handle] of [['stdout',stdout],['stderr',stderr]]) {
          const worker=new Worker(new URL('./windows-launch-reader.js',import.meta.url),{
            workerData:{koffiPath:vendor.resolve('koffi'),handle,processHandle,stream},
          });
          workers++;
          worker.on('message',message=>{
            if(message.error)fail(Error(message.error));
            else if(message.data)child[stream].emit('data',message.data);
            else if(message.code!==undefined)child.exitCode=message.code;
          });
          worker.on('error',fail);
          worker.on('exit',code=>{if(code)fail(Error(`${stream} reader exited (${code})`));close(handle);workers--;finish();});
        }
      } catch(error) {fail(error);finish();}
      finally {if(initialized)api.destroy(attributes);}
    });
    return child;
  };
}
