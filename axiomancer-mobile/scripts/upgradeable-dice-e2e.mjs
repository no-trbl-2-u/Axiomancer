#!/usr/bin/env node
// scripts/upgradeable-dice-e2e.mjs
//
// Spec 33 Upgradeable Dice — seeded, FLAG-ON browser end-to-end playthrough
// (Phase D6d). Exercises the D6a-c mobile stack: the four-fixed-dice tray +
// faces (D6a), Press Fate + die-gear rail (D6b), and the blacksmith HONE
// round-trip into the tray's face table (D6c) — the flag-off surface is
// untouched by every sibling *-e2e.mjs script; this is the one that finally
// boots the surface flag-ON.
//
// Boots the exported web build, pins the combat seed/deck AND the runtime
// Upgradeable-Dice flag via `globalThis.__AXM_UPGRADEABLE_DICE__` /
// `__AXM_COMBAT_SEED__` / `__AXM_COMBAT_DECK__` / `__AXM_FORCE_DEV_TOOLS__`
// (all set together, before the bundle boots — the flag is read once at
// `_layout` module load, so it MUST land before `page.goto`), then:
//
//   1. Rolls the fixed 4-die tray and asserts the face spread (special / mana
//      / miss) renders (not the old 2-die draft model).
//   2. Drags an off-color die onto a staged card and asserts the LOUD
//      rejection (`combat-drop-reject`).
//   3. Asserts Press Fate reads disabled ("Need 1 ◆ Conviction") before any
//      Conviction exists.
//   4. Via the Dev-menu shortcut, launches the blacksmith, HONEs the heart
//      die, claims the outcome, then re-enters combat and asserts the tray's
//      die-gear rail reflects the upgraded face table (more mana faces) —
//      proving D6c's engine round-trips into the rail D6a/D6b render.
//   5. Screenshots the flag-on tray, the off-color rejection, and the gear
//      rail before/after the HONE, at the 375x812 mobile viewport.
//
// **NOT covered — blocked by a real product bug, filed instead of papered
// over (`plan/CRITIQUE.md` § "Upgradeable-Dice flag-on: drag-to-power never
// actually powers a card", HIGH):** `resolveApplyRouting`
// (`state/presenters/combat-encounter.engine.ts:1938`) has no
// `isUpgradeableDiceEnabled()` gate, so every ordinary tray-die drop routes
// through the legacy `draftStanceDie` — which is an explicit no-op under the
// flag (`combat.engine.ts:715-717`) — and `playCombatCard` ends up called
// with NO die id at all. A card visually "arms" and even gets consumed on
// APPLY, but no die is ever spent, `playerStance` never sets, momentum never
// advances, and a SPECIAL face's Conviction never fires. This is not an edge
// case — it breaks 100% of drag-to-power plays under the flag, permanently,
// for the life of the combat. Per this phase's scope boundary (test-infra +
// screenshots ONLY — do not touch D6a-c product code to make the e2e pass),
// the following steps from the brief could NOT be exercised and are NOT
// asserted here: powering a card, the momentum-V2 chain (advance + the loud
// BREAK), Press Fate going enabled off a fired SPECIAL, and the stance-check
// telegraph's resolved outcome (all of which need a play to actually land).
// A future phase should land the one-line fix and extend this script to
// cover them.
//
// Deterministic: seed 16 is hand-picked (brute-forced against the exact
// `__AXM_COMBAT_DECK__` override below, by probing the real exported build —
// the deck's shuffle and the dice roll share one global LCG stream, so the
// seed→face mapping is deck-shape-specific and was NOT hand-derived) to roll
// turn 1's fixed dice as body=MANA, mind=SPECIAL, heart=MANA, wild=MISS — one
// roll gives the whole face spread for free. The `__AXM_COMBAT_DECK__`
// override pins the hand to one card per color (+ a spare BODY); kept as-is
// (rather than trimmed to what this reduced flow needs) so the fixture is
// ready-made for the follow-up phase that extends this script once the
// routing bug is fixed.
//
// Hermetic: everything runs against localhost. Mirrors the export/serve/drive
// conventions of `scripts/combat-encounter-e2e.mjs` and the real-pointer-drag
// helpers of `scripts/hazard-e2e.mjs` (no new framework — Playwright, as the
// existing *-e2e.mjs family already uses).
//
// Usage:
//   node scripts/upgradeable-dice-e2e.mjs
//   UPGRADEABLE_DICE_E2E_REUSE_EXPORT=1 node scripts/upgradeable-dice-e2e.mjs
//   UPGRADEABLE_DICE_E2E_CHROME=/path/to/chrome ...
//
// Exit codes: 0 = every flow step asserted clean · 1 = assertion failed ·
// 3 = boot failure (export / server / browser).

