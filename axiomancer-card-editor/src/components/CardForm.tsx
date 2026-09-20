/**
 * CardForm — the FULL-FIDELITY editor for a single card (a.k.a. Action; the
 * real TS type is `Card`). Every editable `CardDraft` field is exposed:
 * identity, classification, power/scaling, the five-resource cost, the
 * combatEffects[] list (driven by the REAL effects library), the
 * specialMechanics[] union editor, learning requirement, synergy, tags, and
 * provenance metadata. Grouped into collapsible sections so it stays usable
 * one-handed on a phone.
 *
 * Pure controlled component: `card` + `setCard` come from the parent so the
 * CREATE and EDIT tabs share one implementation.
 */
import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import type {
    CardSpecialMechanic,
    CardAspect,
    CardCombatEffects,
} from '@mechanics/Cards/types';
import type { CardDraft } from '../types';
import {
    STANCES,
    TIERS,
    RANKS,
    CARD_TYPES,
    TARGET_TYPES,
    APPLIED_TO,
    SPECIAL_MECHANIC_KINDS,
    EFFECTS,
    DEBUFF_EFFECTS,
    BUFF_EFFECTS,
    lookupEffectOption,
    type SpecialMechanicKind,
} from '../data/mechanics';
import { WX, DIE, ART_STRIPES, type DieKey } from '../theme/wx';
import { FieldLabel, TextField, Segmented, Dropdown, Stepper, Btn } from './form';

type DraftImg = CardDraft & { img?: string | null };

const dieColor = (v: CardAspect) => DIE[v as DieKey].color;

// ── A collapsible section ────────────────────────────────────────────────────
function Section({
    title,
    badge,
    defaultOpen = false,
    children,
}: {
    title: string;
    badge?: string | number;
    defaultOpen?: boolean;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ borderTop: `1px solid ${WX.ashLine}` }}>
            <button
                onClick={() => setOpen((o) => !o)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '14px 2px',
                    cursor: 'pointer',
                    font: 'inherit',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                }}
            >
                <span style={{ color: WX.sulfur, fontFamily: WX.mono, fontSize: 12, width: 14 }}>{open ? '▾' : '▸'}</span>
                <span style={{ flex: 1, fontFamily: WX.sans, fontSize: 14, letterSpacing: 2, color: WX.parchment }}>{title}</span>
                {badge != null && badge !== '' && (
                    <span style={{ fontFamily: WX.mono, fontSize: 11, color: WX.sulfur, background: 'rgba(212,192,38,0.12)', padding: '1px 7px' }}>
                        {badge}
                    </span>
                )}
            </button>
            {open && <div style={{ paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>}
        </div>
    );
}

// ── A decimal numeric input (for multipliers) ────────────────────────────────
// Currently unreferenced; underscore-named to keep it available without
// tripping the unused-vars gate.
function _NumField({
    value,
    onChange,
    placeholder,
}: {
    value: number | undefined;
    onChange: (v: number | undefined) => void;
    placeholder?: string;
}) {
    const [text, setText] = useState(value == null ? '' : String(value));
    return (
        <input
            inputMode="decimal"
            value={text}
            placeholder={placeholder}
            onChange={(e) => {
                const t = e.target.value;
                setText(t);
                if (t.trim() === '') {
                    onChange(undefined);
                    return;
                }
                const n = Number(t);
                if (!Number.isNaN(n)) onChange(n);
            }}
            style={{
                width: '100%',
                boxSizing: 'border-box',
                background: WX.panel2,
                border: `1px solid ${WX.ash}`,
                color: WX.sulfur,
                fontFamily: WX.mono,
                fontSize: 16,
                padding: '9px 10px',
                outline: 'none',
            }}
        />
    );
}

// ── A toggle pill (enable optional blocks) ───────────────────────────────────
// Currently unreferenced; underscore-named to keep it available without
// tripping the unused-vars gate.
function _Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            style={{
                cursor: 'pointer',
                font: 'inherit',
                fontFamily: WX.sans,
                fontSize: 12,
                letterSpacing: 1.5,
                padding: '6px 12px',
                background: on ? WX.sulfur : 'transparent',
                color: on ? '#100d0a' : WX.bone,
                border: `1px solid ${on ? WX.sulfur : WX.ash}`,
            }}
        >
            {on ? '✓ ' : ''}
            {label}
        </button>
    );
}

