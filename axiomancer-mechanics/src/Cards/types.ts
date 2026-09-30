/**
 * Cards System Types
 * Cards run on the resonance economy (heart / body / mind). The original
 * `specs/04-cards-engine.md` was removed in the skill→card unification (see
 * `specs/README.md`); the live design is spec 32 + THE BIG NUMBERS REWRITE.
 */

import type { CardTheme } from './card-themes';

/**
 * A stat colour (body / mind / heart). A card's `color` is one of these or
 * 'any' (see `CardAspect`); the dice and the colour-match bonus read it.
 * - 'body': Physical/strength-based cards
 * - 'mind': Mental/intelligence-based cards
 * - 'heart': Emotional/charisma-based cards
 */
export type StatType = 'body' | 'mind' | 'heart';

/**
 * Phase 104 — a CARD's colour identity. `StatType` plus `'any'`: the grey
 * office's colourless aspect, powered by every die colour (body/mind/heart,
 * AND wild) with a neutral (never on/off) colour-match bonus. `StatType`
 * itself stays three stats — only a card's aspect widens.
 */
export type CardAspect = StatType | 'any';

/**
 * Tier of a card — mirrors the effect tier system. Drives the resist tier
 * used when a card applies a `combatEffects` payload through the Spec 03
 * machinery (Tier 1 auto-applies, Tier 2 resisted, Tier 3 only nat-20 repels).
 */
export type CardTier = 1 | 2 | 3;

/**
 * Spec 32 v3 — the rank ladder (quality axis, distinct from `tier`):
 * 1 Ash · 2 Tooth · 3 Splinter · 4 Rib · 5 Skull · 6 Saint.
 */
export type CardRank = 1 | 2 | 3 | 4 | 5 | 6;

/** Display names for the rank ladder (printed on card faces). */
export const CARD_RANK_NAMES: Readonly<Record<CardRank, string>> = Object.freeze({
    1: 'Ash', 2: 'Tooth', 3: 'Splinter', 4: 'Rib', 5: 'Skull', 6: 'Saint',
});

/** Spec 32 v3 — rarity band, derived from rank (§4). Drives the deck recipe
 *  and reward drop weights. */
export type CardRarity = 'common' | 'uncommon' | 'rare';

/** Maps a rank to its rarity band: common = Ash/Tooth, uncommon =
 *  Splinter/Rib, rare = Skull/Saint. */
export function rankToRarity(rank: CardRank): CardRarity {
    return rank <= 2 ? 'common' : rank <= 4 ? 'uncommon' : 'rare';
}

/**
 * Spec 32 v3 — card type. Open enum (more types to come). Spec 34 R-9/R-10:
 * `enchantment`/`disenchant` renamed to `oath`/`hex` (display + literal).
 * - `spell` — play → discard; recycled by the reshuffle law.
 * - `oath`  — POSITIVE passive, player-side. Spec 32 v4: FREE line = a TIMED
 *             instance (3 rounds, dieless); PAID line = the same passive made
 *             permanent (rest of combat, unique, leaves the deck cycle).
 * - `hex`   — NEGATIVE passive attached to the ENEMY. Same FREE-timed / PAID-
 *             permanent split as `oath`.
 */
export type CardType = 'spell' | 'oath' | 'hex';

/**
 * Targeting scope for a card effect.
 * - `'self'`  — the caster.
 * - `'enemy'` — the current opponent.
 * Multi-combatant targeting is deferred to Spec 07.
 */
export type CardTarget = 'self' | 'enemy';

/**
 * Combat effect payload applied by a card. Routes through
 * `resolveEffectApplication` (Spec 03) so resist / repel / crit follow the
 * same rules as proc-applied effects.
 *
 * @property effectId    - ID of the effect in the global effects library.
 * @property appliedTo   - 'self' or 'opponent' (relative to the caster).
 * @property description - Display text for the CLI / UI.
 * @property intensity   - Optional initial intensity override (default 1).
 *                         Used by cards like Liar's Echo that stack a Tier 1
 *                         mark with extra intensity on first application.
 * @property duration    - Optional remaining-duration override (defaults to
 *                         the effect's library duration). Switches the apply
 *                         path into `additive` duration mode so the override
 *                         survives stacking.
 */
export interface CardCombatEffects {
    effectId: string;
    appliedTo: 'self' | 'opponent';
    description?: string;
    intensity?: number;
    duration?: number;
}

