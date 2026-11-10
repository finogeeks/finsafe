import {join} from 'node:path';

export function installationResult(localAppData,recordId,operationId) {
  return join(localAppData,'FinSAFE','instances',recordId,'installations',operationId,'setup-result.json');
}

/** Ordinary Windows drive path only; do not normalize network/device input. */
export function isOrdinaryInstallationPath(path) {
  return typeof path==='string' && path.length>3 && /^[a-zA-Z]:\\/.test(path)
    && !/[<>:"/|?*\x00-\x1f]/.test(path.slice(3));
}

/** The confined native client selects its own pipe and retains its Windows token. */
export async function submitInstallation(request,{executable,record,localAppData,run}) {
  if(!isOrdinaryInstallationPath(request.package) || !isOrdinaryInstallationPath(request.candidate)) {
    const error=new Error('Ordinary drive-absolute package and candidate paths are required');
    error.handoff='not-started';
    throw error;
  }
  let result;
  try { result=await run(executable,['desktop-channel','install','--version',request.version,
    '--package',request.package,'--candidate',request.candidate,'--operation-id',request.operation_id]); }
  catch(error) {
    error.handoff=['ENOENT','EACCES','EPERM'].includes(error.code)?'not-started':'unconfirmed';
    throw error;
  }
  let response;
  try { response=JSON.parse(result.stdout); }
  catch {
    const error=new Error(`Desktop channel returned no valid result: ${result.stderr || result.code}`);
    error.handoff='unconfirmed';
    throw error;
  }
  if(result.code || response.phase!=='handed-off') {
    const error=new Error(response.detail || 'Desktop channel rejected installation');
    error.handoff=response.handoff || (response.phase==='failed'?'not-started':'unconfirmed');
    throw error;
  }
  if(response.resultPath!==installationResult(localAppData,record.id,request.operation_id)) {
    const error=new Error('Desktop channel returned another installation result');
    error.handoff='unconfirmed';
    throw error;
  }
  return response;
}