import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, stat, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const EXPORT_DIR = resolve(REPO_ROOT, '.smoke-dist')
const SHOT_DIR = resolve(REPO_ROOT, 'screenshots/upgradeable-dice-e2e')
const VIEWPORT = { width: 375, height: 812 }

// Seed 16, against the DECK override below: turn 1 rolls body=MANA,
// mind=SPECIAL, heart=MANA, wild=MISS (verified against the real exported
// build with this exact deck — see the note above).
const SEED = 16
// One card per color (+ a spare BODY) — this reduced flow only stages two of
// these for the off-color-rejection probe; the full spread is kept (rather
// than trimmed) so the fixture is ready for the follow-up phase that extends
// this script once the routing bug (see the header comment) is fixed and the
// momentum chain (heart→body→mind) + its BREAK become exercisable.
const DECK = ['soft-word', 'slippery-slope', 'festering-argument', 'brace-for-impact', 'straw-mans-jab']

const MIME = {
    '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
}

function log(msg) { console.log(`upgradeable-dice-e2e: ${msg}`) }
function fail(msg) { console.error(`upgradeable-dice-e2e: FAIL — ${msg}`); process.exitCode = 1; throw new Error(msg) }

// ---------------------------------------------------------------------------
// Export + static server (mirrors combat-encounter-e2e.mjs / hazard-e2e.mjs)
// ---------------------------------------------------------------------------

function runExpoExport() {
    if (existsSync(EXPORT_DIR) && process.env.UPGRADEABLE_DICE_E2E_REUSE_EXPORT === '1') {
        log('reusing existing .smoke-dist (UPGRADEABLE_DICE_E2E_REUSE_EXPORT=1)')
        return
    }
    log('running `expo export --platform web` → .smoke-dist ...')
    const result = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', EXPORT_DIR], {
        cwd: REPO_ROOT, stdio: 'inherit',
        env: { ...process.env, BUILD_PROFILE: 'preview' },
    })
    if (result.status !== 0) { console.error('upgradeable-dice-e2e: expo export failed'); process.exit(3) }
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

// ---------------------------------------------------------------------------
// Pointer-gesture + probe helpers
// ---------------------------------------------------------------------------

async function centerOf(locator) {
    const box = await locator.boundingBox()
    if (!box) return null
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

/** Real pointer drag with intermediate moves so react-native-gesture-handler's
 *  web PointerEvent backend activates the pan (mirrors hazard-e2e.mjs). */
async function dragTo(page, from, to) {
    if (!from || !to) fail('drag source/target has no bounding box')
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    const steps = 14
    for (let i = 1; i <= steps; i++) {
        await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps)
        await page.waitForTimeout(12)
    }
    await page.mouse.up()
    await page.waitForTimeout(200)
}

let shotIndex = 0
async function shot(page, name) {
    await mkdir(SHOT_DIR, { recursive: true })
    shotIndex += 1
    const path = join(SHOT_DIR, `${String(shotIndex).padStart(2, '0')}-${name}.png`)
    await page.screenshot({ path })
    log(`screenshot → ${path}`)
}

async function killPrimer(page) {
    for (let k = 0; k < 4; k++) {
        await page.waitForTimeout(250)
        const skip = page.getByTestId('combat-primer-skip')
        if (await skip.count()) await skip.click({ timeout: 2000, force: true }).catch(() => {})
        else break
    }
}

