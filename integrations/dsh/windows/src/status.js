import { remoteContract, packageName } from './contract.js';

/** Use DSH's authenticated Gateway; never expose another local HTTP server. */
export function registerStatus(ctx, readState, readToken, bindRemote, restart) {
  const service = {ctx,async status() {
    let state;
    try {
      state = await readState();
      const token = readToken();
      return {...state,token,protected:state.phase==='protected' && token.appContainer,observedAt:new Date().toISOString()};
    } catch (error) {
      return {...state,phase:'failed',protected:false,error:error.message,observedAt:new Date().toISOString()};
    }
  },async restart() {
    if((await readState()).phase!=='ready' || !restart) throw new Error('FinShield is not ready to restart');
    return restart();
  }};
  service.typertRemote = bindRemote(service,'finsafeWindows');
  ctx.provide('finsafeWindows',service);
  ctx.effect(()=>ctx.typert.register({package:packageName,face:'host',schemas:[],
    model:{services:[],events:[],objects:[]},invocations:remoteContract.descriptors}));
}