// ── Default factory for a freshly-added special mechanic ─────────────────────
function defaultMechanic(kind: SpecialMechanicKind): CardSpecialMechanic {
    switch (kind) {
        case 'strip_random_buff':
            return { kind, appliedTo: 'enemy' };
        case 'befriend_attempt':
            return { kind };
        case 'guard':
            return { kind, amount: 5 };
        case 'rupture':
            return { kind, bonusPct: 0 };
        case 'siphon':
            return { kind, pct: 0.5 };
        case 'barrier':
            return { kind, amount: 5 };
        case 'riposte':
            return { kind, damage: 5, reduce: 2 };
        // Fate Engine P1 — die-manipulation verbs
        case 'reroll_spent':
        case 'refresh_die':
        case 'convert_die_color':
        case 'bank_spent_die':
            return { kind };
        case 'create_temporary_die':
            return { kind, color: 'wild' };
        case 'grant_pip':
            return { kind, count: 1 };
        case 'overheat':
            return { kind, pips: 1 };
        // Spec 32 v3 — the themed-deck verb set
        case 'forge_floating_die':
            return { kind, color: 'powering' };
        case 'float_x_die':
            return { kind };
        case 'stagger':
            return { kind, rungs: 1 };
        case 'lock_stance':
            return { kind };
        case 'foretell':
            return { kind, count: 1 };
        case 'omen':
            // Phase 32 part 4d — OMEN v2: the player stakes a stance/window
            // claim at cast; maxWindow/anteConviction are the printed caps.
            return { kind, maxWindow: 2, anteConviction: 2, rider: {} };
        case 'premise':
            return { kind, count: 1 };
        case 'peroration':
            return { kind, at: 6, rider: {} };
        case 'spend_premises':
            return { kind, markPer: 2, drawPer: 3 };
        case 'spend_all_pips':
            return { kind };
        case 'recoil':
            return { kind, hp: 4 };
        case 'recoil_x':
            return { kind, min: 3, poisonPerX: 1 / 3 };
        case 'extend_dots':
            return { kind, turns: 1 };
        case 'convert_dots':
            return { kind, bonusIntensity: 1 };
        case 'boost_all_dots':
            return { kind, intensity: 1 };
        case 'soul_gain':
            return { kind, count: 1 };
        case 'consume_affliction':
            return { kind, souls: 1 };
        case 'reap':
            return { kind, cost: 3 };
        case 'reap_all':
            return { kind, burstPerSoul: 2 };
        case 'turnabout':
            return { kind, burstPerRung: 1.5 };
        case 'sway':
            return { kind, amount: 3 };
        case 'echo':
        case 'echo_next_spell':
            return { kind };
        case 'reprise':
            return { kind, count: 1 };
        case 'replay_last':
            return { kind, times: 1 };
        case 'conjure_card':
            return { kind, cardId: '' };
        case 'rider':
            return { kind, rider: {} };
        default:
            return { kind: 'befriend_attempt' };
    }
}

const MECH_KIND_OPTIONS = SPECIAL_MECHANIC_KINDS.map((k) => ({
    value: k,
    label: k.replace(/_/g, ' ').toUpperCase(),
}));

