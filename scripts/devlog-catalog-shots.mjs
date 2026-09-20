#!/usr/bin/env node
// scripts/devlog-catalog-shots.mjs — before/after evidence for CARDS, FOES and
// AFFLICTIONS, the way `devlog-shots.mjs` does it for screens.
//
//   node scripts/devlog-catalog-shots.mjs <since-ref> <date>
//   npm run devlog:catalog-shots -- <since-ref> <date>
//
// THE PATTERN THIS FOLLOWS
// ------------------------
// `axiomancer-mobile/scripts/devlog-shots.mjs` is the model the publish prompt
// names: deterministic, derived from what the repo already commits, gated on
// significance, no browser and no model call. This script is the same shape
// for content that is DATA rather than pixels.
//
//   before = the catalog as the engine exported it at <since-ref>
//   after  = the catalog as the engine exports it now
//   gate   = a field a player can actually read changed
//
// WHY IT EXPORTS TWICE INSTEAD OF PARSING TYPESCRIPT
// --------------------------------------------------
// The card libraries are TypeScript object literals. A regex over them would
// be a second, quieter implementation of the engine's own view-model — the
// exact "second, prettier truth" the prompt warns about. So "before" is
// produced by running the ENGINE'S OWN exporter inside a detached git worktree
// at <since-ref>, with the workspace `node_modules` symlinked in (both the
// root's and each package's — a worktree that borrows only the root's resolves
// the hoisted TypeScript and dies with TS5095, the trap AGENTS.md documents).
// If that export fails for any reason the run degrades to "new item" evidence
// and says so; it never guesses at what a card used to say.
//
// Exit 0 always (a collector, not a gate); boot failures exit 3.

import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { cardPlate, foePlate } from './devlog-card-plate.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'devlog', 'data')
const ASSETS = join(ROOT, 'devlog', 'assets')

/** Workspaces whose own node_modules a worktree must borrow (see the header). */
const WORKSPACES = ['axiomancer-mechanics', 'axiomancer-mobile', 'axiomancer-card-editor']

/**
 * The significance gate, per kind: the fields a READER can see.
 *
 * This is the card's equivalent of `devlog-shots.mjs`'s 2% pixel threshold.
 * A card whose internal pricing comment moved has not changed for a player; a
 * card whose printed text changed has. Every kind needs its own version of the
 * threshold or the log fills with noise and the signal dies.
 */
export const PUBLISHED_FIELDS = {
    cards: (card) => ({
        name: card.name,
        free: [card.face?.freeGlyph, card.face?.freeKw, card.face?.freeVal].join(' '),
        paid: card.face?.paid,
    }),
    enemies: (foe) => ({
        name: foe.name,
        level: foe.level,
        difficulty: foe.difficulty,
        maxHealth: foe.maxHealth,
        stats: foe.stats,
        logic: foe.logicBlurb,
        hint: foe.stanceHint,
    }),
    effects: (effect) => ({
        name: effect.name,
        kw: effect.kw,
        type: effect.type,
        chips: (effect.chips || []).map((c) => `${c.k} ${c.v ?? ''}`).join(' · '),
    }),
}

/** At most this many pairs per night: a post with more is a post that needed two. */
export const MAX_PAIRS = 8

const git = (args, opts = {}) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf-8', ...opts })

/** The record's published shape, as one comparable string. */
const fingerprint = (kind, record) => JSON.stringify(PUBLISHED_FIELDS[kind](record))

/**
 * Diff two catalog snapshots on their published fields only.
 *
 * @returns {{changed: object[], added: object[], retired: object[]}}
 */
export function diffCatalog(kind, before, after) {
    const index = new Map((before || []).map((r) => [r.id, r]))
    const seen = new Set()
    const changed = []
    const added = []

    for (const record of after || []) {
        seen.add(record.id)
        const old = index.get(record.id)
        if (!old) { added.push({ record, before: null }); continue }
        if (fingerprint(kind, old) !== fingerprint(kind, record)) changed.push({ record, before: old })
    }
    const retired = (before || []).filter((r) => !seen.has(r.id))
    return { changed, added, retired }
}

/** Read one exported catalog file from a tree's devlog/data. */
function readCatalog(dataDir, name) {
    const path = join(dataDir, `${name}.json`)
    if (!existsSync(path)) return null
    try {
        return JSON.parse(readFileSync(path, 'utf8'))
    } catch {
        return null
    }
}

/** Run the engine's own exporter in `cwd`. Returns true when it wrote a catalog. */
function runExport(cwd) {
    const res = spawnSync('npm', ['run', 'catalog:export'], { cwd, encoding: 'utf-8', stdio: 'pipe' })
    return res.status === 0
}

/**
 * Export the catalog as it stood at `ref`, in a throwaway worktree.
 * Returns `null` when the export cannot be produced — never a guess.
 */
