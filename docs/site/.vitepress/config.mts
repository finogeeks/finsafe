import { defineConfig } from 'vitepress'
import { siteBase, siteOrigin, siteUrl, canonicalPath, pageHead, contentHead, configurePublicLinks } from './site.mjs'
import routes from '../routes.json'
import metadata from '../metadata.json'

const repo = 'https://github.com/finogeeks/finsafe'

function navigation(language: 'en' | 'zh-CN') {
  const zh = language === 'zh-CN'
  const prefix = `/${language}/`
  return [
    { text: zh ? '白皮书' : 'Whitepaper', link: prefix + 'resources/agent-security-governance' },
    { text: zh ? '产品介绍' : 'Product', link: prefix + 'overview/' },
    { text: zh ? '使用指南' : 'User guides', link: prefix + 'getting-started/' },
    { text: zh ? '开发与集成' : 'Developers', link: prefix + 'development/' },
    { text: zh ? '企业方案' : 'Enterprise', link: prefix + 'enterprise/' },
    { text: zh ? '资源与支持' : 'Resources', link: prefix + 'reference/' },
    { text: zh ? '下载' : 'Download', link: `${repo}/releases/latest` },
    { text: zh ? '联系我们' : 'Contact', link: prefix + `enterprise/#${zh ? '联系我们' : 'contact-us'}` },
  ]
}

function sidebar(language: 'en' | 'zh-CN') {
  const zh = language === 'zh-CN'
  const prefix = `/${language}/`
  const item = (en: string, cn: string, path: string) => ({ text: zh ? cn : en, link: prefix + path })
  const whitepaper = { text: zh ? '白皮书' : 'Whitepaper', items: [
    item('Overview and PDF download', '白皮书介绍与 PDF 下载', 'resources/agent-security-governance'),
    item('Read the full text online', '在线阅读全文（HTML）', 'resources/agent-security-governance-full'),
  ] }
  const start = { text: zh ? '开始使用' : 'Get started', items: [
    item('Documentation', '文档首页', ''),
    item('Install and verify', '安装与验证', 'getting-started/install'),
    item('Compatibility matrix', '兼容矩阵', 'agents/compatibility'),
  ] }
  const product = { text: zh ? '产品介绍' : 'Product', items: [
    item('Product introduction', '产品概览', 'overview/product-introduction'),
    item('Overview and boundaries', '概览与防护边界', 'overview/'),
    item('Windows', 'Windows 能力', 'overview/windows'),
    item('Linux and macOS', 'Linux 与 macOS 能力', 'overview/linux-macos'),
  ] }
  const protection = { text: zh ? '防护与配置' : 'Protection and configuration', items: [
    item('Protection guide', 'FinShield 防护什么', 'protection/'),
    item('Plugin defaults', '插件默认防护', 'protection/defaults'),
    item('Configuration explained', '配置项作用与生效', 'protection/configuration'),
    item('Windows system and desktop', 'Windows 系统与桌面防护', 'protection/windows-security'),
    item('Network access and PII', '网络访问、外泄与 PII', 'protection/network-pii'),
  ] }
  const agents = { text: zh ? '支持的 Agent 与使用指南' : 'Supported Agents and guides', items:
    (zh ? ['workbuddy', 'dsh', 'codex', 'claude', 'opencode', 'hermes', 'kilo']
        : ['codex', 'claude', 'opencode', 'hermes', 'kilo', 'dsh', 'workbuddy']).map((agent) => ({
      text: ({ workbuddy: 'WorkBuddy', dsh: 'DSH Desktop', codex: 'Codex CLI', claude: 'Claude Code CLI',
        opencode: 'OpenCode Desktop', hermes: 'Hermes Desktop', kilo: 'Kilo CLI' })[agent],
      link: prefix + 'agents/' + agent,
    })),
  }
  const development = { text: zh ? '开发与集成' : 'Development and integration', items: [
    item('Developer overview', '集成概览', 'development/'),
    item('Integration routes and example', '接入方式与最小示例', 'development/integration-guide'),
    item('Integrate with an AI coding agent', '使用 AI 完成集成', 'development/ai-integration'),
    item('Advanced configuration and CLI', '高级配置与 CLI 参考', 'reference/cli-configuration'),
    item('PII developer kit', 'PII 插件开发包', 'development/pii'),
    item('Protocol', 'PII 插件协议', 'development/pii-protocol'),
    item('PII product integration', 'PII 产品接入', 'development/pii-integration'),
    item('Debugging', '调试指南', 'development/pii-debugging'),
    item('Redactor example', '脱敏插件示例', 'development/pii-redactor'),
  ] }
  const architecture = { text: zh ? '安全原理与架构' : 'Security mechanisms and architecture', items: [
    item('Security architecture index', '安全原理目录', 'architecture/'),
    item('Windows network isolation and WFP', 'Windows 网络隔离与 WFP', 'architecture/windows-network'),
    item('Windows desktop interaction and Job UI', 'Windows 桌面交互与 Job UI', 'architecture/windows-job-ui'),
    item('Inspector network and content inspection', 'Inspector 网络与内容检查', 'architecture/inspector'),
    item('DSH plugin architecture', 'DSH 插件架构', 'architecture/dsh'),
    item('OpenCode plugin architecture', 'OpenCode 插件架构', 'architecture/opencode'),
    item('Mechanisms and evaluation archive', '产品机制与测评资料（历史）', 'reference/whitepaper'),
  ] }
  const enterprise = { text: zh ? '企业方案' : 'Enterprise solutions', items: [
    item('Solutions and pilots', '方案介绍与试点', 'enterprise/'),
    item('Contact us', '联系我们', `enterprise/#${zh ? '联系我们' : 'contact-us'}`),
  ] }
  const reference = { text: zh ? '资源与支持' : 'Resources and support', items: [
    item('Reference', '参考资料', 'reference/'),
    item('DSH operations', 'DSH 运行说明', 'agents/dsh-operations'),
    item('Release history', '版本记录', 'reference/changelog'),
    item('Contributing', '参与贡献', 'reference/contributing'),
    item('Get help', '获取帮助', `getting-started/install#${zh ? '获取帮助' : 'get-help'}`),
    { text: zh ? '版本与下载' : 'Releases and downloads', link: `${repo}/releases` },
    { text: zh ? '问题反馈' : 'Report a problem', link: `${repo}/issues/new/choose` },
  ] }
  // A single tree keeps group positions, expansion and scroll stable on navigation.
  return { [prefix]: [whitepaper, start,
    ...[product, protection, agents, development, architecture, enterprise, reference]
      .map((group) => ({ ...group, collapsed: true })),
  ] }
}

