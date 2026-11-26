import { defineConfig } from 'vitepress'

const repo = 'https://github.com/finogeeks/finsafe'

function sidebar(language: 'en' | 'zh-CN') {
  const zh = language === 'zh-CN'
  const prefix = `/${language}/`
  const item = (en: string, cn: string, path: string) => ({ text: zh ? cn : en, link: prefix + path })
  return [
    { text: zh ? '开始使用' : 'Get started', items: [
      item('Documentation', '文档首页', ''),
      item('What FinShield protects', 'FinShield 防护什么', 'protection/'),
      item('Install and verify', '安装与验证', 'getting-started/install'),
      item('Compatibility matrix', '兼容矩阵', 'agents/compatibility'),
    ] },
    { text: zh ? '默认防护与配置' : 'Protection and configuration', collapsed: false, items: [
      item('Protection guide', '防护说明', 'protection/'),
      item('Plugin defaults', '插件默认防护', 'protection/defaults'),
      item('Configuration explained', '配置项作用与生效', 'protection/configuration'),
      item('Network access and PII', '网络访问、外泄与 PII', 'protection/network-pii'),
    ] },
    { text: zh ? 'Agent 接入' : 'Agent integrations', collapsed: false, items:
      (zh ? ['workbuddy', 'dsh', 'codex', 'claude', 'opencode', 'hermes', 'kilo']
          : ['codex', 'claude', 'opencode', 'hermes', 'kilo', 'dsh', 'workbuddy']).map((agent) => ({
        text: ({ workbuddy: 'WorkBuddy', dsh: 'DSH Desktop', codex: 'Codex CLI', claude: 'Claude Code CLI',
          opencode: 'OpenCode Desktop', hermes: 'Hermes Desktop', kilo: 'Kilo CLI' })[agent],
        link: prefix + 'agents/' + agent,
      })),
    },
    { text: zh ? '架构与原理' : 'Architecture', collapsed: false, items: [
      item('Architecture and diagram index', '架构与图示目录', 'architecture/'),
      item('DSH plugin architecture', 'DSH 插件架构', 'architecture/dsh'),
      item('OpenCode plugin architecture', 'OpenCode 插件架构', 'architecture/opencode'),
    ] },
    { text: zh ? '产品与防护边界' : 'Concepts and boundaries', collapsed: true, items: [
      item('Overview', '概览', 'overview/'),
      item('Windows', 'Windows 能力', 'overview/windows'),
      item('Linux and macOS', 'Linux 与 macOS 能力', 'overview/linux-macos'),
    ] },
    { text: zh ? '开发与部署' : 'Development and deployment', collapsed: false, items: [
      item('PII developer kit', 'PII 插件开发包', 'development/pii'),
      item('Protocol', '插件协议', 'development/pii-protocol'),
      item('Integration', '集成说明', 'development/pii-integration'),
      item('Debugging', '调试指南', 'development/pii-debugging'),
      item('Redactor example', '脱敏插件示例', 'development/pii-redactor'),
      item('Enterprise deployment', '企业部署', 'enterprise/'),
    ] },
    { text: zh ? '参考与支持' : 'Reference and support', collapsed: false, items: [
      item('Reference', '参考资料', 'reference/'),
      item('Whitepaper', '技术白皮书', 'reference/whitepaper'),
      item('DSH operations', 'DSH 运行说明', 'agents/dsh-operations'),
      item('Release history', '版本记录', 'reference/changelog'),
      item('Contributing', '参与贡献', 'reference/contributing'),
      item('Troubleshooting', '常见问题', `getting-started/install#${zh ? '获取帮助' : 'get-help'}`),
      { text: zh ? '版本与下载' : 'Releases and downloads', link: `${repo}/releases` },
      { text: zh ? '问题反馈' : 'Report a problem', link: `${repo}/issues/new/choose` },
    ] },
  ]
}

export default defineConfig({
  title: 'FinShield Documentation',
  description: 'FinShield protection defaults, configuration, network access, PII, Agent integrations and verification.',
  base: '/finsafe/',
  srcExclude: ['public/**'],
  cleanUrls: false,
  lastUpdated: false,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/finsafe/favicon.svg' }],
    ['link', { rel: 'describedby', type: 'text/markdown', href: '/finsafe/llms.txt' }],
  ],
  transformHead({ pageData }) {
    if (!/^(en|zh-CN)\/.+\.md$/.test(pageData.relativePath)) return []
    return [['link', { rel: 'alternate', type: 'text/markdown', href: '/finsafe/' + pageData.relativePath }]]
  },
  sitemap: { hostname: 'https://finogeeks.github.io/finsafe/' },
  locales: {
    en: {
      label: 'English', lang: 'en', link: '/en/',
      title: 'FinShield Documentation',
      themeConfig: {
        siteTitle: 'FinShield Documentation',
        nav: [{ text: 'Documentation', link: '/en/' }, { text: 'Download', link: `${repo}/releases/latest` }],
        sidebar: sidebar('en'),
        outline: { label: 'On this page', level: [2, 3] },
      },
    },
    'zh-CN': {
      label: '简体中文', lang: 'zh-CN', link: '/zh-CN/',
      title: 'FinShield 文档中心',
      description: 'FinShield 默认防护、配置项、网络访问、PII、Agent 接入与验证指南。',
      themeConfig: {
        siteTitle: 'FinShield 文档中心',
        nav: [{ text: '技术文档', link: '/zh-CN/' }, { text: '下载', link: `${repo}/releases/latest` }],
        sidebar: sidebar('zh-CN'),
        outline: { label: '本页目录', level: [2, 3] },
        docFooter: { prev: '上一页', next: '下一页' },
        sidebarMenuLabel: '目录', returnToTopLabel: '返回顶部',
        darkModeSwitchLabel: '外观', lightModeSwitchTitle: '切换浅色模式', darkModeSwitchTitle: '切换深色模式',
        langMenuLabel: '切换语言', skipToContentLabel: '跳转到正文',
      },
    },
  },
  themeConfig: {
    logo: '/favicon.svg',
    siteTitle: 'FinShield Documentation',
    socialLinks: [{ icon: 'github', link: repo }],
    search: {
      provider: 'local',
      options: {
        miniSearch: {
          options: {
            tokenize: (text: string) => Array.from(new Intl.Segmenter('zh', { granularity: 'word' }).segment(text))
              .filter((word) => word.isWordLike).map((word) => word.segment.toLowerCase()),
          },
        },
        locales: {
          'zh-CN': { translations: {
            button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
            modal: { noResultsText: '没有找到结果', resetButtonTitle: '清空搜索', backButtonTitle: '关闭搜索',
              displayDetails: '显示详细结果', footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' } },
          } },
        },
      },
    },
  },
  markdown: {
    lineNumbers: false,
    config(md) {
      const fence = md.renderer.rules.fence!
      md.renderer.rules.fence = (tokens, index, options, env, self) =>
        tokens[index].info.trim() === 'mermaid'
          ? `<MermaidDiagram code="${encodeURIComponent(tokens[index].content)}" />`
          : fence(tokens, index, options, env, self)
    },
    anchor: {
      // Match the anchors already used by the public Markdown and HTML guides.
      slugify: (heading: string) => heading.toLowerCase()
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[^\p{L}\p{N}_ -]/gu, '').replaceAll(' ', '-'),
    },
  },
  vite: { build: { chunkSizeWarningLimit: 1500 } },
})
