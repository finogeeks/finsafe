import {stageRuntime,installRuntime} from '../install/runtime.js';
import {prepareRuntime,readPreparation} from '../src/preparation.js';
import {submitDesktopAuthorization,nativeDesktopChild} from '../src/connector.js';
import {saveInstanceSettings} from '../src/instance-settings.js';

// Application ports for the OpenCode coordinator. Native effects stay at
// explicit boundaries so development rehearsals can substitute them.
export function createOperations({native,call,read=readPreparation,stage=stageRuntime,install=installRuntime,authorize}) {
  const external=b=>b.manageInstallation===false;
  const requireManaged=b=>{if(external(b))throw Error('The selected external FinSAFE installation is managed outside this plugin');};
  const submit=authorize??(b=>prepareRuntime({...b.settings,retainedWorker:b.retainedWorker},{
    run:(exe,args,options)=>submitDesktopAuthorization(exe,args,{...options,
      spawnChild:()=>nativeDesktopChild({start:()=>native(b,'authorization_start',{retainedWorker:b.retainedWorker}),
        read:owner=>call({action:'authorization_read',owner})})})}));
  return {
    installation:b=>native(b,'installation',{selected:b.selected===true}),
    async select(b,release,{startup=false}={}){
      const selected=await native(b,'select_target',{release,startup,...b.roots});
      return {...b,...selected,selected:true,settings:{...b.settings,...selected,version:release}};
    },
    async stage(b,release,signal){
      requireManaged(b);
      return stage(b.settings.downloads,release,{signal});
    },
    async install(b,release,staged){
      requireManaged(b);
      if(staged.installed)return {phase:'completed'};
      const candidate=await native(b,'stage_configuration'),inputs=await native(b,'setup_inputs');
      const result=await install(b.settings.downloads,release,{...b.settings,...candidate,...inputs,staged,
        execute:request=>native(b,'run_setup',{request})});
      b.retainedWorker=result.retainedWorker;
      return {phase:result.rebootRequired?'reboot-required':'completed',nativeSetup:{code:result.exitCode}};
    },
    async selected(b,target){
      saveInstanceSettings(target.settings,b.home);
    },
    async prepare(b,connection){
      if(external(b))return read(connection);
      const result=await submit(b);b.retainedWorker=undefined;
      return result;
    },
    preparation:(_b,connection)=>read(connection),
    progress:(_b,connection,attempt)=>read(connection,{attempt}),
  };
}
