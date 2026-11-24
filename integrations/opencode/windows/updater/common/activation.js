export function createActivation({observe,obtain,existing,running=false,prepare=true,report=()=>{},propagateRequestErrors=false}) {
  running=running===true;
  let bindFailed=false;
  let active=true,state={phase:'starting'},connection,client,binding,currentProtected;
  const failure=error=>{if(active){state={...(propagateRequestErrors?{}:{phase:'failed'}),currentProtected,error:error.message};report(error);}};
  const bind=value=>{
    connection=value;
    binding=(async()=>{
      client=(await connection.request('bind',{context:connection.context})).client;
      return connection;
    })();
    return binding;
  };
  async function run() {
    if(!active||!connection||bindFailed||state.phase==='cancelled') return;
    try {if(binding)await binding;else await bind(connection);}catch(error){bindFailed=true;throw error;}
    if(!active) return;
    if(prepare&&connection.period!=='wrap')await connection.request('ensure',{client});
  }
  return {
    start() {
      const startup=(async()=>{
        if(!active) return;
        const token=observe();
        currentProtected=token.appContainer===true;
        const selected=await (currentProtected?existing():obtain({startup:!running}));
        if(!active) return;
        connection=selected;
        // Observation binds independently of a pending startup read. Binding
        // does not submit preparation or execute another startup decision.
        setImmediate(()=>{if(active&&!binding&&state.phase!=='cancelled')void bind(connection).catch(error=>{bindFailed=true;failure(error);});});
        if(!running&&!currentProtected&&!connection.admitted)
          {const decision=await connection.request('admit',{context:connection.context},
            connection.startupDeadline===undefined?{}:{deadline:connection.startupDeadline});
            connection.period=decision.period;connection.startupError=decision.error;connection.cancelled=decision.cancelled;}
        if(connection.cancelled===true){state={phase:'cancelled'};return;}
        if(connection.startupError){state={phase:'starting',error:connection.startupError};report(Error(connection.startupError));}
        return {period:connection.period??'keep',...(connection.startupError?{error:connection.startupError}:{})};
      })().catch(failure);
      startup.then(()=>{setImmediate(()=>void run().catch(failure));},failure);
      return startup;
    },
    async status() {
      if(!connection||!client||['failed','cancelled'].includes(state.phase)) return {...state,currentProtected};
      try {const observed=await connection.request('status',{client});return state.phase==='failed'?state:
        {...observed,currentProtected};}
      catch(error){report(error);if(propagateRequestErrors)throw error;return {currentProtected,error:error.message};}
    },
    async install(release) {
      if(binding)await binding;
      if(!active||!connection||!client)throw Error('Updater client is unavailable');
      return connection.request('install',{client,release});
    },
    async exit() {
      if(!active||!connection||!client) throw Error('Updater client is unavailable');
      try {
        const result=await connection.request('exit',{client});
        return result;
      } catch(error){if(propagateRequestErrors)report(error);else failure(error);throw error;}
    },
    async later() {
      if(!active||!connection||!client)throw Error('Updater client is unavailable');
      return connection.request('later',{client});
    },
    async restore() {
      if(binding)await binding;
      if(!connection||!client)throw Error('Updater client is unavailable');
      return connection.request('restore',{client});
    },
    async dispose() {
      active=false;
      try {
        if(bindFailed)return;
        if(binding) await binding;
        else if(connection) await bind(connection);
        else await bind(await existing());
        if(client) await connection.request('release',{client});
      } catch(error) {report(Error(`FinShield cleanup failed; the sandbox override may remain: ${error.message}`));throw error;}
    },
  };
}
