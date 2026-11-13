import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,writeSync,mkdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createUpdater} from './coordinator.js';
import {nativeAdapter} from './native.js';
import {protocol,validateRequest,projectState} from './protocol.js';
import {launchWrap} from './launch.js';
import {createWindowsLauncher} from './windows-launch.js';
import {readKnownFolders} from '../src/token.js';
import {resolveSettings,saveInstanceSettings} from '../src/settings.js';
import {prepareRuntime,createPreparationObserver} from '../src/preparation.js';
import {submitDesktopAuthorization,nativeDesktopChild} from '../src/connector.js';
import {installRuntime,stageRuntime} from '../install/runtime.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const version=JSON.parse(readFileSync(join(root,'package.json'),'utf8')).version;
const call=nativeAdapter(root);
const launchProtected=createWindowsLauncher();
if((await call({action:'identity'})).protected) throw Error('Protected Host cannot start updater');
const folders=readKnownFolders(root);
const startupInstallation=process.argv[2],startupConfiguration=process.argv[3];
const startup=await call({action:'retain_startup_main',pid:Number(process.argv[4]),created:process.argv[5]});
const slot=await call({action:'select_slot',installation:startupInstallation,configuration:startupConfiguration});
await call({action:'initialize_session_job',deadline:Number(process.argv[6])});
const rootsByProfile=new Map(),observations=createPreparationObserver();
const peers=new Map();
let draining=false,protectedEndpoint,mainWait;
const exitUpdater=code=>call({action:'exit_updater',code}).catch(error=>{
  process.stderr.write(`Updater exit failed: ${error.message}\n`);
});
async function enableProtectedEndpoint() {
  protectedEndpoint??=call({action:'server',container:true}).then(server=>{
    void serve(server.server).catch(error=>{process.stderr.write(error.message+'\n');void exitUpdater(1);});
  });
  await protectedEndpoint;
}
function boundCall(b,action,fields={}) {
  if(b.closing) return Promise.reject(Error('Native binding is closing'));
  const previous=[...b.calls].at(-1);
  const pending=Promise.resolve(previous).catch(()=>{}).then(()=>call({action,native:b.native,...fields}));
  b.calls.add(pending);
  return pending.finally(()=>b.calls.delete(pending));
}
function settingsFor(c) {
  return {...resolveSettings({},{dshHome:c.home,...folders}),
    installation:c.installation,configuration:c.configuration,
    executable:join(c.installation,'finsafe.exe'),yamlPath:join(c.configuration,'effective.yaml'),
    localAppData:folders.localAppData,dshHome:c.home};
}
const ports={
  async watchMain(b) {
    const previous=mainWait;mainWait=undefined;
    await previous?.();
    mainWait=call.watchMain(b.native?{native:b.native}:{startup:b.startup??startup.startup},()=>{
      if(draining)return;
      void updater.observeMainExits().catch(error=>{
        process.stderr.write(`Updater Main observation: ${error.message}\n`);
        draining=true;void exitUpdater(1);
      });
    });
  },
  bind:async value=>({...value,calls:new Set()}),
  alive:b=>b.native?boundCall(b,'alive'):call({action:'startup_main_alive',startup:b.startup??startup}),
  installation:b=>b.native?boundCall(b,'installation',{selected:b.selected===true}):Promise.resolve(null),
  mainAlive:b=>b.native?boundCall(b,'main_alive'):call({action:'startup_main_alive',startup:b.startup??startup}),
  async select(b,release) {
    const selected=await boundCall(b,'select_target',{release,...b.trustedRoots});
    return {...b,...selected,selected:true,settings:{...b.settings,...selected}};
  },
  async stage(b,required,signal) {
    const record=await boundCall(b,'installation',{selected:true});
    if(record?.version===required) {
      const state=await ports.preparation(b);
      if(state.phase==='ready'&&state.prepared===true)return {installed:true,version:required};
    }
    return stageRuntime(b.settings.downloads,required,{signal});
  },
  async selected(b,target) {
    const record=await boundCall(target,'installation',{selected:true});
    if(!record||record.version!==b.requestedRelease)throw Error('Selected native setup is not registered at requested release');
    observations.invalidate(target.settings);
    if((await boundCall(target,'target_identity')).changed)throw Error('Changing FinSAFE ID is unsupported (#1051)');
    saveInstanceSettings({...target.settings,installation:target.installation,configuration:target.configuration},b.home);
  },
  async install(b,required,staged) {
    if(staged?.installed)return {phase:'completed'};
    const settings=b.settings;
    mkdirSync(settings.stateDirectory,{recursive:true});
    const marker=join(settings.stateDirectory,`setup-${required}.json`);
    let resultPath;
    let result;
    const candidate=await boundCall(b,'stage_configuration');
    const setupInputs=await boundCall(b,'setup_inputs');
    try {result=await installRuntime(settings.downloads,required,{...settings,...candidate,...setupInputs,staged,
      onRequest:request=>writeFileSync(marker,JSON.stringify({version:required,phase:'installing',
        resultPath:resultPath=join(dirname(request.package),'setup-result.json')})),
    });}catch(error){
      writeFileSync(marker,JSON.stringify({version:required,phase:error.result?.phase??'failed',
        resultPath,error:error.message}));
      throw error;
    }
    writeFileSync(marker,JSON.stringify({version:required,...result}));
    b.retainedWorker=result.retainedWorker;
    return {phase:result.rebootRequired?'reboot-required':'completed',nativeSetup:{code:result.exitCode}};
  },
  async prepare(b) {
    const result=await prepareRuntime({...b.settings,retainedWorker:b.retainedWorker},{
      run:(executable,args,options)=>submitDesktopAuthorization(executable,args,{...options,
        spawnChild:()=>nativeDesktopChild({
          start:()=>boundCall(b,'authorization_start',{retainedWorker:b.retainedWorker}),
          read:owner=>call({action:'authorization_read',owner}),
        }),
      }),
    });
    b.retainedWorker=undefined;
    observations.publish(b.settings,result);
    if(result.completion)result.completion.then(terminal=>observations.publish(b.settings,terminal)).catch(()=>{});
    return result;
  },
  ready:async()=>{},
  preparation:b=>observations.read(b.settings),
  restore:b=>boundCall(b,'restore'),
  async detach(b) {if(b.startup){await call({action:'detach_startup_main',startup:b.startup});return;}
    b.closing=true;await Promise.allSettled([...b.calls]);await call({action:'detach',native:b.native});},
  wrap:async(b,observeReplacement,onStopped)=>{
    saveInstanceSettings({...b.settings,installation:b.installation,configuration:b.configuration},b.home);
    const retained=await launchWrap(b,{
      invoke:(action,fields)=>boundCall(b,action,fields),
      spawnChild:(...args)=>{
        if(b.closing)throw Error('Native binding is closing');
        return launchProtected(...args);
      },
      listen:enableProtectedEndpoint,observeReplacement,onStopped});
    return retained;
  },
  // Bootstrap owns stderr's persistent startup-*.log. Write synchronously before
  // native exit_updater can end the process without draining Node streams.
  report:(error,b={},operation='updater')=>writeSync(2,JSON.stringify({
    at:new Date().toISOString(),operation:error.operation??operation,
    installation:b.installation,configuration:b.configuration,release:b.requestedRelease,mainKey:b.mainKey,
    error:error.message,stack:error.stack,cleanupError:error.cleanupError?.message,
  })+'\n'),
  async uninstall(b) {
    const record=await boundCall(b,'installation');
    if(!record) throw Error('Selected native installation is unavailable');
    return boundCall(b,'run_uninstall');
  },
};
const updater=createUpdater({ports,startup});
await ports.watchMain(startup);
void updater.closed.then(()=>{
  if(draining)return;
  draining=true;void exitUpdater(0);
});

