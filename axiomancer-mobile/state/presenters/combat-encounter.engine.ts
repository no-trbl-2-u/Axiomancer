/**
 * Spec 26 / 26b — Combat board presenter.
 *
 * Pure function `buildCombatViewModel(state)`: maps the engine
 * `CombatEncounterState` into a single render-ready `CombatViewModel`. No store
 * writes, no rules — the engine owns truth, this shapes it for the board
 * (portraits, visible enemy HP, intent telegraph, the hidden-stance read, the
 * 2-die draft, and Conviction + Signature Skills — the HP-only model).
 *
 * The redesign (Spec 26b): the enemy STANCE is hidden until revealed, so this
 * presenter only surfaces a stance colour/label once `isPhaseStanceRevealed`;
 * otherwise it shows the thematic tell and a "?".
 */

import {
    handCards as engineHandCards, getCard, getCardById,
    getDraftedDie, isPhaseStanceRevealed, cardReadPreview,
    revealedCurrentStance, resolveRead, getSignatureSkill,
    lookupEffect, READ_DAMAGE_MULT, colorMatchBonus,
    READ_ADVANTAGE_INTENSITY_BONUS, READ_DISADVANTAGE_DURATION_PENALTY, RESERVE_MAX,
    RUPTURE_CAP_FRACTION, recoilXRange, riderText,
    VULNERABLE_MAX_MULT, DISRUPT_DENY_AT,
    // phase 28 — legibility sweep
    projectRuptureBurst, projectIncomingThreat,
    CONCEDE_PREMISES_BASE, CONCEDE_PREMISES_ELITE, CONCEDE_PREMISES_BOSS,
    capitulateThreshold, concedeFloorFor,
    // phase 2 — projected-lethality readout (spec 30): the status kill-path
    // foresight, wired into the board's HUD by this pass.
    projectCombatOutcome,
    // Playtest fix 2026-09-04 — the turn-boundary PLEA decay is narrated in
    // the combat log with the engine's own constant, never a copied literal.
    SWAY_DECAY_PER_TURN,
    // Spec 33 (Phase D6a) — flag-on combat render core: the die-face axis, the
    // OVERHEAT-crack read, and the Press Fate reroll price. Inert flag-off.
    isUpgradeableDiceEnabled, PRESS_FATE_COST,
    // Spec 33 (Phase D6b) — the momentum-V2 chain, stance-check telegraph, and
    // die-gear rail. All inert flag-off (the fields never reach the VM).
    MOMENTUM_CHAIN_ORDER, MOMENTUM_SURGE_LENGTH, activeDieGear, DEFAULT_DIE_GEAR,
    type CombatEncounterState, type CombatCard, type CombatManaDie, type CombatEvent,
    type CombatThreatPhase, type CombatThreatEffect, type CombatIntentType, type CombatReadResult,
    type CombatSummary, type SignatureSkill, type Stance,
    type Card, type CardCombatEffects, type EnemyDifficulty,
    type UpgradeableDieGear,
    isMomentumDieId, type WheelStance,
    type GlyphInstance, type GlyphPayload,
    // Phase 102 (SUMMON) — the brood. `STRIKE_ADD_COST` is imported rather than
    // restated: a price the UI hardcodes is a price that drifts from the engine
    // that charges it, and the confirm sheet quotes this number to the player.
    STRIKE_ADD_COST,
} from '@mechanics';
// THE BIG NUMBERS REWRITE — the enemy-keyword module is NOT re-exported through
// the top-level `@mechanics` barrel, so its type comes in on the subpath alias
// (same workaround as `CardSpecialMechanic` below). The player-facing LABEL and
// GLOSS are adapted in `state/combat/keywords.ts`, never read raw here.
import type { EnemyKeyword } from '@mechanics/Enemy';
// W3 (2026-09-21, owner finding 4) — the card-text projection. The detail
// panel's printed clauses are DERIVED here, in mechanics, from the effect
// data; this presenter only formats them (keyword casing, separators,
// de-abbreviation). It never decides what is in the list. Sub-path alias,
// like `@mechanics/Enemy` above: the module is deliberately not re-exported
// through the top-level barrel, which several workers are editing in parallel.
import { paidClauses, type CardClause } from '@mechanics/Combat/combat.card-text';
import { momentumV2A11y } from '@/state/combat/momentum';
// D4 — the single mobile source for the rarity band (wave-0 contract). Never
// re-band a rank here; `rarityFor` owns that question for every surface.
import { rarityFor, RARITY_LABEL, RARITY_PIPS, RARITY_COLOR } from '@/state/presenters/card-rarity.engine';

/** The barrel doesn't re-export the union, so derive it from Card. */
type CardSpecialMechanic = NonNullable<Card['specialMechanics']>[number];
import { effectGlyph, GLYPH_COLORS, type StatusGlyph } from '@/components/combat/statusGlyphs';
import { enemyKeywordChip, enemyKeywordGlossForToken, keywordForEffect, keywordForVerb, keywordForMechanic, keywordGloss, keywordsInPersistentText, persistentVerbKeyword, systemTermsForCard } from '@/state/combat/keywords';
import { AXM } from '@/theme/axm';

// ── Stance palette (Heart/Body/Mind/Wild/X/Any) ──────────────────────────────

export const STANCE_COLORS: Record<string, string> = {
    // Body=RED, Mind=BLUE, Heart=PURPLE, Wild=GOLD (owner-specified dice palette).
    heart: '#9a5fd0', body: '#d6543f', mind: '#4f7fd6', wild: '#d9b44a', x: '#5a5a5a',
    // Phase 104 — the grey office's colourless aspect: the neutral ink token
    // (never a literal, unlike the fixed dice-identity hexes above).
    any: AXM.bone,
};
const DIE_GLYPHS: Record<string, string> = { heart: '♥', body: '⚡', mind: '★', wild: '✦', x: '✕', any: '✦' };
const STANCE_LABELS: Record<string, string> = { heart: 'HEART', body: 'BODY', mind: 'MIND', wild: 'WILD', x: 'X', any: 'ANY' };

// Spec 32 v3 — THE STRIKE IS DEAD: a FREE (no-die) play executes the card's
// AUTHORED free rider (no flat chip exists). The free text below always comes
// from the engine's riderText so printed == applied (P0-truth).
//
// Rank ladder display names (spec 32 v3 §4). CARD_RANK_NAMES lives in
// mechanics src/Cards/types.ts but is NOT re-exported through the barrel,
// so mirrored here (kept in sync by hand).
const RANK_NAMES: Record<number, string> = Object.freeze({
    1: 'Ash', 2: 'Tooth', 3: 'Splinter', 4: 'Rib', 5: 'Skull', 6: 'Saint',
});
// Verb-class card colours (these map to verbs, not Effects, so they aren't in GLYPH_COLORS).
const GUARD_COLOR = '#9aa0a6';
const PAYOFF_COLOR = '#c2a14e';
const BEFRIEND_COLOR = '#5bbf6a';
const INERT_COLOR = '#6b6257';
const ENCHANT_COLOR = '#7fb3a6';

// Phase 50 — Seal chips (Phase 33d's `state.glyphs`, renamed "Seal" for
// UI-facing copy per Phase 49 decision 3, never "glyph" — that name is
// already `EFFECT_GLYPHS`'s per-status icon system). A single gold accent
// (matches `STANCE_COLORS.wild`, the existing "charged token" identity)
// keeps a Seal from ever reading as a live status effect on the board.
const SEAL_COLOR = '#d9b44a';
const SEAL_GLYPHS: Record<GlyphPayload['kind'], string> = { poison: '◈', barrier: '❖' };
const SEAL_LABELS: Record<GlyphPayload['kind'], string> = { poison: 'Poison Seal', barrier: 'Barrier Seal' };

// Phase 102 — SUMMON's brood. A colour of its own, deliberately NOT
// `ENEMY_KEYWORD_COLOR` (iron grey, "a property of the thing you are hitting")
// and NOT `SEAL_COLOR` (gold, "a charged token of yours"): an add is a live
// THING ON THE BOARD that acts against you, so it borrows the threat register.
export const ADD_COLOR = '#b4543f';
const ADD_GLYPH = '•';

/** THE BIG NUMBERS REWRITE — a silhouette per ENEMY keyword, so the foe's
 *  pane reads as a shape before it reads as a word (the same doctrine the card
 *  glyphs follow). Iron grey throughout: these are properties of the thing you
 *  are hitting, not statuses anyone applied. */
const ENEMY_KEYWORD_GLYPHS: Record<EnemyKeyword['kind'], string> = Object.freeze({
    hide: '⛨',       // a hide of plate — the armour floor
    swift: '↯',      // it moves before your wall does
    brutal: '⚒',     // whatever gets through lands twice
    venom: '☣',      // the wound goes bad
    unshaken: '⛰',   // it does not flinch
    elusive: '≈',    // the armour doubles until you pin it
    regrow: '❦',     // it closes at every phase boundary
    ravenous: '☾',   // it feeds on what it lands
    wounding: '✚',   // a big hit puts a WOUND in your deck
    flurry: '⁂',     // one telegraph, several strikes
    // Phase 102 — SUMMON. Five dots rather than the asterism FLURRY uses: both
    // mean "more than one", but FLURRY means more strikes from ONE body and
    // SUMMON means more BODIES, so they must not read as the same mark.
    summon: '⁙',
});
const ENEMY_KEYWORD_COLOR = GLYPH_COLORS.thorns;

/**
 * Canon combat copy is VITAE (mobile CLAUDE.md — "copy regressions to the
 * generic terms are rejected on sight"). The engine composes some printed card
 * lines itself (`fate.recoilHp` prints "(recoil 4 HP)"), and rules text is
 * engine-owned truth — but the WORD a player reads is presentation, and this
 * is the layer that owns it. One narrow substitution at the boundary where
 * engine text becomes a face string, so a single stale noun in the engine can
 * never put "HP" on a card again.
 */
function vitaeCopy(text: string): string {
    return text.replace(/\bHP\b/g, 'VITAE');
}

/** Spec 32 v4 §2.1 — a persistent (enchant/disenchant) card's FREE line is a
 *  TIMED instance of its passive; the engine prints it on `topActionText` as
 *  'FREE (3 rounds) — <passive> (Rank)'. Reuse THAT line (strip the FREE head,
 *  the rank tag, and the trailing stop) so the presenter can never contradict
 *  the engine — the old hardcoded 'PAID only' label was exactly such a lie. */
function persistentFreeText(card: CombatCard): string {
    return card.topActionText
        .replace(/^FREE\s*/, '')
        .replace(/\s*\((?:Ash|Tooth|Splinter|Rib|Skull|Saint)\)\s*$/, '')
        .replace(/\.\s*$/, '');
}

/** The terse timed-instance chip for the face's ◇ FREE rail — the '(3 rounds)'
 *  the engine printed, without re-authoring the number mobile-side. */
function persistentFreeRounds(card: CombatCard): string {
    const m = card.topActionText.match(/^FREE\s*\(([^)]+)\)/);
    return m ? m[1] : 'timed';
}

/** The persistent card's PAYLOAD keyword for the face's ◆ verb slot (owner
 *  directive 2026-07-12: the face leads with what the passive DOES — MARK,
 *  POISON — never the bare type word). An authored effect id wins; else the
 *  verb is recovered from the persistentEffect summary. */
function persistentPayloadKeyword(sourceCard?: Card): string | null {
    for (const ce of sourceCard?.combatEffects ?? []) {
        const kw = keywordForEffect(ce.effectId);
        if (kw) return kw;
    }
    return persistentVerbKeyword(sourceCard?.persistentEffect);
}

/** 2026-07-12 (card-wording audit) — 8 of 10 playtest decks could not decode
 *  the rider shorthand ('mark i1 d2'). De-abbreviate at render: intensity →
 *  '×N', duration → 'N turns'. Presentation-only — the engine text stays the
 *  truth; this is its spelling (ADR-0001/0003). */
function deabbreviateShorthand(text: string): string {
    return text
        .replace(/\bi(\d+) d(\d+)\b/g, (_, i: string, d: string) => `×${i} · ${d} turn${d === '1' ? '' : 's'}`)
        .replace(/\bi(\d+)\b/g, '×$1')
        .replace(/\bd(\d+)\b/g, (_, d: string) => `${d} turn${d === '1' ? '' : 's'}`);
}

/** The authored FREE (no-die) line in real engine units — riderText over the
 *  card's `free` rider; a persistent (oath/hex) card's FREE line is
 *  its engine-printed timed instance (spec 32 v4: 3 rounds of the passive).
 *  Never a fabricated number. */
function freeLineText(card: CombatCard, sourceCard?: Card): string {
    if (card.cardType === 'oath' || card.cardType === 'hex') return persistentFreeText(card);
    // selfTargetCard: a rider crossing the card's printed target names its side
    // ('mark ×1 (enemy)' on the self-target ad-nauseam — card-clarity audit).
    return sourceCard?.free
        ? deabbreviateShorthand(riderText(sourceCard.free, { selfTargetCard: sourceCard.targetType === 'self' }))
        : 'no effect';
}

/** The barrel doesn't export CardRider — derive it from Card. */
type CardRider = NonNullable<Card['free']>;

/** Option A split rail — project the authored FREE rider into a KEYWORD · value
 *  pair for the face's ◇ column. Clause order mirrors the engine's riderText so
 *  the head clause is the same one the prose leads with; a multi-clause free
 *  line keeps the head pair and marks the rest with a trailing '+' (the overlay
 *  freePill remains the full-truth line). Never a fabricated number. */
function riderPairs(r: CardRider): [string, string][] {
    const pairs: [string, string][] = [];
    if (r.bonusIntensity) pairs.push(['INTENSITY', `+${r.bonusIntensity}`]);
    if (r.bonusDuration) pairs.push(['DURATION', `+${r.bonusDuration}t`]);
    if (r.guard) pairs.push(['GUARD', `${r.guard}`]);
    if (r.conviction) pairs.push(['CONVICTION', `+${r.conviction} ◆`]);
    if (r.refreshDie) pairs.push(['REFRESH', 'die']);
    if (r.revealStance) pairs.push(['REVEAL', 'stance']);
    if (r.tickAllDots) pairs.push(['TICK', 'all DoTs']);
    if (r.tickOne) pairs.push(['TICK', '1']);
    if (r.cleanse) pairs.push(['CLEANSE', `${r.cleanse}`]);
    if (r.healHp) pairs.push(['HEAL', `${r.healHp}`]);
    if (r.drawCards) pairs.push(['DRAW', `${r.drawCards}`]);
    if (r.premises) pairs.push(['CHARGE', `+${r.premises}`]);
    if (r.sway) pairs.push(['PLEA', `${r.sway}`]);
    if (r.souls) pairs.push(['SOUL', `+${r.souls}`]);
    if (r.foretell) pairs.push(['FORETELL', `${r.foretell}`]);
    if (r.applyEffect) {
        const kw = keywordForEffect(r.applyEffect.effectId)
            ?? r.applyEffect.effectId.replace(/^(debuff|buff)_/, '');
        const i = r.applyEffect.intensity ?? 1;
        const d = r.applyEffect.duration;
        // De-abbreviated (audit 2026-07-12): '×1 · 1t', never the 'i1 d1' code.
        pairs.push([kw.toUpperCase(), `×${i}${d ? ` · ${d}t` : ''}`]);
    }
    if (r.ruptureMarks) pairs.push(['RUPTURE', `${r.ruptureMarks}/stack`]);
    if (r.intensityPerPip) pairs.push(['PIP', `+${r.intensityPerPip} int`]);
    if (r.pips) pairs.push(['PIP', `+${r.pips}`]);
    if (r.stagger) pairs.push(['STAGGER', `${r.stagger}`]);
    // phase 30 — FREE-currency riders.
    if (r.barrier) pairs.push(['GUARD', `${r.barrier}`]);
    if (r.recoil) pairs.push(['RECOIL', `${r.recoil}`]);
    if (r.millCards) pairs.push(['MILL', `${r.millCards}`]);
    return pairs;
}

function freeRail(card: CombatCard, sourceCard?: Card): { freeKeyword: string | null; freeValue: string | null } {
    if (card.cardType === 'oath' || card.cardType === 'hex') {
        // Spec 32 v4 — the FREE play is a real, timed instance of the passive
        // (never 'PAID only'): the rail prints the engine's own round count.
        return { freeKeyword: null, freeValue: persistentFreeRounds(card) };
    }
    const r: CardRider | undefined = sourceCard?.free;
    if (!r) return { freeKeyword: null, freeValue: null };
    const pairs = riderPairs(r);
    if (pairs.length === 0) return { freeKeyword: null, freeValue: null };
    const [kw, val] = pairs[0];
    return { freeKeyword: kw, freeValue: pairs.length > 1 ? `${val} +` : val };
}

// FREE-effect glyph — the hero mark for the dieless play. Affliction riders use
// their effect's board glyph; currency riders (guard/draw/premise…) map to a
// terse rune. '' when the card has no free line.
const FREE_KW_GLYPH: Record<string, string> = {
    GUARD: '❖', HEAL: '✚', DRAW: '⚑', CHARGE: '❡', PLEA: '∿', SOUL: '✦',
    FORETELL: '◉', TICK: '❋', CLEANSE: '✦', PIP: '⬡', STAGGER: '⚔',
    RECOIL: '▽', MILL: '⁇', RUPTURE: '❋',
};
/** The FREE glyph plus the KEYWORD that drives it — the key lets the face swap
 *  the text rune for the effect's SILHOUETTE (glyphShapes.ts) when one exists. */
function freeGlyphMeta(card: CombatCard, sourceCard?: Card): { glyph: string; key: string | null } {
    if (card.cardType === 'oath') return { glyph: '❖', key: 'OATH' };
    if (card.cardType === 'hex') return { glyph: '☠', key: 'HEX' };
    const r: CardRider | undefined = sourceCard?.free;
    if (!r) return { glyph: '', key: null };
    if (r.applyEffect?.effectId) {
        const kw = keywordForEffect(r.applyEffect.effectId)
            ?? r.applyEffect.effectId.replace(/^(debuff|buff)_/, '');
        return { glyph: glyphFor(r.applyEffect.effectId), key: kw.toUpperCase() };
    }
    const kw = riderPairs(r)[0]?.[0];
    return kw ? { glyph: FREE_KW_GLYPH[kw] ?? '◆', key: kw } : { glyph: '', key: null };
}

/** Option A type strip — stance + player-facing card type (HEX for a curse). */
function typeStripText(card: CombatCard): string {
    const typeLabel = card.cardType === 'oath' ? 'OATH'
        : card.cardType === 'hex' ? 'HEX'
            : card.cardType === 'spell' ? 'SPELL' : null;
    return [card.stance.toUpperCase(), ...(typeLabel ? [typeLabel] : [])].join(' · ');
}

// ── Intent vocabulary (Spec 26 §2.4) ─────────────────────────────────────────

export const INTENT_ICONS: Record<CombatIntentType, { icon: string; label: string; color: string }> = {
    damage: { icon: '⚔', label: 'ATTACKS', color: '#e2543b' },
    debuff: { icon: '☠', label: 'WEAKENS', color: '#a86bdc' },
    buff: { icon: '✦', label: 'RECOVERS', color: '#5bbf6a' },
    block: { icon: '🛡', label: 'DEFENDS', color: '#6b8eb0' },
    pass: { icon: '○', label: 'WAITS', color: '#8a8273' },
    combo: { icon: '⚡', label: 'SURGES', color: '#d9b44a' },
};

// ── View-model types ─────────────────────────────────────────────────────────

export interface CombatEffectChipVM {
    // No `isMax`: the engine has no intensity cap, so the old "✶ at 10" badge
    // was a presenter invention that hid the real stack count (2026-09-04).
    effectId: string; glyph: StatusGlyph; intensity: number; duration: number;
    /** General keyword definition for the on-board status tooltip (null if unmapped). */
    gloss: string | null;
    /** 2026-07-12 (card-wording audit) — a STANDING oath/hex chip
     *  synthesized from the persistent zones (no effect id ever backs the
     *  passive, so `effectId` holds the CARD id). duration 0 = permanent;
     *  intensity is meaningless and its badge is hidden. */
    standing?: boolean;
}
/** WS9 (spec 32 §12 #7) — the fork telegraph of a BRANCH phase: the condition
 *  plus BOTH outcomes stay visible; `taken` is stamped once the phase starts. */
export interface CombatIntentBranchVM {
    /** Human condition text, e.g. "if it carries 3+ afflictions". */
    condition: string;
    thenText: string;
    elseText: string;
    /** The committed fork — null while the phase is still upcoming. */
    taken: 'then' | 'else' | null;
}
export interface CombatIntentVM {
    type: CombatIntentType; icon: string; label: string; color: string; description: string;
    /** Total HP damage this phase's threat action deals if NOT cleared (0 if none).
     *  Raw face value — NOT run through live modifiers; see `wallMath` for that. */
    damage: number;
    /** True if the threat action also applies a debuff to the player. */
    debuffs: boolean;
    /** WS9 — fork info for the CURRENT phase (null on linear phases). */
    branch: CombatIntentBranchVM | null;
    next: { type: CombatIntentType; icon: string; label: string; branch: CombatIntentBranchVM | null } | null;
    /** phase 28 — the wall-math readout (`projectIncomingThreat`): what this
     *  telegraphed hit actually deals right now, netted against live guard/
     *  barrier and denial state — the number `damage` above can't show.
     *  Phase 33b adds `rungsTotal`/`rungsLost` — the phase's live STAGGER-rung
     *  magnitude, previously invisible to the player entirely. */
    wallMath: {
        projectedDamage: number; netDamage: number; willDeny: boolean; guard: number; barrier: number;
        rungsTotal: number; rungsLost: number;
        /** Phase 102 (SUMMON) — the brood's own arithmetic, carried SEPARATELY
         *  from the foe's telegraph rather than folded into `netDamage`.
         *  `netDamage` must keep meaning "what this telegraphed hit deals", or
         *  every existing readout that reads it starts lying about the foe.
         *  `totalNetDamage` is what the player actually loses this phase, and
         *  it is what the HUD prints: a DENIED telegraph with a living brood
         *  still costs VITAE, and showing bare "DENIED" there would be the
         *  worst lie this readout can tell. */
        addDamage: number; addNetDamage: number; totalNetDamage: number;
    };
    /** Spec 33 §5 (Phase D6b, FLAG-ON ONLY) — the OPEN stance-check telegraph for
     *  this phase (D6e authored `punishes`/`yields` on every threat phase): what
     *  this hit does to the player's current stance, plus the end-of-phase
     *  resolution feedback. ABSENT flag-off (key-for-key byte-identical). */
    stanceCheck?: CombatStanceCheckVM | null;
}
/**
 * Spec 33 §5 (Phase D6b) — the open stance check on a threat phase. NO hidden
 * information (owner-UI doctrine): both the punish and the yield stances are
 * telegraphed with their multiplier, and once the phase resolves the outcome
 * (×1.5 punished / ×0.5 yielded +1◆ / none) is shown plainly.
 */
export interface CombatStanceCheckVM {
    /** The stance this hit PUNISHES (×1.5), or null. */
    punishes: WheelStance | null;
    /** The stance this hit YIELDS to (×0.5 + you gain 1◆), or null. */
    yields: WheelStance | null;
    /** Terse telegraph line, e.g. 'Punishes BODY ×1.5' — null when no punish. */
    punishesText: string | null;
    /** Terse telegraph line, e.g. 'Yields to MIND ×0.5 +1◆' — null when none. */
    yieldsText: string | null;
    /** Which telegraphed branch the player's CURRENT stance is walking into
     *  right now (live preview before the hit lands): 'punished'/'yielded'/'none'. */
    live: 'punished' | 'yielded' | 'none';
    /** The last resolved outcome for this check (from the `stance-check-resolved`
     *  event), or null before the phase has resolved. */
    resolution: { outcome: 'punished' | 'yielded' | 'none'; stance: Stance | null; text: string } | null;
}
export interface CombatEnemyPaneVM {
    name: string; artKey: string; isBoss: boolean;
    /** Encounter-varying nonce (the encounter seed) — salts the random art pick
     *  so the same foe wears a different painting from fight to fight. */
    artNonce: number;
    hp: number; maxHp: number; hpPct: number;
    effects: CombatEffectChipVM[];
    intent: CombatIntentVM;
    /** Revealed stance ('heart'|'body'|'mind') or null while hidden. */
    revealedStance: string | null;
    stanceColor: string;      // accent (revealed stance colour, else neutral)
    stanceLabel: string;      // 'HEART' / '?' …
    stanceHint: string;       // the thematic tell (always shown)
    /** WI-5 — the invisible alt-win currencies, now surfaced as slim meters
     *  under the VITAE bar. `sway`/`swayTarget` drive the RELENT track
     *  (PLEA ≥ target at a turn boundary ends the fight); `premises`/`premiseAt`
     *  drive the ORATORY track (a declared SENTENCE fires on its tally). Each
     *  meter renders when its value > 0 OR the player holds a card that feeds it
     *  (so a whole-plan-is-PLEA preset like GRACE sees the track from turn 1). */
    sway: number; swayTarget: number; swayVisible: boolean;
    premises: number; premiseAt: number; premiseVisible: boolean;
    /** THE BIG NUMBERS REWRITE — the foe's printed keywords (HIDE 6, BRUTAL …)
     *  as tappable chips. Same VM as a status chip, so the existing plaque
     *  explains them; empty when the foe carries none. */
    keywords: CombatEffectChipVM[];
    /** THE BIG NUMBERS REWRITE — FLAY stacks riding the FOE (each spends on one
     *  of your next hits, landing it half again as hard). Same visibility rule
     *  as the alt-win meters: shown once it has a value, or once the deck holds
     *  a card that feeds it. */
    flay: number; flayVisible: boolean;
    /** The count of STAGE thresholds this foe has already crossed (0 for
     *  anything that does not escalate). The loud announcement is the combat
     *  log's `stage-entered` line — this is the standing "it has changed" mark. */
    stagesEntered: number;
    /** Phase 2 (spec 30) — the status kill-path foresight. `pendingDot` is the
     *  damage the foe's CURRENT stacks will deal if nothing else happens;
     *  `roundsToKill` is null unless that alone clears remaining HP, in which
     *  case `isLethalInFlight` is true. Engine truth (`projectCombatOutcome`),
     *  this presenter only forwards it. `healPerRound` (playtest fix
     *  2026-09-04) is the foe's projected REGROW/RAVENOUS recovery the
     *  kill-round walk already nets out — surfaced so the meter can say WHY a
     *  fat pending stack is not yet a kill. */
    pendingDot: number; roundsToKill: number | null; isLethalInFlight: boolean; healPerRound: number;
    /** Phase 102 (SUMMON) — the foe's living brood, one chip per body. Empty
     *  for every foe that does not summon, which is all but one of them, so
     *  this row simply does not render in the ordinary fight. On the ENEMY
     *  pane and not the player's: a Seal is a token of YOURS that you spend,
     *  an add is a body of THEIRS that you remove. */
    adds: CombatAddVM[];
    /** What one `strikeAdd` costs in Conviction, and whether the player can
     *  pay it right now. Forwarded from the engine constant rather than
     *  restated here — a price the UI hardcodes is a price that drifts. */
    strikeAddCost: number; canStrikeAdd: boolean;
}
/**
 * Phase 102 (SUMMON) — one renderable member of a foe's brood.
 *
 * `bite` is the FLAT number the engine applies, not a projection: the engine
 * resolves adds outside the threat loop's multiplier stack precisely so the
 * number on this chip is the number the player takes. It is printed as-is, and
 * that is only honest because of where the engine put it.
 *
 * `affordable` is a snapshot of `conviction >= STRIKE_ADD_COST` at build time.
 * The chip stays TAPPABLE when it is false — the confirm sheet then shows the
 * price greyed with the shortfall named, because a chip that silently refuses
 * a tap teaches the player nothing about why.
 */
