import {runFinSafe,submitDesktopAuthorization} from './connector.js';

// Thin transport: preparation state, submission and progress belong to native Desktop APIs.
const options=settings=>({env:{...process.env,LOCALAPPDATA:settings.localAppData,
  ...(settings.dshHome?{DSH_HOME:settings.dshHome}:{})}});
export function prepareRuntime(settings,{run=submitDesktopAuthorization}={}) {
  return run(settings.executable,['desktop','authorization','ensure','--json','--yaml-path',settings.yamlPath,
    ...(settings.retainedWorker?['--retained-worker',settings.retainedWorker]:[])],
    options(settings));
}
export async function readPreparation(settings,{run=runFinSafe}={}) {
  const result=await run(settings.executable,['desktop','authorization','state','--json','--yaml-path',settings.yamlPath],
    {...options(settings),readOnlyResult:true});
  if(typeof result.prepared!=='boolean'||typeof result.authorization_in_progress!=='boolean'||typeof result.phase!=='string')
    throw Error('Native authorization observation is incomplete');
  return result;
}

/** One completion-spaced native observation per selected target. Submission
 * acknowledgments/terminal results update this transport cache without a read. */
export function createPreparationObserver({read=readPreparation,now=Date.now,
  wait=delay=>new Promise(done=>setTimeout(done,delay))}={}) {
  const records=new Map();
  const record=settings=>{const key=settings.yamlPath;let value=records.get(key);
    if(!value){value={generation:0,finished:-Infinity,stale:true};records.set(key,value);}return value;};
  const result=r=>r.error?Promise.reject(r.error):Promise.resolve(r.value);
  const observe=settings=>{
      const r=record(settings);
      if(r.pending)return r.pending;
      if(!r.stale&&now()-r.finished<2000)return result(r);
      const generation=r.generation;
      r.pending=(async()=>{
        let queried=false;
        try {
          const remaining=2000-(now()-r.finished);if(remaining>0)await wait(remaining);
          if(r.generation!==generation&&!r.stale)return result(r);
          queried=true;
          const value=await read(settings);
          if(r.generation===generation){r.value=value;r.error=undefined;r.stale=false;}
        }catch(error){if(r.generation===generation){r.error=error;r.stale=false;}}
        finally{if(queried)r.finished=now();r.pending=undefined;}
        if(r.stale)return observe(settings);
        return result(r);
      })();
      return r.pending;
  };
  return {
    read:observe,
    publish(settings,value) {
      const r=record(settings);r.generation++;r.value={...value};delete r.value.completion;
      r.error=undefined;r.stale=false;r.finished=now();
    },
    invalidate(settings){const r=record(settings);r.generation++;r.stale=true;},
  };
}
