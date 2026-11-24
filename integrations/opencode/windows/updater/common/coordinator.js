// Fixed native owners decide installation, authorization and process identity.
// Startup keeps or wraps. Running Exit ends Main; the user reopens manually.
export function decideStartup({hostInSelectedAppContainer,authorizationComplete}) {
  return !hostInSelectedAppContainer&&authorizationComplete?'wrap':'keep';
}

export function createUpdater({ports,startup,application="application",prepareUpdates=false}) {
  const clients=new Map(),sessions=new Map(),tasks=new Map(),operations=new Set(),requests=new Set();
  let sequence=0,draining=false,startupReleased=false,finish;
  const closed=new Promise(resolve=>{finish=resolve;});
  const resource=b=>JSON.stringify([b.installationResource??b.installation,b.configurationResource??b.configuration,b.profile]);
  const taskKey=b=>JSON.stringify([resource(b),b.requestedRelease]);
  // One live connection belongs to the current selected target of this updater.
  // A target change obtains that target; HTTP requests do not enter this path.
  let shell;
  async function obtainTargetShell(binding) {
    const target=resource(binding);
    if(shell?.target===target)return shell.connection;
    const connection=await ports.backend?.(binding);
    if(connection)shell={target,connection};
    return connection;
  }
  const failure=error=>error.result??{phase:error.authority==='uac_cancelled'?'cancelled':'failed',error:error.message};
  const active=s=>s?.authorization_in_progress===true;
  // A live replacement owns shared work. Its terminal result belongs to the
  // verified Host binding that submitted it, not every Host under this Main.
  const attemptFor=value=>{
    const attempt=value.session.attempt;
    return attempt&&(attempt.transition||attempt.binding.pid===value.binding.pid)?attempt:undefined;
  };
  function tracked(binding,operation) {
    const work={binding};operations.add(work);
    work.promise=Promise.resolve().then(operation).finally(()=>operations.delete(work));
    work.promise.catch(()=>{});return work.promise;
  }
  function status(value,authorization) {
    const session=value.session,task=session.task??value.task,attempt=attemptFor(value);
    const observed=session.wrapping?{phase:'restarting'}:attempt?.state??authorization??task?.state;
    const matchingProtected=value.binding.protected&&!task?.update
      &&(task?.target?resource(value.binding)===resource(task.target):authorization!==undefined);
    const state=observed?.phase==='ready'&&matchingProtected?{phase:'protected'}:
      observed?.phase==='protected'&&!value.binding.protected?{phase:'starting'}:observed;
    const result=value.result??state??{phase:session.startupError?'failed':'starting'};
    const error=[result.error,session.startupError,task?.callError].filter(Boolean).join('; ');
    const reminderId=authorization?(authorization.attempt||resource(task?.target??value.binding)):task?.id;
    return {...result,...(error?{error}:{}),
      ...(authorization&&task?.reason?{reason:task.reason}:{}),
      currentProtected:value.binding.protected===true,currentRelease:session.currentRelease,requestedRelease:task?.binding.requestedRelease??value.binding.requestedRelease,
      reminderDismissed:authorization?session.dismissedReminder===reminderId:task?.dismissed===true,reminderId,
      reopenRequired:!draining&&!session.closed&&!attempt&&state?.phase==='ready'};
  }
  async function observedStatus(value) {
    const result=status(value),task=value.session.task??value.task,target=task?.target??value.binding;
    if((task&&!task.authorization)||(result.phase!=='starting'&&!task?.authorization)||value.result||value.session.wrapping||attemptFor(value)
      ||!shell||shell.target!==resource(target))return result;
    if(task?.observeAfter>Date.now())return result;
    try {
      const state=await ports.preparation(target,shell.connection);
      value.authorizationAttempt??=active(state)?state.attempt:undefined;
      const observed=value.authorizationAttempt&&ports.progress
        ?await readTask(target,shell.connection,state,value.authorizationAttempt):state;
      if(!active(observed))delete value.authorizationAttempt;
      return status(value,observed);
    } catch(error) {
      if(error.code==='observation_superseded')delete value.authorizationAttempt;
      throw error;
    }
  }
  function sessionFor(binding) {
    let session=sessions.get(binding.mainKey)??[...sessions.values()].find(current=>current.wrapping);
    if(!session) {
      session={mainKey:binding.mainKey,binding,mainBinding:binding,bindings:new Set(),closed:false,wrapping:false};
      sessions.set(binding.mainKey,session);
    }
    session.binding=binding;
    if(session.attempt&&!session.attempt.transition&&session.attempt.state.phase==='completed')session.attempt=undefined;
    return session;
  }
  async function readTask(binding,connection,state,attempt) {
    const progress=await ports.progress(binding,connection,attempt);
    if(active(progress))return {...state,progress};
    const current=await ports.preparation(binding,connection);
    if(current.attempt!==attempt)throw Object.assign(Error('Authorization observation was superseded'),
      {status:409,code:'observation_superseded'});
    return current;
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
    } finally {session.wrapping=false;}
    await ports.watchMain?.(session.mainBinding);
  }
  function executeStartup(binding,target) {
    const session=sessionFor(binding);
    if(session.wrapping||session.attempt?.transition)return {accepted:true};
    const attempt={binding,state:{phase:'restarting'},transition:true};session.attempt=attempt;
    session.wrapping=true;
    attempt.promise=tracked(binding,async()=>{
      try {await wrapRestart(session,target,()=>{});attempt.state={phase:'completed'};}
      catch(error) {
        attempt.state=failure(error);ports.report?.(error,target,'wrap');
        if(!await ports.mainAlive(startup??binding))stop();
      } finally {attempt.transition=false;}
    });
    return {accepted:true};
  }
  function exit(session) {
    const attempt={binding:session.binding,state:{phase:'exiting'},transition:true};session.attempt=attempt;
    attempt.promise=tracked(session.binding,async()=>{
      try {await ports.exit(session.binding);stop();}
      catch(error){attempt.state=failure(error);ports.report?.(error,session.binding,'exit');}
      finally{attempt.transition=false;}
    });
    return {accepted:true};
  }
  async function assess(task,session,value) {
    try {
      const b=task.binding,release=b.requestedRelease;
      if(!/^\d+\.\d+\.\d+$/.test(release))throw Error('A requested stable native release is required');
      task.target=await ports.select(b,release);
      const current=await ports.installation(b);
      session.currentRelease=current?.version;
      const readOnly=b.manageInstallation===false||b.settings?.manageInstallation===false;
      if(readOnly&&task.installOnly)throw Error('The selected FinSAFE installation is read-only to this plugin');
      task.update=!readOnly&&Boolean(current&&current.version!==release);
      const alreadyProtected=b.protected&&(readOnly||current?.version===release)&&resource(task.target)===resource(b);
      if(alreadyProtected&&!task.installOnly) {
        task.state={phase:'protected'};return;
      }
      const installed=readOnly?current:await ports.installation(task.target);
      let needsSetup=!readOnly&&(!installed||installed.version!==release),backendObtained=false,connection;
      if(!needsSetup&&!task.installOnly) {
        try{connection=await obtainTargetShell(task.target);backendObtained=true;}
        catch(error){
          if(readOnly||error.code!=='ENOENT'||error.path!==task.target.settings?.executable)throw error;
          needsSetup=true;
        }
      }
      if(needsSetup) {
        task.state={phase:'downloading'};
        task.download=new AbortController();
        task.staged=await ports.stage(task.target,release,task.download.signal);task.download=undefined;
        if(draining||session.closed||!await ports.mainAlive(b))return;
        task.state={phase:'installing'};
        const setup=await ports.install(task.target,release,task.staged);
        if(setup.phase!=='completed'){task.state=setup;return;}
        // Setup can create previously absent directories. Publish their actual
        // native identities before a re-enabled client joins this ongoing task.
        Object.assign(task.target,await ports.select(b,release));
        await ports.selected?.(b,task.target);
      }
      if(draining||session.closed||!await ports.mainAlive(b))return;
      if(task.installOnly&&!prepareUpdates) {
        if(!needsSetup)await ports.selected?.(b,task.target);
        task.state={phase:'ready',reason:'update',authorizationPending:true};return;
      }
      if(!backendObtained)connection=await obtainTargetShell(task.target);
      task.reason=task.update?'update':needsSetup?'install':'authorization';
      task.state={phase:'authorizing',reason:task.reason};
      // Native acknowledgment establishes that this request has started. Until
      // then, Shell can still expose the previous task or an absent Effective.
      const submission=readOnly?undefined:await ports.prepare(task.target,connection);
      task.authorization=true;
      // Wait three seconds after ACK to improve status-query accuracy while
      // Shell's cached observations settle. Native execution continues now.
      if(!readOnly)task.observeAfter=Date.now()+3000;
      if(!readOnly) {
        const completion=submission?.completion?await submission.completion:submission;
        if(Number.isInteger(completion?.exit_code)&&completion.exit_code!==0)
          throw Error(completion.error||`Desktop authorization command exited (${completion.exit_code})`);
      }
    } catch(error){
      if(task.authorization)task.callError=error.message;else task.state=failure(error);
      ports.report?.(error,task.target??session.binding,'prepare');
    }
    finally{task.done=true;tasks.delete(taskKey(task.binding));}
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
  async function beginAssessment(value,installOnly=false) {
    const {binding,session}=value;
    const attempt=attemptFor(value);
    if((value.task&&!value.task.done)||session.wrapping||attempt?.transition)return {accepted:true};
    session.startupError=undefined;session.attempt=undefined;
    let task=tasks.get(taskKey(binding))??[...tasks.values()].find(t=>!t.done&&t.target
      &&t.binding.requestedRelease===binding.requestedRelease&&resource(t.target)===resource(binding));
    if(!task||task.done) {
      const ownInstall=binding.installationResource??binding.installation;
      const ownConfig=binding.configurationResource??binding.configuration;
      if([...tasks.values()].some(t=>!t.done&&((t.binding.installationResource??t.binding.installation)===ownInstall
        ||(t.binding.configurationResource??t.binding.configuration)===ownConfig)&&resource(t.binding)!==resource(binding)))
        throw Error('Selected installation/configuration conflict with active native work');
      task={id:String(++sequence),binding,installOnly,state:{phase:'starting'},done:false};
      tasks.set(taskKey(binding),task);
      task.promise=tracked(binding,()=>assess(task,session,value));
    }
    value.task=task;session.task=task;return {accepted:true};
  }
  return {
    closed,
    async admit(binding) {
      if(sessions.size&&!sessions.has(binding.mainKey)&&![...sessions.values()].some(session=>session.wrapping))
        throw Error(`Updater already owns another ${application} Main`);
      const session=sessionFor(binding);
      if(session.wrapping||session.attempt?.transition)return {period:'keep'};
      session.startupError=undefined;
      let target,authorizationComplete=false;
      try {
        if(!binding.protected) {
          target=await ports.select(binding,binding.requestedRelease,{startup:true});
          if(ports.startupReady) {
            const connection=await obtainTargetShell(target);
            authorizationComplete=await ports.startupReady(target,connection);
          } else {
            const connection=await obtainTargetShell(target);
            const state=await ports.preparation(target,connection);
            authorizationComplete=state?.prepared===true&&!active(state);
          }
        }
      } catch(error) {
        if(error.cancelled===true)return {period:'keep',cancelled:true};
        if(error.code!=='ENOENT'||error.path!==target?.settings?.executable) {
          session.startupError=error.message;
          ports.report?.(error,target??binding,'startup_readiness');
        }
      }
      const period=decideStartup({hostInSelectedAppContainer:binding.protected===true,authorizationComplete});
      return {period,...(period==='wrap'?{target}:{}),...(session.startupError?{error:session.startupError}:{})};
    },
    executeStartup,
    async bind(peer) {
      const binding=await ports.bind(peer),id=String(++sequence);
      const session=sessionFor(binding);
      session.bindings.add(binding);session.binding=binding;
      clients.set(id,{binding,session,released:false});return id;
    },
    request(id,operation,fields={}) {
      const request=(async()=>{
        if(Object.keys(fields).some(key=>operation!=='install'||key!=='release'))throw Error('Unknown operation fields');
        if(!['status','ensure','install','exit','later','restore','release','uninstall'].includes(operation))throw Error('Unknown operation');
        const value=clients.get(id);
        if(!value||value.released)throw Error('Unknown client binding');
        const {binding,session}=value;
        if(operation==='status')return observedStatus(value);
        if(operation==='exit')return exit(session);
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
        if(!await ports.alive(binding))throw Error(`Bound ${application} process departed`);
        if(operation==='ensure') {
          value.ensureIntent=true;
          return beginAssessment(value);
        }
        if(operation==='install')return beginAssessment({...value,task:undefined,
          binding:{...binding,requestedRelease:fields.release}},true);
        if(operation==='later') {
          const task=session.task??value.task;
          const observed=await observedStatus(value);
          if(observed.phase!=='ready')throw Error('No current reopen reminder');
          session.dismissedReminder=observed.reminderId;
          if(task)task.dismissed=true;return {dismissed:true};
        }
        if(operation==='uninstall') {
          if(binding.protected)throw Error('Native uninstall requires an ordinary session');
          if([...operations].some(work=>resource(work.binding)===resource(binding)))throw Error('Native operation conflict');
          try {await ports.restore(binding);}
          catch(error){ports.report?.(error,binding,'uninstall_cleanup');}
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
      const replacingMain=session=>session.wrapping&&!ports.retainsMainDuringWrap;
      if(!current.length){if(startup&&!await ports.mainAlive(startup)){stop();return true;}return false;}
      for(const session of current) {
        if(replacingMain(session))continue;
        if(!await ports.mainAlive(session.mainBinding))session.closed=true;
      }
      if(current.every(session=>session.closed||replacingMain(session))) {
        if(current.every(replacingMain))return false;
        stop();return true;
      }
      return false;
    },
    stop,drain,
  };
}
