// axiomancer-mobile/scripts/critique-drive.test.mjs — phase 94: the artifact
// cleanup must be scoped to this driver's own output paths, never the whole
// `.critique-artifacts/` root (AUDIT.md [3.2] — a shared-directory wipe
// destroyed an unrelated 54-cell fresh-eyes capture set on 2026-09-12).
//
//   node --test axiomancer-mobile/scripts/critique-drive.test.mjs
//
// This only imports the pure path-list helper; the guarded `main()` (browser
// launch + expo export) never runs under `node --test` because the module
// only self-invokes when executed directly (`process.argv[1]` check).

import assert from 'node:assert/strict'
import test from 'node:test'
import { join } from 'node:path'

import { ownArtifactPaths } from './critique-drive.mjs'

test('ownArtifactPaths is exactly mobile/desktop/manifest.json under the root', () => {
    const root = '/tmp/fake-critique-artifacts'
    const paths = ownArtifactPaths(root)
    assert.deepEqual(paths.sort(), [
        join(root, 'desktop'),
        join(root, 'manifest.json'),
        join(root, 'mobile'),
    ].sort())
})

test('ownArtifactPaths never returns the root itself or an unrelated subtree', () => {
    const root = '/tmp/fake-critique-artifacts'
    const paths = ownArtifactPaths(root)
    assert.ok(!paths.includes(root))
    assert.ok(!paths.some((p) => p.endsWith('fresh-eyes')))
})
