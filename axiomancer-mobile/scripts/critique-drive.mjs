#!/usr/bin/env node
// scripts/critique-drive.mjs
//
// Phase 34 — unattended `/critique` transport.
//
// The problem this solves: `/critique` normally delegates the playthrough to
// the `playtester` sub-agent, which drives the build with the Playwright *MCP*
// tools. Those MCP tool grants do not propagate into the Agent-tool sandbox on
// unattended ticks, so eight consecutive unattended passes filed zero findings.
// The fix is NOT to drop Playwright — it is to drop the *MCP + sub-agent* hop:
// this is a plain Node subprocess that imports the Playwright *library* and
// drives the exported web build directly. No MCP, no grant, no sub-agent.
//
// It does not judge. It DRIVES + CAPTURES: for each screen in the critique set
// it navigates the hermetic build, settles, and writes a screenshot + the DOM
// innerText + any console/page errors to `.critique-artifacts/<viewport>/`,
// plus a top-level `manifest.json`. The `/critique` skill's main agent (which
// has vision and no grant problem) then reads those artifacts and files the
// fresh-eyes findings itself. A screen that redirects, blanks, or throws is
// captured as-is — that is an OBSERVATION for the reviewer, not a driver
// failure. Only a boot failure (export / server / browser) exits non-zero.
//
// Usage:
//   node scripts/critique-drive.mjs                     # mobile viewport
//   CRITIQUE_VIEWPORT=desktop node scripts/critique-drive.mjs
//   CRITIQUE_VIEWPORT=both    node scripts/critique-drive.mjs
//   CRITIQUE_DRIVE_REUSE_EXPORT=1 node scripts/critique-drive.mjs
//   CRITIQUE_DRIVE_CHROME=/path/to/chrome node scripts/critique-drive.mjs
//
// Exit codes: 0 = artifacts captured (even if some screens errored) ·
// 3 = boot failure (export / static server / browser launch).

import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const EXPORT_DIR = resolve(REPO_ROOT, '.critique-dist')
const ARTIFACT_ROOT = resolve(REPO_ROOT, '.critique-artifacts')
// Seed 16 rolls a draftable first die for the combat screen's demo deck (same
// pin the combat e2e uses), so the combat capture is deterministic.
const COMBAT_SEED = 16

const VIEWPORTS = {
    mobile: { width: 375, height: 812 },
    desktop: { width: 1280, height: 800 },
}

// The critique screen set (skill §3). Each entry navigates a route and captures
// what renders. `prepare` is a best-effort interaction to reach a downstream
// state; if it throws, we capture whatever is on screen and move on.
//
// IMPORTANT — only COLD-ENTERABLE routes belong here. Many expo-router routes
// in this app are STATE-GATED: `/village`, `/cutscene`, `/dialogue`, `/event`
// are pushed by `<EventGate>` in response to a seeded game event, and their
// screens `router.back()` out when there is no active event (e.g. `/village`
// bounces on `!vm.active`). Navigating to them by URL just captures a blank
// bounce — that is a TRANSPORT artifact, not a product finding, so they are
// excluded. Reaching them faithfully needs game-flow seeding (a debug event
// trigger); that is playthrough territory (interactive `/critique` + the
// playtester), not this lightweight direct-nav capture. Entry points below are
// all confirmed cold-enterable: `/` (title→onboarding), `/combat-encounter`
// (self-bootstraps a demo deck), `/(tabs)/exploration` (the default landing
// tab). If you add a route, verify it renders real content cold before adding.
const SCREENS = [
    {
        name: 'title',
        path: '/',
        why: 'First impression. The fold matters.',
    },
    {
        name: 'onboarding',
        path: '/',
        why: 'Where a first-time player forms their model of the game.',
        // New player: dismiss the title, land on the starter-bundle picker.
        prepare: async (page) => {
            const cont = page.getByRole('button').first()
            if (await cont.count()) await cont.click({ timeout: 4000, force: true }).catch(() => {})
            await page.getByTestId('bundle-select').waitFor({ state: 'visible', timeout: 6000 }).catch(() => {})
        },
    },
    {
        name: 'combat',
        path: '/combat-encounter',
        why: "The game's core loop as actually played.",
        seed: COMBAT_SEED,
        // Dismiss the tutorial primer if it overlays the reveal/preview.
        prepare: dismissCombatPrimer,
    },
    {
        name: 'combat-board',
        path: '/combat-encounter',
        why: 'The live board mid-fight — card hand + face copy (VITAE/DoT text) only render after ENTER COMBAT; the pre-fight preview alone cannot re-validate them unattended.',
        seed: COMBAT_SEED,
        prepare: async (page) => {
            await dismissCombatPrimer(page)
            await page.getByTestId('combat-enter').click({ timeout: 8000, force: true }).catch(() => {})
            await dismissCombatPrimer(page)
            await page.getByTestId('combat-board').waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
        },
    },
    {
        name: 'exploration-hub',
        path: '/(tabs)/exploration',
        why: 'Town / exploration hub — navigation, voice, orientation, and the early-progression state a cold player lands on.',
    },
]

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=utf-8',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
}

