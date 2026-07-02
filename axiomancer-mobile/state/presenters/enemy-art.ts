/**
 * Enemy → illustration archetype resolver (visual-audit 2026-06).
 *
 * The engine roster has 40+ foes; rather than author 40 one-off
 * drawings, each enemy maps onto one of a handful of recognisable
 * creature archetypes (a rat ≠ a crab ≠ a wraith ≠ a saint), with named
 * bosses getting the crowned / eldritch treatments. The map is
 * mobile-local (Spec 08 Q3 = B — slug→asset routing lives in the app).
 *
 * Pure + dependency-free so it's trivially unit-testable. The matcher
 * is keyword-based over the enemy id, with an explicit override map for
 * "hero" enemies whose name doesn't obviously imply their shape.
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
    'salt-gnaw-rat': 'vermin',
    'coastal-tyrant': 'tyrant',
    'the-disagreement': 'eldritch',
    'the-unwriting': 'eldritch',
    'the-nothing-that-remains': 'eldritch',
    'the-forest-mind': 'flora',
    'hollow-saint': 'zealot',
    'mournful-gull': 'avian',
    'argumentative-crow': 'avian',
    'lullaby-moth': 'avian',
    'wet-hound': 'beast',
    'tidepool-crab': 'crustacean',
    'sea-mist-wisp': 'spirit',
    'hush-wraith': 'spirit',
    'forest-sprite': 'flora',
    'disatree': 'flora',
};

/** Ordered keyword rules; first match wins. */
const RULES: ReadonlyArray<readonly [RegExp, EnemyArchetype]> = [
    [/crab|barnacle|reaver|tidefluke|tidepool|reef/, 'crustacean'],
    [/gull|crow|moth|raven|magpie|bird/, 'avian'],
    [/hound|wolf|prowler|stag|hunter|packleader|rimeclaw|fang/, 'beast'],
    [/oak|sprite|sentinel|thicket|disatree|stripling|verdant|protector|forest|woodland|thorn|bog|root|bramble/, 'flora'],
    [/rat|vermin|cutpurse|rodent|gnaw/, 'vermin'],
    [/wisp|wraith|shade|mist|mire|revenant|hush|husk|pale|phantom|spectre|echo-of-mirrors/, 'spirit'],
    [/disagreement|unwriting|nothing|void|faceless|theorem|cathedral|doubt|consensus|oracle|glassmind|pyrrhonia|hour|harvest-of-names|mirror|paradox/, 'eldritch'],
    [/tyrant|sovereign|crown|\bking\b|throne|last-hearth/, 'tyrant'],
    [/beggar|heretic|saint|abbot|sophist|penitent|monk|cleric|apostate|covenanter|tithe|arbiter|judge|warden|audit|balance|market|toll|warrant|flagellant|hermit/, 'zealot'],
];

/**
 * Resolve an enemy id to a drawing archetype. `isBoss` only affects the
 * fallback when no keyword matches (bosses default to the crowned tyrant,
 * regular foes to the generic creature).
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
