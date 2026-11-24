import {fileURLToPath} from 'node:url';
import {nativeAdapter} from './native.js';
import {stageUpdater,connectUpdater,obtainUpdater,version} from './bootstrap.js';
import {resolveSettings} from '../src/settings.js';
import {readKnownFolders} from '../src/token.js';

const packageRoot=fileURLToPath(new URL('../',import.meta.url));
export function hostConnections({home,runtimeRoot,desktop,vendor}) {
  let connection,support;
  async function loadSupport() {
    const settings=resolveSettings({dshHome:home,requestedRelease:version,...readKnownFolders(runtimeRoot)});
    // The package-owned SDK supplies its removal-safe native copy.
    // A confined copy does not bootstrap an ordinary updater.
    const call=nativeAdapter(packageRoot);
    // The ordinary updater resolves the actual supervisor during authenticated bind.
    const context={usage:{agent_id:'dsh',launch_method:'plugin',plugin_id:'@finogeeks2026/finshield-dsh',plugin_version:version,agent_version:'unknown'},desktop,runtimeRoot,home,installation:settings.installation,configuration:settings.configuration,
      requestedRelease:version,nativeVersionRoot:settings.nativeVersionRoot,configurationVersionRoot:settings.configurationVersionRoot};
    await call({action:'select_slot',installation:context.installation,configuration:context.configuration});
    return {settings,call,context};
  }
  async function open(ordinary) {
    if(connection) return connection;
    // Initialization and disposal can overlap; share this activation's DLL load.
    const {settings,call,context}=await (support??=loadSupport());
    if(ordinary) {
      const inputs=await call({action:'host_inputs'});
      const staged=await stageUpdater({runtimeRoot,nodeExecutable:inputs.nodeExecutable,localAppData:settings.localAppData});
      connection=await obtainUpdater(staged,settings,{context,startup:false,connect:()=>connectUpdater(staged,{call})});
    }else {
      const locations=await call({action:'locations'});
      connection=connectUpdater({root:locations.root,version},{call});
      await connection.request('hello');
    }
    connection.context=context;
    return connection;
  }
  return {obtain:()=>open(true),existing:()=>open(false)};
}
