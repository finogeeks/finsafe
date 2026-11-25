import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, posix, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

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

export function rewriteLinks(body, sourcePath, html = false) {
  const transform = (part) => part
    .replace(/(\]\(\s*<?)([^<>\s)]+)(?=>?\s*(?:["'][^\n]*["']\s*)?\))/g,
      (_, prefix, url) => prefix + rewriteUrl(url, sourcePath, html))
    .replace(/(^ {0,3}\[[^\]\n]+\]:\s*<?)([^>\s]+)/gm,
      (_, prefix, url) => prefix + rewriteUrl(url, sourcePath, html))
    .replace(/(\b(?:href|src)=["'])([^"']+)/gi,
      (_, prefix, url) => prefix + rewriteUrl(url, sourcePath, html))
  if (html) return transform(body)
  return body.split(/(^```[^\n]*\n[\s\S]*?^```[^\n]*(?:\n|$)|^~~~[^\n]*\n[\s\S]*?^~~~[^\n]*(?:\n|$))/m)
    .map((part, index) => index % 2 ? part : transform(part)).join('')
}

async function* files(root, prefix = '') {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const name = posix.join(prefix, entry.name)
    if (entry.isDirectory()) yield* files(join(root, entry.name), name)
    else if (entry.isFile()) yield name
  }
}

export async function prepareContent(docsRoot, output) {
  // Only the caller-owned generated directory is replaced, never source docs.
  await rm(output, { recursive: true, force: true })
  const pages = []
  for (const locale of locales) {
    for await (const relative of files(join(docsRoot, locale))) {
      const sourcePath = posix.join(locale, relative)
      if (!/\.(md|html)$/.test(relative)) continue
      const html = relative.endsWith('.html')
      const destination = html
        ? posix.join('public', sourcePath.replace(/\.html$/, '-diagram.html'))
        : sourcePath.replace(/(^|\/)README\.md$/, '$1index.md')
      const body = await readFile(join(docsRoot, sourcePath), 'utf8')
      const content = rewriteLinks(body, sourcePath, html)
      const path = join(output, destination)
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, content, 'utf8')
      if (!html) pages.push({ source: sourcePath, route: destination.replace(/\.md$/, '.html') })
    }
  }
  await writeFile(join(output, 'pages.json'), JSON.stringify(pages, null, 2) + '\n')
  return pages
}

async function main() {
  const output = resolve(siteRoot, '.generated')
  const pages = await prepareContent(resolve(siteRoot, '..'), output)
  await cp(join(siteRoot, '.vitepress'), join(output, '.vitepress'), { recursive: true })
  await cp(join(siteRoot, 'public'), join(output, 'public'), { recursive: true })
  await writeFile(join(output, 'index.md'), `---
layout: home
title: FinShield documentation
hero:
  name: FinShield
  text: Technical documentation
  tagline: Install, connect your Agent, and verify its permission scope.
  actions:
    - theme: brand
      text: English documentation
      link: /en/
    - theme: alt
      text: 简体中文文档
      link: /zh-CN/
features:
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