/**
 * A card's PAID-line mechanics — the verbs the combat engine resolves itself
 * rather than through a `combatEffects` payload. Kept as a discriminated
 * union so the resolver / UI can branch on `kind` without runtime tag
 * parsing. Only verbs a live card prints exist here (D50): the grey office
 * prints DEAL and GUARD.
 */
export type CardSpecialMechanic =
    /** GUARD — a shield that absorbs the enemy's next telegraphed threat.
     *  `amount` is the base Guard before stat and colour-match scaling. */
    | { kind: 'guard'; amount: number }
    /** DEAL — direct VITAE damage. `amount` is the magnitude before stat,
     *  colour-match and VULNERABLE scaling. */
    | { kind: 'deal'; amount: number };

/**
 * Every `CardSpecialMechanic` kind, at RUNTIME (phase 68).
 *
 * The union above is erased at compile time, so every consumer that needed to
 * enumerate the kinds kept its own copy — and they drifted. This array IS the
 * enumeration, and the two assertions below bind it to the union in BOTH
 * directions:
 *   - add a kind to the union without listing it here  -> compile error
 *   - list a kind here that the union does not have    -> compile error
 */
export const CARD_SPECIAL_MECHANIC_KINDS = [
    'guard',
    'deal',
] as const;

/** A kind in the union that this array forgot. Resolves to `never` when clean. */
type MissingFromKindList = Exclude<
    CardSpecialMechanic['kind'],
    (typeof CARD_SPECIAL_MECHANIC_KINDS)[number]
>;
/** A kind in this array that the union does not have. `never` when clean. */
type NotAKind = Exclude<
    (typeof CARD_SPECIAL_MECHANIC_KINDS)[number],
    CardSpecialMechanic['kind']
>;
/**
 * Both sides must resolve to `never`. `AssertNever` constrains its parameter to
 * `never`, so a leftover kind fails the constraint and names itself in the
 * error — unlike an empty-array annotation, which type-checks against ANY
 * element type and would assert nothing at all.
 */
type AssertNever<T extends never> = T;
type _KindListCoversUnion = AssertNever<MissingFromKindList>;
type _KindListHasNoStrays = AssertNever<NotAKind>;

/**
 * A card's FREE (dieless) line: a bundle of real-unit verbs. Every field is an
 * exact engine unit so generated action text is the applied number (P0-truth
 * law). All fields optional; absent = 0. Only verbs a live card prints exist
 * here (D50).
 */
export interface CardRider {
    /** Deal N direct VITAE damage. */
    damage?: number;
    /** +N Guard. */
    guard?: number;
    /** Apply an effect from the library (e.g. a FREE VULNERABLE). `to`
     *  defaults to 'opponent'. */
    applyEffect?: { effectId: string; intensity?: number; duration?: number; to?: 'self' | 'opponent' };
}

// ── CARD UPGRADES (2026-09-02) — the Slay the Spire axis ────────────────────
// One of the six progression axes: a card you own can be upgraded once, into
// `<id>+` / `<name>+`. The upgraded copy is a PATCH of the original, never a
// second hand-authored card, so a rework of the base card carries forward.
// Runtime lives in `src/Cards/card-upgrades.ts` (`upgradeCard`), which applies
// an authored {@link Card.upgrade} patch if present and otherwise falls back
// to the documented DEFAULT rule. Every field below is a NON-NEGATIVE ADDITIVE
// DELTA (a `+` never subtracts): the applier clamps negatives to 0.

/**
 * The numeric {@link CardRider} fields an upgrade may raise.
 */
export type UpgradableRiderField = 'damage' | 'guard';

/**
 * An additive patch over a {@link CardRider} — the FREE line, or the
 * `synergy` rider.
 */
export interface CardRiderUpgrade extends Partial<Record<UpgradableRiderField, number>> {
    /** Deltas on the rider's `applyEffect` payload. `intensity` is clamped to
     *  `MAX_EFFECT_INTENSITY` by the applier. */
    applyEffect?: { intensity?: number; duration?: number };
}

/** The numeric {@link CardSpecialMechanic} fields an upgrade may raise. */
export type UpgradableMechanicField = 'amount';