/** Every live (non-gear-rail) die in the tray this round: `{testId, color, label}`. */
async function trayDice(page) {
    const nodes = await page.locator('[data-testid^="combat-die-t"]').evaluateAll((els) =>
        els.map((n) => ({ testId: n.getAttribute('data-testid') ?? '', label: n.getAttribute('aria-label') ?? '' })))
    return nodes.map((n) => {
        const m = /-u-(heart|body|mind|wild)$/.exec(n.testId)
        return { ...n, color: m ? m[1] : null, live: !n.label.includes('a miss') && !n.label.includes('cracked') }
    })
}

/** The first live die matching any of `colors` (in order), or null. */
function pickLiveDie(dice, colors) {
    for (const c of colors) {
        const hit = dice.find((d) => d.color === c && d.live)
        if (hit) return hit
    }
    return null
}

/** Locates a hand card's testID by its printed card name (`combat-hand-<uid>`,
 *  accessibilityLabel = "<name>, <stance> card. ..."). */
async function handCardTestIdByName(page, name) {
    const nodes = await page.locator('[data-testid^="combat-hand-"]').evaluateAll((els) =>
        els.map((n) => ({ testId: n.getAttribute('data-testid') ?? '', label: n.getAttribute('aria-label') ?? '' })))
    const hit = nodes.find((n) => n.label.startsWith(`${name},`))
    return hit ? hit.testId : null
}

/** The hand fan overlaps cards with a negative margin, and later cards sit
 *  at a higher z-index — so a card's RIGHT portion is covered by its
 *  successor and `centerOf` can grab the wrong card entirely. The LEFT edge
 *  of every card's box is never covered by a later sibling; bias there. */
async function handGrabPoint(locator) {
    const box = await locator.boundingBox()
    if (!box) return null
    return { x: box.x + box.width * 0.15, y: box.y + box.height * 0.5 }
}

async function stageCard(page, name) {
    const testId = await handCardTestIdByName(page, name)
    if (!testId) fail(`"${name}" not found in hand`)
    const from = await handGrabPoint(page.getByTestId(testId))
    const to = await centerOf(page.getByTestId('combat-play-area'))
    await dragTo(page, from, to)
    const uid = testId.replace('combat-hand-', '')
    await page.getByTestId(`combat-staged-${uid}`).waitFor({ state: 'visible', timeout: 5000 })
    return uid
}

// ---------------------------------------------------------------------------
// Press Fate needs the "Gambler's Knot" relic equipped (grants the reroll
// signature); it is NOT worn by default (the 3 default-worn accessories fill
// the accessory slot cap). This — and the currency grant later — must NOT
// cross a hard page reload: equip/currency writes are in-memory only (mobile
// "saves are explicit", Spec 09) until an explicit `store.save()` fires (the
// blacksmith claim does; a bare equip does not). So this whole setup dance
// stays on ONE loaded document via in-app navigation (tab bar → SELF → the
// Dev-menu link → the ENCOUNTER TRIGGERS "ASSEMBLE" button), never `page.goto`.
// ---------------------------------------------------------------------------

