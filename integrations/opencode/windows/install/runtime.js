import {downloadInstaller} from '../updater/common/download.js';
export {verifyPayload} from '../updater/common/download.js';
import {randomUUID} from 'node:crypto';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

export const runtimeFiles=['finsafe.exe','finsafe-desktop.exe','finsafe-service.exe','finsafe-installer-actions.exe',
  'finsafe-uninstall.exe','finsafe_runtime_pipe.dll','finsafe_electron_launch.dll','finsafe_runtime_pipe.manifest.json'];

/** Stage only verified release bytes. No setup or shared native state changes. */
export async function stageRuntime(destination,version,options={}) {
  if(options.confined) throw new Error('Protected Host cannot install or prepare native FinSAFE; reopen ordinary OpenCode');
  if(!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('A stable FinSAFE version is required');
  const name=`finshield-${version}-x64-setup.exe`;
  const {cdnBaseUrl}=JSON.parse(readFileSync(new URL('./download-source.json',import.meta.url),'utf8'));
  const bytes=await downloadInstaller(version,cdnBaseUrl,options);
  mkdirSync(destination,{recursive:true});
  const root=mkdtempSync(join(destination,version+'-'));
  writeFileSync(join(root,name),bytes);
  return {version,package:join(root,name)};
}

/** Run the selected full setup after admission. Native setup owns all mutations. */
export async function installRuntime(destination,version,options={}) {
  if(options.confined)throw Error('Protected Host cannot install native FinSAFE');
  if(!options.execute||!options.installation||!options.configuration||!options.candidate)
    throw Error('OpenCode setup requires an SDK-bound target and its staged Candidate');
  const staged=options.staged??await stageRuntime(destination,version,options);
  if(staged.version!==version)throw Error('Staged release differs from requested native target');
  const packagePath=staged.package;
  const operationId=randomUUID();
  const request={version,package:packagePath,operation_id:operationId,
    installation:options.installation,configuration:options.configuration,
    previousInstallation:options.previousInstallation,
    candidate:options.candidate,
    integration_outputs:false,self_update_enabled:false};
  options.onRequest?.(request);
  const result=await options.execute(request);
  if(![0,3010,1641].includes(result.code)) {
    const error=new Error(`Windows setup returned ${result.code}: ${result.detail || result.stderr || ''}`);
    error.setupCode=result.code;
    const observed=observeSetupResult({phase:'installing'},result.resultPath);
    error.result={...observed,phase:observed.nativeSetup?observed.phase:'failed',
      error:observed.error||error.message,nativeSetup:observed.nativeSetup??{code:result.code}};
    throw error;
  }
  return {executable:join(request.installation,'finsafe.exe'),yamlPath:join(request.configuration,'effective.yaml'),
    configuration:request.configuration,exitCode:result.code,
    resultPath:result.resultPath,retainedWorker:result.retainedWorker,rebootRequired:result.code!==0};
}

/** Native setup owns terminal outcomes. Reading one result does not retry setup or authorize. */
export function observeSetupResult(state,path) {
  if(!path || !existsSync(path)) return state;
  const result=JSON.parse(readFileSync(path,'utf8'));
  if(!Number.isInteger(result.code) || !['completed','cancelled','failed','reboot-required'].includes(result.phase)) {
    throw new Error('Invalid native setup result');
  }
  return {...state,...(state.phase==='installing'?{phase:result.phase,error:result.detail || undefined}:{}),nativeSetup:result};
}
