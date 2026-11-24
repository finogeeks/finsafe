import {protocol} from './protocol.js';

export async function handleRequest(message,{dispatch,reply}) {
  let continuation,response;
  try {response={ok:true,value:await dispatch(message,action=>{continuation=action;})};}
  catch(error){response={ok:false,error:error.message.slice(0,2048)};}
  await reply(response);
  if(response.ok)continuation?.();
}

export function connectUpdater(staged,{call}) {
  let usageContext;
  const request=async(operation,fields={},options={})=>{
    if(fields.context?.usage!==undefined) {
      // Old updaters reject unknown binding fields. Reuse their original payload.
      if(usageContext===undefined)await request('hello',{},options);
      if(!usageContext) {
        const {usage,...context}=fields.context;
        fields={...fields,context};
      }
    }
    const message={protocol,operation,...fields};
    const result=await call({action:'request',root:staged.root,request:message,...options});
    if(!result.ok) throw Error(result.error);
    if(operation==='hello') {
      usageContext=result.value?.usageContext===true;
    }
    return result.value;
  };
  return {call,request};
}

export async function obtainUpdater(staged,settings,{connect,start,context,startup=true,validateHello=()=>{},incompatible,
  now=Date.now,deadlineMs=10000,releaseLaunchAfterHello=false}={}) {
  const connection=connect(staged);
  const old=await connection.call({action:'open_updater_job'});
  let ownsLaunch=false;
  const admit=async(deadline,launch)=>{
    const options={deadline,...(launch?{launch}: {})};
    const hello=await connection.request('hello',{},options);
    validateHello(hello);
    if(launch&&releaseLaunchAfterHello){
      await connection.call({action:'release_updater_launch',launch});
      ownsLaunch=false;
      delete options.launch;
    }
    if(context&&startup){const decision=await connection.request('admit',{context},options);connection.period=decision.period;connection.startupError=decision.error;connection.cancelled=decision.cancelled;connection.admitted=true;}
  };
  if(old.job)await connection.call({action:'recover_updater_job',job:old.job});
  const deadline=now()+deadlineMs;
  const launched=await (start??(request=>connection.call({action:'bootstrap',...request})))({
    node:staged.node,entry:staged.entry,deadline,
    installation:settings.installation,configuration:settings.configuration,context});
  ownsLaunch=true;
  try {
    await admit(deadline,launched.launch);
  }catch(error) {
    try {if(ownsLaunch)await connection.call({action:'stop_updater_launch',launch:launched.launch});}
    catch(cleanup){throw new AggregateError([error,cleanup],`${error.message}; startup cleanup: ${cleanup.message}`);}
    throw error;
  }
  if(ownsLaunch)await connection.call({action:'release_updater_launch',launch:launched.launch});
  connection.startupDeadline=deadline;
  return connection;
}
