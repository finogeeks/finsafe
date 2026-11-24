import {nativeAdapter} from './native.js';
import {connectUpdater as connectCommonUpdater,obtainUpdater as obtainCommonUpdater} from './common/transport.js';
export function connectUpdater(staged,{call=nativeAdapter(staged.stage)}={}){
  return connectCommonUpdater(staged,{call});
}
export function obtainUpdater(staged,settings,options={}){
  const incompatible=Error('Close OpenCode to stop the previous FinShield updater, then start OpenCode again');
  return obtainCommonUpdater(staged,settings,{connect:connectUpdater,...options,incompatible,releaseLaunchAfterHello:true,
    validateHello:hello=>{if(hello.sdkManagement!==true||hello.retainedMainHost!==true)throw incompatible;}});
}