export default defineConfig({
  title: 'FinShield Documentation',
  description: 'FinShield protection defaults, configuration, network access, PII, Agent integrations and verification.',
  base: siteBase,
  srcExclude: ['public/**'],
  cleanUrls: false,
  lastUpdated: false,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'describedby', type: 'text/markdown', href: '/llms.txt' }],
    ['link', { rel: 'describedby', type: 'application/json', href: '/docs.json' }],
  ],
  transformPageData(pageData) {
    // Frontmatter metadata also updates when the client changes page or locale.
    pageData.frontmatter.head ??= []
    const route = pageData.relativePath.replace(/\.md$/, '.html')
    pageData.frontmatter.head.push(...pageHead(route, routes))
    const page = metadata[route as keyof typeof metadata]
    if (page) {
      pageData.description = page.description
      pageData.frontmatter.description = page.description
      pageData.frontmatter.head.push(...contentHead(page))
    }
    if (/^(en|zh-CN)\/.+\.md$/.test(pageData.relativePath)) {
      pageData.frontmatter.head.push(['link', { rel: 'alternate', type: 'text/markdown', href: '/' + pageData.relativePath }])
    }
  },
  // VitePress creates its built-in 404 without transformPageData.
  transformHead({ pageData }) {
    return pageData.relativePath === '404.md' ? pageHead('404.html', routes) : []
  },
  sitemap: {
    hostname: siteOrigin,
    transformItems: (items) => [
      ...items.filter((item) => item.url !== '404.html').map((item) => ({ ...item, url: canonicalPath(item.url) })),
      ...routes.filter((route) => route.endsWith('-diagram.html')).map((route) => ({ url: siteUrl(route) })),
    ],
  },
  locales: {
    en: {
      label: 'English', lang: 'en', link: '/en/',
      title: 'FinShield Documentation',
      themeConfig: {
        siteTitle: 'FinShield Documentation',
        nav: navigation('en'),
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
        nav: navigation('zh-CN'),
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
    logo: { src: '/finshield-logo.webp', alt: 'FinShield' },
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
      configurePublicLinks(md)
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
