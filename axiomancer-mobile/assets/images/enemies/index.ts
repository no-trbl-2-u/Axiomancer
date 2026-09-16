/**
 * Enemy art registry — 1:1 per-enemy portraits.
 *
 * 52 alpha-matted paintings (2026-07-06 roster: black backgrounds keyed out
 * so figures float over the arena backdrop) plus, from Phase W3 (2026-08-28),
 * licensed game-icons.net silhouettes for the northern-continent batch —
 * one asset per enemy either way (the 1:1 art law). The registry key is the
 * enemy's `portraitAsset` (kebab-case, Spec 26 §3.1) — slug→asset routing
 * stays mobile-local per Spec 08 Q3 = B.
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
    // Northern continent — Phase W3 batch (2026-08-28), re-sourced by
    // Phase 88 (2026-09-16) per the /oversight 2026-09-15 pick from Phase
    // 78's research. Licensed game-icons.net silhouettes (CC BY 3.0 — lorc
    // / delapouite), white glyph on transparent, rasterized 512px WebP,
    // except wharf-shrike (openclipart "Shrike", Public Domain, recolored —
    // Phase 78's top pick for it was verified mismatched, see Phase 88
    // brief); see provenance.json.
    'seam-tick':         require('./seam-tick.webp'),
    'prop-wight':        require('./prop-wight.webp'),
    'unpaid-delver':     require('./unpaid-delver.webp'),
    'sump-maren':        require('./sump-maren.webp'),
    'toll-sergeant':     require('./toll-sergeant.webp'),
    'guild-knife':       require('./guild-knife.webp'),
    'the-factor':        require('./the-factor.webp'),
    'wharf-shrike':      require('./wharf-shrike.webp'),
    'the-harbormaster':  require('./the-harbormaster.webp'),
    // Northern continent — Phase W4 batch (2026-08-31). Licensed
    // game-icons.net silhouettes (CC BY 3.0 — lorc / delapouite /
    // darkzaitzev), white glyph on transparent, rasterized 512px WebP;
    // see provenance.json.
    'reed-ambusher':     require('./reed-ambusher.webp'),
    'toll-skiff':        require('./toll-skiff.webp'),
    'weir-widow':        require('./weir-widow.webp'),
    'the-waterreeve':    require('./the-waterreeve.webp'),
    'dowry-collector':   require('./dowry-collector.webp'),
    'the-kept-suitor':   require('./the-kept-suitor.webp'),
    'the-portreeve':     require('./the-portreeve.webp'),
    // The Aporia — labyrinth act bosses (W-01, adjust-enemies pass 1,
    // 2026-09-05). Licensed game-icons.net silhouettes (CC BY 3.0 — Lorc /
    // Delapouite), white glyph on transparent, rasterized 512px WebP; see
    // provenance.json. Shipped without art at W-01 launch; backfilled here
    // (structural audit: three boss enemies rendering the fallback
    // silhouette is a roster-health finding, not just a nice-to-have).
    'the-doorwarden':    require('./the-doorwarden.webp'),
    'the-index':         require('./the-index.webp'),
    'the-sophist':       require('./the-sophist.webp'),
    // Caverns backfill (adjust-enemies pass 1, 2026-09-05) — the pool was
    // 71% forest re-treads (>70% sibling-overlap ceiling); two cavern-native
    // foes bring it back under. Licensed game-icons.net silhouettes (CC BY
    // 3.0 — Lorc), same recipe as the W3/W4 batches; see provenance.json.
    'ninth-rung-spider': require('./ninth-rung-spider.webp'),
    'spore-warden':      require('./spore-warden.webp'),
    // Connecting-river / town-across-river backfill (adjust-enemies pass 2,
    // 2026-09-07) — the roster's two thinnest EnemiesByMap pools (4 and 3
    // entries respectively, against 8-39 everywhere else); one native foe
    // added to each. Licensed game-icons.net silhouettes (CC BY 3.0 — Lorc),
    // same recipe as the prior batches; see provenance.json.
    'drift-anchor':      require('./drift-anchor.webp'),
    'the-adjuster':      require('./the-adjuster.webp'),
    // The Capital backfill (adjust-enemies pass 6, 2026-09-11) — the map
    // shipped at 83.3% pool overlap with northern-city (over the >70%
    // sibling-overlap ceiling); two capital-native foes bring it to 62.5%.
    // Licensed game-icons.net silhouettes (CC BY 3.0 — Delapouite / Lorc),
    // same recipe as the prior batches; see provenance.json.
    'the-stamper':       require('./the-stamper.webp'),
    'the-underclerk':    require('./the-underclerk.webp'),
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
