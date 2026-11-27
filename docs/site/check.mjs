import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { siteBase as base, siteOrigin, siteUrl, pageHead, publicLink } from './.vitepress/site.mjs'

const siteRoot = dirname(fileURLToPath(import.meta.url))
const dist = resolve(siteRoot, '.generated/.vitepress/dist')
const errors = []
const pages = []
const routes = JSON.parse(await readFile(join(siteRoot, '.generated/routes.json'), 'utf8'))
const metadata = JSON.parse(await readFile(join(siteRoot, '.generated/metadata.json'), 'utf8'))
const whitepapers = JSON.parse(await readFile(join(siteRoot, 'whitepapers.json'), 'utf8'))
const canonicalUrls = new Set()
const googleVerification = 'googlea9662cdfe1496029.html'
const verification = await readFile(join(dist, googleVerification), 'utf8')
if (verification !== `google-site-verification: ${googleVerification}`) errors.push('Google verification: incorrect file content')

function decodeAttribute(value) {
  return value.replace(/&(?:#x([\da-f]+)|#(\d+)|(amp|quot|apos|lt|gt));/gi, (entity, hex, decimal, name) =>
    name ? ({ amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' })[name.toLowerCase()]
      : String.fromCodePoint(parseInt(hex ?? decimal, hex ? 16 : 10)))
}

function attributes(text) {
  return Object.fromEntries([...text.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map((match) => [match[1].toLowerCase(), decodeAttribute(match[2] ?? match[3])]))
}

function headTags(html, tag) {
  return [...html.split('</head>')[0].matchAll(new RegExp(`<${tag}\\b([^>]+)>`, 'gi'))]
    .map((match) => attributes(match[1]))
}

function checkPageMetadata(route, html) {
  const page = metadata[route]
  if (!page) { errors.push(`${route}: missing page metadata`); return }
  const metas = headTags(html, 'meta')
  const expect = (attribute, key, value) => {
    const matches = metas.filter((meta) => meta[attribute] === key)
    if (matches.length !== 1 || matches[0].content !== value) errors.push(`${route}: incorrect ${key}`)
  }
  expect('name', 'description', page.description)
  const image = siteOrigin + (page.publication?.coverPath ?? '/finshield-logo.webp')
  const imageAlt = page.publication ? page.publication.title + (page.language === 'zh-CN' ? ' · 封面' : ' · cover') : 'FinShield'
  for (const [key, value] of Object.entries({ type: 'website', site_name: 'FinShield', title: page.title,
    description: page.description, url: page.url, image, 'image:alt': imageAlt })) {
    expect('property', 'og:' + key, value)
  }
  for (const [key, value] of Object.entries({ card: 'summary', title: page.title,
    description: page.description, image, 'image:alt': imageAlt })) {
    expect('name', 'twitter:' + key, value)
  }
  const scripts = [...html.split('</head>')[0].matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .filter((match) => attributes(match[1]).type === 'application/ld+json')
  try {
    if (scripts.length !== 1) throw new Error('expected one script')
    // Script bodies are JSON, not HTML attribute values. Do not decode entities.
    const data = JSON.parse(scripts[0][2])
    if (data['@context'] !== 'https://schema.org' || !Array.isArray(data['@graph'])
        || data['@graph'].length !== 2) throw new Error('expected WebSite and WebPage graph')
    const website = data['@graph'].find((node) => node['@type'] === 'WebSite')
    const webpage = data['@graph'].find((node) => node['@type'] === 'WebPage')
    if (website?.['@id'] !== siteOrigin + '/#website' || website.url !== siteOrigin + '/'
        || website.name !== 'FinShield Documentation'
        || JSON.stringify(website.inLanguage) !== JSON.stringify(['en', 'zh-CN'])
        || webpage?.['@id'] !== page.url + '#webpage' || webpage.url !== page.url
        || webpage.name !== page.title || webpage.description !== page.description
        || JSON.stringify(webpage.inLanguage) !== JSON.stringify(page.language ?? ['en', 'zh-CN'])
        || webpage.isPartOf?.['@id'] !== website['@id']) throw new Error('page facts do not match')
    if (page.publication && (webpage.version !== page.publication.edition
        || webpage.publisher?.['@type'] !== 'Organization' || webpage.publisher.name !== page.publication.publisher
        || webpage.isBasedOn !== siteOrigin + page.publication.pdfPath)) throw new Error('publication facts do not match')
    const unsupported = /^(?:author|datePublished|dateModified|aggregateRating|ratingValue|review)$/
    const hasUnsupported = (value) => value && typeof value === 'object'
      && Object.entries(value).some(([key, child]) => unsupported.test(key) || hasUnsupported(child))
    if (hasUnsupported(data)) throw new Error('unsupported author, date or rating')
  } catch (error) { errors.push(`${route}: incorrect JSON-LD: ${error.message}`) }
}

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) await scan(path)
    // Google requires the original plain verification file, without page metadata.
    else if (entry.name.endsWith('.html') && path !== join(dist, googleVerification)) pages.push(path)
  }
}

async function targetFile(path) {
  for (const candidate of [path, path + '.html', join(path, 'index.html')]) {
    try { if ((await stat(candidate)).isFile()) return candidate } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error
    }
  }
}

async function checkPublicUrl(value, label) {
  let url
  try { url = new URL(value) } catch { errors.push(`${label}: expected absolute public URL: ${value}`); return }
  if (url.origin !== siteOrigin || !['http:', 'https:'].includes(url.protocol)) {
    errors.push(`${label}: expected documentation origin: ${value}`); return
  }
  if (!await targetFile(join(dist, decodeURIComponent(url.pathname)))) errors.push(`${label}: missing target: ${value}`)
}

// Commands and link-shaped examples inside fenced or inline code are not links.
function withoutCode(text) {
  let fence
  return text.split('\n').filter((line) => {
    const delimiter = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1]
    if (fence) {
      if (delimiter?.[0] === fence[0] && delimiter.length >= fence.length
          && new RegExp(`^ {0,3}${delimiter}[ \\t]*$`).test(line)) fence = undefined
      return false
    }
    if (delimiter) { fence = delimiter; return false }
    return true
  }).join('\n').replace(/(`+)[^`\n]*?\1/g, '')
}

