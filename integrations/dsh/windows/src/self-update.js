import {existsSync,readFileSync} from 'node:fs';
import {cp,mkdir,mkdtemp,readFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const packageName='@finogeeks2026/finshield';
const currentVersion=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
const attemptKey=Symbol.for('@finogeeks2026/finshield.self-update');

async function loadUpdatedModule(profile,version) {
  const source=join(profile.dir,'node_modules',packageName);
  const manifest=JSON.parse(await readFile(join(source,'package.json'),'utf8'));
  if(manifest.name!==packageName||manifest.version!==version)throw Error('Installed package does not match the completed update');
  const root=join(profile.dir,'.finshield-runtime'),stage=join(root,version);
  if(!existsSync(stage)) {
    await mkdir(root,{recursive:true});
    const temporary=await mkdtemp(join(root,'.stage-'));
    for(const name of ['src','updater','install','policy','bin'])
      await cp(join(source,name),join(temporary,name),{recursive:true});
    await cp(join(source,'package.json'),join(temporary,'package.json'));
    await rename(temporary,stage);
  }
  const implementation=await import(pathToFileURL(join(stage,'src','desktop.js')).href);
  if(typeof implementation.apply!=='function')throw Error('Updated plugin has no apply function');
  return implementation;
}

/** Best effort only: package installation succeeds independently of activation. */
export function registerSelfUpdate(ctx,config,restore) {
  const report=error=>ctx.logger.error(`FinShield self-update skipped: ${error.message}`);
  try {
    const entry=ctx.fiber.entry;
    if(!entry||ctx.get('hmr')!==undefined)return;
    const state=entry[attemptKey]??={busy:false,versions:new Set()};
    let active=true;
    ctx.effect(()=>()=>{active=false;});
    ctx.on('plugin-manager/operation',async operation=>{
      if(operation.phase!=='settled'||!['applied','restart-required'].includes(operation.application))return;
      const ownBundle=operation.target===packageName;
      if((ownBundle&&(operation.reason==='remove'||operation.reason==='bundle'&&operation.enabled===false))
        ||operation.reason==='plugin'&&operation.target===entry.id&&operation.enabled===false) {active=false;return;}
      const version=operation.version;
      if(!active||state.busy||operation.reason!=='install'||!ownBundle||operation.application!=='restart-required'
        ||operation.restartReason!=='no-hmr'||operation.changed!==true||operation.enabled===false||operation.errorCode
        ||typeof version!=='string'||!/^\d+\.\d+\.\d+$/.test(version)||version===currentVersion||state.versions.has(version))return;
      state.busy=true;state.versions.add(version);
      const stable=entry.ctx,previous=entry.moduleNamespace,oldFiber=entry.fiber;
      let deleted=false,next,child;
      try {
        next=await loadUpdatedModule(ctx.get('profileContext'),version);
        if(!active||entry.fiber!==oldFiber)return;
        // Unlike release, restore waits for old native work and its settings cleanup.
        await restore();
        if(!active||entry.fiber!==oldFiber)return;
        stable.registry.delete(stable.loader.unwrapExports(previous));deleted=true;
        await oldFiber.await();
        child=stable.registry.plugin(stable.loader.unwrapExports(next),config,entry.getOuterStack);
        entry.fiber=child;entry.moduleNamespace=next;
        await child.await();
      } catch(error) {
        if(deleted) {
          try {
            if(child) {
              stable.registry.delete(stable.loader.unwrapExports(next));
              // The failed activation is already reported below; finish its teardown.
              await Promise.allSettled([child.await()]);
            }
            entry.fiber=stable.registry.plugin(stable.loader.unwrapExports(previous),config,entry.getOuterStack);
            entry.moduleNamespace=previous;
            await entry.fiber.await();
          } catch(restorationError) {report(Error(`previous plugin could not resume: ${restorationError.message}`));}
        }
        report(error);
      } finally {state.busy=false;}
    });
  } catch(error) {report(error);}
}
