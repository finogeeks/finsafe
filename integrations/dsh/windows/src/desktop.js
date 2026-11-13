import {createRequire} from 'node:module';
import {isAbsolute,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import Schema from '@deepseek-ai/schemastery';
import {readCurrentToken} from './token.js';
import {registerStatus} from './status.js';
import {createActivation,registerSettingsRestoration} from './activation.js';
import {hostConnections} from '../updater/host.js';
import {registerSelfUpdate} from './self-update.js';
import {registerRemoval,loadRemovalRuntime} from './removal.js';

export const name='finsafe-windows';
export const inject=['typert'];
export const Config=Schema.object({installation:Schema.string(),configuration:Schema.string(),
  stateDirectory:Schema.string(),nativeVersionRoot:Schema.string(),
  configurationVersionRoot:Schema.string(),downloadRoot:Schema.string()});

export async function apply(ctx,config={}) {
  if(process.platform!=='win32'||!/dsh-desktop-host[\\/]lib[\\/]index\.js$/.test(process.argv[1]||'')) throw Error('FinShield requires the Windows DSH Desktop Host');
  const runtimeRoot=process.argv[2];
  if(!runtimeRoot||!isAbsolute(runtimeRoot)) throw Error('Missing DSH runtime directory');
  const vendor=createRequire(join(runtimeRoot,'node_modules','@deepseek-ai','dsh','package.json'));
  const {resolveDshHome}=await import(pathToFileURL(vendor.resolve('@deepseek-ai/dsh-home-paths')).href);
  const {bindTypertRemote}=await import(pathToFileURL(vendor.resolve('@deepseek-ai/dsh-typert-protocol')).href);
  const connections=hostConnections({config,home:resolveDshHome(),runtimeRoot,desktop:process.execPath,vendor});
  const observe=()=>readCurrentToken(runtimeRoot);
  const activation=createActivation({observe,...connections,report:error=>ctx.logger.error(error.message)});
  registerSettingsRestoration(ctx,()=>activation.restore(),error=>ctx.logger.error(error.message));
  registerStatus(ctx,()=>activation.status(),observe,bindTypertRemote,()=>activation.restart(),()=>activation.later());
  ctx.effect(()=>()=>activation.dispose());
  registerSelfUpdate(ctx,config,()=>activation.restore());
  registerRemoval(ctx,()=>activation.restore(),()=>loadRemovalRuntime(vendor));
  await activation.start();
}
