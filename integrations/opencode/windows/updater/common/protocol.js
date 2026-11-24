export const protocol=1;
export const operations=['hello','bind','admit','status','ensure','install','exit','later','restore','release','uninstall'];
// Full per-path diagnostics stay with native owners, outside bounded IPC frames.
export function projectState(value) {
  if(typeof value?.phase!=='string'||value.phase.length>64) throw Error('Invalid native phase');
  const result={phase:value.phase,reopenRequired:value.reopenRequired};
  for(const name of ['currentProtected','authorizationPending','reminderDismissed'])if(typeof value[name]==='boolean')result[name]=value[name];
  for(const name of ['currentRelease','requestedRelease','reason','reminderId'])if(typeof value[name]==='string')result[name]=value[name];
  if(value.error) result.error=String(value.error).slice(0,2048);
  if(value.authorization) {
    result.authorization={};
    for(const name of ['phase','prepared','authorization_in_progress','exit_code'])
      if(value.authorization[name]!==undefined)result.authorization[name]=value.authorization[name];
    if(value.authorization.error)result.authorization.error=String(value.authorization.error).slice(0,2048);
  }
  if(value.progress) {
    const percent=value.progress.overall_percent??null;
    if(percent!==null&&(typeof percent!=='number'||!Number.isFinite(percent))) throw Error('Invalid native percentage');
    result.progress={overall_percent:percent};
    const current=Array.isArray(value.progress.items)?value.progress.items.find(item=>item.state==='start'):undefined;
    if(typeof current?.path==='string')result.progress.items=[{path:current.path.slice(0,1024),
      ...(typeof current.state==='string'?{state:current.state.slice(0,64)}:{})}];
  }
  for(const name of ['prepared','authorization_in_progress']) if(typeof value[name]==='boolean') result[name]=value[name];
  if(value.nativeSetup) result.nativeSetup={code:value.nativeSetup.code,phase:value.nativeSetup.phase};
  if(value.nativeUninstall) result.nativeUninstall={code:value.nativeUninstall.code};
  return result;
}
export function validateRequest(value) {
  if(!value||typeof value!=='object'||Array.isArray(value)) throw Error('Invalid updater request');
  if(value.protocol!==undefined&&!Number.isSafeInteger(value.protocol)) throw Error('Invalid updater framing label');
  if(!operations.includes(value.operation)) throw Error('Unknown updater operation');
  const allowed=['hello','bind','admit'].includes(value.operation)?(value.operation==='hello'?['protocol','operation']:['protocol','operation','context']):value.operation==='install'?['protocol','operation','client','release']:['protocol','operation','client'];
  if(Object.keys(value).some(key=>!allowed.includes(key))) throw Error('Unknown updater request fields');
  if(!['hello','bind','admit'].includes(value.operation)&&typeof value.client!=='string') throw Error('Missing updater client binding');
  if(value.operation==='install'&&typeof value.release!=='string')throw Error('Missing installation release');
  return value;
}
