/**
 * WX — the "weathered grimoire" design system for the Card Workshop editor.
 *
 * Ported verbatim (colors, glyph families, textures) from the zero-build
 * prototype's `workshop-shared.jsx`, now strongly typed. These tokens drive the
 * card FACE, the form primitives, and the practice-dummy sandbox.
 *
 * NOTE on vocabulary: the `KEYWORDS` table below is the editor's *display*
 * vocabulary for the card face + dummy sim. It is intentionally distinct from
 * the REAL effects library (`@mechanics/Effects`) — the form's effect dropdowns
 * are driven by real effect ids; the face/dummy speak this terser keyword
 * language, projected from a card's mechanical content (see `projectFace`).
 */

// ── Palette + type tokens ────────────────────────────────────────────────────
export const WX = {
    bg: '#0a0908',
    panel: '#14110e',
    panel2: '#100d0a',
    ink: '#e8dfc8',
    parchment: '#e8dfc8',
    bone: '#8a8273',
    ash: '#3a3530',
    ashLine: '#2a2620',
    blood: '#c0152a',
    sulfur: '#d4c026',
    rust: '#9e3a1a',
    // type families
    gothic: '"Pirata One", "IM Fell English SC", serif',
    serif: '"IM Fell English", Georgia, serif',
    sans: '"Bebas Neue", "Oswald", sans-serif',
    mono: '"JetBrains Mono", "IBM Plex Mono", monospace',
} as const;

// ── Die / stance colours (heart=purple, body=red, mind=blue, wild=gold) ──────
export type DieKey = 'body' | 'mind' | 'heart' | 'wild';

export interface DieMeta {
    label: string;
    color: string;
    soft: string;
}

export const DIE: Record<DieKey, DieMeta> = {
    body: { label: 'BODY', color: '#d6543f', soft: 'rgba(214,84,63,0.16)' },
    mind: { label: 'MIND', color: '#4f7fd6', soft: 'rgba(79,127,214,0.16)' },
    heart: { label: 'HEART', color: '#9a5fd0', soft: 'rgba(154,95,208,0.16)' },
    wild: { label: 'WILD', color: '#d9b44a', soft: 'rgba(217,180,74,0.16)' },
};
export const DIE_ORDER: DieKey[] = ['body', 'mind', 'heart', 'wild'];

// ── Rarity frame (common grey · rare purple · gold yellow-orange) ────────────
export type RarityKey = 'common' | 'rare' | 'gold';

export interface RarityMeta {
    label: string;
    color: string;
    glow: number;
    border: number;
    star?: boolean;
}

export const RARITY: Record<RarityKey, RarityMeta> = {
    common: { label: 'COMMON', color: '#8a8273', glow: 0, border: 1.5 },
    rare: { label: 'RARE', color: '#9a6ad6', glow: 13, border: 2 },
    // GOLD no longer gets a special frame: it renders with the NORMAL (common)
    // grey border, no glow, no ★. The rarity DATA/plumbing (isGold, 'gold' key,
    // label) is kept intact — only the gold-border visual treatment is removed.
    gold: { label: 'GOLD', color: '#8a8273', glow: 0, border: 1.5 },
};
export const RARITY_ORDER: RarityKey[] = ['common', 'rare', 'gold'];

// ── Keyword glossary — terse mechanical definitions (PRD vocabulary) ─────────
export type KeywordFamily =
    | 'direct'
    | 'dot'
    | 'control'
    | 'defense'
    | 'recovery'
    | 'special';

export interface KeywordMeta {
    label: string;
    family: KeywordFamily;
    /** Value unit shown on the card face: '×' stacks · 't' turns · '%' · '' flat. */
    unit: '' | '×' | 't' | '%';
    blurb: string;
}

