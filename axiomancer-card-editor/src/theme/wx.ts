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
    siphon: { label: 'SIPHON', family: 'recovery', unit: '%', blurb: 'Heal yourself for a % of the HP damage this card deals.' },
    regen: { label: 'REGEN', family: 'recovery', unit: '×', blurb: 'Apply regeneration stacks that heal you each of your turns.' },
    poison: { label: 'POISON', family: 'dot', unit: '×', blurb: 'Apply poison stacks (DoT variant, dealt each enemy turn).' },
    bleed: { label: 'BLEED', family: 'dot', unit: '×', blurb: 'Apply bleed stacks (DoT variant with burst potential via rupture).' },
    stun: { label: 'STUN', family: 'control', unit: 't', blurb: "Skip the enemy's next action entirely." },
    strip_buff: { label: 'STRIP BUFF', family: 'special', unit: '', blurb: 'Remove one random buff from the enemy.' },
    heal_self: { label: 'HEAL SELF', family: 'recovery', unit: '', blurb: 'Heal yourself for a flat amount after damage resolves.' },
    // ── Spec 32 v3 — the themed-deck vocabulary ──
    mark: { label: 'MARK', family: 'dot', unit: '×', blurb: 'Universal exposure: every DoT tick on the bearer deals +1 per stack.' },
    stagger: { label: 'STAGGER', family: 'control', unit: '', blurb: "Remove rungs from the enemy's next telegraphed action; at 0 it is denied." },
    backfire: { label: 'BACKFIRE', family: 'control', unit: '×', blurb: 'While active the enemy takes N per rung its actions lose.' },
    sway: { label: 'PLEA', family: 'special', unit: '', blurb: 'Stacks on the enemy, decays 1/turn; reaching its resolve opens ACCEPT / CONTINUE.' },
    reap: { label: 'REAP', family: 'special', unit: '', blurb: 'Spend Souls to fire the printed payoff.' },
    soul: { label: 'SOUL', family: 'special', unit: '', blurb: 'Gained when an enemy affliction expires or is consumed; spent by REAP.' },
    foretell: { label: 'FORETELL', family: 'special', unit: '', blurb: "Peek + reorder your deck top and glimpse the enemy's next telegraph." },
    premise: { label: 'CHARGE', family: 'special', unit: '', blurb: 'The running tally of your argument; a Sentence spends it.' },
    echo: { label: 'ECHO', family: 'special', unit: '', blurb: 'The printed line fires twice.' },
    forge: { label: 'FORGE', family: 'special', unit: '', blurb: 'Create a floating die that persists across combats until spent.' },
    tick: { label: 'TICK', family: 'dot', unit: '', blurb: 'One enemy DoT deals its per-turn damage now; duration untouched.' },
    draw: { label: 'DRAW', family: 'special', unit: '', blurb: 'Draw cards from your deck.' },
    oath: { label: 'OATH', family: 'special', unit: '', blurb: 'A persistent player-side passive, rest of combat. Paid only.' },
    hex: { label: 'HEX', family: 'special', unit: '', blurb: 'A standing curse attached to the enemy, rest of combat. Paid only.' },
    // ── Profane Canon (2026-08-08) — the rework vocabulary ──
    doom: { label: 'DOOM', family: 'dot', unit: '×', blurb: 'A DoT that grows +1 intensity each time the foe acts. No calendar — ends only by consumption.' },
    immolate: { label: 'IMMOLATE', family: 'special', unit: '', blurb: 'Burn the lowest-rank cards in hand as a cost — they leave the fight entirely.' },
    purge: { label: 'PURGE', family: 'special', unit: '', blurb: 'This curse card exiles itself from the fight when played.' },
    requiem: { label: 'REQUIEM', family: 'special', unit: '', blurb: 'Condition line: fires free while your discard pile holds N+ cards.' },
    fester: { label: 'FESTER', family: 'dot', unit: '×', blurb: 'Every DoT on the enemy gains that much intensity.' },
    prolong: { label: 'PROLONG', family: 'dot', unit: 't', blurb: 'Every DoT you have on the enemy runs that many turns longer.' },
    recall: { label: 'RECALL', family: 'special', unit: '', blurb: 'Return cards from your discard pile to hand — highest rank first.' },
    replay: { label: 'REPLAY', family: 'special', unit: '', blurb: "Your last spell's PAID payload fires again, that many times." },
    mill: { label: 'MILL', family: 'special', unit: '', blurb: 'Send cards from your deck top to the discard pile.' },
    recoil: { label: 'RECOIL', family: 'special', unit: '', blurb: 'Pay the printed VITAE as a cost — unpreventable.' },
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