export interface CombatAddVM {
    id: string;
    name: string;
    bite: number;
    vitae: number;
    maxVitae: number;
    glyph: string;
    color: string;
    cost: number;
    affordable: boolean;
}
/** Phase 50 — a renderable "Seal" (Phase 33d's `GlyphInstance`, engine name
 *  unchanged, UI-facing label renamed per Phase 49 decision 3). `crackValue`/
 *  `previewText` mirror `crackGlyph`'s own payload formula (`baseIntensity`/
 *  `baseAmount` + `charges`) so the confirm sheet never lies about what a
 *  tap will actually do (WI-2 acceptance criterion 4 — "the foretold next
 *  crack value"). */
export interface CombatSealVM {
    id: string;
    kind: GlyphPayload['kind'];
    glyph: string;
    color: string;
    label: string;
    charges: number;
    cap: number;
    crackValue: number;
    previewText: string;
}
export interface CombatPlayerPaneVM {
    name: string; hp: number; maxHp: number; hpPct: number; guard: number; effects: CombatEffectChipVM[];
    seals: CombatSealVM[];
    /** THE BIG NUMBERS REWRITE — the damage-scaler ledgers, surfaced on the
     *  same terms as the alt-win meters (a value, or a deck that feeds one).
     *  WRATH is combat-long and never fades; CHAIN loads the NEXT hit and
     *  slackens at the end of any turn that fed it nothing; TWIN is armed for
     *  the next spell of this turn only. Invisible accumulation is the bug
     *  these exist to close. */
    wrath: number; wrathVisible: boolean;
    chain: number; chainVisible: boolean;
    twinArmed: boolean;
}
export interface CombatDieVM {
    id: string; color: string; colorHex: string; glyph: string; stanceLabel: string;
    drafted: boolean; spent: boolean; isX: boolean;
    /** Read vs the (revealed) enemy stance: advantage/neutral/disadvantage/none/null(hidden). */
    readPip: CombatReadResult | null;
    // ── Fate Engine P1 ──
    /** A banked Reserve die — a second power source, ripening between phases. */
    reserve?: boolean;
    /** Ripening pips (+1 intensity per pip on a status play; +2 Guard on a defend). */
    pips?: number;
    /** A dead X face that can still be FATE-TAPPED this turn (R4). */
    fateTappable?: boolean;
    /** Spec 32 v3 §5 — a GHOST die: always spendable (bypasses the one-die
     *  draft), consumed forever when spent, persists across combats. */
    floating?: boolean;
    /** 2026-07-12 (stale-powered fix) — the drafted die already powered a play
     *  this turn and a landed status handed it back (the combo refresh). It is
     *  draggable again, but it never auto-arms another staged card: powering a
     *  second card takes an explicit re-drop. */
    refreshed?: boolean;
    /** The board may attach a drag gesture to this die. Computed HERE (not in
     *  the render) so it can never depend on transient drag state — flipping
     *  it mid-drag unmounts the GestureDetector, which on web kills the pan
     *  without onEnd/onFinalize (the stuck-ghost / dead-drop bug). */
    draggable: boolean;
    /** Spec 33 (Phase D6a, FLAG-ON ONLY) — the rolled gear face: `mana` powers a
     *  card of its color (the normal look), `special` also fires its +◆ payload
     *  (the marked face), `miss` is DEAD (unpowerable). ABSENT flag-off — a die
     *  is color-only there, so the whole VM stays byte-identical. */
    face?: 'special' | 'mana' | 'miss';
    /** Spec 33 §6 (Phase D6a, FLAG-ON ONLY) — an OVERHEAT crack forced this
     *  die's color all-miss this round; it reads as a distinct struck-out state
     *  and is excluded from Press Fate. ABSENT flag-off. */
    cracked?: boolean;
}
/**
 * THE COLOR LAW, UI-side (owner directive 2026-07-12: the board must PREVENT
 * illegal die placement, not let the play fizzle).
 *
 * Rule source — the ENGINE, not this file: `playCombatCard`'s COLOR LAW gate
 * (axiomancer-mechanics src/Combat/combat.engine.ts ~:1339 — a die powers only
 * a card of ITS color; WILD is the sole exception; a fate-X play acts wild but
 * rides its own tap path, never a drag) and `combatDieCanPower`
 * (src/Combat/combat.dice.ts), which additionally wants the die's live
 * `state`. The board only holds VMs mid-drag, so this derives the SAME verdict
 * from the VM's color fields; spent/drafted/X gating stays where it already
 * lives (CombatDieVM.draggable + the board's pending-die checks). Reserve and
 * floating dice obey the same law — the engine checks every power source
 * alike.
 */
export function dieCanPowerCardVM(
    die: { color: string; isX?: boolean; face?: 'special' | 'mana' | 'miss' },
    cardStance: string,
): boolean {
    if (die.isX || die.color === 'x') return false;
    // Spec 33 (flag-on): a MISS face is dead — it powers nothing, so any drop
    // is refused just like an off-color one. Flag-off dice carry no `.face`,
    // so this check never fires and the verdict is byte-identical.
    if (die.face === 'miss') return false;
    if (cardStance === 'wild') return true;   // parity with combatDieCanPower
    // Phase 104 — a grey card ('any') is powered by every non-X, non-miss die.
    if (cardStance === 'any') return true;
    return die.color === 'wild' || die.color === cardStance;
}

export type CombatCardKind =
    | 'dot' | 'stun' | 'regen' | 'guard' | 'weaken' | 'inert' | 'befriend'
    // ── mechanics 0.34.0 — newly REAL in the HP engine ──
    | 'vulnerable'   // debuff_vulnerable / debuff_vulnerability_* — foe takes +N% damage
    | 'mark'         // spec 32 v3 — universal exposure: +N per DoT tick per stack
    | 'backfire'     // spec 32 v3 — the enemy takes N per action rung it loses
    | 'rupture'      // detonate stored afflictions (live total → a word, no fabricated number)
    | 'reap'         // spec 32 v3 — spend Souls for a burst (live total → a word)
    | 'oath'         // spec 32 v3 — persistent player-side passive (rest of combat; spec 34 R-9: was 'enchant')
    | 'hex'          // spec 32 v3 — standing curse attached to the enemy (spec 34 R-10: was 'disenchant')
    | 'forge'        // die-manipulation verbs (FORGE / KINDLE / PIP / TRANSMUTE)
    | 'barrier'      // stacking soak shield on YOU
    | 'thorns'       // reflect attacker damage back
    | 'siphon'       // heal for a % of the damage dealt
    | 'riposte'      // counter the next hit + reduce it
    // ── card-overhaul (2026-07-03) — 6 new status effects the honesty gate missed ──
    | 'exposure'      // debuff_exposure → real -N DEF number
    | 'doubt'         // debuff_doubt → forces the foe's next play to weak-tier (qualitative)
    | 'sensoryNull'   // debuff_sensory_null → blocks advantage reads / dulls control (qualitative)
    | 'isolated'      // debuff_isolated → denies ally-buff targeting (qualitative)
    | 'overextended'  // debuff_overextended → self-cost: your next play is weakened (qualitative)
    | 'clarity'       // buff_clarity → next die counts as WILD
    | 'resolute'      // buff_resolute → real -N% damage-taken reduction (the inverse of vulnerable)
    // ── card-honesty (2026-07-10) — the generic MECHANIC-LED face ──
    | 'mechanic';     // a specialMechanics verb (STAGGER / PLEA / SENTENCE / …) or a
                      // rider-carried verb (DRAW / HEAL / …) is the card's paid identity;
                      // keyword + value come from the mechanic, never a fabricated fallback

/** Render-ready, HONEST card FACE. Every number is a real unit derived from the
 *  card's AUTHORED effect (never the abstract "impact"). `heroText` is '' when the
 *  kind has no honest number (strike/weaken/inert/befriend) — the face renders a
 *  qualitative word there instead. Real-units-or-no-number: never a fabricated value. */
export interface CombatCardFaceVM {
    kind: CombatCardKind;
    keyword: string | null;        // UPPERCASE keyword for the face (e.g. 'BLEED')
    glyph: string;                 // sourced from statusGlyphs → matches the board chip
    /** The FREE effect's glyph — the hero mark for the dieless play (top-left of
     *  the rail face). Derived from the free rider's effect / keyword; '' when
     *  the card has no free line. */
    freeGlyph: string;
    /** The keyword behind `freeGlyph` (e.g. 'BLEED', 'GUARD'); the face uses it
     *  to draw the effect's SILHOUETTE (glyphShapes.ts) instead of the text
     *  rune when a shape exists. null = no free line. */
    freeGlyphKey: string | null;
    categoryColor: string;
    stanceColor: string;
    heroText: string;              // POWER value in real units; '' = no honest number
    heroSub: string | null;        // e.g. '(18)'
    freeHeroText: string;          // the no-die value
    freeHeroSub: string | null;
    /** Option A split rail (owner-picked 2026-07-09) — the FREE column's
     *  KEYWORD · value projection of the authored free rider (e.g. TICK · 1).
     *  null keyword = no free effect (or, on a persistent card, the timed
     *  '3 rounds' instance); the overlay's freePill keeps the full prose. */
    freeKeyword: string | null;
    freeValue: string | null;
    /** Option A type strip at the card foot — 'BODY · SPELL' (HEX for
     *  a curse card). */
    typeStrip: string;
    verbLine: string;              // plain who/what
    powerRail: string;
    readDependent: boolean;        // the read scales this: guard/strike (damage mult) AND
                                   // dot/vulnerable (status mult — the read now bites status)
    inert: boolean;                // engine doesn't read it yet → greyed, no number
    guardBase: number | null;
    statusBase: number | null;     // read-scalable status number (DoT total / Vulnerable %) — armed display
    /** P0-truth: the EXACT armed values under the deterministic read rule
     *  (▲ +1 intensity / ▼ −1 turn) — no multiplier approximations. */
    statusAdv: number | null;
    statusDis: number | null;
}

/** Render-ready card DETAIL (the inspect modal) — the SAME numbers as the face. */
export interface CombatCardDetailVM {
    subtitle: string;
    metaChip: string;
    outcomeLine: string;
    outcomeStats: { label: string; value: string }[];
    stacksText: string | null;
    freeLine: string;
    powerLine: string;
    readNote: string;
    mathLine: string;
    keywords: { name: string; def: string; minor: boolean }[];
    // ── The +DIE row (card-wording audit 2026-07-12: the NO-DIE pill was a
    //    pure duplicate of the face's ◇ rail and is no longer rendered; this
    //    row keeps only what the face cannot carry) ──
    /** The no-die (free) value — the full-truth authored line (the face's ◇
     *  rail is its terse projection). Kept as a presenter truth surface. */
    freePill: string;
    /** The FULL paid line — EVERY clause a die-powered play fires, in authored
     *  order, derived from `paidClauses()` in mechanics
     *  ('DEAL 20  +  CURDLE …  +  HEAL 16'). Null only for a card that prints
     *  no payload at all (a persistent card with no authored summary). */
    diePaidLine: string | null;
    /** The exact ▲/—/▼ read triplet for read-scaled kinds (guard/barrier/
     *  dot/vulnerable); null otherwise. */
    dieTriplet: string | null;
    /** One global legend decoding ▲/—/▼ — non-null exactly when `dieTriplet`
     *  renders (the most-cited undefined notation of the 10-deck playtest). */
    readLegend: string | null;
    /** Persistent cards: the free-vs-paid duration fact as one footer line
     *  ('3 rounds free · permanent with a die'); null on spells. */
    durationFooter: string | null;
    /** The colour-match rule — rendered ONCE per modal (not per powerLine). */
    colorMatchHint: string;
    /** 2026-07-12 (owner playtest) — the per-card slice of the systems
     *  glossary: ONLY the system terms this card's printed lines reference
     *  (and that no keyword chip already explains). Replaces the KW-7 dump of
     *  all six entries on every inspect. */
    systemTerms: { term: string; def: string }[];
    /** D4 — the rarity band's player-facing name ('Common' / 'Uncommon' /
     *  'Rare'), from the wave-0 `card-rarity.engine` module. */
    rarityLabel: string;
    /** D4 — how many pips to draw. The COUNT is the greyscale-safe signal. */
    rarityPips: number;
    /** D4 — the band's hue. Never render it as the only rarity cue. */
    rarityColor: string;
    /** The ◇ row's tag. 2026-09-21 (W3, finding 3): a persistent card's free
     *  duration rides the tag it qualifies instead of a separate footer row. */
    freeTag: string;
    /** The ◆ row's tag, carrying the fact the row's own decision needs — the
     *  colour law on a spell ('+DIE · HEART/WILD'), the permanence on a
     *  persistent card. Both used to be standalone prose rows. */
    paidTag: string;
}

/** detailStats' switch builds everything BUT the pill fields; the wrapper appends them. */
type DetailCore = Omit<CombatCardDetailVM,
    'freePill' | 'diePaidLine' | 'dieTriplet' | 'readLegend' | 'durationFooter' | 'colorMatchHint' | 'systemTerms'
    | 'rarityLabel' | 'rarityPips' | 'rarityColor' | 'freeTag' | 'paidTag'>;

export interface CombatCardVM {
    uid: string; cardId: string; name: string; stance: string; stanceColor: string;
    verbClass: string; effectKind: 'dot' | 'control' | 'none';
    /** Spec 32 v3 — rarity band derived from the rank ladder. The RARE frame
     *  keys off `rarity === 'rare'` (the gold tier is gone). */
    rarity?: 'common' | 'uncommon' | 'rare';
    /** Spec 32 v3 — rank 1-6 (Ash → Saint) + its printed name. */
    rank?: 1 | 2 | 3 | 4 | 5 | 6;
    rankName: string | null;
    /** Spec 32 v3 — spell / oath / hex. */
    cardType?: 'spell' | 'oath' | 'hex';
    tier: 1 | 2 | 3;
    topActionText: string; bottomActionText: string; bottomDamagePreview: number;
    /** Fate Engine P1 — the card's printed die lines (real units), if any. */
    dieLines?: string[];
    /** Honest, render-ready 5-zone face — real units, zero abstraction. */
    face: CombatCardFaceVM;
    /** Honest, render-ready inspect detail (outcome + free/die + math + keywords). */
    detail: CombatCardDetailVM;
    /** Read tier if powered with the current drafted die (null until a die is drafted). */
    read: CombatReadResult | null; colorMatch: boolean;
    /** Authored flavor prose (`Card.description`) — overlay BOTTOM only, never
     *  on the face (owner directive 2026-07-09: the face is purely functional). */
    flavor: string | null;
    /** WS7.2 chosen X-cost (`recoil_x`): the ENGINE's live clamp range
     *  (`recoilXRange` — min = printed floor, max = affordable). Non-null only
     *  when the card carries an X mechanic; the board shows the stepper off
     *  this and passes the pick through the play call as `chosenX`. */
    chooseX: { min: number; max: number } | null;
    /** phase 28 — true for a `reprise`-mechanic card: APPLYing it should prompt
     *  the discard-pile songbook picker instead of going straight to the
     *  engine's default highest-rank auto-pick. */
    needsReprisalChoice: boolean;
}
export interface CombatSignatureVM {
    id: string; name: string; description: string; cost: number; affordable: boolean; icon: string;
    /** The refusal reason while the rune can't fire (null when castable). Only
     *  the flag-on Press Fate rune carries reasons beyond affordability (once
     *  per round / no miss dice) — see `signaturesVM`'s spec-33 reshape. */
    reason?: string | null;
}
export interface CombatReadVM {
    active: boolean; result: CombatReadResult; dieStance: string; enemyStance: string | null;
    text: string;
}
/** phase 28 — the Charge track + CONDEMN beat (Sentence theme). Was fully
 *  engine-side state with zero combat-UI rendering before this phase. */
export interface CombatPerorationVM {
    active: boolean;
    premises: number;
    /** Charge count at which the declared card's rider fires (tally resets). */
    at: number;
    /** Charge count at which the fight ends outright (CONDEMN) — tier-floored
     *  by enemy difficulty; null if the declared card carries no concede line. */
    concedeAt: number | null;
    cardName: string;
}
/**
 * Spec 33 §4 (Phase D6a, FLAG-ON ONLY) — the Press Fate control: a 1◆ reroll of
 * every live miss face, once per round (the flag-on `sig-press-the-point`
 * reroll). Owner-UI doctrine: the control is never hidden — when it can't fire
 * it renders DISABLED with the reason, so the illegal action is refused loudly.
 * `null` flag-off, or when the loadout carries no reroll signature to cast.
 */
export interface CombatPressFateVM {
    /** The reroll signature the board casts (via `playSignatureSkill`). */
    signatureId: string;
    /** The flag-on price (`PRESS_FATE_COST`, 1◆). */
    cost: number;
    /** True only when the reroll can actually fire right now. */
    enabled: boolean;
    /** The refusal reason to show when disabled; null when enabled. */
    reason: string | null;
}
/**
 * Spec 33 §3 (Phase D6b, FLAG-ON ONLY) — the Momentum-V2 chain chip. Replaces
 * the three-node wheel's `{ lit, charged }` read: spec-33 momentum is a single
 * chain `{ color, length }`. A BREAK collapses it to null and the chip must
 * teach that LOUDLY; a SURGE forges a temporary gold die and also resets. Both
 * transient states are derived from the event log (the null value alone can't
 * tell an empty chain from a just-broken one).
 */
export interface CombatMomentumV2VM {
    /** The chain's live color (the last chained stance), or null when no chain. */
    color: WheelStance | null;
    /** The chain length (0 when null; 1..surgeAt-1 while building). */
    length: number;
    /** The filled links IN PLAY ORDER (derived from color+length via the chain
     *  order) — e.g. heart→body reads ['heart','body'], so each lit node keeps
     *  the stance that was actually played, not the chain's current color. */
    chain: WheelStance[];
    /** The chain length that surges (`MOMENTUM_SURGE_LENGTH`). */
    surgeAt: number;
    /** The stance that ADVANCES the chain next (null when no chain). */
    next: WheelStance | null;
    /** LOUD state — the chain just BROKE to null (owner-locked strict rule). */
    broke: boolean;
    /** Celebratory state — the chain just SURGED (gold die granted). */
    surged: boolean;
    /** The chain color's palette hex (neutral when null). */
    colorHex: string;
    a11y: string;
}
/**
 * Spec 33 §2 (Phase D6b, FLAG-ON ONLY) — the player's CURRENT stance chip (the
 * stance of the last PAID card). A clear "no stance" renders when null.
 */
