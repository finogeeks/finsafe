export const packageName = '@finogeeks2026/finshield-dsh';
export const descriptor = {
  id: `${packageName}#finsafeWindows/status`, service:'finsafeWindows', namespace:'finsafeWindows', method:'status',
  invocation:{kind:'direct'}, parameters:[], result:{mode:'src-json'},
  description:'Read current FinSAFE Host protection. This method changes no permissions and starts no process.',
};
export const exitDescriptor = {
  ...descriptor,id:`${packageName}#finsafeWindows/exit`,method:'exit',
  description:'Exit this Desktop without relaunch; reopen it manually to use the prepared target',
};
export const laterDescriptor={...descriptor,id:`${packageName}#finsafeWindows/later`,method:'later',
  description:'Dismiss this selected exit reminder while retaining the current session'};
export const remoteContract = {package:packageName,descriptors:[descriptor,exitDescriptor,laterDescriptor]};
