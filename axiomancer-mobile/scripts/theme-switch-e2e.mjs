// Live theme-switch e2e against the exported production web build.
// Serves .smoke-dist, opens /character, expands the COLOUR THEME picker,
// switches themes, and asserts the palette actually re-paints in place
// (no reload, no console errors).

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const DIST = new URL('../.smoke-dist', import.meta.url).pathname;

// Build the web export if it isn't already present (reuse otherwise, so
// running back-to-back with the visual smoke gate is cheap).
if (!existsSync(join(DIST, 'index.html'))) {
    console.log('theme-e2e: exporting web build → .smoke-dist ...');
    const r = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', DIST], {
        cwd: new URL('..', import.meta.url).pathname,
        stdio: 'inherit',
    });
    if (r.status !== 0) { console.error('theme-e2e: expo export failed'); process.exit(3); }
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.map': 'application/json' };

const server = createServer(async (req, res) => {
    try {
        let p = decodeURIComponent((req.url || '/').split('?')[0]);
        let file = join(DIST, p);
        if (p === '/' ) file = join(DIST, 'index.html');
        else if (!extname(p)) {
            // expo-router static export emits <route>.html
            const html = join(DIST, p + '.html');
            file = existsSync(html) ? html : join(DIST, 'index.html');
        }
        if (!existsSync(file)) { res.statusCode = 404; res.end('nf'); return; }
        const buf = await readFile(file);
        res.setHeader('content-type', MIME[extname(file)] || 'application/octet-stream');
        res.end(buf);
    } catch (e) { res.statusCode = 500; res.end(String(e)); }
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;
console.log('serving', base);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

let failed = false;
const check = (label, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'}: ${label}`); if (!cond) failed = true; };

try {
    await page.goto(`${base}/character`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Sentinel to detect a full reload (a reload wipes window state).
    await page.evaluate(() => { window.__noReload = 'alive'; });

    // Helper: read the COLOUR THEME label colour (driven by AXM.bone).
    const labelColor = () => page.evaluate(() => {
        const els = [...document.querySelectorAll('*')];
        const el = els.find((e) => e.children.length === 0 && e.textContent === 'COLOUR THEME');
        return el ? getComputedStyle(el).color : null;
    });

    const toggle = page.getByTestId('theme-switcher-toggle');
    check('COLOUR THEME switcher present', await toggle.count() > 0);
    await toggle.click();
    await page.waitForTimeout(300);

    const before = await labelColor();
    check('read initial themed label colour', !!before);

    // Switch to Frost Marrow.
    await page.getByTestId('theme-frost-marrow').click();
    await page.waitForTimeout(400);
    const afterFrost = await labelColor();
    check('label colour changed after switching to Frost Marrow', before && afterFrost && before !== afterFrost);

    // Switch to Plague Bloom — should differ again.
    await page.getByTestId('theme-plague-bloom').click();
    await page.waitForTimeout(400);
    const afterPlague = await labelColor();
    check('label colour changed again after Plague Bloom', afterFrost && afterPlague && afterFrost !== afterPlague);

    // No full reload happened (state survived).
    const sentinel = await page.evaluate(() => window.__noReload);
    check('no full page reload during switches', sentinel === 'alive');

    // URL unchanged (still on /character).
    check('stayed on /character', new URL(page.url()).pathname.startsWith('/character'));

    check('zero console / page errors', consoleErrors.length === 0);
    if (consoleErrors.length) console.log('  errors:', consoleErrors.slice(0, 5));

    console.log('colours:', { before, afterFrost, afterPlague });
} catch (e) {
    console.log('FAIL: exception', e.message);
    failed = true;
} finally {
    await browser.close();
    server.close();
}

process.exit(failed ? 1 : 0);
