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
const orders = { 'zh-CN': ['workbuddy', 'dsh', 'codex', 'claude', 'opencode', 'hermes', 'kilo'],
  en: ['codex', 'claude', 'opencode', 'hermes', 'kilo', 'dsh', 'workbuddy'] }

assert.equal((await read('CNAME')).trim(), 'finshield.finogeeks.club')
assert.equal(await read('googlea9662cdfe1496029.html'), 'google-site-verification: googlea9662cdfe1496029.html')
assert.ok(!(await read('sitemap.xml')).includes('googlea9662cdfe1496029.html'))
for (const [locale, order] of Object.entries(orders)) {
  const home = await read(locale + '/index.html')
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
for (const [name, damaged, message] of [
  ['googlea9662cdfe1496029.html', 'Invalid verification token', 'Google verification: incorrect file content'],
  [article, html.replace('rel="canonical"', 'rel="broken-canonical"'), 'incorrect canonical'],
  [article, html.replace('hreflang="zh-CN"', 'hreflang="xx"'), 'incorrect reciprocal hreflang'],
  ['sitemap.xml', sitemap.replaceAll('https://finshield.finogeeks.club/', 'https://wrong.example/'), 'sitemap:'],
  [windows, windowsHtml.replaceAll('target="_self"', ''), 'standalone HTML must bypass client routing'],
  [article, html.replace('</body>', '<a href="https://github.com/Geeksfino/finsafe/pull/409">Private PR</a></body>'), 'inaccessible public reference'],
]) {
  const original = await read(name)
  try {
    await writeFile(join(dist, name), damaged, 'utf8')
    const result = spawnSync(process.execPath, ['check.mjs'], { cwd: site, encoding: 'utf8' })
    assert.notEqual(result.status, 0)
    assert.ok(result.stderr.includes(message), result.stderr)
  } finally { await writeFile(join(dist, name), original, 'utf8') }
}
console.log('Public site acceptance passed: locales, routes, public scope, client metadata and damaged-output rejection')
