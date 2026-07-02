/**
 * Spec 25 §7.6 — Status-effect glyphs.
 *
 * Presentation-only mapping from an engine `Effect` to a visible glyph + colour
 * so the player can SEE every status effect on the combat board (the doctrine:
 * status effects are the main fun, and they must be legible). The engine owns
 * the effect content; this module owns the visual mapping (ADR-0001/0003).
 *
 * Each effect resolves to:
 *   - a distinctive unicode glyph (a curated per-effect symbol where it matters,
 *     falling back to a category glyph),
 *   - a category colour (DoT = flame/red, control = chain/purple, stat-down =
 *     arrow-down/orange, buffs = arrow-up/green, …),
 *   - a coarse `kind` the UI can group by.
 *
 * Pure + dependency-free so it is trivially unit-testable and usable anywhere.
 */

export type StatusGlyphKind =
    | 'dot' | 'control' | 'statdown' | 'statup' | 'regen' | 'drain' | 'thorns' | 'advantage' | 'mark';

/** Minimal shape this module reads from an engine Effect (structural typing). */
export interface EffectLike {
    id: string;
    name?: string;
    type?: 'buff' | 'debuff';
    category?: string;
    payload?: {
        damageOverTime?: unknown;
        actionRestriction?: unknown;
        regeneration?: { healthPerRound?: number };
        statModifiers?: { value: number }[];
        advantageModifier?: unknown;
        reflectDamage?: number;
        rollModifier?: number;
        defenseModifier?: number;
    };
}

export interface StatusGlyph {
    glyph: string;
    color: string;
    kind: StatusGlyphKind;
    /** Accessible label (effect name or a humanised id). */
    label: string;
}

/** Category colours (spec §7.3/§7.6). Aligned to the stance palette where it
 *  reads naturally; tuned for dark-board contrast. */
export const GLYPH_COLORS: Record<StatusGlyphKind, string> = {
    dot: '#e2543b',        // flame red — erosion
    drain: '#8e2b2b',      // dark blood
    control: '#a86bdc',    // chain purple
    statdown: '#e08a3c',   // arrow-down amber
    statup: '#5bbf6a',     // arrow-up green
    regen: '#49b98a',      // restorative teal-green
    thorns: '#9aa0a6',     // iron grey
    advantage: '#4f9ddb',  // insight blue
    mark: '#d9c66a',       // tracking gold
};

/**
 * Curated per-effect glyphs for the named, recognisable effects (so a poison
 * reads differently from a bleed reads differently from a burn). Anything not
 * listed falls back to its category glyph via `kindGlyph`.
 */
const EFFECT_GLYPHS: Record<string, string> = {
    // ── DoT ──
    debuff_poison: '☠',
    debuff_strong_poison: '☣',
    debuff_bleed: '🩸',
    debuff_burn: '🔥',
    debuff_frostbite: '❄',
    debuff_shock: '⚡',
    debuff_disease: '🦠',
    debuff_hex: '🕯',
    debuff_hp_decay: '⌛',
    debuff_tartarus_rot: '🦴',
    debuff_basilisk_venom: '🐍',
    debuff_acid: '🧪',
    // ── Control ──
    debuff_stun: '💫',
    debuff_sleep: '💤',
    debuff_daze: '✦',
    debuff_petrify: '🗿',
    debuff_fear: '👁',
    debuff_charm: '💗',
    debuff_confusion: '🌀',
    debuff_blind: '🌑',
    debuff_silence: '🤐',
    debuff_slow: '🐌',
    debuff_root: '⚓',
    debuff_knockdown: '⬇',
    debuff_moral_learning: '⚖',
    debuff_transformative: '🔄',
    debuff_causal_emergence: '🌋',
    debuff_category_error: '⁇',
    debuff_lethe_fog: '🌫',
    debuff_gorgon_gaze: '🐍',
    debuff_minotaur_maze: '🌀',
    buff_taunt: '🎯',
    // ── Stat-down / marks ──
    tier1_mind_mark: '◎',
    debuff_all_stats_down: '▽',
    debuff_curse: '🧿',
    debuff_wound: '🩹',
    debuff_berserk: '💢',
    debuff_fatigue: '😩',
    debuff_exhaustion: '😮‍💨',
    debuff_vulnerability_body: '🛡',
    debuff_vulnerability_mind: '🧠',
    debuff_vulnerability_heart: '❣',
    debuff_dispel: '✖',
    // ── Regen / drain / thorns / advantage (buffs) ──
    buff_regeneration: '✚',
    buff_barrier: '🛡',
    buff_thorns: '✸',
    buff_critical_rate_up: '✷',
    buff_all_stats_up: '⬆',
};

/** Category fallback glyphs. */
const KIND_GLYPHS: Record<StatusGlyphKind, string> = {
    dot: '🔥',
    drain: '🩸',
    control: '⛓',
    statdown: '▼',
    statup: '▲',
    regen: '✚',
    thorns: '✸',
    advantage: '◆',
    mark: '◎',
};

/** Classifies an effect into a coarse glyph kind from its payload. */
export function classifyGlyphKind(effect: EffectLike): StatusGlyphKind {
    const p = effect.payload ?? {};
    if (p.damageOverTime) return 'dot';
    if (p.actionRestriction || effect.category === 'control') return 'control';
    const regen = p.regeneration?.healthPerRound ?? 0;
    if (regen > 0) return 'regen';
    if (regen < 0) return 'drain';
    if (p.reflectDamage) return 'thorns';
    if (p.advantageModifier) return 'advantage';
    if (effect.id?.endsWith('_mark')) return 'mark';
    const isDebuff = effect.type === 'debuff';
    const hasNegStat = (p.statModifiers ?? []).some(m => m.value < 0)
        || (p.rollModifier ?? 0) < 0 || (p.defenseModifier ?? 0) < 0;
    if (isDebuff || hasNegStat) return 'statdown';
    return 'statup';
}

/** Humanises an effect id when no name is supplied. */
function humanise(id: string): string {
    return id.replace(/^(buff|debuff|tier\d)_/i, '').replace(/_/g, ' ');
}

/** Resolves the full glyph view-model for an effect. */
export function effectGlyph(effect: EffectLike): StatusGlyph {
    const kind = classifyGlyphKind(effect);
    const glyph = EFFECT_GLYPHS[effect.id] ?? KIND_GLYPHS[kind];
    return {
        glyph,
        color: GLYPH_COLORS[kind],
        kind,
        label: effect.name ?? humanise(effect.id),
    };
}
