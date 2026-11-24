import { isAbsolute, join } from 'node:path';

/** Derive operation paths. Native owners supply installation and authorization facts. */
export function resolveSettings({localAppData,programFiles,programData,requestedRelease}) {
  const nativeVersionRoot=join(programFiles,'FinSAFE','opencode-plugin-versions');
  const configurationVersionRoot=join(programData,'FinSAFE','opencode-plugin-versions');
  const installation=join(nativeVersionRoot,requestedRelease);
  const configuration=join(configurationVersionRoot,requestedRelease,'config');
  const downloadRoot=join(localAppData,'FinSAFE','opencode-plugin','downloads');
  const result={installation,configuration,downloadRoot,executable:join(installation,'finsafe.exe'),
    yamlPath:join(configuration,'effective.yaml'),nativeVersionRoot,configurationVersionRoot,
    localAppData,downloads:downloadRoot};
  for(const [key,value] of Object.entries(result)) if(!isAbsolute(value)) throw new Error(`${key} must be an absolute path`);
  return result;
}
