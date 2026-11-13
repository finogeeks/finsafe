// DSH lifetime and UI observation only. All native tasks belong to the updater.
export function registerSettingsRestoration(ctx,restore,report) {
  ctx.on('plugin-manager/operation',async operation=>{
    if(operation.phase!=='settled'||!['applied','restart-required'].includes(operation.application))return;
    const ownBundle=operation.target==='@finogeeks2026/finshield';
    const disabled=operation.enabled===false&&(
      operation.reason==='bundle'&&ownBundle||operation.reason==='plugin'&&operation.target===ctx.fiber.entry?.id);
    if(!disabled&&!(operation.reason==='remove'&&ownBundle))return;
    try {await restore();}
    catch(error){report(Error(`FinShield settings restoration failed: ${error.message}`));}
  });
}

export function createActivation({observe,obtain,existing,report=()=>{}}) {
  let bindFailed=false;
  let active=true,state={phase:'starting'},connection,client,binding,currentProtected=false;
  const failure=error=>{if(active){state={phase:'failed',currentProtected,error:error.message};report(error);}};
  const bind=value=>{
    connection=value;
    binding=(async()=>{
      client=(await connection.request('bind',{context:connection.context})).client;
      return connection;
    })();
    return binding;
  };
  async function run() {
    if(!active||!connection) return;
    // This runs in the next turn, after the plugin's apply has completed.
    if(connection.period==='keep')await connection.request('keep',{context:connection.context});
    if(!active)return;
    try {await bind(connection);}catch(error){bindFailed=true;throw error;}
    if(!active) return;
    await connection.request('ensure',{client});
  }
  return {
    start() {
      const startup=(async()=>{
        if(!active) return;
        const token=observe();
        currentProtected=token.appContainer===true;
        const selected=await (currentProtected?existing():obtain());
        if(!active) return;
        connection=selected;
        if(!currentProtected&&!connection.admitted&&!connection.runningPeriod)
          {const decision=await connection.request('admit',{context:connection.context});connection.period=decision.period;connection.startupError=decision.error;}
        // A timely admission response releases startup cleanup ownership. Only
        // this old plugin apply remains unfinished while updater performs wrap.
        if(connection.startupError){state={phase:'starting',error:connection.startupError};report(Error(connection.startupError));}
        if(connection.period==='wrap')await new Promise(()=>{});
      })().catch(failure);
      startup.then(()=>{setImmediate(()=>void run().catch(failure));},failure);
      return startup;
    },
    async status() {
      if(!connection||!client||state.phase==='failed') return {...state,currentProtected};
      try {const observed=await connection.request('status',{client});return state.phase==='failed'?state:{...observed,currentProtected};}
      catch(error){failure(error);return state;}
    },
    async restart() {
      if(!active||!connection||!client) throw Error('Updater client is unavailable');
      try {
        const result=await connection.request('restart',{client});
        return result;
      } catch(error){failure(error);throw error;}
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
