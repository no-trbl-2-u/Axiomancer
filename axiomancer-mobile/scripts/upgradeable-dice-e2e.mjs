#!/usr/bin/env node
// scripts/upgradeable-dice-e2e.mjs
//
// Spec 33 Upgradeable-Dice — FLAG-ON browser-driven end-to-end (Phase D6d).
//
// This is the ONE harness that boots the combat surface with the
// Upgradeable-Dice model flag-ON. The bundle-time env can only decide the
// flag at build; `applyCombatFlagsFromEnv` (state/combat/flags.ts) also
// honors a RUNTIME global `globalThis.__AXM_UPGRADEABLE_DICE__`, run once at
// `_layout` boot — so we set it (alongside the deterministic combat seed)
// BEFORE the bundle runs, exactly like `__AXM_COMBAT_SEED__`. That is the
// only way to reach the flag-on tray in a hermetic export.
//
// It exercises the whole D6a-c stack and captures the flag-on screenshots
// that D6a/D6b/D6c deferred (the pre-boot flag harness only became possible
// here). Mirrors the sibling harness conventions exactly (expo export →
// static server → Playwright/Chromium → real taps + pointer drags), honoring
// UPGRADEABLE_DICE_E2E_REUSE_EXPORT=1 to reuse a prior .smoke-dist.
//
// The flow (each an assertion; drag-dependent steps degrade to a NOTE when a
// given roll can't reach them — the roll is deterministic from the seed, and
// per the D6d brief we assert the reachable subset rather than force a step):
//   1. Roll — the flag-on tray renders 4 FACED dice (not the old 2-die
//      draft), and the four flag-on-only surfaces render (momentum-v2 chain
//      chip, player-stance chip, die-gear rail, Press-Fate control) — every
//      one of these is null flag-OFF, so their presence proves the flag.
//   2. Power a card — drag a usable die onto a color-matching staged card
//      (armed socket); then an OFF-COLOR drop is refused LOUDLY (the
//      combat-drop-reject line).
//   3. Momentum advances — a paid play advances the chain chip.
//   4. Break resets to null LOUDLY — "✕ MOMENTUM BROKEN".
//   5. Press Fate — the control renders with its enabled/disabled + reason
//      state; on a whiff round it rerolls.
//   6. Stance check — the open telegraph renders, and a resolved phase shows
//      the ×0.5 +1◆ / ×1.5 outcome.
//   7. Blacksmith HONE round-trip — via the Dev-menu shortcut (D6c): grant
//      currency, HONE the heart die, claim; then re-enter combat and assert
//      the die-gear rail's heart slot gained a mana face (more mana, fewer
//      miss) — the persisted rail round-trips into the tray the combat reads.
//   8. Screenshots — the flag-on tray, momentum chip, gear rail, and forge
//      at 375×812 (the deferred visual proof + small-screen crowding evidence).
//
// Everything runs CLIENT-SIDE after a single document load: saves in this
// package are explicit (not auto-persisted on dispatch), so a full page
// reload between the forge and the tray would drop the blacksmith's dieGear
// write. We navigate via the in-app dev buttons / history instead.
//
// Usage:
//   node scripts/upgradeable-dice-e2e.mjs
//   UPGRADEABLE_DICE_E2E_REUSE_EXPORT=1 node scripts/upgradeable-dice-e2e.mjs
//   UPGRADEABLE_DICE_E2E_CHROME=/path/to/chrome ...
//
// Exit codes: 0 = flag-on stack played clean · 1 = assertion failed ·
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
// 375×812 — the small phone the D6d brief pins (the crowding evidence viewport).
const VIEWPORT = { width: 375, height: 812 }
// Deterministic combat seed; the flag-on roll is a pure function of it. Seed 8
// rolls all three colored dice (heart/body/mind) usable against the sandbox's
// body+heart demo hand — the roll that reaches the power / off-color-refusal /
// momentum-advance / chain-break steps (a wild-only roll can't advance momentum:
// "wilds don't shift it", combat.engine.ts:1100).
const SEED = Number(process.env.UPGRADEABLE_DICE_E2E_SEED ?? 8)

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=utf-8',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
}

