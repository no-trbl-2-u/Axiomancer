/**
 * Spec 26 / 26b — Combat board presenter.
 *
 * Pure function `buildCombatViewModel(state)`: maps the engine
 * `CombatEncounterState` into a single render-ready `CombatViewModel`. No store
 * writes, no rules — the engine owns truth, this shapes it for the board
 * (portraits, visible enemy HP, intent telegraph, the hidden-stance read, the
 * 2-die draft, Conviction + Signature Skills, and the two Pressure Tracks).
 *
 * The redesign (Spec 26b): the enemy STANCE is hidden until revealed, so this
 * presenter only surfaces a stance colour/label once `isPhaseStanceRevealed`;
 * otherwise it shows the thematic tell and a "?".
 */

import {
    handCards as engineHandCards, getCard, getSkillById,
    getDraftedDie, isPhaseStanceRevealed, cardReadPreview,
    revealedCurrentStance, resolveRead, getSignatureSkill,
    lookupEffect, READ_DAMAGE_MULT, READ_STATUS_MULT, COLOR_MATCH_DAMAGE_BONUS,
    EXECUTE_DAMAGE_FRACTION, COMPOUND_COUNT_CAP, RUPTURE_BURST_CAP,
    VULNERABLE_MAX_MULT, DISRUPT_DENY_AT,
    type CombatEncounterState, type CombatCard, type CombatManaDie,
    type CombatThreatPhase, type CombatIntentType, type CombatReadResult,
    type CombatSummary, type SignatureSkill, type Stance,
    type Skill, type SkillCombatEffects,
} from 'axiomancer-mechanics';

/** The barrel doesn't re-export the union, so derive it from Skill. */
type SkillSpecialMechanic = NonNullable<Skill['specialMechanics']>[number];
import { effectGlyph, GLYPH_COLORS, type StatusGlyph } from '@/components/combat/statusGlyphs';
import { keywordForEffect, keywordForVerb, keywordGloss } from '@/state/combat/keywords';
import { resolveEnemyArchetype } from '@/state/presenters/enemy-art';

// ── Stance palette (Heart/Body/Mind/Wild/X) ──────────────────────────────────

export const STANCE_COLORS: Record<string, string> = {
    // Body=RED, Mind=BLUE, Heart=PURPLE, Wild=GOLD (owner-specified dice palette).
    heart: '#9a5fd0', body: '#d6543f', mind: '#4f7fd6', wild: '#d9b44a', x: '#5a5a5a',
};
const DIE_GLYPHS: Record<string, string> = { heart: '♥', body: '⚡', mind: '★', wild: '✦', x: '✕' };
const STANCE_LABELS: Record<string, string> = { heart: 'HEART', body: 'BODY', mind: 'MIND', wild: 'WILD', x: 'X' };

// Mirror of the engine's TOP_ACTION_CHIP — the HP a FREE (no-die) action chips.
// Not on the public barrel, so duplicated here (kept in sync by hand).
const FREE_CHIP_HP = 2;
// Verb-class card colours (these map to verbs, not Effects, so they aren't in GLYPH_COLORS).
const GUARD_COLOR = '#9aa0a6';
const STRIKE_COLOR = '#c2a14e';
const BEFRIEND_COLOR = '#5bbf6a';
const INERT_COLOR = '#6b6257';

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
    effectId: string; glyph: StatusGlyph; intensity: number; duration: number; isMax: boolean;
    /** General keyword definition for the on-board status tooltip (null if unmapped). */
    gloss: string | null;
}
export interface CombatIntentVM {
    type: CombatIntentType; icon: string; label: string; color: string; description: string;
    /** Total HP damage this phase's threat action deals if NOT cleared (0 if none). */
    damage: number;
    /** True if the threat action also applies a debuff to the player. */
    debuffs: boolean;
    next: { type: CombatIntentType; icon: string; label: string } | null;
}
export interface CombatEnemyPaneVM {
    name: string; artKey: string; isBoss: boolean;
    hp: number; maxHp: number; hpPct: number;
    effects: CombatEffectChipVM[];
    intent: CombatIntentVM;
    /** Revealed stance ('heart'|'body'|'mind') or null while hidden. */
    revealedStance: string | null;
    stanceColor: string;      // accent (revealed stance colour, else neutral)
    stanceLabel: string;      // 'HEART' / '?' …
    stanceHint: string;       // the thematic tell (always shown)
}
export interface CombatPlayerPaneVM {
    name: string; hp: number; maxHp: number; hpPct: number; guard: number; effects: CombatEffectChipVM[];
}
export interface CombatDieVM {
    id: string; color: string; colorHex: string; glyph: string; stanceLabel: string;
    drafted: boolean; spent: boolean; isX: boolean;
    /** Read vs the (revealed) enemy stance: advantage/neutral/disadvantage/none/null(hidden). */
    readPip: CombatReadResult | null;
}
export type CombatCardKind =
    | 'dot' | 'stun' | 'regen' | 'guard' | 'strike' | 'weaken' | 'inert' | 'befriend'
    // ── mechanics 0.34.0 — newly REAL in the HP engine ──
    | 'vulnerable'   // debuff_vulnerable / debuff_vulnerability_* — foe takes +N% damage
    | 'rupture'      // detonate stored DoT (live total → a word, no fabricated number)
    | 'compound'     // bonus damage per distinct debuff on the foe
    | 'barrier'      // stacking soak shield on YOU
    | 'thorns'       // reflect attacker damage back
    | 'siphon'       // heal for a % of the damage dealt
    | 'riposte'      // counter the next hit + reduce it
    | 'execute';     // finisher when the foe is low / heavily stacked

/** Render-ready, HONEST card FACE. Every number is a real unit derived from the
 *  skill's AUTHORED effect (never the abstract "impact"). `heroText` is '' when the
 *  kind has no honest number (strike/weaken/inert/befriend) — the face renders a
 *  qualitative word there instead. Real-units-or-no-number: never a fabricated value. */
