import {spawn} from 'node:child_process';
import {nativeDesktopChild} from '../src/connector.js';

// Reuse the DLL's piped breakaway child transport. Its control handle is
// independent of the reader, so timeout cleanup can stop a blocked launcher.
export function nativeLauncher({start,read,stop,release}) {
  let owner,stopping,finishing,closed=false;
  const child=nativeDesktopChild({start:async()=>{
    owner=await start();child.pid=owner.pid;return owner;
  },read});
  child.exitCode=null;
  child.kill=()=>{if(owner&&!closed)stopping??=stop(owner.control);return stopping;};
  child.unref=()=>{};
  child.stdout.destroy=child.stderr.destroy=()=>{};
  const finish=()=>finishing??=(async()=>{closed=true;try{await stopping;}finally{if(owner)await release(owner.control);}})();
  child.once('close',code=>{child.exitCode=code;child.emit('exit',code);void finish().catch(error=>child.emit('error',error));});
  child.once('error',()=>{child.kill();void finish().catch(error=>child.emit('error',error));});
  return child;
}

// Wrap: stop this DSH, listen on the work pipe, launch through FinSAFE, retain
// the new Main. Do not wait for Host bind, a Host scan, or replacement_status.
export async function launchWrap(binding,{invoke,spawnChild=spawn,
  wait=()=>new Promise(done=>setTimeout(done,100)),deadlineMs=75000,listen=async()=>{},observeReplacement=()=>{},onStopped=()=>{}}={}) {
  let operation='stop_main',child;
  try {
    await invoke('stop_main');
    onStopped();
    operation='disable_hmr';await invoke('disable_hmr');
    operation='listen_work_pipe';await listen();
    const env={...process.env,DSH_HOME:binding.home};delete env.ELECTRON_RUN_AS_NODE;
    operation='launch_protected';
    child=spawnChild(binding.settings.executable,
      ['app','launch','dsh-desktop','--yaml-path',binding.settings.yamlPath,'--replace-existing-components','--',binding.desktop],
      {env,windowsHide:true,stdio:['ignore','pipe','pipe']});
    let failure,output='',errors='',startup;
    child.on('error',error=>{error.operation='launch_protected';failure=error;});
    child.on('exit',code=>{failure=Error(`DSH launcher exited (${code}): ${errors}`);});
    child.stderr.on('data',bytes=>{errors=(errors+bytes).slice(-65536);});
    child.stdout.on('data',bytes=>{
      if(startup||failure) return;
      output+=bytes;
      if(output.length>16384) {failure=Error('Invalid DSH startup response');return;}
      const end=output.indexOf('\n');
      if(end>=0) {try {startup=JSON.parse(output.slice(0,end));}catch{failure=Error('Invalid DSH startup response');}}
    });
    operation='read_startup';
    const deadline=Date.now()+deadlineMs;
    while(!startup) {
      if(failure) throw failure;
      if(Date.now()>=deadline) throw Error('DSH startup observation timed out');
      await wait();
    }
    if(startup.hook_ready!==true||!Number.isSafeInteger(startup.main_pid)) throw Error('DSH startup was not accepted');
    operation='retain_replacement';
    const retained=await invoke('retain_replacement',{launcher:child.pid,main:startup.main_pid});
    observeReplacement(retained.mainKey);
    child.unref();
    return retained;
  } catch(error) {
    error.operation??=operation;
    if(child) {
      try {if(child.pid&&child.exitCode===null)await child.kill();}
      catch(cleanup){error.cleanupError=cleanup;}
      child.stdout.destroy();child.stderr.destroy();
    }
    throw error;
  }
}
