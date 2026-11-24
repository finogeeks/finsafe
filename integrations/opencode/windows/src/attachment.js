// One activation per verified desktop. The native adapter verifies the PID.
export function createDesktopAttachment({activate,observe,report=()=>{}}){
  let current,closed=false;
  return {
    attach(mainPid,activation=String(mainPid),desktop,connectedHostPid,startup=false){
      if(closed)throw Error('FinShield plugin is unloading');
      if(current?.activation===activation&&current.mainPid===mainPid
        &&current.connectedHostPid===connectedHostPid)return {accepted:true};
      const previous=current;
      const next={mainPid,activation,connectedHostPid};current=next;
      next.host=(async()=>{
        if(previous)await previous.host.then(host=>host.dispose(),()=>{}).catch(report);
        return activate(mainPid,desktop,connectedHostPid,{startup,prepare:startup});
      })();
      next.host.then(host=>{next.value=host;},error=>{next.error=error;report(error);});
      return {accepted:true};
    },
    async status(){
      let state;
      try{state=current?.value?await current.value.status():
        current?.error?{error:current.error.message}:{phase:'starting'};}
      catch(error){state={error:error.message};}
      if(!observe)return state;
      try{
        const token=await observe();
        return {...state,protected:token.protected,currentProtected:token.protected,hostPid:token.pid};
      }catch(error){return {...state,error:[state.error,error.message].filter(Boolean).join('; ')};}
    },
    async install(release){if(!current?.value)throw current?.error??Error('Updater startup is incomplete');return current.value.install(release);},
    async exit(){if(!current?.value)throw current?.error??Error('Updater startup is incomplete');return current.value.exit();},
    async later(){if(!current?.value)throw current?.error??Error('Updater startup is incomplete');return current.value.later();},
    async dispose(){closed=true;if(current)await current.host.then(host=>host.dispose(),()=>{});},
  };
}
