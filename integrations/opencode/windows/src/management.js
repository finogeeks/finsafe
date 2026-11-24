import {Management} from './contract.js';
import {version} from './settings.js';

// One registration owns one attachment. No state crosses plugin setups.
export async function registerManagement(ctx,owner){
  let host,failure;
  const report=error=>console.error('FinShield:',error.message);
  void owner.then(value=>{host=value;},error=>{failure=error;report(error);});
  const perform=method=>{if(!host)throw failure??Error('Updater startup is incomplete');return host[method]();};
  const registration=await ctx.rpc.register(Management,{
    version:async()=>({version}),
    attach:async({mainPid,activation,desktop,connectedHostPid,startup=false})=>(await owner).attach(mainPid,activation,desktop,connectedHostPid,startup),
    status:async()=>({...(host?await host.status():failure?{error:failure.message}:{phase:'starting'}),pluginVersion:version}),
    install:async({release})=>{if(!host)throw failure??Error('Updater startup is incomplete');return host.install(release);},
    exit:async()=>perform('exit'),later:async()=>perform('later')});
  return async()=>{await registration.dispose();void owner.then(value=>value.dispose(),()=>{}).catch(report);};
}
