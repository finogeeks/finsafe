import { remoteContract, packageName } from './contract.js';

/** Use DSH's authenticated Gateway; never expose another local HTTP server. */
export function registerStatus(ctx, readState, readToken, bindRemote, restart, later) {
  const service = {ctx,async status() {
    let state,token,localError;
    try {token=readToken();}catch(error){localError=error;}
    try {state=await readState();}catch(error){state={phase:'failed',error:error.message};}
    if(localError) {
      const result={...state,phase:'failed',error:localError.message,observedAt:new Date().toISOString()};
      delete result.currentProtected;delete result.protected;delete result.token;
      return result;
    }
    return {...state,token,protected:token.appContainer,currentProtected:token.appContainer,observedAt:new Date().toISOString()};
  },async restart() {
    return restart();
  },async later() {
    if(!later)throw Error('Updater reminder is unavailable');
    return later();
  }};
  service.typertRemote = bindRemote(service,'finsafeWindows');
  ctx.provide('finsafeWindows',service);
  ctx.effect(()=>ctx.typert.register({package:packageName,face:'host',schemas:[],
    model:{services:[],events:[],objects:[]},invocations:remoteContract.descriptors}));
}
