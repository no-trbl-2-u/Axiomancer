/**
 * ENEMY KEYWORDS — THE BIG NUMBERS REWRITE (2026-09-02)
 *
 * Before this rewrite an enemy was a stat block plus a threat sequence: the
 * only thing that distinguished the Brine Hag from the Seam Tick was how big
 * the number in the telegraph was. Enemy keywords are the Mage Knight answer
 * (Fortified / Swift / Brutal / Elusive change the *arithmetic* of a fight,
 * not its size), and they are the reason a 40-point single hit reads
 * differently from four 10-point hits.
 *
 * Each keyword is a discriminated member so the engine branches on `kind`
 * without runtime tag parsing, mirroring `CardSpecialMechanic`. Numbers live
 * on the instance, not the keyword, so one foe can carry HIDE 3 and another
 * HIDE 12.
 *
 * Where each one is applied:
 *   - `hide` / `elusive`      → `applyEnemyDamage` (the damage floor)
 *   - `swift` / `brutal`      → `resolveThreatPhase` (the soak maths)
 *   - `venom` / `wounding`    → `resolveThreatPhase` (post-damage riders)
 *   - `ravenous`              → `resolveThreatPhase` (lifesteal on landing)
 *   - `unshaken`              → `computeRungDenial` (stagger immunity)
 *   - `regrow`                → `processBetweenPhases` (phase-boundary heal)
 *   - `flurry`                → `resolveThreatPhase` (splits the telegraphed
 *                                hit into N damage instances)
 */

/** A keyword carried by an enemy, with its printed magnitude. */
export type EnemyKeyword =
    /** HIDE N — every hit against this foe is reduced by N, to a floor of 1
     *  (Mage Knight's armour floor: a hit always scratches). PIERCE ignores it
     *  entirely. This is the knob that makes one big hit beat many small ones. */
    | { kind: 'hide'; n: number }
    /** SWIFT — GUARD and BARRIER count for HALF against this foe's threats.
     *  The wall still helps; it stops being the whole answer. */
    | { kind: 'swift' }
    /** BRUTAL — whatever this foe's threat gets past your soak is DOUBLED.
     *  Block it fully or take it twice: the Mage Knight cliff. */
    | { kind: 'brutal' }
    /** VENOM N — any VITAE this foe's threat lands also applies POISON N. */
    | { kind: 'venom'; n: number }
    /** UNSHAKEN — rungs cannot be denied: STAGGER and BACKFIRE do nothing to
     *  its telegraph. Reserved for things that were never going to flinch. */
    | { kind: 'unshaken' }
    /** ELUSIVE — this foe's HIDE counts DOUBLE until you land a rung of
     *  STAGGER on it this round. The control answer to the armour answer. */
    | { kind: 'elusive' }
    /** REGROW N — heals N VITAE at the end of each of its phases. A damage
     *  race with a printed floor: out-pace it or find another win. */
    | { kind: 'regrow'; n: number }
    /** RAVENOUS — heals for the VITAE its threats actually land on you. */
    | { kind: 'ravenous' }
    /** WOUNDING N — any single unguarded hit of N or more shoves a WOUND card
     *  into your deck (Mage Knight's wounds; Dawncaster's Corruption). */
    | { kind: 'wounding'; n: number }
    /** FLURRY N — the telegraphed hit lands as N separate strikes instead of
     *  one, same total budget (StS-BG's Buffer, kb:slay-the-spire-the-board-game
     *  /rules/edge-cases-faq src-002 — "triggers separately per hit of a
     *  multi-attack"). Each strike is its own damage instance: RIPOSTE's
     *  one-shot parry only blunts the first, and any VENOM/RAVENOUS/WOUNDING
     *  this foe also carries fires once per landed strike, not once per
     *  phase. GUARD/BARRIER are additive pools and drain the same total
     *  either way — FLURRY changes the fight's texture, not its size. */
    | { kind: 'flurry'; n: number };

/** Every `EnemyKeyword` kind, at runtime — bound to the union below. */
export const ENEMY_KEYWORD_KINDS = [
    'hide',
    'swift',
    'brutal',
    'venom',
    'unshaken',
    'elusive',
    'regrow',
    'ravenous',
    'wounding',
    'flurry',
] as const;

type MissingFromEnemyKindList = Exclude<
    EnemyKeyword['kind'],
    (typeof ENEMY_KEYWORD_KINDS)[number]
>;
type NotAnEnemyKind = Exclude<
    (typeof ENEMY_KEYWORD_KINDS)[number],
    EnemyKeyword['kind']
