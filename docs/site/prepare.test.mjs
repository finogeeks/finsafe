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
