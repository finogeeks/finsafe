// Browser source. build-client.mjs embeds the state model, Remote contract and logo.
const React=require('react');
const h=React.createElement;
const {projectStatus,createProtectionStore}=PROTECTION_MODEL;
const NS='finshield.windows';
const PRODUCT_URL='https://safety.finaios.ai/';
const PACKAGE_NAME='@finogeeks2026/finshield';
const zh={
  title:'FinShield',loading:'正在读取防护状态',loadingFirst:'正在连接FinShield',loadingSecond:'',loadingBody:'请稍候，防护状态以本次读取结果为准',
  authorizing:'正在准备防护',installing:'正在安装防护组件',authorizingFirst:'首次设好安全边界，日常打开直接用',authorizingSecond:'',
  authorizingBody:'为DSH配置安全隔离规则，约束AI对电脑的访问与操作。完成后，日常启动无需重复准备。',authorizationTitle:'为什么需要管理员确认',authorizationBody:'FinShield需要管理员权限来配置Windows隔离规则，让DSH按设定的访问边界运行',authorizationAction:'出现Windows权限提示时，核对程序信息后选择“是”。',notProtected:'当前会话尚未受保护',
  updating:'正在准备更新',updatingFirst:'让AI做事，别让它惹事',updatingSecond:'',updatingBody:'安装并配置新版本防护，完成后会提醒你重启。',updateTitle:'更新期间需要做什么',updateBody:'更新所需的下载、安装和授权会在准备阶段完成',updateAction:'出现Windows权限提示时，核对程序信息后选择“是”。',updateReady:'更新已就绪',updateReadyFirst:'新版本已就绪，重启即可切换',updateReadySecond:'',updateReadyBody:'新版本已安装并完成配置，重启DSH后生效。',currentProtected:'当前会话已受保护',authorizationPending:'目标授权待完成',downloading:'正在下载更新包',
  ready:'防护已就绪',readyFirst:'准备就绪，重启后开启防护',readySecond:'',readyBody:'安全隔离规则已配置完成，重启DSH后生效。',restartTitle:'为什么需要重启',restartBody:'DSH将进入已配置的防护环境，使访问限制生效',restartAction:'现在不方便重启？选择“稍后重启”继续工作，当前会话尚未受保护',
  protected:'防护已开启',protectedFirst:'让AI做事，别让它惹事',protectedSecond:'',protectedBody:'',
  restarting:'正在重启DSH',restartingFirst:'正在重新打开DSH',restartingSecond:'请稍候',restartingBody:'新会话启动后，将重新读取实际防护状态',
  failed:'准备未完成',failedFirst:'防护准备未完成',failedSecond:'',failedBody:'DSH可以继续使用。请查看下方原因，或向我们反馈。',cancelled:'授权未完成',cancelledFirst:'这次授权未完成',cancelledSecond:'',cancelledBody:'DSH仍可继续使用',cancelledTitle:'为什么没有完成',cancelledExplanation:'本次授权已取消，防护设置尚未完成',cancelledAction:'需要完成授权并重启DSH后，防护才会生效',
  privacy:'隐私别乱碰',privacyBody:'约束摄录和截屏操作',interaction:'电脑别乱控',interactionBody:'限制窗口和鼠标干扰',system:'系统别乱改',systemBody:'限制进程与系统改动',data:'数据别乱动',dataBody:'保护敏感目录和文件',
  arena:'了解FinShield如何守护你',arenaUrl:'https://safety.finaios.ai/agents/dsh/zh-CN',productLink:'访问FinShield官网（新窗口打开）',work:'返回DSH，继续工作',startWork:'返回DSH，开始工作',progress:'查看准备步骤',installed:'插件安装完成',nativePreparing:'正在配置安全权限',waiting:'准备完成后，由你决定何时重启DSH',
  resume:'DSH可照常使用，无需在此等待；准备好后会提醒你重启。',restartReminder:'请先保存工作，重启DSH会中断当前任务。暂时不重启，也可以继续使用DSH。',failureReason:'未完成的原因',updateFailure:'本次更新未完成',feedback:'到GitHub反馈问题 ↗',
  restart:'重启DSH',later:'稍后',laterRestart:'稍后重启',details:'查看详情',noticeTitle:'防护已就绪，重启后开启',noticeBody:'请先保存工作，DSH重启时会中断当前任务',
  refresh:'重新读取状态',setupFailed:'组件安装失败，错误码',jobFailure:'会话进程管理未完成',jobFailureBody:'未能将DSH加入FinShield的会话进程组，授权进度与此错误分别显示',technicalDetails:'技术详情',afterRestart:'重启后开启防护',
  marketUpdate:'更新到',marketInstalled:'已安装',marketNewer:'已安装较新版本',marketConfirm:'更新FinShield',marketFrom:'当前版本',marketSource:'下载源',marketStart:'开始更新',marketUpdating:'正在更新插件',marketDone:'插件包已更新。防护状态请查看防护页。',marketFailed:'插件更新未完成',marketClose:'关闭',marketCancel:'取消',
};
const en={
  title:'FinShield',loading:'Reading protection status',loadingFirst:'Connecting to FinShield',loadingSecond:'',loadingBody:'Please wait for the current session status',
  authorizing:'Preparing protection',installing:'Installing protection components',authorizingFirst:'Set boundaries once. Reuse them every day.',authorizingSecond:'',authorizingBody:'Configure isolation rules for DSH to limit AI access and actions on your computer. Daily launches reuse this setup.',authorizationTitle:'Why administrator consent is needed',authorizationBody:'FinShield needs administrator permission to configure Windows isolation rules so DSH runs within the selected access boundaries',authorizationAction:'If Windows asks for permission, check the program details, then select Yes.',notProtected:'Current session is not protected yet',
  updating:'Preparing an update',updatingFirst:'Let AI work. Keep trouble out.',updatingSecond:'',updatingBody:'Installing and configuring the update. We will notify you to restart when ready.',updateTitle:'What to do during the update',updateBody:'Download, installation and authorization finish during preparation',updateAction:'If Windows asks for permission, check the program details, then select Yes.',updateReady:'Update ready',updateReadyFirst:'Update ready. Restart to switch.',updateReadySecond:'',updateReadyBody:'The new version is installed and configured. Restart DSH to apply it.',currentProtected:'Current session is protected',authorizationPending:'Target authorization pending',downloading:'Downloading the update',
  ready:'Protection ready',readyFirst:'Ready. Restart to enable protection.',readySecond:'',readyBody:'Isolation rules are configured. Restart DSH to apply them.',restartTitle:'Why restart?',restartBody:'DSH will enter the configured protected environment and the access limits will take effect',restartAction:'Choose Restart later to keep working; protection is not enabled for the current session yet',
  protected:'Protection is enabled',protectedFirst:'Let AI work. Keep trouble out.',protectedSecond:'',protectedBody:'',
  restarting:'Restarting DSH',restartingFirst:'Opening DSH again',restartingSecond:'Please wait',restartingBody:'We will read the actual protection status when the new session starts',
  failed:'Setup incomplete',failedFirst:'Protection setup is incomplete',failedSecond:'',failedBody:'You can keep using DSH. See the reason below or report the issue.',cancelled:'Authorization incomplete',cancelledFirst:'Authorization did not finish',cancelledSecond:'',cancelledBody:'You can keep using DSH',cancelledTitle:'Why preparation did not finish',cancelledExplanation:'Authorization was cancelled before protection setup finished',cancelledAction:'Complete authorization and restart DSH to enable protection',
  privacy:'Privacy',privacyBody:'Limit recording & screenshots.',interaction:'Controls',interactionBody:'Limit window & mouse use.',system:'System',systemBody:'Limit processes & settings.',data:'Data',dataBody:'Protect sensitive files.',
  arena:'See how FinShield protects you',arenaUrl:'https://safety.finaios.ai/agents/dsh/index.html',productLink:'Visit the FinShield website (opens in a new window)',work:'Continue working in DSH',startWork:'Start working in DSH',progress:'View setup steps',installed:'Plugin installed',nativePreparing:'Configuring security permissions',waiting:'You choose when to restart after preparation',
  resume:'Keep using DSH. No need to stay here; we will notify you to restart when ready.',restartReminder:'Save your work before restarting DSH; running tasks will be interrupted. You can restart later and keep using DSH.',failureReason:'Why setup did not finish',updateFailure:'Update did not finish',feedback:'Report an issue on GitHub ↗',
  restart:'Restart DSH',later:'Later',laterRestart:'Restart later',details:'View details',noticeTitle:'Protection is ready; restart to enable it',noticeBody:'Save your work first; restarting DSH interrupts current tasks',
  refresh:'Read status again',setupFailed:'Component installation failed with code',jobFailure:'Session process management is incomplete',jobFailureBody:'DSH could not join the FinShield session process group; authorization progress is shown separately',technicalDetails:'Technical details',afterRestart:'Protection starts after restart',
  marketUpdate:'Update to',marketInstalled:'Installed',marketNewer:'A newer version is installed',marketConfirm:'Update FinShield',marketFrom:'Current version',marketSource:'Download source',marketStart:'Start update',marketUpdating:'Updating plugin',marketDone:'The plugin package is updated. Check the protection page for its status.',marketFailed:'Plugin update did not finish',marketClose:'Close',marketCancel:'Cancel',
};
const styles=`
[data-plugin-detail="@finogeeks2026/finshield"],.finshield-page{--fs-line:#e5e7eb;--fs-paper:#fff;--fs-subtle:#f7f7f8;--fs-ink:#202020;--fs-muted:#646970;--fs-brand:#005fb8;--fs-green:#107c41;--fs-blue-bg:#edf5fc;--fs-warning:#925400;--fs-shadow:#20202014;font:14px/1.6 "Microsoft YaHei UI",sans-serif;color:var(--fs-ink)}
body[data-ds-dark-theme] :is([data-plugin-detail="@finogeeks2026/finshield"],.finshield-page){--fs-line:#343b45;--fs-paper:#171a1f;--fs-subtle:#12151a;--fs-ink:#edf1f4;--fs-muted:#b2b9c3;--fs-brand:#8dc8ff;--fs-green:#91d8b8;--fs-blue-bg:#202f3c;--fs-warning:#e5bc80;--fs-shadow:#00000042}
/* DSH owns these controls. Scope the compact prototype layout to this bundle. */
[data-plugin-detail="@finogeeks2026/finshield"]{display:grid;grid-template-columns:43px minmax(0,1fr) auto;column-gap:10px}
[data-plugin-detail="@finogeeks2026/finshield"] *{font-family:inherit;font-size:inherit}
[data-plugin-detail="@finogeeks2026/finshield"]>*{grid-column:1/-1}
[data-plugin-detail="@finogeeks2026/finshield"]>[data-window-drag],[data-plugin-detail="@finogeeks2026/finshield"]>[data-window-drag]>div{display:contents}
[data-plugin-detail="@finogeeks2026/finshield"]>[data-window-drag]>button{grid-column:1/-1;justify-self:start;margin-bottom:12px;font:inherit}
[data-plugin-detail="@finogeeks2026/finshield"]>[data-window-drag]>div>span{grid-column:1;grid-row:2;width:43px;height:43px;border:0;border-radius:0}
[data-plugin-detail="@finogeeks2026/finshield"]>[data-window-drag]>div>div{grid-column:3;grid-row:2;gap:12px}
[data-plugin-detail="@finogeeks2026/finshield"]>[data-window-drag]+div{grid-column:2;grid-row:2;margin:0;gap:5px}
[data-plugin-detail="@finogeeks2026/finshield"]>[data-window-drag]+div h3{font:500 18px/1.3 "Microsoft YaHei UI",sans-serif}
[data-plugin-detail="@finogeeks2026/finshield"]>[data-window-drag]+div p,[data-plugin-detail="@finogeeks2026/finshield"] [data-plugin-name]{font:inherit;color:var(--fs-muted)}
[data-plugin-detail="@finogeeks2026/finshield"]>[data-window-drag]+div>p:not(:has(>[data-plugin-name])){display:none}
[data-plugin-detail="@finogeeks2026/finshield"]>div:has(>[data-plugin-config]){margin-top:12px;gap:20px}
[data-plugin-detail="@finogeeks2026/finshield"] [data-plugin-config]{gap:0}
/* Discover owns the introduction; the active installed page already presents it. */
[data-plugin-detail="@finogeeks2026/finshield"]:has(.finshield-page) [data-detail-document]{display:none}
.finshield-page{margin:0;padding:0;container-type:inline-size}
.finshield-page,.finshield-page *{box-sizing:border-box}
.finshield-page *{font-family:inherit;font-size:inherit}
.finshield-page h2,.finshield-page h3,.finshield-page p{margin:0}
.finshield-page button,.finshield-page summary{font:inherit}
.finshield-page button,.finshield-page a,.finshield-page summary{touch-action:manipulation}
.finshield-page button:focus-visible,.finshield-page a:focus-visible,.finshield-page summary:focus-visible{outline:2px solid var(--fs-brand);outline-offset:3px}
.finshield-page .fs-panel{padding:0}
.finshield-page .fs-hero{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));min-height:112px;gap:24px;align-items:center;padding:16px 0 8px}
.finshield-page .fs-protected-copy h2{margin-top:0}
.finshield-page[data-phase=protected] .fs-protected-copy .fs-actions{margin-top:14px}
.finshield-page .fs-protected-status{display:flex;align-items:center;justify-content:center;gap:20px;min-height:84px;padding:14px 48px 14px 16px;border-radius:8px;background:var(--fs-blue-bg)}
.finshield-page .fs-protected-status .fs-status{white-space:nowrap}
.finshield-page .fs-preparing-session{color:var(--fs-muted);margin-top:4px}
.finshield-page .fs-preparing-resume,.finshield-page .fs-restart-reminder,.finshield-page .fs-failure-reason{border-top:1px solid var(--fs-line);padding-top:14px;margin-top:14px}
.finshield-page .fs-failure-reason h3{font-size:14px;font-weight:500}
.finshield-page .fs-feedback-link{display:inline-block;margin-top:12px}
.finshield-page .fs-visible-progress{margin-top:16px;color:var(--fs-brand)}
.finshield-page .fs-permission-prompt{color:var(--fs-muted);margin-top:14px}
.finshield-page .fs-permission-help p{color:var(--fs-muted);margin-top:8px}
.finshield-page .fs-hero>div{min-width:0}
.finshield-page h2{font:500 18px/1.6 "Microsoft YaHei UI",sans-serif;margin-top:8px;overflow-wrap:anywhere}
.finshield-page .fs-status{display:flex;align-items:center;gap:7px;color:var(--fs-brand)}
.finshield-page .fs-dot{width:6px;height:6px;background:currentColor;border-radius:50%;flex:none}
.finshield-page[data-phase=protected] .fs-status{color:var(--fs-green)}
.finshield-page[data-phase=failed] .fs-status{color:var(--fs-warning)}
.finshield-page .fs-description{color:var(--fs-muted);margin-top:8px;line-height:1.8}
.finshield-page .fs-art{position:relative;width:56px;height:56px;display:flex;align-items:center;justify-content:center;flex:none}
.finshield-page .fs-art img{width:56px;height:56px;object-fit:contain}
.finshield-page .fs-moving{position:absolute;inset:-5px;border:1px solid transparent;border-top-color:var(--fs-brand);border-radius:50%;animation:fs-orbit-turn 4s linear infinite}
.finshield-page .fs-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:10px}
.finshield-page button{font-size:14px;min-height:36px;border:1px solid var(--fs-line);border-radius:8px;padding:7px 13px;background:var(--fs-paper);color:var(--fs-ink)}
.finshield-page button.fs-primary{color:var(--fs-paper);background:var(--fs-brand);border-color:var(--fs-brand)}
body[data-ds-dark-theme] .finshield-page button.fs-primary{color:#10243a}
.finshield-page button:disabled{opacity:.6}
.finshield-page .fs-areas{border-top:1px solid var(--fs-line)}
.finshield-page .fs-areas{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:26px;margin-top:14px}
.finshield-page .fs-area{display:grid;align-content:start;gap:4px;min-width:0;padding:12px 0;border-bottom:1px solid var(--fs-line)}
.finshield-page .fs-area h3{font-size:18px;font-weight:500;color:var(--fs-brand)}
.finshield-page .fs-area p{color:var(--fs-muted)}
.finshield-page details{margin-top:10px}
.finshield-page summary{color:var(--fs-brand);cursor:pointer}
.finshield-page .fs-progress>summary{display:flex;align-items:center;gap:7px;list-style:none}
.finshield-page .fs-progress>summary::-webkit-details-marker{display:none}
.finshield-page .fs-progress-content{margin-top:10px;padding:16px 18px;background:var(--fs-subtle);border-radius:8px}
.finshield-page ol{list-style:none;padding:0;margin:0;display:grid;gap:10px;color:var(--fs-muted)}
.finshield-page li{display:flex;align-items:center;gap:7px}
.finshield-page .fs-step-done{color:var(--fs-green)}
.finshield-page li[aria-current=step]{color:var(--fs-ink)}
.finshield-page .fs-step-current,.finshield-page .fs-progress-spinner{display:inline-block;flex:none;width:10px;height:10px;border:1px solid var(--fs-line);border-top-color:var(--fs-brand);border-radius:50%;animation:fs-orbit-turn 1.5s linear infinite}
.finshield-page progress{display:block;width:100%;height:7px;margin:10px 0;accent-color:var(--fs-brand)}
.finshield-page .fs-footer{margin-top:12px}
.finshield-page a{color:var(--fs-brand);text-decoration:none}
.finshield-page a:hover{text-decoration:underline}
.finshield-page .fs-error{color:var(--fs-muted);white-space:pre-wrap;overflow-wrap:anywhere;margin-top:12px}
.finshield-notice{position:absolute;right:20px;bottom:20px;max-width:calc(100% - 40px);width:365px;padding:18px;border:1px solid var(--fs-line);border-radius:10px;background:var(--fs-paper);box-shadow:0 7px 22px var(--fs-shadow);pointer-events:auto}
.finshield-notice h3{font-size:18px;font-weight:500}
.finshield-notice p{margin-top:7px;color:var(--fs-muted)}
@keyframes fs-orbit-turn{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.finshield-page .fs-moving,.finshield-page .fs-step-current,.finshield-page .fs-progress-spinner{animation:none}}
@media(max-width:650px){[data-plugin-detail="@finogeeks2026/finshield"]>[data-window-drag]>button{grid-column:1/3;grid-row:1}[data-plugin-detail="@finogeeks2026/finshield"]>[data-window-drag]>div>div{grid-column:3;grid-row:1;margin-bottom:12px}[data-plugin-detail="@finogeeks2026/finshield"]>[data-window-drag]+div{grid-column:2/-1}}
@container(max-width:580px){.finshield-page .fs-hero{grid-template-columns:minmax(0,1fr);gap:16px}.finshield-page .fs-protected-status{justify-content:flex-start;padding:14px 18px;min-height:68px}.finshield-page .fs-art,.finshield-page .fs-art img{width:40px;height:40px}.finshield-page .fs-areas{column-gap:18px}}
@container(max-width:500px){.finshield-page .fs-areas{grid-template-columns:minmax(0,1fr)}.finshield-page .fs-area{padding:10px 0}}
@media(pointer:coarse){.finshield-page button,.finshield-page a,.finshield-page summary{min-height:44px}}
`;
function useProtection(store){return React.useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot);}
function discoverAction(bundle,version){
  if(!bundle?.installed)return 'install';
  if(bundle.version===version)return 'installed';
  if(!/^\d+\.\d+\.\d+$/.test(bundle.version)||!/^\d+\.\d+\.\d+$/.test(version))return null;
  const before=bundle.version.split('.').map(Number),after=version.split('.').map(Number);
  const differing=after.findIndex((part,index)=>part!==before[index]);
  return after[differing]>before[differing]?'update':'newer';
}
function createDiscoverUpdate(manager,requestId=()=>crypto.randomUUID()){
  let snapshot={bundle:null,checked:false,dialog:null};
  const listeners=new Set(),publish=next=>{snapshot=next;for(const listener of listeners)listener();};
  const invoke=async pending=>{const answer=await pending;if(!answer.ok)throw Error(answer.error?.message||'DSH request failed');return answer.value;};
  const store={
    getSnapshot:()=>snapshot,subscribe:listener=>{listeners.add(listener);return ()=>listeners.delete(listener);},
    async refresh(){
      const bundles=await invoke(manager.listBundles());
      publish({...snapshot,checked:true,bundle:bundles.find(bundle=>bundle.name===PACKAGE_NAME)??null});
    },
    open(target){if(discoverAction(snapshot.bundle,target.version)==='update'&&snapshot.dialog?.phase!=='running')publish({...snapshot,dialog:{...target,from:snapshot.bundle.version,phase:'confirm'}});},
    close(){if(snapshot.dialog?.phase!=='running')publish({...snapshot,dialog:null});},
    async confirm(){
      const dialog=snapshot.dialog;if(dialog?.phase!=='confirm')return;
      publish({...snapshot,dialog:{...dialog,phase:'running'}});
      try {
        const outcome=await invoke(manager.updateBundle(PACKAGE_NAME,dialog.version,{requestId:requestId(),...dialog.registry===undefined?{}:{registry:dialog.registry}}));
        const result=outcome.result;
        if(!['applied','restart-required'].includes(result.application))throw Error(result.error?.diagnostic||result.error?.code||result.application);
        publish({...snapshot,dialog:{...dialog,phase:'done',outcome}});
      } catch(error) {publish({...snapshot,dialog:{...dialog,phase:'failed',error:error.message}});return;}
      try {await store.refresh();}
      catch(error) {publish({...snapshot,dialog:{...snapshot.dialog,refreshError:error.message}});}
    },
  };
  return store;
}
function DiscoverUpdateDialog({store,t}){
  const snapshot=React.useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot),dialog=snapshot.dialog;
  if(!dialog)return null;
  const {Modal,Button}=require('@deepseek-ai/dsh-client-ui-primitives');
  const running=dialog.phase==='running';
  return h(Modal,{open:true,onClose:store.close,title:t('marketConfirm'),closeLabel:t('marketClose')},
    h('div',{style:{display:'grid',gap:16,minWidth:260,maxWidth:440}},
      h('p',null,t('marketFrom')+' '+dialog.from+' → '+dialog.version),
      dialog.registry?h('p',{style:{overflowWrap:'anywhere'}},t('marketSource')+' '+dialog.registry):null,
      running?h('p',{role:'status'},t('marketUpdating')):null,
      dialog.phase==='done'?h('p',{role:'status'},t('marketDone')):null,
      dialog.refreshError?h('p',{role:'alert'},dialog.refreshError):null,
      dialog.phase==='failed'?h('p',{role:'alert'},t('marketFailed')+': '+dialog.error):null,
      h('div',{style:{display:'flex',justifyContent:'flex-end',gap:8}},
        h(Button,{variant:'outline',disabled:running,onClick:store.close},t(dialog.phase==='confirm'?'marketCancel':'marketClose')),
        dialog.phase==='confirm'?h(Button,{variant:'primary',onClick:()=>void store.confirm()},t('marketStart')):null)));
}
function registerDiscoverUpdates(ctx,t){
  if(typeof document==='undefined')return;
  ctx.inject(['remote.pluginManager'],ctx=>{
    const store=createDiscoverUpdate(ctx.remote.pluginManager);
    ctx.effect(()=>ctx.slots.inject('shell.overlay',()=>ctx.slots.register({name:'shell.overlay',id:PACKAGE_NAME+'.discover-update',inject:()=>({store,t})},DiscoverUpdateDialog)));
    ctx.effect(()=>{
      const buttons=new Map();
      const restore=(button,record)=>{button.textContent=record.text;button.disabled=record.disabled;if(record.label===null)button.removeAttribute('aria-label');else button.setAttribute('aria-label',record.label);};
      const reconcile=()=>{
        const root=document.querySelector('[data-market-detail="@finogeeks2026/finshield"]'),snapshot=store.getSnapshot();
        for(const [button,record] of buttons)if(!root?.contains(button)||!snapshot.bundle?.installed){restore(button,record);buttons.delete(button);}
        if(!root||!snapshot.checked||!snapshot.bundle?.installed)return;
        const supported=new Set();
        for(const row of root.querySelectorAll('[data-market-version]')) {
          const version=row.dataset.marketVersion,button=row.querySelector(':scope > button');
          if(!button)continue;
          const fact=[...root.querySelectorAll('dl dd > code')].find(code=>code.textContent===PACKAGE_NAME+'@'+version);
          if(!fact)continue;
          const source=fact.closest('div').nextElementSibling?.querySelector('dd > code')?.textContent;
          const registry=source&&/^https?:\/\//.test(source)?source:undefined;
          const action=discoverAction(snapshot.bundle,version);if(!action||action==='install')continue;
          supported.add(button);
          if(!buttons.has(button))buttons.set(button,{text:button.textContent,label:button.getAttribute('aria-label'),disabled:button.disabled});
          const record=buttons.get(button);record.target={version,registry};
          const label=action==='update'?t('marketUpdate')+' '+version:t(action==='installed'?'marketInstalled':'marketNewer');
          if(button.textContent!==label)button.textContent=label;
          if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
          button.disabled=action!=='update'||snapshot.dialog?.phase==='running';
        }
        for(const [button,record] of buttons)if(!supported.has(button)){restore(button,record);buttons.delete(button);}
      };
      const click=event=>{
        const button=event.target.closest?.('button'),record=buttons.get(button);
        if(!record||button.disabled)return;
        event.preventDefault();event.stopImmediatePropagation();store.open(record.target);
      };
      const observer=new MutationObserver(reconcile);
      observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-market-detail','data-market-version']});
      document.addEventListener('click',click,true);
      const unsubscribe=store.subscribe(reconcile);
      const refresh=()=>void store.refresh().catch(error=>ctx.logger.warn(error.message));
      const changed=ctx.remote.$on('plugin-manager/changed',refresh);refresh();
      return ()=>{observer.disconnect();document.removeEventListener('click',click,true);unsubscribe();changed();for(const [button,record] of buttons)restore(button,record);};
    });
  });
}
function scrollPageToTop(element){
  for(let parent=element;parent;parent=parent.parentElement)parent.scrollTop=0;
}
function safetyDestination(href){
  if(href==='https://www.finogeeks.com/products/finshield')return PRODUCT_URL;
  const match=/^https:\/\/agent-safety-arena\.finogeeks\.club\/([^?#]+)/.exec(href);
  if(!match)return href;
  const category={'screen-capture':'privacy','window-flood':'interaction','process-terminate':'system','protected-directory-delete':'data'}[match[1].split('/')[0]];
  if(!category&&!match[1].startsWith('agents/dsh/'))return href;
  return PRODUCT_URL+'agents/dsh/'+(match[1].includes('zh-CN')?'zh-CN':'index.html')+(category?'#'+category:'');
}
function registerDetailScroll(ctx){
  if(typeof document==='undefined')return;
  ctx.effect(()=>{
    let current=null,frame;
    const opened=()=>{
      const next=document.querySelector('[data-market-detail="@finogeeks2026/finshield"]');
      if(next)for(const link of next.querySelectorAll('a[href]')){const href=safetyDestination(link.href);if(href!==link.href)link.href=href;}
      if(next===current)return;
      current=next;cancelAnimationFrame(frame);
      if(next)frame=requestAnimationFrame(()=>{if(next.isConnected)scrollPageToTop(next);});
    };
    const observer=new MutationObserver(opened);
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-market-detail']});opened();
    return ()=>{observer.disconnect();cancelAnimationFrame(frame);};
  });
}
function ProductPage({t,store,work}){
  const pageRef=React.useRef(null);
  const snapshot=useProtection(store),phase=projectStatus(snapshot.status);
  const targetPhase=snapshot.status?.phase;
  const updateReady=phase==='ready'&&snapshot.status?.reason==='update';
  const preparingUpdate=phase==='authorizing'&&snapshot.status?.reason==='update';
  const cancelled=phase==='failed'&&targetPhase==='cancelled';
  const hero=updateReady?'updateReady':preparingUpdate?'updating':cancelled?'cancelled':phase;
  const explanation=phase==='ready'?'restart':preparingUpdate?'update':cancelled?'cancelled':'authorization';
  const explanationBody=updateReady?'updateReadyBody':cancelled?'cancelledExplanation':explanation+'Body';
  const explanationAction=preparingUpdate&&!snapshot.status?.currentProtected?'authorizationAction':explanation+'Action';
  const operationLabel=targetPhase==='installing'?'installing':targetPhase==='downloading'?'downloading':'nativePreparing';
  const setup=snapshot.status?.nativeSetup;
  const installing=['installing','downloading'].includes(targetPhase);
  const jobError=snapshot.status?.jobError;
  const reportedError=snapshot.status?.error;
  // Updater appends the Job diagnostic after preparation and startup errors.
  const preparationError=reportedError===jobError?undefined:jobError&&reportedError?.endsWith('; '+jobError)?reportedError.slice(0,-jobError.length-2):reportedError;
  const failure=preparationError || snapshot.status?.authorization?.error || setup?.detail || (setup && setup.code!==0 ? t('setupFailed')+' '+setup.code : undefined);
  React.useEffect(()=>{store.showPage(true);return ()=>store.showPage(false);},[store]);
  React.useEffect(()=>{
    const frame=requestAnimationFrame(()=>{
      const page=pageRef.current;
      scrollPageToTop(page);
    });
    return ()=>cancelAnimationFrame(frame);
  },[]);
  const start=()=>{void store.restart().catch(()=>{});};
  const status=h('div',{className:'fs-status',role:'status'},h('span',{className:'fs-dot','aria-hidden':true}),t(phase==='authorizing'?(preparingUpdate?'updating':'authorizing'):hero));
  const session=phase!=='protected'?h('p',{className:'fs-preparing-session'},t(snapshot.status?.currentProtected?'currentProtected':'notProtected'),snapshot.status?.currentProtected&&snapshot.status.currentRelease?' '+snapshot.status.currentRelease:null):null;
  const art=h('a',{className:'fs-art',href:PRODUCT_URL,target:'_blank',rel:'noopener noreferrer','aria-label':t('productLink')},phase==='authorizing'?h('span',{className:'fs-moving','aria-hidden':true}):null,h('img',{src:BRAND_LOGO,alt:''}));
  const progressLabel=h('span',{role:'status'},t(operationLabel),typeof snapshot.status?.progress?.overall_percent==='number'?' '+snapshot.status.progress.overall_percent+'%':null);
  return h('section',{ref:pageRef,className:'finshield-page','data-phase':phase,'aria-label':t('title')},h('style',null,styles),h('div',{className:'fs-panel'},
    h('div',{className:'fs-hero'},h('div',{className:'fs-protected-copy'},h('h2',null,t(hero+'First'),t(hero+'Second')?h(React.Fragment,null,h('br'),t(hero+'Second')):null),t(hero+'Body')?h('p',{className:'fs-description'},t(hero+'Body')):null,
      h('div',{className:'fs-actions'},phase==='ready'?h(React.Fragment,null,h('button',{className:'fs-primary',onClick:start},t('restart')),h('button',{onClick:()=>{store.dismiss();work();}},t('laterRestart'))):null,
        ['authorizing','protected','failed'].includes(phase)?h('button',{onClick:work},t(phase==='protected'?'startWork':'work')):null,phase==='failed'?h('button',{onClick:()=>void store.refresh()},t('refresh')):null)),
      h('div',{className:'fs-protected-status'},art,h('div',{className:'fs-state-label'},status,session))),
    phase==='ready'?h('p',{className:'fs-restart-reminder'},t('restartReminder')):null,
    phase==='authorizing'?h(React.Fragment,null,h('p',{className:'fs-preparing-resume'},t('resume')),
      h('div',{className:'fs-visible-progress'},progressLabel,h('progress',{max:100,value:typeof snapshot.status?.progress?.overall_percent==='number'?snapshot.status.progress.overall_percent:undefined,'aria-label':t(operationLabel)})),
      h('details',{className:'fs-progress'},h('summary',null,t('progress')),h('div',{className:'fs-progress-content'},h('ol',null,
        h('li',{'aria-current':installing?'step':undefined,className:installing?undefined:'fs-step-done'},h('span',{className:installing?'fs-step-current':undefined,'aria-hidden':true},installing?null:'✓'),t(installing?operationLabel:'installed')),
        h('li',{'aria-current':installing?undefined:'step'},h('span',{className:installing?undefined:'fs-step-current','aria-hidden':true},installing?'○':null),t('nativePreparing')),
        h('li',null,h('span',{'aria-hidden':true},'○'),t('afterRestart'))))),
      h('p',{className:'fs-permission-prompt'},t(explanationAction))):null,
    ['authorizing','ready'].includes(phase)?h('details',{className:'fs-permission-help'},h('summary',null,t(explanation+'Title')),h('p',null,t(explanationBody))):null,
    updateReady&&snapshot.status?.authorizationPending?h('p',{className:'fs-description'},t('authorizationPending')):null,
    (phase==='failed'||['failed','cancelled','reboot-required'].includes(targetPhase))?h('section',{className:'fs-failure-reason'},h('h3',null,t(snapshot.status?.reason==='update'?'updateFailure':'failureReason')),h('p',{className:'fs-error',role:'alert'},failure||(cancelled?t('cancelledExplanation'):t('failedBody'))),h('a',{className:'fs-feedback-link',href:'https://github.com/finogeeks/finsafe/issues/new/choose',target:'_blank',rel:'noopener noreferrer'},t('feedback'))):failure?h('p',{className:'fs-error',role:'alert'},failure):null,
    jobError?h('div',{className:'fs-error',role:'alert'},h('p',null,t('jobFailure')),h('p',null,t('jobFailureBody')),h('details',null,h('summary',null,t('technicalDetails')),h('p',null,jobError))):null,
    phase==='protected'?h('div',{className:'fs-areas'},...['privacy','interaction','system','data'].map(area=>h('section',{className:'fs-area',key:area},h('h3',null,t(area)),h('p',null,t(area+'Body'))))):null,
    h('footer',{className:'fs-footer'},h('a',{href:t('arenaUrl'),target:'_blank',rel:'noopener noreferrer'},t('arena')+' ↗'))));
}

function RestartNotice({t,store,details}){
  const snapshot=useProtection(store);
  if(!snapshot.notice||snapshot.pageVisible||snapshot.status?.phase!=='ready')return null;
  const update=snapshot.status?.reason==='update';
  return h('section',{className:'finshield-page finshield-notice',role:'status'},h('style',null,styles),h('h3',null,t(update?'updateReady':'noticeTitle')),h('p',null,t(update?'updateReadyBody':'noticeBody')),update?h('p',null,t('restartReminder')):null,
    update&&snapshot.status?.authorizationPending?h('p',null,t('authorizationPending')):null,
    snapshot.status?.authorization?.error?h('p',{className:'fs-error'},snapshot.status.authorization.error):null,
    h('div',{className:'fs-actions'},h('button',{className:'fs-primary',onClick:()=>{void store.restart().catch(()=>{});}},t('restart')),h('button',{onClick:store.dismiss},t('later')),details?h('button',{onClick:details},t('details')):null));
}
exports.inject=['slots','locale','remote','layout'];
exports.apply=async function apply(ctx){
  registerDetailScroll(ctx);
  ctx.effect(()=>ctx.locale.register(NS,{en,zh}));
  const t=ctx.locale.bind(NS);
  registerDiscoverUpdates(ctx,t);
  await ctx.remote.$mount(REMOTE_CONTRACT);
  ctx.inject(['remote.finsafeWindows'],ctx=>{
  const invoke=async request=>{const result=await request;if(!result.ok)throw new Error(result.error?.message || 'DSH request failed');return result.value;};
  const store=createProtectionStore(()=>invoke(ctx.remote.finsafeWindows.status()),()=>invoke(ctx.remote.finsafeWindows.restart()),()=>invoke(ctx.remote.finsafeWindows.later()));
  ctx.effect(()=>{let active=true,timer;const tick=async()=>{await store.refresh();if(active)timer=setTimeout(tick,2000);};void tick();return ()=>{active=false;clearTimeout(timer);};});
  const work=()=>ctx.layout.selectPanel(null);
  ctx.effect(()=>ctx.slots.inject('plugins.bundle.config',()=>ctx.slots.register({name:'plugins.bundle.config',key:REMOTE_CONTRACT.package,locale:NS,inject:()=>({t,store,work})},ProductPage)));
  ctx.effect(()=>ctx.slots.inject('shell.overlay',()=>ctx.slots.register({name:'shell.overlay',id:REMOTE_CONTRACT.package,locale:NS,inject:()=>({t,store,details:ctx.get('pluginNavigation')?()=>ctx.get('pluginNavigation').openBundle(REMOTE_CONTRACT.package):undefined})},RestartNotice)));
  });
};
