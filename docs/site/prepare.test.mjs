import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { prepareContent, rewriteLinks } from './prepare.mjs'

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
    await writeFile(join(component, 'README.md'), '# DSH\n[Operation](OPERATIONS.md#setup)\n![Diagram](diagram.svg)\n[LICENSE](LICENSE)\n[Unavailable reference](missing.png)\n')
    await writeFile(join(source, 'site/translations/README-zh.md'), '# DSH 中文\n[English](README.md)\n[运行说明](OPERATIONS.md#setup)\n[未公开参考](internal.md)\n')
    await writeFile(join(component, 'OPERATIONS.md'), '# Operation\n## Setup\n')
    await writeFile(join(component, 'OPERATIONS-zh.md'), '# 运行说明\n## 设置\n')
    await writeFile(join(component, 'diagram.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>')
    const imports = [
      { source: 'integrations/dsh/windows/README.md', destination: 'en/agents/dsh.md' },
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
    assert.match(guide, /\(dsh-operations.md#setup\)/)
    assert.match(guide, /source-assets\/integrations\/dsh\/windows\/diagram.svg/)
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
      await writeFile(join(source, language, 'overview/windows.html'), '<html><a href="../README.md">Docs</a></html>')
    }
    await writeFile(join(source, 'legacy.md'), 'Do not publish aliases twice')
    await prepareContent(source, output)
    assert.match(await readFile(join(output, 'en/index.md'), 'utf8'), /# Docs/)
    assert.match(await readFile(join(output, 'en/overview/windows.md'), 'utf8'), /windows-diagram.html/)
    assert.match(await readFile(join(output, 'public/en/overview/windows-diagram.html'), 'utf8'), /\.\.\/index.html/)
    await assert.rejects(readFile(join(output, 'legacy.md')))
    await assert.rejects(readFile(join(output, 'en/README.md')))
    await writeFile(join(output, 'stale.md'), 'old build')
    await prepareContent(source, output)
    await assert.rejects(readFile(join(output, 'stale.md')))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
