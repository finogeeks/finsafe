import {join,isAbsolute} from 'node:path';
import {homedir} from 'node:os';
import {readFileSync} from 'node:fs';
import {resolveSettings as resolveInstanceSettings} from '../src/instance-settings.js';
export const version=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
export function resolveSettings(options={},folders={programFiles:process.env.ProgramFiles,
  programData:process.env.ProgramData,localAppData:process.env.LOCALAPPDATA}) {
  const home=join(process.env.XDG_CONFIG_HOME??join(homedir(),'.config'),'opencode');
  const settings={...resolveInstanceSettings({...folders,requestedRelease:version}),home,
    serviceFile:options.serviceFile??join(process.env.XDG_STATE_HOME??join(homedir(),'.local','state'),'opencode','service.json'),
  };
  for(const [key,value] of Object.entries(settings))if(!isAbsolute(value))throw Error(`${key} must be absolute`);
  return settings;
}
