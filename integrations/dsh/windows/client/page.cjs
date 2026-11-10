// Browser source. build-client.mjs embeds the state model, Remote contract and logo.
const React=require('react');
const h=React.createElement;
const {projectStatus,createProtectionStore}=PROTECTION_MODEL;
const NS='finshield.windows';
const ARENA_URL='https://finsafe-safety-arena.finogeeks.club/';
const zh={
  title:'FinShield',loading:'正在读取状态',loadingFirst:'连接安全防护',loadingSecond:'稍候即可查看',loadingBody:'',
  authorizing:'安全授权中',installing:'正在安装防护组件',authorizingFirst:'防护正在准备',authorizingSecond:'工作无需等待',
  authorizingBody:'后台完成授权，就绪后提醒你',authorizationTitle:'为什么需要授权',authorizationBody:'为DSH建立防护权限，若Windows请求确认，请授权后继续',
  ready:'授权已完成',readyFirst:'防护已就绪',readySecond:'重启即开启',readyBody:'请先保存工作，也可稍后重启',restartTitle:'为什么需要重启',restartBody:'让DSH进入防护环境，使安全设置生效',
  protected:'防护已开启',protectedFirst:'DSH为你工作',protectedSecond:'FinShield为你守护',protectedBody:'守住操作、数据与系统边界',
  restarting:'正在重启DSH',restartingFirst:'正在重新连接',restartingSecond:'请稍候',restartingBody:'防护状态将随新会话更新',
  failed:'防护尚未开启',failedFirst:'准备尚未完成',failedSecond:'请查看下方原因',failedBody:'当前会话仍可继续使用',
  delivery:'交付安全',deliveryBody:'约束任务操作，减少执行干扰',data:'数据安全',dataBody:'管控数据访问，约束网络外发',system:'系统安全',systemBody:'限制系统改动，控制资源占用',
  arena:'了解FinShield如何守护你',work:'返回DSH，继续工作',startWork:'返回DSH，开始工作',progress:'查看进度',installed:'插件安装完成',nativePreparing:'正在完成安全授权',waiting:'重启后开启防护',
  restart:'重启DSH',later:'稍后',laterRestart:'稍后重启',details:'查看详情',noticeTitle:'FinShield已准备好',noticeBody:'保存当前工作，重启后开启防护',
  confirmTitle:'重启前，先保存工作',confirmBody:'重启将中断当前任务，未保存内容可能丢失',cancel:'先不重启',confirm:'保存好了，重启',refresh:'重新读取状态',setupFailed:'组件安装失败，错误码',
};
const en={
  title:'FinShield',loading:'Reading protection status',loadingFirst:'Connecting to FinShield',loadingSecond:'Please wait',loadingBody:'',
  authorizing:'Setting up protection',installing:'Installing protection components',authorizingFirst:'Protection is getting ready',authorizingSecond:'Keep working while we prepare',authorizingBody:'We will let you know when setup is complete',authorizationTitle:'Why is authorization needed',authorizationBody:'Authorization gives DSH the permissions required for protection If Windows asks for consent, confirm to continue',
  ready:'Authorization complete',readyFirst:'Protection is ready',readySecond:'Restart to enable it',readyBody:'Save your work first or restart later',restartTitle:'Why restart',restartBody:'Restart DSH to enter the protected environment',
  protected:'Protection is enabled',protectedFirst:'DSH works for you',protectedSecond:'FinShield protects you',protectedBody:'Boundaries for tasks, data and system access',
  restarting:'Restarting DSH',restartingFirst:'Reconnecting',restartingSecond:'Please wait',restartingBody:'Protection status will update with the new session',
  failed:'Protection is not enabled',failedFirst:'Preparation is incomplete',failedSecond:'See the reason below',failedBody:'You can keep using the current session',
  delivery:'Task safety',deliveryBody:'Bound task actions and reduce disruption',data:'Data security',dataBody:'Control data access and outbound sharing',system:'System security',systemBody:'Limit system changes and resource use',
  arena:'See how FinShield protects you',work:'Return to DSH',startWork:'Start working in DSH',progress:'View progress',installed:'Plugin installed',nativePreparing:'Completing security authorization',waiting:'Protection starts after restart',
  restart:'Restart DSH',later:'Later',laterRestart:'Restart later',details:'View details',noticeTitle:'FinShield is ready',noticeBody:'Save your work and restart DSH to enable protection',
  confirmTitle:'Save your work before restarting',confirmBody:'Restarting interrupts running tasks and may lose unsaved work',cancel:'Keep working',confirm:'Saved, restart now',refresh:'Read status again',setupFailed:'Component installation failed with code',
};
const styles=`
.finshield-page{--fs-line:#e1e1e1;--fs-paper:#fff;--fs-subtle:#f7f7f7;--fs-ink:#202020;--fs-muted:#666;--fs-brand:#005fb8;--fs-green:#0f7b0f;--fs-shadow:#20202014;font:14px/1.6 "Microsoft YaHei UI",sans-serif;color:var(--fs-ink);margin:0;padding:0}
body[data-ds-dark-theme] .finshield-page{--fs-line:#343b45;--fs-paper:#171a1f;--fs-subtle:#12151a;--fs-ink:#edf1f4;--fs-muted:#aeb6bf;--fs-brand:#8dc8ff;--fs-green:#91d8b8;--fs-shadow:#00000042}
.finshield-page,.finshield-page *{box-sizing:border-box}
.finshield-page h2,.finshield-page h3,.finshield-page p{margin:0}
.finshield-page button,.finshield-page summary{font:inherit}
.finshield-page button,.finshield-page a,.finshield-page summary{touch-action:manipulation}
.finshield-page button:focus-visible,.finshield-page a:focus-visible,.finshield-page summary:focus-visible{outline:2px solid var(--fs-brand);outline-offset:3px}
.finshield-page .fs-panel{padding:8px 0 4px}
.finshield-page .fs-hero{display:grid;grid-template-columns:minmax(0,1fr) 170px;max-width:540px;gap:16px;align-items:center;min-height:150px}
.finshield-page h2{font:500 18px/1.6 "Microsoft YaHei UI",sans-serif;margin-top:8px;overflow-wrap:anywhere}
.finshield-page .fs-status{display:flex;align-items:center;gap:7px;color:var(--fs-brand)}
.finshield-page .fs-dot{width:6px;height:6px;background:currentColor;border-radius:50%;flex:none}
.finshield-page[data-phase=protected] .fs-status{color:var(--fs-green)}
.finshield-page .fs-description{color:var(--fs-muted);margin-top:8px}
.finshield-page .fs-art{position:relative;width:170px;height:150px;display:flex;align-items:center;justify-content:center}
.finshield-page .fs-art img{width:90px;height:90px;object-fit:contain}
.finshield-page .fs-orbit{position:absolute;width:155px;height:139px;border:1px solid color-mix(in srgb,var(--fs-brand) 18%,transparent);border-radius:50%;transform:rotate(-26deg)}
.finshield-page .fs-orbit-other{width:168px;height:149px;transform:rotate(29deg);border-color:color-mix(in srgb,var(--fs-brand) 10%,transparent)}
.finshield-page .fs-art-check{position:absolute;bottom:17px;right:24px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:1px solid var(--fs-line);border-radius:50%;background:var(--fs-paper);color:var(--fs-green)}
.finshield-page .fs-moving{position:absolute;inset:0;animation:fs-orbit-turn 4s linear infinite}
.finshield-page .fs-moving:before{content:"";position:absolute;top:0;left:81px;width:6px;height:6px;background:var(--fs-brand);border-radius:50%}
.finshield-page .fs-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:10px}
.finshield-page button{font-size:14px;min-height:36px;border:1px solid var(--fs-line);border-radius:8px;padding:7px 13px;background:var(--fs-paper);color:var(--fs-ink)}
.finshield-page button.fs-primary{color:var(--fs-paper);background:var(--fs-brand);border-color:var(--fs-brand)}
body[data-ds-dark-theme] .finshield-page button.fs-primary{color:#10243a}
.finshield-page button:disabled{opacity:.6}
.finshield-page .fs-explanation,.finshield-page .fs-areas{margin-top:14px;border-top:1px solid var(--fs-line)}
.finshield-page .fs-explanation{padding-top:12px}
.finshield-page .fs-explanation h3{font-size:14px;font-weight:500}
.finshield-page .fs-explanation p{color:var(--fs-muted);margin-top:6px}
.finshield-page .fs-area{display:grid;grid-template-columns:90px minmax(0,1fr);align-items:baseline;gap:12px;padding:12px 0;border-bottom:1px solid var(--fs-line)}
.finshield-page .fs-area h3{font-size:18px;font-weight:500;color:var(--fs-brand)}
.finshield-page .fs-area p{color:var(--fs-muted)}
.finshield-page details{margin-top:12px;padding:12px 14px;border-radius:8px;background:var(--fs-subtle)}
.finshield-page summary{color:var(--fs-brand)}
.finshield-page ol{list-style:none;padding:0;margin:10px 0 0;display:grid;gap:7px;color:var(--fs-muted)}
.finshield-page li{display:flex;gap:8px}
.finshield-page progress{display:block;width:100%;height:7px;margin:10px 0;accent-color:var(--fs-brand)}
.finshield-page .fs-footer{margin-top:12px}
.finshield-page a{color:var(--fs-brand);text-decoration:none}
.finshield-page a:hover{text-decoration:underline}
.finshield-page .fs-error{color:var(--fs-muted);white-space:pre-wrap;overflow-wrap:anywhere;margin-top:12px}
.finshield-notice{position:absolute;right:20px;bottom:20px;max-width:calc(100% - 40px);width:365px;padding:18px;border:1px solid var(--fs-line);border-radius:10px;background:var(--fs-paper);box-shadow:0 7px 22px var(--fs-shadow);pointer-events:auto}
.finshield-notice h3{font-size:18px;font-weight:500}
.finshield-notice p{margin-top:7px;color:var(--fs-muted)}
.finshield-confirm{max-width:420px;width:calc(100% - 40px);border:1px solid var(--fs-line);border-radius:12px;padding:24px;background:var(--fs-paper);color:var(--fs-ink)}
.finshield-confirm::backdrop{background:#20202045}
.finshield-confirm h2{margin:0}
.finshield-confirm p{margin-top:12px;color:var(--fs-muted)}
@keyframes fs-orbit-turn{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.finshield-page .fs-moving{animation:none}}
@media(max-width:650px){.finshield-page .fs-hero{grid-template-columns:minmax(0,1fr) 64px;gap:10px}.finshield-page .fs-art{width:64px;height:100px}.finshield-page .fs-art img{width:42px;height:42px}.finshield-page .fs-orbit{width:58px;height:53px}.finshield-page .fs-orbit-other{width:64px;height:57px}.finshield-page .fs-moving{inset:18px 0}.finshield-page .fs-moving:before{top:3px;left:29px;width:4px;height:4px}.finshield-page .fs-area{grid-template-columns:1fr;gap:4px;padding:11px 0}}
@media(pointer:coarse){.finshield-page button,.finshield-page a,.finshield-page summary{min-height:44px}}
`;
function useProtection(store){return React.useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot);}
function Confirmation({t,close,confirm}){
  const ref=React.useRef(null);
  React.useEffect(()=>{ref.current.showModal();},[]);
  return h('dialog',{ref,className:'finshield-page finshield-confirm','aria-labelledby':'finshield-restart-title',onCancel:close},h('h2',{id:'finshield-restart-title'},t('confirmTitle')),h('p',null,t('confirmBody')),h('div',{className:'fs-actions'},h('button',{autoFocus:true,onClick:close},t('cancel')),h('button',{className:'fs-primary',onClick:confirm},t('confirm'))));
}
function ProductPage({t,store,work}){
  const snapshot=useProtection(store),phase=projectStatus(snapshot.status);
  const setup=snapshot.status?.nativeSetup;
  const failure=snapshot.status?.error || setup?.detail || (setup && setup.code!==0 ? t('setupFailed')+' '+setup.code : undefined);
  const [confirmation,setConfirmation]=React.useState(false);
  React.useEffect(()=>{store.showPage(true);return ()=>store.showPage(false);},[store]);
  const start=()=>{setConfirmation(false);void store.restart().catch(()=>{});};
  return h('section',{className:'finshield-page','data-phase':phase,'aria-label':t('title')},h('style',null,styles),h('div',{className:'fs-panel'},
    h('div',{className:'fs-hero'},h('div',null,h('div',{className:'fs-status',role:'status'},h('span',{className:'fs-dot','aria-hidden':true}),t(phase==='authorizing'&&snapshot.status?.phase==='installing'?'installing':phase)),h('h2',null,t(phase+'First'),h('br'),t(phase+'Second')),h('p',{className:'fs-description'},t(phase+'Body')),
      h('div',{className:'fs-actions'},phase==='ready'?h(React.Fragment,null,h('button',{className:'fs-primary',onClick:()=>setConfirmation(true)},t('restart')),h('button',{onClick:()=>{store.dismiss();work();}},t('laterRestart'))):null,
        ['authorizing','protected'].includes(phase)?h('button',{onClick:work},t(phase==='protected'?'startWork':'work')):null,phase==='failed'?h('button',{onClick:()=>void store.refresh()},t('refresh')):null)),
      h('div',{className:'fs-art','aria-hidden':true},h('div',{className:'fs-orbit'}),h('div',{className:'fs-orbit fs-orbit-other'}),['loading','authorizing','restarting'].includes(phase)?h('span',{className:'fs-moving'}):null,h('img',{src:BRAND_LOGO,alt:''}),['ready','protected'].includes(phase)?h('span',{className:'fs-art-check'},'✓'):null)),
    ['authorizing','ready'].includes(phase)?h('section',{className:'fs-explanation'},h('h3',null,t(phase==='ready'?'restartTitle':'authorizationTitle')),h('p',null,t(phase==='ready'?'restartBody':'authorizationBody'))):null,
    phase==='authorizing'?h('details',null,h('summary',null,t('progress'),typeof snapshot.status?.progress?.overall_percent==='number'?' '+snapshot.status.progress.overall_percent+'%':null),h('progress',{max:100,value:typeof snapshot.status?.progress?.overall_percent==='number'?snapshot.status.progress.overall_percent:undefined,'aria-label':t('nativePreparing')}),h('ol',null,h('li',null,'✓ ',t('installed')),h('li',null,t(snapshot.status?.phase==='installing'?'installing':'nativePreparing')),h('li',null,t('waiting')))):null,
    phase==='protected'?h('div',{className:'fs-areas'},...['delivery','data','system'].map(area=>h('section',{className:'fs-area',key:area},h('h3',null,t(area)),h('p',null,t(area+'Body'))))):null,
    phase==='failed'&&failure?h('p',{className:'fs-error',role:'alert'},failure):null,
    h('footer',{className:'fs-footer'},h('a',{href:ARENA_URL,target:'_blank',rel:'noopener noreferrer'},t('arena')+' ↗'))),confirmation?h(Confirmation,{t,close:()=>setConfirmation(false),confirm:start}):null);
}
function RestartNotice({t,store,details}){
  const snapshot=useProtection(store);const [confirmation,setConfirmation]=React.useState(false);
  if(!snapshot.notice||snapshot.pageVisible||snapshot.status?.phase!=='ready')return null;
  return h(React.Fragment,null,h('section',{className:'finshield-page finshield-notice',role:'status'},h('style',null,styles),h('h3',null,t('noticeTitle')),h('p',null,t('noticeBody')),h('div',{className:'fs-actions'},h('button',{className:'fs-primary',onClick:()=>setConfirmation(true)},t('restart')),h('button',{onClick:store.dismiss},t('later')),details?h('button',{onClick:details},t('details')):null)),confirmation?h(Confirmation,{t,close:()=>setConfirmation(false),confirm:()=>{setConfirmation(false);void store.restart().catch(()=>{});}}):null);
}
exports.inject=['slots','locale','remote','layout'];
exports.apply=async function apply(ctx){
  ctx.effect(()=>ctx.locale.register(NS,{en,zh}));
  const t=ctx.locale.bind(NS);
  await ctx.remote.$mount(REMOTE_CONTRACT);
  ctx.inject(['remote.finsafeWindows'],ctx=>{
  const invoke=async request=>{const result=await request;if(!result.ok)throw new Error(result.error?.message || 'DSH request failed');return result.value;};
  const store=createProtectionStore(()=>invoke(ctx.remote.finsafeWindows.status()),()=>invoke(ctx.remote.finsafeWindows.restart()));
  ctx.effect(()=>{let active=true,timer;const tick=async()=>{await store.refresh();if(active)timer=setTimeout(tick,1500);};void tick();return ()=>{active=false;clearTimeout(timer);};});
  const work=()=>ctx.layout.selectPanel(null);
  ctx.effect(()=>ctx.slots.inject('plugins.bundle.config',()=>ctx.slots.register({name:'plugins.bundle.config',key:REMOTE_CONTRACT.package,locale:NS,inject:()=>({t,store,work})},ProductPage)));
  ctx.effect(()=>ctx.slots.inject('shell.overlay',()=>ctx.slots.register({name:'shell.overlay',id:REMOTE_CONTRACT.package,locale:NS,inject:()=>({t,store,details:ctx.get('pluginNavigation')?()=>ctx.get('pluginNavigation').openBundle(REMOTE_CONTRACT.package):undefined})},RestartNotice)));
  });
};
