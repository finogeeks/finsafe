import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const packageName='@finogeeks/finshield';

export async function loadRemovalRuntime(vendor) {
  const boot=await import(pathToFileURL(vendor.resolve('@deepseek-ai/dsh-app-boot')).href);
  const YAML=vendor('yaml');
  const {writeFileAtomic}=await import(pathToFileURL(vendor.resolve('@deepseek-ai/dsh-atomic-write')).href);
  return {...boot,async enableHmr(profile){
    let text;
    try {text=await readFile(profile.patchPath,'utf8');}
    catch(error){if(error.code!=='ENOENT')throw error;text='[]\n';}
    const doc=YAML.parseDocument(text,{customTags:[{tag:'tag:yaml.org,2002:js',resolve:value=>value}]});
    if(doc.errors.length)throw doc.errors[0];
    if(!YAML.isSeq(doc.contents))throw Error('DSH desktop patch must be a YAML array');
    const rows=doc.contents.items.filter(row=>YAML.isMap(row)&&row.get('id')==='hmr');
    if(rows.length>1)throw Error('Ambiguous DSH HMR entries');
    const row=rows[0]??doc.createNode({id:'hmr'}),previous=row.get('disabled',true),disabled=doc.createNode(false);
    for(const key of ['comment','commentBefore','spaceBefore','anchor'])if(previous?.[key]!==undefined)disabled[key]=previous[key];
    row.set('disabled',disabled);if(!rows.length)doc.contents.add(row);
    await writeFileAtomic(profile.patchPath,doc.toString(),{mode:0o600});
  }};
}

/** Keep DSH's confirmation, authorization, removal checks and pnpm operation. */
export function registerRemoval(ctx,restore,loadBoot) {
  ctx.inject(['pluginManager','loader','profileContext'],scope=>{
    // Use the published binding's service object, not a context-bound facade.
    const manager=scope.get('pluginManager').typertRemote.service;
    const root=scope.root,profile=scope.get('profileContext'),loader=scope.get('loader');
    const previous=Object.getOwnPropertyDescriptor(manager,'removeBundle');
    const remove=manager.removeBundle;
    async function removeBundle(name,...args) {
      if(name===packageName) {
        try {await restore();}
        catch(error){scope.logger.error(`FinShield settings restoration failed: ${error.message}`);}
        if(root.get('hmr')===undefined) {
          const entry=[...loader.entries()].find(row=>row.options.id==='hmr'&&row.options.name==='@deepseek-ai/dsh-hmr');
          if(!entry)throw Error('FinShield removal requires the DSH HMR entry');
          // DSH protects management entries from setPluginEnabled. Change only
          // the desktop flag that plugin Wrap disabled, then use real app-boot.
          const {enableHmr,readProfilePatches,reconcileProfilePatches}=await loadBoot();
          await enableHmr(profile);
          await reconcileProfilePatches(root,readProfilePatches('dsh',profile),'dsh',[entry.options.id]);
          if(root.get('hmr')===undefined)throw Error('FinShield could not activate DSH HMR');
        }
      }
      return Reflect.apply(remove,this,[name,...args]);
    }
    scope.effect(()=>{
      Object.defineProperty(manager,'removeBundle',{configurable:true,writable:true,value:removeBundle});
      return ()=>{
        if(Object.getOwnPropertyDescriptor(manager,'removeBundle')?.value!==removeBundle)return;
        if(previous)Object.defineProperty(manager,'removeBundle',previous);
        else delete manager.removeBundle;
      };
    });
  });
}
