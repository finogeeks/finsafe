const copy={
  en:{exitUnavailable:'Close OpenCode and open it again to apply the prepared update.',
    exitReminder:'Save your work first. This action exits OpenCode. Open it manually to use the prepared protection.',
    arena:'How FinShield protects you',about:'FinShield website',feedback:'Feedback',
    packageUpdateAvailable:'FinShield update available',packageUpdate:'Install update',packageUpdating:'Installing update…',
    packageUpdateInstalled:'FinShield plugin package updated',packageUpdateReload:'Waiting for the new plugin to load. If it does not load automatically, close OpenCode and open it manually.',
    packageUpdateResult:'Check FinShield for the loaded plugin and preparation result.',
    loadedPlugin:'Loaded plugin',failureReason:'FinShield preparation did not finish',
    packageUpdateCurrent:'OpenCode did not report a FinShield update',packageUpdateCheckFailed:'Could not check for FinShield updates',
    packageUpdateFailed:'Could not update FinShield',
    migrationNotice:''},
  zh:{exitUnavailable:'请关闭 OpenCode 后重新打开，以应用准备好的更新。',
    exitReminder:'请先保存工作。此操作将退出 OpenCode；退出后请手动重新打开以启用防护。',
    about:'FinShield 官网',feedback:'反馈问题',
    packageUpdateAvailable:'发现 FinShield 新版本',packageUpdate:'安装更新',packageUpdating:'正在安装更新…',
    packageUpdateInstalled:'FinShield 插件包已更新',packageUpdateReload:'等待新版插件加载。如未自动加载，请手动关闭并重新打开 OpenCode。',
    packageUpdateResult:'请在 FinShield 页面查看已加载插件和防护准备结果。',
    loadedPlugin:'已加载插件',failureReason:'FinShield 准备未完成的原因',
    packageUpdateCurrent:'OpenCode 未报告 FinShield 更新',packageUpdateCheckFailed:'无法检查 FinShield 更新',
    packageUpdateFailed:'FinShield 更新失败',
    migrationNotice:''},
};

// The outgoing Host can publish a GUI before startup receipt admission finishes.
// Publish the sidebar entry only after that decision, then keep its identity.
export function registerProtectionPage(store,register){
  let registered=false,awaitingDecision=false;
  const update=()=>{
    const status=store.getSnapshot().status;
    if(registered||!status)return;
    if(['loading','starting'].includes(status.phase)&&status.currentProtected!==true&&!status.error){awaitingDecision=true;return;}
    // A lost RPC during Host replacement is not a native startup result.
    if(awaitingDecision&&(!status.phase||status.phase==='failed')&&status.currentProtected===undefined)return;
    registered=true;register();
  };
  const stop=store.subscribe(update);update();return stop;
}

export function translator(messages,locale,status){
  return key=>{
    const language=locale().startsWith('zh')?'zh':'en';
    return copy[language][key]??messages[language][key]??key;
  };
}

// The OpenCode protection store owns readiness and Later. Use a native
// OpenCode toast; do not introduce another task or reminder state machine.
export function observeReminder({store,t,show,openPage}){
  let toast,reminder;
  const update=()=>{
    const snapshot=store.getSnapshot();
    if(!snapshot.notice||snapshot.pageVisible||snapshot.status?.phase!=='ready'){
      toast?.dismiss();toast=undefined;reminder=undefined;return;
    }
    if(toast&&reminder===snapshot.status.reminderId)return;
    toast?.dismiss();reminder=snapshot.status.reminderId;
    const update=snapshot.status.reason==='update';
    toast=show({title:t(update?'updateReady':'noticeTitle'),description:t(update?'updateReadyBody':'noticeBody'),persistent:true,
      actions:[{label:t('exit'),run:()=>{void store.exit().catch(()=>{});}},
        {label:t('later'),run:()=>{void store.dismiss();}},
        {label:t('details'),run:openPage}]});
  };
  const unsubscribe=store.subscribe(update);update();
  return ()=>{unsubscribe();toast?.dismiss();};
}

const packageName='@finogeeks2026/finshield-opencode';

export function createPackageUpdates({getClient,t,show,signal,version,handoff}) {
  const options={signal};
  let disposed=false,checkTask,updateTask,available,notice;
  let snapshot={target:undefined,installing:false};
  const listeners=new Set();
  const publish=(target,installing=false,fromVersion=snapshot.fromVersion)=>{
    if(snapshot.target===target&&snapshot.installing===installing&&snapshot.fromVersion===fromVersion)return;
    snapshot={target,installing,...(fromVersion!==undefined?{fromVersion}:{})};
    for(const listener of listeners)listener();
  };
  const active=()=>!disposed&&!signal?.aborted;
  const installed=()=>show({title:t('packageUpdateInstalled'),description:t('packageUpdateResult'),persistent:true});
  const previous=handoff?.read();
  if(active()&&previous&&previous!==version) {
    publish(undefined,false,previous);
    handoff.write(undefined);
    installed();
  }

  function update(target) {
    if(!active())return;
    updateTask??=(async()=>{
      publish(target,true);
      try {
        handoff?.write(version);
        await getClient().plugin.update({targets:[target]},options);
        if(active()){
          available=undefined;publish(undefined,false,version);notice?.dismiss();installed();
        }
      } catch(error) {
        if(active()) {
          handoff?.write(undefined);
          available=undefined;
          publish(target);
          show({title:t('packageUpdateFailed'),description:String(error.message??error),variant:'error'});
        }
      }
    })().finally(()=>{updateTask=undefined;});
    return updateTask;
  }

  async function check(manual) {
    try {
      const client=getClient();
      const {data}=await client.plugin.list(undefined,options);
      const source=data.find(plugin=>plugin.id==='finshield.opencode'&&plugin.source.type==='package')?.source;
      const target=source?.target;
      if(!active())return;
      if(!(target===packageName||target?.startsWith(`${packageName}@`))){
        available=undefined;publish(undefined);notice?.dismiss();return;
      }
      const checked=await client.plugin.check({target},options);
      if(!active())return;
      const outdated=checked.data.some(plugin=>plugin.source.type==='package'&&plugin.source.target===target&&plugin.source.outdated);
      if(!outdated) {
        notice?.dismiss();
        available=undefined;
        publish(undefined);
        if(manual)show({title:t('packageUpdateCurrent')});
        return;
      }
      const candidate=`${target}:${source.version??''}`;
      if(!manual&&available===candidate)return;
      notice?.dismiss();
      available=candidate;
      publish(target);
      notice=show({title:t('packageUpdateAvailable'),persistent:true,
        actions:[{label:t('packageUpdate'),run:()=>update(target)},{label:t('later'),run:()=>{}}]});
    } catch(error) {
      if(active()&&manual)show({title:t('packageUpdateCheckFailed'),description:String(error.message??error),variant:'error'});
    }
  }

  return {
    getSnapshot:()=>snapshot,
    subscribe(listener){listeners.add(listener);return ()=>listeners.delete(listener);},
    install(){if(active()&&snapshot.target)return update(snapshot.target);},
    check({manual=false}={}) {
      if(!active()||updateTask)return;
      checkTask??=check(manual).finally(()=>{checkTask=undefined;});
      return checkTask;
    },
    dispose(){disposed=true;notice?.dismiss();listeners.clear();},
  };
}