>;
type AssertNever<T extends never> = T;
type _EnemyKindListCoversUnion = AssertNever<MissingFromEnemyKindList>;
type _EnemyKindListHasNoStrays = AssertNever<NotAnEnemyKind>;

/** The display token printed on the enemy pane for each keyword. */
export const ENEMY_KEYWORD_LABEL: Readonly<Record<EnemyKeyword['kind'], string>> = Object.freeze({
    hide: 'HIDE',
    swift: 'SWIFT',
    brutal: 'BRUTAL',
    venom: 'VENOM',
    unshaken: 'UNSHAKEN',
    elusive: 'ELUSIVE',
    regrow: 'REGROW',
    ravenous: 'RAVENOUS',
    wounding: 'WOUNDING',
    flurry: 'FLURRY',
});

/**
 * Reminder text, MTG-style: printed with the keyword the first time a player
 * meets it. Every number the engine applies is substituted in by
 * {@link enemyKeywordText}, so these carry an `{n}` slot rather than a figure.
 */
export const ENEMY_KEYWORD_GLOSS: Readonly<Record<EnemyKeyword['kind'], string>> = Object.freeze({
    hide: 'Every hit against this foe is reduced by {n}, never below 1. PIERCE ignores it.',
    swift: 'Your GUARD and BARRIER count for half against this foe.',
    brutal: 'Damage this foe gets past your defenses is doubled.',
    venom: 'Damage this foe lands also poisons you for {n}.',
    unshaken: 'This foe cannot be staggered. Its rungs never fall.',
    elusive: "This foe's HIDE counts double until you stagger it this round.",
    regrow: 'This foe heals {n} at the end of each of its phases.',
    ravenous: 'This foe heals for the damage it lands on you.',
    wounding: 'An unguarded hit of {n} or more puts a WOUND in your deck.',
    flurry: "This foe's hit lands as {n} separate strikes instead of one — RIPOSTE only blunts the first.",
});

/** Renders a keyword as the face string a player reads: `HIDE 6`, `BRUTAL`. */
export function enemyKeywordText(keyword: EnemyKeyword): string {
    const label = ENEMY_KEYWORD_LABEL[keyword.kind];
    return 'n' in keyword ? `${label} ${keyword.n}` : label;
}

/** Renders a keyword's reminder text with its own number substituted in. */
export function enemyKeywordGloss(keyword: EnemyKeyword): string {
    const gloss = ENEMY_KEYWORD_GLOSS[keyword.kind];
    return 'n' in keyword ? gloss.replace('{n}', String(keyword.n)) : gloss;
}

/** Finds a keyword instance on a list by kind (the engine's read path). */
export function findEnemyKeyword<K extends EnemyKeyword['kind']>(
    keywords: readonly EnemyKeyword[] | undefined,
    kind: K,
): Extract<EnemyKeyword, { kind: K }> | undefined {
    return keywords?.find((k): k is Extract<EnemyKeyword, { kind: K }> => k.kind === kind);
}

/** True when the enemy carries the (valueless) keyword. */
export function hasEnemyKeyword(
    keywords: readonly EnemyKeyword[] | undefined,
    kind: EnemyKeyword['kind'],
): boolean {
    return Boolean(keywords?.some((k) => k.kind === kind));
}

/**
 * A boss/unique STAGE — the moment a fight becomes a different fight.
 *
 * Modelled on Cthulhu: Death May Die's Elder One progression and Aeon's End's
 * tiered nemesis escalation: the foe crosses a printed threshold and changes
 * shape, loudly. The first stage whose `at` is satisfied fires; each stage
 * fires at most once per combat, checked at phase boundaries.
 */
export interface EnemyStage {
    /** Trigger. `vitaePct` is the fraction of max VITAE at or below which it
     *  fires (0.6 = "at 60% or lower"); `round` fires on that round or later.
     *  Both may be set — whichever is satisfied first wins. */
    at: { vitaePct?: number; round?: number };
    /** The stage's name, shouted into the log: `THE COURT ADJOURNS`. */
    name: string;
    /** One telegraphed line printed in the log and on the enemy pane. */
    text: string;
    /** Keywords the foe gains on entering this stage. */
    gain?: EnemyKeyword[];
    /** Strip every affliction the player has landed on it. */
    cleanse?: boolean;
    /** Heal a flat amount, or a fraction of max VITAE. */
    heal?: number | { pct: number };
    /** Added to every subsequent phase's damage weight. */
    threatBonus?: number;
    /** A curse card shoved into the player's deck on entry. */
    curseCardId?: string;
}