async function materialize(message,context) {
  const b=await call({action:'bind',connection:message.connection,context});
  const c=b.context;
  if(!b.protected)rootsByProfile.set(b.profile,{nativeVersionRoot:c.nativeVersionRoot,
    configurationVersionRoot:c.configurationVersionRoot,
    downloads:resolveSettings({},{dshHome:c.home,...folders}).downloadRoot});
  const trustedRoots=rootsByProfile.get(b.profile);
  if(!trustedRoots)throw Error('No ordinary-bound version roots are available for this profile');
  const settings=settingsFor(c);
  return {...b,...c,settings,trustedRoots,startup,calls:new Set()};
}

async function dispatch(message) {
  const request=validateRequest(message.request);
  if(request.operation==='hello') return {version,protocol,draining,running:updater.running()};
  if(request.operation==='admit'||request.operation==='keep') {
    if(draining) throw Error('Updater is draining');
    const peer=await materialize(message,request.context);
    return request.operation==='keep'?updater.keep(peer):updater.admit(peer);
  }
  if(request.operation==='bind') {
    if(draining) throw Error('Updater is draining');
    const peer=await materialize(message,request.context);
    const client=randomUUID();
    const id=await updater.bind(peer);
    peers.set(client,{id,peer:message.peer,protected:peer.protected});
    return {client};
  }
  const binding=peers.get(request.client);
  if(!binding||binding.peer!==message.peer) throw Error('Updater client identity mismatch');
  try {
    const result=await updater.request(binding.id,request.operation);
    return request.operation==='status'?projectState(result):result;
  } finally {if(request.operation==='release') peers.delete(request.client);}
}

async function serve(server) {
  for(;;) {
    let message;
    try {message=await call({action:'receive',server});}
    catch(error){if(error.message.includes('updater listener'))throw error;process.stderr.write(`Updater transport: ${error.message}\n`);continue;}
    if(!message) continue;
    void (async()=>{
      let response;
      try {response={ok:true,value:await dispatch(message)};}
      catch(error){response={ok:false,error:error.message.slice(0,2048)};}
      try {await call({action:'reply',connection:message.connection,response});}
      catch(error){process.stderr.write(`Updater reply: ${error.message}\n`);}
    })();
  }
}
const ordinary=await call({action:'server',container:false});
for(const signal of ['SIGINT','SIGTERM','SIGBREAK']) process.on(signal,()=>{
  if(draining) return;draining=true;
  updater.stop();void exitUpdater(0);
});
await serve(ordinary.server);