export function snapshotAt(ref, { keep = false } = {}) {
    const dir = join(ROOT, '.devlog-catalog-snapshot')
    rmSync(dir, { recursive: true, force: true })
    const add = git(['worktree', 'add', '--detach', dir, ref])
    if (add.status !== 0) {
        console.error(`devlog-catalog-shots: cannot check out "${ref}" — ${add.stderr.trim()}`)
        return null
    }
    try {
        // Borrow the installed dependencies rather than installing again: an
        // npm install per night, per ref, would dwarf the rest of the digest.
        symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'), 'dir')
        for (const workspace of WORKSPACES) {
            const source = join(ROOT, workspace, 'node_modules')
            if (existsSync(source) && existsSync(join(dir, workspace))) {
                symlinkSync(source, join(dir, workspace, 'node_modules'), 'dir')
            }
        }
        if (!runExport(dir)) {
            console.error(`devlog-catalog-shots: the exporter failed at ${ref} — treating every item as new`)
            return null
        }
        const snapshotDir = join(dir, 'devlog', 'data')
        return {
            cards: readCatalog(snapshotDir, 'cards') || [],
            enemies: readCatalog(snapshotDir, 'enemies') || [],
            effects: readCatalog(snapshotDir, 'effects') || [],
        }
    } finally {
        if (!keep) {
            rmSync(dir, { recursive: true, force: true })
            git(['worktree', 'prune'])
        }
    }
}

/** The catalog as it stands now, exporting it first if the tree has none. */
export function snapshotHead() {
    if (!existsSync(join(DATA, 'cards.json'))) runExport(ROOT)
    return {
        cards: readCatalog(DATA, 'cards') || [],
        enemies: readCatalog(DATA, 'enemies') || [],
        effects: readCatalog(DATA, 'effects') || [],
    }
}

/** An affliction's rules text, as one readable line — its "plate". */
export function ruleText(effect) {
    const fields = PUBLISHED_FIELDS.effects(effect)
    return [effect.name, fields.kw, fields.chips].filter(Boolean).join(' — ')
}

/**
 * Write one night's catalog evidence.
 *
 * @returns {{written: string[], lines: string[], skipped: number}}
 *   `lines` are the `**Evidence:**` lines the /digest author pastes into the
 *   matching work-item card.
 */
export function writeEvidence({ head, before, date, outDir = join(ASSETS, date) }) {
    const written = []
    const lines = []
    let skipped = 0

    const emit = (name, contents) => {
        mkdirSync(outDir, { recursive: true })
        writeFileSync(join(outDir, name), contents)
        written.push(name)
    }

    for (const [kind, key, render] of [
        ['cards', 'card', cardPlate],
        ['enemies', 'foe', foePlate],
    ]) {
        const { changed, added } = diffCatalog(kind, before?.[kind] ?? null, head[kind])
        const all = [...changed, ...added].sort((a, b) => a.record.id.localeCompare(b.record.id))
        for (const item of all.slice(0, MAX_PAIRS)) {
            emit(`${key}-${item.record.id}.after.svg`, render(item.record, { note: `as it stands on ${date}` }))
            if (item.before) emit(`${key}-${item.record.id}.before.svg`, render(item.before, { note: 'as it stood before' }))
            lines.push(`**Evidence:** ${key} ${item.record.id} — ${item.before ? 'reprinted' : 'new'}`)
        }
        skipped += Math.max(0, all.length - MAX_PAIRS)
    }

    // Afflictions are a TEXT pair: a keyword's before/after is its rules text
    // and its carriers, and an image of a sentence is an invented picture.
    const effects = diffCatalog('effects', before?.effects ?? null, head.effects)
    const effectItems = [...effects.changed, ...effects.added].sort((a, b) => a.record.id.localeCompare(b.record.id))
    for (const item of effectItems.slice(0, MAX_PAIRS)) {
        emit(`rule-${item.record.id}.after.json`, JSON.stringify({
            id: item.record.id,
            before: item.before ? ruleText(item.before) : '',
            after: ruleText(item.record),
        }, null, 2) + '\n')
        lines.push(`**Evidence:** rule ${item.record.id} — ${item.before ? 'reworded' : 'new'}`)
    }
    skipped += Math.max(0, effectItems.length - MAX_PAIRS)

    return { written, lines, skipped, retired: [...diffCatalog('cards', before?.cards ?? null, head.cards).retired] }
}

/** Merge this run's provenance into the day's capture manifest. */
export function mergeManifest(outDir, date, since) {
    const path = join(outDir, 'manifest.json')
    const existing = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { date }
    const log = git(['log', '-1', '--format=%cs', since])
    mkdirSync(outDir, { recursive: true })
    writeFileSync(path, JSON.stringify({
        ...existing,
        date,
        since: since || existing.since || null,
        sinceDate: existing.sinceDate || (log.status === 0 ? log.stdout.trim() : ''),
        catalogEvidence: true,
    }, null, 2) + '\n')
}

// ── CLI ─────────────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const [since, date] = process.argv.slice(2)
    if (!since || !date) {
        console.error('usage: devlog-catalog-shots.mjs <since-ref> <date>')
        process.exit(3)
    }
    const head = snapshotHead()
    if (!head.cards.length) {
        console.error('devlog-catalog-shots: no catalog to read — run `npm run catalog:export` first')
        process.exit(3)
    }
    const before = snapshotAt(since)
    const outDir = join(ASSETS, date)
    const { written, lines, skipped, retired } = writeEvidence({ head, before, date, outDir })
    if (written.length) mergeManifest(outDir, date, since)

    for (const line of lines) console.log(`  ${line}`)
    console.log(`devlog-catalog-shots: wrote ${written.length} plate(s) -> devlog/assets/${date}/`
        + (skipped ? ` (${skipped} further change(s) held back — a post with more than ${MAX_PAIRS} pairs needed two entries)` : ''))
    if (retired.length) console.log(`  ${retired.length} card(s) retired since ${since}: ${retired.map((r) => r.id).join(', ')}`)
    console.log('EVIDENCE_JSON: ' + JSON.stringify(lines))
}