function markdownLinks(text) {
  const content = withoutCode(text)
  return [
    ...[...content.matchAll(/!?\[[^\]\n]*\]\(\s*<?([^<>\s)]+)/g)].map((match) => match[1]),
    ...[...content.matchAll(/^ {0,3}\[[^\]\n]+\]:\s*<?([^>\s]+)/gm)].map((match) => match[1]),
    ...[...content.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)].map((match) => decodeAttribute(match[1])),
    ...[...content.matchAll(/^(?:Source|Markdown|Original PDF): (https?:\/\/\S+)/gm)].map((match) => match[1]),
  ]
}

async function checkLlmLinks(name, text) {
  for (const value of markdownLinks(text)) {
    if (/^(?:mailto:|data:)/i.test(value)) continue
    let url
    try { url = new URL(value) } catch { errors.push(`${name}: expected absolute link: ${value}`); continue }
    if (url.origin === siteOrigin) await checkPublicUrl(value, name)
    if (publicLink(value) !== value) errors.push(`${name}: inaccessible public reference: ${value}`)
  }
}

async function checkDiscovery() {
  const expectedRoutes = [...routes].sort()
  if (JSON.stringify(Object.keys(metadata).sort()) !== JSON.stringify(expectedRoutes)) errors.push('metadata.json: page coverage differs from routes')
  for (const [route, page] of Object.entries(metadata)) {
    const language = route === 'index.html' ? null : route.split('/')[0]
    const markdownUrl = route === 'index.html' || route.endsWith('-diagram.html') ? null : siteOrigin + '/' + route.replace(/\.html$/, '.md')
    if (page.route !== route || page.url !== siteUrl(route) || page.language !== language
        || page.markdownUrl !== markdownUrl || !page.title || !page.description) errors.push(`${route}: invalid generated page facts`)
  }
  const catalog = JSON.parse(await readFile(join(dist, 'docs.json'), 'utf8'))
  if (catalog.schemaVersion !== 1 || catalog.site !== siteOrigin || !Array.isArray(catalog.pages)) {
    errors.push('docs.json: incorrect catalog schema'); return
  }
  const actualRoutes = catalog.pages.map((page) => page.route).sort()
  if (JSON.stringify(actualRoutes) !== JSON.stringify(expectedRoutes)) errors.push('docs.json: page coverage differs from routes')
  for (const page of catalog.pages) {
    if (JSON.stringify(page) !== JSON.stringify(metadata[page.route])) errors.push(`docs.json: page facts differ: ${page.route}`)
    await checkPublicUrl(page.url, 'docs.json')
    if (page.markdownUrl !== null) await checkPublicUrl(page.markdownUrl, 'docs.json')
  }
  const rootIndex = await readFile(join(dist, 'llms.txt'), 'utf8')
  await checkLlmLinks('llms.txt', rootIndex)
  for (const language of ['en', 'zh-CN']) {
    const entries = Object.values(metadata).filter((page) => page.language === language && page.markdownUrl)
    const name = language + '/llms.txt'
    const index = await readFile(join(dist, name), 'utf8')
    await checkLlmLinks(name, index)
    for (const page of entries) {
      if (!index.includes(`- [${page.title}](${page.markdownUrl}): ${page.description}`)) errors.push(`${name}: missing page summary: ${page.route}`)
    }
    for (const directory of ['protection', 'getting-started', 'agents', 'overview', 'development', 'architecture', 'enterprise', 'reference', 'resources']) {
      const group = entries.filter((page) => page.kind !== 'historical-reference'
        && (page.route.split('/')[1] === directory || directory === 'overview' && page.route === language + '/index.html'))
      if (!group.length) continue
      const topicName = `${language}/${directory}/llms.txt`
      const topic = await readFile(join(dist, topicName), 'utf8')
      await checkLlmLinks(topicName, topic)
      const links = markdownLinks(topic).sort()
      if (JSON.stringify(links) !== JSON.stringify(group.map((page) => page.markdownUrl).sort())) errors.push(`${topicName}: topic coverage differs from current pages`)
      for (const page of group) if (!topic.includes(page.description)) errors.push(`${topicName}: missing summary: ${page.route}`)
    }
    const fullName = language + '/llms-full.txt'
    const full = await readFile(join(dist, fullName), 'utf8')
    await checkLlmLinks(fullName, full)
    const sourceOrigin = siteOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const chunks = full.split(new RegExp(`\\n---\\n\\n(?=Source: ${sourceOrigin}/)`)).slice(1)
    const bundled = new Map()
    for (const chunk of chunks) {
      const header = /^Source: ([^\n]+)\nMarkdown: ([^\n]+)\nSummary: ([^\n]+)\n\n/.exec(chunk)
      if (!header || bundled.has(header[1])) { errors.push(`${fullName}: invalid or duplicate source header`); continue }
      bundled.set(header[1], { markdown: header[2], summary: header[3], body: chunk.slice(header[0].length).trim() })
    }
    if (bundled.size !== entries.length) errors.push(`${fullName}: page coverage differs from Markdown pages`)
    for (const page of entries) {
      const chunk = bundled.get(page.url)
      if (!chunk || chunk.markdown !== page.markdownUrl || chunk.summary !== page.description || !chunk.body) {
        errors.push(`${fullName}: missing source, summary or body: ${page.route}`); continue
      }
      if (page.kind === 'historical-reference') {
        const warning = language === 'zh-CN' ? '历史参考：请访问来源；当前用法见安装指南与发行说明。'
          : 'Historical reference: follow the source link; use installation guides and releases for current operations.'
        if (chunk.body !== warning) errors.push(`${fullName}: historical body must remain link-only: ${page.route}`)
      }
      if (page.publication && !chunk.body.startsWith(`Publication edition: ${page.publication.edition}\nOriginal PDF: ${siteOrigin}${page.publication.pdfPath}\n`)) {
        errors.push(`${fullName}: missing publication edition and original PDF: ${page.route}`)
      }
    }
  }
}