// Shared by the pre-fight and in-combat screens: the tutorial primer can
// overlay either the reveal or the live board.
async function dismissCombatPrimer(page) {
    for (let k = 0; k < 4; k++) {
        await page.waitForTimeout(300)
        const skip = page.getByTestId('combat-primer-skip')
        if (await skip.count()) await skip.click({ timeout: 2000, force: true }).catch(() => {})
        else break
    }
}

function log(msg) { console.log(`critique-drive: ${msg}`) }

function runExpoExport() {
    if (existsSync(EXPORT_DIR) && process.env.CRITIQUE_DRIVE_REUSE_EXPORT === '1') {
        log('reusing existing .critique-dist (CRITIQUE_DRIVE_REUSE_EXPORT=1)')
        return
    }
    log('running `expo export --platform web` → .critique-dist ...')
    // Cross-platform spawn: on Windows `npx` is `npx.cmd`, and Node refuses to
    // spawn a .cmd without a shell (CVE-2024-27980), so use shell there.
    const isWin = process.platform === 'win32'
    const result = spawnSync(
        isWin ? 'npx.cmd' : 'npx',
        ['expo', 'export', '--platform', 'web', '--output-dir', EXPORT_DIR],
        { cwd: REPO_ROOT, stdio: 'inherit', env: { ...process.env }, shell: isWin },
    )
    if (result.error) { console.error('critique-drive: expo export could not spawn —', result.error.message); process.exit(3) }
    if (result.status !== 0) { console.error('critique-drive: expo export failed'); process.exit(3) }
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

// Capture one screen in one viewport. Never throws for screen-level trouble —
// a nav error / page error is recorded on the entry and returned as data.
async function captureScreen(context, baseUrl, screen, viewport, outDir, index) {
    const consoleErrors = []
    const pageErrors = []
    const page = await context.newPage()
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 400)) })
    page.on('pageerror', (e) => pageErrors.push(String(e.message).slice(0, 400)))

    const idx = String(index + 1).padStart(2, '0')
    const base = `${idx}-${screen.name}`
    const entry = {
        name: screen.name, path: screen.path, why: screen.why, viewport,
        screenshot: `${base}.png`, domText: `${base}.txt`,
        finalUrl: null, navError: null, consoleErrors, pageErrors,
    }
    try {
        if (screen.seed != null) {
            await page.addInitScript((s) => { globalThis.__AXM_COMBAT_SEED__ = s }, screen.seed)
        }
        await page.goto(`${baseUrl}${screen.path}`, { waitUntil: 'networkidle', timeout: 20000 })
        if (screen.prepare) await screen.prepare(page).catch((e) => { entry.navError = `prepare: ${e.message}` })
        await page.waitForTimeout(700)
        entry.finalUrl = page.url()
        await page.screenshot({ path: join(outDir, entry.screenshot), fullPage: false })
        const text = await page.evaluate(() => document.body?.innerText ?? '').catch(() => '')
        await writeFile(join(outDir, entry.domText), text.trim().slice(0, 8000), 'utf8')
        log(`  ${viewport}/${screen.name} → captured (${consoleErrors.length} console err, ${pageErrors.length} page err)`)
    } catch (err) {
        entry.navError = entry.navError ?? err.message
        log(`  ${viewport}/${screen.name} → nav error: ${err.message} (captured as observation)`)
        // Still try to grab whatever rendered so the reviewer sees the failure state.
        try { await page.screenshot({ path: join(outDir, entry.screenshot), fullPage: false }) } catch { /* ignore */ }
    } finally {
        await page.close().catch(() => {})
    }
    return entry
}