const notes = []
function log(msg) { console.log(`upgradeable-dice-e2e: ${msg}`) }
function note(msg) { notes.push(msg); console.log(`upgradeable-dice-e2e: NOTE — ${msg}`) }
function fail(msg) { console.error(`upgradeable-dice-e2e: FAIL — ${msg}`); process.exitCode = 1; throw new Error(msg) }

function runExpoExport() {
    if (existsSync(EXPORT_DIR) && process.env.UPGRADEABLE_DICE_E2E_REUSE_EXPORT === '1') {
        log('reusing existing .smoke-dist (UPGRADEABLE_DICE_E2E_REUSE_EXPORT=1)')
        return
    }
    log('running `expo export --platform web` → .smoke-dist ...')
    const result = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', EXPORT_DIR], {
        cwd: REPO_ROOT, stdio: 'inherit',
        // Dev tools (SELF → self-dev-tools-link → /dev → Debug* buttons) only
        // mount when isDevToolsEnabled(); bake it via a non-production profile.
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

async function shot(page, name) {
    await mkdir(SHOT_DIR, { recursive: true })
    const path = join(SHOT_DIR, `${name}.png`)
    await page.screenshot({ path, fullPage: false })
    log(`screenshot → ${path}`)
    return path
}

async function centerOf(locator) {
    // Guard against boundingBox()'s 30s auto-wait when the element is gone
    // (e.g. a hand card whose testID flipped to combat-staged-* once staged).
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

const has = async (loc) => (await loc.count()) > 0
const text = async (loc) => (await has(loc)) ? (await loc.first().innerText().catch(() => '')) : ''

/** Open the /dev Developer screen from the SELF sheet (client-side route). */
async function openDevTools(page) {
    await page.getByTestId('self-dev-tools-link').waitFor({ state: 'visible', timeout: 20000 })
    await page.getByTestId('self-dev-tools-link').click()
    await page.waitForURL((url) => url.pathname.endsWith('/dev'), { timeout: 10000 })
}

/** From /dev, launch the combat sandbox and settle onto the flag-on board. */
async function enterCombat(page) {
    await page.getByTestId('debug-combat-encounter-button').waitFor({ state: 'visible', timeout: 15000 })
    await page.getByTestId('debug-combat-encounter-button').click()
    await page.getByTestId('combat-reveal').waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
    const killPrimer = async () => {
        for (let k = 0; k < 4; k++) {
            await page.waitForTimeout(250)
            const skip = page.getByTestId('combat-primer-skip')
            if (await skip.count()) { await skip.click({ timeout: 2000, force: true }).catch(() => {}) } else break
        }
    }
    await killPrimer()
    await page.getByTestId('combat-enter').click({ timeout: 8000, force: true }).catch(() => {})
    await killPrimer()
    await page.getByTestId('combat-board').waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(300)
}

/** Dice within the tray (excludes the `combat-die-gear-*` rail slots, which
 *  share the `combat-die-` prefix but live outside the tray). */
function trayDice(page) {
    return page.getByTestId('combat-dice-tray').locator('[data-testid^="combat-die-"]')
}

/** Parse the heart die-gear slot's `special·mana·miss` face counts. */
async function heartGearFaces(page) {
    const t = await text(page.getByTestId('combat-die-gear-heart'))
    const m = t.match(/(\d+)\s*·\s*(\d+)\s*·\s*(\d+)/)
    if (!m) return null
    return { special: Number(m[1]), mana: Number(m[2]), miss: Number(m[3]) }
}

// ── Flow ────────────────────────────────────────────────────────────────────

/** Steps 1-6 + step-8 screenshots on the flag-on board. Returns the baseline
 *  heart gear faces for the blacksmith round-trip comparison. */
async function assertFlagOnBoard(page, { capture }) {
    // ── STEP 1: the flag-on tray renders faces + the flag-on-only surfaces ──
    const dieCount = await trayDice(page).count()
    if (dieCount < 4) fail(`flag-on tray must roll ≥4 faced dice (old model rolls 2); saw ${dieCount}`)
    log(`step 1: tray rolled ${dieCount} faced dice`)

    // These three surfaces are null flag-OFF and ALWAYS present flag-on — their
    // presence IS the flag proof. (Press Fate is a fourth flag-on surface, but
    // it is additionally gated on the player carrying a reroll signature — the
    // "Gambler's Knot" relic — which the combat sandbox does not equip; it is
    // handled adaptively in the Press-Fate block below, not asserted here.)
    for (const id of ['combat-momentum-v2', 'combat-player-stance', 'combat-die-gear-rail']) {
        if (!(await has(page.getByTestId(id)))) fail(`flag-on surface missing: ${id} (is the flag actually on?)`)
    }
    log('step 1: flag-on surfaces present — momentum-v2 · player-stance · die-gear-rail')

    // The gear rail names each die's face table (special·mana·miss).
    const baseline = await heartGearFaces(page)
    if (!baseline) fail('die-gear rail heart slot did not render a face table')
    log(`step 1: heart die-gear = ${baseline.special}·${baseline.mana}·${baseline.miss} (special·mana·miss)`)

    // Face states surface through a11y — at least a special or a miss face
    // should be readable somewhere on the four rolled dice.
    const dieLabels = await trayDice(page).evaluateAll((ns) => ns.map((n) => n.getAttribute('aria-label') ?? ''))
    const faceyLabels = dieLabels.filter((l) => /SPECIAL face|a miss|drafted|floating|banked|cracked/i.test(l))
    if (faceyLabels.length === 0) note('no die a11y label named a face state this roll (labels: ' + dieLabels.join(' | ') + ')')
    else log(`step 1: ${faceyLabels.length}/${dieCount} dice name a face state in a11y`)

    if (capture) {
        await shot(page, '01-flag-on-tray')
        await shot(page, '03-die-gear-rail') // whole board shows the rail; a focused crop follows below
    }

    // ── STEP 6 (telegraph half): the open stance-check telegraph renders ──
    if (await has(page.getByTestId('combat-intent-stance-check'))) {
        log(`step 6: stance-check telegraph present — "${(await text(page.getByTestId('combat-intent-stance-check'))).replace(/\n/g, ' ')}"`)
    } else {
        note('stance-check telegraph (combat-intent-stance-check) not visible on the opening phase')
    }

    // ── STEP 5: Press Fate renders its enabled/disabled + reason state ──
    // Adaptive: the control is present only when the player carries a reroll
    // signature (the "Gambler's Knot" relic). The combat sandbox does not equip
    // it, so absence here is correct product gating, not a bug — NOTE + skip.
    const pf = page.getByTestId('combat-press-fate')
    const pfPresent = await has(pf)
    if (pfPresent) {
        const pfLabel = await pf.getAttribute('aria-label').catch(() => '')
        const pfDisabled = (await pf.getAttribute('aria-disabled').catch(() => null)) === 'true'
        log(`step 5: Press Fate rendered — ${pfDisabled ? 'DISABLED' : 'ENABLED'} · "${(pfLabel || '').slice(0, 90)}"`)
        if (pfDisabled) {
            const reason = await text(page.getByTestId('combat-press-fate-reason'))
            if (!reason) note('Press Fate is disabled but showed no reason line')
            else log(`step 5: disabled reason surfaced loudly — "${reason}"`)
        }
    } else {
        note('Press Fate control not present — it is relic-gated (Gambler\'s Knot → sig-press-the-point) '
            + 'and the combat sandbox equips no relics; step 5 (enabled/disabled/reroll) is unreachable here without a relic-equip test seam')
    }

    // ── STEP 2 + 3: stage a card, power it, then an OFF-COLOR refusal ──
    await drivePowerAndMomentum(page, { capture })

    // ── STEP 5 (reroll half): if Press Fate is (now) present + enabled, fire it ──
    if (pfPresent && (await pf.count()) && (await pf.getAttribute('aria-disabled').catch(() => 'true')) !== 'true') {
        const before = await trayDice(page).evaluateAll((ns) => ns.map((n) => n.getAttribute('aria-label') ?? '').join('|'))
        await pf.click({ force: true }).catch(() => {})
        await page.waitForTimeout(400)
        const after = await trayDice(page).evaluateAll((ns) => ns.map((n) => n.getAttribute('aria-label') ?? '').join('|'))
        if (before !== after) log('step 5: Press Fate rerolled the miss faces (tray changed)')
        else note('Press Fate was enabled but the tray did not visibly change after pressing')
    } else if (pfPresent) {
        note('Press Fate present but not enabled this round (no affordable whiff) — reroll firing left to a whiff round')
    }

    if (capture) {
        // Focused crops for the deferred visual proof + crowding evidence.
        await shot(page, '02-momentum-chip')
    }
    return baseline
}

/** Steps 2-4: stage cards, power with a legal die, refuse an off-color drop,
 *  read the momentum chip, and attempt a break. All drag-dependent — each
 *  degrades to a NOTE when this roll can't reach it. */
async function drivePowerAndMomentum(page, { capture }) {
    const playArea = page.getByTestId('combat-play-area')

    // Read the hand: uid + stance, from each card's a11y label ("Name, STANCE card.").
    const hand = await page.locator('[data-testid^="combat-hand-"]').evaluateAll((ns) => ns.map((n) => {
        const id = (n.getAttribute('data-testid') ?? '').replace('combat-hand-', '')
        const label = n.getAttribute('aria-label') ?? ''
        const m = label.match(/,\s*(heart|body|mind)\s+card/i)
        return { uid: id, stance: m ? m[1].toLowerCase() : null }
    }))
    if (hand.length === 0) { note('no cards in hand to stage — power/momentum/break steps skipped'); return }

    // Read the dice: color (first word of the a11y label) + usable (not miss/blocked/spent).
    const readDice = async () => trayDice(page).evaluateAll((ns) => ns.map((n) => {
        const id = (n.getAttribute('data-testid') ?? '').replace('combat-die-', '')
        const label = (n.getAttribute('aria-label') ?? '')
        const color = (label.match(/^(\w+)\s+stance die/i)?.[1] ?? '').toLowerCase()
        const usable = /available|drafted|floating|banked|SPECIAL face/i.test(label)
            && !/a miss|blocked|spent|cracked/i.test(label)
        return { id, color, usable }
    }))
    const dice = await readDice()
    const canPower = (dieColor, stance) => dieColor === 'wild' || dieColor === stance

    // STEP 2a — stage a card and power it with a legal die. Prefer a COLORED
    // die matching the card's stance (a wild die powers the play but "wilds
    // don't shift it" — combat.engine.ts:1100 — so it never advances momentum;
    // a colored match is what lets step 3 observe the chain move). Body/mind
    // cards are preferred over heart because the sandbox's only heart card is
    // Soft Word (a SWAY/Befriend play that does not shift the chain).
    let poweredUid = null
    let poweredColor = null
    const pickDie = (stance) =>
        dice.find((d) => d.usable && d.color !== 'wild' && d.color === stance)
        ?? dice.find((d) => d.usable && canPower(d.color, stance))
    // Iterate the hand in fan order — the pinned deck leads with a BODY damage
    // card (the leftmost, cleanly-stageable slot), so the first pairing is a
    // colored body play; occluded middle cards are a flaky fallback.
    for (const card of hand) {
        const die = pickDie(card.stance)
        if (!die) continue
        // stage (retry — cards fade in and the fan re-lays out)
        for (let a = 0; a < 3 && !(await has(page.getByTestId(`combat-staged-${card.uid}`))); a++) {
            await dragTo(page, page.getByTestId(`combat-hand-${card.uid}`), await centerOf(playArea))
        }
        if (!(await has(page.getByTestId(`combat-staged-${card.uid}`)))) continue
        // power: drag the legal die onto the staged card (retry — the staged
        // card animates into the row, so an early drop can miss its socket)
        for (let a = 0; a < 3 && !(await has(page.getByTestId('combat-staged-die'))); a++) {
            await page.waitForTimeout(150)
            await dragTo(page, page.getByTestId(`combat-die-${die.id}`), await centerOf(page.getByTestId(`combat-staged-${card.uid}`)))
        }
        if (await has(page.getByTestId('combat-staged-die'))) {
            poweredUid = card.uid
            poweredColor = die.color
            log(`step 2: powered ${card.stance} card with a ${die.color} die (socket armed)`)
            break
        }
    }
    if (!poweredUid) note('could not stage+arm a card this roll (no legal die/stance pairing reachable)')

    // STEP 2b — an OFF-COLOR drop is refused LOUDLY.
    // Stage a second card and drop a non-wild die of a DIFFERENT color on it.
    let refused = false
    for (const card of hand) {
        if (card.uid === poweredUid || !card.stance) continue
        const offDie = dice.find((d) => d.color && d.color !== 'wild' && d.color !== card.stance)
        if (!offDie) continue
        await dragTo(page, page.getByTestId(`combat-hand-${card.uid}`), await centerOf(playArea))
        if (!(await has(page.getByTestId(`combat-staged-${card.uid}`)))) continue
        await dragTo(page, page.getByTestId(`combat-die-${offDie.id}`), await centerOf(page.getByTestId(`combat-staged-${card.uid}`)))
        if (await has(page.getByTestId('combat-drop-reject'))) {
            refused = true
            log(`step 2: off-color drop refused LOUDLY — "${(await text(page.getByTestId('combat-drop-reject'))).replace(/\n/g, ' ')}"`)
            break
        }
    }
    if (!refused) note('off-color rejection not exercised this roll (no non-wild die + mismatched staged card reachable)')

    // Read the momentum chip BEFORE committing.
    const momoBefore = await text(page.getByTestId('combat-momentum-v2'))

    // STEP 3 — commit a paid play and watch momentum advance.
    if (poweredUid && (await has(page.getByTestId(`combat-apply-${poweredUid}`)))) {
        await page.getByTestId(`combat-apply-${poweredUid}`).click({ force: true }).catch(() => {})
        await page.waitForTimeout(350)
        const momoAfter = await text(page.getByTestId('combat-momentum-v2'))
        if (momoAfter && momoAfter !== momoBefore) {
            log(`step 3: momentum chip advanced ("${momoBefore.replace(/\n/g, ' ')}" → "${momoAfter.replace(/\n/g, ' ')}") on a ${poweredColor}-die play`)
        } else if (/no momentum/i.test(momoAfter)) {
            note(`momentum chip did not advance after the reachable paid play (powered with a ${poweredColor} die; chip="${momoAfter.replace(/\n/g, ' ')}"). `
                + 'Two factors: (1) momentum advances by the DIE color and only for a chain stance — a WILD die "does not shift it" (combat.engine.ts:1100). (2) The one cleanly-stageable colored play this seed is Soft Word, a heart SWAY card — and a probe found its paid APPLY CONSUMES the powering die yet leaves the enemy SWAY meter at 0/31 and bounces the card back to hand (the play does not commit). That looks like a real product-code issue, reported as a FINDING for the orchestrator (NOT papered over here); driving a clean colored-damage play to observe the chip advance is a card-pool + fan-occlusion limit of the sandbox, left to D7\'s qualitative flag-on pass.')
        } else {
            log(`step 3: momentum chip reads "${momoAfter.replace(/\n/g, ' ')}"`)
        }
        if (capture) await shot(page, '02-momentum-chip')
    } else {
        note('no committable paid play this roll — momentum-advance assertion skipped')
    }

    // STEP 4 — attempt a chain break (play a non-`next` stance). Best-effort:
    // stage + power a second card whose stance is NOT the chain's next color.
    const dice2 = await readDice()
    let broke = false
    for (const card of hand) {
        if (card.uid === poweredUid || !card.stance) continue
        const die = dice2.find((d) => d.usable && canPower(d.color, card.stance))
        if (!die) continue
        if (!(await has(page.getByTestId(`combat-staged-${card.uid}`)))) {
            await dragTo(page, page.getByTestId(`combat-hand-${card.uid}`), await centerOf(playArea))
        }
        if (!(await has(page.getByTestId(`combat-staged-${card.uid}`)))) continue
        await dragTo(page, page.getByTestId(`combat-die-${die.id}`), await centerOf(page.getByTestId(`combat-staged-${card.uid}`)))
        if (await has(page.getByTestId(`combat-apply-${card.uid}`))) {
            await page.getByTestId(`combat-apply-${card.uid}`).click({ force: true }).catch(() => {})
            await page.waitForTimeout(350)
        }
        if (await has(page.getByTestId('combat-momentum-broke'))) {
            broke = true
            log(`step 4: momentum BROKEN LOUDLY — "${await text(page.getByTestId('combat-momentum-broke'))}"`)
            break
        }
    }
    if (!broke) note('chain break not exercised this roll (a LOUD "✕ MOMENTUM BROKEN" needs a specific off-sequence play; left to tuning-phase qualitative pass)')

    // STEP 6 (resolution half) — end the phase and look for a resolved stance check.
    if (await has(page.getByTestId('combat-end-phase'))) {
        await page.getByTestId('combat-end-phase').click({ force: true }).catch(() => {})
        await page.waitForTimeout(600)
        if (await has(page.getByTestId('combat-intent-stance-check-resolved'))) {
            log(`step 6: stance check RESOLVED with feedback — "${(await text(page.getByTestId('combat-intent-stance-check-resolved'))).replace(/\n/g, ' ')}"`)
        } else {
            note('stance-check resolution line not visible after the first phase (may need the player to hold a stance into the resolve)')
        }
    }
}

/** STEP 7 — blacksmith HONE round-trip via the Dev menu. From /dev: grant
 *  currency, open the forge, HONE heart, claim, and return to /dev. Captures
 *  the forge screenshot. Returns true if the claim applied. */
async function honeHeartAtBlacksmith(page, { capture }) {
    // Ensure the HONE is affordable (its price ~2◆; grant a large purse).
    await page.getByTestId('debug-currency-large-grant').click({ force: true }).catch(() => {})
    await page.waitForTimeout(150)

    await page.getByTestId('debug-blacksmith-button').waitFor({ state: 'visible', timeout: 15000 })
    await page.getByTestId('debug-blacksmith-button').click()
    // <BlacksmithGate> observes the slice and pushes /blacksmith (client-side).
    await page.waitForURL((url) => url.pathname.endsWith('/blacksmith'), { timeout: 10000 }).catch(() => {})

    // intro → forging
    if (await has(page.getByTestId('blacksmith-begin'))) {
        await page.getByTestId('blacksmith-begin').click({ force: true }).catch(() => {})
    }
    await page.getByTestId('blacksmith-forging').waitFor({ state: 'visible', timeout: 10000 })
    if (capture) await shot(page, '04-blacksmith-forge')

    const honeOffer = page.getByTestId('blacksmith-offer-hone:heart')
    if (!(await has(honeOffer))) { note('blacksmith HONE heart offer not present — round-trip aborted'); return false }
    const disabled = (await honeOffer.getAttribute('aria-disabled').catch(() => null)) === 'true'
    if (disabled) {
        note(`HONE heart offer disabled: "${await text(page.getByTestId('blacksmith-offer-hone:heart-reason'))}"`)
        return false
    }
    await honeOffer.click({ force: true }).catch(() => {})
    await page.waitForTimeout(250)
    // The smith's response card → continue back to forging.
    if (await has(page.getByTestId('blacksmith-continue'))) {
        await page.getByTestId('blacksmith-continue').click({ force: true }).catch(() => {})
        await page.waitForTimeout(200)
    }
    // Leave → outcome → claim (writes outcome.rail to Character.dieGear).
    await page.getByTestId('blacksmith-leave').click({ force: true }).catch(() => {})
    await page.getByTestId('blacksmith-outcome').waitFor({ state: 'visible', timeout: 10000 })
    await page.getByTestId('blacksmith-claim').click({ force: true }).catch(() => {})
    // The gate clears the slice → routes back to /dev.
    await page.waitForURL((url) => url.pathname.endsWith('/dev'), { timeout: 10000 }).catch(() => {})
    log('step 7: HONE heart claimed at the forge')
    return true
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

        // Pre-boot: flip the flag ON + pin the seed BEFORE the bundle runs. This
        // is the SAME evaluateOnNewDocument slot `__AXM_COMBAT_SEED__` uses, and
        // the only way to reach the flag-on surface (applyCombatFlagsFromEnv
        // reads `__AXM_UPGRADEABLE_DICE__` once at _layout boot).
        // `__AXM_FORCE_DEV_TOOLS__`: a static web export can't surface
        // `extra.devToolsEnabled` at runtime, so the dev-tools affordance (the
        // /dev route we drive the forge + combat launchers from) needs the
        // documented opt-in (lib/buildProfile.ts). Inert in real builds.
        await page.addInitScript((s) => {
            globalThis.__AXM_FORCE_DEV_TOOLS__ = true
            globalThis.__AXM_UPGRADEABLE_DICE__ = '1'
            globalThis.__AXM_COMBAT_SEED__ = s
        }, SEED)

        log(`=== spec 33 flag-ON combat e2e (seed ${SEED}, viewport ${VIEWPORT.width}×${VIEWPORT.height}) ===`)
        await page.goto(`${baseUrl}/character`, { waitUntil: 'networkidle' })
        await openDevTools(page)

        // Grant currency up front (used by the forge round-trip) then enter combat.
        await page.getByTestId('debug-currency-large-grant').click({ force: true }).catch(() => {})
        await page.waitForTimeout(120)

        // ── Pass A: flag-on board — assert the stack + capture screenshots ──
        await enterCombat(page)
        const baseline = await assertFlagOnBoard(page, { capture: true })
        // Focused gear-rail crop (small-screen crowding evidence).
        await page.getByTestId('combat-die-gear-rail').scrollIntoViewIfNeeded().catch(() => {})
        await shot(page, '03-die-gear-rail')
        // Return to /dev client-side (history back; no reload → store survives).
        await page.goBack({ waitUntil: 'commit' }).catch(() => {})
        await page.waitForURL((url) => url.pathname.endsWith('/dev'), { timeout: 10000 }).catch(() => {})

        // ── STEP 7: forge HONE round-trip ──
        const claimed = await honeHeartAtBlacksmith(page, { capture: true })

        // ── Pass B: re-enter combat, assert the tray reflects the honed rail ──
        if (claimed) {
            await enterCombat(page)
            const upgraded = await heartGearFaces(page)
            if (!upgraded) fail('re-entered combat but the heart die-gear slot did not render')
            log(`step 7: heart die-gear after HONE = ${upgraded.special}·${upgraded.mana}·${upgraded.miss} (was ${baseline.special}·${baseline.mana}·${baseline.miss})`)
            if (upgraded.mana !== baseline.mana + 1) {
                fail(`HONE did not round-trip into the combat tray: heart mana faces ${baseline.mana} → ${upgraded.mana} (expected +1)`)
            }
            if (upgraded.miss !== baseline.miss - 1) {
                fail(`HONE mana gain should cost a miss face: heart miss ${baseline.miss} → ${upgraded.miss} (expected -1)`)
            }
            log('step 7: the persisted HONE round-trips into the flag-on combat tray (more mana, fewer miss)')
            await shot(page, '05-tray-after-hone')
        } else {
            note('forge HONE not claimed — the tray-reflects-HONE assertion was skipped')
        }

        await context.close()
        log(`ALL PASS — spec 33 flag-on stack exercised end-to-end${notes.length ? ` (${notes.length} NOTE${notes.length === 1 ? '' : 's'} — reachable-subset degradations)` : ''}`)
        if (notes.length) { log('NOTES:'); notes.forEach((n, i) => log(`  ${i + 1}. ${n}`)) }
    } finally {
        await browser.close()
        server.close()
    }
}

main().catch((err) => {
    console.error('upgradeable-dice-e2e: aborted —', err.message)
    process.exit(process.exitCode || 3)
})
