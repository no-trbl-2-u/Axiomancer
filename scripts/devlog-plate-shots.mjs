#!/usr/bin/env node
// scripts/devlog-plate-shots.mjs — before/after evidence for WORLD PLATES.
//
//   node scripts/devlog-plate-shots.mjs <since-ref> <date>
//   npm run devlog:plate-shots -- <since-ref> <date>
//
// The arena and map engravings are full-bleed backdrops a player stands in
// front of. When one is added or replaced, the change IS a picture — so the
// pair is just the two blobs: before is the file as git held it at <since>,
// after is the file in the tree now. Same design as `devlog-shots.mjs`:
// deterministic, derived from what the repo already commits, no browser, no
// model call.
//
// TWO DECISIONS WORTH THE INK
//
// 1. NO PIXEL THRESHOLD. `devlog-shots.mjs` gates screens at 2% differing
//    pixels because a screen capture moves for trivial reasons (a font hint, a
//    timestamp). A plate does not: the file only changes when somebody
//    replaced the engraving or re-graded it, and either is worth a look. The
//    plates are also WebP, which the repo's PNG differ cannot read — so a
//    pixel gate here would mean adding a decoder to buy a threshold that has
//    nothing to filter.
//
// 2. THE LICENCE GATE RUNS FIRST. A plate whose provenance cannot prove public
//    redistribution is not copied into the capture directory at all, so it can
//    never reach the public site by a later accident. The run says which files
//    it withheld and why.
//
// Exit 0 always (a collector, not a gate); boot failures exit 3.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { verdictFor } from './devlog-art-licence.mjs'
import { mergeManifest } from './devlog-catalog-shots.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ASSETS = join(ROOT, 'devlog', 'assets')

/** The directories that hold world plates, relative to the repo root. */
export const PLATE_DIRS = [
    'axiomancer-mobile/assets/images/maps',
    'axiomancer-mobile/assets/images/combat',
]

const git = (args, opts = {}) => spawnSync('git', args, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024, ...opts })

/** Plate files added or modified in `since..HEAD`. */
export function changedPlates(since) {
    const res = git(['diff', '--name-only', '--diff-filter=AMR', since, 'HEAD', '--', ...PLATE_DIRS], { encoding: 'utf-8' })
    if (res.status !== 0) return null
    return String(res.stdout).split('\n').map((s) => s.trim()).filter((p) => /\.(webp|png|jpg)$/i.test(p))
}

/**
 * Collect one night's plate pairs.
 *
 * @returns {{written: string[], lines: string[], withheld: {file:string,why:string}[]}}
 */
export function collectPlates({ since, date, files, outDir = join(ASSETS, date) }) {
    const written = []
    const lines = []
    const withheld = []

    for (const relPath of files) {
        const file = basename(relPath)
        const dir = basename(dirname(relPath))
        const name = file.replace(/\.\w+$/, '')

        const verdict = verdictFor(dir, file)
        if (!verdict.publish) {
            withheld.push({ file: relPath, why: verdict.why })
            continue
        }

        const absolute = join(ROOT, relPath)
        if (!existsSync(absolute)) continue
        mkdirSync(outDir, { recursive: true })
        const extension = file.replace(/^.*\./, '')

        writeFileSync(join(outDir, `plate-${name}.after.${extension}`), readFileSync(absolute))
        written.push(`plate-${name}.after.${extension}`)

        const show = git(['show', `${since}:${relPath}`], { encoding: 'buffer' })
        if (show.status === 0 && show.stdout?.length) {
            writeFileSync(join(outDir, `plate-${name}.before.${extension}`), show.stdout)
            written.push(`plate-${name}.before.${extension}`)
        }
        lines.push(`**Evidence:** plate ${name} — ${show.status === 0 ? 'replaced' : 'new plate'}`)
    }

    return { written, lines, withheld }
}

// ── CLI ─────────────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const [since, date] = process.argv.slice(2)
    if (!since || !date) {
        console.error('usage: devlog-plate-shots.mjs <since-ref> <date>')
        process.exit(3)
    }
    const files = changedPlates(since)
    if (files === null) {
        console.error(`devlog-plate-shots: git diff failed (is "${since}" a valid ref?)`)
        process.exit(3)
    }
    const outDir = join(ASSETS, date)
    const { written, lines, withheld } = collectPlates({ since, date, files, outDir })
    if (written.length) mergeManifest(outDir, date, since)

    for (const line of lines) console.log(`  ${line}`)
    for (const w of withheld) console.log(`  withheld ${w.file}: ${w.why}`)
    console.log(`devlog-plate-shots: wrote ${written.length} file(s) -> devlog/assets/${date}/`)
    console.log('EVIDENCE_JSON: ' + JSON.stringify(lines))
}
