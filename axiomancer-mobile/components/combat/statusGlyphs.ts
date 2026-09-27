/**
 * Spec 25 §7.6 — Status-effect glyphs.
 *
 * Presentation-only mapping from an engine `Effect` to a visible glyph + colour
 * so the player can SEE every status effect on the combat board — status
 * effects remain a major authored tool and must stay legible even though
 * status primacy is no longer doctrine (THE BIG NUMBERS REWRITE, 2026-09-02;
 * VISION.md §Combat vision). The engine owns the effect content; this module
 * owns the visual mapping (ADR-0001/0003).
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
    // The keyword audit (2026-09-27, after the card purge) cut this table to
    // the ids the effects library still defines; the ~40 legacy rows (burn,
    // stun, frostbite, ...) and the purged-card species (kindling_ember,
    // nettle_sting, backfire, buff_thorns) pointed at nothing.
    // ── DoT ──
    debuff_poison: '☠',
    debuff_bleed: '🩸',
    debuff_creeping_doom: '🕸',
    // ── Control ──
    debuff_petrify: '🗿',
    // ── Stat-down / marks ──
    debuff_mark: '◉',
    debuff_quarter: '☙',
    // S3 (D43) — A Plain Word's affliction: the foe's guard is open.
    debuff_vulnerable: '▼',
    debuff_curse: '🧿',
    // ── Regen / advantage (buffs) ──
    buff_regeneration: '✚',
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
