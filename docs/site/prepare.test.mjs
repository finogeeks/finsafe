import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { prepareContent, rewriteLinks } from './prepare.mjs'
import { pageHead, siteUrl, configurePublicLinks, publicLink } from './.vitepress/site.mjs'
import { createMarkdownRenderer } from 'vitepress'

test('the former technical whitepaper retains its URL without entering current AI instructions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'finshield-paper-archive-'))
  try {
    for (const locale of ['en', 'zh-CN']) {
      await mkdir(join(root, 'docs', locale, 'reference'), { recursive: true })
      await writeFile(join(root, 'docs', locale, 'README.md'), '# Documentation\n')
      await writeFile(join(root, 'docs', locale, 'reference/whitepaper.md'), '# Evaluation archive\nARCHIVED_BODY_ONLY\n')
    }
    const output = join(root, 'out')
    await prepareContent(join(root, 'docs'), output)
    const catalog = JSON.parse(await readFile(join(output, 'public/docs.json'), 'utf8'))
    for (const locale of ['en', 'zh-CN']) {
      assert.equal(catalog.pages.find((page) => page.route === `${locale}/reference/whitepaper.html`).kind, 'historical-reference')
      assert.ok((await readFile(join(output, `public/${locale}/reference/whitepaper.md`), 'utf8')).includes('ARCHIVED_BODY_ONLY'))
      const bundle = await readFile(join(output, `public/${locale}/llms-full.txt`), 'utf8')
      assert.ok(bundle.includes(`${locale}/reference/whitepaper.html`))
      assert.ok(!bundle.includes('ARCHIVED_BODY_ONLY'), 'Superseded technical claims must stay out of current instruction bodies')
    }
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('published whitepapers retain site assets and edition scope in AI resources', async () => {
  const root = await mkdtemp(join(tmpdir(), 'finshield-publication-'))
  try {
    for (const locale of ['en', 'zh-CN']) {
      await mkdir(join(root, 'docs', locale), { recursive: true })
      await writeFile(join(root, 'docs', locale, 'README.md'), '# Documentation\n')
    }
    await mkdir(join(root, 'docs/zh-CN/resources'), { recursive: true })
    await writeFile(join(root, 'docs/zh-CN/resources/paper.md'), '# 治理白皮书\n[PDF](/whitepapers/paper.pdf)\n[全文](/zh-CN/resources/paper-full.html)\n<img src="/whitepapers/cover.webp" alt="封面">\n')
    await writeFile(join(root, 'docs/zh-CN/resources/paper-full.md'), '# 治理白皮书全文\n2026-11版；出版物，不是当前操作指南。\n')
    const publication = { title: '治理白皮书', edition: '2026-11', publisher: '出版机构',
      landingRoute: 'zh-CN/resources/paper.html', fullTextRoute: 'zh-CN/resources/paper-full.html',
      pdfPath: '/whitepapers/paper.pdf', coverPath: '/whitepapers/cover.webp' }
    const output = join(root, 'out')
    await prepareContent(join(root, 'docs'), output, { publications: [publication] })
    const body = await readFile(join(output, 'zh-CN/resources/paper.md'), 'utf8')
    assert.ok(body.includes('[PDF](/whitepapers/paper.pdf)'), 'PDF stays on the documentation origin')
    assert.ok(body.includes('[全文](/zh-CN/resources/paper-full.html)'), 'Root-relative website routes stay local')
    assert.ok(body.includes('src="/whitepapers/cover.webp"'), 'The original cover remains a site asset')
    const catalog = JSON.parse(await readFile(join(output, 'public/docs.json'), 'utf8'))
    const page = catalog.pages.find((entry) => entry.route === publication.fullTextRoute)
    assert.equal(page.kind, 'publication')
    assert.equal(page.publication.edition, '2026-11')
    const topic = await readFile(join(output, 'public/zh-CN/resources/llms.txt'), 'utf8')
    assert.ok(topic.includes('paper-full.md'))
    const full = await readFile(join(output, 'public/zh-CN/llms-full.txt'), 'utf8')
    assert.ok(full.includes('Publication edition: 2026-11'))
    const { contentHead } = await import('./.vitepress/site.mjs')
    const head = contentHead(page)
    assert.equal(head.find(([, a]) => a.property === 'og:image')[1].content,
      'https://finshield.finogeeks.club/whitepapers/cover.webp')
    const graph = JSON.parse(head.find(([, a]) => a.type === 'application/ld+json')[2])['@graph']
    const data = graph.find((entry) => entry['@type'] === 'WebPage')
    assert.equal(data.publisher.name, publication.publisher)
    assert.equal(data.isBasedOn, 'https://finshield.finogeeks.club/whitepapers/paper.pdf')
    assert.ok(!data.datePublished, 'A publication month does not invent an exact publication day')
    assert.equal(pageHead(publication.landingRoute, catalog.pages.map((entry) => entry.route)).length, 1)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('page discovery metadata describes the current page and safely serializes structured data', async () => {
  const { contentHead, renderHead } = await import('./.vitepress/site.mjs')
  const page = { route: 'zh-CN/architecture/inspector.html', title: 'Inspector <request>',
    description: '检查 "当前" 请求与证书 & PII；示例 </script><script>alert(1)</script>。' }
  const head = contentHead(page)
  const meta = (key) => head.find(([tag, attrs]) => tag === 'meta' && (attrs.name === key || attrs.property === key))?.[1].content
  assert.equal(meta('og:url'), 'https://finshield.finogeeks.club/zh-CN/architecture/inspector.html')
  assert.equal(meta('og:description'), page.description)
  assert.equal(meta('twitter:title'), page.title)
  const structured = head.find(([tag, attrs]) => tag === 'script' && attrs.type === 'application/ld+json')[2]
  const graph = JSON.parse(structured)['@graph']
  assert.equal(graph.find((entry) => entry['@type'] === 'WebPage').description, page.description)
  assert.equal(graph.find((entry) => entry['@type'] === 'WebPage').inLanguage, 'zh-CN')
  assert.ok(!structured.includes('<'), 'Source text cannot close the structured-data script')
  assert.ok(!graph.some((entry) => entry.aggregateRating || entry.datePublished || entry.author))
  const html = renderHead([['meta', { name: 'description', content: page.description }], ...head])
  assert.ok(html.includes('&quot;当前&quot;') && html.includes('&amp; PII'))
  assert.equal((html.match(/<script\b/g) ?? []).length, 1)
  assert.ok(html.includes('</script>'))
})

test('page descriptions must cover exactly the public routes with distinct summaries', async () => {
  const root = await mkdtemp(join(tmpdir(), 'finshield-descriptions-'))
  try {
    for (const locale of ['en', 'zh-CN']) {
      await mkdir(join(root, 'docs', locale), { recursive: true })
      await writeFile(join(root, 'docs', locale, 'README.md'), '# Documentation\n')
    }
    const descriptions = { 'index.html': 'Choose a documentation language.',
      'en/index.html': 'Find English installation and protection guides.',
      'zh-CN/index.html': '查找中文安装、防护与开发集成说明。' }
    for (const [invalid, message] of [
      [{ ...descriptions, 'en/index.html': '' }, /Missing page description/],
      [{ ...descriptions, 'private.html': 'Not a published page.' }, /Unknown description route/],
      [{ ...descriptions, 'en/index.html': descriptions['index.html'] }, /Duplicate page description/],
    ]) await assert.rejects(prepareContent(join(root, 'docs'), join(root, 'out'), { descriptions: invalid }), message)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('AI bundles preserve source content and resolve links from each original page', async () => {
  const root = await mkdtemp(join(tmpdir(), 'finshield-ai-bundle-'))
  try {
    for (const locale of ['en', 'zh-CN']) {
      await mkdir(join(root, 'docs', locale, 'development'), { recursive: true })
      await writeFile(join(root, 'docs', locale, 'README.md'), '# Documentation\n[Guide](development/guide.md#scope)\n')
      await writeFile(join(root, 'docs', locale, 'development/guide.md'), '# Integration guide\n\n## Scope\n[Home](../README.md)\n\n```sh\ncat ../README.md\n```\n')
    }
    const descriptions = { 'index.html': 'Choose a documentation language.',
      'en/index.html': 'Find English installation and protection guides.',
      'zh-CN/index.html': '查找中文安装、防护与开发集成说明。',
      'en/development/guide.html': 'Integrate a command with explicit scope and verification.',
      'zh-CN/development/guide.html': '按明确范围接入命令，并验证实际权限。' }
    const output = join(root, 'out')
    await prepareContent(join(root, 'docs'), output, { descriptions })
    const catalog = JSON.parse(await readFile(join(output, 'public/docs.json'), 'utf8'))
    const guide = catalog.pages.find((page) => page.url === 'https://finshield.finogeeks.club/en/development/guide.html')
    assert.equal(guide.description, descriptions['en/development/guide.html'])
    assert.equal(guide.markdownUrl, 'https://finshield.finogeeks.club/en/development/guide.md')
    assert.equal(guide.language, 'en')
    assert.ok((await readFile(join(output, 'public/en/development/llms.txt'), 'utf8')).includes(guide.description))
    const full = await readFile(join(output, 'public/en/llms-full.txt'), 'utf8')
    assert.ok(full.includes('[Home](https://finshield.finogeeks.club/en/index.md)'))
    assert.ok(full.includes('[Guide](https://finshield.finogeeks.club/en/development/guide.md#scope)'))
    assert.ok(full.includes('cat ../README.md'), 'Code is not rewritten as navigation')
    assert.ok(full.includes('## Scope'))
    const metadata = JSON.parse(await readFile(join(output, 'metadata.json'), 'utf8'))
    assert.equal(metadata['en/development/guide.html'].description, guide.description)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('standalone diagrams use native navigation while documentation keeps client routing', async () => {
  const md = await createMarkdownRenderer(process.cwd(), { config: configurePublicLinks })
  const html = md.render('[Diagram](../overview/windows-diagram.html#data)\n'
    + '[Reference][figure]\n\n[figure]: /en/overview/linux-macos-diagram.html\n\n'
    + '[Guide](../overview/windows.md) [Other](https://example.com/windows-diagram.html)')
  assert.match(html, /<a[^>]*href="[^\"]*windows-diagram.html#data"[^>]*target="_self"/)
  assert.match(html, /<a[^>]*href="\/en\/overview\/linux-macos-diagram.html"[^>]*target="_self"/)
  assert.match(html, /<a href="[^\"]*windows.html">Guide<\/a>/)
  assert.match(html, /https:\/\/example.com\/windows-diagram.html" target="_blank"/)
  const license = md.render('https://github.com/rober42539/lao-dictionary/LICENSE.txt')
  assert.match(license, /href="https:\/\/github.com\/rober42539\/lao-dictionary\/blob\/main\/LICENSE.txt"/)
  assert.ok(license.includes('>https://github.com/rober42539/lao-dictionary/LICENSE.txt</a>'), 'Preserve quoted notice text')
  assert.equal(publicLink('https://github.com/Geeksfino/finsafe/pull/409'), null)
  assert.equal(publicLink('https://github.com/finogeeks/finsafe/issues/74'), 'https://github.com/finogeeks/finsafe/issues/74')
})

test('complete DSH and OpenCode tutorials have website-owned sources', async () => {
  const manifest = JSON.parse(await readFile(new URL('./content.json', import.meta.url), 'utf8'))
  for (const route of ['en/agents/dsh.md', 'zh-CN/agents/dsh.md', 'en/agents/opencode.md', 'zh-CN/agents/opencode.md']) {
    const entry = manifest.documents.find((document) => document.destination === route)
    assert.ok(entry?.source.startsWith('docs/site/guides/'), `${route} must not read the short plugin README`)
    const body = await readFile(new URL('../../' + entry.source, import.meta.url), 'utf8')
    assert.ok((body.match(/^## /gm) ?? []).length >= 5, `${route} must retain installation and operating guidance`)
    assert.match(body, /```/)
  }
})

test('legacy private-source overrides cannot change public build inputs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'finshield-public-owner-'))
  const previous = process.env.FINSHIELD_DOCS_REPO
  try {
    for (const locale of ['en', 'zh-CN']) {
      await mkdir(join(root, 'docs', locale), { recursive: true })
      await writeFile(join(root, 'docs', locale, 'README.md'), '# Public docs\n')
    }
    await writeFile(join(root, 'guide.md'), '# Public integration guide\n')
    process.env.FINSHIELD_DOCS_REPO = '/private-source-must-not-be-used'
    await prepareContent(join(root, 'docs'), join(root, 'out'), { repositoryRoot: root,
      documents: [{ source: 'guide.md', upstreamSource: 'private/missing.md', destination: 'en/guide.md' }] })
    assert.match(await readFile(join(root, 'out/en/guide.md'), 'utf8'), /Public integration guide/)
  } finally {
    if (previous === undefined) delete process.env.FINSHIELD_DOCS_REPO
    else process.env.FINSHIELD_DOCS_REPO = previous
    await rm(root, { recursive: true, force: true })
  }
})

test('metadata uses reciprocal existing translations and canonical directory URLs', () => {
  const routes = ['index.html', 'en/index.html', 'zh-CN/index.html', 'en/only.html']
  assert.equal(siteUrl('zh-CN/protection/index.html'), 'https://finshield.finogeeks.club/zh-CN/protection/')
  const english = pageHead('en/index.html', routes)
  const chinese = pageHead('zh-CN/index.html', routes)
  for (const head of [english, chinese]) {
    assert.deepEqual(head.filter(([, attrs]) => attrs.hreflang).map(([, attrs]) => attrs.hreflang), ['en', 'zh-CN', 'x-default'])
  }
  assert.equal(pageHead('en/only.html', routes).length, 1, 'Do not advertise a missing translation')
  assert.deepEqual(pageHead('404.html', routes), [['meta', { name: 'robots', content: 'noindex' }]])
  assert.equal(pageHead('index.html', routes).at(-1)[1].href, 'https://finshield.finogeeks.club/')
})

test('Markdown links use site routes while commands and remote resources stay intact', () => {
  const input = '# Guide\n[Docs](../README.md) [安装](../../zh-CN/getting-started/install.md#验证授权范围)\n'
    + '[Diagram](../overview/windows.html#files) [Download](https://example.com/a.md)\n'
    + '```sh\ncat ../README.md\n```\n'
    + '[guide]: ../agents/codex.md#setup\n'
  const actual = rewriteLinks(input, 'en/getting-started/install.md')
  assert.match(actual, /\(\.\.\/index\.md\)/)
  assert.match(actual, /\.\.\/\.\.\/zh-CN\/getting-started\/install\.md#验证授权范围/)
  assert.match(actual, /\.\.\/overview\/windows-diagram\.html#files/)
  assert.match(actual, /https:\/\/example.com\/a.md/)
  assert.match(actual, /cat \.\.\/README.md/)
  assert.match(actual, /\[guide\]: \.\.\/agents\/codex.md#setup/)
})

test('component guides, cross-document links and diagrams remain on the documentation site', async () => {
  const root = await mkdtemp(join(tmpdir(), 'finshield-components-'))
  try {
    const source = join(root, 'docs')
    const component = join(root, 'integrations/dsh/windows')
    await mkdir(component, { recursive: true })
    await mkdir(join(source, 'site/translations'), { recursive: true })
    for (const locale of ['en', 'zh-CN']) {
      await mkdir(join(source, locale), { recursive: true })
      await writeFile(join(source, locale, 'README.md'), '# Docs\n[DSH](https://github.com/finogeeks/finsafe/blob/main/integrations/dsh/windows/README.md)')
    }
    await writeFile(join(component, 'README.md'), '# DSH\r\n[Operation](OPERATIONS.md#setup)\r\n![Diagram](diagram.svg)\r\n[LICENSE](LICENSE)\r\n[Unavailable reference](missing.png)\r\n')
    await writeFile(join(source, 'site/translations/README-zh.md'), '# DSH 中文\n[English](README.md)\n[运行说明](OPERATIONS.md#setup)\n[未公开参考](internal.md)\n')
    await writeFile(join(component, 'OPERATIONS.md'), '# Operation\n## Setup\n')
    await writeFile(join(component, 'OPERATIONS-zh.md'), '# 运行说明\n## 设置\n')
    await writeFile(join(component, 'diagram.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>')
    const imports = [
      { source: 'integrations/dsh/windows/README.md', destination: 'en/agents/dsh.md', lead: 'Read [Operation](OPERATIONS.md#setup) first.' },
      { source: 'integrations/dsh/windows/OPERATIONS.md', destination: 'en/agents/dsh-operations.md' },
      { source: 'docs/site/translations/README-zh.md', linkSource: 'integrations/dsh/windows/README-zh.md', translationOf: 'integrations/dsh/windows/README.md', destination: 'zh-CN/agents/dsh.md' },
      { source: 'integrations/dsh/windows/OPERATIONS-zh.md', translationOf: 'integrations/dsh/windows/OPERATIONS.md', destination: 'zh-CN/agents/dsh-operations.md' },
    ]
    const output = join(root, 'site')
    await prepareContent(source, output, { repositoryRoot: root, documents: imports,
      unpublishedReferences: ['integrations/dsh/windows/internal.md', 'integrations/dsh/windows/missing.png'],
      publicAssets: ['integrations/dsh/windows/diagram.svg'] })
    assert.match(await readFile(join(output, 'en/index.md'), 'utf8'), /\(agents\/dsh.md\)/)
    const guide = await readFile(join(output, 'en/agents/dsh.md'), 'utf8')
    assert.match(guide, /^# DSH\n\nRead \[Operation\]/)
    assert.match(guide, /\(dsh-operations.md#setup\)/)
    assert.match(guide, /source-assets\/integrations\/dsh\/windows\/diagram.svg/)
    assert.match(await readFile(join(output, 'public/en/agents/dsh.md'), 'utf8'), /\(\/source-assets\/integrations\/dsh\/windows\/diagram.svg\)/)
    assert.match(guide, /\[LICENSE\]\(https:\/\/github.com\/finogeeks\/finsafe\/blob\/main\/integrations\/dsh\/windows\/LICENSE\)/)
    assert.match(await readFile(join(output, 'zh-CN/index.md'), 'utf8'), /\(agents\/dsh.md\)/)
    const chinese = await readFile(join(output, 'zh-CN/agents/dsh.md'), 'utf8')
    assert.match(chinese, /\[English\]\(\.\.\/\.\.\/en\/agents\/dsh.md\)/)
    assert.match(chinese, /\[运行说明\]\(dsh-operations.md#设置\)/)
    assert.match(chinese, /未公开参考/)
    assert.doesNotMatch(chinese, /internal\.md/)
    assert.match(await readFile(join(output, 'public/source-assets/integrations/dsh/windows/diagram.svg'), 'utf8'), /<svg/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('preparation publishes only canonical locales and keeps diagrams separate from Markdown routes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'finshield-docs-'))
  try {
    const source = join(root, 'docs')
    const output = join(root, 'site')
    for (const language of ['en', 'zh-CN']) {
      await mkdir(join(source, language, 'overview'), { recursive: true })
      await writeFile(join(source, language, 'README.md'), '# Docs\n[Windows](overview/windows.md)\n[Source PR #409](https://github.com/Geeksfino/finsafe/pull/409)\n')
      await writeFile(join(source, language, 'overview/windows.md'), '# Windows\n[图解](windows.html)\n')
      await writeFile(join(source, language, 'overview/windows.html'), '<html><head><title>Diagram</title></head><body><a href="../README.md">Docs</a></body></html>')
    }
    await writeFile(join(source, 'legacy.md'), 'Do not publish aliases twice')
    await prepareContent(source, output)
    assert.match(await readFile(join(output, 'en/index.md'), 'utf8'), /# Docs/)
    assert.match(await readFile(join(output, 'en/index.md'), 'utf8'), /\nSource PR #409\n/)
    assert.doesNotMatch(await readFile(join(output, 'en/index.md'), 'utf8'), /github.com\/Geeksfino/)
    assert.match(await readFile(join(output, 'en/overview/windows.md'), 'utf8'), /windows-diagram.html/)
    assert.match(await readFile(join(output, 'public/en/overview/windows-diagram.html'), 'utf8'), /\.\.\/index.html/)
    const diagram = await readFile(join(output, 'public/en/overview/windows-diagram.html'), 'utf8')
    assert.ok(diagram.includes('rel="canonical" href="https://finshield.finogeeks.club/en/overview/windows-diagram.html"'))
    assert.ok(diagram.includes('hreflang="zh-CN" href="https://finshield.finogeeks.club/zh-CN/overview/windows-diagram.html"'))
    assert.match(await readFile(join(output, 'public/robots.txt'), 'utf8'), /Sitemap: https:\/\/finshield.finogeeks.club\/sitemap.xml/)
    assert.deepEqual((await readFile(join(output, 'public/sitemap.txt'), 'utf8')).trimEnd().split('\n').sort(), [
      'https://finshield.finogeeks.club/',
      ...['en', 'zh-CN'].flatMap((locale) => [
        `https://finshield.finogeeks.club/${locale}/`,
        `https://finshield.finogeeks.club/${locale}/overview/windows.html`,
        `https://finshield.finogeeks.club/${locale}/overview/windows-diagram.html`,
      ]),
    ].sort())
    assert.match(await readFile(join(output, 'public/robots.txt'), 'utf8'), /Sitemap: https:\/\/finshield.finogeeks.club\/sitemap.txt/)
    await assert.rejects(readFile(join(output, 'legacy.md')))
    await assert.rejects(readFile(join(output, 'en/README.md')))
    await writeFile(join(output, 'stale.md'), 'old build')
    await prepareContent(source, output)
    await assert.rejects(readFile(join(output, 'stale.md')))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('LLM indexes expose localized Markdown from the same public pages', async () => {
  const root = await mkdtemp(join(tmpdir(), 'finshield-llms-'))
  try {
    const source = join(root, 'docs'), output = join(root, 'site')
    for (const [locale, title] of [['en', 'Protection defaults'], ['zh-CN', '默认防护']]) {
      await mkdir(join(source, locale, 'protection'), { recursive: true })
      await writeFile(join(source, locale, 'README.md'), '# FinShield\n[Protection](protection/README.md)\n')
      await writeFile(join(source, locale, 'protection/README.md'), '# ' + title + '\n[Details](defaults.md)\n```sh\ncat ../README.md\n```\n')
      await writeFile(join(source, locale, 'protection/defaults.md'), '# ' + title + '\nHost network defaults do not enable PII.\n')
    }
    await mkdir(join(source, 'internal'), { recursive: true })
    await writeFile(join(source, 'internal/private.md'), '# Unpublished internal material\n')
    await prepareContent(source, output)
    const rootIndex = await readFile(join(output, 'public/llms.txt'), 'utf8')
    assert.match(rootIndex, /https:\/\/finshield.finogeeks.club\/en\/llms\.txt/)
    assert.match(rootIndex, /https:\/\/finshield.finogeeks.club\/zh-CN\/llms\.txt/)
    const english = await readFile(join(output, 'public/en/llms.txt'), 'utf8')
    const chinese = await readFile(join(output, 'public/zh-CN/llms.txt'), 'utf8')
    assert.ok(chinese.startsWith('\uFEFF# FinShield 文档中心'), 'Serve an explicit UTF-8 marker for plain-text readers')
    assert.match(english, /Protection defaults.*https:\/\/finshield.finogeeks.club\/en\/protection\/index\.md/)
    assert.match(chinese, /默认防护.*https:\/\/finshield.finogeeks.club\/zh-CN\/protection\/index\.md/)
    assert.doesNotMatch(chinese, /Protection defaults|Unpublished internal material/)
    assert.doesNotMatch(english, /Unpublished internal material/)
    const markdown = await readFile(join(output, 'public/en/protection/index.md'), 'utf8')
    assert.ok(markdown.startsWith('\uFEFF# Protection defaults'))
    assert.match(markdown, /\[Details\]\(defaults.md\)/)
    assert.match(markdown, /cat \.\.\/README.md/)
    await assert.rejects(readFile(join(output, 'public/internal/private.md')))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