/** An additive patch over ONE entry of `Card.specialMechanics`. */
export interface CardMechanicUpgrade {
    /** Which mechanic to patch, by its `kind`. */
    kind: CardSpecialMechanic['kind'];
    /** Which occurrence of that kind (0-based). Omit to patch every one. */
    index?: number;
    /** Additive deltas on the mechanic's own numeric fields. */
    fields?: Partial<Record<UpgradableMechanicField, number>>;
}

/** An additive patch over the matching entries of `Card.combatEffects`. */
export interface CardEffectUpgrade {
    /** Only patch entries with this `effectId`. Omit to patch every entry. */
    effectId?: string;
    /** +N intensity (clamped to `MAX_EFFECT_INTENSITY`). */
    intensity?: number;
    /** +N turns of duration. */
    duration?: number;
}

/**
 * The authored upgrade PATCH for a card: the fields an upgraded copy
 * overrides. Present on a card, it wins over the default rule ENTIRELY (the
 * default is not layered underneath — an author who writes a patch owns the
 * whole upgrade). Data only; see `src/Cards/card-upgrades.ts`.
 */
export interface CardUpgrade {
    /** Display name of the upgraded copy. Default: `${name}+`. */
    name?: string;
    /** Replacement fiction. Default: the base card's `description`. */
    description?: string;
    /**
     * Replacement PAID sentence. Omit it and `upgradeCard` CLEARS
     * `paidSummary` whenever the patch changed a printed number, so the face
     * falls back to generated text rather than printing a stale one (the
     * P0-truth law — `src/Combat/e2e/paid-summary-honesty.engine.test.ts`).
     */
    paidSummary?: string;
    /** Replacement passive summary for an `oath` / `hex`. */
    persistentEffect?: string;
    /** Deltas on `specialMechanics`. */
    mechanics?: CardMechanicUpgrade[];
    /** Deltas on `combatEffects`. */
    effects?: CardEffectUpgrade[];
    /** Deltas on the FREE line. Applies even when the base card has no
     *  `free` rider (the deltas become the rider). */
    free?: CardRiderUpgrade;
    /** Deltas on the synergy rider. The state predicate itself is not
     *  patchable: relaxing a gate is a rework, not a `+`. */
    synergy?: CardRiderUpgrade;
}

/**
 * Phase 66 — synergy predicate. The matched ActiveEffect on `on`
 * satisfies the predicate when its `effectId` matches AND its
 * `intensity` >= `intensityMin` (if set) AND its `remainingDuration`
 * >= `durationMin` (if set).
 */
export interface SynergyPredicate {
    effectId: string;
    on: 'caster' | 'target';
    intensityMin?: number;
    durationMin?: number;
}

/**
 * WS4.2 (spec 32 §12 item 4) — a COMBAT-STATE synergy predicate: instead of
 * matching an ActiveEffect, it reads one of the ratified encounter ledgers at
 * play time. A closed union — extend it here (the existing synergy machinery
 * is the ONE conditional gate; do not grow a parallel one).
 *
 * Evaluation timing (all kinds): `playBottomAction` checks the predicate
 * against the INCOMING state — before this play increments
 * `spellsPlayedThisTurn`, before its own recoil posts to
 * `recoilPaidThisTurn`, and before the played card leaves `hand`. PAID face
 * only (the FREE line never evaluates conditions).
 *
 * - `enemy-dealt-no-damage-last-round` — true when `enemyDamageLastRound`
 *   (post-soak HP the enemy's threat landed between the player's turns) is 0:
 *   fully blocked, denied, or the enemy simply did not act. Vacuously true on
 *   the opening turn (no prior round exists) — deterministic and printable.
 *
 * WS5.2 (sequencing grammar, plan §WS5) — the turn-SHAPE conditions:
 * - `opening` — at most `maxPriorSpells` PAID spells have resolved this turn
 *   (0 = this is the turn's first spell; 1 = first or second). FREE plays
 *   never consume the opening (they don't increment the counter).
 * - `finale` — playing this card leaves at most `cardsLeftAtMost` cards in
 *   hand (the eval-time hand still CONTAINS this card, so the check is
 *   `hand.length - 1 <= cardsLeftAtMost`). "≤ 2 left behind" fires on the
 *   third PAID play of a standard 5-card, 3-die turn.
 * - `recoil-paid-this-turn` — a PRIOR play this turn paid a blood price
 *   (`recoilPaidThisTurn > 0`; this play's own recoil does not count — the
 *   Frenzy shape needs the cost already on the ledger).
 * - `enemy-drew-blood` — the enemy landed damage since the start of the
 *   player's previous turn (`enemyDamageThisTurn > 0` OR
 *   `enemyDamageLastRound > 0`). The enemy hits BETWEEN player turns, so at
 *   play time the live leg is the rollover; the this-turn leg is included so
 *   the predicate stays honest if mid-turn enemy damage ever exists.
 */
