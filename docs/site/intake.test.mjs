import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

test('public PR intake accepts docs here and separates delivery and runtime changes', async () => {
  const workflow = await readFile(new URL('../../.github/workflows/pr-mirror-intake.yml', import.meta.url), 'utf8')
  assert.ok(!workflow.includes('actions/checkout'), 'Privileged intake must not execute PR code')
  const source = workflow.split("          node --input-type=module <<'JS' > /tmp/classify.txt\n")[1]
    .split('\n          JS')[0].split('\n').map((line) => line.slice(10)).join('\n')
  const root = await mkdtemp(join(tmpdir(), 'finshield-intake-'))
  try {
    const files = join(root, 'files.txt')
    for (const [paths, verdict] of [
      [['docs/en/protection/defaults.md', 'docs/site/prepare.mjs', 'AGENTS.md'], 'docs-only'],
      [['integrations/dsh/windows/README.md', 'pii-plugins/docs/protocol.md'], 'docs-only'],
      [['docs/en/README.md', 'integrations/dsh/windows/client.js'], 'maintainer-review'],
      [['.github/workflows/docs-pages.yml'], 'maintainer-review'],
      [['crates/finsafe-core/src/lib.rs'], 'runtime-or-mixed'],
      [[], 'empty'],
    ]) {
      await writeFile(files, paths.join('\n'), 'utf8')
      const result = spawnSync(process.execPath, ['--input-type=module', '-e', source],
        { env: { ...process.env, PR_FILES: files }, encoding: 'utf8' })
      assert.equal(result.status, 0, result.stderr)
      assert.equal(result.stdout.trim(), verdict)
    }
    assert.ok(workflow.includes('Maintainers can review and merge this PR here'))
  } finally { await rm(root, { recursive: true, force: true }) }
})
