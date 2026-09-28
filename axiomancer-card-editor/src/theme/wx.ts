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

// ── Rarity frame (spec 32 v3 §4: common · uncommon · rare, derived from rank) ─
export type RarityKey = 'common' | 'uncommon' | 'rare';

export interface RarityMeta {
    label: string;
    color: string;
    glow: number;
    border: number;
    star?: boolean;
}

export const RARITY: Record<RarityKey, RarityMeta> = {
    common: { label: 'COMMON', color: '#8a8273', glow: 0, border: 1.5 },
    uncommon: { label: 'UNCOMMON', color: '#6b8eb0', glow: 0, border: 1.5 },
    // RARE (Skull/Saint) keys the special frame — the gold tier is gone.
    rare: { label: 'RARE', color: '#9a6ad6', glow: 13, border: 2 },
};
export const RARITY_ORDER: RarityKey[] = ['common', 'uncommon', 'rare'];

// ── Keyword glossary — terse mechanical definitions (PRD vocabulary) ─────────
export type KeywordFamily =
    | 'direct'
    | 'dot'
    | 'control'
    | 'defense'
    | 'recovery'
    | 'special';

/** S3 (D40) — the stat that scales a keyword, by where its effect lands:
 *  body = damage to the foe, mind = on you, heart = on the foe, grey = none. */
export type KeywordStat = 'body' | 'mind' | 'heart' | 'grey';

export interface KeywordMeta {
    label: string;
    family: KeywordFamily;
    stat: KeywordStat;
    /** Value unit shown on the card face: '×' stacks · 't' turns · '%' · '' flat. */
    unit: '' | '×' | 't' | '%';
    blurb: string;
}

export const KEYWORDS = {
    damage: { label: 'DAMAGE', family: 'direct', stat: 'body', unit: '', blurb: 'Deal direct HP damage to the enemy.' },
    dot: { label: 'DOT', family: 'dot', stat: 'heart', unit: '×', blurb: 'Apply a bleeding/burning stack that deals HP damage each enemy turn.' },
    control: { label: 'CONTROL', family: 'control', stat: 'heart', unit: 't', blurb: "Apply a debuff that disrupts the enemy's next action." },
    guard: { label: 'GUARD', family: 'defense', stat: 'mind', unit: '', blurb: "One-shot shield that absorbs the enemy's next telegraphed hit." },
    regen: { label: 'REGEN', family: 'recovery', stat: 'mind', unit: '×', blurb: 'Apply regeneration stacks that heal you each of your turns.' },
    poison: { label: 'POISON', family: 'dot', stat: 'heart', unit: '×', blurb: 'Apply poison stacks (DoT variant, dealt each enemy turn).' },
    bleed: { label: 'BLEED', family: 'dot', stat: 'heart', unit: '×', blurb: 'Apply bleed stacks (DoT variant with burst potential via rupture).' },
    stun: { label: 'STUN', family: 'control', stat: 'heart', unit: 't', blurb: "Skip the enemy's next action entirely." },
    heal_self: { label: 'HEAL SELF', family: 'recovery', stat: 'mind', unit: '', blurb: 'Heal yourself for a flat amount after damage resolves.' },
    // ── Spec 32 v3 — the themed-deck vocabulary ──
    mark: { label: 'MARK', family: 'dot', stat: 'heart', unit: '×', blurb: 'Universal exposure: every DoT tick on the bearer deals +1 per stack.' },
    stagger: { label: 'STAGGER', family: 'control', stat: 'heart', unit: '', blurb: "Remove rungs from the enemy's next telegraphed action; at 0 it is denied." },
    sway: { label: 'PLEA', family: 'special', stat: 'heart', unit: '', blurb: 'Stacks on the enemy, decays 1/turn; reaching its resolve opens ACCEPT / CONTINUE.' },
    // The keyword purge (2026-09-28) removed the RIPOSTE and FORETELL rows:
    // neither word has a live carrier or a glossary entry any more.
    draw: { label: 'DRAW', family: 'special', stat: 'grey', unit: '', blurb: 'Draw cards from your deck.' },
    oath: { label: 'OATH', family: 'special', stat: 'mind', unit: '', blurb: 'A persistent player-side passive, rest of combat. Paid only.' },
    hex: { label: 'HEX', family: 'special', stat: 'heart', unit: '', blurb: 'A standing curse attached to the enemy, rest of combat. Paid only.' },
    // ── Profane Canon (2026-08-08) — the rework vocabulary. The keyword
    // audit (2026-09-27, after the card purge) removed every row whose
    // keyword left the registry with the purged cards. ──
    doom: { label: 'DOOM', family: 'dot', stat: 'heart', unit: '×', blurb: 'A DoT that grows +1 intensity each time the foe acts. No calendar — ends only by consumption.' },
    // S3 (D43) — the grey office's A Plain Word.
    vulnerable: { label: 'VULNERABLE', family: 'control', stat: 'heart', unit: '%', blurb: 'The foe takes that much more damage from every hit. Stacks; re-applying refreshes the turns.' },
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
