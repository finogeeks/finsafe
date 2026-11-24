import {Plugin,SettingsPage} from '@opencode/plugin/gui';
import {onMount,onCleanup,createEffect} from 'solid-js';
import React from 'react';
import {createRoot} from 'react-dom/client';
import page from '../ui/page.cjs';
import model from '../ui/state.cjs';
import {version} from '../package.json';
import {Management} from './contract.js';
import {attachDesktop,createEndpointAttachment} from './desktop.js';
import {DesktopAttachment} from './desktop-contract.js';

import {translator,observeReminder,createPackageUpdates,registerProtectionPage} from './presentation.js';

export default Plugin.define({os:['windows'],main:attachDesktop,setup(ctx){
  const desktop=ctx.main(DesktopAttachment);
  const reattach=createEndpointAttachment({attach:()=>desktop.attach(),
    report:(error:Error)=>ctx.toast.show({title:'FinShield',description:error.message})});
  createEffect(()=>{reattach(ctx.servers.get('sidecar'));});
  const findLocalClient=()=>ctx.servers.list().map(id=>ctx.servers.get(id)).find(server=>server?.builtin)?.client;
  const localClient=()=>{
    const client=findLocalClient();
    if(!client)throw Error('OpenCode local backend is unavailable');
    return client;
  };
  const invoke=async(method:string,fields:object={})=>(localClient().rpc(Management) as any)[method](fields, {signal:ctx.signal});
  const store=model.createProtectionStore(()=>invoke('status'),()=>invoke('exit'),()=>invoke('later'));
  const t=translator(page.messages,()=>ctx.locale.locale(),()=>store.getSnapshot().status);
  const stopReminder=observeReminder({store,t,show:notice=>ctx.toast.show(notice),openPage:()=>ctx.layout.settings('protection')});
  onCleanup(stopReminder);
  const [pendingUpdate,setPendingUpdate]=ctx.storage.memory<{fromVersion?:string}>('package-update',{initial:{}});
  const handoff={read:()=>pendingUpdate.fromVersion,
    write:(fromVersion:string|undefined)=>setPendingUpdate(draft=>{draft.fromVersion=fromVersion;})};
  const updates=createPackageUpdates({getClient:localClient,t,show:notice=>ctx.toast.show(notice),signal:ctx.signal,version,handoff});
  let active=true,timer:ReturnType<typeof setTimeout>,updateTimer:ReturnType<typeof setInterval>|undefined;
  const tick=async()=>{
    if(!updateTimer&&findLocalClient()){
      void updates.check();
      updateTimer=setInterval(()=>void updates.check(),60*60*1000);
    }
    if(findLocalClient())await store.refresh();
    if(active)timer=setTimeout(tick,2000);
  };
  void tick();
  onCleanup(()=>{active=false;clearTimeout(timer);clearInterval(updateTimer);updates.dispose();});
  const render=()=>{
    const element=document.createElement('div');
    createEffect(()=>{element.dataset.finshieldTheme=ctx.appearance.mode();});
    onMount(()=>{
      const root=createRoot(element);
      root.render(React.createElement(page.ProductPage,{t,store,
        work:()=>ctx.commands.run('common.goBack'),updates}));
      onCleanup(()=>root.unmount());
    });
    return element;
  };
  const stopPage=registerProtectionPage(store,()=>ctx.add(SettingsPage,{id:'protection',title:'FinShield',icon:'shield',render}));
  onCleanup(stopPage);
}});
