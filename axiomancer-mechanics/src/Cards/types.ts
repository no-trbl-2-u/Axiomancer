/**
 * Cards System Types
 * Cards run on the resonance economy (heart / body / mind). See
 * `specs/04-cards-engine.md` for the full economy design.
 */

import type { CardTheme } from './card-themes';
import type { GlyphPayload } from '../Combat/combat.encounter.types';

/**
 * Philosophical aspect alignment for cards
 * Determines which base stat the card scales with and which combat type it uses.
 * - 'body': Physical/strength-based cards
 * - 'mind': Mental/intelligence-based cards
 * - 'heart': Emotional/charisma-based cards
 */
export type StatType = 'body' | 'mind' | 'heart';

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
 * Bespoke card mechanics that don't map cleanly onto an ActiveEffect
 * payload. Each is processed by `executeCard` after `combatEffects`
 * (spec 32 v3: there is no damage step — the strike is dead). Kept as a
 * discriminated union so the resolver / UI can branch on `kind` without
 * runtime tag parsing.
 *
 * - `strip_random_buff`: remove one random buff from the target.
 * - `befriend_attempt`: Phase 108 - attempt to befriend the enemy, opening
 *   a mercy choice state if successful (requires HP gate eligibility).
 */
export type CardSpecialMechanic =
    | { kind: 'strip_random_buff'; appliedTo: 'self' | 'enemy' }
    | { kind: 'befriend_attempt' }
    /** Hazard-Pattern Combat — grants the player GUARD (a shield that absorbs the
     *  enemy's next telegraphed threat). Handled by the combat engine, not the
     *  card engine. `amount` is the base Guard before read/free scaling. */
    | { kind: 'guard'; amount: number }
    /** RUPTURE — consume ALL afflictions on the foe and detonate: 1.5× the
     *  remaining DoT fuel + a flat amount per non-DoT affliction stack (read +
     *  vulnerable scaled, capped at `ruptureBurstCap()` — a pure fraction of
     *  the enemy's max HP). `bonusPct` is an extra
     *  flat fraction; `fuelPerPip` adds fuel per pip spent by a paired
     *  `spend_all_pips`; `fuelPerOmenHit` adds fuel per omen hit this combat
     *  (Oracle capstone). HP behavior owned by the combat engine (mirrors
     *  `guard`); the card engine no-ops it. */
    | { kind: 'rupture'; bonusPct?: number; fuelPerPip?: number; fuelPerOmenHit?: number }
    /** SIPHON — heal the player for `pct` of the HP this card erodes from the
     *  foe (rupture/reap bursts). Combat-engine owned. */
    | { kind: 'siphon'; pct: number }
    /** BARRIER — add `amount` (read-scaled) to the player's STACKING, persistent
     *  damage soak (`CombatEncounterState.barrier`), distinct from one-shot GUARD.
     *  Combat-engine owned. */
    | { kind: 'barrier'; amount: number }
    /** RIPOSTE — arm the counter-stance: while armed this phase, an attack your
     *  Guard/Barrier FULLY blocks is answered for `damage` HP (reflect-class,
     *  spec 32 v3 §1 source 4). `reduce` shaves the incoming hit first (the
     *  parry half). Combat-engine owned. */
    | { kind: 'riposte'; damage: number; reduce: number }
    // ── Fate Engine P1 (spec 31 §4.1) — die-manipulation verbs, all combat-engine
    //    owned (the card engine no-ops them, mirroring guard/rupture). ──────────
    /** REROLL_SPENT — re-roll every spent/blocked die in the tray (the library
     *  sibling of the Press Fate signature). Floating dice are exempt. */
    | { kind: 'reroll_spent' }
    /** REFRESH_DIE — the powering die returns to `available` after this play
     *  (independent of the variety-chain rule). */
    | { kind: 'refresh_die' }
    /** CONVERT_DIE_COLOR — the powering die returns REFRESHED as a WILD die. */
    | { kind: 'convert_die_color' }
    /** KINDLE (spec 32 v3) — forge a fresh TEMPORARY die of `color` (this combat
     *  only). It joins the RESERVE at 0 pips when a slot is free; otherwise it
     *  burns for +1 Conviction. */
    | { kind: 'create_temporary_die'; color: 'heart' | 'body' | 'mind' | 'wild' }
    /** PIP — every die currently in the Reserve ripens +`count` pips.
     *  WS4.1 (`overflow`): each granted pip that finds NO room — the Reserve is
     *  empty, or every Reserve die sits at `RESERVE_PIP_CAP` — fires the
     *  printed overflow rider once instead of vanishing (Slag Runoff: the slag
     *  that misses the mold becomes a Kindling Ember on the foe). */
    | { kind: 'grant_pip'; count: number; overflow?: CardRider }
    /** OVERHEAT (phase 32 part 4c) — the press-your-luck knob: push `pips`
     *  pips onto the Reserve, allowing dice already AT `RESERVE_PIP_CAP` to
     *  go further (up to `OVERHEAT_PIP_CEILING`) instead of wasting the pip.
     *  Each pip pushed past the safe cap risks `OVERHEAT_BUST_CHANCE` of
     *  busting — the targeted die's pips are halved (floored), not zeroed
     *  (a partial setback, not a wipeout). A die still below the cap ripens
     *  for free, no risk. Combat-engine owned (`combat.dice.ts`
     *  `overheatReserve`). */
    | { kind: 'overheat'; pips: number }
    /** BANK_SPENT_DIE — instead of being spent, the powering die goes to the
     *  Reserve at 0 pips (if a slot is free; otherwise it is spent normally). */
    | { kind: 'bank_spent_die' }
    // ── Spec 32 v3 — the themed-deck verb set (all combat-engine owned) ────────
    /** FORGE — create a GHOST die: joins the tray now, never rerolls, persists
     *  across rounds AND combats, gone forever when spent. Cap 3; forging at cap
     *  converts to +1 Conviction (printed). `color: 'powering'` = the powering
     *  die's color; `'wild'` on premium cards. */
    | { kind: 'forge_floating_die'; color: 'powering' | 'wild' }
    /** TRANSMUTE (dice-law 2026-07-09) — convert one dead X die in the tray into
     *  a GHOST WILD die (all floating rules apply: joins the tray now, never
     *  rerolls, persists across combats, gone forever when spent). With no X in
     *  the tray, or at the floating cap, it burns for +1 Conviction (printed). */
    | { kind: 'float_x_die' }
    /** STAGGER — remove `rungs` rungs from the enemy's next telegraphed action;
     *  at 0 rungs the action is denied outright. */
    | { kind: 'stagger'; rungs: number }
    /** LOCK STANCE — the enemy's NEXT phase keeps its current stance (revealed). */
    | { kind: 'lock_stance' }
    /** FORETELL — look at the top `count` cards of your deck (the engine
     *  deterministically floats the highest-rank card to the top) and glimpse
     *  the enemy's next telegraph. */
    | { kind: 'foretell'; count: number }
    /** OMEN (phase 32 part 4d — OMEN v2 rework, spec 32 v3 T6): the player
     *  STAKES a claim on a future phase's stance instead of the engine
     *  silently deriving it from the powering die (the pre-v2 "always
     *  predicts HEART" complaint — 2026-07-10-theme-identity.md §"Oracle /
     *  augury"). `maxWindow` prints how many phases wide the claim may run:
     *  1 is the boldest single-boundary bet (checked exactly once, at full
     *  printed value); a wider claim (up to `maxWindow`) gets re-checked at
     *  every phase boundary until it hits or the window elapses, but both
     *  the `anteConviction` wager and the `rider` payoff scale down by
     *  1/window — a hedge costs less and pays less, in exchange for more
     *  tries. `anteConviction` is paid UP FRONT at cast (clamped to what the
     *  player can afford, never refunded on a miss — the felt cost a lookup
     *  never had). The player's claim arrives via `playCombatCard`'s
     *  `play.omenClaim`; absent, the engine falls back to `window: 1` and
     *  the pre-v2 die-derived stance (byte-compatible default until a
     *  mobile picker ships — see the phase 32 part 4d brief's Follow-ups). */
    | { kind: 'omen'; maxWindow: number; anteConviction: number; rider: CardRider }
    /** CHARGE — add `count` Charges to the running tally (Sentence theme). */
    | { kind: 'premise'; count: number }
    /** SENTENCE — declare the conclusion (one in play at a time): when the
     *  Charge tally reaches `at`, `rider` fires FREE and the tally resets.
     *  If the tally reaches `concedeAt` first, the enemy is CONDEMNED
     *  outright (alt-win, spec 32 v3 §9). */
    | { kind: 'peroration'; at: number; rider: CardRider; concedeAt?: number }
    /** SPEND CHARGES — cash the whole tally early: +1 MARK stack per
     *  `markPer` spent and draw 1 per `drawPer` spent. */
    | { kind: 'spend_premises'; markPer: number; drawPer: number }
    /** SPEND ALL PIPS — zero every pip on the powering die + Reserve; a paired
     *  `rupture` gains `fuelPerPip` per pip, and each pip grants `guardPerPip`.
     *  WS4.1 (`markPer`): +1 MARK stack on the foe per `markPer` pips spent,
     *  UNCAPPED (spec 32 §12 item 5 — the ALL-spender's price is the input
     *  opportunity cost of emptying the bank, not a numeric ceiling). */
    | { kind: 'spend_all_pips'; guardPerPip?: number; markPer?: number }
    /** RECOIL — pay `hp` VITAE (unpreventable, printed cost). */
    | { kind: 'recoil'; hp: number }
    /** RECOIL X (WS7.2, spec 32 §12 item 5 — the first chosen X-cost): pay X
     *  VITAE of the player's CHOOSING (X ≥ `min`, clamped to what the player
     *  can survive), landing POISON at ceil(X × `poisonPerX`) intensity.
     *  X arrives via `playCombatCard`'s `play.chosenX`; absent → `min`. */
    | { kind: 'recoil_x'; min: number; poisonPerX: number }
    /** EXTEND DOTS — +`turns` duration to ALL your DoTs on the enemy. */
    | { kind: 'extend_dots'; turns: number }
    /** CONVERT DOTS — convert enemy bleed↔poison at equal intensity,
     *  +`bonusIntensity` (the wound becomes the argument). */
    | { kind: 'convert_dots'; bonusIntensity: number }
    /** BOOST ALL DOTS — +`intensity` to every DoT already on the enemy. */
    | { kind: 'boost_all_dots'; intensity: number }
    /** SOUL — gain `count` Souls (Harvest theme currency). */
    | { kind: 'soul_gain'; count: number }
    /** CONSUME AFFLICTION — consume 1 enemy affliction early: its remaining DoT
     *  fuel ticks NOW, and the harvest yields `souls` Souls. */
    | { kind: 'consume_affliction'; souls: number }
    /** REAP — spend `cost` Souls (fizzles when underfunded): fire `rider`,
     *  and/or KINDLE a die of `kindle` color. */
    | { kind: 'reap'; cost: number; rider?: CardRider; kindle?: 'heart' | 'body' | 'mind' | 'wild' }
    /** REAP ALL — spend every Soul: burst `burstPerSoul` HP per Soul spent
     *  (mechanic-damage path, UNCAPPED — spec 32 §12 item 5: emptying the
     *  whole bank is the ALL-spender's price). */
    | { kind: 'reap_all'; burstPerSoul: number }
    /** TURNABOUT (phase 32 part 4a — Control capstone): CONSUME the whole
     *  `rungsDeniedTotal` ledger (every rung STAGGER/BACKFIRE has denied this
     *  combat) for a burst of `burstPerRung` HP per rung banked, then zero the
     *  ledger. Mirrors `reap_all`'s shape exactly, but CONSUMES rather than
     *  reads a still-growing counter — the theme finally banks what it does. */
    | { kind: 'turnabout'; burstPerRung: number }
    /** PLEA — add `amount` PLEA to the enemy. PLEA decays 1/turn; if PLEA ≥ the
     *  enemy's current HP at a turn boundary, it RELENTS (alt-win). */
    | { kind: 'sway'; amount: number }
    /** ECHO — this card's PAID payload fires twice. */
    | { kind: 'echo' }
    /** ECHO NEXT — your next spell this turn gains ECHO. */
    | { kind: 'echo_next_spell' }
    /** REPRISE — return `count` cards from the discard pile to hand (the engine
     *  picks the highest-rank). `fireFree` also fires the reprised card's FREE
     *  line immediately. */
    | { kind: 'reprise'; count: number; fireFree?: boolean }
    /** REPLAY LAST — replay the PAID payload of the last spell you played this
     *  combat, `times` times (never chains into another replay). */
    | { kind: 'replay_last'; times: number }
    /** CONJURE — create a one-use Haunt card into hand (removed from the
     *  combat after it is played or the combat ends). */
    | { kind: 'conjure_card'; cardId: string }
    /** IMMOLATE (profane-canon rework) — burn the `count` LOWEST-RANK other
     *  cards in hand as a printed COST: they leave the combat entirely (never
     *  reshuffle back), then `rider` fires. With nothing else in hand the play
     *  fizzles the rider (the pyre must be fed). Burning an enemy-injected
     *  CURSE this way is pure profit — the exploit/madness verb. Combat-engine
     *  owned; the legacy card engine no-ops it. */
    | { kind: 'immolate'; count: number; rider: CardRider }
    /** PURGE (profane-canon rework) — playing this card exiles it from the
     *  combat entirely (hand and deck cycle; mirrors the CONJURE one-use law).
     *  Reserved for CURSE cards: the PAID line buys the deck clean at the cost
     *  of a die and a tempo beat. Combat-engine owned. */
    | { kind: 'purge_self' }
    /** RIDER — an UNCONDITIONAL rider fired by the PAID line (the generic
     *  draw/heal/cleanse/guard verb carrier; same executor as condition riders). */
    | { kind: 'rider'; rider: CardRider }
    // ── THE BIG NUMBERS REWRITE (2026-09-02) — direct damage and its family ────
    /** DEAL — direct VITAE damage, the card library's primary verb again. The
     *  strike-ban doctrine that deleted `basePower` was repealed 2026-09-02;
     *  this is its authored replacement, and unlike `basePower` it is a real
     *  mechanic that scales with the read, the colour match and WRATH/CHAIN
     *  like everything else.
     *  - `amount` is the per-hit magnitude BEFORE read/colour/scaler bonuses.
     *  - `hits` (default 1) makes it a multi-hit: each hit is a separate damage
     *    instance, so damage-instance DoTs (BLEED) fire once per hit and HIDE
     *    is subtracted from each — the reason `7 × 4` and `28 × 1` play
     *    differently against an armoured foe.
     *  - `pierce` ignores the foe's HIDE and every damage-reduction effect. */
    | { kind: 'deal'; amount: number; hits?: number; pierce?: boolean }
    /** WRATH N — combat-long: every hit you land deals +N. Stacks additively
     *  (Slay the Spire's Strength, Dawncaster's Anger). The scaler that turns a
     *  multi-hit card into a finisher. */
    | { kind: 'wrath'; amount: number }
    /** FLAY N — the foe takes +50% damage from each of your next N hits, then
     *  the stack is spent (Dawncaster's Vulnerable, front-loaded). Consumed one
     *  stack per damage instance, so a multi-hit card eats several. */
    | { kind: 'flay'; stacks: number }
    /** TWIN — the NEXT spell you play this turn resolves its PAID payload twice
     *  (Dawncaster's Echo, armed rather than innate). Never chains: a twinned
     *  spell that itself arms TWIN does not re-arm from the second resolution. */
    | { kind: 'twin' }
    /** CHAIN N — +N damage to your next hit per stack held. CHAIN fades to 0 at
     *  the end of any turn in which no play added to it (Dawncaster's Chain),
     *  so the payoff belongs to the deck that keeps swinging. */
    | { kind: 'chain'; amount: number }
    /** EXECUTE — while the foe sits at or below `atPct` of its maximum VITAE,
     *  this card's DEAL damage is DOUBLED. The finisher clause; chosen over
     *  Dawncaster's instant-slay reading so a boss's stage thresholds stay the
     *  dramatic beats rather than being skipped. */
    | { kind: 'execute'; atPct: number }
    /** OVERKILL — damage dealt in EXCESS of what was needed to fell the foe is
     *  not wasted: it converts at the printed rates (Dawncaster's Overkill).
     *  `conviction` is ◆ per `per` excess VITAE; `healPct` heals that fraction
     *  of the excess; `souls` is Souls per `per` excess. */
    | { kind: 'overkill'; per: number; conviction?: number; healPct?: number; souls?: number };