export type SynergyStatePredicate =
    | { kind: 'enemy-dealt-no-damage-last-round' }
    | { kind: 'opening'; maxPriorSpells: number }
    | { kind: 'finale'; cardsLeftAtMost: number }
    | { kind: 'recoil-paid-this-turn' }
    | { kind: 'enemy-drew-blood' }
    /** REQUIEM N (profane-canon rework) — true when the player's discard pile
     *  holds ≥ `n` cards at play time (the delirium/threshold read: the dead
     *  remember). Prices at the threshold ×0.5 condition discount. */
    | { kind: 'requiem'; n: number }
    /** FLOW N (THE BIG NUMBERS REWRITE, from Dawncaster's Flow) — true when at
     *  least `minPriorSpells` PAID spells have already resolved this turn. The
     *  mirror of `opening`: the reward for a turn that keeps going, where
     *  `opening` (`maxPriorSpells: 0`) is AMBUSH, the reward for leading with
     *  it. */
    | { kind: 'flow'; minPriorSpells: number }
    /** EVENTIDE (`/adjust-keywords` pass 11, drilling Dawncaster's Balance/
     *  Order "Chaos" family — AUDIT.md loop-call, DECIDED via /oversight
     *  2026-09-15) — true when the player's draw pile holds an EVEN number of
     *  cards at play time. A genuinely different axis from every other
     *  turn-shape predicate: those gate on position-in-turn or hand/discard
     *  SIZE; this gates on a PARITY property of the deck the player is
     *  already playing, unrelated to when in the turn the card lands. One
     *  drilled keyword rather than Dawncaster's two (Balance/Order) — an
     *  even-only check covers the design niche without minting a near-
     *  synonym pair. */
    | { kind: 'eventide' };

/**
 * Synergy clause on a `Card`. Every library synergy is a combat-state
 * gate: `statePredicate` is read by `playCombatCard` and, when it holds,
 * `rider` fires FREE.
 *
 * The Phase 66 effect-matching payload (bonus damage, damage multipliers,
 * consume / clear-all / apply-on-fire side effects) and the `executeCard`
 * branch that evaluated it were deleted in TRIM THE FAT T2a: no library card
 * carried them. `predicate` survives because the Phase 169 preview helper
 * `isCombatSynergySatisfied` still reads it.
 */
export interface CardSynergy {
    /** Optional predicate. If absent, the synergy fires unconditionally
     *  when the card is cast (used by Resonance Detonation per D6). */
    predicate?: SynergyPredicate;
    /**
     * WS4.2 — a combat-STATE predicate (encounter-ledger read; see
     * {@link SynergyStatePredicate}). Hazard-Pattern-combat-owned: the legacy
     * card engine no-ops a synergy clause that carries one (mirroring how it
     * no-ops `specialMechanics`). Evaluated by `playCombatCard` at play time;
     * when it holds, {@link CardSynergy.rider} fires FREE. Prices at the
     * `threshold` ×0.5 condition discount (`CONDITION_DISCOUNTS`).
     */
    statePredicate?: SynergyStatePredicate;
    /**
     * WS4.2 — the rider fired (free, real units) when `statePredicate` holds.
     * Post-v3 vocabulary: state-gated synergies speak `CardRider`.
     */
    rider?: CardRider;
}

/**
 * Card entity — an ability that can be learned/unlocked and used in combat.
 *
 * @property id              - Unique identifier for this card.
 * @property name            - Display name.
 * @property description     - Flavor text or lore.
 * @property color           - The card's colour (heart/body/mind),
 *                              or 'any' for the grey office's colourless cards.
 * @property tier            - 1 / 2 / 3, mirrors the effect tier system.
 * @property targetType      - 'self' or 'enemy'.
 * @property combatEffects   - Optional list of effect payloads to apply.
 * @property specialMechanics - Optional bespoke behaviours. Resolved after
 *                              `combatEffects`. (`basePower` was deleted from
 *                              the schema by spec 32 v3; direct damage returned
 *                              2026-09-02 as the `deal` mechanic.)
 */
