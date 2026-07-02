/**
 * cardEditorPlugin — the Vite dev-server plugin that gives the card (Action)
 * editor live read + write-back access to the REAL
 * `axiomancer-mechanics/src/Cards/cards.library.ts`.
 *
 * It runs in Node (full fs access) and mounts a tiny JSON API on the dev
 * server. This is a LOCAL DEV TOOL — it is never bundled or published.
 *
 *   GET    /api/cards        → { ok, cards: Card[] }   (read fresh from disk)
 *   POST   /api/cards        → body: CardDraft          → upsert  → { ok, id }
 *   DELETE /api/cards/:id     → remove the card by id    → remove  → { ok, id }
 *
 * Reads go through Vite's `ssrLoadModule` (so the live `cardLibrary` array is
 * returned exactly as the app sees it); the module is invalidated before each
 * read so edits written by POST/DELETE are reflected immediately. Writes use
 * the pure {@link upsertCard} / {@link removeCard} string splicers, then persist
 * with `fs.writeFile`.
 */
import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { Plugin, ViteDevServer, Connect } from 'vite';
import type { ServerResponse } from 'node:http';
import { upsertCard, removeCard } from './skillCodegen';
import type { CardDraft } from '../types';

/** Module specifier (via the `@mechanics` alias) of the live library. */
const LIBRARY_MODULE = '@mechanics/Cards/cards.library';

function resolveLibraryPath(server: ViteDevServer): string {
    // server.config.root is the editor-web directory; the package src sits one
    // level up (mirrors the `@mechanics` -> `../src` alias).
    return path.resolve(server.config.root, '../src/Cards/cards.library.ts');
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
    const payload = JSON.stringify(body);
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(payload);
}

async function readBody(req: Connect.IncomingMessage): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks).toString('utf-8');
}

/** Invalidate the cached library module so the next ssrLoadModule re-reads disk. */
async function invalidateLibrary(server: ViteDevServer): Promise<void> {
    const resolved = await server.pluginContainer.resolveId(LIBRARY_MODULE);
    if (!resolved) return;
    const node = server.moduleGraph.getModuleById(resolved.id);
    if (node) server.moduleGraph.invalidateModule(node);
}

async function loadCards(server: ViteDevServer): Promise<unknown[]> {
    await invalidateLibrary(server);
    const mod = (await server.ssrLoadModule(LIBRARY_MODULE)) as {
        cardLibrary?: unknown[];
    };
    if (!Array.isArray(mod.cardLibrary)) {
        throw new Error('cardLibrary export not found / not an array.');
    }
    return mod.cardLibrary;
}

export function cardEditorPlugin(): Plugin {
    return {
        name: 'axiomancer-card-editor',
        apply: 'serve',
        configureServer(server: ViteDevServer) {
            const libPath = resolveLibraryPath(server);

            server.middlewares.use(async (req, res, next) => {
                const url = (req.url ?? '').split('?')[0];
                if (!url.startsWith('/api/cards')) return next();

                try {
                    // GET /api/cards — read fresh card list
                    if (req.method === 'GET' && url === '/api/cards') {
                        const cards = await loadCards(server);
                        return sendJson(res, 200, { ok: true, cards });
                    }

                    // POST /api/cards — upsert (body = CardDraft)
                    if (req.method === 'POST' && url === '/api/cards') {
                        const raw = await readBody(req);
                        const draft = JSON.parse(raw) as CardDraft;
                        if (!draft || typeof draft.id !== 'string' || draft.id.trim() === '') {
                            return sendJson(res, 400, {
                                ok: false,
                                error: 'Body must be a CardDraft with a non-empty id.',
                            });
                        }
                        const before = await fs.readFile(libPath, 'utf-8');
                        const after = upsertCard(before, draft);
                        if (after !== before) await fs.writeFile(libPath, after, 'utf-8');
                        await invalidateLibrary(server);
                        return sendJson(res, 200, { ok: true, id: draft.id.trim() });
                    }

                    // DELETE /api/cards/:id — remove
                    if (req.method === 'DELETE' && url.startsWith('/api/cards/')) {
                        const id = decodeURIComponent(url.slice('/api/cards/'.length));
                        if (id.trim() === '') {
                            return sendJson(res, 400, { ok: false, error: 'Missing card id.' });
                        }
                        const before = await fs.readFile(libPath, 'utf-8');
                        const after = removeCard(before, id);
                        if (after !== before) await fs.writeFile(libPath, after, 'utf-8');
                        await invalidateLibrary(server);
                        return sendJson(res, 200, { ok: true, id: id.trim() });
                    }

                    return sendJson(res, 405, {
                        ok: false,
                        error: `Unsupported ${req.method} ${url}`,
                    });
                } catch (err) {
                    server.config.logger.error(
                        `[card-editor] ${req.method} ${url} failed: ${(err as Error).message}`,
                    );
                    return sendJson(res, 500, {
                        ok: false,
                        error: (err as Error).message,
                    });
                }
            });

            server.config.logger.info(
                `  ➜  Card editor API: GET/POST /api/cards, DELETE /api/cards/:id`,
            );
            server.config.logger.info(`     write-back target: ${libPath}`);
        },
    };
}

export default cardEditorPlugin;
