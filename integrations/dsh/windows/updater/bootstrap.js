import {existsSync,readFileSync,realpathSync} from 'node:fs';
import {mkdir,mkdtemp,readFile,readdir,rename,writeFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {nativeAdapter} from './native.js';
import {protocol,requestBytes} from './protocol.js';

const packageRoot=fileURLToPath(new URL('../',import.meta.url));
export const version=JSON.parse(readFileSync(join(packageRoot,'package.json'),'utf8')).version;

/** Copy this version's scripts/dependencies once; execute DSH's selected Node in place. */
export async function stageUpdater({runtimeRoot,nodeExecutable:node,localAppData}) {
  if(!node) throw Error('DSH did not supply an available Node runtime');
  const root=join(localAppData,'FinSAFE','dsh-updater');
  const stage=join(root,version);
  if(!existsSync(stage)) {
    const require=createRequire(join(runtimeRoot,'package.json'));
    await mkdir(root,{recursive:true});const pending=await mkdtemp(join(root,'.stage-'));
    async function copyDirectory(source,target) {
      await mkdir(target,{recursive:true});
      for(const item of await readdir(source,{withFileTypes:true})) {
        const origin=join(source,item.name),destination=join(target,item.name);
        if(item.isDirectory()) await copyDirectory(origin,destination);
        // Electron's directory cp cannot copy virtual ASAR directories. Its
        // readFile API supports both packed and unpacked dependency files.
        else if(item.isFile()) await writeFile(destination,await readFile(origin));
        else throw Error('Linked staged dependency entry is not supported');
      }
    }
    for(const name of ['updater','src','install','policy','bin']) {
      await copyDirectory(join(packageRoot,name),join(pending,name));
    }
    await writeFile(join(pending,'package.json'),await readFile(join(packageRoot,'package.json')));
    await copyDirectory(dirname(require.resolve('koffi')),join(pending,'node_modules','koffi'));
    const platformPackage=`@koromix/koffi-${process.platform}-${process.arch}`;
    await copyDirectory(dirname(require.resolve(platformPackage)),join(pending,'node_modules',platformPackage));
    try {await rename(pending,stage);}catch(error){if(!existsSync(stage))throw error;}
  }

  return {root:realpathSync.native(root),stage,node:realpathSync.native(node),entry:join(stage,'updater','server.js')};
}

export function connectUpdater(staged,{call=nativeAdapter(staged.stage)}={}) {
  const request=async(operation,fields={},options={})=>{
    const message={protocol,operation,...fields};requestBytes(message);
    const result=await call({action:'request',root:staged.root,request:message,...options});
    if(!result.ok) throw Error(result.error);
    return result.value;
  };
  return {call,request};
}

export async function obtainUpdater(staged,settings,{connect=connectUpdater,start,context,
  now=Date.now,deadlineMs=10000}={}) {
  const connection=connect(staged);
  const old=await connection.call({action:'open_updater_job'});
  const admit=async(deadline,launch)=>{
    const options={deadline,...(launch?{launch}: {})};
    await connection.request('hello',{},options);
    if(context){const decision=await connection.request('admit',{context},options);connection.period=decision.period;connection.startupError=decision.error;}
    connection.admitted=true;
  };
  if(old.job) {
    try {
      await admit(now()+deadlineMs);
    }catch(error) {
      await connection.call({action:'recover_updater_job',job:old.job});
    }
    if(connection.admitted) {
      await connection.call({action:'close_updater_job',job:old.job});
      return connection;
    }
  }
  const deadline=now()+deadlineMs;
  const launched=await (start??(request=>connection.call({action:'bootstrap',...request})))({
    node:staged.node,entry:staged.entry,deadline,
    installation:settings.installation,configuration:settings.configuration});
  try {
    await admit(deadline,launched.launch);
  }catch(error) {
    try {await connection.call({action:'stop_updater_launch',launch:launched.launch});}
    catch(cleanup){throw new AggregateError([error,cleanup],`${error.message}; startup cleanup: ${cleanup.message}`);}
    throw error;
  }
  await connection.call({action:'release_updater_launch',launch:launched.launch});
  return connection;
}
