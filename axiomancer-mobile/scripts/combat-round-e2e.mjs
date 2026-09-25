#!/usr/bin/env node
// scripts/combat-round-e2e.mjs
//
// FULL-ROUND combat playthrough in the real UI — the crash-strict harness.
//
// What this adds over `combat-encounter-e2e.mjs` (which asserts the board's
// *shape* then spams END PHASE until the player dies without ever playing a
// card): this one actually PLAYS. Every round it stages a card, powers it with
// a legal tray die, APPLYs, spends what Conviction it can on a signature, ends
// the phase, and rides the enemy turn — round after round until the combat
// resolves. That is the code path a real player is on when the game crashes,
// and it is the path no e2e covered.
//
// CRASH-STRICT. Every existing e2e attaches `page.on('pageerror', …)` and
// merely `console.error`s it, so an uncaught exception mid-combat prints and
// the run still exits 0. Here any of the following FAILS the run immediately,
// naming the round and the step it died on:
//
//   * an uncaught page exception (`pageerror`)
//   * an unhandled promise rejection
//   * the app-wide <ErrorBoundary> screen mounting (`error-boundary-screen`)
//   * a React "Rendered fewer hooks"/"Maximum update depth" console error
//   * the board vanishing without a terminal outcome (silent unmount)
//
// Sweeps seeds so a seed-specific crash cannot hide behind one lucky pin.
//
// TWO MODES, because they are not the same code path:
//
//   MODE=sandbox (default) — the `/combat-encounter` dev route: mock foe,
//     4-card demo deck, `persistOutcome={false}`. Fast and hermetic, but it is
//     a sandbox. Every pre-existing combat e2e in this repo only ever drove
//     this route, which is why "combat is covered" was never true of live play.
//
//   MODE=live — the REAL encounter: the `debug-trigger-encounter-encounter`
//     dev button arms `<EncounterModalOverlay>` over the WILDS map with the
//     real player deck, the real enemy roster and `persistOutcome`, so the
//     victory/aftermath write-back runs too. This is the path a player is on
//     when the game crashes mid-combat.
//
//   MODE=both — sandbox then live.
//
// Usage:
//   node scripts/combat-round-e2e.mjs
//   MODE=live node scripts/combat-round-e2e.mjs
//   MODE=both COMBAT_ROUND_E2E_SEEDS=16,8,3,101 ROUNDS=12 node scripts/combat-round-e2e.mjs
//   COMBAT_ROUND_E2E_REUSE_EXPORT=1 node scripts/combat-round-e2e.mjs
//   COMBAT_ROUND_E2E_CHROME=/path/to/chrome ...
//
// LIVE-only knobs, both added to close the "untested axes" gap CRITIQUE.md
// flagged against the 2026-08-19 unreproduced mid-combat crash report (30
// prior runs only ever drove the standard-foe encounter, spare-mercy, and
// the fresh 4-card starter deck):
//   PRESET=sage|wanderer|apprentice|endgame — a non-starter deck (already
//     supported, see enterLive; wire it explicitly, the default runs never did).
//   ENCOUNTER_KIND=boss node scripts/combat-round-e2e.mjs   — arm the lowest
//     boss foe on the map instead of a standard encounter (`debug-trigger-
//     encounter-boss`). Bosses seal retreat, so WITHDRAW never renders here.
//   WITHDRAW=1 MODE=live node scripts/combat-round-e2e.mjs  — take the
//     reveal screen's WITHDRAW control instead of entering combat, so the
//     retreat path (`combat-withdraw` → the encounter modal tearing down
//     with no summary/mercy/reward panel) is crash-watched too. Absent
//     control (e.g. paired with ENCOUNTER_KIND=boss) falls back to playing.
//   LEVEL_UP=1 MODE=live PRESET=sage node scripts/combat-round-e2e.mjs  —
//     the fourth and last axis CRITIQUE.md named ("XP granted pre-fight,
//     cascaded post-victory"): grants XP (via the /dev XP controls) up to
//     exactly `EXPERIENCE_PER_LEVEL` (1000) short of the freshly-built
//     preset's next-level threshold — `buildCharacterFromPreset` always
//     seeds `experience = (level-1)*1000` against `experienceToNextLevel =
//     level*1000`, so that gap is a preset-independent constant — before
//     the encounter triggers, so a won fight's own XP reward crosses the
//     threshold and the `applyHazardOutcome` level-up cascade
//     (`CombatEncounterPanel.tsx`) runs mid-aftermath, the exact code path
//     the crash report implicated.
//
// Exit codes: 0 = every seed played clean · 1 = crash/assertion · 3 = boot failure.

