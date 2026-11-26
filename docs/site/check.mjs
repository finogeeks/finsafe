import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { siteBase as base, siteOrigin, siteUrl, pageHead } from './.vitepress/site.mjs'

const siteRoot = dirname(fileURLToPath(import.meta.url))
const dist = resolve(siteRoot, '.generated/.vitepress/dist')
const errors = []
const pages = []
const routes = JSON.parse(await readFile(join(siteRoot, '.generated/routes.json'), 'utf8'))
const canonicalUrls = new Set()

function headLinks(html) {
  return [...html.split('</head>')[0].matchAll(/<link\b([^>]+)>/g)].map((match) =>
    Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((attr) => [attr[1], attr[2]])))
}

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) await scan(path)
    else if (entry.name.endsWith('.html')) pages.push(path)
  }
}

async function targetFile(path) {
  for (const candidate of [path, path + '.html', join(path, 'index.html')]) {
    try { if ((await stat(candidate)).isFile()) return candidate } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error
    }
  }
}

await scan(dist)
for (const path of pages) {
  const html = await readFile(path, 'utf8')
  const route = path.slice(dist.length + 1).replaceAll('\\', '/')
  const localUrl = new URL(base + route, siteOrigin)
  const links = headLinks(html)
  if (route === '404.html') {
    if (!/<meta name="robots" content="noindex"/.test(html)) errors.push('404.html: missing noindex')
  } else {
    const canonical = links.filter((link) => link.rel === 'canonical')
    if (canonical.length !== 1 || canonical[0].href !== siteUrl(route)) errors.push(`${route}: incorrect canonical`)
    canonicalUrls.add(siteUrl(route))
    const expected = pageHead(route, routes).filter(([, attrs]) => attrs.hreflang).map(([, attrs]) => attrs)
    const actual = links.filter((link) => link.hreflang)
    if (JSON.stringify(actual) !== JSON.stringify(expected)) errors.push(`${route}: incorrect reciprocal hreflang`)
  }
  if (html.includes('href="/finsafe/') || html.includes('src="/finsafe/')) errors.push(`${route}: obsolete project base`)
  for (const match of html.matchAll(/<(?:a|img|script|link)\b[^>]*?\b(?:href|src)="([^"]+)"/g)) {
    const href = match[1].replaceAll('&amp;', '&')
    const url = new URL(href, localUrl)
    if (url.origin !== localUrl.origin || !['http:', 'https:'].includes(url.protocol)) continue
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
const robots = await readFile(join(dist, 'robots.txt'), 'utf8')
if (!robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`) || /Disallow:\s*\//.test(robots)) errors.push('robots.txt: incorrect discovery or access rules')
if (errors.length) throw new Error(errors.join('\n'))
console.log(`Checked ${pages.length} generated HTML pages: links, anchors, assets, canonical, hreflang, sitemap and robots passed for ${siteOrigin}`)
