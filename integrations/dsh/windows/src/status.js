import { remoteContract, packageName } from './contract.js';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {platform,release,arch} from 'node:os';
import packageInfo from '../package.json' with {type:'json'};

export async function readFeedbackEnvironment(runtimeRoot) {
  let dshVersion;
  try {dshVersion=JSON.parse(await readFile(join(runtimeRoot,'node_modules','@deepseek-ai','dsh','package.json'),'utf8')).version;}
  catch { /* Optional metadata stays unknown when the selected runtime cannot be read. */ }
  return {pluginVersion:packageInfo.version,dshVersion,platform:platform(),osRelease:release(),arch:arch()};
}

/** Use DSH's authenticated Gateway; never expose another local HTTP server. */
export function registerStatus(ctx, readState, readToken, bindRemote, exit, later, readEnvironment=()=>({})) {
  // This Host's runtime metadata is fixed for its lifetime. It does not gate startup.
  let feedback={};
  void Promise.resolve().then(readEnvironment).then(value=>{feedback=value;},()=>{});
  const service = {ctx,async status() {
    let state,token,localError;
    try {token=readToken();}catch(error){localError=error;}
    try {state=await readState();}catch(error){state={error:error.message};}
    if(localError) {
      const result={...state,error:[state?.error,localError.message].filter(Boolean).join('; '),feedback,observedAt:new Date().toISOString()};
      delete result.currentProtected;delete result.protected;delete result.token;
      return result;
    }
    return {...state,token,protected:token.appContainer,currentProtected:token.appContainer,feedback,observedAt:new Date().toISOString()};
  },async exit() {
    return exit();
  },async later() {
    if(!later)throw Error('Updater reminder is unavailable');
    return later();
  }};
  service.typertRemote = bindRemote(service,'finsafeWindows');
  ctx.provide('finsafeWindows',service);
  ctx.effect(()=>ctx.typert.register({package:packageName,face:'host',schemas:[],
    model:{services:[],events:[],objects:[]},invocations:remoteContract.descriptors}));
}