import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const EXPORT_DIR = resolve(REPO_ROOT, '.smoke-dist')
const SHOT_DIR = resolve(REPO_ROOT, 'screenshots/combat-round-e2e')
const VIEWPORT = { width: 390, height: 844 }

const SEEDS = (process.env.COMBAT_ROUND_E2E_SEEDS ?? '16,8,3,42,101')
    .split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n))
const MAX_ROUNDS = Number(process.env.ROUNDS ?? 12)
const PLAYS_PER_ROUND = Number(process.env.PLAYS_PER_ROUND ?? 1)
const FIRE_SIGNATURES = process.env.FIRE_SIGNATURES !== '0'
const MODE = (process.env.MODE ?? 'sandbox').toLowerCase()
const MODES = MODE === 'both' ? ['sandbox', 'live'] : [MODE]
const ENCOUNTER_KIND = (process.env.ENCOUNTER_KIND ?? 'encounter').toLowerCase()
const WITHDRAW = process.env.WITHDRAW === '1'
const LEVEL_UP = process.env.LEVEL_UP === '1'
// `Character/index.ts`'s `buildCharacterFromPreset`: experience = (level-1) *
// EXPERIENCE_PER_LEVEL, experienceToNextLevel = level * EXPERIENCE_PER_LEVEL.
// The gap is always exactly EXPERIENCE_PER_LEVEL, regardless of preset level.
const XP_GRANT_STEP = 100
const XP_GAP_TO_LEVEL = 1000
const XP_GRANT_CLICKS = XP_GAP_TO_LEVEL / XP_GRANT_STEP - 1 // leaves exactly one grant short

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=utf-8',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
}

function log(msg) { console.log(`combat-round-e2e: ${msg}`) }
function note(msg) { console.log(`combat-round-e2e: NOTE — ${msg}`) }

class CombatCrash extends Error {
    constructor(message, detail) { super(message); this.name = 'CombatCrash'; this.detail = detail }
}

// ── boot plumbing (mirrors combat-encounter-e2e.mjs) ─────────────────────────

function runExpoExport() {
    if (existsSync(EXPORT_DIR) && process.env.COMBAT_ROUND_E2E_REUSE_EXPORT === '1') {
        log('reusing existing .smoke-dist (COMBAT_ROUND_E2E_REUSE_EXPORT=1)')
        return
    }
    log('running `expo export --platform web` → .smoke-dist ...')
    const result = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', EXPORT_DIR], {
        cwd: REPO_ROOT, stdio: 'inherit',
        // On Windows npx is npx.cmd, which Node refuses to spawn without a shell.
        shell: process.platform === 'win32',
        env: { ...process.env, BUILD_PROFILE: 'preview' },
    })
    if (result.status !== 0) { console.error('combat-round-e2e: expo export failed'); process.exit(3) }
}

async function fileCandidate(p) {
    try { const info = await stat(p); return { p, exists: true, dir: info.isDirectory() } }
    catch { return { p, exists: false, dir: false } }
}

function startStaticServer(rootDir) {
    return new Promise((resolveServer, rejectServer) => {
        const server = createServer(async (req, res) => {
            try {
                const url = new URL(req.url, 'http://localhost')
                let pathname = decodeURIComponent(url.pathname)
                if (pathname.endsWith('/')) pathname += 'index.html'
                const filePath = join(rootDir, pathname)
                if (!filePath.startsWith(rootDir)) { res.statusCode = 403; return res.end('forbidden') }
                const candidates = [
                    await fileCandidate(filePath),
                    await fileCandidate(join(filePath, 'index.html')),
                    await fileCandidate(join(rootDir, pathname + '.html')),
                    await fileCandidate(join(rootDir, 'index.html')),
                ]
                const chosen =
                    (candidates[0].exists && !candidates[0].dir && candidates[0].p) ||
                    (candidates[1].exists && !candidates[1].dir && candidates[1].p) ||
                    (candidates[2].exists && !candidates[2].dir && candidates[2].p) ||
                    candidates[3].p
                const body = await readFile(chosen)
                res.setHeader('content-type', MIME[extname(chosen)] ?? 'application/octet-stream')
                res.end(body)
            } catch (err) { res.statusCode = 500; res.end(String(err)) }
        })
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address()
            resolveServer({ server, baseUrl: `http://127.0.0.1:${port}` })
        })
        server.on('error', rejectServer)
    })
}

async function shot(page, name) {
    await mkdir(SHOT_DIR, { recursive: true })
    const path = join(SHOT_DIR, `${name}.png`)
    await page.screenshot({ path, fullPage: false }).catch(() => {})
    return path
}

// ── crash watchdog ───────────────────────────────────────────────────────────

/** Console-error substrings that are React/RN telling us the tree is broken.
 *  A plain `console.error` from app code is a NOTE; these are failures. */