async function driveViewport(browser, baseUrl, viewport) {
    const dims = VIEWPORTS[viewport]
    const outDir = join(ARTIFACT_ROOT, viewport)
    await mkdir(outDir, { recursive: true })
    const entries = []
    for (let i = 0; i < SCREENS.length; i++) {
        // Fresh context per screen = genuine cold, first-time-player state
        // (no leaked onboarding/combat state between screens).
        const context = await browser.newContext({ viewport: dims, hasTouch: false })
        try {
            entries.push(await captureScreen(context, baseUrl, SCREENS[i], viewport, outDir, i))
        } finally {
            await context.close().catch(() => {})
        }
    }
    return { viewport, dims, outDir, screens: entries }
}

async function main() {
    const want = (process.env.CRITIQUE_VIEWPORT ?? 'mobile').toLowerCase()
    const viewports = want === 'both' ? ['mobile', 'desktop']
        : want === 'desktop' ? ['desktop'] : ['mobile']

    // Fresh artifacts each run so a stale screenshot never masquerades as current.
    await rm(ARTIFACT_ROOT, { recursive: true, force: true }).catch(() => {})
    await mkdir(ARTIFACT_ROOT, { recursive: true })

    runExpoExport()
    const { server, baseUrl } = await startStaticServer(EXPORT_DIR)
    log(`static server at ${baseUrl}`)

    let browser
    try {
        const { chromium } = await import('playwright')
        const launchOptions = { headless: true }
        if (process.env.CRITIQUE_DRIVE_CHROME) launchOptions.executablePath = process.env.CRITIQUE_DRIVE_CHROME
        browser = await chromium.launch(launchOptions)
    } catch (err) {
        console.error('critique-drive: browser launch failed —', err.message)
        console.error('critique-drive: run `npx playwright install chromium` first.')
        server.close()
        process.exit(3)
    }

    const passes = []
    try {
        for (const vp of viewports) {
            log(`=== driving critique screen set — ${vp} (${VIEWPORTS[vp].width}x${VIEWPORTS[vp].height}) ===`)
            passes.push(await driveViewport(browser, baseUrl, vp))
        }
    } finally {
        await browser.close().catch(() => {})
        server.close()
    }

    const manifest = {
        generatedAtNote: 'timestamp intentionally omitted — reviewer stamps at file time',
        transport: 'critique-drive (Phase 34, non-MCP subprocess)',
        exportDir: EXPORT_DIR,
        artifactRoot: ARTIFACT_ROOT,
        viewports: passes.map((p) => ({
            viewport: p.viewport, dims: p.dims, dir: p.outDir, screens: p.screens,
        })),
    }
    await writeFile(join(ARTIFACT_ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')

    const total = passes.reduce((n, p) => n + p.screens.length, 0)
    const errored = passes.reduce((n, p) => n + p.screens.filter((s) => s.navError || s.pageErrors.length).length, 0)
    log(`ALL CAPTURED — ${total} screen(s) across ${passes.length} viewport(s); ${errored} with errors/nav trouble`)
    log(`artifacts → ${ARTIFACT_ROOT}  (read manifest.json, then the screenshots + .txt)`)
}

main().catch((err) => {
    console.error('critique-drive: aborted —', err.message)
    process.exit(process.exitCode || 3)
})
