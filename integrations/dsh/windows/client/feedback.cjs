// Public issue drafts contain selected diagnostics only, never the status object.
const copy={
  zh:{unknown:'未获取',pluginVersion:'插件版本',pageVersion:'页面版本',dshVersion:'DSH版本',os:'操作系统',arch:'运行架构',
    source:'入口',discover:'发现详情页',protection:'防护页',state:'当前状态',protected:'当前防护',enabled:'已开启',disabled:'未开启',
    nativeVersion:'当前原生组件版本',stage:'失败阶段',code:'错误码',report:'问题反馈',separator:'：',
    windows:value=>`Windows（系统构建 ${value}）`,supported:'Windows（插件适用平台；实际系统版本未获取）',
    phases:{starting:'正在连接',downloading:'正在下载',installing:'正在安装',authorizing:'正在准备防护',ready:'等待退出后手动重新打开',
      protected:'防护已开启',failed:'未完成',cancelled:'已取消','reboot-required':'需要系统重启',exiting:'正在退出'}},
  en:{unknown:'Unavailable',pluginVersion:'Plugin version',pageVersion:'Page version',dshVersion:'DSH version',os:'OS',arch:'Architecture',
    source:'Source',discover:'Discover details',protection:'Protection page',state:'Current state',protected:'Current protection',enabled:'Enabled',disabled:'Disabled',
    nativeVersion:'Current native version',stage:'Failure stage',code:'Error code',report:'Problem report',separator:': ',
    windows:value=>`Windows (system build ${value})`,supported:'Windows (supported platform; actual system version unavailable)',
    phases:{starting:'Connecting',downloading:'Downloading',installing:'Installing',authorizing:'Preparing protection',ready:'Close and reopen manually',
      protected:'Protection enabled',failed:'Incomplete',cancelled:'Cancelled','reboot-required':'System restart required',exiting:'Exiting'}},
};
function feedbackUrl({version:pluginVersion,status={},source='protection',language='zh'}={}) {
  const locale=language==='en'?'en':'zh',t=copy[locale],unknown=t.unknown;
  const version=value=>typeof value==='string'&&value.length<=64&&/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value)?value:unknown;
  const phase=value=>Object.hasOwn(t.phases,value)?t.phases[value]:unknown;
  const environment=status?.feedback??{};
  const release=typeof environment.osRelease==='string'&&environment.osRelease.length<=32&&/^\d+(?:\.\d+){1,3}$/.test(environment.osRelease)?environment.osRelease:unknown;
  const architecture=['x64','arm64','ia32','arm'].includes(environment.arch)?environment.arch:unknown;
  const rows=[
    [source==='discover'?t.pageVersion:t.pluginVersion,version(environment.pluginVersion??pluginVersion)],
    [t.dshVersion,version(environment.dshVersion)],
    [t.os,environment.platform==='win32'?t.windows(release):source==='discover'?t.supported:unknown],
    [t.arch,architecture],[t.source,source==='discover'?t.discover:t.protection],
    [t.state,phase(status?.phase)],
    [t.protected,status?.currentProtected===true?t.enabled:status?.currentProtected===false?t.disabled:unknown],
  ];
  if(status?.currentRelease)rows.push([t.nativeVersion,version(status.currentRelease)]);
  if(status?.phase==='failed'||status?.nativeSetup?.code) {
    const code=status?.nativeSetup?.code;
    rows.push([t.stage,phase(status?.nativeSetup?.phase??status?.phase)],
      [t.code,Number.isSafeInteger(code)?String(code):unknown]);
  }
  const environmentText=rows.map(([key,value])=>key+t.separator+value).join('\n');
  const url=new URL('https://github.com/finogeeks/finsafe/issues/new');
  url.searchParams.set('template',`plugin_feedback_${locale}.yml`);
  url.searchParams.set('title','[FinShield DSH] '+t.report);
  url.searchParams.set('plugin','FinShield DSH (@finogeeks2026/finshield-dsh)');
  url.searchParams.set('environment',environmentText);
  return url.href;
}
module.exports={feedbackUrl};
