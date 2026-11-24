import {readFileSync} from 'node:fs';

const packageName='@finogeeks2026/finshield-dsh';
const currentVersion=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
const attemptKey=Symbol.for('@finogeeks2026/finshield-dsh.self-update');
const updateState=entry=>entry[attemptKey]??={busy:false,versions:new Set()};

export function operationCompletion(ctx,running) {
  if(!running)return ()=>true;
  const entry=ctx.fiber.entry,state=updateState(entry);
  // Older senders already mark this exact successor while handling settled.
  state.operationSettled??=state.busy===true&&state.versions.has(currentVersion);
  ctx.on('plugin-manager/operation',operation=>{
    if(operation.target!==packageName&&operation.target!==entry.id)return;
    if(operation.phase==='started')state.operationSettled=false;
    if(operation.phase==='settled')state.operationSettled=true;
  });
  return ()=>state.operationSettled;
}

/** Install packages through DSH, but activate new code only at next startup. */
export function registerSelfUpdate(ctx,config,restore,loadBoot,installNative) {
  if(installNative) {
    ctx.on('plugin-manager/operation',async operation=>{
      if(operation.phase!=='settled'||operation.reason!=='install'
        ||operation.target!==packageName||operation.changed!==true||operation.enabled===false
        ||!['applied','restart-required'].includes(operation.application)
        ||operation.version===currentVersion)return;
      try {await installNative(operation.version);}
      catch(error){ctx.logger.error(`FinShield installation failed: ${error.message}`);}
    });
  }
  ctx.inject(['pluginManager','loader','profileContext'],scope=>{
    const manager=scope.get('pluginManager').typertRemote.service;
    async function deferActivation() {
      if(scope.root.get('hmr')===undefined)return;
      const profile=scope.get('profileContext'),loader=scope.get('loader');
      const entry=[...loader.entries()].find(row=>row.options.id==='hmr'&&row.options.name==='@deepseek-ai/dsh-hmr');
      if(!entry)throw Error('FinShield update requires the DSH HMR entry');
      const boot=await loadBoot();
      await boot.enableHmr(profile,false);
      await boot.reconcileProfilePatches(scope.root,boot.readProfilePatches('dsh',profile),'dsh',[entry.options.id]);
      if(scope.root.get('hmr')!==undefined)throw Error('FinShield could not defer update activation');
    }
    for(const method of ['updateBundle','installBundle']) {
      const previous=Object.getOwnPropertyDescriptor(manager,method),original=manager[method];
      if(typeof original!=='function')continue;
      async function install(name,...args) {
        const own=typeof name==='string'&&(name===packageName||name.startsWith(packageName+'@'));
        const same=method==='updateBundle'?args[0]===currentVersion:name===packageName+'@'+currentVersion;
        if(own&&!same)await deferActivation();
        return Reflect.apply(original,this,[name,...args]);
      }
      scope.effect(()=>{
        Object.defineProperty(manager,method,{configurable:true,writable:true,value:install});
        return ()=>{if(Object.getOwnPropertyDescriptor(manager,method)?.value===install){
          if(previous)Object.defineProperty(manager,method,previous);else delete manager[method];
        }};
      });
    }
  });
}
