import {createRequire} from 'node:module';
import {parentPort,workerData} from 'node:worker_threads';

// Blocking Win32 reads run here; error retrieval stays on the calling thread.
const {koffiPath,handle,processHandle,stream}=workerData;
const koffi=createRequire(koffiPath)('koffi'),kernel=koffi.load('kernel32.dll');
const read=kernel.func('int __stdcall ReadFile(uintptr_t, void*, uint32, void*, void*)');
const lastError=kernel.func('uint32 __stdcall GetLastError()');
try {
  const buffer=Buffer.alloc(4096),count=Buffer.alloc(4),decoder=new TextDecoder('utf-8',{fatal:true});
  let pending=Buffer.alloc(0);
  for(;;) {
    if(!read(handle,buffer,buffer.length,count,null)) {
      const code=lastError();if(code!==109)throw Error(`ReadFile: Win32 ${code}`);break;
    }
    const length=count.readUInt32LE();if(!length)break;
    pending=Buffer.concat([pending,buffer.subarray(0,length)]);
    if(stream==='stderr'){if(pending.length>65536)pending=pending.subarray(-65536);continue;}
    let end;
    while((end=pending.indexOf(10))>=0) {
      if(end+1>16384)throw Error('Desktop result frame exceeds 16 KiB');
      parentPort.postMessage({data:decoder.decode(pending.subarray(0,end+1))});pending=pending.subarray(end+1);
    }
    if(pending.length>16384)throw Error('Desktop result frame exceeds 16 KiB');
  }
  if(pending.length)parentPort.postMessage({data:stream==='stdout'?decoder.decode(pending):pending.toString('utf8')});
  if(stream==='stdout') {
    const wait=kernel.func('uint32 __stdcall WaitForSingleObject(uintptr_t, uint32)');
    if(wait(processHandle,0xffffffff)!==0)throw Error(`WaitForSingleObject: Win32 ${lastError()}`);
    const exitCode=Buffer.alloc(4),getExit=kernel.func('int __stdcall GetExitCodeProcess(uintptr_t, void*)');
    if(!getExit(processHandle,exitCode))throw Error(`GetExitCodeProcess: Win32 ${lastError()}`);
    parentPort.postMessage({code:exitCode.readInt32LE()});
  }
} catch(error) {parentPort.postMessage({error:error.message});}
finally {parentPort.close();}
