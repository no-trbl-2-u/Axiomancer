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
//
// 2026-09-21 (owner finding 2): `gathering` reaches the modal again as an
// acknowledgement card (`event.engine.ts::composeGathering`), but it
// deliberately keeps borrowing `'interaction-generic'` rather than
// reclaiming a bespoke slug. A new `EventArtSlug` member is an exhaustive
// `Record` in `components/event/PlaceholderIllustration.tsx` plus its test
// plus a drawing; that is an art errand, not this fix. Filed as a
// follow-up — the card reads correctly meanwhile.
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
        // 2026-09-21 — `gathering` DOES reach the modal now (owner finding
        // 2); it borrows the generic figure until it earns a drawing of its
        // own. Every other kind below still never reaches the modal — their
        // interceptors start minigame sessions instead — and keeps the
        // generic fallback defensively.
        case 'gathering':
        case 'rest':
        case 'loot-cache':
        case 'hazard':
        case 'narration':
        // Spec 33 §6 / Phase D5 — 'blacksmith' is a dead-end kind here: its
        // interceptor starts "The Anvil" die-gear session (D6 owns that
        // screen). Never reaches the event modal; generic fallback kept
        // defensively, mirroring the other minigame kinds.
        case 'blacksmith':
        // 2026-08-28 — 'travel' resolves engine-side (the world has already
        // crossed); the travel-UI wave owns its presentation.
        case 'travel':
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
    // 2026-08-28 — travel doors resolve engine-side; the travel-UI wave
    // owns the real presentation. Exhaustive record needs the entry.
    travel: 'The road goes on. So do you.',
    none: '',
};

export function defaultBodyForEvent(event: ResolvedEvent): string {
    return DEFAULT_BODY_BY_KIND[event.kind] ?? '';
}
