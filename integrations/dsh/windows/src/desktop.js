import {createRequire} from 'node:module';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readCurrentToken} from './token.js';
import {registerStatus,readFeedbackEnvironment} from './status.js';
import {activationLifecycle,createActivation,registerSettingsRestoration} from './activation.js';
import {hostConnections} from '../updater/host.js';
import {registerSelfUpdate} from './self-update.js';
import {registerRemoval,loadRemovalRuntime} from './removal.js';

const runtimeRoot=process.argv[2];
const vendor=createRequire(join(runtimeRoot,'node_modules','@deepseek-ai','dsh','package.json'));

export const name='finsafe-windows';
export const inject=['typert'];

export async function apply(ctx) {
  const lifecycle=activationLifecycle(ctx);
  const {resolveDshHome}=await import(pathToFileURL(vendor.resolve('@deepseek-ai/dsh-home-paths')).href);
  const {bindTypertRemote}=await import(pathToFileURL(vendor.resolve('@deepseek-ai/dsh-typert-protocol')).href);
  const connections=hostConnections({home:resolveDshHome(),runtimeRoot,desktop:process.execPath,vendor});
  const observe=()=>readCurrentToken(runtimeRoot);
  const activation=createActivation({observe,...connections,...lifecycle,report:error=>ctx.logger.error(error.message)});
  registerSettingsRestoration(ctx,()=>activation.restore(),error=>ctx.logger.error(error.message));
  registerStatus(ctx,()=>activation.status(),observe,bindTypertRemote,()=>activation.exit(),()=>activation.later(),()=>readFeedbackEnvironment(runtimeRoot));
  ctx.effect(()=>()=>activation.dispose());
  registerSelfUpdate(ctx,{},()=>activation.restore(),()=>loadRemovalRuntime(vendor),release=>activation.install(release));
  registerRemoval(ctx,()=>activation.restore(),()=>loadRemovalRuntime(vendor));
  // Keep returns to Loader; startup Wrap uses the updater's Main-stop handoff.
  await activation.start();
}
