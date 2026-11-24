import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {nativeAdapter,sourceRoot} from './native.js';
import {stagePluginPackage} from './common/package.js';
import {connectUpdater as connectCommonUpdater,obtainUpdater as obtainCommonUpdater} from './common/transport.js';

const packageRoot=fileURLToPath(new URL('../',import.meta.url));
export const version=JSON.parse(readFileSync(join(packageRoot,'package.json'),'utf8')).version;

/** Copy this version's scripts/dependencies once; execute DSH's selected Node in place. */
export async function stageUpdater({runtimeRoot,nodeExecutable:node,localAppData}) {
  const root=join(localAppData,'FinSAFE','dsh-updater');
  const stage=await stagePluginPackage(packageRoot,root,{sdkSourceRoot:sourceRoot});
  return {version,root,stage,node,entry:join(stage,'updater','server.js')};
}

export function connectUpdater(staged,{call=nativeAdapter(staged.stage)}={}) {
  return connectCommonUpdater(staged,{call});
}
export function obtainUpdater(staged,settings,options={}){
  return obtainCommonUpdater(staged,settings,{connect:connectUpdater,...options});
}
