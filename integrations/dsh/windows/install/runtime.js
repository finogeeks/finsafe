import {createHash,randomUUID} from 'node:crypto';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {nativeAdapter} from '../updater/native.js';

export const runtimeFiles=['finsafe.exe','finsafe-desktop.exe','finsafe-service.exe','finsafe-installer-actions.exe',
  'finsafe-uninstall.exe','finsafe_runtime_pipe.dll','finsafe_electron_launch.dll','finsafe_runtime_pipe.manifest.json'];

export function verifyPayload(bytes,sums,name) {
  const matches=sums.split(/\r?\n/).map(line=>/^([a-f0-9]{64})\s+\*?(.+)$/i.exec(line))
    .filter(match=>match?.[2]===name);
  if(matches.length!==1) throw new Error('Expected exactly one official Windows payload checksum');
  if(createHash('sha256').update(bytes).digest('hex')!==matches[0][1].toLowerCase()) throw new Error('FinSAFE payload SHA256 mismatch');
}

/** Stage only verified release bytes. No setup or shared native state changes. */
export async function stageRuntime(destination,version,options={}) {
  if(options.confined) throw new Error('Protected Host cannot install or prepare native FinSAFE; reopen ordinary DSH');
  if(!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('A stable FinSAFE version is required');
  const name=`finshield-${version}-x64-setup.exe`;
  const base=`https://github.com/finogeeks/finsafe/releases/download/v${version}`;
  const responses=await Promise.all([fetch(`${base}/${name}`,{signal:options.signal}),fetch(`${base}/SHA256SUMS`,{signal:options.signal})]);
  for(const response of responses) if(!response.ok) throw new Error(`FinSAFE download returned HTTP ${response.status}`);
  const bytes=Buffer.from(await responses[0].arrayBuffer());
  verifyPayload(bytes,await responses[1].text(),name);
  mkdirSync(destination,{recursive:true});
  const root=mkdtempSync(join(destination,version+'-'));
  writeFileSync(join(root,name),bytes);
  return {version,package:join(root,name)};
}

/** Run the selected full setup after admission. Native setup owns all mutations. */
export async function installRuntime(destination,version,options={}) {
  if(options.confined)throw Error('Protected Host cannot install native FinSAFE');
  const staged=options.staged??await stageRuntime(destination,version,options);
  if(staged.version!==version)throw Error('Staged release differs from requested native target');
  const packagePath=staged.package;
  const operationId=randomUUID();
  const request={version,package:packagePath,operation_id:operationId,
    installation:options.installation || join(process.env.ProgramFiles,'FinSAFE','dsh-plugin'),
    configuration:options.configuration || join(process.env.ProgramData,'FinSAFE','dsh-plugin','config'),
    previousInstallation:options.previousInstallation,
    candidate:options.candidate || fileURLToPath(new URL('../policy/candidate.yaml',import.meta.url)),
    integration_outputs:false,self_update_enabled:false};
  options.onRequest?.(request);
  const result=await (options.execute || (request=>executeSetup(request,options)))(request);
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

export function runProcess(executable,args,options={}) {
  return new Promise((resolve,reject)=>execFile(executable,args,{...options,windowsHide:true,maxBuffer:1024*1024},(error,stdout,stderr)=>{
    if(error && typeof error.code!=='number') return reject(error);
    resolve({code:error?.code || 0,stdout,stderr});
  }));
}

export async function executeSetup(request,{invoke}={}) {
  if(request.self_update_enabled!==false) throw new Error('Plugin setup must disable FinSAFE self-update');
  const call=invoke??nativeAdapter(fileURLToPath(new URL('../',import.meta.url)));
  return call({action:'run_setup',request});
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

export function parseRuntimeArguments(args) {
  const {values}=parseArgs({args,options:Object.fromEntries(
    ['downloads','installation','configuration','pwsh','local-app-data'].map(name=>[name,{type:'string'}]))});
  for(const name of ['downloads','installation','configuration']) {
    if(!values[name]) throw new Error(`Missing --${name}`);
  }
  return {destination:values.downloads,options:{installation:values.installation,
    configuration:values.configuration,pwsh:values.pwsh,localAppData:values['local-app-data']}};
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const version=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
  const {destination,options}=parseRuntimeArguments(process.argv.slice(2));
  process.stdout.write(JSON.stringify(await installRuntime(destination,version,options)));
}