const FATAL_CONSOLE = [
    '[ErrorBoundary] caught',
    'Rendered fewer hooks than expected',
    'Rendered more hooks than during the previous render',
    'Maximum update depth exceeded',
    'Cannot update a component',
    'Objects are not valid as a React child',
    'undefined is not an object',
    'Cannot read properties of undefined',
    'Cannot read properties of null',
    'is not a function',
]

function attachCrashWatch(page, sink) {
    page.on('pageerror', (err) => {
        sink.fatal.push({ kind: 'pageerror', message: err.message, stack: err.stack ?? '' })
    })
    page.on('console', (msg) => {
        if (msg.type() !== 'error') return
        const text = msg.text()
        if (FATAL_CONSOLE.some((f) => text.includes(f))) sink.fatal.push({ kind: 'console', message: text })
        else sink.soft.push(text)
    })
}

/** Throws the moment anything has crashed. `where` names the round + step. */
async function assertAlive(page, sink, where) {
    if (sink.fatal.length) {
        const first = sink.fatal[0]
        throw new CombatCrash(`CRASH at ${where} — ${first.kind}: ${first.message}`, first)
    }
    if (await page.getByTestId('error-boundary-screen').count()) {
        const code = await page.getByTestId('error-boundary-code').innerText().catch(() => '(no code)')
        const tail = await page.getByTestId('error-boundary-log-tail').innerText().catch(() => '')
        throw new CombatCrash(
            `CRASH at ${where} — the app fell into the <ErrorBoundary> screen (${code.trim()})`,
            { kind: 'error-boundary', message: code.trim(), stack: tail },
        )
    }
}

// ── board readers ────────────────────────────────────────────────────────────

const has = async (loc) => (await loc.count()) > 0

async function centerOf(locator) {
    if ((await locator.count()) === 0) return null
    const box = await locator.first().boundingBox().catch(() => null)
    if (!box) return null
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

/** Real pointer drag with intermediate moves so PanGestureHandler activates. */
async function dragTo(page, fromLocator, to) {
    const from = await centerOf(fromLocator)
    if (!from || !to) return false
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    const steps = 14
    for (let i = 1; i <= steps; i++) {
        await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps)
        await page.waitForTimeout(12)
    }
    await page.mouse.up()
    await page.waitForTimeout(180)
    return true
}

// Both readers scope to the BOARD. The drag ghost lives in the panel OUTSIDE
// it and used to render a clone of the last-dragged die under that die's own
// testID (fixed in CombatDie/CombatEncounterPanel, kept scoped here as belt and
// braces): a prefix match over the whole page then returned a die from a
// PREVIOUS turn, and the drag started from wherever the ghost was parked.
/**
 * Is the die actually TOUCHABLE, or is some other control sitting on it?
 *
 * Board chrome is absolutely positioned and z-indexed over the tray, and it
 * grows with progression — the signature rune column is anchored off the tray
 * for exactly this reason (see `sigTop` in CombatBoard). When it (or anything
 * else) covers a die, the die cannot be dragged at all and a tap aimed at it
 * activates the occluder instead. That shipped undetected because every drag
 * here failed SILENTLY: nothing threw, the round just played FREE. Returns the
 * occluding element's description, or null when the die is clear.
 */
async function occluderOver(page, dieId) {
    const box = await page.getByTestId(`combat-die-${dieId}`).first().boundingBox().catch(() => null)
    if (!box) return null
    return page.evaluate(([b, id]) => {
        const el = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)
        if (!el) return null
        for (let n = el; n; n = n.parentElement) {
            if (n.getAttribute?.('data-testid') === `combat-die-${id}`) return null   // the die itself
        }
        const chain = []
        for (let n = el, i = 0; n && i < 5; n = n.parentElement, i++) {
            const tid = n.getAttribute?.('data-testid')
            if (tid) chain.push(tid)
        }
        return chain.join(' < ') || el.tagName
    }, [box, dieId]).catch(() => null)
}

async function readHand(page) {
    return page.getByTestId('combat-board').locator('[data-testid^="combat-hand-"]').evaluateAll((ns) => ns.map((n) => {
        const uid = (n.getAttribute('data-testid') ?? '').replace('combat-hand-', '')
        const label = n.getAttribute('aria-label') ?? ''
        const m = label.match(/,\s*(heart|body|mind)\s+card/i)
        return { uid, stance: m ? m[1].toLowerCase() : null, name: label.split(',')[0] }
    }))
}

