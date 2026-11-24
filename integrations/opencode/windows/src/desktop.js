import {Management} from './contract.js';
import {DesktopAttachment} from './desktop-contract.js';

// OpenCode calls main for each desktop activation, including a reused service.
export function attachDesktop(ctx,mainPid=process.pid,activation=globalThis.crypto.randomUUID()){
  const attach=async startup=>{
    const client=ctx.client;
    const host=await client.server.info({signal:ctx.signal});
    await client.rpc(Management).attach({mainPid,desktop:process.execPath,activation,connectedHostPid:host.pid,startup},{signal:ctx.signal});
  };
  const initial=attach(true);
  ctx.provide(DesktopAttachment,{attach:()=>initial.catch(()=>{}).then(()=>attach(false))});
  void initial
    .catch(error=>{if(!ctx.signal.aborted)ctx.log.write('error','FinShield desktop attachment failed',{error:String(error.message??error)});});
}

// The native sidecar reference is reactive; do not poll or call private IPC.
export function createEndpointAttachment({attach,report}){
  let previous;
  return server=>{
    if(!server?.connected||!server.url||server.url===previous)return;
    previous=server.url;
    void Promise.resolve().then(attach).catch(report);
  };
}
