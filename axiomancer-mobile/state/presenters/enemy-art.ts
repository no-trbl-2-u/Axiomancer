/**
 * Enemy → illustration archetype resolver (2026-07-06 art-driven roster).
 *
 * Every roster enemy has a 1:1 painting (see `assets/images/enemies`),
 * so this resolver is the SILHOUETTE FALLBACK: it routes art keys onto a
 * handful of recognisable creature archetypes for surfaces that render the
 * procedural SVG figures (combat prelude, dev gallery) and for synthetic /
 * unauthored enemies with no painting.
 *
 * The matcher is keyword-based over the enemy id / portrait key, with an
 * explicit override map for names that don't imply their shape. Pure +
 * dependency-free so it's trivially unit-testable. Slug→asset routing is
 * mobile-local (Spec 08 Q3 = B).
 */

export type EnemyArchetype =
    | 'vermin'
    | 'crustacean'
    | 'spirit'
    | 'beast'
    | 'avian'
    | 'flora'
    | 'zealot'
    | 'eldritch'
    | 'tyrant'
    | 'generic';

/** Explicit overrides for enemies whose id keyword would mis-route. */
const OVERRIDES: Record<string, EnemyArchetype> = {
    'float-eye':        'eldritch',
};

/**
 * Ordered keyword rules; first match wins. Generic creature words only — the
 * per-name keywords went with the enemies they named (phase R2 roster reset).
 */
const RULES: ReadonlyArray<readonly [RegExp, EnemyArchetype]> = [
    [/rat|vermin|gnaw|rodent/, 'vermin'],
    [/crab|barnacle|reef|tidepool/, 'crustacean'],
    [/hound|wolf|stag|prowler|fang|beast/, 'beast'],
    [/gull|crow|moth|raven|magpie|bird/, 'avian'],
    [/tree|oak|sprite|thorn|bramble|verdant|root|forest/, 'flora'],
    [/head|skull|wisp|wraith|shade|phantom|spectre|spirit/, 'spirit'],
    [/void|mirror|unwriting|nothing|faceless|eldritch/, 'eldritch'],
    [/\bking\b|tyrant|demon|devil|giant|crown|throne|sovereign/, 'tyrant'],
    [/hag|saint|monk|cleric|heretic|zealot|penitent|hermit/, 'zealot'],
];

/**
 * Resolve an enemy id / portrait key to a drawing archetype. `isBoss` only
 * affects the fallback when no keyword matches (bosses default to the crowned
 * tyrant, regular foes to the generic creature).
 */
export function resolveEnemyArchetype(enemyId: string | null | undefined, isBoss = false): EnemyArchetype {
    if (!enemyId) return isBoss ? 'tyrant' : 'generic';
    const key = enemyId.replace(/^enemy-/, '').toLowerCase();
    if (key in OVERRIDES) return OVERRIDES[key];
    for (const [re, archetype] of RULES) {
        if (re.test(key)) return archetype;
    }
    return isBoss ? 'tyrant' : 'generic';
}