async function readDice(page) {
    return page.getByTestId('combat-board').locator('[data-testid^="combat-die-"]').evaluateAll((ns) => ns.map((n) => {
        const id = (n.getAttribute('data-testid') ?? '').replace('combat-die-', '')
        const label = n.getAttribute('aria-label') ?? ''
        // Spec-33 label (CombatDie `combatDieA11yLabel`): "<COLOUR> die, <FACE>
        // face: drag onto … to power …". A usable die always says "drag onto";
        // a dead / used one names its state instead.
        const color = (label.match(/^(\w+)(?:\s+\(gold\))?\s+die\b/i)?.[1] ?? '').toLowerCase()
        const usable = /drag onto/i.test(label)
            && !/MISS face|blocked|spent|cracked|assigned|not usable/i.test(label)
        return { id, color, usable }
    }))
}

const terminal = async (page) =>
    (await has(page.getByTestId('combat-summary'))) || (await has(page.getByTestId('combat-mercy')))
    // A won fight shows the reward draft BEFORE the summary (the summary is
    // gated on the claim), so without this arm a victory read as "still live"
    // and the play loop burned its remaining rounds no-oping under the overlay.
    || (await has(page.getByTestId('combat-rewards')))

/** Skip the dice-roll ritual so the round does not burn wall clock on it. */
async function skipRoll(page) {
    const skip = page.getByTestId('combat-dice-skip')
    if (await has(skip)) await skip.click({ timeout: 1500, force: true }).catch(() => {})
}

async function killPrimer(page) {
    for (let k = 0; k < 4; k++) {
        await page.waitForTimeout(250)
        const skip = page.getByTestId('combat-primer-skip')
        if (await has(skip)) await skip.click({ timeout: 2000, force: true }).catch(() => {})
        else break
    }
    const coach = page.getByTestId('combat-coach-dismiss')
    if (await has(coach)) await coach.click({ timeout: 1500, force: true }).catch(() => {})
}

// ── one played round ─────────────────────────────────────────────────────────

/**
 * Play a single round the way a player does: stage → power → APPLY (as many
 * cards as the tray can pay for), fire an affordable signature, END PHASE,
 * ride the enemy turn. Returns a short account of what actually happened so a
 * clean-but-inert run cannot masquerade as coverage.
 */
