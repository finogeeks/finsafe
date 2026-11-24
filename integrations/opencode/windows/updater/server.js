import {createDiagnostics,handleRequest} from './common/index.js';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {nativeAdapter} from '../updater/native.js';
import {readKnownFolders} from '../src/known-folders.js';
import {createManagement} from './management.js';
import {protocol,validateRequest,projectState} from '../updater/protocol.js';
import {readPreparation,obtainShell} from '../src/preparation.js';
import {createOperations} from './operations.js';
import {launchHost,createConnectionConfirmation} from './launch.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const diagnostic=createDiagnostics(process.argv[7]);
const record=(event,fields={})=>diagnostic({at:new Date().toISOString(),event,...fields});
const report=error=>record('error',{error:error.message,stack:error.stack});
process.on('uncaughtExceptionMonitor',report);
const version=JSON.parse(readFileSync(join(root,'package.json'),'utf8')).version;
const call=nativeAdapter(root),folders=readKnownFolders(root);
const build={version};
await call({action:'select_slot',installation:process.argv[2],configuration:process.argv[3]});
const startup=await call({action:'retain_startup_main',pid:Number(process.argv[4]),created:process.argv[5]});
process.env.OPENCODE_INSTALL_DIR=dirname(startup.image);
await call({action:'initialize_session_job',deadline:Number(process.argv[6])});
const clients=new Map(),roots=new Map();
const confirmations=createConnectionConfirmation();
let mainWait,protectedEndpoint,draining=false;
const exit=code=>call({action:'exit_updater',code}).catch(report);
// Retain the plugin's per-binding call ordering before freeing a native binding.
const native=(b,action,fields={})=>{
  if(b.closing)return Promise.reject(Error('Native binding is closing'));
  const previous=[...b.calls].at(-1);
  const pending=Promise.resolve(previous).catch(()=>{}).then(()=>call({action,native:b.native,...fields}));
  b.calls.add(pending);return pending.finally(()=>b.calls.delete(pending));
};
const ports={
  backend:b=>obtainShell(b.settings),
  exit:b=>native(b,'stop_main'),
  retainsMainDuringWrap:true,
  async watchMain(b){
    const previous=mainWait;mainWait=undefined;await previous?.();
    mainWait=call.watchMain(b.native?{native:b.native}:{startup:startup.startup},()=>{
      void updater.observeMainExits().catch(error=>{report(error);void exit(1);});
    });
  },
  bind:async b=>b,alive:b=>native(b,'alive'),mainAlive:b=>b.native?native(b,'main_alive'):call({action:'startup_main_alive',startup:startup.startup}),
  ...createOperations({native,call}),restore:async()=>{},
  async detach(b){if(!b.native)return call({action:'detach_startup_main',startup:startup.startup});b.closing=true;await Promise.allSettled([...b.calls]);return call({action:'detach',native:b.native});},
  async wrap(b,observeReplacement,onStopped){
    const confirmation=confirmations.begin(b.mainKey);
    try{return await launchHost(b,{record,observeReplacement,onStopped,confirm:confirmation.wait,
      replace:()=>native(b,'replace_host'),
      listen:async()=>{
        protectedEndpoint??=call({action:'server',container:true}).then(server=>{
          void serve(server.server).catch(error=>{report(error);void exit(1);});
        });
        await protectedEndpoint;
      },
    });}finally{confirmation.dispose();}
  },
  report,
};
const updater=createManagement({ports,startup});await ports.watchMain(startup);
void updater.closed.then(()=>{if(!draining){draining=true;void exit(0);}});
async function materialize(message,context){
  const b=await call({action:'bind',connection:message.connection,context});const c=b.context;
  record('host-bound',{hostPid:b.pid,mainPid:b.main,protected:b.protected});
  if(!b.protected)roots.set(b.profile,{nativeVersionRoot:c.nativeVersionRoot,configurationVersionRoot:c.configurationVersionRoot,downloads:join(folders.localAppData,'FinSAFE','opencode-plugin/downloads')});
  const trusted=roots.get(b.profile);if(!trusted)throw Error('No ordinary-bound OpenCode version roots');
  const binding={...b,...c,calls:new Set(),roots:trusted,settings:{...c,...folders,executable:join(c.installation,'finsafe.exe'),yamlPath:join(c.configuration,'effective.yaml'),downloads:trusted.downloads}};
  return binding;
}
async function dispatch(message,afterReply){
  const request=validateRequest(message.request);
  if(request.operation==='hello')return {version,protocol,draining,sdkManagement:true,retainedMainHost:true,usageContext:true,
    sdk:{...build,root:call.sdkRoot,libraryPath:call.libraryPath}};
  if(['admit','bind'].includes(request.operation)){
    if(draining)throw Error('Updater is draining');
    const peer=await materialize(message,request.context);
    if(request.operation==='admit'){
      const {target,...decision}=await updater.admit(peer);
      if(decision.period==='wrap')afterReply(()=>updater.executeStartup(peer,target));
      return decision;
    }
    const client=randomUUID();clients.set(client,{id:await updater.bind(peer),peer:message.peer});
    confirmations.observe(peer);return {client};
  }
  const binding=clients.get(request.client);if(!binding||binding.peer!==message.peer)throw Error('Updater client identity mismatch');
  try{const result=await updater.request(binding.id,request.operation,request.operation==='install'?{release:request.release}:{});return request.operation==='status'?projectState(result):result;}
  finally{if(request.operation==='release')clients.delete(request.client);}
}
async function serve(server){for(;;){let message;
  try{message=await call({action:'receive',server});}
  catch(error){if(error.message.includes('updater listener'))throw error;report(error);continue;}
  if(!message)continue;
  void handleRequest(message,{dispatch,reply:response=>call({action:'reply',connection:message.connection,response})}).catch(report);}}
for(const signal of ['SIGINT','SIGTERM','SIGBREAK'])process.on(signal,()=>{updater.stop();});
await serve((await call({action:'server',container:false})).server);
