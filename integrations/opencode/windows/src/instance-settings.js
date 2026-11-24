import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

// Keep discovery under the actual home even when setup results use another root.
export function saveInstanceSettings(settings,home) {
  const directory=join(home,'finsafe-windows');mkdirSync(directory,{recursive:true});
  writeFileSync(join(directory,'config.json'),JSON.stringify(settings));
}

/** Resolve explicit instance inputs. FinSAFE owns identity derivation and receipt formats. */
export function resolveSettings(config, {home,localAppData=process.env.LOCALAPPDATA,
  programFiles=process.env.ProgramFiles,programData=process.env.ProgramData,requestedRelease}) {
  const settingsPath=join(home,'finsafe-windows','config.json');
  const settings={...(existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath,'utf8')) : {}),...config};
  const nativeVersionRoot=settings.nativeVersionRoot||join(programFiles,'FinSAFE','opencode-plugin-versions');
  const configurationVersionRoot=settings.configurationVersionRoot||join(programData,'FinSAFE','opencode-plugin-versions');
  const installation=settings.installation || (requestedRelease?join(nativeVersionRoot,requestedRelease):join(programFiles,'FinSAFE','opencode-plugin'));
  const configuration=settings.configuration || (requestedRelease?join(configurationVersionRoot,requestedRelease,'config'):join(programData,'FinSAFE','opencode-plugin','config'));
  const downloadRoot=settings.downloadRoot||settings.downloads||join(localAppData,'FinSAFE','opencode-plugin','downloads');
  const result={installation,configuration,downloadRoot,executable:join(installation,'finsafe.exe'),
    yamlPath:join(configuration,'effective.yaml'),nativeVersionRoot,configurationVersionRoot,
    stateDirectory:settings.stateDirectory || join(home,'finsafe-windows'),
    localAppData:settings.localAppData || localAppData,
    downloads:settings.downloads || downloadRoot};
  for(const [key,value] of Object.entries(result)) if(!isAbsolute(value)) throw new Error(`${key} must be an absolute path`);
  return result;
}
