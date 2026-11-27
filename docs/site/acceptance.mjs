// Website acceptance belongs to this public repository and runs after build.
import assert from 'node:assert/strict'
import { readFile, writeFile, access, readdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const site = dirname(fileURLToPath(import.meta.url))
const dist = join(site, '.generated/.vitepress/dist')
const read = (name) => readFile(join(dist, name), 'utf8')
const exists = async (name) => { try { await access(join(dist, name)); return true } catch { return false } }
const catalog = JSON.parse(await read('docs.json'))
const metadata = JSON.parse(await readFile(join(site, '.generated/metadata.json'), 'utf8'))
const whitepapers = JSON.parse(await readFile(join(site, 'whitepapers.json'), 'utf8'))
const orders = { 'zh-CN': ['workbuddy', 'dsh', 'codex', 'claude', 'opencode', 'hermes', 'kilo'],
  en: ['codex', 'claude', 'opencode', 'hermes', 'kilo', 'dsh', 'workbuddy'] }

function sidebarStructure(html) {
  const sidebar = /<aside\b[^>]*>[\s\S]*?<\/aside>/.exec(html)?.[0] ?? ''
  return [...sidebar.matchAll(/<(h2|a)\b([^>]*)>([\s\S]*?)<\/\1>/g)]
    .map(([, tag, attributes, content]) => ({ tag,
      href: /\bhref="([^"]*)"/.exec(attributes)?.[1] ?? null,
      text: content.replace(/<[^>]+>/g, '').trim() }))
}

assert.equal((await read('CNAME')).trim(), 'finshield.finogeeks.club')
assert.equal(await read('googlea9662cdfe1496029.html'), 'google-site-verification: googlea9662cdfe1496029.html')
assert.ok(!(await read('sitemap.xml')).includes('googlea9662cdfe1496029.html'))
for (const [locale, order] of Object.entries(orders)) {
  const home = await read(locale + '/index.html')
  assert.equal(sidebarStructure(home)[0].text, locale === 'zh-CN' ? '白皮书' : 'Whitepaper',
    'The formal whitepaper must be the first sidebar group')
  const landing = await read(`${locale}/resources/agent-security-governance.html`)
  const primaryAction = /<a\b(?=[^>]*\bclass="whitepaper-primary")[^>]*>/.exec(landing)?.[0]
  assert.ok(primaryAction?.includes(`href="/${locale}/resources/agent-security-governance-full.html"`),
    'The primary whitepaper action must open the readable HTML full text')
  for (const route of ['resources/agent-security-governance', 'reference/whitepaper',
    'resources/agent-security-governance-full', 'reference/index', 'enterprise/index',
    'development/index', 'architecture/index', 'overview/windows', 'getting-started/install']) {
    assert.deepEqual(sidebarStructure(await read(`${locale}/${route}.html`)), sidebarStructure(home),
      `Sidebar navigation must keep its structure: ${locale}/${route}.html`)
  }
  const sidebar = home.split('<aside')[1].split('</aside>')[0]
  const positions = order.map((agent) => sidebar.indexOf(`/${locale}/agents/${agent}.html`))
  assert.ok(positions.every((position) => position >= 0))
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b))
  for (const agent of order) assert.ok(await exists(`${locale}/agents/${agent}.html`))
  for (const topic of ['core', 'windows', 'desktop', 'plugin-startup', 'plugin-updater',
    'opencode-integration', 'opencode-handoff', 'opencode-verification', 'opencode-development']) {
    assert.ok(!await exists(`${locale}/architecture/${topic}.html`), 'Do not publish private architecture')
  }
  assert.ok(await exists(`${locale}/architecture/dsh.html`))
  assert.ok(await exists(`${locale}/development/pii-protocol.html`))
  assert.ok(await exists(`${locale}/protection/windows-security.html`))
  assert.match(home, /<img[^>]*src="\/finshield-logo.webp"[^>]*alt="FinShield"/)
  for (const topic of ['windows', 'linux-macos', 'finshield']) {
    const overview = await read(`${locale}/overview/${topic === 'finshield' ? 'index' : topic}.html`)
    assert.match(overview, new RegExp(`<a[^>]*href="[^\"]*${topic}-diagram\\.html[^\"]*"[^>]*target="_self"`))
  }
  for (const match of (await read(`${locale}/llms.txt`)).matchAll(/\]\(https:\/\/finshield.finogeeks.club\/([^\s)]+)\)/g)) {
    assert.ok(await exists(match[1]), match[1])
  }
  for (const topic of ['index', 'defaults', 'configuration', 'network-pii']) {
    const route = `${locale}/protection/${topic}`
    assert.ok((await read(route + '.md')).includes('network'))
    assert.ok((await read(route + '.html')).includes(`href="/${route}.md"`))
    const modules = (await readdir(join(dist, 'assets'))).filter((name) => name.startsWith(route.replaceAll('/', '_') + '.md.') && name.endsWith('.js'))
    const data = await Promise.all(modules.map((name) => read('assets/' + name)))
    assert.ok(data.some((text) => text.includes('text/markdown') && text.includes(`/${route}.md`)
      && text.includes('canonical') && text.includes('hreflang')), 'Metadata must follow client navigation')
    assert.ok(data.some((text) => text.includes('og:description') && text.includes('twitter:description')
      && text.includes('application/ld+json') && text.includes('WebPage') && text.includes('description')),
    'Page descriptions, social metadata and JSON-LD must be in client page data')
  }
  assert.match(await read(`${locale}/agents/dsh.html`), /href="(?:\.\/)?\.\.\/protection\/(?:index\.html)?"/)
  assert.ok((await read(`${locale}/agents/hermes.html`)).includes('getting-started/install.html#windows'))
}
assert.ok((await read('zh-CN/agents/opencode.html')).includes('环境要求'))