async function playRound(page, sink, seed, round) {
    const at = (step) => `seed ${seed}, round ${round}, ${step}`
    const acted = { staged: 0, powered: 0, powerMissed: 0, applied: 0, signature: 0, ledger: null }

    // The board's own counter ("PHASE 2/4 · R2 · T2") plus the hand size, so a
    // round that does nothing is legible as "the hand ran dry" or "the phase
    // never advanced" rather than "the harness could not grab a card".
    const header = (await page.getByTestId('combat-board').innerText().catch(() => '')).split('\n')
    acted.ledger = `${header.find((l) => /PHASE\s*\d+\/\d+/.test(l))?.trim() ?? '?'} · hand `
        + `${await page.locator('[data-testid^="combat-hand-"]').count()}`

    await skipRoll(page)
    await assertAlive(page, sink, at('after the dice roll'))

    const playArea = page.getByTestId('combat-play-area')
    if (!(await has(playArea))) return { ...acted, note: 'no play area (board gone)' }

    // ONE play a round by default. The hand refills per phase, so draining it
    // three-at-a-time starves every later round and the fight never resolves —
    // measured 2026-08-19: 1/phase reaches the summary in ~5 rounds, 3/phase
    // stalls out at the round cap with an empty hand. Raise PLAYS_PER_ROUND to
    // exercise multi-stage boards deliberately.
    for (let play = 0; play < PLAYS_PER_ROUND; play++) {
        if (await terminal(page)) break
        const hand = await readHand(page)
        if (!hand.length) break
        const dice = await readDice(page)

        // Rightmost first: the fan's right end sits on top of the z-order, clear
        // of the corner medallions that otherwise swallow the pointer-down.
        const card = [...hand].reverse()[0]
        const die = dice.find((d) => d.usable && d.color === card.stance)
            ?? dice.find((d) => d.usable && d.color === 'wild')
            ?? dice.find((d) => d.usable)

        // Stage it.
        for (let a = 0; a < 3 && !(await has(page.getByTestId(`combat-staged-${card.uid}`))); a++) {
            await dragTo(page, page.getByTestId(`combat-hand-${card.uid}`), await centerOf(playArea))
            await assertAlive(page, sink, at(`staging "${card.name}"`))
        }
        if (!(await has(page.getByTestId(`combat-staged-${card.uid}`)))) break
        acted.staged++
        // Settle the stage-enter animation before targeting it: a die dropped
        // onto a still-animating staged card's rect can measure a stale
        // bounding box (CombatBoard's resolveDrop measures live via
        // measureInWindow) and silently miss — indistinguishable from a real
        // drag failure, and it only ever shows up under CI's slower paint.
        await page.waitForTimeout(150)

        // Power it, if the tray can.
        if (die) {
            const occluder = await occluderOver(page, die.id)
            if (occluder) {
                throw new CombatCrash(
                    `${at(`reaching for the ${die.color} die`)} — die ${die.id} is UNTOUCHABLE: `
                    + `"${occluder}" sits on top of it, so it can never be dragged and a tap there `
                    + 'fires that control instead',
                    { kind: 'die-occluded', message: `${die.id} covered by ${occluder}` },
                )
            }
            for (let a = 0; a < 4 && !(await has(page.getByTestId('combat-staged-die'))); a++) {
                await page.waitForTimeout(180)
                await dragTo(
                    page,
                    page.getByTestId(`combat-die-${die.id}`),
                    await centerOf(page.getByTestId(`combat-staged-${card.uid}`)),
                )
                await assertAlive(page, sink, at(`powering "${card.name}" with a ${die.color} die`))
            }
            if (await has(page.getByTestId('combat-staged-die'))) acted.powered++
            // A legal die was on the table and the drop still did not arm the
            // card. Counted, not shrugged off: this is exactly how the harness
            // rotted into a FREE-plays-only run that still reported PASS while
            // the powered-play path went uncovered for weeks (2026-09-03).
            else acted.powerMissed++
        }

        // Nudge a RECOIL X picker so the X path is exercised too.
        const xPlus = page.getByTestId(`combat-choose-x-plus-${card.uid}`)
        if (await has(xPlus)) {
            await xPlus.click({ force: true, timeout: 1500 }).catch(() => {})
            await assertAlive(page, sink, at(`raising RECOIL X on "${card.name}"`))
        }

        // APPLY — powered or free.
        const apply = page.getByTestId(`combat-apply-${card.uid}`)
        if (!(await has(apply))) break
        await apply.click({ force: true, timeout: 3000 }).catch(() => {})
        await page.waitForTimeout(350)
        await assertAlive(page, sink, at(`applying "${card.name}"`))
        acted.applied++
    }

    // Fire the first affordable signature. NOTE the two traps here:
    //   * `combat-signature-bar` is the BAR CONTAINER, not a signature — it
    //     shares the `combat-signature-` prefix and carries no aria-label, so a
    //     naive prefix match selects it and force-clicks a dead spot on the
    //     board. Filter it out by name.
    //   * affordability lives at the END of the label as `— Need N ◆ Conviction`
    //     (`CombatBoard.tsx`), so only a trailing "Need … Conviction" means
    //     unaffordable; a bare em dash inside a description does not.
    const sigs = await page.locator('[data-testid^="combat-signature-"]').evaluateAll((ns) => ns
        .map((n) => ({
            id: (n.getAttribute('data-testid') ?? '').replace('combat-signature-', ''),
            label: n.getAttribute('aria-label') ?? '',
        }))
        .filter((s) => s.id !== 'bar' && s.label.length > 0)
        .map((s) => ({ ...s, affordable: !/Need\s+\d+\s*◆?\s*Conviction/i.test(s.label) })))
    const sig = FIRE_SIGNATURES ? sigs.find((s) => s.affordable) : undefined
    if (sig) {
        await page.getByTestId(`combat-signature-${sig.id}`).click({ force: true, timeout: 2000 }).catch(() => {})
        await page.waitForTimeout(300)
        await assertAlive(page, sink, at(`firing signature ${sig.id}`))
        acted.signature++
    }

    // END PHASE — the enemy acts.
    if (await terminal(page)) return acted
    const end = page.getByTestId('combat-end-phase')
    if (!(await has(end))) return { ...acted, note: 'END PHASE control gone' }
    await end.click({ timeout: 3000, force: true }).catch(() => {})
    await page.waitForTimeout(500)
    await assertAlive(page, sink, at('ending the phase (enemy turn)'))

    // Dismiss the enemy action card if it gates the next round.
    const ack = page.getByTestId('combat-enemy-action-dismiss')
    if (await has(ack)) await ack.click({ force: true, timeout: 1500 }).catch(() => {})
    await assertAlive(page, sink, at('after the enemy action card'))

    return acted
}

// ── one seed, played to a terminal outcome ──────────────────────────────────

/** Sandbox entry: straight to the dev route with the seed pinned. */
async function enterSandbox(page, baseUrl, seed) {
    await page.addInitScript((s) => { globalThis.__AXM_COMBAT_SEED__ = s }, seed)
    await page.goto(`${baseUrl}/combat-encounter`, { waitUntil: 'networkidle' })
}

/**
 * Live entry: boot the app, open /dev, and arm a real map encounter. The
 * overlay auto-engages (the ENGAGE/FLEE prelude was retired 2026-08-10), so
 * the armed state to wait on is the same combat reveal — but everything
 * behind it is the live player, the live deck and `persistOutcome`.
 */
