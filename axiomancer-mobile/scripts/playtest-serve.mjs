#!/usr/bin/env node
// Static server for manual/agent playtesting of the exported web build.
//
// Mirrors the routing rules in combat-round-e2e.mjs's startStaticServer, and
// adds one thing that harness gets via Playwright's addInitScript but an
// agent driving the browser through MCP cannot: it injects
// `__AXM_FORCE_DEV_TOOLS__` into every served HTML document BEFORE the app
// bundle runs, so `?fixture=<id>` deep links and the /dev route work against a
// static export (see lib/buildProfile.ts's escape-hatch comment).

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';

const ROOT = resolve(process.argv[2] ?? '.smoke-dist');
const PORT = Number(process.argv[3] ?? 18080);

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif',
    '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2',
    '.ico': 'image/x-icon', '.map': 'application/json; charset=utf-8',
};

const INJECT = '<script>globalThis.__AXM_FORCE_DEV_TOOLS__=true;</script>';

async function fileCandidate(p) {
    try { const info = await stat(p); return { p, exists: true, dir: info.isDirectory() }; }
    catch { return { p, exists: false, dir: false }; }
}

const server = createServer(async (req, res) => {
    try {
        const url = new URL(req.url, 'http://localhost');
        let pathname = decodeURIComponent(url.pathname);
        if (pathname.endsWith('/')) pathname += 'index.html';
        const filePath = join(ROOT, pathname);
        if (!filePath.startsWith(ROOT)) { res.statusCode = 403; return res.end('forbidden'); }
        const candidates = [
            await fileCandidate(filePath),
            await fileCandidate(join(filePath, 'index.html')),
            await fileCandidate(join(ROOT, pathname + '.html')),
            await fileCandidate(join(ROOT, 'index.html')),
        ];
        const chosen =
            (candidates[0].exists && !candidates[0].dir && candidates[0].p) ||
            (candidates[1].exists && !candidates[1].dir && candidates[1].p) ||
            (candidates[2].exists && !candidates[2].dir && candidates[2].p) ||
            candidates[3].p;
        let body = await readFile(chosen);
        const type = MIME[extname(chosen)] ?? 'application/octet-stream';
        if (type.startsWith('text/html')) {
            // Before <head>'s first script so the global exists at boot.
            body = Buffer.from(body.toString('utf8').replace('<head>', `<head>${INJECT}`), 'utf8');
        }
        res.setHeader('content-type', type);
        res.end(body);
    } catch (err) { res.statusCode = 500; res.end(String(err)); }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`playtest server: http://127.0.0.1:${PORT} (root ${ROOT})`);
});
