import { join } from 'node:path';

/** Derive plugin paths from the requested release and actual system folders. */
export function resolveSettings({dshHome,localAppData=process.env.LOCALAPPDATA,
  programFiles=process.env.ProgramFiles,programData=process.env.ProgramData,requestedRelease}) {
  const nativeVersionRoot=join(programFiles,'FinSAFE','dsh-plugin-versions');
  const configurationVersionRoot=join(programData,'FinSAFE','dsh-plugin-versions');
  const installation=join(nativeVersionRoot,requestedRelease);
  const configuration=join(configurationVersionRoot,requestedRelease,'config');
  const downloadRoot=join(localAppData,'FinSAFE','dsh-plugin','downloads');
  return {installation,configuration,downloadRoot,executable:join(installation,'finsafe.exe'),
    yamlPath:join(configuration,'effective.yaml'),nativeVersionRoot,configurationVersionRoot,
    stateDirectory:join(dshHome,'finsafe-windows'),localAppData,downloads:downloadRoot};
}
