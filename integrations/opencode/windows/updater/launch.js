// AppSeam replaces only Host. OpenCode reconnects its existing Main natively.
export async function launchHost(binding,{replace,confirm,record=()=>{},listen,onStopped=()=>{},observeReplacement=()=>{}}) {
  if(listen)await listen();
  const oldHostPid=binding.pid,result=await replace();
  if(result.main_pid!==binding.main||result.mainKey!==binding.mainKey)
    throw Error('OpenCode Main identity changed during Host handoff');
  onStopped(false); // Old Host exited; Main was retained.
  record('ac-host-ready',{oldMainPid:binding.main,oldHostPid,
    mainPid:result.main_pid,mainKey:result.mainKey,newHostPid:result.host_pid,corePid:result.core_pid});
  await confirm(result);
  binding.pid=result.host_pid;binding.protected=true;
  observeReplacement(result.mainKey);
  record('main-host-connected',{mainKey:result.mainKey,hostPid:result.host_pid});
  return result;
}

// Transient acknowledgment owned by one handoff, including a rebind that races
// the CLI readiness response. Native bind has verified every observed peer.
export function createConnectionConfirmation({timeout=45000}={}){
  const attempts=new Map();
  return {
    begin(mainKey){
      if(attempts.has(mainKey))throw Error('OpenCode Host handoff is already active');
      let resolve,reject,timer,expected;
      const completion=new Promise((yes,no)=>{resolve=yes;reject=no;}),seen=new Set();
      const attempt={seen,observe(pid){seen.add(pid);if(pid===expected)resolve();}};
      attempts.set(mainKey,attempt);
      return {async wait(result){
        expected=result.host_pid;
        if(seen.has(expected))return;
        timer=setTimeout(()=>reject(Error('OpenCode Main did not confirm its business connection to the protected Host')),timeout);
        try{await completion;}finally{clearTimeout(timer);}
      },dispose(){clearTimeout(timer);attempts.delete(mainKey);}};
    },
    observe(binding){
      if(binding.protected&&binding.context?.connectedHostPid===binding.pid)
        attempts.get(binding.mainKey)?.observe(binding.pid);
    },
  };
}
