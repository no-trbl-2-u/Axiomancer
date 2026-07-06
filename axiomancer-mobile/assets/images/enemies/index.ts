/**
 * Enemy art pool — temp art pass (2026-07-06 drop).
 *
 * 52 alpha-matted paintings (black backgrounds keyed out so figures float over
 * the arena backdrop). Until a per-enemy library exists, each encounter draws
 * a RANDOM painting: the pick hashes the enemy id + the encounter seed, so it
 * is stable for the whole fight (and across the reveal → combat → summary
 * surfaces) but reshuffles from one encounter to the next.
 */

const ENEMY_ART: number[] = [
    require('./abortive.webp'),
    require('./arch-demon3.webp'),
    require('./ashen-bone-drake.webp'),
    require('./beelzebub.webp'),
    require('./black-death.webp'),
    require('./bone-totem-a.webp'),
    require('./bone-wizard-b.webp'),
    require('./bull-begger-re-a.webp'),
    require('./butcher.webp'),
    require('./cursed-head.webp'),
    require('./cursed-head2.webp'),
    require('./death-f.webp'),
    require('./doom-egg.webp'),
    require('./fate-spinner.webp'),
    require('./fire-giant-2-d.webp'),
    require('./fire-giant-a.webp'),
    require('./float-eye.webp'),
    require('./foot-stealer.webp'),
    require('./frayed-one.webp'),
    require('./ghast.webp'),
    require('./goblin-shaman-c.webp'),
    require('./greater-devil-a.webp'),
    require('./hag.webp'),
    require('./hasshaku-sama.webp'),
    require('./jeweled-tree-b.webp'),
    require('./king-revenge.webp'),
    require('./kudan.webp'),
    require('./larva.webp'),
    require('./larva2.webp'),
    require('./little-belle.webp'),
    require('./lovecraft-c.webp'),
    require('./mabadi.webp'),
    require('./mabadi2.webp'),
    require('./mirac.webp'),
    require('./ogre-naga-e.webp'),
    require('./paladin-cursed-a.webp'),
    require('./ra-amin-ka-b.webp'),
    require('./rangda.webp'),
    require('./raw-head-rex.webp'),
    require('./sendou-figure-a.webp'),
    require('./sidelle.webp'),
    require('./skull.webp'),
    require('./slave-vampire-servant.webp'),
    require('./sugata.webp'),
    require('./tezcatlipoca2.webp'),
    require('./tri-eyes-a.webp'),
    require('./tri-eyes-b.webp'),
    require('./vampire-lady-gabriella.webp'),
    require('./water-holger.webp'),
    require('./wichtlein.webp'),
    require('./zoma-a.webp'),
    require('./zoma-d.webp'),
];

/** FNV-1a over the art key, seeded by the encounter nonce — deterministic
 *  within an encounter, different between encounters. */
export function getEncounterEnemyArt(artKey: string | null | undefined, nonce = 0): number {
    const s = artKey || 'enemy';
    let h = (2166136261 ^ nonce) >>> 0;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return ENEMY_ART[h % ENEMY_ART.length];
}

export const ENEMY_ART_COUNT = ENEMY_ART.length;
