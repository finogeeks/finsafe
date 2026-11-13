import {existsSync} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {nativeAdapter} from './native.js';
import {stageUpdater,connectUpdater,obtainUpdater,version} from './bootstrap.js';
import {resolveSettings,saveInstanceSettings} from '../src/settings.js';
import {readKnownFolders} from '../src/token.js';

const packageRoot=fileURLToPath(new URL('../',import.meta.url));
export function hostConnections({config,home,runtimeRoot,desktop,vendor}) {
  let connection,support;
  async function loadSupport() {
    const settings=resolveSettings(config,{dshHome:home,requestedRelease:version,...readKnownFolders(runtimeRoot)});
    // Load a private support copy so pnpm can remove the package while Host runs.
    // A confined copy does not bootstrap an ordinary updater.
    const dll=join(packageRoot,'bin','finshield_dsh_native.dll');
    const copy=join(home,'finsafe-windows','native',version);
    await mkdir(join(copy,'bin'),{recursive:true});
    if(!existsSync(join(copy,'bin','finshield_dsh_native.dll'))) await writeFile(join(copy,'bin','finshield_dsh_native.dll'),await readFile(dll));
    const call=nativeAdapter(copy,{require:vendor});
    // The ordinary updater resolves the actual supervisor during authenticated bind.
    const context={desktop,runtimeRoot,home,installation:settings.installation,configuration:settings.configuration,
      requestedRelease:version,nativeVersionRoot:settings.nativeVersionRoot,configurationVersionRoot:settings.configurationVersionRoot};
    await call({action:'select_slot',installation:context.installation,configuration:context.configuration});
    return {settings,call,context};
  }
  async function open(ordinary) {
    if(connection) return connection;
    // Initialization and disposal can overlap; share this activation's DLL load.
    const {settings,call,context}=await (support??=loadSupport());
    if(ordinary) {
      await mkdir(settings.stateDirectory,{recursive:true});
      // The discovery location is fixed to this actual home. Result/diagnostic
      // files can use the configured stateDirectory without hiding that choice
      // from the resident updater or a later activation.
      saveInstanceSettings(settings,home);
      const inputs=await call({action:'host_inputs'});
      const staged=await stageUpdater({runtimeRoot,nodeExecutable:inputs.nodeExecutable,localAppData:settings.localAppData});
      connection=await obtainUpdater(staged,settings,{context,connect:()=>connectUpdater(staged,{call})});
    }else {
      const locations=await call({action:'locations'});
      connection=connectUpdater({root:locations.root},{call});
      connection.runningPeriod=true;
    }
    connection.context=context;
    return connection;
  }
  return {obtain:()=>open(true),existing:()=>open(false)};
}
