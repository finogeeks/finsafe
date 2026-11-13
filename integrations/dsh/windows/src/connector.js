import { execFile, spawn } from 'node:child_process';
import {StringDecoder} from 'node:string_decoder';
import {EventEmitter} from 'node:events';

// The fixed native adapter starts the selected Desktop CLI outside the updater
// Job. Reuse the same acknowledgment/terminal parser for both process transports.
export function nativeDesktopChild({start,read}) {
  const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();
  queueMicrotask(async()=>{
    try {
      const owner=await start();
      for(;;) {
        const result=await read(owner.owner);
        if(result.stdout)child.stdout.emit('data',result.stdout);
        if(result.stderr)child.stderr.emit('data',result.stderr);
        if(result.eof){child.emit('close',result.code,null);return;}
      }
    }catch(error){child.emit('error',error);}
  });
  return child;
}

/** Resolve the flushed Desktop acknowledgment while retaining its finite native owner. */
export function submitDesktopAuthorization(executable,args,{spawnChild=spawn,env}={}) {
  return new Promise((resolve,reject)=>{
    const child=spawnChild(executable,args,{env,windowsHide:true,stdio:['ignore','pipe','pipe']});
    const decoder=new StringDecoder('utf8');
    let buffer='',diagnostics='',ack,terminal,resolveCompletion,rejectCompletion,transportError;
    const completion=new Promise((yes,no)=>{resolveCompletion=yes;rejectCompletion=no;});
    // The owner is retained even when its consumer disappears. Its error remains
    // observable through completion without becoming an unhandled rejection.
    completion.catch(()=>{});
    child.stderr.on('data',bytes=>{diagnostics=(diagnostics+bytes).slice(-65536);});
    child.stdout.on('data',bytes=>{
      if(transportError)return;
      buffer+=Buffer.isBuffer(bytes)?decoder.write(bytes):bytes;
      try {
        let end;
        while((end=buffer.indexOf('\n'))>=0) {
          if(Buffer.byteLength(buffer.slice(0,end))>16384)throw Error('Desktop result frame exceeds 16 KiB');
          const frame=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);
          if(!frame.value||typeof frame.value!=='object')throw Error('Invalid Desktop result');
          if(frame.record==='ack'&&!ack&&!terminal) {
            ack=frame.value;
            if(ack.error)throw Error(ack.error);
            resolve({...ack,completion});
          } else if(frame.record==='terminal'&&ack&&!terminal)terminal=frame.value;
          else throw Error('Unexpected Desktop result frame');
        }
        if(Buffer.byteLength(buffer)>16384)throw Error('Desktop result frame exceeds 16 KiB');
      } catch(error) {transportError=error;if(!ack)reject(error);}
    });
    child.on('error',error=>{transportError=error;reject(error);rejectCompletion(error);});
    child.on('close',(code,signal)=>{
      buffer+=decoder.end();
      const error=transportError??(buffer.length?Error('Desktop result ended with a truncated frame'):
        signal||!Number.isInteger(code)?Error(`Desktop task ended by ${signal??'unknown exit'}`):
        terminal&&Number.isInteger(terminal.exit_code)&&terminal.exit_code!==code?Error(`Desktop task exit ${code} differs from terminal ${terminal.exit_code}`):
        !ack?Error(`Desktop acknowledgment missing (${code}): ${diagnostics}`):
        ack.accepted&&!terminal?Error(`Desktop task exited without terminal result (${code}): ${diagnostics}`):
        code&&!terminal?Error(`Desktop task exited (${code}): ${diagnostics}`):undefined);
      if(error){reject(error);rejectCompletion(error);return;}
      resolveCompletion(terminal??ack);
    });
  });
}


/** Invoke an installed executable directly. No shell or model-supplied arguments. */
export function runFinSafe(executable, args, { signal, timeoutMs = 30000, env, readOnlyResult=false } = {}) {
  return new Promise((resolve, reject) => {
    execFile(executable, args, { signal, env, timeout: timeoutMs, windowsHide: true, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      let result;
      try {
        result = JSON.parse(stdout);
        if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('Invalid JSON result');
      } catch {
        reject(error ?? new Error(`FinSAFE returned invalid JSON: ${stderr.trim() || stdout.trim()}`));
        return;
      }
      if (error || (!readOnlyResult && typeof result.exit_code === 'number' && result.exit_code !== 0)) {
        const failure=new Error(result.detail || result.error || stderr.trim() || error?.message || `FinSAFE failed: ${result.exit_code}`);
        failure.authority=result.authority;
        failure.result=result;
        reject(failure);
        return;
      }
      resolve(result);
    });
  });
}
