import {createUpdater as createCommonUpdater} from './common/coordinator.js';

export function createUpdater({ports,...options}) {
  let admission;
  const delegated=Object.create(ports);
  delegated.wrap=(binding,retain,onStopped)=>{
    const pending=admission;
    const work=Promise.resolve().then(()=>ports.wrap(binding,retain,()=>{
      onStopped();pending?.resolve();
    }));
    void work.catch(error=>pending?.reject(error));
    return work;
  };
  const updater=createCommonUpdater({...options,ports:delegated,application:'DSH',prepareUpdates:true});
  return {...updater,async admit(binding) {
    const {target,...decision}=await updater.admit(binding);
    if(decision.period==='wrap') {
      // Keep the original Main-stop handoff. The common owner continues
      // replacement without waiting for this reply or a new Host bind.
      if(!admission) {
        admission=Promise.withResolvers();
        updater.executeStartup(binding,target);
      }
      try {await admission.promise;}finally{admission=undefined;}
    }
    return decision;
  }};
}
