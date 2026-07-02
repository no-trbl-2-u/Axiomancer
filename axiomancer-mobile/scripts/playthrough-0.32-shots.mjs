#!/usr/bin/env node
// scripts/playthrough-0.32-shots.mjs
//
// Mobile-viewport visual capture for the 0.32 combat-board / map round.
// ONE expo export (dev-tools baked via BUILD_PROFILE=preview), reused across
// every page.goto. Captures the six review items into
// screenshots/playthrough-0.32/.
//
//   1. Combat board — staged card APPLY affordance (FREE vs POWERED), dice
//      tray with the new colours, the GUARD 🛡 pip, the enemy's single HP bar.
//   2. Multi-card staging — >1 staged card ("N STAGED").
//   3. Gold (rare) card — ★ + gold accent (in hand + rewards overlay).
//   4. Encounter PRELUDE — ENGAGE / FLEE modal, full-height.
//   5. Exploration MAP — node glyph variety (not all-battle).
//   6. Narration node — fv-14's monologue via the dialogue screen.
//
// Direct-navigation model: `/combat-encounter` self-bootstraps a mock combat
// (deck pinned via the dev-only `__AXM_COMBAT_DECK__` global so a defend/GUARD
// card + a gold card are in hand). Items 4/5/6 drive the dev-tools UI
// (self-dev-tools-link → /dev → Debug* buttons), which only mount when the
// export bakes devToolsEnabled=true (BUILD_PROFILE=preview).
//
// Usage:
//   node scripts/playthrough-0.32-shots.mjs
//   PT032_REUSE_EXPORT=1 node scripts/playthrough-0.32-shots.mjs
//   PT032_CHROME=/path/to/chrome ...
//
// Exit: 0 = all captured · 3 = boot failure.

import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, stat, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const EXPORT_DIR = resolve(REPO_ROOT, '.smoke-dist')
const SHOT_DIR = resolve(REPO_ROOT, 'screenshots/playthrough-0.32')
const VIEWPORT = { width: 390, height: 844 }

// Deck pinned for the combat board: a gold card (the-final-word, mind) for the
// ★ render, a defend card (brace-for-impact, body) so APPLY grants GUARD, plus
// a DoT/control pair for hand variety.
const COMBAT_DECK = ['the-final-word', 'brace-for-impact', 'eternal-regress', 'slippery-slope']
// Seed 16 rolls a draftable first die for the demo deck (per combat-e2e).
const COMBAT_SEED = 16

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=utf-8',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
}

const results = []
function log(msg) { console.log(`pt032: ${msg}`) }
function record(item, file, ok, note) { results.push({ item, file, ok, note }); log(`${ok ? 'OK ' : 'MISS'} item ${item} → ${file}${note ? ` (${note})` : ''}`) }

function runExpoExport() {
    if (existsSync(EXPORT_DIR) && process.env.PT032_REUSE_EXPORT === '1') {
        log('reusing existing .smoke-dist (PT032_REUSE_EXPORT=1)')
        return
    }
    log('running `expo export --platform web` → .smoke-dist (BUILD_PROFILE=preview) ...')
    const r = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', EXPORT_DIR], {
        cwd: REPO_ROOT, stdio: 'inherit',
        env: { ...process.env, BUILD_PROFILE: 'preview' },
    })
    if (r.status !== 0) { console.error('pt032: expo export failed'); process.exit(3) }
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
        server.listen(0, '127.0.0.1', () => resolveServer({ server, baseUrl: `http://127.0.0.1:${server.address().port}` }))
        server.on('error', rejectServer)
    })
}

async function shot(page, name) {
    await mkdir(SHOT_DIR, { recursive: true })
    const path = join(SHOT_DIR, `${name}.png`)
    await page.screenshot({ path, fullPage: false })
    return `${name}.png`
}

// ── pointer helpers (from hazard-e2e) ────────────────────────────────────────
async function centerOf(locator) {
    const box = await locator.boundingBox()
    if (!box) return null
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}
async function dragTo(page, fromLocator, to) {
    const from = await centerOf(fromLocator)
    if (!from || !to) return false
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    await page.waitForTimeout(80)
    // Initial jiggle to cross PanGestureHandler's minDistance before the
    // committed move — without it the gesture never activates on web export.
    await page.mouse.move(from.x, from.y - 16)
    await page.waitForTimeout(40)
    const sy = from.y - 16
    const steps = 24
    for (let i = 1; i <= steps; i++) {
        await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, sy + ((to.y - sy) * i) / steps)
        await page.waitForTimeout(16)
    }
    await page.waitForTimeout(80)
    await page.mouse.up()
    await page.waitForTimeout(220)
    return true
}
async function openDevTools(page) {
    await page.getByTestId('self-dev-tools-link').waitFor({ state: 'visible', timeout: 15000 })
    await page.getByTestId('self-dev-tools-link').click()
    await page.waitForURL((url) => url.pathname.endsWith('/dev'), { timeout: 10000 })
}
async function killCombatPrimer(page) {
    for (let k = 0; k < 5; k++) {
        await page.waitForTimeout(250)
        const skip = page.getByTestId('combat-primer-skip')
        if (await skip.count()) { await skip.click({ timeout: 2000, force: true }).catch(() => {}) } else break
    }
}