const article = 'en/protection/defaults.html'
const html = await read(article)
const sitemap = await read('sitemap.xml')
const windows = 'zh-CN/overview/windows.html'
const windowsHtml = await read(windows)
assert.deepEqual(catalog.pages.map((page) => page.route).sort(), Object.keys(metadata).sort())
assert.equal(catalog.pages.find((page) => page.route === 'index.html').markdownUrl, null)
assert.equal(catalog.pages.find((page) => page.route.endsWith('-diagram.html')).markdownUrl, null)
const publicationDamages = []
const figurePages = []
for (const publication of whitepapers) {
  const fullText = await read(publication.fullTextRoute)
  const figures = [...fullText.matchAll(/<img\b[^>]*\bsrc="\/whitepapers\/agent-security-governance-2026-11(?:-en)?\/figure-p(\d+)\.png"/g)]
    .map((match) => match[1])
  assert.equal(figures.length, 26, 'Each full text must retain all 26 original illustrated figures')
  figurePages.push(figures)
  const pdfPath = publication.pdfPath.replace(/^\//, '')
  const pdf = await readFile(join(dist, pdfPath))
  const corrupted = Buffer.from(pdf)
  corrupted[corrupted.length - 1] ^= 1
  const landing = await read(publication.landingRoute)
  publicationDamages.push(
    [pdfPath, corrupted, 'output PDF bytes differ from source'],
    [publication.landingRoute, landing.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, ''),
      'missing accessible inline PDF preview'],
    [publication.landingRoute, landing.replace(/<a\b([^>]*)>[\s\S]*?<\/a>/gi, (tag, attributes) =>
      /\btarget="_blank"/.test(attributes) && attributes.includes(publication.pdfPath) ? '' : tag),
    'missing external PDF reading fallback'],
  )
}
assert.deepEqual(figurePages[0], figurePages[1], 'English figures must correspond to the same Chinese source pages')
for (const [name, damaged, message] of [
  ['googlea9662cdfe1496029.html', 'Invalid verification token', 'Google verification: incorrect file content'],
  [article, html.replace('rel="canonical"', 'rel="broken-canonical"'), 'incorrect canonical'],
  [article, html.replace('hreflang="zh-CN"', 'hreflang="xx"'), 'incorrect reciprocal hreflang'],
  ['sitemap.xml', sitemap.replaceAll('https://finshield.finogeeks.club/', 'https://wrong.example/'), 'sitemap:'],
  [windows, windowsHtml.replaceAll('target="_self"', ''), 'standalone HTML must bypass client routing'],
  [article, html.replace('</body>', '<a href="https://github.com/Geeksfino/finsafe/pull/409">Private PR</a></body>'), 'inaccessible public reference'],
  [article, html.replace(/<meta\b(?=[^>]*\bname="description")[^>]*>/,
    '<meta name="description" content="Damaged page description">'), 'incorrect description'],
  [article, html.replace(/<meta\b(?=[^>]*\bproperty="og:url")[^>]*>/,
    '<meta property="og:url" content="https://wrong.example/">'), 'incorrect og:url'],
  [article, html.replace(/(<script\b[^>]*\btype="application\/ld\+json"[^>]*>)[\s\S]*?<\/script>/,
    '$1{"@context":"https://schema.org","@graph":[]}</script>'), 'incorrect JSON-LD'],
  ['docs.json', JSON.stringify({ ...catalog, pages: catalog.pages.slice(1) }), 'docs.json: page coverage'],
  ['docs.json', JSON.stringify({ ...catalog, pages: catalog.pages.map((page) => page.route === article
    ? { ...page, markdownUrl: catalog.site + '/missing-markdown-target.md' } : page) }), 'docs.json: missing target'],
  ...publicationDamages,
]) {
  const original = await readFile(join(dist, name))
  const replacement = Buffer.isBuffer(damaged) ? damaged : Buffer.from(damaged, 'utf8')
  assert.ok(!replacement.equals(original), `${name}: damaged-output fixture must change the artifact`)
  try {
    await writeFile(join(dist, name), replacement)
    const result = spawnSync(process.execPath, ['check.mjs'], { cwd: site, encoding: 'utf8' })
    assert.notEqual(result.status, 0)
    assert.ok(result.stderr.includes(message), result.stderr)
  } finally { await writeFile(join(dist, name), original) }
}
console.log('Public site acceptance passed: locales, routes, public scope, client metadata, AI catalogs, original whitepapers and damaged-output rejection')
