import {platform,release,arch} from 'node:os';
import {resolveSettings,version} from './settings.js';
import {loadNative,hostConnections,packageRoot} from '../updater/bootstrap.js';
import {createActivation} from '../src/activation.js';
export async function activateHost(options={}, {load=loadNative,mainPid,desktop,connectedHostPid,startup=true,prepare=true,connect=hostConnections}={}) {
  if(process.platform!=='win32')throw Error('FinShield requires Windows OpenCode Desktop');
  const call=load(),identity=()=>call({action:'identity'});
  const settings=resolveSettings(options);
  await call({action:'select_slot',installation:settings.installation,configuration:settings.configuration});
  const token=await identity();
  if(connectedHostPid!==undefined&&connectedHostPid!==token.pid)throw Error('OpenCode Main business Host differs from the attached native Host');
  const feedback={pluginVersion:version,
    opencodeVersion:'2.3.0',platform:platform(),osRelease:release(),arch:arch()};
  // The ordinary updater verifies Main. An AppContainer Host cannot query it.
  const inputs=token.protected?{...await call({action:'locations'}),mainPid,desktop:desktop??options.desktop}:
    await call({action:'opencode_context',context:{mainPid}});
  const context={usage:{agent_id:'opencode',launch_method:'plugin',plugin_id:'@finogeeks2026/finshield-opencode',plugin_version:feedback.pluginVersion,agent_version:'unknown'},mainPid:inputs.mainPid,mainCreated:inputs.mainCreated,connectedHostPid,desktop:options.desktop??inputs.desktop,backend:process.execPath,runtimeRoot:packageRoot,
    home:settings.home,serviceFile:options.serviceFile??inputs.serviceFile??settings.serviceFile,installation:settings.installation,configuration:settings.configuration,
    manageInstallation:options.manageInstallation!==false,
    requestedRelease:version,nativeVersionRoot:settings.nativeVersionRoot,configurationVersionRoot:settings.configurationVersionRoot};
  const connections=connect(settings,context,call);
  const activation=createActivation({observe:()=>({appContainer:token.protected}),...connections,
    running:!startup,prepare,obtain:prepare?connections.obtain:connections.existing,
    report:error=>console.error('FinShield:',error.message)});
  void activation.start();
  return {async status(){
    let observed,state,tokenError;
    try{observed=await identity();}catch(error){tokenError=error;}
    try{state=await activation.status();}catch(error){state={error:error.message};}
    if(tokenError){
      const result={...state,error:[state.error,tokenError.message].filter(Boolean).join('; '),feedback};
      delete result.protected;delete result.currentProtected;delete result.hostPid;
      return result;
    }
    return {...state,protected:observed.protected,currentProtected:observed.protected,hostPid:observed.pid,feedback};
  },
    install:release=>activation.install(release),exit:()=>activation.exit(),later:()=>activation.later(),dispose:()=>activation.dispose()};
}