async function equipPressFateRelicAndEnterCombat(page, baseUrl) {
    log('=== Equipping the Press Fate relic (Gambler\'s Knot) via the inventory ===')
    await page.goto(`${baseUrl}/inventory`, { waitUntil: 'networkidle' })
    await page.getByTestId('item-relic-clever-gambit').waitFor({ state: 'visible', timeout: 15000 })

    // Unequip one of the 3 default-worn relics — the mobile "worn" convention
    // is "first N per slot", so the target moves to the END of its accessory
    // peers and the very next accessory peer (Gambler's Knot, the only other
    // one benched) scrolls straight into the worn window. A second tap+equip
    // on Gambler's Knot is NOT needed (and would toggle it right back off —
    // it already reads "worn" after this one step).
    await page.getByTestId('item-relic-clever-gambit').click({ timeout: 5000 })
    await page.getByTestId('modal-confirm').click({ timeout: 5000 })
    await page.waitForTimeout(200)
    const pressThePointLabel = await page.getByTestId('item-relic-press-the-point').getAttribute('aria-label')
    if (!pressThePointLabel?.includes('worn')) fail(`expected Gambler's Knot to be worn after the swap, got "${pressThePointLabel}"`)
    log('equipped Gambler\'s Knot — Press Fate is now in the loadout')

    // In-app nav only (no reload): SELF tab → Dev-menu link → ASSEMBLE.
    const selfTab = page.locator('a[href="/character"]').first()
    if (await selfTab.count()) await selfTab.click({ timeout: 5000 })
    else await page.getByText('SELF', { exact: true }).first().click({ timeout: 5000 })
    await page.waitForURL((url) => url.pathname.endsWith('/character'), { timeout: 10000 })
    await page.getByTestId('self-dev-tools-link').waitFor({ state: 'visible', timeout: 10000 })
    await page.getByTestId('self-dev-tools-link').click({ timeout: 5000 })
    await page.waitForURL((url) => url.pathname.endsWith('/dev'), { timeout: 10000 })
    await page.getByTestId('debug-combat-encounter-button').waitFor({ state: 'visible', timeout: 10000 })
    await page.getByTestId('debug-combat-encounter-button').click({ timeout: 5000 })
    await page.waitForURL((url) => url.pathname.endsWith('/combat-encounter'), { timeout: 10000 })
}

// ---------------------------------------------------------------------------
// The playthrough
// ---------------------------------------------------------------------------

async function playFlagOnCombat(page) {
    log(`=== Upgradeable Dice — flag-on combat (seed ${SEED}) ===`)
    await page.getByTestId('combat-reveal').waitFor({ state: 'visible', timeout: 15000 })
    await killPrimer(page)
    await page.getByTestId('combat-enter').click({ timeout: 8000, force: true }).catch(() => {})
    await killPrimer(page)
    await page.getByTestId('combat-board').waitFor({ state: 'visible', timeout: 15000 })
    await page.getByTestId('combat-dice-tray').waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(250)

    // ── 1. Roll — the fixed 4-die tray with legible faces ────────────────────
    const round1 = await trayDice(page)
    if (round1.length !== 4) fail(`expected 4 fixed dice, saw ${round1.length}`)
    const hasSpecial = round1.some((d) => d.label.includes('SPECIAL'))
    const hasMana = round1.some((d) => !d.label.includes('SPECIAL') && !d.label.includes('a miss'))
    const hasMiss = round1.some((d) => d.label.includes('a miss'))
    if (!hasSpecial || !hasMana || !hasMiss) {
        fail(`seed ${SEED} round 1 missing a face kind — dice: ${JSON.stringify(round1)}`)
    }
    log(`round 1 dice: ${round1.map((d) => `${d.color}=${d.label.includes('SPECIAL') ? 'special' : d.label.includes('a miss') ? 'miss' : 'mana'}`).join(', ')}`)
    await shot(page, 'tray-faces')

    // ── 3. Press Fate — disabled before any Conviction exists ───────────────
    // (react-native-web's Pressable doesn't mirror `accessibilityState.disabled`
    // onto an `aria-disabled` attribute here, so the reason line — which the
    // presenter only renders while disabled — is the robust signal.)
    await page.getByTestId('combat-press-fate').waitFor({ state: 'visible', timeout: 5000 })
    let pfReason = await page.getByTestId('combat-press-fate-reason').innerText()
    if (!pfReason.includes('Need 1')) fail(`Press Fate should read "Need 1 ◆ Conviction" pre-Conviction, got "${pfReason}"`)
    log('Press Fate disabled pre-Conviction: "Need 1 ◆ Conviction" — confirmed')

    // ── 2. Off-color drop refused loudly ──────────────────────────────────────
    // (Powering the card on-color is NOT attempted here — see the header
    // comment: `resolveApplyRouting` routes every ordinary die drop through a
    // no-op under the flag, so a play never actually lands. The rejection
    // path is unaffected — it's resolved client-side in `resolveDieDropTarget`
    // before anything reaches the engine — so it stays a solid assertion.)
    // Slippery Slope is staged alongside (unarmed, never applied) purely so
    // the rejection screenshot shows the realistic two-staged-card board.
    await stageCard(page, 'Slippery Slope')
    const mindUid = await stageCard(page, 'Festering Argument')

    const heartDie = pickLiveDie(round1, ['heart'])
    if (!heartDie) fail('expected a live HEART die in round 1 (seed pin)')

    // Off-color: the HEART die onto the staged MIND card — refused loudly.
    await dragTo(page, await centerOf(page.getByTestId(heartDie.testId)), await centerOf(page.getByTestId(`combat-staged-${mindUid}`)))
    await page.getByTestId('combat-drop-reject').waitFor({ state: 'visible', timeout: 3000 })
    const rejectText = await page.getByTestId('combat-drop-reject').innerText()
    if (!/MIND or WILD/.test(rejectText)) fail(`off-color rejection missing the color-law reason: "${rejectText}"`)
    log(`off-color drop refused loudly: "${rejectText}"`)
    await shot(page, 'off-color-rejected')

    // ── 4a. Die-gear rail — the stock heart face table, pre-blacksmith ───────
    const railBefore = await page.getByTestId('combat-die-gear-heart').innerText()
    await shot(page, 'gear-rail-before')
    log(`heart gear rail (pre-HONE): ${railBefore.replace(/\n/g, ' ')}`)

    return { railBefore }
}