export interface Card {
    id: string;
    name: string;
    color: CardAspect;
    description: string;
    tier: CardTier;
    targetType: CardTarget;
    /**
     * Spec 32 v3 — the RANK ladder (quality axis): 1 Ash · 2 Tooth · 3 Splinter
     * · 4 Rib · 5 Skull · 6 Saint. Rarity derives from it (§4):
     * common = 1-2, uncommon = 3-4, rare = 5-6. Orthogonal to `tier` (resist).
     */
    rank: CardRank;
    /**
     * Spec 32 v3 — card type. `spell` plays → discard (FREE + PAID lines).
     * Spec 32 v4 — `oath` / `hex` now carry BOTH lines: the FREE
     * (dieless) line grants a TIMED instance of the passive (3 rounds); the PAID
     * line makes the same passive permanent (rest of combat), unique-in-play, and
     * leaves the deck cycle. The oath sits player-side; the hex
     * attaches to the ENEMY as a standing curse.
     */
    cardType: CardType;
    /**
     * Spec 32 — the card's THEME (one of eight). A theme is a family of keywords
     * ({@link CardTheme} / `THEME_KEYWORDS`): the two hallmark keywords plus the utility
     * keywords it synergises with. Drives the catalog's theme/keyword search.
     * Every library card declares one; optional only so throwaway test fixtures
     * need not (the curated-library suite asserts real cards carry it).
     */
    theme?: CardTheme;
    /**
     * Spec 32 v3 — the authored FREE (dieless) line for SPELLS. Budget law:
     * FREE ≈ 25-35% of the card's total points.
     * Spec 32 v4 — oath/hex carry NO authored `free` rider: their FREE
     * line is engine-derived (a timed instance of the same hooked passive), so this
     * field stays undefined for them.
     */
    free?: CardRider;
    /**
     * Spec 32 v4 — a one-line mechanical summary of an oath/hex's
     * HOOKED passive (the effect lives in the engine, not in `combatEffects`, so
     * it is otherwise invisible to the catalog and the card UI). Rendered on both
     * lines: FREE grants it for a few rounds (timed), PAID makes it permanent —
     * same effect, only the duration differs. Required for oath/hex;
     * ignored for spells.
     */
    persistentEffect?: string;
    /**
     * 2026-07-16 (SIDE RAIL follow-up) — the authored, human-readable PAID
     * sentence for SPELLS. The face's paid line got room to breathe under the
     * #5 rail design, so a card may print prose ("Apply POISON 2 for 3 turns,
     * then PROLONG every DoT by 1.") instead of the generated telegraphese.
     * The P0-truth law still holds: every number the engine applies must
     * appear verbatim in this text, and every UPPERCASE token must be a real
     * keyword — both enforced by `paid-summary-honesty.engine.test.ts`.
     * Absent → the projection falls back to the generated `paidText`.
     * Ignored for oath/hex (their authored line is
     * `persistentEffect`).
     */
    paidSummary?: string;
    combatEffects?: CardCombatEffects[];
    specialMechanics?: CardSpecialMechanic[];
    /** Synergy clause — a combat-state gate plus the rider it fires. See {@link CardSynergy}. */
    synergy?: CardSynergy;
    /**
     * Phase 91 — Optional friendship counter increment. When present, executeCard
     * increments the combat friendship counter by this amount after damage/effects
     * but before resource costs. Does not require defend stance.
     */
    incrementsFriendship?: number;
    /**
     * Content-provenance metadata (originally consumed by the since-retired
     * tuning `--focus` filter). `addedIn` is an ISO date / phase tag;
     * `tags` are freeform labels (e.g. `'mid-game'`, `'damage'`). Both
     * optional and ignored by the card engine.
     */
    addedIn?: string;
    tags?: string[];
    /**
     * CARD UPGRADES (2026-09-02) — the authored patch used when this card is
     * upgraded to `<id>+`. Optional by design: a card WITHOUT one still
     * upgrades, through the documented default rule in
     * `src/Cards/card-upgrades.ts`. Author one only when the default reads
     * badly on this card (a cost-shaped number, a payoff that wants a second
     * hit rather than a bigger one, a face whose prose must be rewritten).
     * Data only — the card engine ignores it; `upgradeCard` reads it.
     */
    upgrade?: CardUpgrade;
}
