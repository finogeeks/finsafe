import {createActivation as createCommonActivation} from '../updater/common/activation.js';
// DSH lifetime and UI observation only. All native tasks belong to the updater.
import {operationCompletion} from './self-update.js';
export function activationLifecycle(ctx) {
  let running=false;
  try {
    // DSH calls this synchronously if ready. Sample once; never wait for boot.
    const cancel=ctx.get('appReady').onReady(()=>{running=true;});
    cancel();
  } catch {running=false;}
  return {running,restartAllowed:operationCompletion(ctx,running)};
}

export function registerSettingsRestoration(ctx,restore,report) {
  ctx.on('plugin-manager/operation',async operation=>{
    if(operation.phase!=='settled'||!['applied','restart-required'].includes(operation.application))return;
    const ownBundle=operation.target==='@finogeeks2026/finshield-dsh';
    const disabled=operation.enabled===false&&(
      operation.reason==='bundle'&&ownBundle||operation.reason==='plugin'&&operation.target===ctx.fiber.entry?.id);
    if(!disabled&&!(operation.reason==='remove'&&ownBundle))return;
    try {await restore();}
    catch(error){report(Error(`FinShield settings restoration failed: ${error.message}`));}
  });
}

export function createActivation(options) {
  // Use the common request-error policy used by OpenCode. These diagnostics
  // describe calls, never authorization state, and cannot close observation.
  let startupError,commandError;
  const connect=acquire=>acquire&&(async(...args)=>{
    const connection=await acquire(...args);
    startupError=connection.startupError;
    return {...connection,async request(operation,...fields) {
      const command=!['admit','hello','bind','status','release'].includes(operation);
      try {
        const result=await connection.request(operation,...fields);
        if(operation==='admit')startupError=result.error;
        if(command)commandError=undefined;
        return result;
      } catch(error) {
        if(operation==='admit')startupError=error.message;
        if(command)commandError=error.message;
        throw error;
      }
    }};
  });
  const activation=createCommonActivation({...options,application:'DSH',propagateRequestErrors:true,
    obtain:connect(options.obtain),existing:connect(options.existing)});
  return {...activation,async status() {
    const observed=await activation.status();
    const error=[...new Set([observed.error,startupError,commandError].filter(Boolean))].join('; ');
    return {...observed,...(error?{error}:{})};
  }};
}