async function runBlacksmith(page, baseUrl) {
    log('=== Blacksmith — HONE the heart die via the Dev-menu shortcut ===')
    await page.goto(`${baseUrl}/dev`, { waitUntil: 'networkidle' })
    await page.getByTestId('dev-tools-sections').waitFor({ state: 'visible', timeout: 15000 })

    // Grant currency — a fresh dev player may not carry enough ◆ to afford HONE.
    await page.getByTestId('debug-currency-small-grant').waitFor({ state: 'visible', timeout: 10000 })
    await page.getByTestId('debug-currency-small-grant').click({ timeout: 5000 })
    await page.waitForTimeout(150)

    await page.getByTestId('debug-blacksmith-button').waitFor({ state: 'visible', timeout: 10000 })
    await page.getByTestId('debug-blacksmith-button').click({ timeout: 5000 })
    await page.waitForURL((url) => url.pathname.endsWith('/blacksmith'), { timeout: 10000 })
    await page.getByTestId('blacksmith-intro').waitFor({ state: 'visible', timeout: 10000 })
    await shot(page, 'blacksmith-forge')

    await page.getByTestId('blacksmith-begin').click({ timeout: 5000 })
    await page.getByTestId('blacksmith-forging').waitFor({ state: 'visible', timeout: 5000 })

    const heartFacesBefore = await page.getByTestId('blacksmith-die-heart-faces').innerText()
    log(`blacksmith heart die (before HONE): ${heartFacesBefore}`)

    const honeOffer = page.getByTestId('blacksmith-offer-hone:heart')
    await honeOffer.waitFor({ state: 'visible', timeout: 5000 })
    // The reason line only renders while the offer is disabled (cap/afford).
    if (await page.getByTestId('blacksmith-offer-hone:heart-reason').count() > 0) {
        const reason = await page.getByTestId('blacksmith-offer-hone:heart-reason').innerText()
        fail(`HONE heart offer unexpectedly disabled: "${reason}"`)
    }
    await honeOffer.click({ timeout: 5000 })
    await page.getByTestId('blacksmith-card').waitFor({ state: 'visible', timeout: 5000 })
    await page.getByTestId('blacksmith-continue').click({ timeout: 5000 })
    await page.getByTestId('blacksmith-forging').waitFor({ state: 'visible', timeout: 5000 })

    const heartFacesAfter = await page.getByTestId('blacksmith-die-heart-faces').innerText()
    if (heartFacesAfter === heartFacesBefore) fail(`HONE did not change the heart die's face table (still "${heartFacesAfter}")`)
    if (!/2 MANA/.test(heartFacesBefore) || !/3 MANA/.test(heartFacesAfter)) {
        fail(`expected HONE to add a mana face (2→3), got "${heartFacesBefore}" → "${heartFacesAfter}"`)
    }
    log(`HONE applied: "${heartFacesBefore}" → "${heartFacesAfter}"`)

    await page.getByTestId('blacksmith-leave').click({ timeout: 5000 })
    await page.getByTestId('blacksmith-outcome').waitFor({ state: 'visible', timeout: 5000 })
    await shot(page, 'blacksmith-outcome')
    await page.getByTestId('blacksmith-claim').click({ timeout: 5000 })
    await page.getByTestId('blacksmith-outcome').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
    // The claim's `store.save()` writes the in-memory cache immediately but
    // debounces the actual AsyncStorage/localStorage write (500ms, Spec 09) —
    // the very next step is a hard page reload, which would otherwise race
    // the debounce and lose the HONE. Outlast it.
    await page.waitForTimeout(700)
    log('blacksmith outcome claimed — dieGear written to the player')
}