/**
 * Every `CardSpecialMechanic` kind, at RUNTIME (phase 68).
 *
 * The union above is erased at compile time, so every consumer that needed to
 * enumerate the kinds kept its own copy — and they drifted. The mobile KW-2
 * lint iterated 17 of these while `MECHANIC_KEYWORD` already mapped 24
 * (content-pipelines audit 2026-08-22, "silently-drifting surfaces").
 *
 * This array IS the enumeration, and the two assertions below bind it to the
 * union in BOTH directions:
 *   - add a kind to the union without listing it here  -> compile error
 *   - list a kind here that the union does not have    -> compile error
 * A runtime-only list would drift the way the hardcoded 17 did; a type-only
 * union stays invisible at runtime. Both, bound together, is what closes it.
 */
export const CARD_SPECIAL_MECHANIC_KINDS = [
    'strip_random_buff',
    'befriend_attempt',
    'guard',
    'rupture',
    'siphon',
    'barrier',
    'riposte',
    'reroll_spent',
    'refresh_die',
    'convert_die_color',
    'create_temporary_die',
    'grant_pip',
    'overheat',
    'bank_spent_die',
    'forge_floating_die',
    'float_x_die',
    'stagger',
    'lock_stance',
    'foretell',
    'omen',
    'premise',
    'peroration',
    'spend_premises',
    'spend_all_pips',
    'recoil',
    'recoil_x',
    'extend_dots',
    'convert_dots',
    'boost_all_dots',
    'soul_gain',
    'consume_affliction',
    'reap',
    'reap_all',
    'turnabout',
    'sway',
    'echo',
    'echo_next_spell',
    'reprise',
    'replay_last',
    'conjure_card',
    'immolate',
    'purge_self',
    'rider',
    'deal',
    'wrath',
    'flay',
    'twin',
    'chain',
    'execute',
    'overkill',
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

/** Narrowing guard for data read from outside the type system (JSON, MCP). */
export function isCardSpecialMechanicKind(
    value: unknown,
): value is CardSpecialMechanic['kind'] {
    return (
        typeof value === 'string' &&
        (CARD_SPECIAL_MECHANIC_KINDS as readonly string[]).includes(value)
    );
}

/**
 * Fate Engine P1 — a card RIDER: a bundle of real-unit bonuses fired by a
 * die-interaction line (`threshold` / `dieBonus` / `fate`). Every field is an
 * exact engine unit so generated action text is the applied number (P0-truth
 * law). All fields optional; absent = 0/false.
 */
export interface CardRider {
    /** +N intensity on the statuses THIS play lands on the enemy. */
    bonusIntensity?: number;
    /** +N turns on the statuses THIS play lands on the enemy. */
    bonusDuration?: number;
    /** +N Guard. */
    guard?: number;
    /** +N Conviction (clamped to the cap). */
    conviction?: number;
    /** Refresh the powering die back to available. */
    refreshDie?: boolean;
    /** Reveal the NEXT threat phase's hidden stance. */
    revealStance?: boolean;
    /** Immediately tick every enemy DoT once (extra tick — durations untouched). */
    tickAllDots?: boolean;
    /** TICK (spec 32 v3) — the strongest enemy DoT deals its per-turn damage
     *  NOW, duration untouched. The canonical small erosion line. */
    tickOne?: boolean;
    /** Cleanse up to N of the player's own debuffs (tier-3 scope). */
    cleanse?: number;
    /** Heal the player N HP. */
    healHp?: number;
    /** Draw N cards. */
    drawCards?: number;
    // ── Spec 32 v3 — themed-deck rider verbs ─────────────────────────────────
    /** +N Charges (Charge tally). */
    premises?: number;
    /** +N PLEA on the enemy. */
    sway?: number;
    /** +N Souls (Harvest currency). */
    souls?: number;
    /** FORETELL N — reorder the top N of your deck + glimpse the next telegraph. */
    foretell?: number;
    /** Apply an effect from the library (the generic small-status line, e.g.
     *  a FREE "mark d2"). `to` defaults to 'opponent'. */
    applyEffect?: { effectId: string; intensity?: number; duration?: number; to?: 'self' | 'opponent' };
    /** Consume ALL enemy MARK stacks and burst N HP per stack (the-closing-word's
     *  conclusion — an affliction-payoff, mechanic-damage path). */
    ruptureMarks?: number;
    /** +1 intensity to ONE enemy DoT per pip spent (paired with spend verbs). */
    intensityPerPip?: number;
    /** +N pips to every Reserve die (the ripening rider). */
    pips?: number;
    /** STAGGER N — remove N rungs from the enemy's next telegraphed action. */
    stagger?: number;
    // ── Phase 30 (FREE-currency law) — theme-verb riders unlocked for FREE lines ──
    /** +N persistent Guard (the merged BARRIER sense — phase 29): does not fade
     *  at round end, only when consumed. Bulwark's FREE-line currency. */
    barrier?: number;
    /** Pay N VITAE (unpreventable — Guard/Barrier/defenses cannot stop it) as a
     *  printed cost. Akrasia's "FREE priced in blood" verb. */
    recoil?: number;
    /** Move N cards from the top of the deck (draw pile, reshuffling from the
     *  deck if it runs dry) directly to the discard pile — never to hand.
     *  Echo's "advance the loop" verb: feeds RECALL without drawing. */
    millCards?: number;
    // ── Phase 33d (GLYPHS pilot, sandbox-only) — FREE-currency rider family ──
    /** GLYPH CHARGE — +N charge to a glyph you control matching this card's
     *  own `Card.glyph.payload.kind` (or, for a card with no `glyph` field of
     *  its own — the "pump" role — ANY glyph you control), capped at the
     *  glyph's `cap`. If no matching glyph exists yet, the engine applies
     *  {@link glyphChargeFallback} instead (never a silent no-op — the FREE-
     *  currency lint law holds even before a glyph exists). Combat-engine
     *  owned (mirrors `barrier`/`recoil`); the card engine no-ops it. */
    glyphCharge?: number;
    /** The plain theme-currency deposit `glyphCharge` applies when the
     *  player controls no matching glyph yet. Itself a full `CardRider` (so
     *  it can carry any FREE-line verb), resolved through the same executor.
     *  Phase 33d (GLYPHS pilot, sandbox-only). */
    glyphChargeFallback?: CardRider;
    // ── THE BIG NUMBERS REWRITE (2026-09-02) — damage on the FREE line ────────
    /** Deal N direct VITAE damage. The verb that lets a FREE line be worth
     *  playing without a die; scales with WRATH/CHAIN/FLAY like any hit. */
    damage?: number;
    /** This rider's `damage` ignores HIDE and all damage reduction. */
    pierce?: boolean;
    /** +N WRATH (combat-long damage bonus per hit). */
    wrath?: number;
    /** +N CHAIN (bonus to the next hit; fades on a turn that adds none). */
    chain?: number;
    /** +N FLAY stacks on the foe (+50% damage from each of your next N hits). */
    flay?: number;
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
 * The numeric {@link CardRider} fields an upgrade may raise. Deliberately
 * excludes `recoil` — that is a printed COST, and raising a cost is a
 * downgrade wearing a `+`. Booleans (`pierce`, `refreshDie`, `tickOne`, …) are
 * excluded too: they are already on, or belong in an authored rework.
 */
export type UpgradableRiderField =
    | 'damage' | 'guard' | 'barrier' | 'healHp' | 'sway'
    | 'drawCards' | 'cleanse' | 'souls' | 'premises' | 'foretell' | 'millCards'
    | 'stagger' | 'pips' | 'conviction' | 'flay' | 'glyphCharge'
    | 'bonusIntensity' | 'bonusDuration'
    | 'wrath' | 'chain' | 'ruptureMarks' | 'intensityPerPip';

/**
 * An additive patch over a {@link CardRider} — the FREE line, a condition-line
 * rider (`threshold` / `dieBonus` / `fate` / `fallen` / `synergy`), or a rider
 * carried inside a mechanic (`rider`, `omen`, `peroration`, `reap`,
 * `immolate`, `grant_pip.overflow`).
 */
export interface CardRiderUpgrade extends Partial<Record<UpgradableRiderField, number>> {
    /** Deltas on the rider's `applyEffect` payload. `intensity` is clamped to
     *  `MAX_EFFECT_INTENSITY` by the applier. */
    applyEffect?: { intensity?: number; duration?: number };
    /** Deltas on the glyph fallback rider (phase 33d). */
    glyphChargeFallback?: CardRiderUpgrade;
}

/**
 * The numeric {@link CardSpecialMechanic} fields an upgrade may raise.
 * Excluded on purpose, because raising them makes the card WORSE: `recoil.hp`,
 * `recoil_x.min`, `omen.anteConviction` (printed prices), `reap.cost`,
 * `immolate.count` (cards burned as a cost), `peroration.at` / `concedeAt`,
 * `threshold.count` (gates you must reach), and the "per N spent" DIVISORS
 * `spend_premises.markPer` / `drawPer` and `overkill.per`.
 */
export type UpgradableMechanicField =
    | 'amount'          // deal / guard / barrier / sway / wrath / chain
    | 'hits'            // deal — a second hit is an authored upgrade, never a default
    | 'pierce'          // deal — 0/1 flag flip (any delta ≥ 1 turns it on)
    | 'count'           // premise / soul_gain / foretell / reprise / grant_pip
    | 'rungs' | 'stacks' | 'pips' | 'turns' | 'times' | 'intensity'
    | 'bonusIntensity' | 'damage' | 'reduce' | 'souls' | 'conviction'
    | 'burstPerSoul' | 'burstPerRung' | 'guardPerPip'
    | 'fuelPerPip' | 'fuelPerOmenHit' | 'poisonPerX'
    | 'pct' | 'healPct' | 'atPct' | 'bonusPct';

/** An additive patch over ONE entry of `Card.specialMechanics`. */
export interface CardMechanicUpgrade {
    /** Which mechanic to patch, by its `kind`. */
    kind: CardSpecialMechanic['kind'];
    /** Which occurrence of that kind (0-based). Omit to patch every one. */
    index?: number;
    /** Additive deltas on the mechanic's own numeric fields. */
    fields?: Partial<Record<UpgradableMechanicField, number>>;
    /** Additive deltas on the rider this mechanic carries, if any. */
    rider?: CardRiderUpgrade;
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
    /** Deltas on the condition-line riders. The GATES themselves
     *  (`threshold.count`, `fate.recoilHp`, the state predicates) are not
     *  patchable: relaxing a gate is a rework, not a `+`. */
    threshold?: CardRiderUpgrade;
    dieBonus?: CardRiderUpgrade;
    fate?: CardRiderUpgrade;
    fallen?: CardRiderUpgrade;
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
 * Phase 66 — Tier 2 synergy clause. Optional payload on `Card` that
 * rewards stance-switching by conditioning damage / effect application
 * on the presence of an ActiveEffect already on the field (or, for
 * Resonance Detonation, on the unconditional cast).
 *
 * Synergy damage (added to the card's base damage; doesn't replace):
 * ```
 * synergyDamage = bonusDamage
 *               + matched.intensity            × intensityDamageMul
 *               + matched.remainingDuration    × durationDamageMul
 * ```
 *
 * Side effects (in resolution order):
 *   1. Synergy damage applies to the target.
 *   2. `consumeMatched` clears the matched ActiveEffect on the
 *      predicate's `on` side.
 *   3. `clearAllEffectsBothSides` clears all ActiveEffects on both
 *      combatants (Phase 60 set-bonus passives included — design
 *      intent per Phase 66 D9).
 *   4. `applyEffectOnFire` applies a fresh effect (typically used to
 *      "swap type" — body Thorns → heart Bat-Swarm-Haunt).
 *
 * Synergy runs in `executeCard` AFTER `calculateCardDamage` but
 * BEFORE the card's own `combatEffects` apply, so consumed effects
 * don't get post-fire effects layered on top.
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
     * Post-v3 vocabulary: the damage-multiplier fields below are dead with the
     * strike; new state-gated synergies speak `CardRider` instead.
     */
    rider?: CardRider;
    /** Flat bonus damage on match. */
    bonusDamage?: number;
    /** Multiplier × matched effect's `remainingDuration`. */
    durationDamageMul?: number;
    /** Multiplier × matched effect's `intensity`. */
    intensityDamageMul?: number;
    /** Clear the matched effect from the predicate's `on` side. */
    consumeMatched?: boolean;
    /** Clear all ActiveEffects from both combatants. */
    clearAllEffectsBothSides?: boolean;
    /** Apply an additional effect on the caster when synergy fires. */
    applyEffectOnFire?: CardCombatEffects;
}

/**
 * Card entity — an ability that can be learned/unlocked and used in combat.
 *
 * @property id              - Unique identifier for this card.
 * @property name            - Display name.
 * @property description     - Flavor text or lore.
 * @property philosophicalAspect - Stat alignment of the card (heart/body/mind).
 * @property tier            - 1 / 2 / 3, mirrors the effect tier system.
 * @property targetType      - 'self' or 'enemy'.
 * @property combatEffects   - Optional list of effect payloads to apply.
 * @property specialMechanics - Optional bespoke behaviours. Resolved after
 *                              `combatEffects`. (Spec 32 v3: there is NO
 *                              damage step — `basePower` was deleted from the
 *                              schema; raw HP damage is a compile error.)
 */
export interface Card {
    id: string;
    name: string;
    philosophicalAspect: StatType;
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
     * Spec 32 — the card's THEME (one of ten). A theme is a family of keywords
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
    /**
     * Phase 66 — Tier 2 synergy clause. When present, the card engine
     * evaluates the synergy after `calculateCardDamage` and before
     * applying `combatEffects` / `specialMechanics`. See {@link CardSynergy}.
     */
    synergy?: CardSynergy;
    /**
     * Phase 91 — Optional friendship counter increment. When present, executeCard
     * increments the combat friendship counter by this amount after damage/effects
     * but before resource costs. Does not require defend stance.
     */
    incrementsFriendship?: number;
    /**
     * Content-provenance metadata used by the tuning `--focus` filter
     * (`src/Tuning/focus.parser.ts`). `addedIn` is an ISO date / phase tag;
     * `tags` are freeform labels (e.g. `'mid-game'`, `'damage'`). Both
     * optional and ignored by the card engine.
     */
    addedIn?: string;
    tags?: string[];
    /**
     * WS1.3 line-telemetry lint exemption: this card's FREE/PAID line split is
     * asymmetric BY DESIGN (e.g. a setup-only FREE line or a paid-only
     * finisher), so the soft 85/15 dominance bands in
     * `src/Combat/e2e/combat-playtest.line-telemetry.sim.test.ts` skip it.
     * Purely lint metadata — the engines ignore it.
     */
    intentionallyAsymmetric?: boolean;
    // ── Fate Engine P1 (spec 31 §4.1) — per-card die-interaction lines. Design
    //    law: every Tier-2+ card carries exactly ONE of threshold / dieBonus /
    //    fate / die-manipulation / react; Tier-1 at most one. All combat-engine
    //    owned; the card engine ignores them. ───────────────────────────────────
    /**
     * TOLL THRESHOLD (Spirit Island element thresholds): when the
     * encounter's spent-die tally of `color` is ≥ `count` at play time, the
     * rider fires automatically, free. One spend, two payoffs.
     */
    threshold?: { color: StatType; count: number; rider: CardRider };
    /**
     * DIE BONUS: the rider fires when the POWERING die's color matches —
     * `'match'` = this card's own stance (or Wild), a named color = exactly
     * that color, `'off'` = any color that is NOT this card's stance (the
     * straw-man line: the wrong target, hit harder).
     */
    dieBonus?: { onColor: StatType | 'match' | 'off'; rider: CardRider };
    /**
     * FATE (Mage Knight no-dead-faces): this card may be POWERED BY AN X DIE.
     * A colored/wild die plays the card normally; the X die fires the printed
     * `rider` on top and costs `recoilHp` (the impossible made load-bearing).
     */
    fate?: { rider: CardRider; recoilHp?: number };
    /**
     * Spec 32 v3 T4 — FALLEN theme-state condition line: the rider fires free
     * when the player is Fallen (carries ≥2 distinct self-debuffs) at play time.
     */
    fallen?: { rider: CardRider };
    /**
     * Phase 33d (GLYPHS pilot, sandbox-only) — this card's PAID line inscribes
     * a new {@link GlyphInstance} (0 charges, this `cap`) onto
     * `CombatEncounterState.glyphs`, resolved AFTER the card's own
     * `combatEffects`/`paidSummary` PAID line (both fire the same play — the
     * card is never dead if its glyph is never cracked). No new `CardType`:
     * this rides the existing `'spell'` type (WI-2's `cardType: 'glyph'`
     * suggestion was cut — see the phase 33d brief's Decisions). Combat-engine
     * owned; the card engine no-ops it.
     */
    glyph?: { payload: GlyphPayload; cap: number };
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