export interface CombatStanceChipVM {
    stance: WheelStance | null;
    label: string;   // 'HEART' / 'NO STANCE'
    glyph: string;   // the stance glyph / '—'
    colorHex: string;
    /** Cluster S1-board-C34 — the empty state's INSTRUCTION: the action that
     *  fills the chip ('PLAY A PAID CARD'). Null once a stance is held, where
     *  the value is the whole answer. */
    hint: string | null;
    a11y: string;
}
/** Spec 33 §6 (Phase D6b) — one die's gear slot in the rail + inspection VM. */
export interface CombatDieGearSlotVM {
    color: 'heart' | 'body' | 'mind' | 'wild';
    label: string;   // 'HEART' / 'WILD'
    glyph: string;
    colorHex: string;
    specialFaces: number;
    manaFaces: number;
    missFaces: number;
    specialConviction: number;
    /** Terse face table, e.g. '1 special · 2 mana · 3 miss'. */
    faceTable: string;
    /** Payload text for the BOON face, e.g. '+2 ◆'. */
    payload: string;
    /** True when this slot's gear differs from the stock default (upgraded). */
    upgraded: boolean;
    a11y: string;
}
/** Spec 33 §6 (Phase D6b, FLAG-ON ONLY) — the 4-slot die-gear rail. */
export interface CombatDieGearRailVM {
    slots: CombatDieGearSlotVM[];   // heart, body, mind, wild (rail order)
}
export interface CombatViewModel {
    phase: CombatEncounterState['phase'];
    enemy: CombatEnemyPaneVM;
    player: CombatPlayerPaneVM;
    dice: CombatDieVM[];
    drafted: boolean;           // a USABLE drafted die exists (powers a card)
    hasDraft: boolean;          // a die has been drafted this turn (may be spent)
    needsDraft: boolean;        // dice present, none drafted yet
    diceRolled: boolean;        // a turn pool exists
    read: CombatReadVM;
    conviction: number;
    signatures: CombatSignatureVM[];
    hand: CombatCardVM[];
    // ── Fate Engine P1 ──
    /** Room left in the Reserve (drives the bank-or-burn chip). */
    reserveRoom: boolean;
    /** The encounter's Resonance tally (thresholds key off this). */
    resonance: { heart: number; body: number; mind: number };
    ledger: ('clear' | 'overwhelmed' | 'pending')[];
    phaseBadge: string;
    roundLabel: string;
    turnLabel: string;
    deckCount: number;
    discardCount: number;
    /** phase 28 — discard-pile card ids + names, for the REPRISE songbook picker. */
    discardCards: { id: string; name: string }[];
    /** phase 28 — the Premise track + CONDEMN beat. */
    peroration: CombatPerorationVM;
    /** Phase 31 — the engine-native momentum wheel's lit nodes (empty = no
     *  cycle in progress). `charged` mirrors the panel's old derivation: a
     *  live, unspent `momentum-`-prefixed die in {@link dice} IS the charge. */
    momentum: { lit: WheelStance[]; charged: boolean };
    /** Spec 33 §4 (flag-on) — the Press Fate reroll affordance, or null (flag-off
     *  / no reroll signature in the loadout). */
    pressFate: CombatPressFateVM | null;
    /** Spec 33 §3 (Phase D6b, flag-on) — the Momentum-V2 chain chip, or null
     *  flag-off (the old three-node `momentum` wheel renders instead). */
    momentumV2: CombatMomentumV2VM | null;
    /** Spec 33 §2 (Phase D6b, flag-on) — the player's current-stance chip, or
     *  null flag-off. */
    playerStance: CombatStanceChipVM | null;
    /** Spec 33 §6 (Phase D6b, flag-on) — the die-gear rail, or null flag-off. */
    dieGear: CombatDieGearRailVM | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function currentPhase(state: CombatEncounterState): CombatThreatPhase | undefined {
    return state.threatPhases[Math.min(state.currentPhaseIndex, state.threatPhases.length - 1)];
}

function chips(effects: { effectId: string; intensity: number; remainingDuration: number }[]): CombatEffectChipVM[] {
    return effects.map(ae => {
        const def = lookupEffect(ae.effectId) ?? { id: ae.effectId };
        const glyph = effectGlyph(def as Parameters<typeof effectGlyph>[0]);
        const kw = keywordForEffect(ae.effectId);
        return {
            effectId: ae.effectId, intensity: ae.intensity, duration: ae.remainingDuration,
            // Show the keyword on the chip's label (a11y/tooltip) instead of the thematic name.
            glyph: kw ? { ...glyph, label: kw } : glyph,
            gloss: keywordGloss(kw),
        };
    });
}

/** E-fix (card-wording audit 2026-07-12) — the sweep's single most
 *  consequential legibility gap: a persistent card's standing passive is gated
 *  by CARD ID at its engine trigger sites (`zoneHas`), never by an applied
 *  effect id, so the board showed NOTHING while an enchantment or curse was
 *  attached. Synthesize a standing chip per zone entry — ❖ enchantment, ☒
 *  curse — labelled from the card, glossed from its authored passive summary
 *  (`Card.persistentEffect`). Presentation-only (ADR-0001/0003). */
function standingChips(
    permanent: readonly string[],
    timed: readonly { cardId: string; roundsLeft: number }[],
    kind: 'enchant' | 'curse',
): CombatEffectChipVM[] {
    const entries = [
        ...permanent.map(id => ({ id, rounds: 0 })),
        ...timed.map(t => ({ id: t.cardId, rounds: t.roundsLeft })),
    ];
    return entries.flatMap(({ id, rounds }) => {
        const src = getCardById(id);
        if (!src) return [];
        return [{
            effectId: id, intensity: 1, duration: rounds, standing: true,
            glyph: kind === 'enchant'
                ? { glyph: '❖', color: ENCHANT_COLOR, kind: 'statup' as const, label: src.name }
                : { glyph: '☒', color: GLYPH_COLORS.control, kind: 'statdown' as const, label: src.name },
            gloss: src.persistentEffect ?? null,
        }];
    });
}

/**
 * THE BIG NUMBERS REWRITE (2026-09-02) — the foe's own keywords, as chips.
 *
 * HIDE / SWIFT / BRUTAL / VENOM / UNSHAKEN / ELUSIVE / REGROW / RAVENOUS /
 * WOUNDING change the arithmetic of the fight before a single card is played,
 * and a player who cannot see them is doing sums with a hidden term. They ride
 * the SAME chip VM as a status (and so the same tap-to-explain plaque): the
 * label is the engine's printed token, the gloss its reminder text with this
 * foe's own number already in it.
 *
 * `standing` is set for the valueless words (BRUTAL, SWIFT) so no meaningless
 * "1" badge renders; a numbered keyword (HIDE 6) carries its number as the
 * badge, exactly as an intensity would.
 */
function enemyKeywordChips(enemy: { keywords?: readonly EnemyKeyword[] }): CombatEffectChipVM[] {
    return (enemy.keywords ?? []).map((k) => {
        const { label, gloss } = enemyKeywordChip(k);
        const n = 'n' in k ? k.n : null;
        return {
            effectId: `enemy-keyword-${k.kind}`,
            intensity: n ?? 1,
            duration: 0,
            standing: n === null,
            glyph: { glyph: ENEMY_KEYWORD_GLYPHS[k.kind], color: ENEMY_KEYWORD_COLOR, kind: 'statdown' as const, label },
            gloss,
        };
    });
}

/** WS9 — maps a phase's branch payload to the fork telegraph (null if linear). */
function branchVM(phase: CombatThreatPhase | undefined): CombatIntentBranchVM | null {
    const b = phase?.branch;
    if (!b) return null;
    return {
        condition: b.conditionText,
        thenText: b.then.threatAction.description,
        elseText: b.else.threatAction.description,
        taken: b.taken ?? null,
    };
}

/** Spec 33 §5 (Phase D6b, flag-on) — the OPEN stance-check telegraph for a
 *  phase. Reads D6e's authored `punishes`/`yields`, previews what the player's
 *  CURRENT stance walks into, and surfaces the last resolved outcome from the
 *  event log. Null when the flag is off or the phase carries no check. */
function stanceCheckVM(
    state: CombatEncounterState,
    phase: CombatThreatPhase | undefined,
    phaseIndex: number,
): CombatStanceCheckVM | null {
    if (!isUpgradeableDiceEnabled()) return null;
    const check = phase?.stanceCheck;
    if (!check || (!check.punishes && !check.yields)) return null;
    const punishes = (check.punishes ?? null) as WheelStance | null;
    const yields = (check.yields ?? null) as WheelStance | null;
    const adv = READ_DAMAGE_MULT.advantage;      // ×1.5
    const dis = READ_DAMAGE_MULT.disadvantage;   // ×0.5
    const punishesText = punishes ? `Punishes ${STANCE_LABELS[punishes]} ×${adv}` : null;
    const yieldsText = yields ? `Yields to ${STANCE_LABELS[yields]} ×${dis} +1◆` : null;
    // Live preview — where the player's CURRENT stance stands vs this check.
    const stance = state.playerStance ?? null;
    const live: 'punished' | 'yielded' | 'none' =
        stance && punishes === stance ? 'punished'
            : stance && yields === stance ? 'yielded'
                : 'none';
    // Last resolved outcome for THIS phase (the engine logs it at phase end).
    let resolution: CombatStanceCheckVM['resolution'] = null;
    for (let i = state.log.length - 1; i >= 0; i--) {
        const ev = state.log[i];
        if (ev.kind === 'stance-check-resolved' && ev.phaseIndex === phaseIndex) {
            // Playtest 2026-09-04 — the NONE outcome used to print "No stance
            // check" directly under the "Punishes X / Yields to Y" telegraph,
            // which read as a contradiction (the check exists; the player's
            // stance simply matched neither side). Say what happened.
            resolution = {
                outcome: ev.outcome, stance: ev.stance,
                text: ev.outcome === 'punished' ? `Punished ×${adv}`
                    : ev.outcome === 'yielded' ? `Yielded ×${dis} +1◆`
                        : ev.stance ? `${STANCE_LABELS[ev.stance] ?? ev.stance} — neither, ×1`
                            : 'No stance — neither, ×1',
            };
            break;
        }
    }
    return { punishes, yields, punishesText, yieldsText, live, resolution };
}

// ── The enemy's played "card" (the after-the-fact reveal) ────────────────────

/** One structured line off the resolved threat action ("6 DAMAGE", "POISON ×2").
 *  `source` says whose payload it is: a `telegraph` line is the foe's OWN
 *  announced action (struck through on the card when the player denied it), a
 *  `brood` line is what the adds took anyway. The brood bites outside the
 *  engine's `!hindered` gate, so a brood line must never read as averted. */
export interface EnemyActionLineVM { text: string; color: string; source: 'telegraph' | 'brood' }

/**
 * What the enemy just did, shaped as a card the player can read for a beat
 * after END PHASE. The enemy plays no literal cards — it has a telegraphed
 * threat sequence — so this is that phase's action rendered in the same
 * vocabulary the player's own cards use.
 */
export interface EnemyActionCardVM {
    /** Phase number as telegraphed in the reveal ("PHASE 2"). */
    phaseIndex: number;
    icon: string;
    /** ATTACKS / WEAKENS / … — the intent word, or the phase's authored label. */
    label: string;
    color: string;
    /** The authored action sentence, parenthetical payload stripped (that
     *  payload is the `lines` below, so printing both reads as a stutter). */
    actionText: string;
    lines: EnemyActionLineVM[];
    /** The foe's OWN blow never fired — the player's control held it. This is
     *  narrower than "nothing landed": the brood bites OUTSIDE the engine's
     *  `!hindered` gate, so `addDealt` below can still be positive on a denied
     *  phase. `telegraph` lines read as what was averted; `brood` lines read as
     *  what landed regardless. */
    denied: boolean;
    /** VITAE the brood took during this phase — 0 when there was no brood on
     *  the board, or when the wall soaked all of it. */
    addDealt: number;
}

/** `buildThreatAction` prints `${actionText} (${parts}).` — keep the sentence,
 *  drop the payload parenthetical (the structured `lines` carry it, brighter).
 *  A description in any other shape falls through unchanged. */
function stripThreatPayload(description: string): string {
    const m = /^(.*?)\s*\([^()]*\)\.?$/.exec(description.trim());
    return (m ? m[1] : description.replace(/\.$/, '')).trim();
}

/** The payload of a resolved threat action, in the keyword vocabulary. */
function enemyActionLines(effects: readonly CombatThreatEffect[]): EnemyActionLineVM[] {
    const lines: EnemyActionLineVM[] = [];
    for (const e of effects) {
        if (e.damage && e.damage > 0) lines.push({ text: `${e.damage} DAMAGE`, color: INTENT_ICONS.damage.color, source: 'telegraph' });
        if (e.effectId) {
            const effect = lookupEffect(e.effectId);
            const kw = keywordForEffect(e.effectId) ?? effect?.name ?? e.effectId;
            const intensity = e.intensity ?? 1;
            lines.push({
                text: `${kw.toUpperCase()}${intensity > 1 ? ` ×${intensity}` : ''}`,
                color: effect ? effectGlyph(effect).color : INTENT_ICONS.debuff.color,
                source: 'telegraph',
            });
        }
        if (e.enemyHeal && e.enemyHeal > 0) lines.push({ text: `HEALS ${e.enemyHeal}`, color: INTENT_ICONS.buff.color, source: 'telegraph' });
        if (e.enemyCleanse && e.enemyCleanse > 0) lines.push({ text: `SHEDS ${e.enemyCleanse}`, color: INTENT_ICONS.buff.color, source: 'telegraph' });
        if (e.swayCleanse && e.swayCleanse > 0) lines.push({ text: `−${e.swayCleanse} PLEA`, color: INTENT_ICONS.debuff.color, source: 'telegraph' });
        if (e.premiseShed && e.premiseShed > 0) lines.push({ text: `−${e.premiseShed} PREMISE`, color: INTENT_ICONS.debuff.color, source: 'telegraph' });
        if (e.glyphShatter) lines.push({ text: 'SHATTERS A GLYPH', color: INTENT_ICONS.debuff.color, source: 'telegraph' });
        if (e.curseCardId) lines.push({ text: 'CURSES YOUR DECK', color: INTENT_ICONS.debuff.color, source: 'telegraph' });
    }
    return lines;
}

/**
 * The enemy's turn, read back off the resolved event stream. Returns null when
 * the bump carried no threat resolution at all (a card APPLY, a fate tap) — the
 * reveal is for the enemy's turn only, never the player's own plays.
 *
 * `state` is the POST-resolution state; `threatPhases` is the enemy's fixed
 * sequence, so the fired phase is still addressable by its telegraph index.
 */
export function selectEnemyActionCard(
    events: readonly CombatEvent[],
    state: CombatEncounterState,
): EnemyActionCardVM | null {
    const fired = events.find((e) => e.kind === 'threat-fired');
    const resolved = events.find((e) => e.kind === 'phase-resolved');
    if (!fired && !resolved) return null;
    const phaseIndex = fired ? fired.phaseIndex : resolved!.phaseIndex;
    const phase = state.threatPhases.find((p) => p.index === phaseIndex);
    // A hindered phase emits `phase-resolved` with mark 'clear' and no
    // 'threat-fired' — the action the player DENIED still deserves the card
    // (it is the proof their control worked), read off the phase itself.
    const denied = !fired;
    const description = fired ? fired.description : phase?.threatAction.description ?? '';
    if (description.length === 0) return null;
    const effects = fired ? fired.effects : phase?.threatAction.effects ?? [];
    const meta = INTENT_ICONS[(phase?.intentType ?? 'pass') as CombatIntentType];
    // Phase 102 — the brood bites in its own `add-bit` event, outside the
    // engine's `!hindered` gate. A card built from the telegraph alone called
    // a phase that cost real VITAE "denied — none of it landed" (burn-day
    // audit 3.3), so the bite rides here as a line of its own.
    const addDealt = events.reduce((n, e) => (e.kind === 'add-bit' ? n + e.dealt : n), 0);
    const lines = enemyActionLines(effects);
    if (addDealt > 0) lines.push({ text: `BROOD −${addDealt}`, color: ADD_COLOR, source: 'brood' });
    return {
        phaseIndex,
        icon: meta.icon,
        label: phase?.intentLabel ?? meta.label,
        color: meta.color,
        actionText: stripThreatPayload(description),
        lines,
        denied,
        addDealt,
    };
}

/**
 * THE BIG NUMBERS REWRITE (2026-09-02) — the combat log's narration of the
 * rewrite's own events.
 *
 * Everything the engine emits should be legible, and the seven new ledgers
 * (WRATH / CHAIN / FLAY / TWIN / OVERKILL) plus the two ENEMY beats (a foe
 * changing STAGE, a foe's keyword changing the arithmetic) were landing
 * silently: the numbers moved and the player was never told which word moved
 * them. This is the mapping, and the only place the words live.
 *
 * `text` is the log sentence; `float` is the short token the battlefield rises
 * over the combatant (null = log only), so the two surfaces can never drift
 * apart. Events with no line here are handled elsewhere (damage, DoT ticks,
 * status applications) and are deliberately absent rather than duplicated.
 *
 * Corrected 2026-09-20 (burn-day audit 3.4): that last sentence was read as
 * blanket permission, and four kinds the engine emits were handled NOWHERE
 * else — the brood's `add-spawned` / `add-bit` / `add-struck` and the strike's
 * `effect-fizzled` all fell to `default:` and vanished from the log, the
 * history and the float layer at once. "Absent because it is handled
 * elsewhere" is only honest when the other surface actually exists and can be
 * named. `add-bit` is the shape of the exception: it belongs in the LOG,
 * which nothing else writes, and NOT in the float layer, which the pilgrim's
 * medallion and the pane's `DENIED · BROOD −N` already own (audit 3.3) —
 * hence a line with `float: null`. A kind with no arm at all must be one no
 * surface narrates.
 */
export interface CombatLogLineVM {
    kind: CombatEvent['kind'];
    text: string;
    float: string | null;
    color: string;
    /** The pane the beat belongs to — the foe's, or yours. */
    side: 'enemy' | 'player';
}

const LOG_STAGE_COLOR = '#d9b44a';

export function selectCombatLogLines(events: readonly CombatEvent[]): CombatLogLineVM[] {
    const out: CombatLogLineVM[] = [];
    for (const e of events) {
        switch (e.kind) {
            // The loud one. A foe crossing a stage threshold is a different
            // fight from the one you started, and it is announced as such.
            case 'stage-entered':
                out.push({
                    kind: e.kind, side: 'enemy', color: LOG_STAGE_COLOR,
                    text: `‡ ${e.name.toUpperCase()} ‡ ${e.text}`,
                    float: `‡ ${e.name.toUpperCase()} ‡`,
                });
                break;
            // The foe's own vocabulary, firing. `keyword` is the printed token
            // ('SWIFT', 'HIDE 6'); its reminder text rides along so the log
            // teaches the word the first time it bites.
            case 'enemy-keyword-fired': {
                const gloss = enemyKeywordGlossForToken(e.keyword);
                const bite = e.amount === undefined ? '' : ` for ${e.amount}`;
                out.push({
                    kind: e.kind, side: 'enemy', color: ENEMY_KEYWORD_COLOR,
                    text: `${e.keyword} answers${bite}.${gloss ? ` ${gloss}` : ''}`,
                    float: `${e.keyword}${bite}`,
                });
                break;
            }
            case 'wrath-gained':
                out.push({
                    kind: e.kind, side: 'player', color: GLYPH_COLORS.dot,
                    text: `WRATH +${e.amount}. Every blow you land now carries ${e.total} more, and it will not fade.`,
                    float: `WRATH +${e.amount}`,
                });
                break;
            case 'flay-applied':
                out.push({
                    kind: e.kind, side: 'enemy', color: GLYPH_COLORS.statdown,
                    text: `FLAY +${e.amount}. The foe is open to your next ${e.total} hit${e.total === 1 ? '' : 's'}.`,
                    float: `FLAY +${e.amount}`,
                });
                break;
            case 'chain-gained':
                out.push({
                    kind: e.kind, side: 'player', color: GLYPH_COLORS.advantage,
                    text: `CHAIN +${e.amount}. Your next hit lands ${e.total} heavier.`,
                    float: `CHAIN +${e.amount}`,
                });
                break;
            case 'chain-faded':
                out.push({
                    kind: e.kind, side: 'player', color: GLYPH_COLORS.thorns,
                    text: `The chain slackens. ${e.from} went unspent and is gone.`,
                    float: 'CHAIN LOST',
                });
                break;
            case 'twin-armed':
                out.push({
                    kind: e.kind, side: 'player', color: GLYPH_COLORS.control,
                    text: 'TWIN. The next word you say this turn is said twice.',
                    float: 'TWIN',
                });
                break;
            case 'twin-fired':
                out.push({
                    kind: e.kind, side: 'enemy', color: GLYPH_COLORS.control,
                    text: 'The word is said twice.',
                    float: 'TWINNED',
                });
                break;
            case 'overkill-cashed':
                out.push({
                    kind: e.kind, side: 'player', color: PAYOFF_COLOR,
                    text: `OVERKILL. ${e.excess} past the killing blow, and none of it wasted.`,
                    float: `OVERKILL ${e.excess}`,
                });
                break;
            // Playtest fix 2026-09-04 — three silent ledgers. The foe's bar
            // climbed with no line saying WHY, and the PLEA tally fell twice a
            // round (a THREAT cleanse, then the turn-boundary decay) with no
            // narration of either. Zero-amount heals (RAVENOUS at full VITAE)
            // never emit, so no guard is needed here.
            case 'enemy-healed': {
                const why = e.source === 'RAVENOUS' ? 'RAVENOUS. It drinks what it dealt'
                    : e.source === 'REGROW' ? 'REGROW. It knits'
                    : e.source === 'STAGE' ? 'The new STAGE restores'
                    : 'Its threat restores';
                out.push({
                    kind: e.kind, side: 'enemy', color: GLYPH_COLORS.regen,
                    text: `${why} — VITAE +${e.amount}.`,
                    float: `+${e.amount}`,
                });
                break;
            }
            case 'threat-sway-cleansed':
                out.push({
                    kind: e.kind, side: 'enemy', color: GLYPH_COLORS.statdown,
                    text: `The foe shakes off your plea. PLEA −${e.amount}.`,
                    float: `PLEA −${e.amount}`,
                });
                break;
            case 'sway-decayed':
                out.push({
                    kind: e.kind, side: 'enemy', color: GLYPH_COLORS.thorns,
                    text: `Your plea fades between turns. PLEA −${SWAY_DECAY_PER_TURN} (${e.total} holds).`,
                    float: null,
                });
                break;
            // ── Phase 102 (SUMMON) — the brood, narrated (burn-day audit 3.4)
            //
            // The engine emitted all three of these plus the strike's refusal
            // into `state.log` and this switch had no arm for any of them, so
            // they fell to `default:` and the log, the history and the float
            // layer went silent together. A player ate a bite, watched VITAE
            // fall, and found nothing anywhere naming what took it.
            //
            // Deliberately NOT led by the word SUMMON: a STAGE that grants the
            // keyword emits `enemy-keyword-fired` with the face string
            // `SUMMON 2` on the very boundary this wave spawns on, and two
            // sentences opening on the same word is the duplication this
            // docblock forbids.
            case 'add-spawned': {
                const n = e.addIds.length;
                out.push({
                    kind: e.kind, side: 'enemy', color: ADD_COLOR,
                    text: `The foe fields ${n} more ${n === 1 ? 'body' : 'bodies'}. Each bites you for ${e.bite} every phase, even while the foe is denied.`,
                    float: `BROOD +${n}`,
                });
                break;
            }
            // Both numbers, because the wall math is the decision the readout
            // is asking the player to make. LOG-ONLY on purpose: the bite's
            // float already lives on the pilgrim's own medallion, in this
            // colour, and rides the pane's `DENIED · BROOD −N` composite
            // (audit 3.3) — a token here would be a third shout for one bite,
            // pushed over the FOE's pane at that.
            case 'add-bit': {
                const soaked = Math.max(0, e.raw - e.dealt);
                out.push({
                    kind: e.kind, side: 'player', color: ADD_COLOR,
                    text: soaked > 0
                        ? `The brood bites for ${e.raw} — your wall eats ${soaked}. You take ${e.dealt}.`
                        : `The brood bites for ${e.raw}. You take ${e.dealt}.`,
                    float: null,
                });
                break;
            }
            // `e.cost` is the engine's `STRIKE_ADD_COST` riding on the event —
            // read off the event, never restated here, so a re-price moves the
            // sentence with it.
            case 'add-struck':
                out.push({
                    kind: e.kind, side: 'enemy', color: ADD_COLOR,
                    text: `${e.name} is struck down. ◆${e.cost} spent.`,
                    float: 'STRUCK',
                });
                break;
            // A refused action, in the engine's OWN words (`need 2 ◆ Conviction
            // (have 0)`) — never re-worded or re-cased here, or the two
            // vocabularies drift. Log-only: this fires from two dozen sites
            // (an empty discard, no glyph to charge, an unaffordable
            // signature), and a float would carpet the board on every mis-tap.
            case 'effect-fizzled':
                out.push({
                    kind: e.kind, side: 'player', color: GLYPH_COLORS.thorns,
                    text: `Refused — ${e.message}.`,
                    float: null,
                });
                break;
            default:
                break;
        }
    }
    return out;
}

// ── Playtest fix 2026-09-04 — the persistent combat log ─────────────────────
//
// The playtest found combat has no persistent log: every beat is a floating
// token that dies in ~1s, so the player cannot reconstruct what just
// happened. `selectCombatLogHistory` walks the FULL event stream
// (`state.log`) and produces an ordered, human-readable line per beat,
// grouped by turn.
//
// It reuses `selectCombatLogLines` for every event kind that already has a
// ledger sentence (stage-entered, enemy-keyword-fired, the WRATH/FLAY/CHAIN/
// TWIN/OVERKILL ledgers, enemy-healed, the PLEA lines, ...) and adds the
// kinds that function deliberately omits — the raw damage/DoT/card/threat/
// stance-check beats a FLOAT already carries but the log never wrote down.

export interface CombatLogHistoryEntryVM {
    id: string;
    /** The pane the line reads over — 'system' for turn dividers and the
     *  dice-tray summary, which belong to neither combatant. */
    side: 'enemy' | 'player' | 'system';
    color: string;
    text: string;
}

/** The log toggle's copy — never hardcoded in the component (house style:
 *  no player-facing copy lives in a component). */
export const COMBAT_LOG_TOGGLE_TEXT = 'LOG';
export const COMBAT_LOG_TOGGLE_A11Y = 'Open the combat log';
export const COMBAT_LOG_CLOSE_A11Y = 'Close the combat log';

/** Long fights scroll early turns off rather than growing the sheet forever. */
const LOG_HISTORY_CAP = 200;

export function selectCombatLogHistory(state: CombatEncounterState): CombatLogHistoryEntryVM[] {
    const events = state.log ?? [];
    const out: CombatLogHistoryEntryVM[] = [];
    let seq = 0;
    let lastTurn: number | null = null;
    // Phase 102 — the engine pushes `add-bit` immediately before the phase's
    // own `phase-resolved`, so anything seen since the last phase boundary
    // belongs to the phase about to be marked. Scoped, never cumulative: a
    // bite in an earlier phase must not colour a later DENIED (audit 3.3).
    let biteThisPhase = 0;
    const push = (side: CombatLogHistoryEntryVM['side'], color: string, text: string) => {
        seq += 1;
        out.push({ id: `log-${seq}`, side, color, text });
    };
    for (const e of events) {
        if (e.kind === 'add-bit') biteThisPhase += e.dealt;
        switch (e.kind) {
            // A turn boundary — the divider, then the tray's own dice summary.
            // Derived off the same event: `startTurn` emits exactly one of
            // these per turn, so a changed `turn` field IS the turn changing.
            case 'turn-dice-rolled': {
                if (e.turn !== lastTurn) {
                    lastTurn = e.turn;
                    push('system', LOG_STAGE_COLOR, `TURN ${e.turn}`);
                }
                const dice = e.dice
                    .map((d) => `${STANCE_LABELS[d.color] ?? d.color.toUpperCase()}${d.face ? ` ${d.face}` : ''}`)
                    .join(', ');
                push('system', GUARD_COLOR, `Turn ${e.turn}. Dice: ${dice}.`);
                break;
            }
            case 'damage-dealt': {
                const named = getCardById(e.cardId)?.name;
                const suffix = named ? ` (${named})` : '';
                if (e.target === 'enemy') push('enemy', INTENT_ICONS.damage.color, `You deal ${e.amount}${suffix}.`);
                else push('player', INTENT_ICONS.damage.color, `It deals ${e.amount} to you${suffix}.`);
                break;
            }
            case 'dot-tick': {
                const side = e.target === 'enemy' ? 'enemy' as const : 'player' as const;
                const who = e.target === 'enemy' ? 'the foe' : 'you';
                push(side, GLYPH_COLORS.dot, `${e.label} ticks for ${e.amount} on ${who}.`);
                break;
            }
            case 'effect-landed': {
                const side = e.target === 'enemy' ? 'enemy' as const : 'player' as const;
                const who = e.target === 'enemy' ? 'the foe' : 'you';
                const glyph = effectGlyph(e.effect);
                const name = e.effect.name ?? glyph.label;
                push(side, glyph.color, `${name}${e.intensity > 1 ? ` ×${e.intensity}` : ''} lands on ${who}.`);
                break;
            }
            case 'card-played': {
                const card = getCardById(e.cardId);
                const name = card?.name ?? e.cardId;
                const color = (card && STANCE_COLORS[card.philosophicalAspect]) ?? GUARD_COLOR;
                push('player', color, `${name} — ${e.dieId === null ? 'FREE' : 'die-powered'}.`);
                break;
            }
            case 'threat-fired':
                push('enemy', GLYPH_COLORS.control, stripThreatPayload(e.description));
                break;
            // 'overwhelmed' phases already read through 'threat-fired'; the
            // DENIED half of the story (mark === 'clear') is otherwise silent.
            // DENIED means the foe's OWN blow was held — never "nothing
            // landed", because a live brood bites through a hindered phase.
            case 'phase-resolved':
                if (e.mark === 'clear') {
                    push('player', GLYPH_COLORS.statup, biteThisPhase > 0
                        ? `PHASE ${e.phaseIndex} — DENIED, but the brood bit you for ${biteThisPhase}.`
                        : `PHASE ${e.phaseIndex} — DENIED.`);
                }
                biteThisPhase = 0;
                break;
            // Same wording the open stance-check telegraph resolves to
            // (`stanceCheckVM` above) — one vocabulary, never two.
            case 'stance-check-resolved': {
                const adv = READ_DAMAGE_MULT.advantage;
                const dis = READ_DAMAGE_MULT.disadvantage;
                const text = e.outcome === 'punished' ? `Punished ×${adv}`
                    : e.outcome === 'yielded' ? `Yielded ×${dis} +1◆`
                        : e.stance ? `${STANCE_LABELS[e.stance] ?? e.stance} — neither, ×1`
                            : 'No stance — neither, ×1';
                const color = e.outcome === 'punished' ? INTENT_ICONS.damage.color
                    : e.outcome === 'yielded' ? GLYPH_COLORS.statup
                        : GLYPH_COLORS.thorns;
                push('player', color, text);
                break;
            }
            case 'signature-cast':
                push('player', SEAL_COLOR, `${e.name} — Signature, ◆${e.cost}.`);
                break;
            case 'barrier-absorbed':
                push('player', GUARD_COLOR, `Barrier absorbs ${e.amount}.`);
                break;
            case 'thorns-reflected':
                push('enemy', GLYPH_COLORS.thorns, `Thorns reflect ${e.amount} back.`);
                break;
            case 'rupture-detonated':
                push('enemy', PAYOFF_COLOR, `RUPTURE detonates for ${e.amount}.`);
                break;
            case 'amplify-detonated':
                push('enemy', PAYOFF_COLOR, `AMPLIFY detonates for ${e.amount}${e.pendingDot > 0 ? ` (+${e.pendingDot} DoT queued)` : ''}.`);
                break;
            case 'compound-hit':
                push('enemy', PAYOFF_COLOR, `COMPOUND hits for ${e.amount}${e.debuffs > 0 ? ` (×${e.debuffs} debuffs)` : ''}.`);
                break;
            default: {
                // Every kind `selectCombatLogLines` already narrates (stage
                // entries, enemy keywords, the ledgers, the PLEA lines, ...)
                // — one source of copy, never a forked duplicate.
                const [line] = selectCombatLogLines([e]);
                if (line) push(line.side, line.color, line.text);
                break;
            }
        }
    }
    return out.length > LOG_HISTORY_CAP ? out.slice(out.length - LOG_HISTORY_CAP) : out;
}

function intentVM(state: CombatEncounterState): CombatIntentVM {
    const cur = currentPhase(state);
    const curIdx = Math.min(state.currentPhaseIndex, state.threatPhases.length - 1);
    const type = (cur?.intentType ?? 'pass') as CombatIntentType;
    const meta = INTENT_ICONS[type];
    const nextPhase = state.threatPhases[state.currentPhaseIndex + 1];
    const next = nextPhase && !cur?.isFinalPhase
        ? (() => { const t = (nextPhase.intentType ?? 'pass') as CombatIntentType; const m = INTENT_ICONS[t]; return { type: t, icon: m.icon, label: m.label, branch: branchVM(nextPhase) }; })()
        : null;
    const effects = cur?.threatAction.effects ?? [];
    const damage = effects.reduce((s, e) => s + (e.damage ?? 0), 0);
    const debuffs = effects.some((e) => !!e.effectId);
    const threat = projectIncomingThreat(state);
    // Spec 33 §5 (flag-on): the open stance-check telegraph. Spread so the key is
    // ABSENT flag-off — the threat readout VM stays byte-identical.
    const stanceCheck = stanceCheckVM(state, cur, curIdx);
    return {
        type, icon: meta.icon, label: cur?.intentLabel ?? meta.label, color: meta.color,
        description: cur?.threatAction.description ?? '', damage, debuffs,
        branch: branchVM(cur), next,
        wallMath: {
            projectedDamage: threat.projectedDamage, netDamage: threat.netDamage,
            willDeny: threat.willDeny, guard: threat.guard, barrier: threat.barrier,
            rungsTotal: threat.rungsTotal, rungsLost: threat.rungsLost,
            // Engine truth, forwarded — `projectIncomingThreat` runs the brood
            // through the SAME `soakFlatHit` that `resolveThreatPhase` applies,
            // so this readout cannot drift from what actually happens.
            addDamage: threat.addDamage, addNetDamage: threat.addNetDamage,
            totalNetDamage: threat.totalNetDamage,
        },
        ...(isUpgradeableDiceEnabled() ? { stanceCheck } : {}),
    };
}

/** WI-5 — does any card the player can still draw feed one of these alt-win
 *  currencies? Scans the whole combat deck (not just the current hand) so a
 *  whole-plan-is-PLEA preset like GRACE shows its meter from turn 1, before the
 *  first sway card is drawn. */
function deckFeedsMechanic(state: CombatEncounterState, kinds: readonly string[]): boolean {
    const ids = new Set<string>([...state.deck, ...state.hand.map(h => h.cardId)]);
    for (const id of ids) {
        const src = getCardById(id);
        if (src?.specialMechanics?.some(m => kinds.includes(m.kind))) return true;
    }
    return false;
}

function enemyPane(state: CombatEncounterState): CombatEnemyPaneVM {
    const e = state.enemy;
    const cur = currentPhase(state);
    const revealed = isPhaseStanceRevealed(state, Math.min(state.currentPhaseIndex, state.threatPhases.length - 1));
    const stance = revealed ? cur?.enemyStance ?? null : null;
    const isBoss = e.difficulty === 'boss' || e.difficulty === 'unique'
        || (e.tags ?? []).includes('boss') || (e.tags ?? []).includes('unique');
    // WI-5 — the alt-win meters. PLEA target is the engine-owned capitulate
    // threshold; the CHARGE target is a declared SENTENCE's tally (0 until one
    // is declared). Each meter shows when it has a value OR the deck feeds it.
    const sway = state.sway ?? 0;
    const premises = state.premises ?? 0;
    // THE BIG NUMBERS REWRITE — FLAY sits on the FOE (it is how open the thing
    // is, not something you carry), so it reads on this pane beside its VITAE.
    const flay = state.flay ?? 0;
    // Phase 2 (spec 30) — pure selector, no state mutation; safe to call once
    // per render off the same encounter state the rest of the pane reads.
    const lethality = projectCombatOutcome(state);
    return {
        name: e.name,
        artKey: e.portraitAsset ?? e.id,
        artNonce: state.seed ?? 0,
        isBoss,
        hp: Math.max(0, e.health), maxHp: e.maxHealth,
        hpPct: e.maxHealth > 0 ? Math.max(0, e.health) / e.maxHealth : 0,
        // Standing attachments render beside the live effects: player-cast
        // curses (permanent + timed) as ☒, the foe's own enchantments as ❖.
        effects: [
            ...chips(e.effects),
            ...standingChips(state.enemyAttachments ?? [], state.enemyTempAttachments ?? [], 'curse'),
            ...standingChips(state.enemyEnchantments ?? [], [], 'enchant'),
        ],
        intent: intentVM(state),
        revealedStance: stance,
        stanceColor: stance ? STANCE_COLORS[stance] : '#6b6257',
        stanceLabel: stance ? STANCE_LABELS[stance] : '?',
        stanceHint: cur?.stanceHint ?? (e as { stanceHint?: string }).stanceHint ?? '',
        sway, swayTarget: capitulateThreshold(e),
        swayVisible: sway > 0 || deckFeedsMechanic(state, ['sway']),
        premises, premiseAt: state.peroration?.at ?? 0,
        // Only the UNDECLARED tally: once a SENTENCE is declared, the existing
        // peroration track (combat-peroration) owns the premises/at readout.
        premiseVisible: !state.peroration
            && (premises > 0 || deckFeedsMechanic(state, ['premise', 'peroration', 'spend_premises'])),
        keywords: enemyKeywordChips(e),
        flay, flayVisible: flay > 0 || deckFeedsMechanic(state, ['flay']),
        stagesEntered: (state.stagesEntered ?? []).length,
        pendingDot: lethality.pendingDot,
        roundsToKill: lethality.roundsToKill,
        isLethalInFlight: lethality.isLethalInFlight,
        healPerRound: lethality.healPerRound,
        adds: addsVM(state),
        strikeAddCost: STRIKE_ADD_COST,
        canStrikeAdd: state.conviction >= STRIKE_ADD_COST,
    };
}

/** Phase 50 — maps one engine `GlyphInstance` to its renderable Seal chip. */
function sealVM(g: GlyphInstance): CombatSealVM {
    const kind = g.payload.kind;
    const crackValue = kind === 'poison' ? g.payload.baseIntensity + g.charges : g.payload.baseAmount + g.charges;
    const previewText = kind === 'poison' ? `Poison ${crackValue}, ${g.payload.duration} rounds` : `Barrier ${crackValue}`;
    return {
        id: g.id, kind, glyph: SEAL_GLYPHS[kind], color: SEAL_COLOR, label: SEAL_LABELS[kind],
        charges: g.charges, cap: g.cap, crackValue, previewText,
    };
}
function sealsVM(glyphs: GlyphInstance[] | undefined): CombatSealVM[] {
    return (glyphs ?? []).map(sealVM);
}

/**
 * Phase 102 — maps the engine's brood to renderable chips.
 *
 * Nothing is computed here beyond affordability: `bite` is forwarded verbatim
 * because the engine applies it verbatim (it resolves adds outside the threat
 * loop's multiplier stack for exactly this reason), and a presenter that
 * "helpfully" scaled it would reintroduce the drift the engine went out of its
 * way to make impossible.
 */
function addsVM(state: CombatEncounterState): CombatAddVM[] {
    const affordable = state.conviction >= STRIKE_ADD_COST;
    return (state.adds ?? []).map((a) => ({
        id: a.id, name: a.name, bite: a.bite, vitae: a.vitae, maxVitae: a.maxVitae,
        glyph: ADD_GLYPH, color: ADD_COLOR, cost: STRIKE_ADD_COST, affordable,
    }));
}

function playerPane(state: CombatEncounterState): CombatPlayerPaneVM {
    const p = state.player;
    // THE BIG NUMBERS REWRITE — the two ledgers you carry. Same visibility law
    // as the alt-win meters (WI-5): a live value, or a deck that can feed one,
    // so a WRATH deck sees its track from turn 1 instead of after the fact.
    const wrath = state.wrath ?? 0;
    const chain = state.chain ?? 0;
    return {
        name: p.name ?? 'You', hp: Math.max(0, p.health), maxHp: p.maxHealth,
        hpPct: p.maxHealth > 0 ? Math.max(0, p.health) / p.maxHealth : 0,
        guard: state.guard ?? 0,
        // Your standing enchantments (permanent zone + timed FREE instances).
        effects: [
            ...chips(p.effects),
            ...standingChips(state.persistentZone ?? [], state.tempZone ?? [], 'enchant'),
        ],
        seals: sealsVM(state.glyphs),
        wrath, wrathVisible: wrath > 0 || deckFeedsMechanic(state, ['wrath']),
        chain, chainVisible: chain > 0 || deckFeedsMechanic(state, ['chain']),
        twinArmed: state.twinArmed === true,
    };
}

function diceVM(state: CombatEncounterState): CombatDieVM[] {
    const drafted = getDraftedDie(state);
    const hasDraft = !!state.draftedDieId;
    // 2026-07-12 (owner playtest, the stale-powered bug) — a REFRESHED combo
    // die: the drafted die already powered a play this turn (a landed status
    // handed it back, still available). It no longer auto-arms the next
    // staged card — the player re-drags it — so the board needs to tell a
    // refreshed die from a fresh draft.
    const alreadyPlayed = (state.spellsPlayedThisTurn ?? 0) > 0;
    // Per-die read pip — only once the phase stance is known (revealed/scouted).
    const stance = revealedCurrentStance(state) as Stance | null;
    // Spec 33 (Phase D6a) — the flag-on die-face axis. Flag-off `v2` is false,
    // so `face`/`cracked` stay absent and `isMiss` false: every branch below
    // reduces to its pre-spec-33 form and the tray VM is byte-identical.
    const v2 = isUpgradeableDiceEnabled();
    // §6 OVERHEAT — colors whose die was forced all-miss this round (`turn` is
    // the crack's bite turn; round-turn law: one turn == one round). Derived
    // inline so the mechanics barrel is untouched.
    const crackedColors = v2
        ? new Set<string>((state.crackedDice ?? []).filter(c => c.turn === state.turn).map(c => c.color))
        : null;
    const tray: CombatDieVM[] = state.dice.map((d: CombatManaDie) => {
        const isDrafted = drafted?.id === d.id;
        const spent = d.state === 'spent';
        const isX = d.color === 'x';
        const floating = d.floating === true;
        const refreshed = isDrafted && !spent && !isX && alreadyPlayed;
        // Flag-on face read: `mana`/`special` power a card, `miss` is DEAD.
        const face = v2 ? d.face : undefined;
        const isMiss = face === 'miss';
        const cracked = v2 && !!crackedColors?.has(d.color);
        return {
            id: d.id, color: d.color, colorHex: STANCE_COLORS[d.color] ?? '#888',
            glyph: DIE_GLYPHS[d.color] ?? '?', stanceLabel: STANCE_LABELS[d.color] ?? '?',
            drafted: isDrafted, spent, isX,
            readPip: stance ? resolveRead(d.color, stance) : null,
            // R4 — a dead X face is never dead: tappable once per turn.
            fateTappable: isX && d.state !== 'spent' && state.fateTappedTurn !== state.turn,
            // Spec 32 v3 §5 — the board must know a floating die from a turn die:
            // floats stay draggable after the draft (they bypass the one-die law).
            floating: floating || undefined,
            refreshed: refreshed || undefined,
            // A float drags whenever unspent (post-draft too); a REFRESHED
            // combo die drags again (the re-arm is an explicit drop, never an
            // auto-attach); a turn die only before the draft. NEVER a function
            // of live drag state (see the CombatDieVM.draggable doc note).
            // Spec 33 (flag-on): a MISS face is DEAD — never draggable. Flag-off
            // `isMiss` is false, so the expression is unchanged (byte-identical).
            draggable: isMiss ? false : floating ? !spent : refreshed ? true : !hasDraft && !isX && !isDrafted && !spent,
            // Absent flag-off (v2 false → face undefined, cracked false).
            ...(face ? { face } : {}),
            ...(cracked ? { cracked: true } : {}),
        };
    });
    // R2 — the Reserve renders in the same tray as a second power source.
    const banked: CombatDieVM[] = (state.reserve ?? []).map((d: CombatManaDie) => ({
        id: d.id, color: d.color, colorHex: STANCE_COLORS[d.color] ?? '#888',
        glyph: DIE_GLYPHS[d.color] ?? '?', stanceLabel: STANCE_LABELS[d.color] ?? '?',
        drafted: false, spent: false, isX: false,
        readPip: null,
        reserve: true, pips: d.pips ?? 0,
        draggable: true,
    }));
    return [...tray, ...banked];
}

// ── Honest card view-models (face + detail) ──────────────────────────────────

type EffectPayloadLike = {
    damageOverTime?: { damagePerRound: number; trigger?: string };
    actionRestriction?: { skipTurn?: boolean };
    regeneration?: { healthPerRound?: number };
    rollModifier?: number;
    rollModifierPerIntensity?: number;
    // ── mechanics 0.34.0 ──
    reflectDamage?: number;     // buff_thorns / tier1_body_defend → Thorns
    damageTakenMult?: number;   // debuff_vulnerable / debuff_vulnerability_* → Vulnerable (>1) / buff_resolute → Resolute (<1)
    // ── spec 32 v3 — the themed-deck payload keys ──
    tickAmplifyFlat?: number;      // debuff_mark → +N per DoT tick per stack
    backfirePerRung?: number;      // debuff_backfire → N per rung the enemy's action loses
    outgoingDamageMulPct?: number; // debuff_quarter → the enemy deals N% less damage (<0)
    // ── card-overhaul (2026-07-03) ──
    defenseModifier?: number;          // debuff_exposure → real -N DEF number
    restrictsSurgeAccess?: boolean;    // debuff_doubt → forces the foe's next play to weak-tier
    blocksAdvantage?: boolean;         // debuff_sensory_null → blocks advantage reads
    reducesControlAccuracy?: boolean;  // debuff_sensory_null → dulls control accuracy
    deniesAllyBuffTargeting?: boolean; // debuff_isolated → denies ally-buff targeting
    forcesWeakTierNextPlay?: boolean;  // debuff_overextended → self-cost weak next play
    forceWildOnNextDie?: boolean;      // buff_clarity → next die counts as Wild
};

/** THE single forward-compat honesty gate: the kind of HONEST, engine-read effect,
 *  or null for effects the live HP engine still doesn't quantify (→ greyed, number-
 *  less). Widened for mechanics 0.33.0: a negative roll modifier now weakens (and a
 *  variety denies) the enemy's turn, so it counts as 'weaken'. */
export function engineHonestKind(
    effectId: string | null | undefined,
): 'dot' | 'stun' | 'regen' | 'weaken' | 'vulnerable' | 'thorns' | 'mark' | 'backfire'
    | 'exposure' | 'doubt' | 'sensoryNull' | 'isolated' | 'overextended' | 'clarity' | 'resolute'
    | null {
    if (!effectId) return null;
    const e = lookupEffect(effectId);
    if (!e) return null;
    const p = (e.payload ?? {}) as EffectPayloadLike;
    if (p.damageOverTime) return 'dot';
    if (p.actionRestriction?.skipTurn) return 'stun';
    if ((p.regeneration?.healthPerRound ?? 0) > 0) return 'regen';
    // Spec 32 v3 — the themed-deck payloads, all engine-read (honest):
    // MARK amplifies every DoT tick; BACKFIRE bites per denied rung; QUARTER
    // (negative outgoing-damage %) weakens the enemy's hits.
    if ((p.tickAmplifyFlat ?? 0) > 0) return 'mark';
    if ((p.backfirePerRung ?? 0) > 0) return 'backfire';
    if ((p.outgoingDamageMulPct ?? 0) < 0) return 'weaken';
    // 0.34.0: reflect + damage-amp are now read by the live HP engine, so they're honest.
    if ((p.reflectDamage ?? 0) > 0) return 'thorns';
    if ((p.damageTakenMult ?? 1) > 1) return 'vulnerable';
    // Fate Engine P1: STANCE-KEYED vulnerability (+N% only from that color die).
    if ((p as { damageTakenMultForStance?: { mult: number } }).damageTakenMultForStance) return 'vulnerable';
    // card-overhaul (2026-07-03): the 6 gaps in the whitelist — every one of these
    // is a real, engine-read payload, so each gets an honest kind rather than
    // falling through to 'inert'.
    if ((p.damageTakenMult ?? 1) < 1) return 'resolute';      // buff_resolute — real % dmg-taken reduction
    if ((p.defenseModifier ?? 0) < 0) return 'exposure';      // debuff_exposure — real -N DEF
    if (p.restrictsSurgeAccess) return 'doubt';               // debuff_doubt — forces weak-tier next play
    if (p.blocksAdvantage || p.reducesControlAccuracy) return 'sensoryNull'; // debuff_sensory_null
    if (p.deniesAllyBuffTargeting) return 'isolated';         // debuff_isolated
    if (p.forcesWeakTierNextPlay) return 'overextended';      // debuff_overextended (self-cost)
    if (p.forceWildOnNextDie) return 'clarity';               // buff_clarity — next die is Wild
    if ((p.rollModifier ?? 0) < 0 || (p.rollModifierPerIntensity ?? 0) < 0) return 'weaken';
    return null;
}

function glyphFor(effectId: string): string {
    const e = lookupEffect(effectId);
    return e ? effectGlyph(e as Parameters<typeof effectGlyph>[0]).glyph : '◆';
}

interface PrimaryResolution {
    kind: CombatCardKind;
    ce: CardCombatEffects | null;
    guardAmount: number | null;
    riders: CardCombatEffects[];
    /** The driving special mechanic for the mechanic-led kinds (barrier/riposte/
     *  siphon/rupture/reap); null for effect- or verb-driven kinds. */
    mech: CardSpecialMechanic | null;
}

/** Resolve a card's PRIMARY combat effect + its kind. Reads the sourceCard's
 *  combatEffects / specialMechanics directly — NOT card.primaryEffectId, which is
 *  null for guard/regen cards (it = primaryEnemyEffectId). */
export function resolvePrimary(card: CombatCard, sourceCard: Card | undefined): PrimaryResolution {
    const vc = card.verbClass;
    const mechs = sourceCard?.specialMechanics ?? [];
    const findMech = <K extends CardSpecialMechanic['kind']>(k: K) =>
        mechs.find(m => m.kind === k) as Extract<CardSpecialMechanic, { kind: K }> | undefined;

    if (vc === 'defend') {
        // 0.34.0: a defend card can carry barrier (stacking soak) or riposte (counter)
        // instead of / on top of plain Guard. Headline the richer mechanic.
        const barrier = findMech('barrier');
        if (barrier) return { kind: 'barrier', ce: null, guardAmount: null, riders: [], mech: barrier };
        const riposte = findMech('riposte');
        if (riposte) return { kind: 'riposte', ce: null, guardAmount: findMech('guard')?.amount ?? null, riders: [], mech: riposte };
        const g = findMech('guard');
        return { kind: 'guard', ce: null, guardAmount: g?.amount ?? 0, riders: [], mech: null };
    }
    if (vc === 'befriend') return { kind: 'befriend', ce: null, guardAmount: null, riders: [], mech: null };
    // Spec 32 v3 — persistent cards (player oath / enemy-attached hex).
    // Their honest text is the engine-generated PAID line; no headline number.
    if (vc === 'oath') return { kind: 'oath', ce: null, guardAmount: null, riders: [], mech: null };
    if (vc === 'hex') return { kind: 'hex', ce: null, guardAmount: null, riders: [], mech: null };
    if (vc === 'direct-damage') {
        // Spec 32 v3 — 'direct-damage' is the status-payoff class ONLY (the strike
        // is dead): RUPTURE detonates afflictions, REAP spends Souls. Their live
        // swing is never headlined as a number.
        const rupture = findMech('rupture');
        if (rupture) return { kind: 'rupture', ce: null, guardAmount: null, riders: [], mech: rupture };
        const reap = findMech('reap_all') ?? findMech('reap');
        if (reap) return { kind: 'reap', ce: null, guardAmount: null, riders: [], mech: reap };
        const siphon = findMech('siphon');
        if (siphon) return { kind: 'siphon', ce: null, guardAmount: null, riders: [], mech: siphon };
        const led = headlineMechanic(mechs);
        if (led) return { kind: 'mechanic', ce: null, guardAmount: null, riders: [], mech: led };
        return { kind: 'inert', ce: null, guardAmount: null, riders: [], mech: null };
    }
    if (vc === 'buff-self') {
        // Dice-verb cards (FORGE / TRANSMUTE / KINDLE / PIP) headline their die
        // mechanic — previously they fell through to 'inert' and printed the
        // ambiguous "DEBUFF · buff yourself" (owner directive 2026-07-09).
        const dieMech = findMech('forge_floating_die') ?? findMech('float_x_die')
            ?? findMech('create_temporary_die') ?? findMech('grant_pip')
            ?? findMech('spend_all_pips') ?? findMech('reroll_spent');
        if (dieMech) return { kind: 'forge', ce: null, guardAmount: null, riders: [], mech: dieMech };
        const self = (sourceCard?.combatEffects ?? []).filter(e => e.appliedTo === 'self');
        // 0.34.0: a self-buff that reflects (Thorns) is now real.
        const thorns = self.find(s => engineHonestKind(s.effectId) === 'thorns');
        if (thorns) return { kind: 'thorns', ce: thorns, guardAmount: null, riders: self.filter(s => s !== thorns), mech: null };
        // card-overhaul (2026-07-03): a self-buff that reduces damage taken (Resolute)
        // or arms the next die as Wild (Clarity) is now real too.
        const resolute = self.find(s => engineHonestKind(s.effectId) === 'resolute');
        if (resolute) return { kind: 'resolute', ce: resolute, guardAmount: null, riders: self.filter(s => s !== resolute), mech: null };
        const clarity = self.find(s => engineHonestKind(s.effectId) === 'clarity');
        if (clarity) return { kind: 'clarity', ce: clarity, guardAmount: null, riders: self.filter(s => s !== clarity), mech: null };
        const regenFx = self.find(s => engineHonestKind(s.effectId) === 'regen');
        if (regenFx) return { kind: 'regen', ce: regenFx, guardAmount: null, riders: self.filter(s => s !== regenFx), mech: null };
        // Not a recognised self-EFFECT — headline the driving MECHANIC (FORGE
        // was handled above; DRAW/HEAL riders, ECHO, etc. resolve here). The
        // self effects (e.g. a self-cost MARK) ride along as keyword chips.
        const led = headlineMechanic(mechs);
        if (led) return { kind: 'mechanic', ce: null, guardAmount: null, riders: self, mech: led };
        const primary = self[0] ?? null;
        return { kind: 'inert', ce: primary, guardAmount: null, riders: self.filter(s => s !== primary), mech: null };
    }
    // PROFANE CANON (2026-08-08): a declared SENTENCE outranks whatever
    // status the same card also lands. The Black Cap prints DOOM 2 alongside
    // its verdict, and a DOOM headline would bury the alt-win (and the
    // tier-floored CONDEMN readout) behind a routine DoT face.
    const peroration = findMech('peroration');
    if (peroration) return { kind: 'mechanic', ce: null, guardAmount: null, riders: (sourceCard?.combatEffects ?? []), mech: peroration };

    // direct-dot | direct-control | stat-debuff → opponent effects
    const opp = (sourceCard?.combatEffects ?? []).filter(e => e.appliedTo === 'opponent');
    // card-overhaul (2026-07-03): a self-cost/self-buff effect riding a card
    // classified by its opponent effect (e.g. Existential Debt's Resolute +
    // Overextended alongside a Despair DoT) was previously dropped entirely —
    // it wasn't even a rider. Surface it as a rider too, so the (now honest)
    // keyword shows in the inspect modal rather than vanishing.
    const selfFx = (sourceCard?.combatEffects ?? []).filter(e => e.appliedTo === 'self');
    const primary = opp.find(o => engineHonestKind(o.effectId)) ?? opp[0] ?? null;
    const k = engineHonestKind(primary?.effectId);
    const kind: CombatCardKind =
        k === 'dot' ? 'dot'
            : k === 'stun' ? 'stun'
                : k === 'weaken' ? 'weaken'
                    : k === 'vulnerable' ? 'vulnerable'
                        : k === 'mark' ? 'mark'
                            : k === 'backfire' ? 'backfire'
                                : k === 'exposure' ? 'exposure'
                                    : k === 'doubt' ? 'doubt'
                                        : k === 'sensoryNull' ? 'sensoryNull'
                                            : k === 'isolated' ? 'isolated'
                                                : 'inert';
    // A card classified by verb (e.g. direct-control STAGGER/PLEA) with no
    // engine-honest opponent EFFECT lands here as 'inert'. Headline its driving
    // MECHANIC instead of the ambiguous fallback; the effects ride as chips.
    if (kind === 'inert') {
        const led = headlineMechanic(mechs);
        if (led) return { kind: 'mechanic', ce: null, guardAmount: null, riders: [...opp, ...selfFx], mech: led };
    }
    return { kind, ce: primary, guardAmount: null, riders: [...opp.filter(o => o !== primary), ...selfFx], mech: null };
}

interface CardCalc extends PrimaryResolution {
    keyword: string | null;
    glyph: string;
    categoryColor: string;
    perTurn: number; turns: number; total: number;
    freePerTurn: number; freeTurns: number; freeTotal: number;
    skips: number;
    dpr: number; intensity: number; stacks: boolean;
    // WI-2 — the DoT's trigger FAMILY (post trigger-migration): 'card-played'
    // (poison), 'damage-instance' (bleed), 'payoff', or null for a round-clock
    // DoT. Event-triggered DoTs tick per game event, NOT per turn, so their
    // face/detail must not print the round-clock "total over Nt" fiction.
    dotTrigger: 'card-played' | 'damage-instance' | 'payoff' | null;
    // Profane Canon (2026-08-08) — DOOM: a DoT with NO calendar that grows +1
    // intensity every time the foe acts. "N over 3 turns" is a lie for it
    // (nothing expires, and the bite rises), so the face prints its real clock.
    dotGrowsOnEnemyAction: boolean;
    // ── 0.34.0 authored statics (real units; live swings stay live) ──
    vulnPct: number;       // +N% damage taken (from damageTakenMult)
    reflectN: number;      // thorns reflect per hit (reflectDamage × intensity)
    barrierAmt: number;    // soak granted (barrier.amount, base read)
    siphonPct: number;     // % of damage healed (siphon.pct)
    riposteDmg: number;    // counter damage (riposte.damage, base read)
    riposteReduce: number; // incoming reduction (riposte.reduce, base read)
    reapCost: number;      // Souls a REAP spends (0 = spends ALL, reap_all)
    reapPerSoul: number;   // burst per Soul (reap_all.burstPerSoul)
    markAmp: number;       // MARK: +N per DoT tick per application (tickAmplifyFlat × intensity)
    backfireN: number;     // BACKFIRE: N per denied rung (backfirePerRung × intensity)
    // ── card-overhaul (2026-07-03) ──
    exposureDelta: number; // real -N DEF (defenseModifier, negative)
    resolutePct: number;   // real -N% dmg taken (the inverse of vulnPct, negative)
    // ── P0-truth read triplet (the deterministic ±1 rule, exact numbers) ──
    totalAdv: number;      // DoT lifetime on a WON read (+1 intensity)
    totalDis: number;      // DoT lifetime on a LOST read (−1 turn, floor 1)
    vulnPctAdv: number;    // Vulnerable % on a WON read (+1 intensity, capped)
}

/** Single source of the numbers — faceStats AND detailStats both read this, so the
 *  face and the inspect modal can never drift. All values are AUTHORED units from
 *  getCardById(card.id).combatEffects (not effect-library defaults). */
function cardCalc(card: CombatCard, sourceCard: Card | undefined): CardCalc {
    const pr = resolvePrimary(card, sourceCard);
    const out: CardCalc = {
        ...pr, keyword: null, glyph: '◆', categoryColor: PAYOFF_COLOR,
        perTurn: 0, turns: 0, total: 0, freePerTurn: 0, freeTurns: 0, freeTotal: 0,
        skips: 0, dpr: 0, intensity: 1, stacks: false, dotTrigger: null,
        dotGrowsOnEnemyAction: false,
        vulnPct: 0, reflectN: 0, barrierAmt: 0, siphonPct: 0,
        riposteDmg: 0, riposteReduce: 0, reapCost: 0, reapPerSoul: 0,
        markAmp: 0, backfireN: 0,
        exposureDelta: 0, resolutePct: 0,
        totalAdv: 0, totalDis: 0, vulnPctAdv: 0,
    };
    const eff = pr.ce ? lookupEffect(pr.ce.effectId) : undefined;
    switch (pr.kind) {
        case 'dot': {
            const p = (eff?.payload ?? {}) as EffectPayloadLike;
            out.intensity = pr.ce?.intensity ?? 1;
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.dpr = p.damageOverTime?.damagePerRound ?? 0;
            out.perTurn = Math.floor(out.dpr * out.intensity);
            // WI-2 — classify the trigger family so the face/detail describe how
            // the DoT actually ticks (per card / per hit) instead of assuming a
            // round clock. `undefined`/`round-start`/`round-end` = round-clock.
            const trig = p.damageOverTime?.trigger;
            out.dotTrigger = trig === 'card-played' || trig === 'damage-instance' || trig === 'payoff' ? trig : null;
            const clockMods = (p as { dotModifiers?: { calendarExpiry?: false; growth?: string } }).dotModifiers;
            out.dotGrowsOnEnemyAction = clockMods?.growth === 'per-enemy-action'
                && clockMods?.calendarExpiry === false;
            // Fate Engine P1 — RAMP-AWARE lifetime totals (canonical poison /
            // unraveling escalate): mirror the engine's exact tick math so the
            // face equals `bottomDamagePreview` (printed == applied).
            const rampMods = (p as { dotModifiers?: { escalatesPerTurn?: boolean; rampFactor?: number } }).dotModifiers;
            const ramp = rampMods?.escalatesPerTurn ? (rampMods.rampFactor ?? 0) : 0;
            const lifetime = (intensity: number, turns: number): number => {
                let sum = 0;
                for (let k = 0; k < turns; k++) sum += Math.floor((out.dpr + Math.floor(ramp * k)) * intensity);
                return sum;
            };
            out.total = lifetime(out.intensity, out.turns);
            // P0-truth read triplet — the engine's deterministic rule, exactly:
            // ▲ +1 intensity for the full run; ▼ printed intensity, 1 turn shorter.
            out.totalAdv = lifetime(out.intensity + READ_ADVANTAGE_INTENSITY_BONUS, out.turns);
            out.totalDis = lifetime(out.intensity, Math.max(1, out.turns - READ_DISADVANTAGE_DURATION_PENALTY));
            out.keyword = keywordForEffect(pr.ce?.effectId);
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '🔥';
            out.categoryColor = GLYPH_COLORS.dot;
            out.stacks = eff?.stacking === 'intensity';
            break;
        }
        case 'regen': {
            const p = (eff?.payload ?? {}) as EffectPayloadLike;
            out.intensity = pr.ce?.intensity ?? 1;
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.dpr = p.regeneration?.healthPerRound ?? 0;
            out.perTurn = out.dpr * out.intensity;
            out.total = out.perTurn * out.turns;
            out.freePerTurn = out.dpr;
            out.freeTurns = eff?.duration ?? 0;
            out.freeTotal = out.dpr * out.freeTurns;
            out.keyword = keywordForEffect(pr.ce?.effectId);
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '✚';
            out.categoryColor = GLYPH_COLORS.regen;
            break;
        }
        case 'stun': {
            out.skips = pr.ce?.duration ?? eff?.duration ?? 1;
            out.keyword = keywordForEffect(pr.ce?.effectId);
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '💫';
            out.categoryColor = GLYPH_COLORS.control;
            break;
        }
        case 'weaken': {
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.keyword = keywordForEffect(pr.ce?.effectId);
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '⛓';
            out.categoryColor = GLYPH_COLORS.control;
            break;
        }
        case 'mark': {
            const p = (eff?.payload ?? {}) as EffectPayloadLike;
            out.intensity = pr.ce?.intensity ?? 1;
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.markAmp = (p.tickAmplifyFlat ?? 0) * out.intensity;
            out.keyword = keywordForEffect(pr.ce?.effectId) ?? 'Mark';
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '◎';
            out.categoryColor = GLYPH_COLORS.mark;
            out.stacks = eff?.stacking === 'intensity';
            break;
        }
        case 'backfire': {
            const p = (eff?.payload ?? {}) as EffectPayloadLike;
            out.intensity = pr.ce?.intensity ?? 1;
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.backfireN = (p.backfirePerRung ?? 0) * out.intensity;
            out.keyword = keywordForEffect(pr.ce?.effectId) ?? 'Backfire';
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '↩';
            out.categoryColor = GLYPH_COLORS.control;
            out.stacks = eff?.stacking === 'intensity';
            break;
        }
        case 'vulnerable': {
            const p = (eff?.payload ?? {}) as EffectPayloadLike;
            out.intensity = pr.ce?.intensity ?? 1;
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            // P0-truth: the % shown is the engine's real intensity-scaled delta
            // (mult = 1 + (dtm−1) × intensity, capped) — not the per-stack figure.
            const keyed = (p as { damageTakenMultForStance?: { mult: number } }).damageTakenMultForStance;
            const dtm = p.damageTakenMult ?? keyed?.mult ?? 1;
            const pct = (i: number): number =>
                Math.round((Math.min(VULNERABLE_MAX_MULT, 1 + (dtm - 1) * i) - 1) * 100);
            out.vulnPct = pct(out.intensity);
            out.vulnPctAdv = pct(out.intensity + READ_ADVANTAGE_INTENSITY_BONUS);
            out.keyword = keywordForEffect(pr.ce?.effectId) ?? 'Vulnerable';
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '◎';
            out.categoryColor = GLYPH_COLORS.statdown;
            out.stacks = eff?.stacking === 'intensity';
            break;
        }
        case 'thorns': {
            const p = (eff?.payload ?? {}) as EffectPayloadLike;
            out.intensity = pr.ce?.intensity ?? 1;
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.reflectN = (p.reflectDamage ?? 0) * out.intensity;
            out.keyword = keywordForEffect(pr.ce?.effectId) ?? 'Thorns';
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '✷';
            out.categoryColor = GLYPH_COLORS.thorns;
            break;
        }
        // ── card-overhaul (2026-07-03) — the 6 previously-blank effects ──
        case 'exposure': {
            const p = (eff?.payload ?? {}) as EffectPayloadLike;
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.exposureDelta = p.defenseModifier ?? 0;
            out.keyword = keywordForEffect(pr.ce?.effectId) ?? 'Expose';
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '◈';
            out.categoryColor = GLYPH_COLORS.statdown;
            out.stacks = eff?.stacking === 'intensity';
            break;
        }
        case 'doubt': {
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.keyword = keywordForEffect(pr.ce?.effectId) ?? 'Doubt';
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '❓';
            out.categoryColor = GLYPH_COLORS.control;
            break;
        }
        case 'sensoryNull': {
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.keyword = keywordForEffect(pr.ce?.effectId) ?? 'Numb';
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '⁇';
            out.categoryColor = GLYPH_COLORS.control;
            break;
        }
        case 'isolated': {
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.keyword = keywordForEffect(pr.ce?.effectId) ?? 'Isolated';
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '⛓';
            out.categoryColor = GLYPH_COLORS.control;
            break;
        }
        case 'overextended': {
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.keyword = keywordForEffect(pr.ce?.effectId) ?? 'Overextended';
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '▽';
            out.categoryColor = GLYPH_COLORS.statdown;
            break;
        }
        case 'clarity': {
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.keyword = keywordForEffect(pr.ce?.effectId) ?? 'Clarity';
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '✦';
            out.categoryColor = GLYPH_COLORS.advantage;
            break;
        }
        case 'resolute': {
            const p = (eff?.payload ?? {}) as EffectPayloadLike;
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.resolutePct = Math.round(((p.damageTakenMult ?? 1) - 1) * 100);
            out.keyword = keywordForEffect(pr.ce?.effectId) ?? 'Resolute';
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '🛡';
            out.categoryColor = GLYPH_COLORS.statup;
            out.stacks = eff?.stacking === 'intensity';
            break;
        }
        case 'barrier': {
            // KW-2 (phase 29): BARRIER merged into GUARD — the one card that
            // carries it (the-adamant-wall) now headlines GUARD, "persists".
            const m = pr.mech?.kind === 'barrier' ? pr.mech : undefined;
            out.barrierAmt = m?.amount ?? 0;
            out.keyword = 'Guard'; out.glyph = '⬡'; out.categoryColor = GUARD_COLOR;
            break;
        }
        case 'riposte': {
            const m = pr.mech?.kind === 'riposte' ? pr.mech : undefined;
            out.riposteDmg = m?.damage ?? 0;
            out.riposteReduce = m?.reduce ?? 0;
            out.keyword = 'Riposte'; out.glyph = '⚔'; out.categoryColor = GUARD_COLOR;
            break;
        }
        case 'siphon': {
            const m = pr.mech?.kind === 'siphon' ? pr.mech : undefined;
            out.siphonPct = Math.round((m?.pct ?? 0) * 100);
            out.keyword = 'Siphon'; out.glyph = glyphFor('buff_life_steal'); out.categoryColor = GLYPH_COLORS.drain;
            break;
        }
        case 'rupture': {
            // Live-only value (detonates the foe's afflictions) → a word, never a number.
            out.keyword = 'Rupture'; out.glyph = '✸'; out.categoryColor = GLYPH_COLORS.dot;
            break;
        }
        case 'reap': {
            // Spec 32 v3 T7 — spend Souls; the burst is live (never headlined).
            const m = pr.mech?.kind === 'reap' ? pr.mech : undefined;
            const all = pr.mech?.kind === 'reap_all' ? pr.mech : undefined;
            out.reapCost = m?.cost ?? 0;
            out.reapPerSoul = all?.burstPerSoul ?? 0;
            out.keyword = 'Reap'; out.glyph = '☠'; out.categoryColor = GLYPH_COLORS.dot;
            break;
        }
        case 'forge': {
            // Die-verb cards: FORGE / TRANSMUTE / KINDLE headline as FORGE;
            // pip manipulation headlines as PIP. Word, never a number.
            const mk = pr.mech?.kind;
            out.keyword = mk === 'grant_pip' || mk === 'spend_all_pips' ? 'Pip' : 'Forge';
            out.glyph = '⚒'; out.categoryColor = PAYOFF_COLOR;
            break;
        }
        // 2026-07-12 (owner directive) — the persistent card's verb slot leads
        // with its PAYLOAD keyword (what the passive DOES: Entropy Tax leads
        // MARK); the type word stays on the type strip / type chip. An
        // authored effect id wins; else the verb is recovered from the
        // persistentEffect summary; the bare type word is the no-payload
        // fallback only.
        case 'oath':
            out.keyword = persistentPayloadKeyword(sourceCard) ?? 'Oath';
            out.glyph = '◈'; out.categoryColor = ENCHANT_COLOR; break;
        case 'hex':
            out.keyword = persistentPayloadKeyword(sourceCard) ?? 'Hex';
            out.glyph = '⛓'; out.categoryColor = GLYPH_COLORS.control; break;
        case 'guard':
            out.keyword = 'Guard'; out.glyph = '🛡'; out.categoryColor = GUARD_COLOR; break;
        case 'befriend':
            out.keyword = null; out.glyph = '🕊'; out.categoryColor = BEFRIEND_COLOR; break;
        case 'mechanic': {
            const h = mechanicHeadline(pr.mech);
            out.keyword = h?.keyword ?? null;
            const mk = pr.mech?.kind;
            const control = mk === 'stagger' || mk === 'lock_stance' || mk === 'sway'
                || mk === 'omen' || mk === 'foretell' || mk === 'peroration'
                || mk === 'premise' || mk === 'spend_premises';
            const affliction = mk === 'extend_dots' || mk === 'convert_dots'
                || mk === 'boost_all_dots' || mk === 'consume_affliction' || mk === 'soul_gain';
            out.glyph = control ? '✦' : affliction ? '☠' : '◆';
            out.categoryColor = control ? GLYPH_COLORS.control : affliction ? GLYPH_COLORS.dot : PAYOFF_COLOR;
            break;
        }
        case 'inert':
        default:
            out.keyword = keywordForEffect(pr.ce?.effectId);
            out.glyph = eff && pr.ce ? glyphFor(pr.ce.effectId) : '▽';
            out.categoryColor = INERT_COLOR;
            break;
    }
    return out;
}

/** Exact one-line clause for a die-verb card's face/detail (no vibes). */
function forgeClause(mech: CardSpecialMechanic | null): string | null {
    switch (mech?.kind) {
        case 'forge_floating_die':
            return `forge a ${mech.color === 'wild' ? 'WILD' : 'matching'} GHOST die`;
        case 'float_x_die':
            return 'dead X die → WILD GHOST die (no X: +1 ◆)';
        case 'create_temporary_die':
            return `KINDLE a ${mech.color} die to the Reserve`;
        case 'grant_pip':
            return `+${mech.count} pip to every Reserve die`;
        case 'spend_all_pips':
            return 'spend ALL pips for their printed payoff';
        case 'reroll_spent':
            return 're-roll every spent or dead die';
        default:
            return null;
    }
}

/** A headline-able special mechanic → its face keyword + real-unit value. THE
 *  generic honesty path: any specialMechanics verb that isn't a self-standing
 *  face kind (guard/rupture/forge/…) resolves here to `KEYWORD · value` instead
 *  of falling through to the ambiguous "DEBUFF / buff yourself" fallback.
 *  `keyword` is Title-Case (matches the glossary); returns null for kinds with
 *  no player headline (pure die-plumbing riders never reach here as primary). */
interface MechHeadline { keyword: string | null; heroText: string; heroSub: string | null; verbLine: string }
function mechanicHeadline(mech: CardSpecialMechanic | null, enemyDifficulty?: EnemyDifficulty): MechHeadline | null {
    if (!mech) return null;
    const kw = keywordForMechanic(mech.kind);
    switch (mech.kind) {
        case 'stagger':
            return { keyword: kw ?? 'Stagger', heroText: `−${mech.rungs}`, heroSub: `rung${mech.rungs === 1 ? '' : 's'} · next action`, verbLine: "weaken the foe's next telegraphed action" };
        case 'lock_stance':
            return { keyword: kw ?? 'Stagger', heroText: '', heroSub: "lock the foe's next stance", verbLine: "the foe's next stance is locked and revealed" };
        case 'sway':
            return { keyword: kw ?? 'Plea', heroText: `+${mech.amount}`, heroSub: 'toward relenting', verbLine: 'push the foe toward relenting' };
        case 'peroration': {
            // KW-2 (phase 29): SENTENCE demoted — its sole carrier
            // (the-closing-word) headlines under CHARGE, the keyword whose
            // gloss already explains the payoff-trigger mechanic.
            // WI-6 — the concede threshold tier-FLOORS against the live foe
            // (base 8 / elite 10 / boss 12). The old face printed the raw
            // authored 8 unconditionally, a lie against an elite/boss. In combat
            // (difficulty known) show the effective threshold; in the static
            // catalog show the whole ladder.
            const authored = mech.concedeAt;
            const concedeSub = authored === undefined
                ? 'fires free'
                : enemyDifficulty
                    ? `condemn at ${Math.max(authored, concedeFloorFor(enemyDifficulty))} vs this foe`
                    : `condemn ${Math.max(authored, CONCEDE_PREMISES_BASE)}`
                        + `/${Math.max(authored, CONCEDE_PREMISES_ELITE)} elite`
                        + `/${Math.max(authored, CONCEDE_PREMISES_BOSS)} boss`;
            return { keyword: kw ?? 'Charge', heroText: `at ${mech.at}`, heroSub: concedeSub, verbLine: 'a declared conclusion that fires on your Charge tally' };
        }
        case 'premise':
            return { keyword: kw ?? 'Charge', heroText: `+${mech.count}`, heroSub: 'to the tally', verbLine: 'add to your Charge tally' };
        case 'spend_premises':
            return { keyword: kw ?? 'Charge', heroText: '', heroSub: 'spend the tally', verbLine: 'spend your whole Charge tally' };
        case 'foretell':
            return { keyword: kw ?? 'Foretell', heroText: `${mech.count}`, heroSub: 'look ahead', verbLine: "reveal the foe's next stance and reorder your deck" };
        // Phase 32 part 4d — OMEN v2: a staked stance/window claim, not a
        // silent die-derived guess. No picker UI yet (follow-up), so no
        // live claim number to headline here — same "no live number, static
        // copy" shape oath/hex already use.
        case 'omen':
            return { keyword: kw ?? 'Omen', heroText: '', heroSub: `ante ${mech.anteConviction}◆ at window 1`, verbLine: 'stake a stance/window claim — a hit fires the payoff free, a miss keeps the ante' };
        case 'soul_gain':
            return { keyword: kw ?? 'Soul', heroText: `+${mech.count}`, heroSub: `Soul${mech.count === 1 ? '' : 's'}`, verbLine: 'gain Souls' };
        case 'consume_affliction':
            // KW-2 (phase 29): re-mapped Soul→Rupture — extends RUPTURE's
            // printed sense ("consume N afflictions") instead of a redundant
            // CONSUME word; the Soul gain stays a printed rider.
            return { keyword: kw ?? 'Rupture', heroText: `+${mech.souls}`, heroSub: `Soul${mech.souls === 1 ? '' : 's'} · consume 1 affliction`, verbLine: 'consume an affliction — its fuel ticks now — for Souls' };
        case 'reprise':
            return { keyword: kw ?? 'Recall', heroText: `${mech.count}`, heroSub: mech.fireFree ? 'from discard · fires free' : 'from discard', verbLine: 'return your highest-rank discards to hand' };
        case 'echo':
            return { keyword: kw ?? 'Echo', heroText: '', heroSub: 'paid line fires twice', verbLine: 'the paid line fires twice' };
        case 'echo_next_spell':
            return { keyword: kw ?? 'Echo', heroText: '', heroSub: 'your next spell', verbLine: 'your next spell this turn gains Echo' };
        case 'replay_last':
            // KW-3 (phase 29): the replay_last→Echo mapping is deleted —
            // ouroboros (its sole, 1-of-rare carrier) gets no keyword badge;
            // this heroText/heroSub still carry its card-local rules text.
            return { keyword: kw ?? null, heroText: `×${mech.times}`, heroSub: 'your last spell', verbLine: 'your last spell resolves again' };
        case 'recoil':
            return { keyword: kw ?? 'Recoil', heroText: `${mech.hp}`, heroSub: 'VITAE cost', verbLine: 'pay VITAE as an unpreventable cost' };
        case 'recoil_x': {
            const per = Math.max(1, Math.round(1 / mech.poisonPerX));
            return { keyword: kw ?? 'Recoil', heroText: `X (min ${mech.min})`, heroSub: `VITAE · POISON per ${per}`, verbLine: `pay X VITAE of your choosing — POISON the foe 1 per ${per} paid` };
        }
        case 'extend_dots':
            return { keyword: kw ?? 'Prolong', heroText: `+${mech.turns}`, heroSub: 'turns · all your DoTs', verbLine: 'extend every damage-over-time you hold on the foe' };
        case 'boost_all_dots':
            return { keyword: kw ?? 'Prolong', heroText: `+${mech.intensity}`, heroSub: 'intensity · all DoTs', verbLine: "amplify every affliction on the foe" };
        case 'convert_dots':
            return { keyword: kw ?? 'Curdle', heroText: `+${mech.bonusIntensity}`, heroSub: 'intensity · bleed ↔ poison', verbLine: "flip the foe's Bleed and Poison, each landing harder" };
        case 'strip_random_buff':
            return { keyword: 'Cleanse', heroText: '', heroSub: mech.appliedTo === 'enemy' ? 'strip a foe buff' : 'strip a buff', verbLine: 'strip a random buff' };
        case 'rider': {
            const pairs = riderPairs(mech.rider);
            if (!pairs.length) return null;
            const [rk, rv] = pairs[0];
            const title = rk.charAt(0) + rk.slice(1).toLowerCase();
            return { keyword: title, heroText: rv, heroSub: pairs.length > 1 ? 'and more' : null, verbLine: 'the printed rider' };
        }
        // Phase 32 part 4a — TURNABOUT cashes the whole STAGGER/BACKFIRE
        // denial ledger banked THIS combat (`rungsDeniedTotal`, live-only —
        // never headlined as a fabricated number here, same convention as
        // REAP's live Soul-spend).
        case 'turnabout':
            return { keyword: kw ?? 'Backfire', heroText: `${mech.burstPerRung}×`, heroSub: 'per rung ever denied', verbLine: 'cash the whole denial ledger — then it resets' };
        // Profane Canon (2026-08-08) — the rework's two new printed costs.
        case 'immolate':
            return {
                keyword: kw ?? 'Immolate',
                heroText: `${mech.count}`,
                heroSub: `card${mech.count === 1 ? '' : 's'} · burned from hand`,
                verbLine: `burn your ${mech.count} lowest-rank other card${mech.count === 1 ? '' : 's'} as a cost — then the rider fires`,
            };
        case 'purge_self':
            return {
                keyword: kw ?? 'Purge',
                heroText: '',
                heroSub: 'exile this curse',
                verbLine: 'this curse leaves the fight entirely — hand, discard and deck',
            };
        // ── THE BIG NUMBERS REWRITE (2026-09-02) — direct damage and its
        //    family. Every face below prints the AUTHORED number, never a
        //    live-scaled one: WRATH, CHAIN, FLAY, EXECUTE and the read all land
        //    on top of it inside `scalePlayerHit`, and a face that guessed at
        //    the sum would be a lie the moment a ledger moved.
        case 'deal': {
            // DEAL carries NO keyword badge on purpose (`MECHANIC_KEYWORD` has
            // no `deal` row): "Deal 24" is plain English, and shouting it would
            // spend the face's one keyword slot on the verb that needs no
            // explaining. The hero slot says the whole thing instead.
            const hits = Math.max(1, mech.hits ?? 1);
            const each = hits > 1 ? ` × ${hits}` : '';
            return {
                keyword: kw ?? null,
                heroText: `Deal ${mech.amount}${each}`,
                heroSub: mech.pierce
                    ? (hits > 1 ? 'VITAE a hit · PIERCE' : 'VITAE · PIERCE')
                    : (hits > 1 ? 'VITAE a hit' : 'VITAE'),
                verbLine: hits > 1
                    ? `strike ${hits} times for ${mech.amount} VITAE each${mech.pierce ? ', past hide and every shield' : ''}`
                    : `strike for ${mech.amount} VITAE${mech.pierce ? ', past hide and every shield' : ''}`,
            };
        }
        case 'wrath':
            return {
                keyword: kw ?? 'Wrath',
                heroText: `+${mech.amount}`,
                heroSub: 'every hit · rest of combat',
                verbLine: 'every hit you land from here deals more, and it never fades',
            };
        case 'flay':
            return {
                keyword: kw ?? 'Flay',
                heroText: `${mech.stacks}`,
                heroSub: `stack${mech.stacks === 1 ? '' : 's'} · half again a hit`,
                verbLine: `flay the foe open — your next ${mech.stacks} hit${mech.stacks === 1 ? '' : 's'} land half again as hard`,
            };
        case 'twin':
            return {
                keyword: kw ?? 'Twin',
                heroText: '',
                heroSub: 'next spell fires twice',
                verbLine: 'the next spell you play this turn says its paid line twice',
            };
        case 'chain':
            return {
                keyword: kw ?? 'Chain',
                heroText: `+${mech.amount}`,
                heroSub: 'to your next hit',
                verbLine: 'load the next hit — the chain slackens on a turn that feeds it nothing',
            };
        case 'execute':
            return {
                keyword: kw ?? 'Execute',
                heroText: `≤ ${Math.round(mech.atPct * 100)}%`,
                heroSub: 'VITAE · damage doubled',
                verbLine: `while the foe sits at or under ${Math.round(mech.atPct * 100)}% VITAE, this card's damage doubles`,
            };
        case 'overkill': {
            const cash = mech.conviction ? `+${mech.conviction} ◆`
                : mech.souls ? `+${mech.souls} Soul${mech.souls === 1 ? '' : 's'}`
                    : mech.healPct ? `heal ${Math.round(mech.healPct * 100)}%`
                        : 'converts';
            return {
                keyword: kw ?? 'Overkill',
                heroText: cash,
                heroSub: mech.healPct && !mech.conviction && !mech.souls
                    ? 'of the excess'
                    : `per ${mech.per} past lethal`,
                verbLine: 'damage driven past the killing blow is not wasted — it converts at the printed rate',
            };
        }
        default:
            return null;
    }
}

/** Priority order for WHICH mechanic a multi-mechanic card headlines: the
 *  identity/payoff verb wins over its modifiers (ECHO doubles PLEA → headline
 *  PLEA), and a plain `rider` verb is the last resort. */
const MECH_HEADLINE_PRIORITY: readonly string[] = [
    'peroration', 'sway', 'turnabout', 'stagger', 'lock_stance', 'reprise', 'replay_last',
    'omen', 'consume_affliction', 'soul_gain', 'spend_premises', 'premise',
    // THE BIG NUMBERS REWRITE — a card that DEALS leads with the number it
    // deals: that is the whole point of the rescale, and burying 45 damage
    // behind a `WRATH +2` badge would be the old lie in a new coat. The
    // scalers rank next, so a pure-scaler card (no `deal`) still headlines its
    // own verb; every one of them also renders as a keyword chip regardless.
    'deal', 'execute', 'wrath', 'flay', 'chain', 'twin', 'overkill',
    // (`conjure_card` stays: cloud phase 29 retired CONJURE off zero library
    // carriers, but this session's WS2.1 Haunt work ships live sandbox
    // conjure cards — the mechanic is card-local vocabulary, not a ghost.)
    'foretell', 'extend_dots', 'convert_dots', 'boost_all_dots', 'recoil_x', 'recoil',
    // Profane Canon: PURGE is the whole card (a curse's only reason to exist),
    // so it outranks IMMOLATE's printed cost, which in turn outranks the plain
    // rider it pays for.
    'purge_self', 'immolate',
    'conjure_card', 'strip_random_buff', 'echo', 'echo_next_spell', 'rider',
];

/** The single mechanic a card should headline (highest-priority headline-able
 *  entry), or null when none of its mechanics carries a player headline. */
function headlineMechanic(mechs: readonly CardSpecialMechanic[]): CardSpecialMechanic | null {
    for (const kind of MECH_HEADLINE_PRIORITY) {
        const m = mechs.find(x => x.kind === kind);
        if (m && mechanicHeadline(m)) return m;
    }
    return null;
}

function buildDetailKeywords(card: CombatCard, c: CardCalc, sourceCard?: Card): { name: string; def: string; minor: boolean }[] {
    const out: { name: string; def: string; minor: boolean }[] = [];
    const seen = new Set<string>();
    const push = (kw: string | null, minor: boolean) => {
        if (!kw) return;
        const up = kw.toUpperCase();
        if (seen.has(up)) return;
        seen.add(up);
        out.push({ name: up, def: keywordGloss(kw) ?? '', minor });
    };
    if (c.kind === 'guard') push(keywordForVerb(card.verbClass), false);
    // 2026-07-12 (owner playtest, REVERSING the 07-11 type-chip-first order) —
    // Oath/Hex are card TYPES, not payload keywords: the
    // type already reads on the card frame's type strip, so the inspect panel
    // carries PAYLOAD keywords ONLY (the face's verb-slot keyword, then any
    // authored effect ids, then the rest of the persistentEffect summary's
    // keywords). A persistent card whose passive resolves nothing renders an
    // empty panel rather than restating its type (KW-5 guarantees every
    // library card resolves at least one).
    else if (c.kind === 'oath' || c.kind === 'hex') {
        // (c.keyword falls back to the bare type word on a payload-less card —
        // that fallback belongs to the FACE verb slot, never to this panel.)
        if (c.keyword !== 'Oath' && c.keyword !== 'Hex') push(c.keyword, false);
        for (const ce of sourceCard?.combatEffects ?? []) push(keywordForEffect(ce.effectId), false);
        for (const kw of keywordsInPersistentText(sourceCard?.persistentEffect)) push(kw, false);
    } else push(c.keyword, c.kind === 'inert');
    // A riposte card also grants Guard — surface it as a secondary keyword.
    if (c.kind === 'riposte' && c.guardAmount) push(keywordForVerb('defend'), false);
    // A rider is "minor" only if the engine still doesn't read it (engineHonestKind null).
    for (const r of c.riders) push(keywordForEffect(r.effectId), engineHonestKind(r.effectId) === null);
    // 2026-07-12 (owner directive: EVERY keyword a card prints must pop a
    // definition) — sweep the whole printed surface, not just the headline:
    // authored statuses, every special-mechanic kind, and any UPPERCASE
    // registry word on the engine lines. The keyword panel IS the popup; a
    // printed keyword without a chip is unexplained vocabulary.
    for (const ce of sourceCard?.combatEffects ?? []) push(keywordForEffect(ce.effectId), false);
    for (const m of sourceCard?.specialMechanics ?? []) {
        push(keywordForMechanic(m.kind), false);
        // SENTENCE is card-local (demoted, phase 29): the CHARGE gloss
        // explains its trigger; the word itself pops via the system glossary.
        if (m.kind === 'peroration') push('Charge', false);
    }
    const printed = [card.topActionText, card.bottomActionText, ...(card.dieLines ?? []), freeLineText(card, sourceCard)].join(' ');
    for (const kw of keywordsInPersistentText(printed)) push(kw, false);
    // D-fix (card-wording audit 2026-07-12): a FREE-line rider is applied by
    // the rider path, not a combatEffect, and prints in lowercase — neither
    // sweep above sees it, so MARK printed on a no-die line rendered no panel
    // on five decks. Sweep the authored free rider's own keyword pairs.
    if (sourceCard?.free) {
        for (const [kw] of riderPairs(sourceCard.free)) {
            const title = kw.charAt(0) + kw.slice(1).toLowerCase();
            if (keywordGloss(title)) push(title, false);
        }
    }
    // Owner playtest 2026-07-18 — the flag-on always-on BOON gloss is GONE:
    // a die-face rule is unrelated to the card being inspected, so it no longer
    // rides every panel. BOON/HONE/TEMPER still resolve through the printed
    // sweep above whenever a card's OWN lines name them.
    return out;
}

/** Honest card FACE view-model (the 5-zone hand card). */
export function faceStats(card: CombatCard, sourceCard?: Card, enemyDifficulty?: EnemyDifficulty): CombatCardFaceVM {
    const c = cardCalc(card, sourceCard);
    const stanceColor = STANCE_COLORS[card.stance] ?? '#888';
    const kw = c.keyword ? c.keyword.toUpperCase() : null;
    // The authored FREE line (engine riderText) — never a fabricated chip.
    const free = freeLineText(card, sourceCard);
    const freeGlyph = freeGlyphMeta(card, sourceCard);
    const base = {
        glyph: c.glyph, categoryColor: c.categoryColor, stanceColor,
        statusBase: null, statusAdv: null, statusDis: null,
        ...freeRail(card, sourceCard), freeGlyph: freeGlyph.glyph, freeGlyphKey: freeGlyph.key,
        typeStrip: typeStripText(card),
    };
    switch (c.kind) {
        case 'dot': {
            // WI-2 — trigger-aware face. Event DoTs (poison/bleed) tick per game
            // event, never at the round boundary, so the round-clock "total over
            // Nt" face was a lie for them (passive play deals literally 0). The
            // read triplet still applies to the PER-TICK swing (▲ +1 intensity
            // hits harder; ▼ −1 turn shortens the window, per-tick unchanged).
            const perTickAdv = Math.floor(c.dpr * (c.intensity + READ_ADVANTAGE_INTENSITY_BONUS));
            const evt = c.dotTrigger === 'card-played'
                ? { hero: `${c.perTurn}/play`, sub: `per card you play · ${c.turns}t`, verb: 'foe loses VITAE each card you play' }
                : c.dotTrigger === 'damage-instance'
                    ? { hero: `${c.perTurn}/hit`, sub: `per hit taken · ${c.intensity} stack${c.intensity === 1 ? '' : 's'}`, verb: 'foe loses VITAE each time it is struck' }
                    : c.dotTrigger === 'payoff'
                        ? { hero: `${c.perTurn}/payoff`, sub: `per payoff you detonate · ${c.turns}t`, verb: 'foe loses VITAE each payoff you detonate' }
                        : null;
            if (evt) return { ...base, kind: 'dot', keyword: kw, heroText: evt.hero, heroSub: evt.sub, freeHeroText: free, freeHeroSub: null, verbLine: evt.verb, powerRail: c.keyword ?? 'DoT', readDependent: true, inert: false, guardBase: null, statusBase: c.perTurn, statusAdv: perTickAdv, statusDis: c.perTurn };
            // DOOM: no calendar, and the stack grows every time the foe acts —
            // print the per-turn bite and the growth clause, never a lifetime.
            if (c.dotGrowsOnEnemyAction) {
                return { ...base, kind: 'dot', keyword: kw, heroText: `${c.perTurn}/turn`, heroSub: 'grows each time the foe acts', freeHeroText: free, freeHeroSub: null, verbLine: 'foe loses VITAE each turn, and the doom deepens as it acts', powerRail: c.keyword ?? 'DoT', readDependent: true, inert: false, guardBase: null, statusBase: c.perTurn, statusAdv: Math.floor(c.dpr * (c.intensity + READ_ADVANTAGE_INTENSITY_BONUS)), statusDis: c.perTurn };
            }
            // Round-clock DoT: the honest "total over N turns" face stands.
            return { ...base, kind: 'dot', keyword: kw, heroText: `${c.total}`, heroSub: `over ${c.turns} turns`, freeHeroText: free, freeHeroSub: null, verbLine: 'foe loses VITAE each turn', powerRail: c.keyword ?? 'DoT', readDependent: true, inert: false, guardBase: null, statusBase: c.total, statusAdv: c.totalAdv, statusDis: c.totalDis };
        }
        case 'stun': return { ...base, kind: 'stun', keyword: kw, heroText: `skip ${c.skips} turns`, heroSub: null, freeHeroText: free, freeHeroSub: null, verbLine: "the foe can't act", powerRail: c.keyword ?? 'Stun', readDependent: false, inert: false, guardBase: null };
        case 'weaken': return { ...base, kind: 'weaken', keyword: kw, heroText: '', heroSub: c.turns > 0 ? `hits softer · ${c.turns} turns` : 'weakens its hits', freeHeroText: free, freeHeroSub: null, verbLine: "weakens the foe's hits", powerRail: c.keyword ?? 'Weaken', readDependent: false, inert: false, guardBase: null };
        case 'mark': return { ...base, kind: 'mark', keyword: kw, heroText: `+${c.markAmp}/tick`, heroSub: `${c.turns} turns`, freeHeroText: free, freeHeroSub: null, verbLine: 'every DoT tick on the foe bites harder', powerRail: c.keyword ?? 'Mark', readDependent: false, inert: false, guardBase: null };
        case 'backfire': return { ...base, kind: 'backfire', keyword: kw, heroText: `${c.backfireN}/rung`, heroSub: `${c.turns} turns`, freeHeroText: free, freeHeroSub: null, verbLine: 'the foe takes damage per rung its actions lose', powerRail: c.keyword ?? 'Backfire', readDependent: false, inert: false, guardBase: null };
        case 'regen': return { ...base, kind: 'regen', keyword: kw, heroText: `${c.total}`, heroSub: `over ${c.turns} turns`, freeHeroText: free, freeHeroSub: null, verbLine: 'heal yourself each turn', powerRail: c.keyword ?? 'Regen', readDependent: false, inert: false, guardBase: null };
        case 'guard': { const b = c.guardAmount ?? 0; return { ...base, kind: 'guard', keyword: 'GUARD', heroText: `Guard ${b}`, heroSub: null, freeHeroText: free, freeHeroSub: null, verbLine: 'block the next hit', powerRail: `${b} ↑read`, readDependent: true, inert: false, guardBase: b }; }
        case 'befriend': return { ...base, kind: 'befriend', keyword: 'SPARE', heroText: '', heroSub: 'spare a near-dead foe', freeHeroText: 'mercy', freeHeroSub: null, verbLine: 'spare a near-dead foe', powerRail: 'mercy', readDependent: false, inert: false, guardBase: null };
        case 'vulnerable': return { ...base, kind: 'vulnerable', keyword: kw, heroText: `+${c.vulnPct}%`, heroSub: `dmg taken · ${c.turns} turns`, freeHeroText: free, freeHeroSub: null, verbLine: 'foe takes more damage', powerRail: c.keyword ?? 'Vulnerable', readDependent: true, inert: false, guardBase: null, statusBase: c.vulnPct, statusAdv: c.vulnPctAdv, statusDis: c.vulnPct };
        case 'thorns': return { ...base, kind: 'thorns', keyword: kw, heroText: `Reflect ${c.reflectN}`, heroSub: `${c.turns} turns`, freeHeroText: free, freeHeroSub: null, verbLine: 'reflect damage to attackers', powerRail: c.keyword ?? 'Thorns', readDependent: false, inert: false, guardBase: null };
        // ── card-overhaul (2026-07-03) — the 6 previously-blank effects ──
        case 'exposure': return { ...base, kind: 'exposure', keyword: kw, heroText: `${c.exposureDelta} DEF`, heroSub: `${c.turns} turns`, freeHeroText: free, freeHeroSub: null, verbLine: 'foe defends softer', powerRail: c.keyword ?? 'Exposure', readDependent: false, inert: false, guardBase: null };
        case 'doubt': return { ...base, kind: 'doubt', keyword: kw, heroText: '', heroSub: 'forces weak tier next play', freeHeroText: free, freeHeroSub: null, verbLine: "the foe's next play is forced to weak tier", powerRail: c.keyword ?? 'Doubt', readDependent: false, inert: false, guardBase: null };
        case 'sensoryNull': return { ...base, kind: 'sensoryNull', keyword: kw, heroText: '', heroSub: 'blocks advantage · dulls control', freeHeroText: free, freeHeroSub: null, verbLine: "blocks the foe's advantage reads and dulls its control", powerRail: c.keyword ?? 'Sensory Null', readDependent: false, inert: false, guardBase: null };
        case 'isolated': return { ...base, kind: 'isolated', keyword: kw, heroText: '', heroSub: 'denies ally-buff targeting', freeHeroText: free, freeHeroSub: null, verbLine: 'denies the foe ally-buff targeting (solo: denies its own self-buff)', powerRail: c.keyword ?? 'Isolated', readDependent: false, inert: false, guardBase: null };
        case 'overextended': return { ...base, kind: 'overextended', keyword: kw, heroText: '', heroSub: 'your next play is weakened', freeHeroText: free, freeHeroSub: null, verbLine: 'a self-cost: your next play is forced to weak tier', powerRail: c.keyword ?? 'Overextended', readDependent: false, inert: false, guardBase: null };
        case 'clarity': return { ...base, kind: 'clarity', keyword: kw, heroText: 'WILD', heroSub: 'next die', freeHeroText: free, freeHeroSub: null, verbLine: 'your next die counts as Wild', powerRail: c.keyword ?? 'Clarity', readDependent: false, inert: false, guardBase: null };
        case 'resolute': return { ...base, kind: 'resolute', keyword: kw, heroText: `${c.resolutePct}%`, heroSub: `dmg taken · ${c.turns} turns`, freeHeroText: free, freeHeroSub: null, verbLine: 'you take less damage', powerRail: c.keyword ?? 'Resolute', readDependent: false, inert: false, guardBase: null, statusBase: c.resolutePct };
        case 'barrier': return { ...base, kind: 'barrier', keyword: 'GUARD', heroText: `Guard ${c.barrierAmt}`, heroSub: 'persists', freeHeroText: free, freeHeroSub: null, verbLine: 'soak incoming damage', powerRail: c.keyword ?? 'Guard', readDependent: false, inert: false, guardBase: null };
        case 'riposte': return { ...base, kind: 'riposte', keyword: 'RIPOSTE', heroText: `CTR ${c.riposteDmg} · CUT ${c.riposteReduce}`, heroSub: 'counter · reduce', freeHeroText: free, freeHeroSub: null, verbLine: 'counter the next hit', powerRail: c.keyword ?? 'Riposte', readDependent: false, inert: false, guardBase: null };
        case 'siphon': return { ...base, kind: 'siphon', keyword: 'SIPHON', heroText: `Heal ${c.siphonPct}%`, heroSub: 'of the burst', freeHeroText: free, freeHeroSub: null, verbLine: 'heal from the harm you cash in', powerRail: c.keyword ?? 'Siphon', readDependent: false, inert: false, guardBase: null };
        case 'rupture': return { ...base, kind: 'rupture', keyword: 'RUPTURE', heroText: 'detonate', heroSub: 'all afflictions', freeHeroText: free, freeHeroSub: null, verbLine: "consume the foe's afflictions and detonate them", powerRail: c.keyword ?? 'Rupture', readDependent: false, inert: false, guardBase: null };
        case 'reap': return { ...base, kind: 'reap', keyword: 'REAP', heroText: c.reapCost > 0 ? `${c.reapCost} Souls` : 'all Souls', heroSub: c.reapPerSoul > 0 ? `${c.reapPerSoul} per Soul` : 'spend the bank', freeHeroText: free, freeHeroSub: null, verbLine: 'spend Souls for the printed payoff', powerRail: c.keyword ?? 'Reap', readDependent: false, inert: false, guardBase: null };
        case 'forge': { const clause = forgeClause(c.mech) ?? 'shape your dice'; return { ...base, kind: 'forge', keyword: kw, heroText: '', heroSub: clause, freeHeroText: free, freeHeroSub: null, verbLine: clause, powerRail: c.keyword ?? 'Forge', readDependent: false, inert: false, guardBase: null }; }
        // 2026-07-12 — the verb slot is the PAYLOAD keyword (cardCalc), never
        // the bare type word unless no payload resolves; the type stays on the
        // type strip (OATH / HEX) and the type chip.
        case 'oath': return { ...base, kind: 'oath', keyword: kw ?? 'OATH', heroText: '', heroSub: 'rest of combat', freeHeroText: free, freeHeroSub: null, verbLine: 'a persistent passive on your side', powerRail: c.keyword ?? 'Oath', readDependent: false, inert: false, guardBase: null };
        case 'hex': return { ...base, kind: 'hex', keyword: kw ?? 'HEX', heroText: '', heroSub: 'curse · rest of combat', freeHeroText: free, freeHeroSub: null, verbLine: 'a standing curse attached to the enemy', powerRail: c.keyword ?? 'Hex', readDependent: false, inert: false, guardBase: null };
        // A keyword-less headline (DEAL — "Deal 24" needs no badge) leaves the
        // verb slot empty on purpose; the power rail then carries the hero
        // number rather than the em-dash placeholder, so the card still reads.
        case 'mechanic': { const h = mechanicHeadline(c.mech, enemyDifficulty); return { ...base, kind: 'mechanic', keyword: kw, heroText: h?.heroText ?? '', heroSub: h?.heroSub ?? null, freeHeroText: free, freeHeroSub: null, verbLine: h?.verbLine ?? '', powerRail: c.keyword ?? h?.heroText ?? '—', readDependent: false, inert: false, guardBase: null }; }
        case 'inert':
        default: return { ...base, kind: 'inert', keyword: kw ?? 'DEBUFF', heroText: '', heroSub: card.verbClass === 'buff-self' ? 'buff yourself' : 'weakens the foe', freeHeroText: free, freeHeroSub: null, verbLine: card.verbClass === 'buff-self' ? 'buff yourself' : 'weakens the foe', powerRail: c.keyword ?? '—', readDependent: false, inert: true, guardBase: null };
    }
}

/** Honest card DETAIL view-model CORE (everything but the pill table). */
function detailCore(card: CombatCard, sourceCard?: Card, enemyDifficulty?: EnemyDifficulty): DetailCore {
    const c = cardCalc(card, sourceCard);
    const Title = c.keyword ?? '';
    const STANCE = STANCE_LABELS[card.stance] ?? card.stance.toUpperCase();
    // Spec 32 v3 — the meta chip surfaces the RANK NAME + CARD TYPE (where the
    // gold tag used to sit): e.g. 'BODY · ASH · SPELL · DOT'.
    const rankName = card.rank ? RANK_NAMES[card.rank] : null;
    // Player-facing type vocabulary (owner directive 2026-07-09): a hex
    // prints as HEX — the engine term stays `hex` internally.
    const typeLabel = card.cardType === 'oath' ? 'OATH'
        : card.cardType === 'hex' ? 'HEX'
            : card.cardType === 'spell' ? 'SPELL' : null;
    // 2026-09-21 (W3, owner finding 3) — the trailing engine-jargon word
    // ('DOT' / 'CONTROL' / 'DIRECT-DAMAGE') is CUT: the keyword ledger above
    // and the ◆ +DIE row below both already say what the card does, in the
    // player's vocabulary, and no one re-plans a turn because the strip says
    // DIRECT-DOT. Its slot goes to the rarity band (D4), so the strip carries
    // one more decision-relevant fact in the same single row.
    const metaChip = [
        card.stance.toUpperCase(),
        rankName ? rankName.toUpperCase() : `TIER ${card.tier}`,
        RARITY_LABEL[rarityFor(card)].toUpperCase(),
        ...(typeLabel ? [typeLabel] : []),
    ].join(' · ');
    const keywords = buildDetailKeywords(card, c, sourceCard);
    // The authored FREE line (engine riderText) — the strike/chip is dead.
    const free = freeLineText(card, sourceCard);
    const freeLine = `◇ FREE (no die): ${free}.`;
    switch (c.kind) {
        case 'dot': {
            // WI-2 — event DoTs (poison=card-played, bleed=damage-instance) tick
            // on a game event, never at the round boundary; the "PER TURN / TURNS
            // / TOTAL" table is a lie for them. Print "PER TICK / TRIGGER /
            // DURATION" and describe the real trigger instead.
            if (c.dotTrigger) {
                const perTickAdv = Math.floor(c.dpr * (c.intensity + READ_ADVANTAGE_INTENSITY_BONUS));
                const evt = c.dotTrigger === 'card-played' ? { noun: 'card you play', trig: 'per card played', dur: { label: 'DURATION', value: `${c.turns}t` } }
                    : c.dotTrigger === 'damage-instance' ? { noun: 'time it is struck', trig: 'per hit taken', dur: { label: 'STACKS', value: `${c.intensity}` } }
                        : { noun: 'payoff you detonate', trig: 'per payoff', dur: { label: 'DURATION', value: `${c.turns}t` } };
                return {
                    subtitle: `${Title} the enemy — ticks ${evt.trig}.`, metaChip,
                    outcomeLine: `Apply ${Title} — ${c.perTurn} VITAE each ${evt.noun}.`,
                    outcomeStats: [{ label: 'PER TICK', value: `${c.perTurn}` }, { label: 'TRIGGER', value: evt.trig }, evt.dur],
                    stacksText: c.stacks ? 'Stacks by intensity.' : null, freeLine,
                    powerLine: `◆ WITH A DIE: apply ${Title} — ${c.perTurn} VITAE each ${evt.noun} while it holds, plus a small hit.`,
                    readNote: `The read scales the PER-TICK bite: ▲ won read lands +${READ_ADVANTAGE_INTENSITY_BONUS} intensity (${perTickAdv}/tick), ▼ lost read −${READ_DISADVANTAGE_DURATION_PENALTY} turn of duration.`,
                    mathLine: `${c.perTurn}/tick = ${c.dpr} base × ${c.intensity} intensity, ${evt.trig}${c.stacks ? ' · stacks by intensity' : ''}.`,
                    keywords,
                };
            }
            return { subtitle: `${Title} the enemy — damage over time.`, metaChip, outcomeLine: `Apply ${Title} ${c.total} over ${c.turns} turns.`, outcomeStats: [{ label: 'PER TURN', value: `${c.perTurn}` }, { label: 'TURNS', value: `${c.turns}` }, { label: 'TOTAL', value: `${c.total}` }], stacksText: c.stacks ? 'Stacks up to 10×.' : null, freeLine, powerLine: `◆ WITH A DIE: apply ${Title} — ${c.perTurn} VITAE/turn for ${c.turns} turns (${c.total} total), plus a small hit.`, readNote: `The read is exact: ▲ won read lands +${READ_ADVANTAGE_INTENSITY_BONUS} intensity (${c.totalAdv} total), ▼ lost read −${READ_DISADVANTAGE_DURATION_PENALTY} turn (${c.totalDis} total); ${c.total} on an even read.`, mathLine: `${c.perTurn}/turn = ${c.dpr} base × ${c.intensity} intensity · ${c.turns} turns · ${c.total} VITAE total on an even read${c.stacks ? ' · stacks to 10×' : ''}.`, keywords };
        }
        case 'stun': return { subtitle: `${Title} the enemy — it loses its turns.`, metaChip, outcomeLine: `Apply ${Title} ${c.skips} turn${c.skips === 1 ? '' : 's'}.`, outcomeStats: [{ label: 'SKIPS', value: `${c.skips} turns` }], stacksText: null, freeLine, powerLine: `◆ WITH A DIE: ${Title} — the foe skips its next ${c.skips} actions, plus a small hit.`, readNote: `The read is exact: ▲ won read changes nothing (skips are duration-driven), ▼ lost read shortens the skip by ${READ_DISADVANTAGE_DURATION_PENALTY} turn (floor 1).`, mathLine: `skip ${c.skips}t = ${Title.toLowerCase()} duration ${c.skips} (each turn it would act is cancelled).`, keywords };
        case 'weaken': return { subtitle: `${Title} the enemy — its attacks hit softer.`, metaChip, outcomeLine: c.turns > 0 ? `Apply ${Title} · ${c.turns} turns.` : `Apply ${Title}.`, outcomeStats: c.turns > 0 ? [{ label: 'TURNS', value: `${c.turns}` }] : [], stacksText: c.stacks ? 'Stacks by intensity.' : null, freeLine, powerLine: `◆ WITH A DIE: apply ${Title} — the foe's hits land softer while it holds.`, readNote: `${Title} weakens the enemy's blows; pile on STAGGER to deny the turn outright.`, mathLine: `${Title} reduces the enemy's outgoing damage while active (real engine units).`, keywords };
        case 'mark': return { subtitle: `${Title} the enemy — the flaw is named.`, metaChip, outcomeLine: `Apply ${Title} +${c.markAmp}/tick · ${c.turns} turns.`, outcomeStats: [{ label: 'PER TICK', value: `+${c.markAmp}` }, { label: 'TURNS', value: `${c.turns}` }], stacksText: c.stacks ? 'Stacks by intensity.' : null, freeLine, powerLine: `◆ WITH A DIE: apply ${Title} — every DoT tick and payoff hit on the foe deals +${c.markAmp} while it holds.`, readNote: `${Title} counts as an affliction — RUPTURE, SOUL, and REAP all feed on it.`, mathLine: `+${c.markAmp}/tick = tickAmplifyFlat × intensity, for ${c.turns} turns.`, keywords };
        case 'backfire': return { subtitle: `${Title} — denied blows land inward.`, metaChip, outcomeLine: `Apply ${Title} ${c.backfireN}/rung · ${c.turns} turns.`, outcomeStats: [{ label: 'PER RUNG', value: `${c.backfireN}` }, { label: 'TURNS', value: `${c.turns}` }], stacksText: c.stacks ? 'Stacks by intensity.' : null, freeLine, powerLine: `◆ WITH A DIE: apply ${Title} — the foe takes ${c.backfireN} per rung its actions lose while it holds.`, readNote: `Pair with STAGGER: every rung you strip is ${c.backfireN} VITAE off the foe.`, mathLine: `${c.backfireN}/rung = backfirePerRung × intensity, for ${c.turns} turns.`, keywords };
        case 'regen': return { subtitle: 'Heal yourself over time.', metaChip, outcomeLine: `${Title || 'Regenerate'} ${c.total} over ${c.turns} turns.`, outcomeStats: [{ label: 'PER TURN', value: `${c.perTurn}` }, { label: 'TURNS', value: `${c.turns}` }, { label: 'TOTAL', value: `${c.total}` }], stacksText: null, freeLine, powerLine: `◆ WITH A DIE: regenerate ${c.perTurn} VITAE/turn for ${c.turns} turns (${c.total} total). Needs a ${STANCE} or WILD die.`, readNote: `Heals YOU — no read needed; ${c.total} is exact.`, mathLine: `${c.perTurn}/turn = ${c.dpr} base × ${c.intensity} intensity · ${c.turns} turns · ${c.total} total.`, keywords };
        case 'guard': { const b = c.guardAmount ?? 0; const adv = Math.max(1, Math.round(b * READ_DAMAGE_MULT.advantage)); const dis = Math.max(1, Math.round(b * READ_DAMAGE_MULT.disadvantage)); return { subtitle: 'Guard yourself — soak the next hit.', metaChip, outcomeLine: `Gain ${Title} ${b}.`, outcomeStats: [{ label: 'GUARD', value: `${b} (▲${adv} · —${b} · ▼${dis})` }], stacksText: null, freeLine, powerLine: `◆ WITH A DIE: Guard ${b}; ▲ read raises it to ${adv}, ▼ read drops it to ${dis}; +${colorMatchBonus(b)} if a ${STANCE} die matches.`, readNote: `The read scales this: ▲ advantage ×${READ_DAMAGE_MULT.advantage}, ▼ disadvantage ×${READ_DAMAGE_MULT.disadvantage}.`, mathLine: `POWER = round(${b} × read) + ${colorMatchBonus(b)} on a colour match.`, keywords }; }
        case 'befriend': return { subtitle: 'Spare a near-dead foe.', metaChip, outcomeLine: 'Spare a near-dead foe — end combat peacefully.', outcomeStats: [], stacksText: null, freeLine, powerLine: '◆ WITH A DIE: if the enemy VITAE is low, end combat peacefully (befriend).', readNote: 'Watch the enemy VITAE bar — befriend lands only when it is low.', mathLine: 'No fixed number — a conditional outcome gated on low enemy VITAE.', keywords };
        case 'vulnerable': { const cap = Math.round((VULNERABLE_MAX_MULT - 1) * 100); return { subtitle: `${Title} the enemy — it takes more damage.`, metaChip, outcomeLine: `Apply ${Title} +${c.vulnPct}% · ${c.turns} turns.`, outcomeStats: [{ label: 'DMG TAKEN', value: `+${c.vulnPct}%` }, { label: 'TURNS', value: `${c.turns}` }], stacksText: `Stacks to +${cap}%.`, freeLine, powerLine: `◆ WITH A DIE: apply ${Title} — +${c.vulnPct}% damage taken for ${c.turns} turns, plus a small hit.`, readNote: `The read is exact: ▲ won read lands +${READ_ADVANTAGE_INTENSITY_BONUS} intensity (+${c.vulnPctAdv}%), ▼ lost read −${READ_DISADVANTAGE_DURATION_PENALTY} turn; +${c.vulnPct}% on an even read.`, mathLine: `+${c.vulnPct}% = (damageTakenMult − 1) × 100 × intensity on an even read; combined Vulnerable caps at +${cap}%.`, keywords }; }
        case 'thorns': return { subtitle: `${Title} — attackers take damage back.`, metaChip, outcomeLine: `Gain ${Title} ${c.reflectN} · ${c.turns} turns.`, outcomeStats: [{ label: 'REFLECT', value: `${c.reflectN}` }, { label: 'TURNS', value: `${c.turns}` }], stacksText: c.intensity > 1 || (lookupEffect(c.ce?.effectId ?? '')?.stacking === 'intensity') ? 'Stacks.' : null, freeLine, powerLine: `◆ WITH A DIE: gain ${Title} (Reflect ${c.reflectN}) plus a small hit.`, readNote: 'Your reflect takes no read — Reflect is exact (a self-buff, not scaled by the stance read).', mathLine: `Reflect ${c.reflectN} returned per enemy hit, ${c.turns} turns; stacking raises the reflect.`, keywords };
        // ── card-overhaul (2026-07-03) — the 6 previously-blank effects ──
        case 'exposure': return { subtitle: `${Title} the enemy — its defenses give.`, metaChip, outcomeLine: `Apply ${Title} ${c.exposureDelta} DEF · ${c.turns} turns.`, outcomeStats: [{ label: 'DEF', value: `${c.exposureDelta}` }, { label: 'TURNS', value: `${c.turns}` }], stacksText: c.stacks ? 'Stacks by intensity.' : null, freeLine, powerLine: `◆ WITH A DIE: apply ${Title} — ${c.exposureDelta} DEF for ${c.turns} turns, plus a small hit.`, readNote: `${Title} is a flat defense cut — it does not scale with the read.`, mathLine: `${c.exposureDelta} DEF = defenseModifier on an even application${c.stacks ? '; stacks by intensity' : ''}.`, keywords };
        case 'doubt': return { subtitle: `${Title} the enemy — its next play is forced weak.`, metaChip, outcomeLine: `Apply ${Title} · ${c.turns} turn${c.turns === 1 ? '' : 's'}.`, outcomeStats: [], stacksText: null, freeLine, powerLine: `◆ WITH A DIE: apply ${Title} — the foe's next card play is forced to weak-tier even if it spends a die, plus a small hit.`, readNote: `${Title} is consumed on the foe's next play — a one-shot tax, not a scaling number.`, mathLine: `${Title} forces weak-tier resolution on the foe's next play, then is consumed — no fixed number (real-units-or-no-number).`, keywords };
        case 'sensoryNull': return { subtitle: `${Title} the enemy — its reads and controls dull.`, metaChip, outcomeLine: `Apply ${Title} · ${c.turns} turns.`, outcomeStats: [{ label: 'TURNS', value: `${c.turns}` }], stacksText: null, freeLine, powerLine: `◆ WITH A DIE: apply ${Title} — blocks the foe's advantage reads and dulls its control accuracy for ${c.turns} turns, plus a small hit.`, readNote: `${Title} denies the foe's own read/control edge — no fabricated number, just the blocked mechanic.`, mathLine: `${Title} blocks advantage-read access and reduces control accuracy for ${c.turns} turns.`, keywords };
        case 'isolated': return { subtitle: `${Title} the enemy — no help is coming.`, metaChip, outcomeLine: `Apply ${Title} · ${c.turns} turn${c.turns === 1 ? '' : 's'}.`, outcomeStats: [], stacksText: null, freeLine, powerLine: `◆ WITH A DIE: apply ${Title} — denies the foe ally-buff targeting (solo fights deny its own self-buff card instead) for ${c.turns} turn${c.turns === 1 ? '' : 's'}, plus a small hit.`, readNote: `${Title} denies a targeting option, not a number — real-units-or-no-number.`, mathLine: `${Title} denies ally-buff targeting (or, solo, denies a self-buff card) for ${c.turns} turn${c.turns === 1 ? '' : 's'}.`, keywords };
        case 'overextended': return { subtitle: `${Title} — a self-cost for reaching too far.`, metaChip, outcomeLine: `Take ${Title} · ${c.turns} turn${c.turns === 1 ? '' : 's'}.`, outcomeStats: [], stacksText: null, freeLine, powerLine: `◆ WITH A DIE: this play also costs you ${Title} — your own next card play is forced to weak-tier, then consumed.`, readNote: `${Title} is consumed on your own next play — the price of this card's payoff.`, mathLine: `${Title} forces your own next play to weak-tier, then is consumed — no fixed number (real-units-or-no-number).`, keywords };
        case 'clarity': return { subtitle: `${Title} — your next die is Wild.`, metaChip, outcomeLine: `Gain ${Title} — next die: WILD.`, outcomeStats: [{ label: 'NEXT DIE', value: 'WILD' }], stacksText: null, freeLine, powerLine: `◆ WITH A DIE: gain ${Title} — the next die you draft counts as Wild, plus a small hit.`, readNote: `${Title} is exact — the next die is Wild, full stop, then consumed.`, mathLine: `${Title}: next die → Wild (forceWildOnNextDie), consumed on use.`, keywords };
        case 'resolute': return { subtitle: `${Title} — you take less damage.`, metaChip, outcomeLine: `Gain ${Title} ${c.resolutePct}% · ${c.turns} turns.`, outcomeStats: [{ label: 'DMG TAKEN', value: `${c.resolutePct}%` }, { label: 'TURNS', value: `${c.turns}` }], stacksText: c.stacks ? 'Stacks by intensity.' : null, freeLine, powerLine: `◆ WITH A DIE: gain ${Title} — ${c.resolutePct}% damage taken for ${c.turns} turns, plus a small hit.`, readNote: `Your damage reduction takes no read — ${Title} is exact (a self-buff, not scaled by the stance read).`, mathLine: `${c.resolutePct}% = (damageTakenMult − 1) × 100 on an even application${c.stacks ? '; stacks by intensity' : ''}.`, keywords };
        case 'barrier': { const b = c.barrierAmt; const adv = Math.max(1, Math.round(b * READ_DAMAGE_MULT.advantage)); const dis = Math.max(1, Math.round(b * READ_DAMAGE_MULT.disadvantage)); return { subtitle: 'Barrier — a stacking shield that soaks damage.', metaChip, outcomeLine: `Gain ${Title} ${b}.`, outcomeStats: [{ label: 'SOAK', value: `${b} (▲${adv} · —${b} · ▼${dis})` }], stacksText: null, freeLine, powerLine: `◆ WITH A DIE: gain Barrier ${b}; ▲ read raises it to ${adv}, ▼ drops it to ${dis}; +${colorMatchBonus(b)} on a ${STANCE} match.`, readNote: `The read scales the Barrier granted: ▲ ×${READ_DAMAGE_MULT.advantage}, ▼ ×${READ_DAMAGE_MULT.disadvantage}.`, mathLine: `Soak ${b} base × read + ${colorMatchBonus(b)} on a colour match; barriers stack.`, keywords }; }
        case 'riposte': { const guardLine = c.guardAmount ? ` · Guard ${c.guardAmount}` : ''; const stats = [{ label: 'COUNTER', value: `${c.riposteDmg}` }, { label: 'REDUCE', value: `-${c.riposteReduce}` }]; if (c.guardAmount) stats.push({ label: 'GUARD', value: `${c.guardAmount}` }); return { subtitle: 'Riposte — counter the next hit and blunt it.', metaChip, outcomeLine: `Arm ${Title} — Counter ${c.riposteDmg} · Cut ${c.riposteReduce}${guardLine}.`, outcomeStats: stats, stacksText: null, freeLine, powerLine: `◆ WITH A DIE: arm Riposte — counter ${c.riposteDmg}, reduce ${c.riposteReduce}${c.guardAmount ? `, +Guard ${c.guardAmount}` : ''}; the read scales it.`, readNote: 'The read scales both the counter damage and the reduction.', mathLine: `Counter ${c.riposteDmg} & reduce ${c.riposteReduce}, each × read (+${colorMatchBonus(c.riposteDmg)} counter on a colour match).`, keywords }; }
        case 'siphon': return { subtitle: 'Siphon — heal for part of the harm you cash in.', metaChip, outcomeLine: `${Title} ${c.siphonPct}%.`, outcomeStats: [{ label: 'LIFESTEAL', value: `${c.siphonPct}%` }], stacksText: null, freeLine, powerLine: `◆ WITH A DIE: heal ${c.siphonPct}% of the VITAE this card's payoff erodes.`, readNote: `The burst is live; the ${c.siphonPct}% rate is exact.`, mathLine: `Heal = ${c.siphonPct}% × (the payoff burst) — the burst is live, so no fixed heal number.`, keywords };
        case 'rupture': {
            // THE BIG NUMBERS REWRITE — the cap is REPEALED, so the fraction is
            // Infinity. Rendering it printed "max Infinity% of the foe's max
            // VITAE" on the one detonator in the library; the cap row is simply
            // dropped when there is no cap.
            const capped = Number.isFinite(RUPTURE_CAP_FRACTION);
            const capPct = capped ? Math.round(RUPTURE_CAP_FRACTION * 100) : 0;
            const capClause = capped ? ` · max ${capPct}% of the foe's max VITAE` : ' · uncapped';
            return { subtitle: "Rupture — consume the foe's afflictions and detonate them.", metaChip, outcomeLine: `${Title}${capClause}.`, outcomeStats: [{ label: 'BURST', value: 'live total' }, ...(capped ? [{ label: 'CAP', value: `${capPct}% max VITAE` }] : [{ label: 'CAP', value: 'none' }])], stacksText: null, freeLine, powerLine: `◆ WITH A DIE: consume ALL the foe's afflictions — burst = their remaining harm${capped ? ` (up to ${capPct}% of the foe's max VITAE)` : ', uncapped'}.`, readNote: 'Stack afflictions first — the burst equals what they still owed, so it has no fixed number until you fire it.', mathLine: `Burst = remaining affliction fuel${capped ? ` (capped at ${capPct}% of the foe's max VITAE)` : ' — UNCAPPED'} — live, so no fixed number (real-units-or-no-number).`, keywords };
        }
        case 'reap': return { subtitle: 'Reap — spend Souls for the printed payoff.', metaChip, outcomeLine: c.reapCost > 0 ? `${Title} ${c.reapCost} Souls.` : `${Title} ALL Souls${c.reapPerSoul > 0 ? ` — ${c.reapPerSoul} per Soul` : ''}.`, outcomeStats: c.reapPerSoul > 0 ? [{ label: 'PER SOUL', value: `${c.reapPerSoul}` }, { label: 'CAP', value: 'none' }] : [{ label: 'COST', value: `${c.reapCost} Souls` }], stacksText: null, freeLine, powerLine: c.reapPerSoul > 0 ? `◆ WITH A DIE: spend EVERY Soul — burst ${c.reapPerSoul} per Soul spent, uncapped.` : `◆ WITH A DIE: spend ${c.reapCost} Souls to fire the printed effect (fizzles when underfunded).`, readNote: 'Souls come from expiring or consumed enemy afflictions — fill the bank first.', mathLine: c.reapPerSoul > 0 ? `Burst = ${c.reapPerSoul} × Souls spent (live, UNCAPPED — the emptied bank is the price).` : `Costs ${c.reapCost} Souls — the payoff is the printed line, in real units.`, keywords };
        case 'forge': { const clause = forgeClause(c.mech) ?? 'shape your dice'; return { subtitle: `${Title} — dice are the resource.`, metaChip, outcomeLine: `${clause.charAt(0).toUpperCase()}${clause.slice(1)}.`, outcomeStats: [], stacksText: null, freeLine, powerLine: `◆ WITH A DIE: ${vitaeCopy(card.bottomActionText)}`, readNote: 'Die-forging takes no read — the printed line is exact.', mathLine: 'A die-economy verb — the printed line is the applied effect.', keywords };
        }
        // Spec 32 v4 — persistent cards carry BOTH lines: the FREE play is a
        // timed instance of the passive; the PAID play makes it permanent,
        // unique in play, and pulls the card out of the deck cycle.
        case 'oath': return { subtitle: 'Oath — a persistent passive on your side.', metaChip, outcomeLine: `FREE: yours for ${persistentFreeRounds(card)}. PAID: rest of combat.`, outcomeStats: [], stacksText: null, freeLine, powerLine: `◆ WITH A DIE: ${vitaeCopy(card.bottomActionText)}`, readNote: `Played FREE it runs ${persistentFreeRounds(card)} and ticks out; paid with a die it is permanent — unique in play, and it leaves the deck cycle.`, mathLine: 'A standing rule, not a number — its text is the engine text.', keywords };
        case 'hex': return { subtitle: 'Hex — a standing curse on the enemy.', metaChip, outcomeLine: `FREE: on the enemy for ${persistentFreeRounds(card)}. PAID: rest of combat.`, outcomeStats: [], stacksText: null, freeLine, powerLine: `◆ WITH A DIE: ${vitaeCopy(card.bottomActionText)}`, readNote: `Played FREE it holds ${persistentFreeRounds(card)} and ticks out; paid with a die it is permanent — unique in play, and it leaves the deck cycle.`, mathLine: 'A standing rule, not a number — its text is the engine text.', keywords };
        // A keyword-less mechanic headline (DEAL) has no Title to lead with —
        // every line below falls back to the headline's own words rather than
        // opening with a dangling dash or an empty stat label.
        case 'mechanic': { const h = mechanicHeadline(c.mech, enemyDifficulty); const verb = h?.verbLine ?? 'a special mechanic'; const val = [h?.heroText, h?.heroSub].filter(Boolean).join(' '); const lead = Title || h?.heroText || 'This card'; const statLabel = (Title || 'PAID').toUpperCase(); return { subtitle: Title ? `${Title} — ${verb}.` : `${verb.charAt(0).toUpperCase()}${verb.slice(1)}.`, metaChip, outcomeLine: Title ? (val ? `${Title} ${val}.` : `${Title}.`) : `${val || verb}.`, outcomeStats: h?.heroText ? [{ label: statLabel, value: h.heroText }] : [], stacksText: null, freeLine, powerLine: `◆ WITH A DIE: ${vitaeCopy(card.bottomActionText)}`, readNote: `${lead} takes no read — the printed line is the applied effect.`, mathLine: `${lead}: ${vitaeCopy(h?.verbLine ?? card.bottomActionText)}.`, keywords }; }
        case 'inert':
        default: return { subtitle: `${Title || 'Effect'} — minor right now.`, metaChip, outcomeLine: `${Title || 'This effect'} — minor for now.`, outcomeStats: [], stacksText: null, freeLine, powerLine: `◆ WITH A DIE: ${vitaeCopy(card.bottomActionText)}`, readNote: 'The engine text above is the whole truth for this card.', mathLine: `${Title || 'This effect'} carries no headline number — the printed line is the applied effect.`, keywords };
    }
}

/**
 * Format ONE engine clause as the terse `KEYWORD value` the ◆ +DIE rail uses.
 *
 * Presentation only. The clause — which payload it is, what it applies, what
 * numbers it prints — came from `paidClauses()` in mechanics. All this does is
 * choose the player-facing WORD (the registry keyword when the card's
 * vocabulary registers one, the engine's own leading word otherwise) and spell
 * the value the way the rest of the UI spells it (`×3 · 2 turns`, never the
 * `i3 d2` code).
 *
 * A clause the engine prints as a full sentence (no headline word — a
 * card-local rules clause such as CURDLE's flip) is printed verbatim: inventing
 * a badge for it would be exactly the drift this rewrite removed.
 */
function formatPaidClause(c: CardClause): string {
    const registry = c.source === 'effect' ? keywordForEffect(c.id) : keywordForMechanic(c.id);
    // A bare `rider` mechanic is nothing BUT its rider, and mechanics hands the
    // sub-clauses over already joined-equal to its own text — so formatting
    // them gives 'HEAL 16' instead of the engine's lowercase 'heal 16', with
    // no derivation happening twice.
    if (!registry && c.parts?.length) {
        return c.parts.map(formatPaidClause).join(' · ');
    }
    const word = (registry ?? c.label).toUpperCase();
    if (!word) return deabbreviateShorthand(vitaeCopy(c.text));
    const value = clauseValue(c);
    if (!value) return word;
    // Some engine clauses TRAIL the word the badge already says ('+5 Charges',
    // '+2 Souls'), and 'CHARGE +5 Charges' is exactly the busy-ness of finding
    // 3. Drop the trailing repeat — but only when a number survives it, so the
    // badge still leads a real value. A clause whose word is load-bearing prose
    // ('your next spell gains ECHO') prints as written, keeping the registry
    // word uppercase so the ledger above still links to it.
    const trailingDupe = new RegExp(`\\s*\\b${word}s?\\b\\s*$`, 'i');
    if (trailingDupe.test(value)) {
        const trimmed = value.replace(trailingDupe, '').trim();
        return /\d/.test(trimmed) ? `${word} ${trimmed}` : value;
    }
    return `${word} ${value}`;
}

/** The value half of a clause. A DoT reads as its real tick ('8/play'), which
 *  is the number the engine applies; a round-clock status reads intensity and
 *  turns. Every number comes off the clause, none is computed here. */
function clauseValue(c: CardClause): string {
    if (c.source === 'effect' && c.dot) {
        const unit = c.dot.trigger === 'card-played' ? '/play'
            : c.dot.trigger === 'damage-instance' ? '/hit'
                : c.dot.trigger === 'payoff' ? '/payoff' : '/turn';
        const clock = c.dot.growsOnEnemyAction ? ' · grows as the foe acts'
            : c.dot.trigger === 'damage-instance' ? ` · ${c.intensity} stacks`
                : ` · ${c.duration} turn${c.duration === 1 ? '' : 's'}`;
        return `${c.dot.perTick}${unit}${clock}${c.cross ?? ''}`;
    }
    return deabbreviateShorthand(vitaeCopy(c.value));
}

/**
 * The FULL ◆ +DIE line: every clause the paid play fires, in authored order.
 *
 * 2026-09-21 (owner findings 3-6, W3) — REWRITTEN at the source. The old
 * implementation walked `specialMechanics` a second time mobile-side through a
 * partial `mechPaidPart` switch, deduped on the printed WORD, and returned
 * `null` whenever fewer than two clauses survived — at which point the panel
 * fell back to a one-clause headline sentence. Between them those three rules
 * silently dropped, across the live library:
 *
 * - every DEAL on a multi-verb card (DEAL carries no keyword badge on purpose,
 *   so the badge-keyed walk skipped it — `the-lazars-kiss` printed
 *   'CURDLE +3 + HEAL 16' and never said it deals 20);
 * - every self-cost that was the only survivor (`thumbprick-oath` printed
 *   'Deal 14 VITAE.' and never said it costs you 5 VITAE);
 * - the real PLEA 38 on a card that also carries a PLEA-mapped self-buff,
 *   because the dedupe was keyed on the word.
 *
 * Now the list comes from `paidClauses()` in mechanics and nothing filters it.
 * Per D3 the terse shorthand stays — only its SOURCE changed.
 */
function paidLine(card: CombatCard, sourceCard?: Card): string | null {
    if (!sourceCard) return null;
    // A persistent card's paid play is its passive made permanent; the authored
    // one-line `persistentEffect` IS that passive, and the engine prints the
    // same words on `bottomActionText`.
    if (card.cardType === 'oath' || card.cardType === 'hex') {
        return sourceCard.persistentEffect ? vitaeCopy(sourceCard.persistentEffect) : null;
    }
    const parts = paidClauses(sourceCard, lookupEffect).map(formatPaidClause).filter(Boolean);
    return parts.length ? parts.join('  +  ') : null;
}

/** Honest card DETAIL view-model (inspect modal) — the CORE plus the +DIE row
 *  fields. 2026-07-12 (card-wording audit): the NO-DIE pill (a pure duplicate
 *  of the face's ◇ rail) is gone; the +DIE row carries only what the face
 *  can't — the FULL paid line and the exact read triplet. */
export function detailStats(card: CombatCard, sourceCard?: Card, enemyDifficulty?: EnemyDifficulty): CombatCardDetailVM {
    const core = detailCore(card, sourceCard, enemyDifficulty);
    const c = cardCalc(card, sourceCard);
    const STANCE = STANCE_LABELS[card.stance] ?? card.stance.toUpperCase();
    // The free (die-optional) value — the ENGINE's own free line, not the
    // face's hero slot. 2026-09-21 (W3): the face hard-codes 'mercy' on a
    // befriend card, so reading the pill off the face made the NO-DIE row of
    // any befriend card disagree with its authored rider. `freeLineText` is
    // `riderText` from mechanics, de-abbreviated — nothing else.
    const freePill = freeLineText(card, sourceCard);
    // The exact ▲/—/▼ read triplet for the read-scaled kinds.
    let dieTriplet: string | null = null;
    if (c.kind === 'guard' || c.kind === 'barrier') {
        const b = c.kind === 'guard' ? (c.guardAmount ?? 0) : c.barrierAmt;
        const adv = Math.max(1, Math.round(b * READ_DAMAGE_MULT.advantage));
        const dis = Math.max(1, Math.round(b * READ_DAMAGE_MULT.disadvantage));
        dieTriplet = `▲${adv} · —${b} · ▼${dis}`;
    } else if (c.kind === 'dot') {
        // P0-truth: the exact deterministic triplet (▲ +1 intensity / ▼ −1 turn).
        // WI-2 — an event DoT (poison/bleed) reads PER TICK, not as a round-clock
        // lifetime; the read scales the per-tick bite (▲ +1 intensity; ▼ −1 turn
        // shortens the window, per-tick unchanged).
        if (c.dotTrigger) {
            const perTickAdv = Math.floor(c.dpr * (c.intensity + READ_ADVANTAGE_INTENSITY_BONUS));
            dieTriplet = `▲${perTickAdv} · —${c.perTurn} · ▼${c.perTurn}`;
        } else {
            dieTriplet = `▲${c.totalAdv} · —${c.total} · ▼${c.totalDis}`;
        }
    } else if (c.kind === 'vulnerable') {
        dieTriplet = `▲+${c.vulnPctAdv}% · —+${c.vulnPct}% · ▼−1 turn`;
    }
    // The ▲/—/▼ legend. 2026-09-21 (W3, owner finding 3 — "too busy"): a
    // standing prose row explaining a notation that only ever renders one line
    // above it is a row the combat overlay no longer spends. The decode now
    // rides the triplet itself (`READ ▲12 · —8 · ▼6 — won · even · lost`), so
    // the same fact costs one row instead of two. The field stays on the VM
    // because the DECK screen — read out of combat, where a full sentence is
    // affordable — still renders it.
    const readLegend = dieTriplet
        ? "▲ won read · — even · ▼ lost read — your die's stance against the foe's picks the column."
        : null;
    if (dieTriplet) dieTriplet = `READ ${dieTriplet} — won · even · lost`;
    const diePaidLine = paidLine(card, sourceCard);
    // Spec 32 v4 persistent fork, restated as ONE footer line (the audit's
    // 6-deck "3 rounds vs rest of combat" confusion) — never a stacked panel.
    const durationFooter = c.kind === 'oath' || c.kind === 'hex'
        ? `${persistentFreeRounds(card)} free · permanent with a die`
        : null;
    // The colour law (dice-law rework 2026-07-09) — rendered ONCE per modal.
    const colorMatchHint = `Only a ${STANCE} or WILD die can power this card.`;
    // 2026-07-12 — the per-card systems-glossary slice: scan the card's OWN
    // printed lines plus its overlay free/stacks lines (colorMatchHint excluded
    // — its WILD is the global colour law, not a card reference) and drop
    // terms a keyword chip already covers.
    const systemTerms = systemTermsForCard(
        [card.topActionText, card.bottomActionText, ...(card.dieLines ?? []), core.freeLine, core.stacksText ?? ''].join(' '),
        core.keywords.map(k => k.name),
    );
    // D4 — the rarity band, derived ONCE by the wave-0 module. Named label +
    // pip count + hue; the panel renders label and pips so the signal survives
    // greyscale and colour blindness, and the hue is decoration on top.
    const band = rarityFor(card);
    // finding 3 — the two prose footers the overlay used to stack under the
    // fork ('3 rounds free · permanent with a die', 'Only a HEART or WILD die
    // can power this card.') collapse into the tags of the rows they describe.
    // Same facts, two fewer rows, and each fact now sits on the row whose
    // decision it actually changes.
    const persistent = c.kind === 'oath' || c.kind === 'hex';
    const freeTag = persistent ? `NO DIE · ${persistentFreeRounds(card)}` : 'NO DIE';
    const paidTag = persistent ? '+DIE · rest of combat' : `+DIE · ${STANCE}/WILD`;
    return {
        ...core, freePill, diePaidLine, dieTriplet, readLegend, durationFooter, colorMatchHint, systemTerms,
        rarityLabel: RARITY_LABEL[band], rarityPips: RARITY_PIPS[band], rarityColor: RARITY_COLOR[band],
        freeTag, paidTag,
    };
}

/** Read-scaled hero value at the moment of commit (read known) — StagedCard only.
 *  Guard/Barrier scale by the damage read (+colour-match bonus); DoT total and
 *  Vulnerable % follow the P0-truth deterministic read rule EXACTLY (▲ +1
 *  intensity / ▼ −1 turn — no multiplier approximations, matching the engine
 *  byte-for-byte). null for kinds with no read-scalable number (strike stays
 *  qualitative 'HIT' + a read pip; stun's skip count is duration-driven). */
export function armedReadValue(face: CombatCardFaceVM, read: CombatReadResult, colorMatch: boolean): number | null {
    if (face.kind === 'guard' && face.guardBase != null) {
        // THE BIG NUMBERS REWRITE — the colour-match reward is a PERCENTAGE
        // (+25%, min +2), not the legacy flat +3. The two agree only near a
        // base of 12; at GUARD 36 the engine grants 9 and the flat rule printed
        // 3. `colorMatchBonus` IS the engine's rule, imported, not restated.
        const base = Math.max(1, Math.round(face.guardBase * READ_DAMAGE_MULT[read]));
        return base + (colorMatch ? colorMatchBonus(base) : 0);
    }
    if ((face.kind === 'dot' || face.kind === 'vulnerable') && face.statusBase != null) {
        if (read === 'advantage') return face.statusAdv ?? face.statusBase;
        if (read === 'disadvantage') return face.statusDis ?? face.statusBase;
        return face.statusBase;
    }
    return null;
}

/**
 * How an APPLY commit routes its dragged die (dice-law 2026-07-09 / spec 32 v3
 * §5): a Reserve, fate-X, or GHOST die is its OWN power source — it is
 * forwarded to `playCombatCard` as the explicit dieId and must never be
 * drafted (the engine rejects drafting a floating die, which used to make the
 * drop silently fizzle and snap back). A fresh tray die drafts first.
 */
export function resolveApplyRouting(
    state: CombatEncounterState,
    dieId: string | null,
): { draftFirst: boolean; explicitDieId: string | undefined } {
    // Spec 33 (flag-on): the DRAFT is retired — there is no single-die law and
    // no `draftedDieId`. Every dropped die (fresh tray face, Reserve, or
    // floating) is its OWN power source: it MUST be forwarded to
    // `playCombatCard` as the explicit `dieId` (the engine's flag-on
    // `playBottomAction` REQUIRES an explicit die — `dieId === undefined`
    // fizzles "choose a die to power this card"). Draft-first would call
    // `draftStanceDie`, a flag-on no-op, leaving `explicitDieId` undefined and
    // fizzling the play while spending nothing — the D6d "die spent, PLEA 0,
    // card bounces" bug. Flag-off keeps the draft-model routing byte-identical.
    if (isUpgradeableDiceEnabled()) {
        return { draftFirst: false, explicitDieId: dieId ?? undefined };
    }
    const isReserveDie = !!dieId && (state.reserve ?? []).some((d) => d.id === dieId);
    const isFateX = !!dieId && state.dice.some((d) => d.id === dieId && d.color === 'x');
    const isFloating = !!dieId && state.dice.some((d) => d.id === dieId && d.floating === true);
    const explicit = isReserveDie || isFateX || isFloating;
    return {
        draftFirst: !!dieId && !explicit && state.draftedDieId === null,
        explicitDieId: explicit && dieId ? dieId : undefined,
    };
}

function handVM(state: CombatEncounterState): CombatCardVM[] {
    const drafted = getDraftedDie(state);
    return engineHandCards(state)
        // Retreat is no longer an in-combat card — fleeing is offered at the
        // encounter prelude (ENGAGE / FLEE), not from the hand.
        .filter(({ card }: { card: CombatCard }) => card.id !== 'card-retreat' && card.verbClass !== 'retreat')
        .map(({ uid, card }: { uid: string; card: CombatCard }) => {
        const preview = drafted ? cardReadPreview(state, card) : null;
        const sourceCard = getCardById(card.id);
        // WI-6 — the hand is IN combat, so the live enemy difficulty is known:
        // a CONDEMN face resolves its tier-floored threshold ("concede at 10 vs
        // this foe") instead of the raw authored 8.
        const rawFace = faceStats(card, sourceCard, state.enemy.difficulty);
        // phase 28 — RUPTURE's live burst is an honest, already-computed engine
        // number (projectRuptureBurst); the word-only "detonate" face predates
        // that selector's existence. Real-units-or-no-number, now with a number.
        const face = rawFace.kind === 'rupture'
            ? { ...rawFace, heroText: `${projectRuptureBurst(state, card)}`, heroSub: 'now, if detonated' }
            : rawFace;
        // phase 28 — REPRISE songbook choice: cards carrying a `reprise`
        // mechanic prompt a discard-pile picker on APPLY instead of the
        // engine's default highest-rank auto-pick.
        const needsReprisalChoice = (sourceCard?.specialMechanics ?? []).some(m => m.kind === 'reprise');
        return {
            uid, cardId: card.id, name: card.name, stance: card.stance,
            stanceColor: STANCE_COLORS[card.stance] ?? '#888',
            verbClass: card.verbClass, effectKind: card.effectKind,
            rarity: card.rarity, rank: card.rank,
            rankName: card.rank ? RANK_NAMES[card.rank] : null,
            cardType: card.cardType,
            tier: card.tier,
            topActionText: vitaeCopy(card.topActionText), bottomActionText: vitaeCopy(card.bottomActionText),
            bottomDamagePreview: card.bottomDamagePreview,
            dieLines: card.dieLines?.map(vitaeCopy),
            face,
            detail: detailStats(card, sourceCard, state.enemy.difficulty),
            read: preview?.read ?? null, colorMatch: preview?.colorMatch ?? false,
            flavor: sourceCard?.description ?? null,
            // WS7.2 — the engine's live chosen-X clamp range (null = no X mechanic).
            chooseX: recoilXRange(state, card),
            needsReprisalChoice,
        };
    });
}

const SIG_ICON: Record<string, string> = {
    scout: '👁', reroll: '🎲', sustain: '✚', control: '⛓', dot: '☠', mercy: '🕊', strike: '⚔', draw: '🎴',
    // Phase 85 — head/hands/feet accessory signatures.
    empower: '🔥', surge: '⚡',
};

function signaturesVM(state: CombatEncounterState): CombatSignatureVM[] {
    // The player's per-archetype kit (Spec 26b §B), resolved on the encounter.
    // Spec 33 §4 — Press Fate is a SIGNATURE, cast from this rune column like
    // any other (owner call 2026-07-19: no separate board control). Flag-on,
    // the reroll rune must present the spec-33 truth the engine enforces
    // (`playSignatureSkill`'s v2Reroll branch): cost PRESS_FATE_COST (1◆, not
    // the printed legacy 4), the honest reroll text, and the full firing gate
    // (◆ / once per round / a live miss face) with its refusal reason.
    const pf = pressFateVM(state);
    return state.signatures
        .map(id => getSignatureSkill(id))
        .filter((s): s is SignatureSkill => !!s)
        .map((s: SignatureSkill) => {
            if (pf && s.id === pf.signatureId) {
                return {
                    id: s.id, name: s.name,
                    description: 'Bend fate — re-roll every miss die from its own faces. Once per round.',
                    cost: pf.cost,
                    affordable: pf.enabled,
                    icon: SIG_ICON[s.kind] ?? '◆',
                    reason: pf.reason,
                };
            }
            const affordable = state.conviction >= s.cost;
            return {
                id: s.id, name: s.name, description: s.description, cost: s.cost,
                affordable,
                icon: SIG_ICON[s.kind] ?? '◆',
                reason: affordable ? null : `Need ${s.cost} ◆ Conviction`,
            };
        });
}

const READ_TEXT: Record<CombatReadResult, string> = {
    advantage: 'ADVANTAGE — you read them right (+1 ◆, boosted)',
    neutral: 'NEUTRAL — an even contest',
    disadvantage: 'DISADVANTAGE — they had your number (halved)',
    none: 'WILD — no stance contest',
};

function readVM(state: CombatEncounterState): CombatReadVM {
    const drafted = getDraftedDie(state);
    const cur = currentPhase(state);
    const revealed = isPhaseStanceRevealed(state, Math.min(state.currentPhaseIndex, state.threatPhases.length - 1));
    return {
        active: !!drafted,
        result: state.lastRead,
        dieStance: drafted?.color ?? '',
        enemyStance: revealed ? cur?.enemyStance ?? null : null,
        text: READ_TEXT[state.lastRead] ?? '',
    };
}

// ── Deckbuilder reward offers (Spec 26b §C) ──────────────────────────────────

/**
 * Maps reward card ids (from `rollCombatCardRewards`) into REAL card VMs — the
 * exact `CombatCardVM` the hand and the inspect modal render.
 *
 * The thin `CombatRewardOfferVM` this replaced (2026-08-08) duplicated a
 * hand-rolled slice of face logic — a name, a glyph, a tier line — which the
 * card-face-honesty guard could not see and which was already drifting from
 * the real face. A player committing a card to their deck for the rest of the
 * run reads the same face they will read in combat, or the reward screen is
 * lying to them.
 *
 * There is no encounter state here (the reward is post-combat), so the face is
 * built at the card's authored truth: no drafted-die read, no live enemy
 * difficulty, no chosen-X clamp. Every number still comes from `faceStats` /
 * `detailStats` — the same engine selectors the hand uses.
 */
export function rewardCardVMs(ids: readonly string[]): CombatCardVM[] {
    const out: CombatCardVM[] = [];
    for (const id of ids) {
        const card = getCard(id);
        if (!card) continue;
        const sourceCard = getCardById(id);
        out.push({
            // The offer is one card per id, so the id IS a stable uid.
            uid: `reward-${id}`,
            cardId: id, name: card.name, stance: card.stance,
            stanceColor: STANCE_COLORS[card.stance] ?? '#888',
            verbClass: card.verbClass, effectKind: card.effectKind,
            rarity: card.rarity, rank: card.rank,
            rankName: card.rank ? RANK_NAMES[card.rank] : null,
            cardType: card.cardType,
            tier: card.tier,
            topActionText: vitaeCopy(card.topActionText), bottomActionText: vitaeCopy(card.bottomActionText),
            bottomDamagePreview: card.bottomDamagePreview,
            dieLines: card.dieLines?.map(vitaeCopy),
            face: faceStats(card, sourceCard),
            detail: detailStats(card, sourceCard),
            // No die is drafted at the reward screen — there is no read to show.
            read: null, colorMatch: false,
            flavor: sourceCard?.description ?? null,
            chooseX: null,
            needsReprisalChoice: false,
        });
    }
    return out;
}

// ── phase 28 — Charge track + CONDEMN beat ──────────────────────────────────

/** Mirrors `gainPremises`'s tier-floor exactly (combat.engine.ts) so the
 *  displayed CONDEMN threshold never lies about the live one. */
function perorationVM(state: CombatEncounterState): CombatPerorationVM {
    const decl = state.peroration;
    if (!decl) return { active: false, premises: 0, at: 0, concedeAt: null, cardName: '' };
    // WI-6 — the tier floor is the engine's own `concedeFloorFor`, never a
    // presenter-local copy that can drift from the live concede resolution.
    const concedeAt = decl.concedeAt !== undefined
        ? Math.max(decl.concedeAt, concedeFloorFor(state.enemy.difficulty))
        : null;
    const card = getCardById(decl.cardId);
    return { active: true, premises: state.premises ?? 0, at: decl.at, concedeAt, cardName: card?.name ?? '' };
}

// ── Spec 33 §4 — Press Fate (flag-on reroll affordance) ──────────────────────

/**
 * Mirrors `playSignatureSkill`'s flag-on reroll gate (combat.engine.ts) exactly
 * so the control's enabled/disabled verdict — and its reason — can never lie
 * about the live one: cost (1◆) first, then once-per-round, then "a live
 * non-cracked miss face must exist to revive". Returns null flag-off, or when
 * the loadout carries no reroll signature (nothing to cast).
 */
function pressFateVM(state: CombatEncounterState): CombatPressFateVM | null {
    if (!isUpgradeableDiceEnabled()) return null;
    const signatureId = (state.signatures ?? []).find(id => getSignatureSkill(id)?.kind === 'reroll');
    if (!signatureId) return null;
    const cost = PRESS_FATE_COST;
    const cracked = new Set<string>((state.crackedDice ?? []).filter(c => c.turn === state.turn).map(c => c.color));
    const hasLiveMiss = state.dice.some(d => d.face === 'miss' && !d.floating && !cracked.has(d.color));
    let reason: string | null = null;
    if (state.conviction < cost) reason = `Need ${cost} ◆ Conviction`;
    else if (state.pressFateRound === state.round) reason = 'Already pressed this round';
    else if (!hasLiveMiss) reason = 'No miss dice to re-roll';
    return { signatureId, cost, enabled: reason === null, reason };
}

// ── Spec 33 §3 — Momentum-V2 chain chip (flag-on) ────────────────────────────

/** The stance that advances the chain next — the successor in chain order. */
function nextChainColor(s: WheelStance): WheelStance {
    return MOMENTUM_CHAIN_ORDER[(MOMENTUM_CHAIN_ORDER.indexOf(s) + 1) % MOMENTUM_CHAIN_ORDER.length];
}

/**
 * Reshapes momentum to the spec-33 chain. Returns null flag-off (the old
 * three-node `momentum` wheel renders instead). Flag-on, `state.momentumV2`
 * ({color,length}|null) drives it; the transient BREAK / SURGE states — both of
 * which leave momentum null — are recovered from the most-recent momentum event
 * in the log so a just-broken chain reads LOUD, not merely empty.
 */
function momentumV2VM(state: CombatEncounterState): CombatMomentumV2VM | null {
    if (!isUpgradeableDiceEnabled()) return null;
    const m = state.momentumV2 ?? null;
    const color = m?.color ?? null;
    const length = m?.length ?? 0;
    // Only when the chain sits at null can a break/surge be the live transient —
    // any live chain already superseded them. Scan back for the last chain
    // event, but STOP at the current turn's dice roll: a transient is loud for
    // the turn it happened in, then decays to the plain empty chip. (Unbounded,
    // a round-1 break yelled "MOMENTUM BROKEN" for the rest of the fight —
    // owner report 2026-07-19.)
    let broke = false;
    let surged = false;
    if (m === null) {
        for (let i = state.log.length - 1; i >= 0; i--) {
            const ev = state.log[i];
            if (ev.kind === 'turn-dice-rolled') break;   // turn boundary — transient expired
            if (ev.kind === 'momentum-broken') { broke = true; break; }
            if (ev.kind === 'momentum-surged') { surged = true; break; }
            if (ev.kind === 'momentum-advanced') break;  // a live chain formed after
        }
    }
    const next = color ? nextChainColor(color) : null;
    const surgeAt = MOMENTUM_SURGE_LENGTH;
    // The played sequence, reconstructed backwards from the chain's end: link i
    // sits (length-1-i) steps BEFORE `color` in the cyclic chain order.
    const chain: WheelStance[] = color === null ? [] : Array.from({ length }, (_u, i) => {
        const at = MOMENTUM_CHAIN_ORDER.indexOf(color) - (length - 1 - i);
        return MOMENTUM_CHAIN_ORDER[((at % MOMENTUM_CHAIN_ORDER.length) + MOMENTUM_CHAIN_ORDER.length) % MOMENTUM_CHAIN_ORDER.length];
    });
    return {
        color, length, chain, surgeAt, next, broke, surged,
        colorHex: color ? STANCE_COLORS[color] : '#6b6257',
        a11y: momentumV2A11y({ color, length, next, surgeAt, broke, surged }),
    };
}

// ── Spec 33 §2 — player current-stance chip (flag-on) ────────────────────────

/**
 * Reshapes the player's current stance into its board chip.
 *
 * Purpose: the chip is the only surface that names the stance the player
 * holds. Input: the encounter state (`state.playerStance`). Output: the chip
 * VM, or null when the upgradeable-dice flag is off and the chip never mounts.
 *
 * Cluster S1-board-C34 — the empty read was a bare state word, 'NO STANCE',
 * on a chip that answers nothing when tapped: it named a hole and not the
 * action that fills it. The empty state now carries that action as `hint`.
 */
function playerStanceVM(state: CombatEncounterState): CombatStanceChipVM | null {
    if (!isUpgradeableDiceEnabled()) return null;
    const stance = state.playerStance ?? null;
    if (!stance) {
        return {
            stance: null, label: 'NO STANCE', glyph: '—', colorHex: '#6b6257',
            hint: 'PLAY A PAID CARD',
            a11y: 'No stance yet — play a paid card to take its stance.',
        };
    }
    return {
        stance, label: STANCE_LABELS[stance], glyph: DIE_GLYPHS[stance] ?? '?',
        colorHex: STANCE_COLORS[stance], hint: null,
        a11y: `Current stance: ${STANCE_LABELS[stance]} — from the last paid card.`,
    };
}

// ── Spec 33 §6 — die-gear rail + payload-only inspection (flag-on) ────────────

const GEAR_RAIL_ORDER: readonly ('heart' | 'body' | 'mind' | 'wild')[] = ['heart', 'body', 'mind', 'wild'];

function gearSlotVM(state: CombatEncounterState, color: 'heart' | 'body' | 'mind' | 'wild'): CombatDieGearSlotVM {
    // D5's rail if present; else the engine's stock default (activeDieGear resolves both).
    const gear: UpgradeableDieGear = activeDieGear(state, color);
    const missFaces = Math.max(0, 6 - gear.specialFaces - gear.manaFaces);
    const stock = DEFAULT_DIE_GEAR[color];
    const upgraded = gear.specialFaces !== stock.specialFaces
        || gear.manaFaces !== stock.manaFaces
        || gear.specialConviction !== stock.specialConviction;
    const faceTable = `${gear.specialFaces} boon · ${gear.manaFaces} mana · ${missFaces} miss`;
    const payload = `+${gear.specialConviction} ◆`;
    const label = STANCE_LABELS[color] ?? color.toUpperCase();
    return {
        color, label, glyph: DIE_GLYPHS[color] ?? '?', colorHex: STANCE_COLORS[color] ?? '#888',
        specialFaces: gear.specialFaces, manaFaces: gear.manaFaces, missFaces,
        specialConviction: gear.specialConviction, faceTable, payload, upgraded,
        a11y: `${label} die gear — ${faceTable}. Boon face grants ${payload}.`
            + (upgraded ? ' Upgraded from stock.' : ' Stock.'),
    };
}

function dieGearRailVM(state: CombatEncounterState): CombatDieGearRailVM | null {
    if (!isUpgradeableDiceEnabled()) return null;
    return { slots: GEAR_RAIL_ORDER.map((c) => gearSlotVM(state, c)) };
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function buildCombatViewModel(state: CombatEncounterState): CombatViewModel {
    const total = state.threatPhases.length;
    const idx = Math.min(state.currentPhaseIndex, total - 1);
    const draftedDie = getDraftedDie(state);
    const usableDraft = !!draftedDie && draftedDie.state === 'available' && draftedDie.color !== 'x';
    const dice = diceVM(state);
    return {
        phase: state.phase,
        enemy: enemyPane(state),
        player: playerPane(state),
        dice,
        momentum: {
            lit: state.momentumWheel ?? [],
            charged: dice.some((d) => isMomentumDieId(d.id) && !d.spent && !d.isX),
        },
        reserveRoom: (state.reserve ?? []).length < RESERVE_MAX,
        resonance: { heart: 0, body: 0, mind: 0, ...(state.resonance ?? {}) },
        drafted: usableDraft,
        hasDraft: !!state.draftedDieId,
        needsDraft: state.dice.length > 0 && !state.draftedDieId,
        diceRolled: state.dice.length > 0,
        read: readVM(state),
        conviction: state.conviction,
        signatures: signaturesVM(state),
        hand: handVM(state),
        ledger: state.threatMarks,
        phaseBadge: `PHASE ${idx + 1}/${total}`,
        roundLabel: `ROUND ${state.round}`,
        turnLabel: `TURN ${state.turn}`,
        deckCount: state.drawPile.length,
        discardCount: state.discard.length,
        discardCards: state.discard.map((id) => ({ id, name: getCardById(id)?.name ?? id })),
        peroration: perorationVM(state),
        pressFate: pressFateVM(state),
        momentumV2: momentumV2VM(state),
        playerStance: playerStanceVM(state),
        dieGear: dieGearRailVM(state),
    };
}
