/**
 * Enemy art registry — 1:1 per-enemy portraits.
 *
 * Phase R2 (enemy reset) cut the roster to three survivors; their art is all
 * that remains here: two alpha-matted paintings from the 2026-07-06 drop
 * (black backgrounds keyed out so figures float over the arena backdrop) and
 * one licensed game-icons.net silhouette (The Doorwarden, 2026-09-05) — one
 * asset per enemy either way (the 1:1 art law). The registry key is the
 * enemy's `portraitAsset` (kebab-case, Spec 26 §3.1) — slug→asset routing
 * stays mobile-local per Spec 08 Q3 = B. See provenance.json.
 *
 * `getEncounterEnemyArt(artKey, nonce)` resolves the key directly; unknown /
 * missing keys fall back to a stable hash pick over the whole pool (so an
 * unauthored or synthetic enemy still gets a consistent painting for the
 * duration of its encounter).
 */

const ENEMY_ART_BY_KEY: Record<string, number> = {
    'float-eye':         require('./float-eye.webp'),
    'brine-hag':         require('./hag.webp'),
    // The Aporia — labyrinth act boss. Licensed game-icons.net silhouette
    // (CC BY 3.0 — Delapouite), white glyph on transparent, rasterized 512px
    // WebP; see provenance.json.
    'the-doorwarden':    require('./the-doorwarden.webp'),
};

const ENEMY_ART_POOL: number[] = Object.values(ENEMY_ART_BY_KEY);

/**
 * Resolve an enemy's painting. `artKey` should be the engine's
 * `portraitAsset`; a registered key returns its 1:1 painting. Unknown keys
 * fall back to an FNV-1a hash pick seeded by the encounter nonce —
 * deterministic within an encounter, different between encounters.
 */
export function getEncounterEnemyArt(artKey: string | null | undefined, nonce = 0): number {
    if (artKey && ENEMY_ART_BY_KEY[artKey] !== undefined) {
        return ENEMY_ART_BY_KEY[artKey];
    }
    const s = artKey || 'enemy';
    let h = (2166136261 ^ nonce) >>> 0;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return ENEMY_ART_POOL[h % ENEMY_ART_POOL.length];
}

/** True when the key resolves 1:1 (no hash fallback). */
export function hasEnemyArt(artKey: string | null | undefined): boolean {
    return !!artKey && ENEMY_ART_BY_KEY[artKey] !== undefined;
}

export const ENEMY_ART_COUNT = ENEMY_ART_POOL.length;
