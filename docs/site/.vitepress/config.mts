import { defineConfig } from 'vitepress'
import { siteBase, siteOrigin, siteUrl, canonicalPath, pageHead, contentHead, configurePublicLinks } from './site.mjs'
import routes from '../routes.json'
import metadata from '../metadata.json'

const repo = 'https://github.com/finogeeks/finsafe'

function sections(language: 'en' | 'zh-CN') {
  const zh = language === 'zh-CN'
  const prefix = `/${language}/`
  const item = (en: string, cn: string, path: string) => ({ text: zh ? cn : en, link: prefix + path })
  return [
    { ...item('Whitepaper', '白皮书', 'resources/agent-security-governance'),
      activeMatch: `^${prefix}resources/agent-security-governance(?:-full)?(?:\\.html)?$`, items: [
      item('Overview & PDF', '白皮书介绍与 PDF 下载', 'resources/agent-security-governance'),
      item('Read online', '在线阅读全文（HTML）', 'resources/agent-security-governance-full'),
    ] },
    { ...item('Product', '产品介绍', 'overview/'),
      activeMatch: `^${prefix}(?:$|index\\.html$|overview/|architecture/|reference/faq(?:\\.html)?$)`, items: [
      item('Product overview', '产品概览', 'overview/'),
      item('Common questions', '常见问题', 'reference/faq'),
      item('Security mechanisms', '安全原理', 'architecture/'),
    ] },
    { ...item('User guides', '使用指南', 'getting-started/install'),
      activeMatch: `^${prefix}(?:getting-started/|agents/|protection/)`, items: [
      item('Install & verify', '安装与验证', 'getting-started/install'),
      item('Agent integration', 'Agent 接入', 'agents/'),
      item('Compatibility', '兼容范围', 'agents/compatibility'),
      { text: zh ? '防护与配置' : 'Protection settings', collapsed: true, items: [
        item('Protection guide', 'FinShield 防护什么', 'protection/'),
        item('Plugin defaults', '插件默认防护', 'protection/defaults'),
        item('Configuration', '配置项作用与生效', 'protection/configuration'),
        item('Windows protection', 'Windows 系统与桌面防护', 'protection/windows-security'),
        item('Network & PII', '网络访问、外泄与 PII', 'protection/network-pii'),
      ] },
      item('DSH operations', 'DSH 运行说明', 'agents/dsh-operations'),
    ] },
    { ...item('Developers', '开发与集成', 'development/'),
      activeMatch: `^${prefix}(?:development/|reference/cli-configuration(?:\\.html)?$)`, items: [
      item('Integration overview', '集成概览', 'development/'),
      item('Integration examples', '接入方式与最小示例', 'development/integration-guide'),
      item('Integrate with AI', '使用 AI 完成集成', 'development/ai-integration'),
      item('CLI reference', '高级配置与 CLI 参考', 'reference/cli-configuration'),
      { text: zh ? 'PII 插件开发' : 'PII plugin development', collapsed: true, items: [
        item('PII developer kit', '开发包', 'development/pii'),
        item('PII protocol', '插件协议', 'development/pii-protocol'),
        item('PII integration', '产品接入', 'development/pii-integration'),
        item('Debugging', '调试指南', 'development/pii-debugging'),
        item('Redactor example', '脱敏插件示例', 'development/pii-redactor'),
      ] },
    ] },
    { ...item('Technical blog', '技术博客', 'blog/'),
      activeMatch: `^${prefix}blog/`, items: [
      item('All articles', '全部文章', 'blog/'),
      item('Execution isolation', '执行隔离', `blog/#${zh ? '执行隔离' : 'execution-isolation'}`),
      item('Network & content security', '网络与内容安全', `blog/#${zh ? '网络与内容安全' : 'network-and-content-security'}`),
      item('Evaluation & verification', '测评与验证', `blog/#${zh ? '测评与验证' : 'evaluation-and-verification'}`),
    ] },
    { ...item('Enterprise', '企业方案', 'enterprise/'),
      activeMatch: `^${prefix}enterprise/`, items: [
      item('Solutions & pilots', '方案介绍与试点', 'enterprise/'),
      item('Contact us', '联系我们', `enterprise/#${zh ? '联系我们' : 'contact-us'}`),
    ] },
    { ...item('Resources', '资源与支持', 'reference/'),
      activeMatch: `^${prefix}reference/(?!faq(?:\\.html)?$|cli-configuration(?:\\.html)?$)`, items: [
      item('Reference', '参考资料', 'reference/'),
      item('Release history', '版本记录', 'reference/changelog'),
      item('Technical archive', '产品机制与测评资料（历史）', 'reference/whitepaper'),
      item('Contributing', '参与贡献', 'reference/contributing'),
      item('Get help', '获取帮助', `getting-started/install#${zh ? '获取帮助' : 'get-help'}`),
      { text: zh ? '版本与下载' : 'Downloads', link: `${repo}/releases` },
      { text: zh ? '问题反馈' : 'Report a problem', link: `${repo}/issues/new/choose` },
    ] },
  ]
}

function navigation(language: 'en' | 'zh-CN') {
  const zh = language === 'zh-CN'
  return [
    ...sections(language).slice(1).map(({ text, link, activeMatch }) => ({ text, link, activeMatch })),
    { text: zh ? '联系我们' : 'Contact', link: `/${language}/enterprise/#${zh ? '联系我们' : 'contact-us'}` },
  ]
}

function sidebar(language: 'en' | 'zh-CN') {
  // A single tree keeps group positions, expansion and scroll stable on navigation.
  return { [`/${language}/`]: sections(language).map(({ text, items }, index) => ({
    text, items, collapsed: index > 1,
  })) }
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
      label: '中文', lang: 'zh-CN', link: '/zh-CN/',
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
