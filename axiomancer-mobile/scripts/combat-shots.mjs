#!/usr/bin/env node
// Re-export the web build and capture current combat shots (hand + card detail).
// Usage: node scripts/combat-shots.mjs [outDir] [roundTag]
//   FRESH=0 to reuse an existing .smoke-dist export (default: re-export).
import { chromium } from 'playwright'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, mkdir, copyFile } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { resolve, dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(__dirname, '..')
const DIST = resolve(REPO, '.smoke-dist')
const OUT = process.argv[2] || '/home/pn143/Workspace/axiomancer-both/findings/current-combat'
const TAG = process.argv[3] || ''
const SEED = 16
const VIEWPORT = { width: 390, height: 844 }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf' }
const log = (m) => console.log(`shots: ${m}`)

if (process.env.FRESH !== '0') {
  log('expo export --platform web → .smoke-dist (BUILD_PROFILE=preview) …')
  const r = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', DIST], { cwd: REPO, stdio: 'inherit', env: { ...process.env, BUILD_PROFILE: 'preview' } })
  if (r.status !== 0) { console.error('shots: export FAILED'); process.exit(3) }
} else if (!existsSync(DIST)) { console.error('shots: no .smoke-dist and FRESH=0'); process.exit(3) }

function serve() {
  return new Promise((res) => {
    const server = createServer(async (req, rep) => {
      try {
        let pn = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (pn === '/') pn = '/index.html'
        const tf = [join(DIST, pn), join(DIST, pn + '.html'), join(DIST, 'index.html')]
        const chosen = tf.find((p) => existsSync(p) && statSync(p).isFile()) || join(DIST, 'index.html')
        const body = await readFile(chosen); rep.setHeader('content-type', MIME[extname(chosen)] ?? 'application/octet-stream'); rep.end(body)
      } catch (e) { rep.statusCode = 500; rep.end(String(e)) }
    })
    server.listen(0, '127.0.0.1', () => res({ server, base: `http://127.0.0.1:${server.address().port}` }))
  })
}
async function killPrimer(page) { for (let k = 0; k < 5; k++) { await page.waitForTimeout(250); const s = page.getByTestId('combat-primer-skip'); if (await s.count()) { await s.click({ timeout: 1500, force: true }).catch(() => {}) } else break } }
async function shot(page, name) { await mkdir(OUT, { recursive: true }); const p = join(OUT, `${name}.png`); await page.screenshot({ path: p, fullPage: false }); log(`shot → ${p}`) }

const { server, base } = await serve()
// PW_CHROMIUM: launch a system-provided Chromium (e.g. sandboxes that pre-install
// one at a path the pinned Playwright version doesn't know about).
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 })
await page.emulateMedia({ reducedMotion: 'reduce' })
await page.addInitScript((s) => { globalThis.__AXM_COMBAT_SEED__ = s }, SEED)
await page.goto(`${base}/combat-encounter`, { waitUntil: 'networkidle' })
await page.getByTestId('combat-reveal').waitFor({ state: 'visible', timeout: 20000 }).catch(() => {})
await killPrimer(page)
await page.getByTestId('combat-enter').click({ timeout: 8000, force: true }).catch(() => {})
await killPrimer(page)
await page.getByTestId('combat-board').waitFor({ state: 'visible', timeout: 20000 })
await page.waitForTimeout(600)
await shot(page, 'current-hand')

// tap the visible TOP of each hand card until the detail modal opens
const cards = page.locator('[data-testid^="combat-hand-"]')
const n = await cards.count(); log(`hand cards: ${n}`)
let opened = false
for (let i = n - 1; i >= 0 && !opened; i--) {
  const b = await cards.nth(i).boundingBox(); if (!b) continue
  await page.mouse.click(b.x + b.width / 2, b.y + 18).catch(() => {})
  await page.waitForTimeout(450)
  if (await page.getByTestId('combat-card-detail').count()) { opened = true; break }
}
if (opened) { await page.waitForTimeout(350); await shot(page, 'current-card-detail') } else log('detail modal did not open')

if (TAG) { for (const nm of ['current-hand', 'current-card-detail']) { try { await copyFile(join(OUT, `${nm}.png`), join(OUT, `${TAG}-${nm.replace('current-', '')}.png`)) } catch {} } }
await browser.close(); server.close(); log('done')
