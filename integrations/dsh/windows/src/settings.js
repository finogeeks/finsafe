import {runProcess} from '../install/runtime.js';
import { existsSync, readFileSync, realpathSync, mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

// Keep discovery under the actual home even when setup results use another root.
export function saveInstanceSettings(settings,home) {
  const directory=join(home,'finsafe-windows');mkdirSync(directory,{recursive:true});
  writeFileSync(join(directory,'config.json'),JSON.stringify(settings));
}

/** Resolve explicit instance inputs. FinSAFE owns identity derivation and receipt formats. */
export function resolveSettings(config, {dshHome,localAppData=process.env.LOCALAPPDATA,
  programFiles=process.env.ProgramFiles,programData=process.env.ProgramData,requestedRelease}) {
  const settingsPath=join(dshHome,'finsafe-windows','config.json');
  const settings={...(existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath,'utf8')) : {}),...config};
  const nativeVersionRoot=settings.nativeVersionRoot||join(programFiles,'FinSAFE','dsh-plugin-versions');
  const configurationVersionRoot=settings.configurationVersionRoot||join(programData,'FinSAFE','dsh-plugin-versions');
  const installation=settings.installation || (requestedRelease?join(nativeVersionRoot,requestedRelease):join(programFiles,'FinSAFE','dsh-plugin'));
  const configuration=settings.configuration || (requestedRelease?join(configurationVersionRoot,requestedRelease,'config'):join(programData,'FinSAFE','dsh-plugin','config'));
  const downloadRoot=settings.downloadRoot||settings.downloads||join(localAppData,'FinSAFE','dsh-plugin','downloads');
  const result={installation,configuration,downloadRoot,executable:join(installation,'finsafe.exe'),
    yamlPath:join(configuration,'effective.yaml'),nativeVersionRoot,configurationVersionRoot,
    stateDirectory:settings.stateDirectory || join(dshHome,'finsafe-windows'),
    localAppData:settings.localAppData || localAppData,
    downloads:settings.downloads || downloadRoot};
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