export interface CombatCardFaceVM {
    kind: CombatCardKind;
    keyword: string | null;        // UPPERCASE keyword for the face (e.g. 'BLEED')
    glyph: string;                 // sourced from statusGlyphs → matches the board chip
    categoryColor: string;
    stanceColor: string;
    heroText: string;              // POWER value in real units; '' = no honest number
    heroSub: string | null;        // e.g. '(18)'
    freeHeroText: string;          // the no-die value
    freeHeroSub: string | null;
    verbLine: string;              // plain who/what
    powerRail: string;
    readDependent: boolean;        // the read scales this: guard/strike (damage mult) AND
                                   // dot/vulnerable (status mult — the read now bites status)
    inert: boolean;                // engine doesn't read it yet → greyed, no number
    guardBase: number | null;
    statusBase: number | null;     // read-scalable status number (DoT total / Vulnerable %) — armed display
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
    // ── Compact NO-DIE / +DIE pill table (replaces the prose FREE/POWER fork) ──
    /** The no-die (free) value, e.g. '2 HP' / 'Guard 6' / '24 (4/turn · 6 turns)'. */
    freePill: string;
    /** The +DIE pill keyword, e.g. 'BLEED' / 'GUARD'. */
    diePillKeyword: string;
    /** The +DIE powered value; read-dependent kinds carry the ▲/▼ triplet. */
    diePill: string;
    /** The colour-match rule — rendered ONCE per modal (not per powerLine). */
    colorMatchHint: string;
}

/** detailStats' switch builds everything BUT the pill fields; the wrapper appends them. */
type DetailCore = Omit<CombatCardDetailVM, 'freePill' | 'diePillKeyword' | 'diePill' | 'colorMatchHint'>;

export interface CombatCardVM {
    uid: string; cardId: string; name: string; stance: string; stanceColor: string;
    verbClass: string; effectKind: 'dot' | 'control' | 'none'; rarity?: 'gold'; tier: 1 | 2 | 3;
    category: 'fallacy' | 'paradox' | null;
    topActionText: string; bottomActionText: string; bottomDamagePreview: number;
    /** Honest, render-ready 5-zone face — real units, zero abstraction. */
    face: CombatCardFaceVM;
    /** Honest, render-ready inspect detail (outcome + free/die + math + keywords). */
    detail: CombatCardDetailVM;
    /** Read tier if powered with the current drafted die (null until a die is drafted). */
    read: CombatReadResult | null; colorMatch: boolean;
}
export interface CombatSignatureVM {
    id: string; name: string; description: string; cost: number; affordable: boolean; icon: string;
}
export interface CombatReadVM {
    active: boolean; result: CombatReadResult; dieStance: string; enemyStance: string | null;
    text: string;
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
    ledger: ('clear' | 'overwhelmed' | 'pending')[];
    phaseBadge: string;
    roundLabel: string;
    turnLabel: string;
    deckCount: number;
    discardCount: number;
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
            isMax: ae.intensity >= 10,
            // Show the keyword on the chip's label (a11y/tooltip) instead of the thematic name.
            glyph: kw ? { ...glyph, label: kw } : glyph,
            gloss: keywordGloss(kw),
        };
    });
}

function intentVM(state: CombatEncounterState): CombatIntentVM {
    const cur = currentPhase(state);
    const type = (cur?.intentType ?? 'pass') as CombatIntentType;
    const meta = INTENT_ICONS[type];
    const nextPhase = state.threatPhases[state.currentPhaseIndex + 1];
    const next = nextPhase && !cur?.isFinalPhase
        ? (() => { const t = (nextPhase.intentType ?? 'pass') as CombatIntentType; const m = INTENT_ICONS[t]; return { type: t, icon: m.icon, label: m.label }; })()
        : null;
    const effects = cur?.threatAction.effects ?? [];
    const damage = effects.reduce((s, e) => s + (e.damage ?? 0), 0);
    const debuffs = effects.some((e) => !!e.effectId);
    return {
        type, icon: meta.icon, label: cur?.intentLabel ?? meta.label, color: meta.color,
        description: cur?.threatAction.description ?? '', damage, debuffs, next,
    };
}

function enemyPane(state: CombatEncounterState): CombatEnemyPaneVM {
    const e = state.enemy;
    const cur = currentPhase(state);
    const revealed = isPhaseStanceRevealed(state, Math.min(state.currentPhaseIndex, state.threatPhases.length - 1));
    const stance = revealed ? cur?.enemyStance ?? null : null;
    const isBoss = (e.tags ?? []).includes('boss') || /tyrant|boss|sovereign/.test(e.id);
    return {
        name: e.name,
        artKey: e.id,
        isBoss,
        hp: Math.max(0, e.health), maxHp: e.maxHealth,
        hpPct: e.maxHealth > 0 ? Math.max(0, e.health) / e.maxHealth : 0,
        effects: chips(e.effects),
        intent: intentVM(state),
        revealedStance: stance,
        stanceColor: stance ? STANCE_COLORS[stance] : '#6b6257',
        stanceLabel: stance ? STANCE_LABELS[stance] : '?',
        stanceHint: cur?.stanceHint ?? (e as { stanceHint?: string }).stanceHint ?? '',
    };
}

function playerPane(state: CombatEncounterState): CombatPlayerPaneVM {
    const p = state.player;
    return {
        name: p.name ?? 'You', hp: Math.max(0, p.health), maxHp: p.maxHealth,
        hpPct: p.maxHealth > 0 ? Math.max(0, p.health) / p.maxHealth : 0,
        guard: state.guard ?? 0,
        effects: chips(p.effects),
    };
}

function diceVM(state: CombatEncounterState): CombatDieVM[] {
    const drafted = getDraftedDie(state);
    // Per-die read pip — only once the phase stance is known (revealed/scouted).
    const stance = revealedCurrentStance(state) as Stance | null;
    return state.dice.map((d: CombatManaDie) => ({
        id: d.id, color: d.color, colorHex: STANCE_COLORS[d.color] ?? '#888',
        glyph: DIE_GLYPHS[d.color] ?? '?', stanceLabel: STANCE_LABELS[d.color] ?? '?',
        drafted: drafted?.id === d.id, spent: d.state === 'spent', isX: d.color === 'x',
        readPip: stance ? resolveRead(d.color, stance) : null,
    }));
}

// ── Honest card view-models (face + detail) ──────────────────────────────────

type EffectPayloadLike = {
    damageOverTime?: { damagePerRound: number };
    actionRestriction?: { skipTurn?: boolean };
    regeneration?: { healthPerRound?: number };
    rollModifier?: number;
    rollModifierPerIntensity?: number;
    // ── mechanics 0.34.0 ──
    reflectDamage?: number;     // buff_brazen_thorns / tier1_body_defend → Thorns
    damageTakenMult?: number;   // debuff_vulnerable / debuff_vulnerability_* → Vulnerable
};

/** THE single forward-compat honesty gate: the kind of HONEST, engine-read effect,
 *  or null for effects the live HP engine still doesn't quantify (→ greyed, number-
 *  less). Widened for mechanics 0.33.0: a negative roll modifier now weakens (and a
 *  variety denies) the enemy's turn, so it counts as 'weaken'. */
