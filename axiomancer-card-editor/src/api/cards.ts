/**
 * Front-end client for the card-editor dev-server API (see
 * `src/server/cardEditorPlugin.ts`). These thin `fetch` wrappers are the ONLY
 * way the UI persists card (Action) edits back into the real
 * `src/Cards/cards.library.ts`.
 *
 * Endpoint contract:
 *   GET    /api/cards        → { ok, cards: Card[] }
 *   POST   /api/cards        → body: CardDraft → { ok, id }
 *   DELETE /api/cards/:id     → { ok, id }
 */
import type { CardDraft } from '../types';
import type { Card } from '../data/mechanics';

interface OkCards { ok: true; cards: Card[] }
interface OkId { ok: true; id: string }
interface ApiError { ok: false; error: string }

async function request<T extends { ok: true }>(
    input: string,
    init?: RequestInit,
): Promise<T> {
    const res = await fetch(input, init);
    let body: T | ApiError;
    try {
        body = (await res.json()) as T | ApiError;
    } catch {
        throw new Error(`${init?.method ?? 'GET'} ${input} → ${res.status} (non-JSON response)`);
    }
    if (!res.ok || body.ok === false) {
        const msg = body.ok === false ? body.error : `HTTP ${res.status}`;
        throw new Error(`${init?.method ?? 'GET'} ${input} failed: ${msg}`);
    }
    return body;
}

/** GET /api/cards — the live card list, read fresh from cards.library.ts. */
export async function fetchCards(): Promise<Card[]> {
    const body = await request<OkCards>('/api/cards');
    return body.cards;
}

/** POST /api/cards — create or update a card; resolves to the persisted id. */
export async function saveCard(draft: CardDraft): Promise<string> {
    const body = await request<OkId>('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
    });
    return body.id;
}

/** DELETE /api/cards/:id — remove a card; resolves to the removed id. */
export async function deleteCard(id: string): Promise<string> {
    const body = await request<OkId>(`/api/cards/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
    return body.id;
}
