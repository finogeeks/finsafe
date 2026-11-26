import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { prepareContent, rewriteLinks } from './prepare.mjs'
import { pageHead, siteUrl } from './.vitepress/site.mjs'

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
    assert.match(await readFile(join(output, 'public/en/agents/dsh.md'), 'utf8'), /\/source-assets\/integrations\/dsh\/windows\/diagram.svg/)
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
      await writeFile(join(source, language, 'README.md'), '# Docs\n[Windows](overview/windows.md)\n')
      await writeFile(join(source, language, 'overview/windows.md'), '# Windows\n[图解](windows.html)\n')
      await writeFile(join(source, language, 'overview/windows.html'), '<html><head><title>Diagram</title></head><body><a href="../README.md">Docs</a></body></html>')
    }
    await writeFile(join(source, 'legacy.md'), 'Do not publish aliases twice')
    await prepareContent(source, output)
    assert.match(await readFile(join(output, 'en/index.md'), 'utf8'), /# Docs/)
    assert.match(await readFile(join(output, 'en/overview/windows.md'), 'utf8'), /windows-diagram.html/)
    assert.match(await readFile(join(output, 'public/en/overview/windows-diagram.html'), 'utf8'), /\.\.\/index.html/)
    const diagram = await readFile(join(output, 'public/en/overview/windows-diagram.html'), 'utf8')
    assert.ok(diagram.includes('rel="canonical" href="https://finshield.finogeeks.club/en/overview/windows-diagram.html"'))
    assert.ok(diagram.includes('hreflang="zh-CN" href="https://finshield.finogeeks.club/zh-CN/overview/windows-diagram.html"'))
    assert.match(await readFile(join(output, 'public/robots.txt'), 'utf8'), /Sitemap: https:\/\/finshield.finogeeks.club\/sitemap.xml/)
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
