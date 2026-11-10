import {runFinSafe} from './connector.js';

// Thin transport: preparation state, submission and progress belong to native Desktop APIs.
const options=settings=>({env:{...process.env,LOCALAPPDATA:settings.localAppData}});
export function prepareRuntime(settings,{run=runFinSafe}={}) {
  return run(settings.executable,['prepare','ensure','--json','--yaml-path',settings.yamlPath],
    {...options(settings),timeoutMs:0});
}
export function readPreparation(settings,{run=runFinSafe}={}) {
  return run(settings.executable,['prepare','status','--json','--yaml-path',settings.yamlPath],options(settings));
}
