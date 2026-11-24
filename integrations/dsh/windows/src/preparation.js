import {sdk} from '../updater/native.js';
import {submitDesktopAuthorization} from './connector.js';

// Thin transport: preparation state, submission and progress belong to native Desktop APIs.
const options=settings=>({env:{...process.env,LOCALAPPDATA:settings.localAppData,
  ...(settings.dshHome?{DSH_HOME:settings.dshHome}:{})}});
export function prepareRuntime(settings,{run=submitDesktopAuthorization}={}) {
  return run(settings.executable,['desktop','configuration','apply','--json','--yaml-path',settings.yamlPath,
    ...(settings.retainedWorker?['--retained-worker',settings.retainedWorker]:[])],
    options(settings));
}
// The updater supplies its current Shell connection. Reads never obtain Shell.
export function readPreparation(connection,{attempt,client=sdk.createStatusClient}={}) {
  const status=client(connection);
  return attempt===undefined?status.authorizationState():status.authorizationProgress(attempt);
}
export const obtainShell=settings=>sdk.obtainShell(settings);