export function engineHonestKind(
    effectId: string | null | undefined,
): 'dot' | 'stun' | 'regen' | 'weaken' | 'vulnerable' | 'thorns' | null {
    if (!effectId) return null;
    const e = lookupEffect(effectId);
    if (!e) return null;
    const p = (e.payload ?? {}) as EffectPayloadLike;
    if (p.damageOverTime) return 'dot';
    if (p.actionRestriction?.skipTurn) return 'stun';
    if ((p.regeneration?.healthPerRound ?? 0) > 0) return 'regen';
    // 0.34.0: reflect + damage-amp are now read by the live HP engine, so they're honest.
    if ((p.reflectDamage ?? 0) > 0) return 'thorns';
    if ((p.damageTakenMult ?? 1) > 1) return 'vulnerable';
    if ((p.rollModifier ?? 0) < 0 || (p.rollModifierPerIntensity ?? 0) < 0) return 'weaken';
    return null;
}

function glyphFor(effectId: string): string {
    const e = lookupEffect(effectId);
    return e ? effectGlyph(e as Parameters<typeof effectGlyph>[0]).glyph : '◆';
}

interface PrimaryResolution {
    kind: CombatCardKind;
    ce: SkillCombatEffects | null;
    guardAmount: number | null;
    riders: SkillCombatEffects[];
    /** The driving special mechanic for the 0.34.0 kinds (barrier/riposte/siphon/
     *  rupture/compound/execute); null for effect- or verb-driven kinds. */
    mech: SkillSpecialMechanic | null;
}

/** Resolve a card's PRIMARY combat effect + its kind. Reads the skill's
 *  combatEffects / specialMechanics directly — NOT card.primaryEffectId, which is
 *  null for guard/regen cards (it = primaryEnemyEffectId). */
export function resolvePrimary(card: CombatCard, skill: Skill | undefined): PrimaryResolution {
    const vc = card.verbClass;
    const mechs = skill?.specialMechanics ?? [];
    const findMech = <K extends SkillSpecialMechanic['kind']>(k: K) =>
        mechs.find(m => m.kind === k) as Extract<SkillSpecialMechanic, { kind: K }> | undefined;

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
    if (vc === 'direct-damage') {
        // 0.34.0: rupture / compound / siphon ride a direct hit; their headline value
        // is the AUTHORED mechanic param (the actual swing is live → not headlined).
        const rupture = findMech('rupture');
        if (rupture) return { kind: 'rupture', ce: null, guardAmount: null, riders: [], mech: rupture };
        const compound = findMech('compound');
        if (compound) return { kind: 'compound', ce: null, guardAmount: null, riders: [], mech: compound };
        const siphon = findMech('siphon');
        if (siphon) return { kind: 'siphon', ce: null, guardAmount: null, riders: [], mech: siphon };
        return { kind: 'strike', ce: null, guardAmount: null, riders: [], mech: null };
    }
    if (vc === 'buff-self') {
        const self = (skill?.combatEffects ?? []).filter(e => e.appliedTo === 'self');
        // 0.34.0: a self-buff that reflects (Thorns) is now real.
        const thorns = self.find(s => engineHonestKind(s.effectId) === 'thorns');
        if (thorns) return { kind: 'thorns', ce: thorns, guardAmount: null, riders: self.filter(s => s !== thorns), mech: null };
        const primary = self.find(s => engineHonestKind(s.effectId) === 'regen') ?? self[0] ?? null;
        const kind: CombatCardKind = engineHonestKind(primary?.effectId) === 'regen' ? 'regen' : 'inert';
        return { kind, ce: primary, guardAmount: null, riders: self.filter(s => s !== primary), mech: null };
    }
    // direct-dot | direct-control | stat-debuff → opponent effects
    const opp = (skill?.combatEffects ?? []).filter(e => e.appliedTo === 'opponent');
    // 0.34.0: execute is a finisher that rides whatever the card also applies (e.g. a DoT).
    const execute = findMech('execute');
    if (execute) return { kind: 'execute', ce: null, guardAmount: null, riders: opp, mech: execute };
    const primary = opp.find(o => engineHonestKind(o.effectId)) ?? opp[0] ?? null;
    const k = engineHonestKind(primary?.effectId);
    const kind: CombatCardKind =
        k === 'dot' ? 'dot'
            : k === 'stun' ? 'stun'
                : k === 'weaken' ? 'weaken'
                    : k === 'vulnerable' ? 'vulnerable'
                        : 'inert';
    return { kind, ce: primary, guardAmount: null, riders: opp.filter(o => o !== primary), mech: null };
}

interface CardCalc extends PrimaryResolution {
    keyword: string | null;
    glyph: string;
    categoryColor: string;
    perTurn: number; turns: number; total: number;
    freePerTurn: number; freeTurns: number; freeTotal: number;
    skips: number;
    dpr: number; intensity: number; stacks: boolean;
    // ── 0.34.0 authored statics (real units; live swings stay live) ──
    vulnPct: number;       // +N% damage taken (from damageTakenMult)
    reflectN: number;      // thorns reflect per hit (reflectDamage × intensity)
    barrierAmt: number;    // soak granted (barrier.amount, base read)
    siphonPct: number;     // % of damage healed (siphon.pct)
    riposteDmg: number;    // counter damage (riposte.damage, base read)
    riposteReduce: number; // incoming reduction (riposte.reduce, base read)
    executeHpPct: number;  // foe-HP threshold for the finisher (execute.hpPct)
    executeStacks: number; // OR ≥N DoT stacks (execute.dotStacks)
    compoundPer: number;   // bonus damage per distinct debuff (compound.perDebuff)
}

/** Single source of the numbers — faceStats AND detailStats both read this, so the
 *  face and the inspect modal can never drift. All values are AUTHORED units from
 *  getSkillById(card.skillId).combatEffects (not effect-library defaults). */
