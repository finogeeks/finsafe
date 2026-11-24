import {existsSync,realpathSync} from 'node:fs';
import {mkdir,cp,readFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {nativeAdapter} from '../updater/native.js';
import {connectUpdater,obtainUpdater} from '../updater/transport.js';
import {readKnownFolders} from '../src/known-folders.js';
import {stagePluginPackage} from './common/package.js';
export const packageRoot=fileURLToPath(new URL('../',import.meta.url));

// Plugin-owned immutable staging and updater acquisition. OpenCode
// carries Node because its compiled Bun backend does not supply a Node runtime.
export async function stageUpdater(localAppData=readKnownFolders(packageRoot).localAppData) {
  const root=join(localAppData,'FinSAFE','opencode-updater');
  const version=JSON.parse(await readFile(join(packageRoot,'package.json'),'utf8')).version;
  const stage=join(root,version),node=join(root,'runtime/node.exe');
  await mkdir(dirname(node),{recursive:true});
  if(!existsSync(node))await cp(join(packageRoot,'bin/node.exe'),node);
  await stagePluginPackage(packageRoot,root,{overrides:{'updater/server.js':'dist/updater/server.js','updater/download-source.json':'install/download-source.json'}});
  return {version,root:realpathSync.native(root),stage,node:realpathSync.native(node),entry:join(stage,'updater/server.js')};
}

export function hostConnections(settings,context,call) {
  let connection;
  async function open(ordinary) {
    if(connection)return connection;
    if(ordinary) {
      const staged=await stageUpdater();
      connection=await obtainUpdater(staged,settings,{context,startup:false,
        connect:()=>connectUpdater(staged,{call})});
    } else {
      const manifest=JSON.parse(await readFile(join(packageRoot,'package.json'),'utf8'));
      connection=connectUpdater({version:manifest.version}, {call});
      await connection.request('hello');
    }
    connection.context=context;
    return connection;
  }
  return {obtain:()=>open(true),existing:()=>open(false)};
}
export const loadNative=()=>nativeAdapter(packageRoot);
