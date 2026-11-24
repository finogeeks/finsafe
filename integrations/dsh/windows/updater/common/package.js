import {readFileSync,existsSync} from 'node:fs';
import {mkdir,mkdtemp,readdir,readFile,writeFile,rename,stat,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {join,isAbsolute,dirname,resolve} from 'node:path';

const sdkName='@finogeeks2026/finsafe-sdk';

/** All plugin loaders use this package's version and its own SDK path. */
export function packageSdk(root,{sourceRoot=root}={}) {
  const read=directory=>JSON.parse(readFileSync(join(directory,'package.json'),'utf8'));
  const plugin=read(root);
  const sdkRoot=join(sourceRoot,'node_modules',sdkName);
  return {root:sdkRoot,version:plugin.version,
    load:()=>createRequire(join(root,'package.json'))(join(sdkRoot,'src','native.js'))};
}

/** Stage the complete delivered package. One atomic directory per release. */
export async function stagePluginPackage(source,base,{sdkSourceRoot=source,overrides={}}={}) {
  const packaged=packageSdk(source,{sourceRoot:sdkSourceRoot});
  const manifest=JSON.parse(readFileSync(join(source,'package.json'),'utf8'));
  const target=join(base,packaged.version);
  if(existsSync(target)){packageSdk(target);return target;}
  await mkdir(base,{recursive:true});const pending=await mkdtemp(join(base,'.stage-'));
  async function copy(from,to){
    await mkdir(to,{recursive:true});
    for(const item of await readdir(from,{withFileTypes:true})){
      const origin=join(from,item.name),destination=join(to,item.name);
      if(item.isDirectory())await copy(origin,destination);
      else if(item.isFile())await writeFile(destination,await readFile(origin));
      else throw Error('Linked staged package entry is unsupported');
    }
  }
  try {for(const name of new Set([...manifest.files,'package.json','release.json'])){
    if(isAbsolute(name)||name.split(/[\\/]/).includes('..'))throw Error('Invalid package delivery path');
    const origin=join(name==='release.json'?sdkSourceRoot:source,name),destination=join(pending,name);
    if(!existsSync(origin))continue;
    // A files entry can select a nested file or a directory; readFile is also
    // supported by Electron for packaged virtual files.
    if((await stat(origin)).isDirectory())await copy(origin,destination);
    else {await mkdir(join(destination,'..'),{recursive:true});await writeFile(destination,await readFile(origin));}
  }
  for(const [targetName,sourceName] of Object.entries(overrides)){
    const destination=join(pending,targetName);await mkdir(dirname(destination),{recursive:true});
    await writeFile(destination,await readFile(join(source,sourceName)));
  }
  await copy(packaged.root,join(pending,'node_modules',sdkName));
  try{await rename(pending,target);}catch(error){if(!existsSync(target))throw error;}
  packageSdk(target);return target;
  }finally{
    if(dirname(resolve(pending))!==resolve(base))throw Error('Invalid package staging cleanup path');
    await rm(pending,{recursive:true,force:true});
  }
}