async function verifyGearRailRoundTrip(page, baseUrl, railBefore) {
    log('=== Re-entering combat — the tray must read the upgraded rail ===')
    await page.goto(`${baseUrl}/combat-encounter`, { waitUntil: 'networkidle' })
    await page.getByTestId('combat-reveal').waitFor({ state: 'visible', timeout: 15000 })
    await killPrimer(page)
    await page.getByTestId('combat-enter').click({ timeout: 8000, force: true }).catch(() => {})
    await killPrimer(page)
    await page.getByTestId('combat-board').waitFor({ state: 'visible', timeout: 15000 })
    await page.getByTestId('combat-die-gear-rail').waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(200)

    const railAfter = await page.getByTestId('combat-die-gear-heart').innerText()
    if (railAfter === railBefore) fail(`gear rail did not change after the HONE round-trip (still "${railAfter}")`)
    log(`heart gear rail — before HONE: "${railBefore.replace(/\n/g, ' ')}" → after: "${railAfter.replace(/\n/g, ' ')}"`)
    await shot(page, 'gear-rail-after')
    log('D6c round-trip confirmed: the blacksmith HONE reaches the combat tray the player actually reads')
}

async function main() {
    runExpoExport()
    const { server, baseUrl } = await startStaticServer(EXPORT_DIR)
    log(`static server at ${baseUrl}`)
    const { chromium } = await import('playwright')
    const launchOptions = { headless: true }
    if (process.env.UPGRADEABLE_DICE_E2E_CHROME) launchOptions.executablePath = process.env.UPGRADEABLE_DICE_E2E_CHROME
    const browser = await chromium.launch(launchOptions)
    try {
        const context = await browser.newContext({ viewport: VIEWPORT, hasTouch: false })
        const page = await context.newPage()
        page.on('pageerror', (err) => console.error('upgradeable-dice-e2e: pageerror', err.message))
        await page.addInitScript(({ seed, deck }) => {
            globalThis.__AXM_UPGRADEABLE_DICE__ = true
            globalThis.__AXM_COMBAT_SEED__ = seed
            globalThis.__AXM_COMBAT_DECK__ = deck
            globalThis.__AXM_FORCE_DEV_TOOLS__ = true
        }, { seed: SEED, deck: DECK })

        await equipPressFateRelicAndEnterCombat(page, baseUrl)
        const { railBefore } = await playFlagOnCombat(page)
        await runBlacksmith(page, baseUrl)
        await verifyGearRailRoundTrip(page, baseUrl, railBefore)
        await context.close()
        log('ALL PASS — Upgradeable Dice played flag-on, end-to-end')
    } finally {
        await browser.close()
        server.close()
    }
}

main().catch((err) => {
    console.error('upgradeable-dice-e2e: aborted —', err.message)
    process.exit(process.exitCode || 3)
})