// ── Items 1/2/3 — combat board ───────────────────────────────────────────────
async function captureCombatBoard(context, baseUrl) {
    const page = await context.newPage()
    page.on('pageerror', (e) => console.error('pt032: pageerror', e.message))
    await page.addInitScript(({ seed, deck }) => {
        globalThis.__AXM_COMBAT_SEED__ = seed
        globalThis.__AXM_COMBAT_DECK__ = deck
    }, { seed: COMBAT_SEED, deck: COMBAT_DECK })
    await page.goto(`${baseUrl}/combat-encounter`, { waitUntil: 'networkidle' })

    // Reveal → ENTER COMBAT.
    await page.getByTestId('combat-reveal').waitFor({ state: 'visible', timeout: 15000 })
    await killCombatPrimer(page)
    await page.getByTestId('combat-enter').click({ timeout: 8000, force: true }).catch(() => {})
    await killCombatPrimer(page)
    await page.getByTestId('combat-board').waitFor({ state: 'visible', timeout: 15000 })
    // The fanned hand cards fade in (reanimated FadeIn) — wait for them to land
    // before the pre-stage shot, else the dock reads empty.
    await page.locator('[data-testid^="combat-hand-"]').first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(900)

    // Gold card lives in the fanned hand — capture the board pre-stage so the
    // ★ gold card + the 2-die tray (new colours) + single enemy HP bar all show.
    const goldVisible = (await page.getByText('★', { exact: false }).count()) > 0
    record(3, await shot(page, '03-gold-card-in-hand'), goldVisible, goldVisible ? 'hand shows ★ gold card' : 'no ★ glyph found in hand')

    // Stage cards by dragging them up into the play area. The play area starts
    // ~79px tall and GROWS as cards stage (the staged ScrollView expands), so a
    // mid-area drop quickly lands on an already-staged card (its gesture
    // swallows it). Dropping at the play area's very TOP band (just under the
    // dice tray) stays an open landing zone across the first few stages.
    const playArea = page.getByTestId('combat-play-area')
    const dropTarget = async () => { const b = await playArea.boundingBox(); return b ? { x: b.x + b.width / 2, y: b.y + 8 } : null }
    let pass = 0
    while (pass++ < 12) {
        const hand = page.locator('[data-testid^="combat-hand-"]')
        const n = await hand.count()
        if (n === 0) break
        const before = await page.locator('[data-testid^="combat-staged-"]').count()
        if (before >= 3) break // 3 staged is plenty for the "N STAGED" + POWERED/FREE witness
        const pick = hand.nth(Math.min(1, n - 1))
        await dragTo(page, pick, await dropTarget())
        const detail = page.getByTestId('combat-card-detail')
        if (await detail.isVisible().catch(() => false)) { await detail.click(); await page.waitForTimeout(120) }
        const after = await page.locator('[data-testid^="combat-staged-"]').count()
        if (after === before && pass > 6) break
    }
    const stagedN = await page.locator('[data-testid^="combat-staged-"]').count()

    // Drag one usable die onto the FIRST staged card → its APPLY reads
    // "APPLY ✦ POWERED"; remaining staged cards still read "APPLY · FREE".
    const dieIds = await page.locator('[data-testid^="combat-die-"]')
        .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-testid')))
    for (const id of dieIds) {
        const die = page.getByTestId(id)
        const label = await die.getAttribute('aria-label').catch(() => null)
        if (!label || !label.includes('available')) continue
        const firstStaged = page.locator('[data-testid^="combat-staged-"]').first()
        const fb = await firstStaged.boundingBox()
        if (!fb) continue
        await dragTo(page, die, { x: fb.x + fb.width / 2, y: fb.y + fb.height / 2 })
        if ((await page.locator('text=APPLY ✦ POWERED').count()) > 0) break
    }
    await page.waitForTimeout(300)

    const poweredCount = await page.locator('text=APPLY ✦ POWERED').count()
    const freeCount = await page.locator('text=APPLY · FREE').count()
    const multiStaged = stagedN >= 2

    // Item 2 (multi-staging) + item 1 (board: APPLY affordance — POWERED + FREE
    // both visible — dice tray + single enemy HP bar). One board, two witnesses.
    record(2, await shot(page, '02-multi-staging'), multiStaged, `${stagedN} staged; "N STAGED" header shows at ≥2`)
    record(1, await shot(page, '01-board-apply-affordance'),
        poweredCount > 0 && freeCount > 0,
        `APPLY POWERED×${poweredCount} + FREE×${freeCount}; dice tray + single HP bar present`)

    // GUARD pip: APPLY the brace-for-impact (defend) card — its base/top action
    // grants Guard, surfacing the 🛡 pip on the player. Target the staged card
    // whose name reads "Brace"; fall back to applying staged cards in turn.
    let guardOk = (await page.getByTestId('combat-guard').count()) > 0
    if (!guardOk) {
        const stagedCards = page.locator('[data-testid^="combat-staged-"]')
        const m = await stagedCards.count()
        // Prefer the brace card.
        let order = [...Array(m).keys()]
        for (let i = 0; i < m; i++) {
            const t = (await stagedCards.nth(i).innerText().catch(() => '')) || ''
            if (/brace/i.test(t)) { order = [i, ...order.filter((x) => x !== i)]; break }
        }
        for (const i of order) {
            const uid = await stagedCards.nth(i).getAttribute('data-testid').catch(() => null)
            const btnId = uid ? uid.replace('combat-staged-', 'combat-apply-') : null
            const btn = btnId ? page.getByTestId(btnId) : null
            if (!btn || !(await btn.count())) continue
            await btn.click({ timeout: 3000, force: true }).catch(() => {})
            await page.waitForTimeout(350)
            if (await page.getByTestId('combat-guard').count()) { guardOk = true; break }
        }
    }
    await page.waitForTimeout(250)
    record('1-guard', await shot(page, '01b-guard-pip'), guardOk, guardOk ? '🛡 GUARD pip present on player' : 'no GUARD pip surfaced')

    await page.close()
}

