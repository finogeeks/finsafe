import {createHash,randomUUID} from 'node:crypto';
import {submitInstallation,installationResult} from './desktop-channel.js';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {execFile} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';

export const runtimeFiles=['finsafe.exe','finsafe-desktop.exe','finsafe-service.exe','finsafe-installer-actions.exe',
  'finsafe-uninstall.exe','finsafe_runtime_pipe.dll','finsafe_electron_launch.dll','finsafe_runtime_pipe.manifest.json'];

export function verifyPayload(bytes,sums,name) {
  const matches=sums.split(/\r?\n/).map(line=>/^([a-f0-9]{64})\s+\*?(.+)$/i.exec(line))
    .filter(match=>match?.[2]===name);
  if(matches.length!==1) throw new Error('Expected exactly one official Windows payload checksum');
  if(createHash('sha256').update(bytes).digest('hex')!==matches[0][1].toLowerCase()) throw new Error('FinSAFE payload SHA256 mismatch');
}

/** Run the matching full Windows setup. Native setup owns installation and authorization. */
export async function installRuntime(destination,version,options={}) {
  if(!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('A stable FinSAFE version is required');
  const name=`finshield-${version}-x64-setup.exe`;
  const base=`https://github.com/finogeeks/finsafe/releases/download/v${version}`;
  if(options.confined && !options.submit && (!options.executable || !options.record?.id)) {
    throw new Error('A selected native installation is required for Desktop channel');
  }
  const responses=await Promise.all([fetch(`${base}/${name}`),fetch(`${base}/SHA256SUMS`)]);
  for(const response of responses) if(!response.ok) throw new Error(`FinSAFE download returned HTTP ${response.status}`);
  const bytes=Buffer.from(await responses[0].arrayBuffer());
  verifyPayload(bytes,await responses[1].text(),name);
  mkdirSync(destination,{recursive:true});
  const root=mkdtempSync(join(destination,version+'-'));
  writeFileSync(join(root,name),bytes);
  const packagePath=join(root,name);
  const operationId=randomUUID();
  const request={version,package:packagePath,operation_id:operationId,
    installation:options.installation || join(process.env.ProgramFiles,'FinSAFE','dsh-plugin'),
    configuration:options.configuration || join(process.env.ProgramData,'FinSAFE','dsh-plugin','config'),
    candidate:options.candidate || fileURLToPath(new URL('../policy/candidate.yaml',import.meta.url)),
    integration_outputs:false,self_update_enabled:false};
  if(options.confined && options.record) request.resultPath=installationResult(options.localAppData,options.record.id,operationId);
  options.onRequest?.(request);
  if(options.confined) {
    const result=await (options.submit || (request=>submitInstallation(request,{...options,run:options.run || runProcess})))(request);
    return {executable:join(request.installation,'finsafe.exe'),yamlPath:join(request.configuration,'effective.yaml'),
      configuration:request.configuration,pending:true,resultPath:result.resultPath};
  }
  const result=await (options.execute || (request=>executeSetup(request,options)))(request);
  if(![0,3010,1641].includes(result.code)) {
    const error=new Error(`Windows setup returned ${result.code}: ${result.detail || result.stderr || ''}`);
    error.setupCode=result.code;
    throw error;
  }
  return {executable:join(request.installation,'finsafe.exe'),yamlPath:join(request.configuration,'effective.yaml'),
    configuration:request.configuration,exitCode:result.code,
    resultPath:result.resultPath,rebootRequired:result.code!==0};
}

export function runProcess(executable,args) {
  return new Promise((resolve,reject)=>execFile(executable,args,{windowsHide:true,maxBuffer:1024*1024},(error,stdout,stderr)=>{
    if(error && typeof error.code!=='number') return reject(error);
    resolve({code:error?.code || 0,stdout,stderr});
  }));
}

export async function executeSetup(request,{pwsh,run=runProcess}={}) {
  if(!pwsh) throw new Error('PowerShell 7 is required to invoke Windows setup');
  if(request.self_update_enabled!==false) throw new Error('Plugin setup must disable FinSAFE self-update');
  const args=['-NoProfile','-File',fileURLToPath(new URL('./Invoke-Setup.ps1',import.meta.url)),
    '-PackagePath',request.package,'-InstallDirectory',request.installation,
    '-Configuration',request.configuration,'-Candidate',request.candidate];
  if(request.integration_outputs) args.push('-IntegrationOutputs');
  const result=await run(pwsh,args);
  return {...result,resultPath:join(dirname(request.package),'setup-result.json')};
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

/** Resume one recorded attempt before trusting files already replaced by setup. */
export function resumeSetup(state,previous) {
  const observed=observeSetupResult({...state,phase:'installing'},previous.resultPath);
  if(observed.nativeSetup) return {state:observed,blocked:![0,3010,1641].includes(observed.nativeSetup.code),retry:false};
  if(previous.handoff==='not-started' || previous.phase==='started') {
    return {state:{...state,phase:'starting'},blocked:false,retry:true};
  }
  return {state:{...state,phase:'installing',error:previous.error},blocked:!previous.resultPath,waiting:Boolean(previous.resultPath),retry:false};
}

/** Observe an already submitted native task; never submit or repeat it. */
export async function waitForSetup(state,path,{active=()=>true,wait=()=>new Promise(resolve=>setTimeout(resolve,1000)),onState=()=>{}}={}) {
  while(active() && state.phase==='installing') {
    await wait();
    state=observeSetupResult(state,path);
    onState(state);
  }
  return state;
}

export function parseRuntimeArguments(args) {
  const {values}=parseArgs({args,options:Object.fromEntries(
    ['downloads','installation','configuration','pwsh','local-app-data'].map(name=>[name,{type:'string'}]))});
  for(const name of ['downloads','installation','configuration','pwsh']) {
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
