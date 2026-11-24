import {join,dirname,isAbsolute} from 'node:path';
import {homedir} from 'node:os';
import {readFileSync} from 'node:fs';
import {resolveSettings as resolveInstanceSettings} from '../src/instance-settings.js';
export const version=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
export function resolveSettings(options={}) {
  const home=join(process.env.XDG_CONFIG_HOME??join(homedir(),'.config'),'opencode');
  const config={nativeVersionRoot:join(process.env.ProgramFiles,'FinSAFE','opencode-plugin-versions'),
    configurationVersionRoot:join(process.env.ProgramData,'FinSAFE','opencode-plugin-versions'),
    downloadRoot:join(process.env.LOCALAPPDATA,'FinSAFE','opencode-plugin','downloads'),...options};
  if(options.finsafe)config.installation=dirname(options.finsafe);
  if(options.yamlPath)config.configuration=dirname(options.yamlPath);
  const settings={...resolveInstanceSettings(config,{home,requestedRelease:version}),home,
    serviceFile:options.serviceFile??join(process.env.XDG_STATE_HOME??join(homedir(),'.local','state'),'opencode','service.json'),
  };
  for(const [key,value] of Object.entries(settings))if(!isAbsolute(value))throw Error(`${key} must be absolute`);
  return settings;
}
