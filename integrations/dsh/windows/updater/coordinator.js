// Fixed native owners decide installation, authorization and process identity.
// Startup keeps or wraps. Running Restart replaces Main through the same updater.
export function createUpdater({ports,startup}) {
  const clients=new Map(),sessions=new Map(),tasks=new Map(),operations=new Set(),requests=new Set();
  let sequence=0,draining=false,startupReleased=false,mainRetained=false,finish;
  const closed=new Promise(resolve=>{finish=resolve;});
  const wait=ports.wait??(()=>new Promise(done=>setTimeout(done,2000)));
  const resource=b=>JSON.stringify([b.installationResource??b.installation,b.configurationResource??b.configuration,b.profile]);
  const taskKey=b=>JSON.stringify([resource(b),b.requestedRelease]);
  const failure=error=>error.result??{phase:error.authority==='uac_cancelled'?'cancelled':'failed',error:error.message};
  const pending=s=>s?.phase!=='ready'||(Number.isInteger(s.exit_code)&&s.exit_code!==0);
  const active=s=>s?.authorization_in_progress===true;
  const readyAuth=s=>s?.prepared===true&&!pending(s)&&!active(s);
  function tracked(binding,operation) {
    const work={binding};operations.add(work);
    work.promise=Promise.resolve().then(operation).finally(()=>operations.delete(work));
    work.promise.catch(()=>{});return work.promise;
  }
  function status(value) {
    const session=value.session,task=session.task??value.task;
    const state=task?.satisfied&&value.binding.protected?{phase:'protected'}:session.attempt?.state??task?.state;
    const result=value.result??state??{phase:session.startupError?'failed':'starting'};
    const error=[result.error,session.startupError].filter(Boolean).join('; ');
    return {...result,...(error?{error}:{}),
      currentProtected:value.binding.protected===true,currentRelease:session.currentRelease,requestedRelease:task?.binding.requestedRelease??value.binding.requestedRelease,
      reminderDismissed:task?.dismissed===true,reminderId:task?.id,
      restartPolicy:session.attempt||state?.phase!=='ready'||task?.satisfied?'never':task?.restartPolicy??'confirm'};
  }
  function sessionFor(binding) {
    let session=sessions.get(binding.mainKey)??[...sessions.values()].find(current=>current.wrapping);
    if(!session) {
      session={mainKey:binding.mainKey,binding,mainBinding:binding,bindings:new Set(),items:new Map(),closed:false,wrapping:false};
      sessions.set(binding.mainKey,session);
    }
    session.binding=binding;
    if(session.attempt&&!session.attempt.transition&&session.attempt.state.phase==='completed')session.attempt=undefined;
    return session;
  }
  async function observe(task,binding,initial,{update=false}={}) {
    let state=initial;
    while(active(state)) {
      task.state={...state,phase:update?'waiting-authorization':'authorizing'};
      await wait();
      state=await ports.preparation(binding);
    }
    return state;
  }
  async function wrapRestart(session,target,onStopped) {
    session.wrapping=true;
    try {
      await ports.wrap(target,mainKey=>{
        // retain_replacement updates this target's native Binding. Host rebinds
        // create independent native owners and must not replace lifecycle ownership.
        session.mainBinding=target;
        if(mainKey&&mainKey!==session.mainKey) {
          sessions.delete(session.mainKey);
          session.mainKey=mainKey;sessions.set(mainKey,session);
          for(const value of clients.values())if(value.session===session&&value.binding.mainKey!==mainKey)value.released=true;
        }
      },onStopped);
      mainRetained=true;
    } finally {session.wrapping=false;}
    await ports.watchMain?.(session.mainBinding);
  }
  function restart(session) {
    const task=session.task,target=task?.target;
    const attempt={state:{phase:'restarting'},transition:true};session.attempt=attempt;
    attempt.promise=tracked(session.binding,async()=>{
      let mainStopped=false;
      try {
        await wrapRestart(session,target,()=>{mainStopped=true;});
        session.currentRelease=target.requestedRelease;
        if(task){task.satisfied=true;task.restartPolicy='never';}
        attempt.state={phase:'completed'};
      } catch(error){
        attempt.state=failure(error);ports.report?.(error,target,'restart');
        if(mainStopped)stop();
      }
      finally{attempt.transition=false;}
    });
    return {accepted:true};
  }
  async function assess(task,session,value) {
    try {
      const b=session.binding,release=b.requestedRelease;
      if(!/^\d+\.\d+\.\d+$/.test(release))throw Error('A requested stable native release is required');
      task.target=await ports.select(b,release);
      const current=await ports.installation(b);
      session.currentRelease=current?.version;
      task.update=Boolean(current&&current.version!==release);
      const alreadyProtected=b.protected&&current?.version===release&&resource(task.target)===resource(b);
      if(alreadyProtected) {
        task.state={phase:'protected'};task.satisfied=true;task.restartPolicy='never';return;
      }
      const installed=await ports.installation(task.target);
      const needsSetup=!installed||installed.version!==release;
      if(needsSetup) {
        task.state={phase:'downloading'};
        task.download=new AbortController();
        task.staged=await ports.stage(task.target,release,task.download.signal);task.download=undefined;
        if(draining||session.closed||!await ports.mainAlive(b))return;
        // Observe existing authorization before a conflicting native mutation.
        if(task.update)await observe(task,b,await ports.preparation(b),{update:true});
        if(draining||session.closed||!await ports.mainAlive(b))return;
        task.state={phase:'installing'};
        const setup=await ports.install(task.target,release,task.staged);
        if(setup.phase!=='completed'){task.state=setup;return;}
        await ports.selected?.(b,task.target);
      }
      if(draining||session.closed||!await ports.mainAlive(b))return;
      const acknowledgment=await ports.prepare(task.target);
      if(acknowledgment.completion) {
        task.owner=tracked(task.target,()=>acknowledgment.completion);
      }
      if(task.previous&&!pending(acknowledgment)&&acknowledgment.accepted!==true) {
        task.id=task.previous.id;task.dismissed=task.previous.dismissed;
      }
      task.state=pending(acknowledgment)?{...acknowledgment}:{phase:'starting',progress:acknowledgment.progress};delete task.state.completion;
      let state=acknowledgment;
      if(active(state)) {
        if(acknowledgment.accepted&&task.owner) {
          let terminal,terminalError;
          task.owner.then(result=>{terminal=result;},error=>{terminalError=error;});
          while(active(state)&&!terminal&&!terminalError) {
            await Promise.race([wait(), task.owner]);
            if(terminal||terminalError)break;
            state=await ports.preparation(task.target);
            if(!active(state))break;
            task.state=pending(state)?state:{phase:'authorizing',progress:state.progress};
          }
          if(terminalError)throw terminalError;
          if(terminal)state=terminal;
        } else state=await observe(task,task.target,state);
      }
      if(task.owner)await task.owner;
      if(draining||session.closed){task.state=state;return;}
      if(!readyAuth(state)){task.state=state;return;}
      const selected=await ports.installation(task.target);
      if(selected?.version!==release)throw Error('Selected target installation is unavailable at the requested release');
      task.restartPolicy='confirm';
      task.state={...state,phase:'ready',reason:task.update?'update':needsSetup?'install':'authorization'};
    } catch(error){task.state=failure(error);ports.report?.(error,task.target??session.binding,'prepare');}
    finally{task.done=true;}
  }
  function stop() {
    draining=true;
    for(const session of new Set(sessions.values()))session.closed=true;
    for(const task of tasks.values())task.download?.abort();
    finish();
  }
  async function drain() {
    stop();
    for(;;) {
      const work=[...requests,...operations].map(item=>item.promise??item);
      if(!work.length)break;
      await Promise.allSettled(work);
    }
    for(const session of new Set(sessions.values()))for(const binding of session.bindings) {
      await ports.detach(binding);
    }
    if(startup&&!startupReleased){startupReleased=true;await ports.detach(startup);}
  }
  async function beginAssessment(value) {
    const {binding,session}=value;
    if(value.task||session.attempt)return {accepted:true};
    const key=taskKey(binding),retained=session.items.get(key);
    if(retained){value.task=retained;session.task=retained;return {accepted:true};}
    let task=tasks.get(taskKey(binding));
    if(!task||task.done) {
      const ownInstall=binding.installationResource??binding.installation;
      const ownConfig=binding.configurationResource??binding.configuration;
      if([...tasks.values()].some(t=>!t.done&&((t.binding.installationResource??t.binding.installation)===ownInstall
        ||(t.binding.configurationResource??t.binding.configuration)===ownConfig)&&resource(t.binding)!==resource(binding)))
        throw Error('Selected installation/configuration conflict with active native work');
      const previous=session.task?.done&&session.task.state.phase==='ready'
        &&session.task.binding.requestedRelease===binding.requestedRelease?session.task:undefined;
      task={id:String(++sequence),previous,binding,state:{phase:'starting'},restartPolicy:'never',done:false};
      tasks.set(taskKey(binding),task);
      task.promise=tracked(binding,()=>assess(task,session,value));
    }
    value.task=task;session.task=task;session.items.set(key,task);return {accepted:true};
  }
  return {
    closed,
    running:()=>mainRetained||[...sessions.values()].some(session=>session.keep),
    async admit(binding) {
      if(mainRetained) {
        if(!sessions.has(binding.mainKey))throw Error('Updater already owns another DSH Main');
        return {period:'running'};
      }
      const session=sessionFor(binding);
      if(session.keep)return {period:'running'};
      if(!/^\d+\.\d+\.\d+$/.test(binding.requestedRelease))throw Error('A requested stable native release is required');
      let target,shouldWrap=false;
      try {
        if(!binding.protected) {
          target=await ports.select(binding,binding.requestedRelease);
          const installed=await ports.installation(target);
          shouldWrap=installed?.version===binding.requestedRelease&&readyAuth(await ports.preparation(target));
        }
      } catch(error) {
        session.startupError=error.message;
        ports.report?.(error,target??binding,'startup_readiness');
      }
      if(shouldWrap) {
        let decision,rejectAdmission;
        const admission=new Promise((resolve,reject)=>{decision=resolve;rejectAdmission=reject;});
        void tracked(binding,async()=>{
          try {await wrapRestart(session,target,()=>decision({period:'wrap'}));}
          catch(error) {
            ports.report?.(error,target,'wrap');
            session.wrapping=false;
            if(await ports.mainAlive(startup??binding)) {
              session.keep=true;session.startupError=error.message;
              decision({period:'keep',error:error.message});
            } else {decision({period:'wrap'});stop();}
          }
        }).catch(rejectAdmission);
        return admission;
      }
      session.keep=true;
      return {period:'keep',...(session.startupError?{error:session.startupError}:{})};
    },
    async keep(binding) {
      const session=sessions.get(binding.mainKey);
      if(!session?.keep||binding.protected)throw Error('No ordinary Keep decision for this Main');
      return {kept:true};
    },
    async bind(peer) {
      const binding=await ports.bind(peer),id=String(++sequence);
      const session=sessionFor(binding);
      session.bindings.add(binding);session.binding=binding;
      clients.set(id,{binding,session,released:false});return id;
    },
    request(id,operation,fields={}) {
      const request=(async()=>{
        if(Object.keys(fields).length)throw Error('Unknown operation fields');
        if(!['status','ensure','restart','later','restore','release','uninstall'].includes(operation))throw Error('Unknown operation');
        const value=clients.get(id);
        if(!value||value.released)throw Error('Unknown client binding');
        const {binding,session}=value;
        if(operation==='status')return status(value);
        if(operation==='restart')return restart(session);
        if(operation==='restore'||operation==='release') {
          if(operation==='release')value.released=true;
          const pendingWork=[session.attempt?.transition&&session.attempt.promise,
            session.task&&!session.task.done&&session.task.promise].filter(Boolean);
          if(pendingWork.length&&operation==='release') {
            void tracked(binding,async()=>{await Promise.allSettled(pendingWork);await ports.restore(binding);}).catch(error=>ports.report?.(error));
            return {released:true,cleanupPending:true};
          }
          await tracked(binding,async()=>{await Promise.allSettled(pendingWork);await ports.restore(binding);});
          return operation==='release'?{released:true}:{restored:true};
        }
        if(draining||session.closed)throw Error('Updater is draining');
        if(!await ports.alive(binding))throw Error('Bound DSH process departed');
        if(operation==='ensure') {
          value.ensureIntent=true;
          return beginAssessment(value);
        }
        if(operation==='later') {
          const task=session.task??value.task;
          if(!task||status(value).phase!=='ready')throw Error('No current restart reminder');
          task.dismissed=true;return {dismissed:true};
        }
        if(operation==='uninstall') {
          if(binding.protected)throw Error('Native uninstall requires an ordinary session');
          if([...operations].some(work=>resource(work.binding)===resource(binding)))throw Error('Native operation conflict');
          await ports.restore(binding);
          void tracked(binding,async()=>{try{const result=await ports.uninstall(binding);
            value.result={phase:result?.code?'failed':'completed',nativeUninstall:result};}
            catch(error){value.result=failure(error);}});
          return {accepted:true};
        }
      })();
      if(operation==='status')return request;
      requests.add(request);return request.finally(()=>requests.delete(request));
    },
    async observeMainExits() {
      if(draining)return true;
      const current=[...new Set(sessions.values())];
      if(!current.length){if(startup&&!await ports.mainAlive(startup)){stop();return true;}return false;}
      for(const session of current) {
        if(session.wrapping)continue;
        if(!await ports.mainAlive(session.mainBinding))session.closed=true;
      }
      if(current.every(session=>session.closed||session.wrapping)) {
        if(current.every(session=>session.wrapping))return false;
        stop();return true;
      }
      return false;
    },
    stop,drain,
  };
}