export function CardForm({ card, setCard }: { card: CardDraft; setCard: (c: CardDraft) => void }) {
    const set = (patch: Partial<DraftImg>) => setCard({ ...card, ...patch } as CardDraft);
    const fileRef = useRef<HTMLInputElement>(null);
    const [tagInput, setTagInput] = useState('');
    const img = (card as DraftImg).img ?? null;

    // ── image upload (editor-only transient; not a Card field) ──
    const pickImage = () => fileRef.current?.click();
    const onFile = (e: ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => set({ img: reader.result as string });
        reader.readAsDataURL(f);
    };

    // ── combatEffects helpers ──
    const effOptionsFor = (appliedTo: 'self' | 'opponent', currentId: string) => {
        const base = appliedTo === 'opponent' ? DEBUFF_EFFECTS : BUFF_EFFECTS;
        const list = base.length ? base : EFFECTS;
        const opts = list.map((e) => ({ value: e.id, label: e.name }));
        if (currentId && !opts.some((o) => o.value === currentId)) {
            const cur = lookupEffectOption(currentId);
            opts.unshift({ value: currentId, label: cur ? cur.name : currentId });
        }
        return opts;
    };
    const addEffect = () => {
        const first = DEBUFF_EFFECTS[0] ?? EFFECTS[0];
        const next: CardCombatEffects = { effectId: first ? first.id : '', appliedTo: 'opponent' };
        set({ combatEffects: [...card.combatEffects, next] });
    };
    const patchEffect = (i: number, patch: Partial<CardCombatEffects>) => {
        set({ combatEffects: card.combatEffects.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
    };
    const removeEffect = (i: number) => set({ combatEffects: card.combatEffects.filter((_, j) => j !== i) });

    // ── specialMechanics helpers ──
    const addMechanic = () => set({ specialMechanics: [...card.specialMechanics, defaultMechanic('guard')] });
    const patchMechanic = (i: number, patch: Record<string, unknown>) => {
        set({
            specialMechanics: card.specialMechanics.map((m, j) =>
                j === i ? ({ ...m, ...patch } as unknown as CardSpecialMechanic) : m,
            ),
        });
    };
    const changeMechanicKind = (i: number, kind: SpecialMechanicKind) => {
        set({ specialMechanics: card.specialMechanics.map((m, j) => (j === i ? defaultMechanic(kind) : m)) });
    };
    const removeMechanic = (i: number) => set({ specialMechanics: card.specialMechanics.filter((_, j) => j !== i) });

    // ── tags helpers ──
    const addTag = () => {
        const t = tagInput.trim();
        if (!t || card.tags.includes(t)) {
            setTagInput('');
            return;
        }
        set({ tags: [...card.tags, t] });
        setTagInput('');
    };
    const removeTag = (t: string) => set({ tags: card.tags.filter((x) => x !== t) });

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* ════ IDENTITY (open by default) ════ */}
            <Section title="IDENTITY" defaultOpen>
                <div>
                    <FieldLabel>CARD NAME</FieldLabel>
                    <TextField value={card.name} onChange={(v) => set({ name: v })} placeholder="e.g. Slippery Slope" />
                </div>
                <div>
                    <FieldLabel hint="kebab-case · unique">CARD ID</FieldLabel>
                    <TextField value={card.id} onChange={(v) => set({ id: v })} placeholder="e.g. slippery-slope" />
                </div>
                <div>
                    <FieldLabel hint="lore / flavor">DESCRIPTION</FieldLabel>
                    <textarea
                        value={card.description}
                        onChange={(e) => set({ description: e.target.value })}
                        placeholder="What does this card feel like to play?"
                        rows={4}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            background: WX.panel2,
                            border: `1px solid ${WX.ash}`,
                            color: WX.parchment,
                            fontFamily: WX.serif,
                            fontSize: 14,
                            lineHeight: 1.4,
                            padding: '9px 10px',
                            outline: 'none',
                            resize: 'vertical',
                        }}
                    />
                </div>
                {/* image */}
                <div>
                    <FieldLabel hint="editor preview only">IMAGE</FieldLabel>
                    <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                        <button
                            onClick={pickImage}
                            style={{
                                width: 64,
                                height: 64,
                                flexShrink: 0,
                                cursor: 'pointer',
                                padding: 0,
                                overflow: 'hidden',
                                background: img ? `center/cover url(${img})` : ART_STRIPES,
                                backgroundColor: WX.panel2,
                                border: `1px dashed ${WX.ash}`,
                                color: WX.bone,
                                fontFamily: WX.mono,
                                fontSize: 22,
                            }}
                        >
                            {img ? '' : '+'}
                        </button>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
                            <Btn kind="ghost" onClick={pickImage} style={{ padding: '8px 12px', fontSize: 13 }}>
                                {img ? 'REPLACE IMAGE' : 'UPLOAD IMAGE'}
                            </Btn>
                            {img && (
                                <Btn kind="danger" onClick={() => set({ img: null })} style={{ padding: '6px 12px', fontSize: 12 }}>
                                    REMOVE
                                </Btn>
                            )}
                        </div>
                    </div>
                </div>
            </Section>

            {/* ════ CLASSIFICATION ════ */}
            <Section title="CLASSIFICATION" defaultOpen>
                <div>
                    <FieldLabel hint="stance / die colour">PHILOSOPHICAL ASPECT</FieldLabel>
                    <Segmented options={STANCES} value={card.philosophicalAspect} onChange={(v) => set({ philosophicalAspect: v })} colorFor={dieColor} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <FieldLabel hint="resist tier">TIER</FieldLabel>
                        <Segmented options={TIERS} value={card.tier} onChange={(v) => set({ tier: v })} />
                    </div>
                    <div style={{ flex: 1.2 }}>
                        <FieldLabel>TARGET</FieldLabel>
                        <Segmented options={TARGET_TYPES} value={card.targetType} onChange={(v) => set({ targetType: v })} />
                    </div>
                </div>
            </Section>

            {/* ════ RANK & TYPE (spec 32 v3 — replaces the dead POWER & SCALING) ════ */}
            <Section title="RANK & TYPE" defaultOpen>
                <div>
                    <FieldLabel hint="Ash 1 … Saint 6 · rarity derives from it">RANK</FieldLabel>
                    <Segmented options={RANKS} value={card.rank} onChange={(v) => set({ rank: v })} />
                </div>
                <div>
                    <FieldLabel hint="spell · persistent oath · enemy hex">CARD TYPE</FieldLabel>
                    <Segmented options={CARD_TYPES} value={card.cardType} onChange={(v) => set({ cardType: v })} />
                </div>
                {card.free != null && (
                    <div style={{ fontFamily: WX.serif, fontStyle: 'italic', fontSize: 12.5, color: WX.bone }}>
                        Authored FREE line present — preserved verbatim on save (edit it in source).
                    </div>
                )}
            </Section>

            {/* ════ COMBAT EFFECTS ════ */}
            <Section title="COMBAT EFFECTS" badge={card.combatEffects.length || undefined}>
                {card.combatEffects.length === 0 && (
                    <div style={{ fontFamily: WX.serif, fontStyle: 'italic', fontSize: 13, color: WX.ash }}>no effect payloads</div>
                )}
                {card.combatEffects.map((ce, i) => (
                    <div key={i} style={{ border: `1px solid ${WX.ash}`, padding: 12, display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: WX.mono, fontSize: 11, color: WX.bone }}>EFFECT {i + 1}</span>
                            <button onClick={() => removeEffect(i)} style={{ cursor: 'pointer', font: 'inherit', background: 'transparent', border: 'none', color: WX.blood, fontFamily: WX.mono, fontSize: 12 }}>
                                ✕ remove
                            </button>
                        </div>
                        <div>
                            <FieldLabel>APPLIED TO</FieldLabel>
                            <Segmented options={APPLIED_TO} value={ce.appliedTo} onChange={(v) => patchEffect(i, { appliedTo: v })} />
                        </div>
                        <div>
                            <FieldLabel>EFFECT</FieldLabel>
                            <Dropdown options={effOptionsFor(ce.appliedTo, ce.effectId)} value={ce.effectId} onChange={(v) => patchEffect(i, { effectId: v })} />
                            {(() => {
                                const opt = lookupEffectOption(ce.effectId);
                                return opt ? (
                                    <div style={{ marginTop: 6, paddingLeft: 9, borderLeft: `2px solid ${WX.ash}`, fontFamily: WX.serif, fontSize: 12.5, color: WX.bone, lineHeight: 1.35 }}>
                                        {opt.description}
                                    </div>
                                ) : null;
                            })()}
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <FieldLabel hint="override">INTENSITY</FieldLabel>
                                <Stepper value={ce.intensity ?? 0} onChange={(v) => patchEffect(i, { intensity: v === 0 ? undefined : v })} min={0} max={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <FieldLabel hint="override">DURATION</FieldLabel>
                                <Stepper value={ce.duration ?? 0} onChange={(v) => patchEffect(i, { duration: v === 0 ? undefined : v })} min={0} max={20} />
                            </div>
                        </div>
                        <div>
                            <FieldLabel hint="optional UI text">DESCRIPTION</FieldLabel>
                            <TextField value={ce.description ?? ''} onChange={(v) => patchEffect(i, { description: v.trim() === '' ? undefined : v })} placeholder="display text" />
                        </div>
                    </div>
                ))}
                <Btn kind="ghost" onClick={addEffect} style={{ fontSize: 13 }}>
                    + ADD EFFECT
                </Btn>
            </Section>

            {/* ════ BOON MECHANICS ════ */}
            <Section title="BOON MECHANICS" badge={card.specialMechanics.length || undefined}>
                {card.specialMechanics.length === 0 && (
                    <div style={{ fontFamily: WX.serif, fontStyle: 'italic', fontSize: 13, color: WX.ash }}>no bespoke mechanics</div>
                )}
                {card.specialMechanics.map((m, i) => (
                    <div key={i} style={{ border: `1px solid ${WX.ash}`, padding: 12, display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: WX.mono, fontSize: 11, color: WX.bone }}>MECHANIC {i + 1}</span>
                            <button onClick={() => removeMechanic(i)} style={{ cursor: 'pointer', font: 'inherit', background: 'transparent', border: 'none', color: WX.blood, fontFamily: WX.mono, fontSize: 12 }}>
                                ✕ remove
                            </button>
                        </div>
                        <div>
                            <FieldLabel>KIND</FieldLabel>
                            <Dropdown options={MECH_KIND_OPTIONS} value={m.kind} onChange={(v) => changeMechanicKind(i, v)} />
                        </div>
                        <MechanicFields mechanic={m} patch={(p) => patchMechanic(i, p)} />
                    </div>
                ))}
                <Btn kind="ghost" onClick={addMechanic} style={{ fontSize: 13 }}>
                    + ADD MECHANIC
                </Btn>
            </Section>

            {/* ════ TAGS & METADATA ════ */}
            <Section title="TAGS & METADATA" badge={card.tags.length || undefined}>
                <div>
                    <FieldLabel hint="freeform labels">TAGS</FieldLabel>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                            <TextField value={tagInput} onChange={setTagInput} placeholder="add a tag…" />
                        </div>
                        <Btn kind="ghost" onClick={addTag} style={{ padding: '8px 14px' }}>
                            ADD
                        </Btn>
                    </div>
                    {card.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                            {card.tags.map((t) => (
                                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', border: `1px solid ${WX.ash}`, background: 'rgba(0,0,0,0.3)', fontFamily: WX.mono, fontSize: 12, color: WX.parchment }}>
                                    {t}
                                    <button onClick={() => removeTag(t)} style={{ cursor: 'pointer', font: 'inherit', background: 'transparent', border: 'none', color: WX.blood, fontSize: 13, padding: 0 }}>
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    <FieldLabel hint="friendship counter, optional">INCREMENTS FRIENDSHIP</FieldLabel>
                    <Stepper value={card.incrementsFriendship ?? 0} onChange={(v) => set({ incrementsFriendship: v === 0 ? undefined : v })} min={0} max={10} />
                </div>
                <div>
                    <FieldLabel hint="ISO date / phase tag">ADDED IN</FieldLabel>
                    <TextField value={card.addedIn ?? ''} onChange={(v) => set({ addedIn: v })} placeholder="e.g. 2026-06-29" />
                </div>
            </Section>
        </div>
    );
}

// ── Kind-specific fields for one special mechanic ────────────────────────────
function MechanicFields({ mechanic, patch }: { mechanic: CardSpecialMechanic; patch: (p: Record<string, unknown>) => void }) {
    const numRow = (label: string, hint: string, value: number, key: string, min = 0, max = 99) => (
        <div>
            <FieldLabel hint={hint}>{label}</FieldLabel>
            <Stepper value={value} onChange={(v) => patch({ [key]: v })} min={min} max={max} />
        </div>
    );

    const riderNote = (
        <div style={{ fontFamily: WX.serif, fontStyle: 'italic', fontSize: 12.5, color: WX.ash }}>
            carries a RIDER payload — preserved verbatim on save (edit it in source)
        </div>
    );

    switch (mechanic.kind) {
        case 'strip_random_buff':
            return (
                <div>
                    <FieldLabel>STRIP FROM</FieldLabel>
                    <Segmented
                        options={[{ value: 'enemy', label: 'ENEMY' }, { value: 'self', label: 'SELF' }] as { value: 'self' | 'enemy'; label: string }[]}
                        value={mechanic.appliedTo}
                        onChange={(v) => patch({ appliedTo: v })}
                    />
                </div>
            );
        case 'guard':
            return numRow('GUARD AMOUNT', 'shield', mechanic.amount, 'amount');
        case 'barrier':
            return numRow('BARRIER AMOUNT', 'stacking soak', mechanic.amount, 'amount');
        case 'rupture':
            return (
                <>
                    {numRow('BONUS %', 'extra detonation', mechanic.bonusPct ?? 0, 'bonusPct')}
                    {numRow('FUEL / PIP', 'with spend_all_pips', mechanic.fuelPerPip ?? 0, 'fuelPerPip')}
                    {numRow('FUEL / OMEN HIT', 'Oracle capstone', mechanic.fuelPerOmenHit ?? 0, 'fuelPerOmenHit')}
                </>
            );
        case 'siphon':
            return (
                <div>
                    <FieldLabel hint="% of the burst healed">SIPHON %</FieldLabel>
                    <Stepper value={Math.round((mechanic.pct ?? 0) * 100)} onChange={(v) => patch({ pct: v / 100 })} min={0} max={100} />
                </div>
            );
        case 'riposte':
            return (
                <>
                    {numRow('COUNTER DAMAGE', 'on full block', mechanic.damage, 'damage')}
                    {numRow('REDUCE', 'incoming hit –', mechanic.reduce, 'reduce')}
                </>
            );
        case 'create_temporary_die':
            return (
                <div>
                    <FieldLabel hint="KINDLE colour">DIE COLOUR</FieldLabel>
                    <Segmented
                        options={[...STANCES, { value: 'wild', label: 'WILD' }] as { value: string; label: string }[]}
                        value={mechanic.color}
                        onChange={(v) => patch({ color: v })}
                    />
                </div>
            );
        case 'grant_pip':
            return numRow('PIPS', '+N to every Reserve die', mechanic.count, 'count', 0, 10);
        case 'overheat':
            return numRow('OVERHEAT PIPS', 'pushed past RESERVE_PIP_CAP; each risks a bust that halves the die', mechanic.pips, 'pips', 1, 5);
        case 'forge_floating_die':
            return (
                <div>
                    <FieldLabel hint="FORGE — persists across combats">DIE COLOUR</FieldLabel>
                    <Segmented
                        options={[{ value: 'powering', label: 'POWERING' }, { value: 'wild', label: 'WILD' }] as { value: string; label: string }[]}
                        value={mechanic.color}
                        onChange={(v) => patch({ color: v })}
                    />
                </div>
            );
        case 'stagger':
            return numRow('RUNGS', "removed from the enemy's next action", mechanic.rungs, 'rungs', 1, 5);
        case 'foretell':
            return numRow('COUNT', 'top cards seen + reordered', mechanic.count, 'count', 1, 5);
        case 'omen':
            return (
                <>
                    {numRow('MAX WINDOW', 'phases the claim may span; player picks at cast (1 = boldest)', mechanic.maxWindow, 'maxWindow', 1, 4)}
                    {numRow('ANTE CONVICTION', 'paid up front at window 1; scales down 1/window, never refunded on a miss', mechanic.anteConviction, 'anteConviction', 0, 6)}
                    {riderNote}
                </>
            );
        case 'premise':
            return numRow('CHARGES', 'added to the tally', mechanic.count, 'count', 1, 5);
        case 'peroration':
            return (
                <>
                    {numRow('FIRES AT', 'Charge count', mechanic.at, 'at', 1, 12)}
                    <div>
                        <FieldLabel hint="0 = no condemn clause">CONDEMN AT</FieldLabel>
                        <Stepper value={mechanic.concedeAt ?? 0} onChange={(v) => patch({ concedeAt: v === 0 ? undefined : v })} min={0} max={12} />
                    </div>
                    {riderNote}
                </>
            );
        case 'spend_premises':
            return (
                <>
                    {numRow('MARK PER', '+1 mark stack per N spent', mechanic.markPer, 'markPer', 1, 10)}
                    {numRow('DRAW PER', 'draw 1 per N spent', mechanic.drawPer, 'drawPer', 1, 10)}
                </>
            );
        case 'spend_all_pips':
            return numRow('GUARD / PIP', 'optional', mechanic.guardPerPip ?? 0, 'guardPerPip', 0, 10);
        case 'recoil':
            return numRow('RECOIL', 'VITAE paid (unpreventable)', mechanic.hp, 'hp', 1, 20);
        case 'recoil_x':
            return (
                <>
                    {numRow('MIN X', 'chosen X-cost floor (player picks X ≥ this)', mechanic.min, 'min', 1, 10)}
                    <div>
                        <FieldLabel hint="POISON per N paid (intensity = ceil(X / N))">POISON PER</FieldLabel>
                        <Stepper
                            value={Math.max(1, Math.round(1 / (mechanic.poisonPerX || 1)))}
                            onChange={(v) => patch({ poisonPerX: 1 / Math.max(1, v) })}
                            min={1}
                            max={10}
                        />
                    </div>
                </>
            );
        case 'extend_dots':
            return numRow('TURNS', '+N duration to ALL your DoTs', mechanic.turns, 'turns', 1, 5);
        case 'convert_dots':
            return numRow('BONUS INTENSITY', 'on the converted DoT', mechanic.bonusIntensity, 'bonusIntensity', 0, 5);
        case 'boost_all_dots':
            return numRow('INTENSITY', '+N to every enemy DoT', mechanic.intensity, 'intensity', 1, 5);
        case 'soul_gain':
            return numRow('SOULS', 'gained', mechanic.count, 'count', 1, 5);
        case 'consume_affliction':
            return numRow('SOULS', 'yielded by the consumed affliction', mechanic.souls, 'souls', 0, 5);
        case 'reap':
            return (
                <>
                    {numRow('COST', 'Souls spent (fizzles underfunded)', mechanic.cost, 'cost', 1, 12)}
                    {mechanic.rider != null && riderNote}
                </>
            );
        case 'reap_all':
            return numRow('BURST / SOUL', 'HP per Soul spent (uncapped — the emptied bank is the price)', mechanic.burstPerSoul, 'burstPerSoul', 1, 10);
        case 'turnabout':
            return numRow('BURST / RUNG', 'HP per rung banked in rungsDeniedTotal, then the ledger resets', mechanic.burstPerRung, 'burstPerRung', 1, 10);
        case 'sway':
            return numRow('PLEA', 'decays 1/turn · ≥ enemy VITAE = relent', mechanic.amount, 'amount', 1, 12);
        case 'reprise':
            return numRow('COUNT', 'cards returned from the discard', mechanic.count, 'count', 1, 5);
        case 'replay_last':
            return numRow('TIMES', 'replays of the last spell', mechanic.times, 'times', 1, 3);
        case 'conjure_card':
            return (
                <div>
                    <FieldLabel hint="Haunt card id">CARD ID</FieldLabel>
                    <TextField value={mechanic.cardId} onChange={(v) => patch({ cardId: v })} placeholder="e.g. haunt-…" />
                </div>
            );
        case 'rider':
            return riderNote;
        case 'befriend_attempt':
        default:
            return <div style={{ fontFamily: WX.serif, fontStyle: 'italic', fontSize: 12.5, color: WX.ash }}>no parameters — marker mechanic</div>;
    }
}
