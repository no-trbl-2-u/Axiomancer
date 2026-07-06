/**
 * Enemy art registry — 1:1 per-enemy paintings (2026-07-06 roster).
 *
 * 52 alpha-matted paintings (black backgrounds keyed out so figures float over
 * the arena backdrop), one per enemy in the engine's art-driven roster. The
 * registry key is the enemy's `portraitAsset` (kebab-case, Spec 26 §3.1) —
 * slug→asset routing stays mobile-local per Spec 08 Q3 = B.
 *
 * `getEncounterEnemyArt(artKey, nonce)` resolves the key directly; unknown /
 * missing keys fall back to a stable hash pick over the whole pool (so an
 * unauthored or synthetic enemy still gets a consistent painting for the
 * duration of its encounter).
 */

const ENEMY_ART_BY_KEY: Record<string, number> = {
    // Fishing village — early.
    'grave-larva':       require('./larva.webp'),
    'float-eye':         require('./float-eye.webp'),
    'chattering-skull':  require('./skull.webp'),
    'little-belle':      require('./little-belle.webp'),
    'foot-stealer':      require('./foot-stealer.webp'),
    'water-holger':      require('./water-holger.webp'),
    'cursed-head':       require('./cursed-head.webp'),
    'ghast':             require('./ghast.webp'),
    'doom-egg':          require('./doom-egg.webp'),
    'the-butcher':       require('./butcher.webp'),
    'brine-hag':         require('./hag.webp'),
    'the-ferryman':      require('./sendou-figure-a.webp'),
    'king-of-revenge':   require('./king-revenge.webp'),
    // Northern forest — early-mid.
    'wichtlein':         require('./wichtlein.webp'),
    'kudan':             require('./kudan.webp'),
    'bull-begger':       require('./bull-begger-re-a.webp'),
    'weeping-head':      require('./cursed-head2.webp'),
    'goblin-shaman':     require('./goblin-shaman-c.webp'),
    'sugata':            require('./sugata.webp'),
    'pale-brood':        require('./larva2.webp'),
    'tri-eyes':          require('./tri-eyes-a.webp'),
    'mabadi':            require('./mabadi.webp'),
    'frayed-one':        require('./frayed-one.webp'),
    'bone-totem':        require('./bone-totem-a.webp'),
    'bone-wizard':       require('./bone-wizard-b.webp'),
    'mirac':             require('./mirac.webp'),
    // Northern forest — mid.
    'cursed-paladin':    require('./paladin-cursed-a.webp'),
    'vampire-thrall':    require('./slave-vampire-servant.webp'),
    'hasshaku-sama':     require('./hasshaku-sama.webp'),
    'jeweled-tree':      require('./jeweled-tree-b.webp'),
    'ogre-naga':         require('./ogre-naga-e.webp'),
    'sidelle':           require('./sidelle.webp'),
    'rawhead-rex':       require('./raw-head-rex.webp'),
    'fate-spinner':      require('./fate-spinner.webp'),
    'ashen-bone-drake':  require('./ashen-bone-drake.webp'),
    'ra-amin-ka':        require('./ra-amin-ka-b.webp'),
    'lady-gabriella':    require('./vampire-lady-gabriella.webp'),
    'zoma':              require('./zoma-a.webp'),
    'mabadi-undrowned':  require('./mabadi2.webp'),
    // Northern forest — late.
    'tri-eyes-hollowed': require('./tri-eyes-b.webp'),
    'black-death':       require('./black-death.webp'),
    'the-unnameable':    require('./lovecraft-c.webp'),
    'fire-giant':        require('./fire-giant-a.webp'),
    'greater-devil':     require('./greater-devil-a.webp'),
    'rangda':            require('./rangda.webp'),
    'zoma-ascendant':    require('./zoma-d.webp'),
    'elder-fire-giant':  require('./fire-giant-2-d.webp'),
    'tezcatlipoca':      require('./tezcatlipoca2.webp'),
    'arch-demon':        require('./arch-demon3.webp'),
    'beelzebub':         require('./beelzebub.webp'),
    'death':             require('./death-f.webp'),
    'the-abortive':      require('./abortive.webp'),
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
