import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, posix, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { siteOrigin, pageHead } from './.vitepress/site.mjs'

const siteRoot = dirname(fileURLToPath(import.meta.url))
const locales = ['en', 'zh-CN']
const remoteRepository = 'https://github.com/finogeeks/finsafe/blob/main/'

function rewriteUrl(value, sourcePath, html) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) return value
  const match = value.match(/^([^?#]*)(.*)$/)
  let [_, path, suffix] = match
  if (!path) return value
  const target = posix.normalize(posix.join(posix.dirname(sourcePath), path))
  // Root repository documents are outside the documentation site's ownership.
  if (target.startsWith('../')) return remoteRepository + target.replace(/^\.\.\//, '') + suffix
  if (path.endsWith('.html')) path = path.replace(/\.html$/, '-diagram.html')
  path = path.replace(/(^|\/)README\.md$/, '$1index.md')
  if (html) path = path.replace(/\.md$/, '.html')
  return path + suffix
}

function transformLinks(body, rewrite, html = false) {
  const transform = (part) => part
    .replace(/(!?\[([^\]\n]*)\]\(\s*<?)([^<>\s)]+)(>?(?:\s+["'][^\n]*["'])?\s*\))/g,
      (whole, prefix, label, url, suffix) => {
        const target = rewrite(url, label)
        return target === null ? label : prefix + target + suffix
      })
    .replace(/(^ {0,3}\[[^\]\n]+\]:\s*<?)([^>\s]+)/gm,
      (_, prefix, url) => { const target = rewrite(url); return target === null ? '' : prefix + target })
    .replace(/\b(?:href|src)=["']([^"']+)["']/gi,
      (whole, url) => { const target = rewrite(url); return target === null ? '' : whole.replace(url, target) })
  if (html) return transform(body)
  return body.split(/(^```[^\n]*\n[\s\S]*?^```[^\n]*(?:\n|$)|^~~~[^\n]*\n[\s\S]*?^~~~[^\n]*(?:\n|$))/m)
    .map((part, index) => index % 2 ? part : transform(part)).join('')
}

export function rewriteLinks(body, sourcePath, html = false) {
  return transformLinks(body, (value) => rewriteUrl(value, sourcePath, html), html)
}

async function* files(root, prefix = '') {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const name = posix.join(prefix, entry.name)
    if (entry.isDirectory()) yield* files(join(root, entry.name), name)
    else if (entry.isFile()) yield name
  }
}

async function writeLlmIndexes(output, pages) {
  const sections = [
    ['protection', 'Protection and configuration', '默认防护与配置'],
    ['getting-started', 'Getting started', '开始使用'],
    ['agents', 'Agent integrations', 'Agent 接入'],
    ['overview', 'Product and platform scope', '产品与平台范围'],
    ['development', 'Plugin development', '插件开发'],
    ['architecture', 'Public plugin designs', '公开插件设计'],
    ['enterprise', 'Enterprise deployment', '企业部署'],
    ['reference', 'Reference and support', '参考与支持'],
  ]
  for (const locale of locales) {
    const zh = locale === 'zh-CN'
    let body = `# ${zh ? 'FinShield 文档中心' : 'FinShield Documentation'}\n\n> ${zh
      ? '默认防护、配置项、网络与 PII、Agent 接入及验证的公开文档索引。'
      : 'Public documentation for protection defaults, configuration, network and PII, Agent integrations and verification.'}\n\n`
    body += (zh ? '先阅读防护说明与兼容范围。安装状态、实际保护及内容检查覆盖不能互相替代。以下链接提供与网页同源的 Markdown。'
      : 'Start with protection and compatibility. Installation status, actual protection and content-inspection coverage are different facts. Links below provide Markdown from the same sources as the website.') + '\n'
    const entries = pages.filter((page) => page.route.startsWith(locale + '/'))
      .sort((a, b) => Number(!a.route.endsWith('/index.html')) - Number(!b.route.endsWith('/index.html')) || a.route.localeCompare(b.route))
    for (const [directory, en, cn] of sections) {
      const group = entries.filter((page) => page.route.split('/')[1] === directory
        || directory === 'overview' && page.route === locale + '/index.html')
      if (!group.length) continue
      body += `\n## ${zh ? cn : en}\n\n` + group.map((page) =>
        `- [${page.title}](${siteOrigin}/${page.route.replace(/\.html$/, '.md')})`).join('\n') + '\n'
    }
    // The proposal permits a BOM; it also prevents legacy plain-text decoding.
    await writeFile(join(output, 'public', locale, 'llms.txt'), '\uFEFF' + body, 'utf8')
  }
  await writeFile(join(output, 'public/llms.txt'), `# FinShield Documentation

> Public FinShield protection, configuration, integration and verification documentation.

Choose a language. Start with protection defaults and compatibility before making claims about a particular integration. Each index links to clean Markdown generated from the same public sources as the website.

## Documentation

- [English documentation index](${siteOrigin}/en/llms.txt): Protection, configuration, network and PII, integrations and references.
- [Simplified Chinese documentation index](${siteOrigin}/zh-CN/llms.txt): Chinese pages and translated public plugin documentation.
`, 'utf8')
}

export async function prepareContent(docsRoot, output, options = {}) {
  // Only the caller-owned generated directory is replaced, never source docs.
  await rm(output, { recursive: true, force: true })
  const pages = []
  const documents = []
  for (const locale of locales) {
    for await (const relative of files(join(docsRoot, locale))) {
      const sourcePath = posix.join(locale, relative)
      if (!/\.(md|html)$/.test(relative)) continue
      const html = relative.endsWith('.html')
      const destination = html
        ? posix.join('public', sourcePath.replace(/\.html$/, '-diagram.html'))
        : sourcePath.replace(/(^|\/)README\.md$/, '$1index.md')
      documents.push({ source: posix.join('docs', sourcePath), destination: html ? destination.slice(7) : destination, html,
        path: join(docsRoot, sourcePath) })
    }
  }
  const repositoryRoot = resolve(options.repositoryRoot ?? join(docsRoot, '..'))
  for (const entry of options.documents ?? []) {
    if (entry.destination.startsWith('zh-CN/') && options.documents.some((other) => other.source === entry.source && other.destination.startsWith('en/'))) {
      throw new Error(`Missing Chinese translation: ${entry.source}`)
    }
    if (!/^(en|zh-CN)\/.+\.md$/.test(entry.destination) || entry.destination.split('/').includes('..')
        || documents.some((document) => document.destination === entry.destination)) {
      throw new Error(`Invalid or duplicate site destination: ${entry.destination}`)
    }
    const path = resolve(repositoryRoot, entry.source)
    if (!path.startsWith(repositoryRoot + '/') && !path.startsWith(repositoryRoot + '\\')) throw new Error(`Source leaves repository: ${entry.source}`)
    documents.push({ ...entry, source: entry.linkSource ?? entry.source, path, html: false })
  }
  const assets = new Set()
  const routes = ['index.html', ...documents.map((document) => document.destination.replace(/\.md$/, '.html'))]
  const aliases = options.aliases ?? {}
  const excluded = new Set(options.unpublishedReferences ?? [])
  const publicAssets = new Set(options.publicAssets ?? [])
  const slug = (heading) => heading.toLowerCase().replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[^\p{L}\p{N}_ -]/gu, '').replaceAll(' ', '-')
  const headings = (body) => [...body.replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*(?:\n|$)|^~~~[^\n]*\n[\s\S]*?^~~~[^\n]*(?:\n|$)/gm, '')
    .matchAll(/^#{1,6} (.+)\r?$/gm)].map((match) => slug(match[1]))
  for (const document of documents) document.body = (await readFile(document.path, 'utf8')).replaceAll('\r\n', '\n')
  for (const document of documents.filter((entry) => entry.translationOf)) {
    const original = documents.find((entry) => entry.source === document.translationOf)
    if (!original) throw new Error(`Missing translation source: ${document.translationOf}`)
    const from = headings(original.body), to = headings(document.body)
    document.anchors = from.length === to.length ? new Map(from.map((anchor, index) => ['#' + anchor, '#' + to[index]])) : new Map()
  }
  for (const document of documents) {
      let body = document.body
      if (document.section) {
        const heading = new RegExp(`^### ${document.section}\\r?$`, 'm').exec(body)
        if (!heading) throw new Error(`Missing section ${document.section} in ${document.source}`)
        const tail = body.slice(heading.index + heading[0].length)
        body = '# ' + document.section + '\n' + tail.split(/^#{1,3} /m)[0]
      }
      if (document.title) body = body.replace(/^# .+$/m, '# ' + document.title)
      if (document.lead) body = body.replace(/^(# .+\n)/, '$1\n' + document.lead + '\n')
      const locale = document.destination.startsWith('zh-CN/') ? 'zh-CN' : 'en'
      let content = transformLinks(body, (value, label) => {
        if ((value.startsWith('#') && !document.section) || /^(?:data:|mailto:)/i.test(value)) return value
        let link = value
        const github = value.match(/^https:\/\/(?:github\.com\/finogeeks\/finsafe\/blob|raw\.githubusercontent\.com\/finogeeks\/finsafe)\/main\/(.*)$/)
        if (github) link = github[1]
        else if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return value
        const match = link.match(/^([^?#]*)(.*)$/)
        const target = github ? match[1] : match[1] ? posix.normalize(posix.join(posix.dirname(document.source), match[1])) : document.source
        if (excluded.has(target)) return null
        let suffix = match[2]
        const linkLocale = label === 'English' || label === '英文' ? 'en'
          : ['中文', '简体中文', 'Chinese'].includes(label) ? 'zh-CN' : locale
        const section = documents.find((entry) => entry.source === target && entry.section && suffix === '#' + entry.section.toLowerCase().replaceAll(' ', '-'))
        let route = section ?? documents.find((entry) => (entry.source === target || entry.translationOf === target) && !entry.section && entry.destination.startsWith(linkLocale + '/'))
          ?? documents.find((entry) => entry.source === target && !entry.section)
        if (section) suffix = ''
        if (route?.translationOf === target && route.anchors?.has(suffix)) suffix = route.anchors.get(suffix)
        if (target === 'README.md' || target === 'README-zh.md') route = { destination: `${locale}/index.md` }
        if (aliases[target]) { route = { destination: `${locale}/${aliases[target]}` }; suffix = '' }
        if (route) {
          let destination = route.destination
          if (document.html) destination = destination.replace(/\.md$/, '.html')
          return posix.relative(posix.dirname(document.destination), destination) + suffix
        }
        if (/\.(?:png|jpe?g|gif|webp|svg|rtf|txt|yaml)$/i.test(target) && !target.startsWith('../')) {
          if (!publicAssets.has(target)) throw new Error(`Asset is not approved for public documentation: ${target}`)
          assets.add(target)
          return '/source-assets/' + target + suffix
        }
        if (target.endsWith('.md') && !target.startsWith('../')) throw new Error(`Documentation target is not on the site: ${document.source}: ${value}`)
        return github ? value : remoteRepository + target.replace(/^\.\.\//, '') + suffix
      }, document.html)
      if (document.html) {
        const metadata = pageHead(document.destination, routes).map(([tag, attributes]) =>
          `<${tag} ${Object.entries(attributes).map(([name, value]) => `${name}="${value}"`).join(' ')}>`).join('\n')
        content = content.replace(/<\/head>/i, metadata + '\n</head>')
      }
      const path = join(output, document.html ? 'public/' + document.destination : document.destination)
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, content, 'utf8')
      if (!document.html) {
        const markdownPath = join(output, 'public', document.destination)
        await mkdir(dirname(markdownPath), { recursive: true })
        await writeFile(markdownPath, '\uFEFF' + content, 'utf8')
        const title = /^# (.+)$/m.exec(content)?.[1].replaceAll('`', '') ?? document.destination
        pages.push({ source: document.source, route: document.destination.replace(/\.md$/, '.html'), title })
      }
  }
  for (const asset of assets) {
    const path = join(output, 'public/source-assets', asset)
    await mkdir(dirname(path), { recursive: true })
    await cp(join(repositoryRoot, asset), path)
  }
  await writeFile(join(output, 'pages.json'), JSON.stringify(pages, null, 2) + '\n')
  await writeFile(join(output, 'routes.json'), JSON.stringify(routes, null, 2) + '\n')
  await writeFile(join(output, 'public/robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`, 'utf8')
  await writeLlmIndexes(output, pages)
  return pages
}

async function main() {
  const output = resolve(siteRoot, '.generated')
  const imports = JSON.parse(await readFile(join(siteRoot, 'content.json'), 'utf8'))
  const pages = await prepareContent(resolve(siteRoot, '..'), output, {
    ...imports, repositoryRoot: resolve(siteRoot, '../..'),
  })
  await cp(join(siteRoot, '.vitepress'), join(output, '.vitepress'), { recursive: true })
  await cp(join(siteRoot, 'public'), join(output, 'public'), { recursive: true })
  await writeFile(join(output, 'index.md'), `---
layout: home
title: FinShield Documentation
hero:
  name: FinShield
  text: Documentation
  tagline: Understand protection defaults, configure supported controls, and verify your Agent.
  actions:
    - theme: brand
      text: English documentation
      link: /en/
    - theme: alt
      text: 简体中文文档
      link: /zh-CN/
features:
  - title: What FinShield protects
    details: Read defaults, configuration effects, network access and PII boundaries.
    link: /en/protection/
  - title: Get started
    details: Choose an integration route and verify allowed and denied operations.
    link: /en/getting-started/install
  - title: Connect your Agent
    details: Check Agent forms, platforms, plugin delivery and documented version scope.
    link: /en/agents/compatibility
  - title: Understand the boundary
    details: Read platform capabilities, configuration requirements and limitations.
    link: /en/overview/
---
`)
  console.log(`Prepared ${pages.length} canonical documentation pages in ${output}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main()