function cardCalc(card: CombatCard, skill: Skill | undefined): CardCalc {
    const pr = resolvePrimary(card, skill);
    const out: CardCalc = {
        ...pr, keyword: null, glyph: '◆', categoryColor: STRIKE_COLOR,
        perTurn: 0, turns: 0, total: 0, freePerTurn: 0, freeTurns: 0, freeTotal: 0,
        skips: 0, dpr: 0, intensity: 1, stacks: false,
        vulnPct: 0, reflectN: 0, barrierAmt: 0, siphonPct: 0,
        riposteDmg: 0, riposteReduce: 0, executeHpPct: 0, executeStacks: 0, compoundPer: 0,
    };
    const eff = pr.ce ? lookupEffect(pr.ce.effectId) : undefined;
    switch (pr.kind) {
        case 'dot': {
            const p = (eff?.payload ?? {}) as EffectPayloadLike;
            out.intensity = pr.ce?.intensity ?? 1;
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.dpr = p.damageOverTime?.damagePerRound ?? 0;
            out.perTurn = out.dpr * out.intensity;
            out.total = out.perTurn * out.turns;
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
            out.keyword = keywordForEffect(pr.ce?.effectId);
            out.glyph = pr.ce ? glyphFor(pr.ce.effectId) : '⛓';
            out.categoryColor = GLYPH_COLORS.control;
            break;
        }
        case 'vulnerable': {
            const p = (eff?.payload ?? {}) as EffectPayloadLike;
            out.turns = pr.ce?.duration ?? eff?.duration ?? 0;
            out.vulnPct = Math.round(((p.damageTakenMult ?? 1) - 1) * 100);
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
        case 'barrier': {
            const m = pr.mech?.kind === 'barrier' ? pr.mech : undefined;
            out.barrierAmt = m?.amount ?? 0;
            out.keyword = 'Barrier'; out.glyph = '⬡'; out.categoryColor = GUARD_COLOR;
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
        case 'compound': {
            const m = pr.mech?.kind === 'compound' ? pr.mech : undefined;
            out.compoundPer = m?.perDebuff ?? 0;
            out.keyword = 'Compound'; out.glyph = '⊕'; out.categoryColor = STRIKE_COLOR;
            break;
        }
        case 'execute': {
            const m = pr.mech?.kind === 'execute' ? pr.mech : undefined;
            out.executeHpPct = Math.round((m?.hpPct ?? 0) * 100);
            out.executeStacks = m?.dotStacks ?? 0;
            out.keyword = 'Execute'; out.glyph = '☠'; out.categoryColor = GLYPH_COLORS.dot;
            break;
        }
        case 'rupture': {
            // Live-only value (detonates the foe's pending DoT) → a word, never a number.
            out.keyword = 'Rupture'; out.glyph = '✸'; out.categoryColor = GLYPH_COLORS.dot;
            break;
        }
        case 'guard':
            out.keyword = 'Guard'; out.glyph = '🛡'; out.categoryColor = GUARD_COLOR; break;
        case 'strike':
            out.keyword = null; out.glyph = '◆'; out.categoryColor = STRIKE_COLOR; break;
        case 'befriend':
            out.keyword = null; out.glyph = '🕊'; out.categoryColor = BEFRIEND_COLOR; break;
        case 'inert':
        default:
            out.keyword = keywordForEffect(pr.ce?.effectId);
            out.glyph = eff && pr.ce ? glyphFor(pr.ce.effectId) : '▽';
            out.categoryColor = INERT_COLOR;
            break;
    }
    return out;
}

function buildDetailKeywords(card: CombatCard, c: CardCalc): { name: string; def: string; minor: boolean }[] {
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
    else push(c.keyword, c.kind === 'inert');
    // A riposte card also grants Guard — surface it as a secondary keyword.
    if (c.kind === 'riposte' && c.guardAmount) push(keywordForVerb('defend'), false);
    // A rider is "minor" only if the engine still doesn't read it (engineHonestKind null).
    for (const r of c.riders) push(keywordForEffect(r.effectId), engineHonestKind(r.effectId) === null);
    return out;
}

/** Honest card FACE view-model (the 5-zone hand card). */
export function faceStats(card: CombatCard, skill?: Skill): CombatCardFaceVM {
    const c = cardCalc(card, skill);
    const stanceColor = STANCE_COLORS[card.stance] ?? '#888';
    const kw = c.keyword ? c.keyword.toUpperCase() : null;
    const free = `${FREE_CHIP_HP} HP`;
    const base = { glyph: c.glyph, categoryColor: c.categoryColor, stanceColor, statusBase: null };
    switch (c.kind) {
        case 'dot': return { ...base, kind: 'dot', keyword: kw, heroText: `${c.total}`, heroSub: `over ${c.turns} turns`, freeHeroText: free, freeHeroSub: null, verbLine: 'foe loses HP each turn', powerRail: c.keyword ?? 'DoT', readDependent: true, inert: false, guardBase: null, statusBase: c.total };
        case 'stun': return { ...base, kind: 'stun', keyword: kw, heroText: `skip ${c.skips} turns`, heroSub: null, freeHeroText: free, freeHeroSub: null, verbLine: "the foe can't act", powerRail: c.keyword ?? 'Stun', readDependent: false, inert: false, guardBase: null };
        case 'weaken': return { ...base, kind: 'weaken', keyword: kw, heroText: '', heroSub: 'weakens its next hit', freeHeroText: free, freeHeroSub: null, verbLine: "weakens the foe's hit", powerRail: c.keyword ?? 'Weaken', readDependent: false, inert: false, guardBase: null };
        case 'regen': return { ...base, kind: 'regen', keyword: kw, heroText: `${c.total}`, heroSub: `over ${c.turns} turns`, freeHeroText: `${c.freeTotal}`, freeHeroSub: `${c.freePerTurn}/turn · ${c.freeTurns} turns`, verbLine: 'heal yourself each turn', powerRail: c.keyword ?? 'Regen', readDependent: false, inert: false, guardBase: null };
        case 'guard': { const b = c.guardAmount ?? 0; return { ...base, kind: 'guard', keyword: 'GUARD', heroText: `Guard ${b}`, heroSub: null, freeHeroText: `Guard ${Math.max(1, Math.round(b * 0.5))}`, freeHeroSub: null, verbLine: 'block the next hit', powerRail: `${b} ↑read`, readDependent: true, inert: false, guardBase: b }; }
        case 'strike': return { ...base, kind: 'strike', keyword: 'STRIKE', heroText: '', heroSub: 'small direct hit', freeHeroText: 'small chip', freeHeroSub: null, verbLine: 'a small direct hit', powerRail: 'full ↑read', readDependent: true, inert: false, guardBase: null };
        case 'befriend': return { ...base, kind: 'befriend', keyword: 'SPARE', heroText: '', heroSub: 'spare a near-dead foe', freeHeroText: 'mercy', freeHeroSub: null, verbLine: 'spare a near-dead foe', powerRail: 'mercy', readDependent: false, inert: false, guardBase: null };
        case 'vulnerable': return { ...base, kind: 'vulnerable', keyword: kw, heroText: `+${c.vulnPct}%`, heroSub: `dmg taken · ${c.turns} turns`, freeHeroText: free, freeHeroSub: null, verbLine: 'foe takes more damage', powerRail: c.keyword ?? 'Vulnerable', readDependent: true, inert: false, guardBase: null, statusBase: c.vulnPct };
        case 'thorns': return { ...base, kind: 'thorns', keyword: kw, heroText: `Reflect ${c.reflectN}`, heroSub: `${c.turns} turns`, freeHeroText: `Reflect ${c.reflectN}`, freeHeroSub: null, verbLine: 'reflect damage to attackers', powerRail: c.keyword ?? 'Thorns', readDependent: false, inert: false, guardBase: null };
        case 'barrier': { const fg = Math.max(1, Math.round((c.guardAmount ?? 2) * 0.5)); return { ...base, kind: 'barrier', keyword: 'BARRIER', heroText: `Soak ${c.barrierAmt}`, heroSub: 'stacks', freeHeroText: `Guard ${fg}`, freeHeroSub: null, verbLine: 'soak incoming damage', powerRail: c.keyword ?? 'Barrier', readDependent: false, inert: false, guardBase: null }; }
        case 'riposte': { const fg = Math.max(1, Math.round((c.guardAmount ?? 2) * 0.5)); return { ...base, kind: 'riposte', keyword: 'RIPOSTE', heroText: `CTR ${c.riposteDmg} · CUT ${c.riposteReduce}`, heroSub: 'counter · reduce', freeHeroText: `Guard ${fg}`, freeHeroSub: null, verbLine: 'counter the next hit', powerRail: c.keyword ?? 'Riposte', readDependent: false, inert: false, guardBase: null }; }
        case 'siphon': return { ...base, kind: 'siphon', keyword: 'SIPHON', heroText: `Heal ${c.siphonPct}%`, heroSub: 'of damage dealt', freeHeroText: 'small chip', freeHeroSub: null, verbLine: 'heal from the damage you deal', powerRail: c.keyword ?? 'Siphon', readDependent: false, inert: false, guardBase: null };
        case 'compound': return { ...base, kind: 'compound', keyword: 'COMPOUND', heroText: `${c.compoundPer}/debuff`, heroSub: 'per foe debuff', freeHeroText: 'small chip', freeHeroSub: null, verbLine: 'more per debuff on the foe', powerRail: c.keyword ?? 'Compound', readDependent: false, inert: false, guardBase: null };
        case 'execute': return { ...base, kind: 'execute', keyword: 'EXECUTE', heroText: 'finisher', heroSub: `foe < ${c.executeHpPct}% HP`, freeHeroText: free, freeHeroSub: null, verbLine: 'finish a low or stacked foe', powerRail: c.keyword ?? 'Execute', readDependent: false, inert: false, guardBase: null };
        case 'rupture': return { ...base, kind: 'rupture', keyword: 'RUPTURE', heroText: 'detonate', heroSub: 'foe DoT', freeHeroText: 'small chip', freeHeroSub: null, verbLine: "detonate the foe's stored DoT", powerRail: c.keyword ?? 'Rupture', readDependent: false, inert: false, guardBase: null };
        case 'inert':
        default: return { ...base, kind: 'inert', keyword: kw ?? 'DEBUFF', heroText: '', heroSub: card.verbClass === 'buff-self' ? 'buff yourself' : 'weakens the foe', freeHeroText: card.verbClass === 'buff-self' ? 'weak buff' : free, freeHeroSub: null, verbLine: card.verbClass === 'buff-self' ? 'buff yourself' : 'weakens the foe', powerRail: c.keyword ?? '—', readDependent: false, inert: true, guardBase: null };
    }
}

/** Honest card DETAIL view-model CORE (everything but the pill table). */
function detailCore(card: CombatCard, skill?: Skill): DetailCore {
    const c = cardCalc(card, skill);
    const Title = c.keyword ?? '';
    const STANCE = STANCE_LABELS[card.stance] ?? card.stance.toUpperCase();
    const metaChip = `${card.stance.toUpperCase()} · TIER ${card.tier} · ${card.effectKind === 'dot' ? 'DOT' : card.effectKind === 'control' ? 'CONTROL' : card.verbClass.toUpperCase()}`;
    const keywords = buildDetailKeywords(card, c);
    const free = FREE_CHIP_HP;
    switch (c.kind) {
        case 'dot': return { subtitle: `${Title} the enemy — damage over time.`, metaChip, outcomeLine: `Apply ${Title} ${c.total} over ${c.turns} turns.`, outcomeStats: [{ label: 'PER TURN', value: `${c.perTurn}` }, { label: 'TURNS', value: `${c.turns}` }, { label: 'TOTAL', value: `${c.total}` }], stacksText: c.stacks ? 'Stacks up to 10×.' : null, freeLine: `◇ FREE (no die): deal ${free} HP now. No ${Title} lands without a die.`, powerLine: `◆ WITH A DIE: apply ${Title} — ${c.perTurn} HP/turn for ${c.turns} turns (${c.total} total), plus a small hit.`, readNote: `The read now scales this: ▲ won read ×${READ_STATUS_MULT.advantage} (≈${Math.round(c.total * READ_STATUS_MULT.advantage)} total), ▼ lost ×${READ_STATUS_MULT.disadvantage} (≈${Math.round(c.total * READ_STATUS_MULT.disadvantage)}); ${c.total} on an even read.`, mathLine: `${c.perTurn}/turn = ${c.dpr} base × ${c.intensity} intensity · ${c.turns} turns · ${c.total} HP total on an even read${c.stacks ? ' · stacks to 10×' : ''}.`, keywords };
        case 'stun': return { subtitle: `${Title} the enemy — it loses its turns.`, metaChip, outcomeLine: `Apply ${Title} ${c.skips} turn${c.skips === 1 ? '' : 's'}.`, outcomeStats: [{ label: 'SKIPS', value: `${c.skips} turns` }], stacksText: null, freeLine: `◇ FREE (no die): deal ${free} HP now. No ${Title} without a die.`, powerLine: `◆ WITH A DIE: ${Title} — the foe skips its next ${c.skips} actions, plus a small hit.`, readNote: `Hard control: the ${c.skips}-turn skip is fixed (the read scales damage-status like DoT/Vulnerable, not a skip count).`, mathLine: `skip ${c.skips}t = ${Title.toLowerCase()} duration ${c.skips} (each turn it would act is cancelled).`, keywords };
        case 'weaken': return { subtitle: `${Title} the enemy — its attacks hit softer.`, metaChip, outcomeLine: `Apply ${Title}.`, outcomeStats: [], stacksText: null, freeLine: `◇ FREE (no die): deal ${free} HP now. No ${Title} without a die.`, powerLine: `◆ WITH A DIE: apply ${Title} — the foe's next hit is weakened, plus a small hit.`, readNote: `${Title} weakens the enemy's hit; pile on different controls to deny the turn outright.`, mathLine: `${Title} lowers the enemy's attack roll; combined controls past a threshold deny the turn (exact amount is engine-tuned).`, keywords };
        case 'regen': return { subtitle: 'Heal yourself over time.', metaChip, outcomeLine: `${Title || 'Regenerate'} ${c.total} over ${c.turns} turns.`, outcomeStats: [{ label: 'PER TURN', value: `${c.perTurn}` }, { label: 'TURNS', value: `${c.turns}` }, { label: 'TOTAL', value: `${c.total}` }], stacksText: null, freeLine: `◇ FREE (no die): a weak regen — ${c.freePerTurn} HP/turn for ${c.freeTurns} turns (${c.freeTotal} total).`, powerLine: `◆ WITH A DIE: regenerate ${c.perTurn} HP/turn for ${c.turns} turns (${c.total} total). Any die; a ${STANCE} die matches.`, readNote: `Heals YOU — no read needed; ${c.total} is exact.`, mathLine: `${c.perTurn}/turn = ${c.dpr} base × ${c.intensity} intensity · ${c.turns} turns · ${c.total} total. FREE = ${c.dpr} base × 1 · ${c.freeTurns} turns · ${c.freeTotal}.`, keywords };
        case 'guard': { const b = c.guardAmount ?? 0; const freeG = Math.max(1, Math.round(b * 0.5)); const adv = Math.max(1, Math.round(b * READ_DAMAGE_MULT.advantage)); const dis = Math.max(1, Math.round(b * READ_DAMAGE_MULT.disadvantage)); return { subtitle: 'Guard yourself — soak the next hit.', metaChip, outcomeLine: `Gain ${Title} ${b}.`, outcomeStats: [{ label: 'GUARD', value: `${b} (▲${adv} · —${b} · ▼${dis})` }], stacksText: null, freeLine: `◇ FREE (no die): a weak brace — Guard ${freeG}.`, powerLine: `◆ WITH A DIE: Guard ${b}; ▲ read raises it to ${adv}, ▼ read drops it to ${dis}; +${COLOR_MATCH_DAMAGE_BONUS} if a ${STANCE} die matches.`, readNote: `The read scales this: ▲ advantage ×${READ_DAMAGE_MULT.advantage}, ▼ disadvantage ×${READ_DAMAGE_MULT.disadvantage}.`, mathLine: `FREE = round(${b} × ½) = ${freeG}.  POWER = round(${b} × read) + ${COLOR_MATCH_DAMAGE_BONUS} on a colour match.`, keywords }; }
        case 'strike': return { subtitle: 'A small direct hit.', metaChip, outcomeLine: 'A small direct hit.', outcomeStats: [], stacksText: null, freeLine: '◇ FREE (no die): chip a sliver of HP.', powerLine: `◆ WITH A DIE: a full direct hit (scales with your ${skill?.scalingStat ?? 'stat'}); ▲ read ×${READ_DAMAGE_MULT.advantage}, ▼ ×${READ_DAMAGE_MULT.disadvantage}.`, readNote: `The read scales this hit: ▲ ×${READ_DAMAGE_MULT.advantage}, ▼ ×${READ_DAMAGE_MULT.disadvantage}.`, mathLine: `≈ (basePower ${skill?.basePower ?? '?'} + your ${skill?.scalingStat ?? 'stat'}) × 0.25 × read — needs live stats, so no fixed number.`, keywords };
        case 'befriend': return { subtitle: 'Spare a near-dead foe.', metaChip, outcomeLine: 'Spare a near-dead foe — end combat peacefully.', outcomeStats: [], stacksText: null, freeLine: '◇ FREE (no die): attempt mercy on a near-dead foe.', powerLine: '◆ WITH A DIE: if the enemy HP is low, end combat peacefully (befriend).', readNote: 'Watch the enemy HP bar — befriend lands only when it is low.', mathLine: 'No fixed number — a conditional outcome gated on low enemy HP.', keywords };
        case 'vulnerable': { const cap = Math.round((VULNERABLE_MAX_MULT - 1) * 100); return { subtitle: `${Title} the enemy — it takes more damage.`, metaChip, outcomeLine: `Apply ${Title} +${c.vulnPct}% · ${c.turns} turns.`, outcomeStats: [{ label: 'DMG TAKEN', value: `+${c.vulnPct}%` }, { label: 'TURNS', value: `${c.turns}` }], stacksText: `Stacks to +${cap}%.`, freeLine: `◇ FREE (no die): deal ${free} HP now. No ${Title} lands without a die.`, powerLine: `◆ WITH A DIE: apply ${Title} — +${c.vulnPct}% damage taken for ${c.turns} turns, plus a small hit.`, readNote: `The read now scales this: ▲ won read ×${READ_STATUS_MULT.advantage} (≈+${Math.round(c.vulnPct * READ_STATUS_MULT.advantage)}%), ▼ lost ×${READ_STATUS_MULT.disadvantage}; +${c.vulnPct}% on an even read.`, mathLine: `+${c.vulnPct}% = (damageTakenMult − 1) × 100 on an even read; combined Vulnerable caps at +${cap}%.`, keywords }; }
        case 'thorns': return { subtitle: `${Title} — attackers take damage back.`, metaChip, outcomeLine: `Gain ${Title} ${c.reflectN} · ${c.turns} turns.`, outcomeStats: [{ label: 'REFLECT', value: `${c.reflectN}` }, { label: 'TURNS', value: `${c.turns}` }], stacksText: c.intensity > 1 || (lookupEffect(c.ce?.effectId ?? '')?.stacking === 'intensity') ? 'Stacks.' : null, freeLine: `◇ FREE (no die): still gain ${Title} — Reflect ${c.reflectN} for ${c.turns} turns (a self-buff lands without a die).`, powerLine: `◆ WITH A DIE: gain ${Title} (Reflect ${c.reflectN}) plus a small hit.`, readNote: 'Your reflect takes no read — Reflect is exact (a self-buff, not scaled by the stance read).', mathLine: `Reflect ${c.reflectN} returned per enemy hit, ${c.turns} turns; stacking raises the reflect.`, keywords };
        case 'barrier': { const b = c.barrierAmt; const fg = Math.max(1, Math.round((c.guardAmount ?? 2) * 0.5)); const adv = Math.max(1, Math.round(b * READ_DAMAGE_MULT.advantage)); const dis = Math.max(1, Math.round(b * READ_DAMAGE_MULT.disadvantage)); return { subtitle: 'Barrier — a stacking shield that soaks damage.', metaChip, outcomeLine: `Gain ${Title} ${b}.`, outcomeStats: [{ label: 'SOAK', value: `${b} (▲${adv} · —${b} · ▼${dis})` }], stacksText: null, freeLine: `◇ FREE (no die): a weak brace — Guard ${fg}.`, powerLine: `◆ WITH A DIE: gain Barrier ${b}; ▲ read raises it to ${adv}, ▼ drops it to ${dis}; +${COLOR_MATCH_DAMAGE_BONUS} on a ${STANCE} match.`, readNote: `The read scales the Barrier granted: ▲ ×${READ_DAMAGE_MULT.advantage}, ▼ ×${READ_DAMAGE_MULT.disadvantage}.`, mathLine: `Soak ${b} base × read + ${COLOR_MATCH_DAMAGE_BONUS} on a colour match; barriers stack.`, keywords }; }
        case 'riposte': { const fg = Math.max(1, Math.round((c.guardAmount ?? 2) * 0.5)); const guardLine = c.guardAmount ? ` · Guard ${c.guardAmount}` : ''; const stats = [{ label: 'COUNTER', value: `${c.riposteDmg}` }, { label: 'REDUCE', value: `-${c.riposteReduce}` }]; if (c.guardAmount) stats.push({ label: 'GUARD', value: `${c.guardAmount}` }); return { subtitle: 'Riposte — counter the next hit and blunt it.', metaChip, outcomeLine: `Arm ${Title} — Counter ${c.riposteDmg} · Cut ${c.riposteReduce}${guardLine}.`, outcomeStats: stats, stacksText: null, freeLine: `◇ FREE (no die): a weak brace — Guard ${fg} (no counter without a die).`, powerLine: `◆ WITH A DIE: arm Riposte — counter ${c.riposteDmg}, reduce ${c.riposteReduce}${c.guardAmount ? `, +Guard ${c.guardAmount}` : ''}; the read scales it.`, readNote: 'The read scales both the counter damage and the reduction.', mathLine: `Counter ${c.riposteDmg} & reduce ${c.riposteReduce}, each × read (+${COLOR_MATCH_DAMAGE_BONUS} counter on a colour match).`, keywords }; }
        case 'siphon': return { subtitle: 'Siphon — heal for part of the damage you deal.', metaChip, outcomeLine: `${Title} ${c.siphonPct}%.`, outcomeStats: [{ label: 'LIFESTEAL', value: `${c.siphonPct}%` }], stacksText: null, freeLine: '◇ FREE (no die): chip a sliver of HP — no Siphon without a die.', powerLine: `◆ WITH A DIE: a full hit (scales with your ${skill?.scalingStat ?? 'stat'}) that heals ${c.siphonPct}% of the damage dealt; ▲ read ×${READ_DAMAGE_MULT.advantage}, ▼ ×${READ_DAMAGE_MULT.disadvantage}.`, readNote: `The hit (and so the heal) scales with the read; the ${c.siphonPct}% rate is exact.`, mathLine: `Heal = ${c.siphonPct}% × (damage dealt this hit) — the hit is live, so no fixed heal number.`, keywords };
        case 'compound': return { subtitle: 'Compound — punishes a debuff-laden foe.', metaChip, outcomeLine: `${Title} ${c.compoundPer}/debuff · max ${COMPOUND_COUNT_CAP}.`, outcomeStats: [{ label: 'PER DEBUFF', value: `${c.compoundPer}` }, { label: 'CAP', value: `${COMPOUND_COUNT_CAP}` }], stacksText: null, freeLine: '◇ FREE (no die): chip a sliver of HP — the compound bonus needs a die.', powerLine: `◆ WITH A DIE: base hit + ${c.compoundPer} × (distinct debuffs, max ${COMPOUND_COUNT_CAP}); the read scales it.`, readNote: 'Stack more DISTINCT debuffs first to maximise the bonus.', mathLine: `bonus = ${c.compoundPer} × debuff count (live, capped ${COMPOUND_COUNT_CAP}) × read — count is live, so no fixed number.`, keywords };
        case 'execute': { const frac = Math.round(EXECUTE_DAMAGE_FRACTION * 100); return { subtitle: 'Execute — a finisher on a low or DoT-stacked foe.', metaChip, outcomeLine: `${Title} ${frac}% max HP · foe <${c.executeHpPct}% HP or ≥${c.executeStacks} DoT.`, outcomeStats: [{ label: 'TRIGGER', value: `< ${c.executeHpPct}% HP` }, { label: 'OR DOT', value: `≥ ${c.executeStacks}` }, { label: 'HIT', value: `${frac}% max HP` }], stacksText: c.riders.length ? 'Also applies its on-hit effects.' : null, freeLine: `◇ FREE (no die): deal ${free} HP now — no Execute or its on-hit effects without a die.`, powerLine: `◆ WITH A DIE: if the foe is < ${c.executeHpPct}% HP or ≥${c.executeStacks} DoT stacks, Execute for ${frac}% of its max HP; otherwise its on-hit effects still land.`, readNote: 'Set it up with DoT, then fire when the foe is low or heavily stacked.', mathLine: `Execute = ${frac}% of the foe's MAX HP when armed (foe < ${c.executeHpPct}% HP OR ≥${c.executeStacks} DoT stacks).`, keywords }; }
        case 'rupture': return { subtitle: "Rupture — detonate the foe's damage-over-time.", metaChip, outcomeLine: `${Title} · max ${RUPTURE_BURST_CAP}.`, outcomeStats: [{ label: 'BURST', value: 'live total' }, { label: 'CAP', value: `${RUPTURE_BURST_CAP}` }], stacksText: null, freeLine: '◇ FREE (no die): chip a sliver of HP — Rupture needs a die.', powerLine: `◆ WITH A DIE: detonate the foe's pending DoT for a burst (up to ${RUPTURE_BURST_CAP}); the read scales it.`, readNote: 'Stack DoT first — the burst equals the pending DoT, so it has no fixed number until you fire it.', mathLine: `Burst = pending DoT × read (capped ${RUPTURE_BURST_CAP}) — pending DoT is live, so no fixed number (real-units-or-no-number).`, keywords };
        case 'inert':
        default: return { subtitle: `${Title || 'Effect'} — minor right now.`, metaChip, outcomeLine: `${Title || 'This effect'} — minor for now.`, outcomeStats: [], stacksText: null, freeLine: `◇ FREE (no die): deal ${free} HP now.`, powerLine: `◆ WITH A DIE: apply ${Title || 'the effect'}, plus a small hit.`, readNote: 'The read scales only the small strike.', mathLine: `${Title || 'This effect'} is not read by the live HP engine yet — no number shown.`, keywords };
    }
}

/** Honest card DETAIL view-model (inspect modal) — the CORE plus the compact
 *  NO-DIE / +DIE pill table that replaces the old prose FREE/POWER fork. Same
 *  numbers as the face; read-scaling math is pulled into the +DIE pill (the prose
 *  is flattened, NOT the math). */
export function detailStats(card: CombatCard, skill?: Skill): CombatCardDetailVM {
    const core = detailCore(card, skill);
    const c = cardCalc(card, skill);
    const face = faceStats(card, skill);
    const STANCE = STANCE_LABELS[card.stance] ?? card.stance.toUpperCase();
    // NO-DIE pill: the free (die-optional) value.
    const freePill = face.freeHeroText + (face.freeHeroSub ? ` (${face.freeHeroSub})` : '');
    // +DIE pill: keyword + powered value. Read-dependent kinds (guard/barrier) carry
    // the ▲adv · —base · ▼dis triplet pulled from the live read scaling.
    const diePillKeyword = face.keyword ?? core.keywords[0]?.name ?? 'EFFECT';
    let diePill: string;
    if (c.kind === 'guard' || c.kind === 'barrier') {
        const b = c.kind === 'guard' ? (c.guardAmount ?? 0) : c.barrierAmt;
        const adv = Math.max(1, Math.round(b * READ_DAMAGE_MULT.advantage));
        const dis = Math.max(1, Math.round(b * READ_DAMAGE_MULT.disadvantage));
        diePill = `▲${adv} · —${b} · ▼${dis}`;
    } else if (c.kind === 'dot') {
        const adv = Math.max(1, Math.round(c.total * READ_STATUS_MULT.advantage));
        const dis = Math.max(1, Math.round(c.total * READ_STATUS_MULT.disadvantage));
        diePill = `▲${adv} · —${c.total} · ▼${dis}`;
    } else if (c.kind === 'vulnerable') {
        const adv = Math.max(1, Math.round(c.vulnPct * READ_STATUS_MULT.advantage));
        const dis = Math.max(1, Math.round(c.vulnPct * READ_STATUS_MULT.disadvantage));
        diePill = `▲${adv}% · —${c.vulnPct}% · ▼${dis}%`;
    } else if (face.heroText && face.heroSub) {
        diePill = `${face.heroText} · ${face.heroSub}`;
    } else if (face.heroText) {
        diePill = face.heroText;
    } else {
        diePill = face.heroSub ?? face.keyword ?? '';
    }
    // The colour-match rule — rendered ONCE per modal (was boilerplated onto every powerLine).
    const colorMatchHint = `Any die works — a ${STANCE} die matches: +${COLOR_MATCH_DAMAGE_BONUS} damage and a stronger read.`;
    return { ...core, freePill, diePillKeyword, diePill, colorMatchHint };
}

/** Read-scaled hero value at the moment of commit (read known) — StagedCard only.
 *  Guard/Barrier scale by the damage read (+colour-match bonus); DoT total and
 *  Vulnerable % scale by the gentler STATUS read (the read now bites status too —
 *  no colour bonus, matching the engine). null for kinds with no read-scalable
 *  number (strike stays qualitative 'HIT' + a read pip; stun's skip count is
 *  duration-, not intensity-, driven). */
export function armedReadValue(face: CombatCardFaceVM, read: CombatReadResult, colorMatch: boolean): number | null {
    if (face.kind === 'guard' && face.guardBase != null) {
        return Math.max(1, Math.round(face.guardBase * READ_DAMAGE_MULT[read])) + (colorMatch ? COLOR_MATCH_DAMAGE_BONUS : 0);
    }
    if ((face.kind === 'dot' || face.kind === 'vulnerable') && face.statusBase != null) {
        return Math.max(1, Math.round(face.statusBase * READ_STATUS_MULT[read]));
    }
    return null;
}

function handVM(state: CombatEncounterState): CombatCardVM[] {
    const drafted = getDraftedDie(state);
    return engineHandCards(state)
        // Retreat is no longer an in-combat card — fleeing is offered at the
        // encounter prelude (ENGAGE / FLEE), not from the hand.
        .filter(({ card }: { card: CombatCard }) => card.id !== 'card-retreat' && card.verbClass !== 'retreat')
        .map(({ uid, card }: { uid: string; card: CombatCard }) => {
        const preview = drafted ? cardReadPreview(state, card) : null;
        const skill = card.skillId ? getSkillById(card.skillId) : undefined;
        return {
            uid, cardId: card.id, name: card.name, stance: card.stance,
            stanceColor: STANCE_COLORS[card.stance] ?? '#888',
            verbClass: card.verbClass, effectKind: card.effectKind, rarity: card.rarity, tier: card.tier, category: card.category,
            topActionText: card.topActionText, bottomActionText: card.bottomActionText,
            bottomDamagePreview: card.bottomDamagePreview,
            face: faceStats(card, skill),
            detail: detailStats(card, skill),
            read: preview?.read ?? null, colorMatch: preview?.colorMatch ?? false,
        };
    });
}

const SIG_ICON: Record<string, string> = {
    scout: '👁', reroll: '🎲', sustain: '✚', control: '⛓', dot: '☠', mercy: '🕊', strike: '⚔', draw: '🎴',
};

function signaturesVM(state: CombatEncounterState): CombatSignatureVM[] {
    // The player's per-archetype kit (Spec 26b §B), resolved on the encounter.
    return state.signatures
        .map(id => getSignatureSkill(id))
        .filter((s): s is SignatureSkill => !!s)
        .map((s: SignatureSkill) => ({
            id: s.id, name: s.name, description: s.description, cost: s.cost,
            affordable: state.conviction >= s.cost,
            icon: SIG_ICON[s.kind] ?? '◆',
        }));
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

export interface CombatRewardOfferVM {
    cardId: string; name: string; stance: string; stanceColor: string;
    effectKind: 'dot' | 'control' | 'none'; rarity?: 'gold'; verbClass: string; tier: number; preview: number; text: string;
}

/** Maps reward card ids (from rollCombatCardRewards) into display VMs. */
export function rewardOfferVMs(ids: string[]): CombatRewardOfferVM[] {
    const out: CombatRewardOfferVM[] = [];
    for (const id of ids) {
        const c = getCard(id);
        if (!c) continue;
        out.push({
            cardId: id, name: c.name, stance: c.stance, stanceColor: STANCE_COLORS[c.stance] ?? '#888',
            effectKind: c.effectKind, rarity: c.rarity, verbClass: c.verbClass, tier: c.tier, preview: c.bottomDamagePreview,
            text: c.bottomActionText,
        });
    }
    return out;
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function buildCombatViewModel(state: CombatEncounterState): CombatViewModel {
    const total = state.threatPhases.length;
    const idx = Math.min(state.currentPhaseIndex, total - 1);
    const draftedDie = getDraftedDie(state);
    const usableDraft = !!draftedDie && draftedDie.state === 'available' && draftedDie.color !== 'x';
    return {
        phase: state.phase,
        enemy: enemyPane(state),
        player: playerPane(state),
        dice: diceVM(state),
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
    };
}
