export const packageName = '@finogeeks/finshield';
export const descriptor = {
  id: `${packageName}#finsafeWindows/status`, service:'finsafeWindows', namespace:'finsafeWindows', method:'status',
  invocation:{kind:'direct'}, parameters:[], result:{mode:'src-json'},
  description:'Read current FinSAFE Host protection. This method changes no permissions and starts no process.',
};
export const restartDescriptor = {
  ...descriptor,id:`${packageName}#finsafeWindows/restart`,method:'restart',
  description:'Restart this Desktop through its existing protection handoff after explicit user confirmation',
};
export const remoteContract = {package:packageName,descriptors:[descriptor,restartDescriptor]};