export const KEYWORDS = {
    damage: { label: 'DAMAGE', family: 'direct', unit: '', blurb: 'Deal direct HP damage to the enemy.' },
    dot: { label: 'DOT', family: 'dot', unit: '×', blurb: 'Apply a bleeding/burning stack that deals HP damage each enemy turn.' },
    control: { label: 'CONTROL', family: 'control', unit: 't', blurb: "Apply a debuff that disrupts the enemy's next action." },
    guard: { label: 'GUARD', family: 'defense', unit: '', blurb: "One-shot shield that absorbs the enemy's next telegraphed hit." },
    barrier: { label: 'BARRIER', family: 'defense', unit: '', blurb: "Stacking, persistent damage-soak — doesn't expire after one hit." },
    riposte: { label: 'RIPOSTE', family: 'special', unit: '', blurb: 'Parry: reduce the incoming hit + counter-strike for bonus damage.' },
    rupture: { label: 'RUPTURE', family: 'special', unit: '', blurb: 'Consume all DoT stacks on the enemy for a burst of damage.' },
    compound: { label: 'COMPOUND', family: 'direct', unit: '', blurb: 'Deal bonus damage per distinct debuff already on the enemy.' },
    execute: { label: 'EXECUTE', family: 'special', unit: '', blurb: 'Lethal finisher; crits when enemy is low HP or has multiple DoTs.' },
    siphon: { label: 'SIPHON', family: 'recovery', unit: '%', blurb: 'Heal yourself for a % of the HP damage this card deals.' },
    regen: { label: 'REGEN', family: 'recovery', unit: '×', blurb: 'Apply regeneration stacks that heal you each of your turns.' },
    poison: { label: 'POISON', family: 'dot', unit: '×', blurb: 'Apply poison stacks (DoT variant, dealt each enemy turn).' },
    bleed: { label: 'BLEED', family: 'dot', unit: '×', blurb: 'Apply bleed stacks (DoT variant with burst potential via rupture).' },
    stun: { label: 'STUN', family: 'control', unit: 't', blurb: "Skip the enemy's next action entirely." },
    slow: { label: 'SLOW', family: 'control', unit: 't', blurb: 'Reduce enemy damage/speed for N turns.' },
    confusion: { label: 'CONFUSION', family: 'control', unit: 't', blurb: 'Enemy has a chance to misfire its next action.' },
    silence: { label: 'SILENCE', family: 'control', unit: 't', blurb: 'Prevent the enemy from using special abilities for N turns.' },
    strip_buff: { label: 'STRIP BUFF', family: 'special', unit: '', blurb: 'Remove one random buff from the enemy.' },
    heal_self: { label: 'HEAL SELF', family: 'recovery', unit: '', blurb: 'Heal yourself for a flat amount after damage resolves.' },
} satisfies Record<string, KeywordMeta>;

export type KeywordId = keyof typeof KEYWORDS;
export const KEYWORD_ORDER = Object.keys(KEYWORDS) as KeywordId[];
export const KW_OPTIONS: { value: KeywordId; label: string }[] = KEYWORD_ORDER.map(
    (id) => ({ value: id, label: KEYWORDS[id].label }),
);

/** Compact value text for the card face: ×N stacks · Nt turns · N% · plain N. */
export function fmtVal(kwId: string, val: number | null | undefined): string {
    if (val == null || val === 0) return '';
    const m = (KEYWORDS as Record<string, KeywordMeta>)[kwId];
    if (!m) return String(val);
    if (m.unit === '×') return '×' + val;
    if (m.unit === 't') return val + 't';
    if (m.unit === '%') return val + '%';
    return String(val);
}

/** Keyword + value on one line, e.g. "BLEED ×3" / "DAMAGE 14" / "GUARD". */
export function kwLine(kwId: string, val: number | null | undefined): string {
    const m = (KEYWORDS as Record<string, KeywordMeta>)[kwId];
    if (!m) return '—';
    const v = fmtVal(kwId, val);
    return v ? `${m.label} ${v}` : m.label;
}

// ── Textures ─────────────────────────────────────────────────────────────────
/** Faint fractal grain laid over the dark base. */
export const WX_NOISE =
    'url("data:image/svg+xml;utf8,' +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0.91 0 0 0 0 0.87 0 0 0 0 0.78 0 0 0 0.05 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`,
    ) +
    '")';

/** Striped "drop art here" placeholder fill. */
export const ART_STRIPES =
    'repeating-linear-gradient(135deg, rgba(232,223,200,0.05) 0 8px, transparent 8px 16px)';
