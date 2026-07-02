#!/usr/bin/env node
// Throwaway static server for the visual audit: serves .audit-dist
// with the same SPA fallback rules as smoke-screens.mjs, on a fixed port.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '.audit-dist')
const PORT = Number(process.env.PORT ?? 4173)

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=utf-8',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
}

async function candidate(p) {
    try {
        const info = await stat(p)
        return { p, exists: true, dir: info.isDirectory() }
    } catch {
        return { p, exists: false, dir: false }
    }
}

createServer(async (req, res) => {
    try {
        const url = new URL(req.url, 'http://localhost')
        let pathname = decodeURIComponent(url.pathname)
        if (pathname.endsWith('/')) pathname += 'index.html'
        let filePath = join(ROOT, pathname)
        if (!filePath.startsWith(ROOT)) {
            res.statusCode = 403
            return res.end('forbidden')
        }
        const exact = await candidate(filePath)
        const dirIndex = await candidate(join(filePath, 'index.html'))
        const htmlGuess = await candidate(join(ROOT, pathname + '.html'))
        if (exact.exists && !exact.dir) {
            // keep filePath
        } else if (exact.exists && exact.dir && dirIndex.exists) {
            filePath = dirIndex.p
        } else if (htmlGuess.exists && !htmlGuess.dir) {
            filePath = htmlGuess.p
        } else {
            filePath = join(ROOT, 'index.html')
        }
        const data = await readFile(filePath)
        res.statusCode = 200
        res.setHeader('Content-Type', MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream')
        res.end(data)
    } catch (e) {
        res.statusCode = 500
        res.end(String(e))
    }
}).listen(PORT, '127.0.0.1', () => {
    console.log(`audit-serve: http://127.0.0.1:${PORT}`)
})