async function enterLive(page, baseUrl, seed) {
    await page.addInitScript((s) => { globalThis.__AXM_COMBAT_SEED__ = s }, seed)
    // A static web export can't surface `extra.devToolsEnabled` at runtime, so
    // the SELF → /dev affordance needs the documented opt-in (lib/buildProfile.ts),
    // the same one the roundtrip + hazard harnesses set. Inert in real
    // builds — nothing sets the global there.
    await page.addInitScript(() => { globalThis.__AXM_FORCE_DEV_TOOLS__ = true })
    await page.goto(`${baseUrl}/character`, { waitUntil: 'networkidle' })
    await page.getByTestId('self-dev-tools-link').waitFor({ state: 'visible', timeout: 25000 })
    await page.getByTestId('self-dev-tools-link').click()
    await page.waitForURL((url) => url.pathname.endsWith('/dev'), { timeout: 15000 })
    // Optional player preset (PRESET=endgame|sage|wanderer|apprentice|fresh):
    // a fresh e2e save is a level-1 pilgrim who usually LOSES, so the victory
    // aftermath — the reward draft and its ACCEPT path — went unexercised on
    // every default run. PRESET=endgame (or sage) makes the win, and therefore
    // the take-a-card walk below, actually reachable in CI.
    const preset = (process.env.PRESET ?? '').toLowerCase()
    if (preset) {
        const btn = page.getByTestId(`debug-preset-${preset}`)
        await btn.waitFor({ state: 'visible', timeout: 15000 })
        await btn.click()
        await page.waitForTimeout(800)
        log(`live: applied player preset "${preset}"`)
    }
    if (LEVEL_UP) {
        const grant = page.getByTestId('debug-xp-grant-button')
        await grant.waitFor({ state: 'visible', timeout: 15000 })
        for (let i = 0; i < XP_GRANT_CLICKS; i++) {
            await grant.click({ force: true, timeout: 2000 }).catch(() => {})
            await page.waitForTimeout(60)
        }
        log(`live: granted ${XP_GRANT_CLICKS * XP_GRANT_STEP} XP (LEVEL_UP=1) — experience now sits `
            + `${XP_GAP_TO_LEVEL - XP_GRANT_CLICKS * XP_GRANT_STEP} short of the next-level threshold, `
            + 'so a won fight\'s own XP reward crosses it mid-aftermath')
    }
    const trigger = page.getByTestId(`debug-trigger-encounter-${ENCOUNTER_KIND}`)
    await trigger.waitFor({ state: 'visible', timeout: 15000 })
    await trigger.click({ force: true })
    await page.waitForURL((url) => url.pathname.endsWith('/exploration'), { timeout: 15000 })
        .catch(() => {})
}

