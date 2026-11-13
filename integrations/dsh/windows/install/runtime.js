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

class DownloadFailure extends Error {}

/** Stage only verified release bytes. No setup or shared native state changes. */
export async function stageRuntime(destination,version,options={}) {
  if(options.confined) throw new Error('Protected Host cannot install or prepare native FinSAFE; reopen ordinary DSH');
  if(!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('A stable FinSAFE version is required');
  const name=`finshield-${version}-x64-setup.exe`;
  const {cdnBaseUrl}=JSON.parse(readFileSync(new URL('./download-source.json',import.meta.url),'utf8'));
  const base=`${cdnBaseUrl.replace(/\/$/,'')}/releases/download/v${version}`;
  async function download(url,format) {
    options.signal?.throwIfAborted();
    const timeout=AbortSignal.timeout(30_000);
    const signal=options.signal?AbortSignal.any([options.signal,timeout]):timeout;
    try {
      const response=await fetch(url,{signal});
      if(!response.ok) throw new DownloadFailure(`FinShield download returned HTTP ${response.status}: ${url}`);
      return await response[format]();
    } catch(error) {
      options.signal?.throwIfAborted();
      if(error instanceof SyntaxError||error instanceof DownloadFailure)throw error;
      throw new DownloadFailure(`FinShield download failed: ${url}: ${error.message}`,{cause:error});
    }
  }
  let bytes;
  try {
    const metadata=await download(`${base}/release.json`,'json');
    const assets=metadata?.version===version&&Array.isArray(metadata.assets)
      ?metadata.assets.filter(asset=>asset?.name===name&&asset.kind==='windows-installer'):[];
    const asset=assets[0];
    const mirrorPrefix=`finshield-${version}-x64-setup-`;
    if(assets.length!==1||typeof asset.mirror_name!=='string'||!asset.mirror_name.startsWith(mirrorPrefix)
      ||!(/^[a-f0-9]{32}\.exe$/).test(asset.mirror_name.slice(mirrorPrefix.length))
      ||!(/^[a-f0-9]{64}$/i).test(asset.sha256)) throw new Error('Invalid FinShield release metadata for requested Windows installer');
    bytes=Buffer.from(await download(`${base}/${asset.mirror_name}`,'arrayBuffer'));
    verifyPayload(bytes,`${asset.sha256}  ${name}`,name);
  } catch(error) {
    if(!(error instanceof DownloadFailure))throw error;
    const github=`https://github.com/finogeeks/finsafe/releases/download/v${version}`;
    try {
      const [payload,sums]=await Promise.all([
        download(`${github}/${name}`,'arrayBuffer'),download(`${github}/SHA256SUMS`,'text')]);
      bytes=Buffer.from(payload);
      verifyPayload(bytes,sums,name);
    } catch(fallbackError) {
      options.signal?.throwIfAborted();
      throw new AggregateError([error,fallbackError],`FinShield CDN and GitHub download failed: ${error.message}; ${fallbackError.message}`);
    }
  }
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
