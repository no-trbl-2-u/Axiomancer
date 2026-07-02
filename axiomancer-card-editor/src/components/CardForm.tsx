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
    StatType,
    CardCombatEffects,
} from '@mechanics/Cards/types';
import type { CardDraft } from '../types';
import {
    CATEGORIES,
    STANCES,
    SCALING_STATS,
    TIERS,
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

const dieColor = (v: StatType) => DIE[v as DieKey].color;

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
function NumField({
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
function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
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
        case 'convert_enemy_buff_to_self':
            return { kind };
        case 'secondary_heal_self':
            return { kind, stat: 'heart', multiplier: 1 };
        case 'befriend_attempt':
            return { kind };
        case 'guard':
            return { kind, amount: 5 };
        case 'rupture':
            return { kind, bonusPct: 0 };
        case 'compound':
            return { kind, perDebuff: 3 };
        case 'siphon':
            return { kind, pct: 50 };
        case 'barrier':
            return { kind, amount: 5 };
        case 'riposte':
            return { kind, damage: 5, reduce: 2 };
        case 'execute':
            return { kind, hpPct: 30, dotStacks: 2 };
        case 'amplify':
            return { kind, multiplier: 1.5 };
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

    // ── learningRequirement helpers ──
    const lr = card.learningRequirement;
    const toggleLR = () => set({ learningRequirement: lr ? undefined : { level: 1 } });

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
                    <FieldLabel hint="⚖ fallacy · ∞ paradox">CATEGORY</FieldLabel>
                    <Segmented options={CATEGORIES} value={card.category} onChange={(v) => set({ category: v })} />
                </div>
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

            {/* ════ POWER & SCALING ════ */}
            <Section title="POWER & SCALING" defaultOpen>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <FieldLabel hint="flat magnitude">BASE POWER</FieldLabel>
                        <Stepper value={card.basePower} onChange={(v) => set({ basePower: v })} min={0} max={99} />
                    </div>
                    <div style={{ flex: 1.3 }}>
                        <FieldLabel hint="scales off">SCALING STAT</FieldLabel>
                        <Segmented options={SCALING_STATS} value={card.scalingStat} onChange={(v) => set({ scalingStat: v })} colorFor={dieColor} />
                    </div>
                </div>
                <div>
                    <FieldLabel hint="optional · ×stat term (default 1)">SCALING MULTIPLIER</FieldLabel>
                    <NumField value={card.scalingMultiplier} onChange={(v) => set({ scalingMultiplier: v })} placeholder="1" />
                </div>
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

            {/* ════ SPECIAL MECHANICS ════ */}
            <Section title="SPECIAL MECHANICS" badge={card.specialMechanics.length || undefined}>
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

            {/* ════ LEARNING REQUIREMENT ════ */}
            <Section title="LEARNING REQUIREMENT" badge={lr ? 'set' : undefined}>
                <Toggle on={!!lr} onClick={toggleLR} label={lr ? 'GATED' : 'NO REQUIREMENT'} />
                {lr && (
                    <>
                        <div>
                            <FieldLabel hint="min character level">LEVEL</FieldLabel>
                            <Stepper value={lr.level} onChange={(v) => set({ learningRequirement: { ...lr, level: v } })} min={1} max={50} />
                        </div>
                        <div>
                            <FieldLabel hint="optional stat gate">STAT REQUIREMENT</FieldLabel>
                            <Segmented
                                options={[{ value: 'none', label: 'NONE' }, ...STANCES] as { value: string; label: string }[]}
                                value={lr.statRequirementType ?? 'none'}
                                onChange={(v) =>
                                    set({
                                        learningRequirement: {
                                            ...lr,
                                            statRequirementType: v === 'none' ? undefined : (v as StatType),
                                            statRequirementValue: v === 'none' ? undefined : (lr.statRequirementValue ?? 1),
                                        },
                                    })
                                }
                            />
                        </div>
                        {lr.statRequirementType && (
                            <div>
                                <FieldLabel>STAT VALUE</FieldLabel>
                                <Stepper value={lr.statRequirementValue ?? 1} onChange={(v) => set({ learningRequirement: { ...lr, statRequirementValue: v } })} min={1} max={99} />
                            </div>
                        )}
                        <div>
                            <FieldLabel hint="card id">PREREQUISITE CARD</FieldLabel>
                            <TextField
                                value={lr.prerequisiteSkill ?? ''}
                                onChange={(v) => set({ learningRequirement: { ...lr, prerequisiteSkill: v.trim() === '' ? undefined : v } })}
                                placeholder="e.g. ad-hominem-strike"
                            />
                        </div>
                    </>
                )}
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
        case 'secondary_heal_self':
            return (
                <>
                    <div>
                        <FieldLabel>HEAL STAT</FieldLabel>
                        <Segmented options={STANCES} value={mechanic.stat} onChange={(v) => patch({ stat: v })} colorFor={dieColor} />
                    </div>
                    {numRow('MULTIPLIER', 'default 1', mechanic.multiplier ?? 1, 'multiplier', 0, 20)}
                </>
            );
        case 'guard':
            return numRow('GUARD AMOUNT', 'shield', mechanic.amount, 'amount');
        case 'barrier':
            return numRow('BARRIER AMOUNT', 'stacking soak', mechanic.amount, 'amount');
        case 'rupture':
            return numRow('BONUS %', 'extra detonation', mechanic.bonusPct ?? 0, 'bonusPct');
        case 'compound':
            return numRow('PER DEBUFF', 'HP per distinct debuff', mechanic.perDebuff, 'perDebuff');
        case 'siphon':
            return numRow('SIPHON %', '% of HP dealt', mechanic.pct, 'pct');
        case 'riposte':
            return (
                <>
                    {numRow('COUNTER DAMAGE', 'on parry', mechanic.damage, 'damage')}
                    {numRow('REDUCE', 'incoming hit –', mechanic.reduce, 'reduce')}
                </>
            );
        case 'execute':
            return (
                <>
                    {numRow('HP % THRESHOLD', 'fires at/below', mechanic.hpPct, 'hpPct')}
                    {numRow('DOT STACKS', 'or ≥ distinct DoTs', mechanic.dotStacks, 'dotStacks')}
                    {numRow('RECOIL %', 'self-damage, optional', mechanic.recoilPct ?? 0, 'recoilPct')}
                </>
            );
        case 'amplify':
            return numRow('MULTIPLIER', '× pending DoT', mechanic.multiplier, 'multiplier', 0, 20);
        case 'befriend_attempt':
        case 'convert_enemy_buff_to_self':
        default:
            return <div style={{ fontFamily: WX.serif, fontStyle: 'italic', fontSize: 12.5, color: WX.ash }}>no parameters — marker mechanic</div>;
    }
}