async function playSeed(browser, baseUrl, seed, mode) {
    const sink = { fatal: [], soft: [] }
    const context = await browser.newContext({ viewport: VIEWPORT, hasTouch: false })
    const page = await context.newPage()
    attachCrashWatch(page, sink)

    const rounds = []
    const tag = `${mode} seed ${seed}`
    try {
        // Self-test for the watchdog itself: throw an uncaught error once the
        // board is up, so we can prove this harness FAILS on a crash instead of
        // trusting that it would. `CRASH_SELFTEST=1` must make the run exit 1.
        if (process.env.CRASH_SELFTEST === '1') {
            await page.addInitScript(() => {
                const t = setInterval(() => {
                    if (document.querySelector('[data-testid="combat-board"]')) {
                        clearInterval(t)
                        setTimeout(() => { throw new Error('CRASH_SELFTEST: synthetic mid-combat crash') }, 0)
                    }
                }, 100)
            })
        }
        if (mode === 'live') await enterLive(page, baseUrl, seed)
        else await enterSandbox(page, baseUrl, seed)

        await page.getByTestId('combat-reveal').waitFor({ state: 'visible', timeout: 25000 }).catch(() => {})
        await assertAlive(page, sink, `${tag}, the reveal`)

        // Retreat path: WITHDRAW lives only on the reveal, before ENTER
        // COMBAT is ever clicked (bosses seal it — the control simply won't
        // be there). Take it here and skip the round loop entirely; the
        // encounter modal tears down with no summary/mercy/reward panel,
        // which the round loop's "silent unmount" check would otherwise
        // mistake for a crash.
        if (mode === 'live' && WITHDRAW) {
            const withdrawBtn = page.getByTestId('combat-withdraw')
            if (await has(withdrawBtn)) {
                await withdrawBtn.click({ force: true, timeout: 3000 }).catch(() => {})
                await page.waitForTimeout(400)
                await assertAlive(page, sink, `${tag}, withdrawing from the reveal`)
                await shot(page, `${mode}-seed-${seed}-withdraw`)
                return { seed, mode, ok: true, rounds: 0, applied: 0, powered: 0, resolved: true, withdrew: true, soft: sink.soft }
            }
            note(`${tag} — WITHDRAW requested but no combat-withdraw control (retreat sealed); playing normally`)
        }

        await killPrimer(page)
        await page.getByTestId('combat-enter').click({ timeout: 8000, force: true }).catch(() => {})
        await killPrimer(page)

        await page.getByTestId('combat-board').waitFor({ state: 'visible', timeout: 25000 })
        await assertAlive(page, sink, `${tag}, the board mounting`)

        for (let round = 1; round <= MAX_ROUNDS; round++) {
            if (await terminal(page)) break
            const acted = await playRound(page, sink, seed, round)
            rounds.push(acted)
            log(`${tag} · round ${round} — staged ${acted.staged}, powered ${acted.powered}, `
                + `applied ${acted.applied}, signature ${acted.signature}`
                + `${acted.ledger ? ` · hand/deck: ${acted.ledger}` : ''}${acted.note ? ` (${acted.note})` : ''}`)

            // Silent unmount: no board, no terminal panel, no ErrorBoundary.
            if (!(await terminal(page)) && !(await has(page.getByTestId('combat-board')))) {
                throw new CombatCrash(
                    `${tag}, round ${round} — the combat board vanished with no outcome and no error screen`,
                    { kind: 'silent-unmount', message: 'combat-board disappeared' },
                )
            }
        }

        if (await has(page.getByTestId('combat-mercy'))) {
            await page.getByTestId('combat-mercy-spare').click({ timeout: 3000, force: true }).catch(() => {})
            await page.waitForTimeout(300)
            await assertAlive(page, sink, `${tag}, taking the mercy branch`)
        }

        // Live play only: ride the outcome all the way out. The aftermath
        // panels write the run back to the player (loot, XP, morale) — the
        // sandbox skips all of it, so a crash here has never been reachable.
        // Capture this BEFORE the aftermath walk — dismissing the summary would
        // otherwise make a resolved fight report as "still live".
        const resolved = (await terminal(page)) || (await has(page.getByTestId('combat-summary')))

        if (mode === 'live') {
            // TAKE CARD, not skip. The reward draft's ACCEPT path (tap an offer
            // tile → CHOOSE THIS → TAKE CARD) is a different code path from
            // SKIP — `claimCombatRewardAction` mutates the player and the panel
            // re-renders off the new state — and the old walk below never
            // reached it: `combat-reward-confirm` is disabled until a tile is
            // picked, so every prior run silently skipped. That hole shipped a
            // real crash-on-accept. Tap the first offer tile first, so the
            // walk's preview-select/confirm clicks land on a real pick.
            const outcomeLine = (await page.getByTestId('combat-summary').innerText().catch(() => ''))
                .split('\n')[0] || '(no summary yet)'
            log(`${tag} — outcome read: ${outcomeLine}`)
            const rewards = page.getByTestId('combat-rewards')
            if (await has(rewards)) {
                const tile = rewards.locator(
                    '[data-testid^="combat-reward-"]'
                    + ':not([data-testid="combat-reward-skip"])'
                    + ':not([data-testid="combat-reward-confirm"])'
                    + ':not([data-testid^="combat-reward-preview"])',
                ).first()
                if (await has(tile)) {
                    await tile.click({ force: true, timeout: 3000 }).catch(() => {})
                    await page.waitForTimeout(350)
                    await assertAlive(page, sink, `${tag}, opening a reward offer`)
                }
            }
            // Walk whichever aftermath panel the outcome produced, in the order
            // they stack: summary → victory/defeat/friendship → reward pick.
            // These are the REAL testIDs (CombatSummaryModal / CombatRewardsOverlay
            // / components/event/aftermath) — grep them if the panels are renamed,
            // because a silently-missing id turns this whole block into a no-op.
            const AFTERMATH = [
                'combat-summary-close',
                'combat-victory-panel-carry-on',
                'combat-defeat-panel-begin-again',
                'combat-friendship-panel-part-as-friends',
                'combat-reward-preview-select',
                'combat-reward-confirm',
                'combat-reward-skip',
            ]
            let walked = 0
            const walkedIds = []
            for (let pass = 0; pass < 2; pass++) {
                for (const id of AFTERMATH) {
                    const btn = page.getByTestId(id)
                    if (!(await has(btn))) continue
                    await btn.first().click({ force: true, timeout: 3000 }).catch(() => {})
                    await page.waitForTimeout(450)
                    await assertAlive(page, sink, `${tag}, the aftermath (${id})`)
                    walked++
                    walkedIds.push(id)
                }
            }
            log(`${tag} — walked ${walked} aftermath panel${walked === 1 ? '' : 's'} `
                + `(the persistOutcome write-back)${walkedIds.length ? `: ${walkedIds.join(' → ')}` : ''}`)
        }

        const applied = rounds.reduce((n, r) => n + r.applied, 0)
        const powered = rounds.reduce((n, r) => n + r.powered, 0)
        const powerMissed = rounds.reduce((n, r) => n + r.powerMissed, 0)
        if (applied === 0) {
            throw new CombatCrash(
                `${tag} — played ${rounds.length} rounds but never committed a single card; `
                + 'this harness proves nothing about the play path when it cannot play',
                { kind: 'inert-run', message: 'no card ever applied' },
            )
        }

        // Coverage assertion, sibling to the inert-run one above: FREE plays
        // alone do not exercise the die economy (drop targeting, spend, the
        // Reserve). One miss is drag flake; a run that keeps offering a legal
        // die and never lands one is the harness lying about its coverage.
        if (powerMissed >= 2 && powered <= 1) {
            throw new CombatCrash(
                `${tag} — a legal die was on the table in ${powerMissed} rounds but powered a card in only `
                + `${powered}; the run played FREE and proves nothing about the die path`,
                { kind: 'inert-power', message: `powerMissed=${powerMissed} powered=${powered}` },
            )
        }

        await shot(page, `${mode}-seed-${seed}-final`)
        await assertAlive(page, sink, `${tag}, the end of the run`)
        return { seed, mode, ok: true, rounds: rounds.length, applied, powered, resolved, soft: sink.soft }
    } catch (err) {
        const shotPath = await shot(page, `${mode}-seed-${seed}-CRASH`)
        return {
            seed, mode, ok: false, rounds: rounds.length, soft: sink.soft, shotPath,
            error: err instanceof CombatCrash ? err : new CombatCrash(err.message, { kind: 'harness', message: err.message }),
            fatal: sink.fatal,
        }
    } finally {
        await context.close().catch(() => {})
    }
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
    runExpoExport()
    const { server, baseUrl } = await startStaticServer(EXPORT_DIR)
    log(`static server at ${baseUrl}`)
    const { chromium } = await import('playwright')
    const launchOptions = { headless: true }
    if (process.env.COMBAT_ROUND_E2E_CHROME) launchOptions.executablePath = process.env.COMBAT_ROUND_E2E_CHROME
    const browser = await chromium.launch(launchOptions)

    const results = []
    try {
        for (const mode of MODES) {
            for (const seed of SEEDS) {
                log(`=== ${mode} · seed ${seed} — playing up to ${MAX_ROUNDS} full rounds ===`)
                results.push(await playSeed(browser, baseUrl, seed, mode))
            }
        }
    } finally {
        await browser.close()
        server.close()
    }

    await mkdir(SHOT_DIR, { recursive: true })
    await writeFile(join(SHOT_DIR, 'result.json'), JSON.stringify(
        results.map((r) => ({ ...r, error: r.error ? { message: r.error.message, detail: r.error.detail } : null })),
        null, 2,
    ))

    const failed = results.filter((r) => !r.ok)
    for (const r of results) {
        if (r.ok) {
            log(`PASS ${r.mode} seed ${r.seed} — ${r.withdrew ? 'withdrew from the reveal' : `${r.rounds} rounds, `
                + `${r.applied} cards committed (${r.powered} powered)${r.resolved ? ', combat resolved' : ', still live at the round cap'}`}`)
        } else {
            console.error(`combat-round-e2e: FAIL ${r.mode} seed ${r.seed} — ${r.error.message}`)
            if (r.error.detail?.stack) console.error(String(r.error.detail.stack).split('\n').slice(0, 12).join('\n'))
            for (const f of (r.fatal ?? []).slice(0, 5)) console.error(`  · ${f.kind}: ${f.message}`)
            if (r.shotPath) console.error(`  · screenshot → ${r.shotPath}`)
        }
        for (const s of new Set(r.soft ?? [])) note(`${r.mode} seed ${r.seed} console.error (non-fatal): ${s.slice(0, 220)}`)
    }

    if (failed.length) {
        console.error(`combat-round-e2e: ${failed.length}/${results.length} runs crashed mid-combat`)
        process.exit(1)
    }
    log(`ALL PASS — ${results.length} runs (${MODES.join(' + ')}) played full rounds with real card plays, no crashes`)
}

main().catch((err) => {
    console.error('combat-round-e2e: aborted —', err.message)
    process.exit(process.exitCode || 3)
})
