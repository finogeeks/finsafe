import {createRequire} from 'node:module';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const [action,runtimeRoot,dshHome,...extra]=process.argv.slice(2);
if(!runtimeRoot || !dshHome || extra.length) throw new Error('Expected metadata action, runtime directory and DSH home');
const require=createRequire(join(runtimeRoot,'node_modules','@deepseek-ai','dsh','package.json'));
const yaml=require('yaml');
if(action==='remove-override') {
  const path=join(dshHome,'profiles','desktop','cordis.patch.yml');
  if(existsSync(path)) {
    const doc=yaml.parseDocument(readFileSync(path,'utf8'));
    if(doc.errors.length) throw doc.errors[0];
    if(!yaml.isSeq(doc.contents)) throw new Error('Desktop profile patch must be a sequence');
    for(let index=doc.contents.items.length-1;index>=0;index--) {
      if(doc.contents.items[index]?.toJSON()?.id==='finsafe-windows') doc.deleteIn([index]);
    }
    writeFileSync(path,String(doc));
  }
} else throw new Error('Unknown plugin metadata operation');