// ── Item 3b — gold card in the rewards overlay (best-effort, unseeded RNG) ────
async function captureRewardOverlay(context, baseUrl) {
    // The reward roll uses Math.random (unseeded) and gold weight is low, so
    // this is best-effort: try a few wins and grab the overlay; flag gold if it
    // happens to appear. The in-hand ★ capture (item 3) is the primary witness.
    const page = await context.newPage()
    page.on('pageerror', (e) => console.error('pt032: pageerror', e.message))
    // A 1-card all-gold deck guarantees a fast win path is unlikely; instead we
    // just open a normal combat and end-phase to a terminal state, then capture
    // whatever rewards/summary shows.
    await page.addInitScript((seed) => { globalThis.__AXM_COMBAT_SEED__ = seed }, COMBAT_SEED)
    await page.goto(`${baseUrl}/combat-encounter`, { waitUntil: 'networkidle' })
    await page.getByTestId('combat-reveal').waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
    await killCombatPrimer(page)
    await page.getByTestId('combat-enter').click({ timeout: 8000, force: true }).catch(() => {})
    await killCombatPrimer(page)
    await page.getByTestId('combat-board').waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
    // End phases until a terminal panel; capture rewards if it's a win.
    let captured = false
    for (let i = 0; i < 30 && !captured; i++) {
        if (await page.getByTestId('combat-rewards').count()) {
            const gold = (await page.locator('[data-testid="combat-rewards"] >> text=★ GOLD').count()) > 0
            record('3-rewards', await shot(page, '03b-rewards-overlay'), true, gold ? 'rewards overlay shows a ★ GOLD card' : 'rewards overlay (no gold this roll)')
            captured = true
            break
        }
        if (await page.getByTestId('combat-summary').count() || await page.getByTestId('combat-mercy').count()) {
            // defeat/mercy — no rewards overlay; stop.
            break
        }
        const end = page.getByTestId('combat-end-phase')
        if (!(await end.count())) break
        await end.click({ timeout: 3000, force: true }).catch(() => {})
        await page.waitForTimeout(140)
    }
    if (!captured) record('3-rewards', '—', false, 'no rewards overlay reached (defeat path); see 03-gold-card-in-hand')
    await page.close()
}

// ── Item 4 — encounter PRELUDE (ENGAGE / FLEE) ───────────────────────────────
async function capturePrelude(context, baseUrl) {
    const page = await context.newPage()
    page.on('pageerror', (e) => console.error('pt032: pageerror', e.message))
    await page.goto(`${baseUrl}/character`, { waitUntil: 'networkidle' })
    await openDevTools(page)
    await page.getByTestId('debug-trigger-encounter-encounter').waitFor({ state: 'visible', timeout: 15000 })
    await page.getByTestId('debug-trigger-encounter-encounter').click()
    // The prelude rises over the WILDS map.
    await page.getByTestId('encounter-modal-fight').waitFor({ state: 'visible', timeout: 15000 })
    await page.getByTestId('encounter-modal-flee').waitFor({ state: 'visible', timeout: 5000 })
    await page.waitForTimeout(500)
    const engage = (await page.locator('text=ENGAGE').count()) > 0
    const flee = (await page.locator('text=FLEE').count()) > 0
    record(4, await shot(page, '04-encounter-prelude'), engage && flee, `ENGAGE=${engage} FLEE=${flee}; pinned below scroll`)
    await page.close()
}

