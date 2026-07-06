/**
 * Enemy → illustration archetype resolver (2026-07-06 art-driven roster).
 *
 * Every roster enemy now has a 1:1 painting (see `assets/images/enemies`),
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
    'king-of-revenge':  'tyrant',
    'the-abortive':     'eldritch',
    'the-unnameable':   'eldritch',
    'the-incompleteness': 'eldritch',
    'doom-egg':         'eldritch',
    'float-eye':        'eldritch',
    'sugata':           'spirit',
    'kudan':            'beast',
    'bull-begger':      'beast',
    'sidelle':          'beast',
    'mabadi':           'zealot',
    'mabadi-undrowned': 'zealot',
    'mirac':            'zealot',
    'ra-amin-ka':       'zealot',
    'rangda':           'zealot',
    'the-butcher':      'zealot',
};

/** Ordered keyword rules; first match wins. */
const RULES: ReadonlyArray<readonly [RegExp, EnemyArchetype]> = [
    [/larva|brood|stealer|rat|vermin|gnaw|rodent/, 'vermin'],
    [/crab|barnacle|reef|tidepool/, 'crustacean'],
    [/rawhead|drake|naga|hound|wolf|stag|prowler|fang|beast/, 'beast'],
    [/gull|crow|moth|raven|magpie|bird/, 'avian'],
    [/tree|jeweled|oak|sprite|thorn|bramble|verdant|root|forest/, 'flora'],
    [/belle|ghast|head|skull|holger|ferryman|hasshaku|wichtlein|death|wisp|wraith|shade|phantom|spectre|spirit/, 'spirit'],
    [/spinner|totem|zoma|tezcatlipoca|beelzebub|tri-eyes|frayed|void|mirror|unwriting|nothing|faceless|eldritch/, 'eldritch'],
    [/\bking\b|revenge|tyrant|demon|devil|giant|crown|throne|sovereign/, 'tyrant'],
    [/hag|butcher|paladin|thrall|wizard|shaman|gabriella|saint|monk|cleric|heretic|zealot|penitent|hermit/, 'zealot'],
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
