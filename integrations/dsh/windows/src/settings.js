import {runProcess} from '../install/runtime.js';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, join, delimiter } from 'node:path';

export const securityDomain = 'finshield.dsh';

export function findPowerShell(programFiles = process.env.ProgramFiles) {
  const candidates = [join(programFiles || 'C:\\Program Files','PowerShell','7','pwsh.exe'),
    ...(process.env.PATH || '').split(delimiter).filter(Boolean).map(directory=>join(directory,'pwsh.exe'))];
  const found = candidates.find(existsSync);
  if (!found) throw new Error('Install PowerShell 7 or configure its absolute pwsh path');
  return found;
}

/** Resolve explicit instance inputs. FinSAFE owns identity derivation and receipt formats. */
export function resolveSettings(config, {dshHome,localAppData=process.env.LOCALAPPDATA,
  programFiles=process.env.ProgramFiles,programData=process.env.ProgramData,findPwsh=findPowerShell}) {
  const settingsPath=join(dshHome,'finsafe-windows','config.json');
  const settings={...(existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath,'utf8')) : {}),...config};
  const installation=settings.installation || join(programFiles,'FinSAFE','dsh-plugin');
  const configuration=settings.configuration || join(programData,'FinSAFE','dsh-plugin','config');
  const result={installation,configuration,executable:join(installation,'finsafe.exe'),
    yamlPath:join(configuration,'effective.yaml'),
    stateDirectory:settings.stateDirectory || join(dshHome,'finsafe-windows'),
    localAppData:settings.localAppData || localAppData,
    downloads:settings.downloads || join(localAppData,'FinSAFE','dsh-plugin','downloads'),
    pwsh:settings.pwsh || findPwsh(programFiles)};
  for(const [key,value] of Object.entries(result)) if(!isAbsolute(value)) throw new Error(`${key} must be an absolute path`);
  return result;
}

/** Read the selected native record. The installer owns registry selection and repair. */
export async function hasPluginInstallation(settings,{run=runProcess}={}) {
  return Boolean(await readPluginInstallation(settings,{run}));
}

export async function readPluginInstallation(settings,{run=runProcess}={}) {
  try {
    let result;
    try {
      result=await run(join(settings.installation,'finsafe-installer-actions.exe'),
        ['instance-info',settings.installation]);
    } catch(error) { if(error.code==='ENOENT') return false; throw error; }
    if(result.code) return false;
    const info=JSON.parse(result.stdout);
    if(typeof info.id!=='string' || !info.id || info.self_update_enabled!==false || info.integrations!==false || !info.config || !info.update_config) return false;
    const matching=realpathSync.native(info.config)===realpathSync.native(settings.configuration)
      && realpathSync.native(info.update_config)===realpathSync.native(join(settings.configuration,'update.json'));
    return matching ? info : false;
  } catch(error) { if(error.code==='ENOENT') return false; throw error; }
}
