import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const siteRoot = dirname(fileURLToPath(import.meta.url))
const dist = resolve(siteRoot, '.generated/.vitepress/dist')
const base = '/'
const errors = []
const pages = []

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
  const localUrl = new URL(base + path.slice(dist.length + 1).replaceAll('\\', '/'), 'https://docs.example')
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
if (errors.length) throw new Error(errors.join('\n'))
console.log(`Checked ${pages.length} generated HTML pages: local links, anchors, assets and / base passed`)