function articleContent(html) {
  return /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] ?? ''
}

function textContent(html) {
  return decodeAttribute(html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|template|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<[^>]+>/g, '')).replaceAll('\u200b', '').replace(/\s+/g, ' ').trim()
}

async function checkWhitepapers() {
  if (!Array.isArray(whitepapers)) { errors.push('whitepapers.json: expected publication array'); return }
  for (const publication of whitepapers) {
    const label = `Whitepaper ${publication.edition}`
    const pdfPath = publication.pdfPath.replace(/^\//, '')
    const source = await readFile(join(siteRoot, 'public', pdfPath))
    const output = await readFile(join(dist, pdfPath))
    const sha256 = createHash('sha256').update(source).digest('hex')
    if (source.length !== publication.bytes || sha256 !== publication.sha256
        || source.subarray(0, 5).toString() !== '%PDF-') errors.push(`${label}: source PDF does not match approved manifest`)
    if (!source.equals(output)) errors.push(`${label}: output PDF bytes differ from source`)
    await checkPublicUrl(siteOrigin + publication.coverPath, label)
    for (const route of [publication.landingRoute, publication.fullTextRoute]) {
      const page = metadata[route]
      if (!page || page.kind !== 'publication' || JSON.stringify(page.publication) !== JSON.stringify(publication)) {
        errors.push(`${label}: missing publication metadata: ${route}`)
      }
    }
    const landing = articleContent(await readFile(join(dist, publication.landingRoute), 'utf8'))
    const pdfUrl = new URL(publication.pdfPath, siteOrigin)
    const samePdf = (value) => {
      if (!value) return false
      const url = new URL(value, siteUrl(publication.landingRoute))
      return url.origin === pdfUrl.origin && url.pathname === pdfUrl.pathname && !url.search
    }
    const frames = [...landing.matchAll(/<iframe\b([^>]*)>/gi)].map((match) => attributes(match[1]))
    if (frames.length !== 1 || !samePdf(frames[0].src)
        || !frames[0].title?.includes(publication.title)) errors.push(`${label}: missing accessible inline PDF preview`)
    // These anchors must remain outside the iframe so browsers without a PDF viewer can use them.
    const fallback = landing.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, '')
    const links = [...fallback.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
      .map((match) => ({ ...attributes(match[1]), download: /\bdownload(?:\s|=|$)/i.test(match[1]), text: textContent(match[2]) }))
    if (!links.some((link) => samePdf(link.href) && link.download && link.text)) errors.push(`${label}: missing native PDF download`)
    if (!links.some((link) => samePdf(link.href) && link.target === '_blank'
        && link.rel?.split(/\s+/).includes('noopener') && link.text)) errors.push(`${label}: missing external PDF reading fallback`)
    if (!links.some((link) => link.href && new URL(link.href, siteUrl(publication.landingRoute)).href === siteUrl(publication.fullTextRoute)
        && link.text)) errors.push(`${label}: missing visible HTML full-text link`)
    if (!textContent(fallback).includes(publication.edition)
        || !textContent(fallback).includes(String(publication.pages))) errors.push(`${label}: missing visible edition or page count`)
    if (/^(en|zh-CN)\/resources\/agent-security-governance-full\.html$/.test(publication.fullTextRoute)) {
      const zh = publication.fullTextRoute.startsWith('zh-CN/')
      const full = articleContent(await readFile(join(dist, publication.fullTextRoute), 'utf8'))
      const headings = [...full.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)]
        .map((match) => ({ title: textContent(match[1]), start: match.index, end: match.index + match[0].length }))
      const chapters = zh ? ['AI正在改变企业安全风险结构', '企业AI安全风险全景', '企业AI安全体系架构', '企业AI安全建设路径',
        'FinShield智安盾：产品架构与核心能力', 'FinShield智安盾：应用场景实测与企业部署']
        : ['AI Is Changing the Structure of Enterprise Security Risks', 'The Enterprise AI Security Risk Landscape',
          'Enterprise AI Security Architecture', 'A Roadmap for Building Enterprise AI Security',
          'FinShield: Product Architecture and Core Capabilities', 'FinShield: Application Scenario Tests and Enterprise Deployment']
      const positions = chapters.map((title) => headings.findIndex((heading) => heading.title.replace(/\s/g, '') === title.replace(/\s/g, '')))
      if (positions.some((position) => position < 0) || new Set(positions).size !== chapters.length
          || positions.some((position, index) => index && position <= positions[index - 1])) errors.push(`${label}: full text must retain six ordered chapters`)
      for (const position of positions.filter((position) => position >= 0)) {
        const section = full.slice(headings[position].end, headings[position + 1]?.start)
        if (![...section.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].some((match) => textContent(match[1]))) {
          errors.push(`${label}: missing readable chapter body: ${headings[position].title}`)
        }
      }
      const references = headings.findIndex((heading) => heading.title === (zh ? '参考资料' : 'References'))
      const referenceBody = references < 0 ? '' : full.slice(headings[references].end, headings[references + 1]?.start)
      const items = [...referenceBody.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
      const numbers = items.map((match) => Number(/^\[(\d+)\]/.exec(textContent(match[1]))?.[1]))
      if (numbers.length !== 29 || numbers.some((number, index) => number !== index + 1)
          || items.some((match) => !/<a\b[^>]*href="https?:\/\/[^\"]+"[^>]*>[\s\S]*?<\/a>/i.test(match[1]))) {
        errors.push(`${label}: full text must retain 29 numbered references with source links`)
      }
    }
  }
}

await scan(dist)
for (const path of pages) {
  const html = await readFile(path, 'utf8')
  const route = path.slice(dist.length + 1).replaceAll('\\', '/')
  const localUrl = new URL(base + route, siteOrigin)
  const links = headTags(html, 'link')
  if (route === '404.html') {
    if (!/<meta name="robots" content="noindex"/.test(html)) errors.push('404.html: missing noindex')
  } else {
    checkPageMetadata(route, html)
    const canonical = links.filter((link) => link.rel === 'canonical')
    if (canonical.length !== 1 || canonical[0].href !== siteUrl(route)) errors.push(`${route}: incorrect canonical`)
    canonicalUrls.add(siteUrl(route))
    const expected = pageHead(route, routes).filter(([, attrs]) => attrs.hreflang).map(([, attrs]) => attrs)
    const actual = links.filter((link) => link.hreflang)
    if (JSON.stringify(actual) !== JSON.stringify(expected)) errors.push(`${route}: incorrect reciprocal hreflang`)
  }
  if (html.includes('href="/finsafe/') || html.includes('src="/finsafe/')) errors.push(`${route}: obsolete project base`)
  for (const match of html.matchAll(/<(?:a|img|script|link)\b[^>]*?\b(?:href|src)="([^"]+)"/g)) {
    const href = decodeAttribute(match[1])
    if (publicLink(href) !== href) errors.push(`${route}: inaccessible public reference: ${href}`)
    const url = new URL(href, localUrl)
    if (url.origin !== localUrl.origin || !['http:', 'https:'].includes(url.protocol)) continue
    if (!route.endsWith('-diagram.html') && match[0].startsWith('<a') && url.pathname.endsWith('-diagram.html')) {
      const tag = html.slice(match.index, html.indexOf('>', match.index) + 1)
      if (!/\btarget="[^"]+"/.test(tag) && !/\bdownload(?:[\s=>])/.test(tag)) {
        errors.push(`${route}: standalone HTML must bypass client routing: ${href}`)
      }
    }
    if (!url.pathname.startsWith(base)) { errors.push(`${localUrl.pathname}: outside base: ${href}`); continue }
    const destination = await targetFile(join(dist, decodeURIComponent(url.pathname.slice(base.length))))
    if (!destination) { errors.push(`${localUrl.pathname}: missing target: ${href}`); continue }
    if (url.hash && destination.endsWith('.html')) {
      const content = destination === path ? html : await readFile(destination, 'utf8')
      const fragment = decodeURIComponent(url.hash.slice(1))
      if (![...content.matchAll(/\b(?:id|name)="([^"]+)"/g)].some((id) => id[1] === fragment)) {
        errors.push(`${localUrl.pathname}: missing anchor: ${href}`)
      }
    }
  }
}
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8')
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
if (locations.length !== canonicalUrls.size || new Set(locations).size !== locations.length
    || locations.some((url) => !canonicalUrls.has(url))) errors.push('sitemap: URLs must match every indexable canonical exactly once')
const textLocations = (await readFile(join(dist, 'sitemap.txt'), 'utf8')).trimEnd().split('\n')
if (textLocations.length !== canonicalUrls.size || new Set(textLocations).size !== textLocations.length
    || textLocations.some((url) => !canonicalUrls.has(url))) errors.push('sitemap.txt: URLs must match every indexable canonical exactly once')
const robots = await readFile(join(dist, 'robots.txt'), 'utf8')
if (!['sitemap.xml', 'sitemap.txt'].every((name) => robots.includes(`Sitemap: ${siteOrigin}/${name}`))
    || /Disallow:\s*\//.test(robots)) errors.push('robots.txt: incorrect discovery or access rules')
await checkDiscovery()
await checkWhitepapers()
if (errors.length) throw new Error(errors.join('\n'))
console.log(`Checked ${pages.length} generated HTML pages: links, metadata, JSON-LD, canonical, hreflang, sitemap, robots and AI catalogs passed for ${siteOrigin}`)
