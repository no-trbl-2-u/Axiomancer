/**
 * Mobile-local slug -> illustration mapping for the event modal.
 *
 * Spec 08 Q3 = B: mobile owns the slug-to-asset map. The engine
 * returns a `ResolvedEvent` with a discriminant (8 kinds + 'none');
 * the screen renders an SVG illustration component keyed on a stable
 * slug. If the engine later adds an `art: string` field on
 * `ResolvedEvent`, this mapper is the single switch-point to swap
 * from discriminant-derived to engine-supplied slugs.
 *
 * Default body text falls back here when a `ResolvedEvent` payload's
 * `description` is absent (each `MapEventPayload` in the engine
 * carries an optional `description: string`).
 */

import type { ResolvedEvent } from '@mechanics';

// Phase 137 cleanup: rest / gathering / loot-cache / hazard slugs were
// removed — those kinds never reach the event modal anymore (their
// resolve interceptors start minigame sessions instead, except
// gathering, which grants its items inline since Phase 76), so only
// the kinds the modal can actually render keep an art slug.
export const EVENT_ART_SLUGS = [
    'encounter',
    'boss',
    'interaction-generic',
    'village',
    'cutscene',
] as const;

export type EventArtSlug = (typeof EVENT_ART_SLUGS)[number];

/**
 * Pure mapper from a `ResolvedEvent` discriminant to the mobile slug
 * the screen renders an illustration for. `'none'` should never reach
 * this mapper — callers guard via `selectHasActiveEvent`; the fallback
 * returns `'interaction-generic'`.
 */
export function selectEventArtSlug(event: ResolvedEvent): EventArtSlug {
    switch (event.kind) {
        case 'encounter':
            return event.isBoss ? 'boss' : 'encounter';
        case 'interaction':
            return 'interaction-generic';
        case 'village':
            return 'village';
        case 'cutscene':
            return 'cutscene';
        // Phase 137 cleanup: rest / gathering / loot-cache / hazard
        // never reach the event modal — their interceptors start
        // minigame sessions instead (gathering grants its items inline
        // since Phase 76). Generic fallback kept defensively.
        case 'rest':
        case 'gathering':
        case 'loot-cache':
        case 'hazard':
        case 'narration':
        // Spec 33 §6 / Phase D5 — 'blacksmith' is a dead-end kind here: its
        // interceptor starts "The Anvil" die-gear session (D6 owns that
        // screen). Never reaches the event modal; generic fallback kept
        // defensively, mirroring the other minigame kinds.
        case 'blacksmith':
        case 'none':
            return 'interaction-generic';
    }
}

/**
 * Kind-keyed default body text. Used when a `ResolvedEvent`'s payload
 * `description` is absent or empty. Kept short — the screen pairs it
 * with the kind-specific title/badge from the presenter.
 */
const DEFAULT_BODY_BY_KIND: Record<ResolvedEvent['kind'], string> = {
    encounter: 'Something stirs.',
    interaction: 'A figure waits.',
    gathering: 'Useful things, here.',
    rest: 'A quiet place.',
    village: 'Roofs and smoke.',
    cutscene: '',
    hazard: 'The air turns.',
    'loot-cache': 'Forgotten goods.',
    narration: 'A voice speaks, unbidden.',
    // Spec 33 §6 / Phase D5 — 'blacksmith' launches "The Anvil" die-gear
    // session via its interceptor (D6 owns the screen); never renders in the
    // modal, but the exhaustive record needs the entry.
    blacksmith: 'An anvil, and a waiting hammer.',
    none: '',
};

export function defaultBodyForEvent(event: ResolvedEvent): string {
    return DEFAULT_BODY_BY_KIND[event.kind] ?? '';
}