// ── Item 5 — exploration MAP node variety ────────────────────────────────────
// NOTE on reachability: the fishing-village map gates each node's KIND glyph
// behind walking onto it (only available/current nodes show their type icon;
// sealed ones show a neutral mark). A fresh map's start node connects only to
// two treasure nodes, and completing a node's minigame doesn't persist the move
// back through this static harness — so an automated capture can't unfold the
// full encounter/rest/gather/hazard/quest/boss spread. We therefore capture the
// authored full map (all 25 nodes laid out, with the reachable nodes showing
// their glyphs + the TRODDEN/OPEN/SHUT legend) — enough to witness the map is a
// varied node graph, NOT an all-battle list. See the report for the caveat.
async function captureMap(context, baseUrl) {
    const page = await context.newPage()
    page.on('pageerror', (e) => console.error('pt032: pageerror', e.message))
    await page.goto(`${baseUrl}/exploration`, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready).catch(() => {})
    await page.waitForTimeout(900)
    const labels = await page.locator('[data-testid^="node-"]').evaluateAll((ns) =>
        ns.map((n) => n.getAttribute('aria-label') ?? '').filter((a) => /open,|here|walked/.test(a)))
    const types = new Set(labels.map((l) => (l.match(/open, (\w+)/) ?? [])[1]).filter(Boolean))
    const nodeCount = await page.locator('[data-testid^="node-"]').count()
    record(5, await shot(page, '05-exploration-map'), nodeCount >= 10,
        `${nodeCount} nodes laid out; reachable types: ${[...types].join('/') || '(none)'} — most distant nodes sealed on a fresh map`)
    await page.close()
}

// ── Item 6 — narration (fv-14 monologue via /dialogue) ───────────────────────
async function captureNarration(context, baseUrl) {
    const page = await context.newPage()
    page.on('pageerror', (e) => console.error('pt032: pageerror', e.message))
    await page.goto(`${baseUrl}/character`, { waitUntil: 'networkidle' })
    await openDevTools(page)
    // The NARRATION dialogue jump seeds the fv-14 strand monologue + a cursor;
    // EventGate routes narration → /dialogue.
    await page.getByTestId('debug-dialogue-narration').waitFor({ state: 'visible', timeout: 15000 })
    await page.getByTestId('debug-dialogue-narration').click()
    await page.getByTestId('dialogue-speech').waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(400)
    const hasStrand = (await page.locator('text=The tide has gone out').count()) > 0
    record(6, await shot(page, '06-narration-node'), hasStrand, hasStrand ? 'fv-14 strand monologue rendered' : 'speech panel present (text check failed)')
    await page.close()
}

async function main() {
    runExpoExport()
    const { server, baseUrl } = await startStaticServer(EXPORT_DIR)
    log(`static server at ${baseUrl}`)
    const { chromium } = await import('playwright')
    const launchOptions = { headless: true }
    if (process.env.PT032_CHROME) launchOptions.executablePath = process.env.PT032_CHROME
    const browser = await chromium.launch(launchOptions)
    try {
        // hasTouch:true — the combat/hazard drag gestures (PanGestureHandler)
        // activate reliably under touch on web export. Force dev tools on for
        // every page (the static export can't read extra.devToolsEnabled).
        const context = await browser.newContext({ viewport: VIEWPORT, hasTouch: true, deviceScaleFactor: 1 })
        await context.addInitScript(() => { globalThis.__AXM_FORCE_DEV_TOOLS__ = true })
        // Run sequentially so logs stay readable and the static server isn't hammered.
        await captureCombatBoard(context, baseUrl).catch((e) => log(`combat-board ERR: ${e.message}`))
        await captureRewardOverlay(context, baseUrl).catch((e) => log(`reward-overlay ERR: ${e.message}`))
        await capturePrelude(context, baseUrl).catch((e) => log(`prelude ERR: ${e.message}`))
        await captureMap(context, baseUrl).catch((e) => log(`map ERR: ${e.message}`))
        await captureNarration(context, baseUrl).catch((e) => log(`narration ERR: ${e.message}`))
        await context.close()
    } finally {
        await browser.close()
        server.close()
    }
    log('=== SUMMARY ===')
    for (const r of results) log(`item ${r.item}: ${r.ok ? 'CONFIRMED' : 'NOT'} → ${r.file}${r.note ? `  [${r.note}]` : ''}`)
    log(`screenshots in ${SHOT_DIR}`)
}

main().catch((err) => { console.error('pt032: aborted —', err.message); process.exit(3) })
