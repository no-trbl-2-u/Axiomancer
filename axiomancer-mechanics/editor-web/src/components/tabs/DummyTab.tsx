/**
 * DummyTab — a self-contained practice-dummy combat sandbox. Pick a card from
 * the REAL library, play its FREE (no-die) or PAID (powered) effect at a
 * training dummy, let the dummy respond, and watch a running action log.
 *
 * The dummy speaks the editor's display-keyword vocabulary (see `theme/wx`);
 * each real card is projected to free/paid keywords via `projectFace`.
 */
import { useEffect, useRef, useState } from 'react';
import { toDraft } from '../../types';
import type { Card } from '../../data/mechanics';
import { CardFace, DiePip, KwGlyph, projectFace } from '../CardFace';
import { WX, WX_NOISE, DIE, KEYWORDS, fmtVal, kwLine, type KeywordMeta } from '../../theme/wx';
import { Btn } from '../form';

const DUMMY_MAX = 100;
const PLAYER_MAX = 50;
const PER_STACK: Record<string, number> = { bleed: 3, poison: 2, dot: 2 };

type Tone = 'dmg' | 'buff' | 'ctrl' | 'enemy' | 'head' | 'info';
interface LogLine {
    t: string;
    tone: Tone;
}
interface Dot {
    kw: string;
    stacks: number;
}
interface Control {
    kw: string;
    turns: number;
}
interface PlayerState {
    hp: number;
    guard: boolean;
    barrier: number;
    regen: number;
    poison: number;
    riposte: boolean;
}
interface DummyState {
    dummyHp: number;
    dots: Dot[];
    controls: Control[];
    player: PlayerState;
    log: LogLine[];
    phase: 'player' | 'dummy';
}

function freshDummyState(): DummyState {
    return {
        dummyHp: DUMMY_MAX,
        dots: [],
        controls: [],
        player: { hp: PLAYER_MAX, guard: false, barrier: 0, regen: 0, poison: 0, riposte: false },
        log: [{ t: 'Dummy initialized at 100 HP. Play a card.', tone: 'info' }],
        phase: 'player',
    };
}

const kwMeta = (kw: string): KeywordMeta | undefined => (KEYWORDS as Record<string, KeywordMeta>)[kw];

/** Apply one keyword to a mutable working copy of state; returns log lines. */
function applyKeyword(S: DummyState, kwId: string, val: number): LogLine[] {
    const m = kwMeta(kwId);
    const lines: LogLine[] = [];
    const push = (t: string, tone: Tone = 'info') => lines.push({ t, tone });
    const dealDummy = (n: number) => {
        S.dummyHp = Math.max(0, S.dummyHp - n);
    };
    const healPlayer = (n: number) => {
        S.player.hp = Math.min(PLAYER_MAX, S.player.hp + n);
    };
    const distinct = () => new Set([...S.dots.map((d) => d.kw), ...S.controls.map((c) => c.kw)]).size;
    const totalDot = () => S.dots.reduce((a, d) => a + d.stacks, 0);
    const addDot = (kw: string, n: number) => {
        const e = S.dots.find((d) => d.kw === kw);
        if (e) e.stacks += n;
        else S.dots.push({ kw, stacks: n });
    };
    const addControl = (kw: string, turns: number) => {
        const e = S.controls.find((c) => c.kw === kw);
        if (e) e.turns = Math.max(e.turns, turns);
        else S.controls.push({ kw, turns });
    };

    switch (kwId) {
        case 'damage':
            dealDummy(val);
            push(`Dealt ${val} damage.`, 'dmg');
            break;
        case 'compound': {
            const d = distinct();
            const bonus = d * 2;
            const total = val + bonus;
            dealDummy(total);
            push(`Compound: ${val} + ${bonus} (${d} debuff${d !== 1 ? 's' : ''}) = ${total} damage.`, 'dmg');
            break;
        }
        case 'bleed':
            addDot('bleed', val);
            push(`Applied Bleed ×${val}.`, 'dmg');
            break;
        case 'poison':
            addDot('poison', val);
            push(`Applied Poison ×${val}.`, 'dmg');
            break;
        case 'dot':
            addDot('dot', val);
            push(`Applied DoT ×${val}.`, 'dmg');
            break;
        case 'rupture': {
            const s = totalDot();
            if (s === 0) {
                push('Rupture: no DoT stacks to consume.', 'info');
                break;
            }
            const burst = s * 4;
            S.dots = [];
            dealDummy(burst);
            push(`Ruptured ${s} DoT stack${s !== 1 ? 's' : ''} → ${burst} burst damage.`, 'dmg');
            break;
        }
        case 'execute': {
            const crit = S.dummyHp <= 30 || totalDot() >= 2;
            const dmg = val * (crit ? 2 : 1);
            dealDummy(dmg);
            push(`Execute${crit ? ' — CRIT' : ''}: ${dmg} damage.`, 'dmg');
            break;
        }
        case 'guard':
            S.player.guard = true;
            push('Gained Guard — absorbs the next hit.', 'buff');
            break;
        case 'barrier':
            S.player.barrier += val;
            push(`Gained Barrier ${val}.`, 'buff');
            break;
        case 'regen':
            S.player.regen += val;
            push(`Gained Regen ×${val}.`, 'buff');
            break;
        case 'riposte':
            S.player.riposte = true;
            push('Riposte ready — will parry + counter.', 'buff');
            break;
        case 'heal_self':
            healPlayer(val);
            push(`Healed ${val} HP.`, 'buff');
            break;
        case 'siphon': {
            const base = Math.max(4, Math.round(val / 5));
            dealDummy(base);
            const heal = Math.round((base * val) / 100);
            healPlayer(heal);
            push(`Siphon: ${base} damage, healed ${heal} HP (${val}%).`, 'dmg');
            break;
        }
        case 'strip_buff':
            push('Strip Buff: dummy has no buffs to remove.', 'info');
            break;
        case 'stun':
        case 'slow':
        case 'confusion':
        case 'silence':
        case 'control':
            addControl(kwId, val);
            push(`Applied ${m ? m.label : kwId} (${val} turn${val !== 1 ? 's' : ''}).`, 'ctrl');
            break;
        default:
            push(`Applied ${m ? m.label : kwId}.`, 'info');
    }
    return lines;
}

// ── status chips ──
function DummyEffectChip({ kw, stacks, turns }: { kw: string; stacks?: number; turns?: number }) {
    const m = kwMeta(kw);
    const isDot = stacks != null;
    const color = isDot ? WX.blood : WX.sulfur;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 6px', border: `1px solid ${color}`, background: 'rgba(0,0,0,0.4)', fontFamily: WX.mono, fontSize: 11, color }}>
            <KwGlyph id={kw} size={12} color={color} />
            {m ? m.label : kw} {isDot ? `×${stacks}` : `${turns}t`}
        </span>
    );
}

function PlayerBuffChip({ label, color }: { label: string; color: string }) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 6px', border: `1px solid ${color}`, background: 'rgba(0,0,0,0.4)', fontFamily: WX.mono, fontSize: 11, color }}>{label}</span>;
}

function DummyPortrait({ hurt }: { hurt: boolean }) {
    const c = hurt ? WX.blood : WX.bone;
    return (
        <svg viewBox="0 0 80 96" width="72" height="86" style={{ display: 'block' }}>
            <rect x="36" y="20" width="8" height="70" fill="#1a1510" stroke={WX.ash} strokeWidth="1.5" />
            <rect x="14" y="40" width="52" height="7" fill="#1a1510" stroke={WX.ash} strokeWidth="1.5" />
            <ellipse cx="40" cy="20" rx="14" ry="15" fill="#241d14" stroke={c} strokeWidth="1.6" />
            <path d="M30 16 q4 4 0 8 M50 16 q-4 4 0 8" stroke={c} strokeWidth="1.4" fill="none" />
            <path d="M34 27 l3 2 l3 -2 l3 2 l3 -2" stroke={c} strokeWidth="1.2" fill="none" />
            <ellipse cx="40" cy="62" rx="20" ry="22" fill="#241d14" stroke={WX.ash} strokeWidth="1.5" />
            <ellipse cx="40" cy="62" rx="13" ry="15" fill="none" stroke={c} strokeWidth="1.3" opacity="0.8" />
            <ellipse cx="40" cy="62" rx="6" ry="7" fill="none" stroke={c} strokeWidth="1.3" />
            <circle cx="40" cy="62" r="2.2" fill={c} />
        </svg>
    );
}

export function DummyTab({
    library,
    selectedCardId,
    setSelectedCardId,
}: {
    library: Card[];
    selectedCardId: string | null;
    setSelectedCardId: (id: string) => void;
}) {
    const [S, setS] = useState<DummyState>(freshDummyState);
    const logRef = useRef<HTMLDivElement>(null);

    const selected = library.find((c) => c.id === selectedCardId) ?? library[0] ?? null;
    const face = selected ? projectFace(toDraft(selected)) : null;

    useEffect(() => {
        if (!selectedCardId && library[0]) setSelectedCardId(library[0].id);
    }, [library, selectedCardId, setSelectedCardId]);

    const commit = (mutator: (s: DummyState) => LogLine[], banner: string) => {
        setS((prev) => {
            const S2: DummyState = structuredClone(prev);
            const lines = mutator(S2);
            const all = banner ? [{ t: banner, tone: 'head' as Tone }, ...lines] : lines;
            S2.log = [...all.reverse(), ...S2.log];
            if (S2.dummyHp <= 0 && prev.dummyHp > 0) S2.log = [{ t: '✠ Dummy destroyed.', tone: 'head' }, ...S2.log];
            S2.phase = 'dummy';
            return S2;
        });
    };

    const playCard = (powered: boolean) => {
        if (!selected || !face) return;
        const kw = powered ? face.paidKw : face.freeKw;
        const val = powered ? face.paidVal : face.freeVal;
        const label = powered ? `▶ Played PAID · ${selected.name} (${DIE[face.die].label} die)` : `▶ Played FREE · ${selected.name}`;
        commit((S2) => applyKeyword(S2, kw, val), label);
    };

    const dummyAct = (type: 'wait' | 'hit' | 'poison') => {
        setS((prev) => {
            const S2: DummyState = structuredClone(prev);
            const lines: LogLine[] = [];
            const push = (t: string, tone: Tone = 'enemy') => lines.push({ t, tone });
            const stunned = S2.controls.some((c) => c.kw === 'stun' || c.kw === 'control');

            if (type === 'wait') push('Dummy waits.', 'info');
            if (type === 'hit') {
                if (stunned) push('Dummy is STUNNED — its strike fizzles.', 'ctrl');
                else {
                    let dmg = 2;
                    if (S2.player.riposte) {
                        push('Riposte! Parried and countered for 5.', 'buff');
                        S2.dummyHp = Math.max(0, S2.dummyHp - 5);
                        S2.player.riposte = false;
                        dmg = 0;
                    }
                    if (dmg > 0 && S2.player.guard) {
                        push('Guard absorbed the hit.', 'buff');
                        S2.player.guard = false;
                        dmg = 0;
                    }
                    if (dmg > 0 && S2.player.barrier > 0) {
                        const a = Math.min(S2.player.barrier, dmg);
                        S2.player.barrier -= a;
                        dmg -= a;
                        push(`Barrier absorbed ${a}.`, 'buff');
                    }
                    if (dmg > 0) {
                        S2.player.hp = Math.max(0, S2.player.hp - dmg);
                        push(`Dummy hit you for ${dmg}.`, 'enemy');
                    }
                }
            }
            if (type === 'poison') {
                if (stunned) push('Dummy is STUNNED — cannot apply poison.', 'ctrl');
                else {
                    S2.player.poison += 2;
                    push('Dummy applied Poison ×2 to you.', 'enemy');
                }
            }

            // tick dummy's own DoTs
            S2.dots = S2.dots.filter((d) => {
                const dmg = d.stacks * (PER_STACK[d.kw] || 2);
                S2.dummyHp = Math.max(0, S2.dummyHp - dmg);
                push(`${kwMeta(d.kw)?.label ?? d.kw} ticks ${dmg} on dummy.`, 'dmg');
                d.stacks -= 1;
                return d.stacks > 0;
            });
            // tick dummy controls
            S2.controls = S2.controls.filter((c) => {
                c.turns -= 1;
                if (c.turns <= 0) {
                    push(`${kwMeta(c.kw)?.label ?? c.kw} expired.`, 'info');
                    return false;
                }
                return true;
            });
            // tick player side
            if (S2.player.regen > 0) {
                const h = Math.min(S2.player.regen, PLAYER_MAX - S2.player.hp);
                S2.player.hp = Math.min(PLAYER_MAX, S2.player.hp + S2.player.regen);
                S2.player.regen -= 1;
                push(`Regen healed ${h}.`, 'buff');
            }
            if (S2.player.poison > 0) {
                S2.player.hp = Math.max(0, S2.player.hp - S2.player.poison);
                push(`Poison ticks ${S2.player.poison} on you.`, 'enemy');
                S2.player.poison -= 1;
            }

            lines.push({ t: '— dummy turn ends —', tone: 'info' });
            S2.log = [...lines.reverse(), ...S2.log];
            if (S2.dummyHp <= 0 && prev.dummyHp > 0) S2.log = [{ t: '✠ Dummy destroyed.', tone: 'head' }, ...S2.log];
            S2.phase = 'player';
            return S2;
        });
    };

    const reset = () => setS(freshDummyState());

    const dead = S.dummyHp <= 0;
    const toneColor: Record<Tone, string> = { dmg: WX.blood, buff: WX.sulfur, ctrl: '#8a6fd0', enemy: WX.rust, head: WX.parchment, info: WX.bone };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* ── dummy status ── */}
            <div style={{ background: WX.panel2, backgroundImage: WX_NOISE, border: `1px solid ${WX.ash}`, padding: 12, display: 'flex', gap: 12 }}>
                <DummyPortrait hurt={S.dummyHp < DUMMY_MAX} />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontFamily: WX.gothic, fontSize: 18, color: WX.parchment }}>Practice Dummy</span>
                        <span style={{ fontFamily: WX.mono, fontSize: 12, color: dead ? WX.ash : WX.blood }}>
                            {S.dummyHp}/{DUMMY_MAX}
                        </span>
                    </div>
                    <div>
                        <div style={{ fontFamily: WX.sans, fontSize: 10, letterSpacing: 1.5, color: WX.bone, marginBottom: 2 }}>DUMMY HP</div>
                        <div style={{ height: 12, background: '#1a1814', boxShadow: 'inset 0 0 0 1px rgba(232,223,200,0.3)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', inset: 0, width: `${(S.dummyHp / DUMMY_MAX) * 100}%`, background: WX.blood, transition: 'width .35s' }} />
                        </div>
                    </div>
                    <div>
                        <div style={{ fontFamily: WX.sans, fontSize: 9, letterSpacing: 1.5, color: WX.bone, marginBottom: 3 }}>ON DUMMY</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 22 }}>
                            {S.dots.length === 0 && S.controls.length === 0 && <span style={{ fontFamily: WX.serif, fontStyle: 'italic', fontSize: 12, color: WX.ash }}>no effects</span>}
                            {S.dots.map((d, i) => (
                                <DummyEffectChip key={'d' + i} kw={d.kw} stacks={d.stacks} />
                            ))}
                            {S.controls.map((c, i) => (
                                <DummyEffectChip key={'c' + i} kw={c.kw} turns={c.turns} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* player effects + hp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: WX.sans, fontSize: 10, letterSpacing: 1.5, color: WX.bone }}>YOU</span>
                <span style={{ fontFamily: WX.mono, fontSize: 12, color: S.player.hp <= 10 ? WX.blood : WX.parchment }}>
                    HP {S.player.hp}/{PLAYER_MAX}
                </span>
                {S.player.guard && <PlayerBuffChip label="GUARD" color={WX.sulfur} />}
                {S.player.barrier > 0 && <PlayerBuffChip label={`BARRIER ${S.player.barrier}`} color={WX.sulfur} />}
                {S.player.regen > 0 && <PlayerBuffChip label={`REGEN ×${S.player.regen}`} color={WX.sulfur} />}
                {S.player.riposte && <PlayerBuffChip label="RIPOSTE" color={WX.sulfur} />}
                {S.player.poison > 0 && <PlayerBuffChip label={`POISON ×${S.player.poison}`} color={WX.rust} />}
            </div>

            {/* ── card selector ── */}
            <div style={{ borderTop: `1px solid ${WX.ashLine}`, paddingTop: 12 }}>
                <div style={{ fontFamily: WX.sans, fontSize: 11, letterSpacing: 2, color: WX.bone, marginBottom: 8 }}>TEST CARD</div>
                {library.length === 0 ? (
                    <div style={{ fontFamily: WX.serif, fontStyle: 'italic', color: WX.ash, padding: 8 }}>No cards in the library yet — create one first.</div>
                ) : (
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                        {library.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedCardId(c.id)}
                                style={{ flex: '0 0 auto', cursor: 'pointer', font: 'inherit', padding: 3, background: 'transparent', border: `1px solid ${c.id === selected?.id ? WX.sulfur : 'transparent'}` }}
                            >
                                <CardFace card={toDraft(c)} width={70} height={98} />
                            </button>
                        ))}
                    </div>
                )}

                {selected && face && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, background: WX.panel2, border: `1px solid ${WX.ash}`, padding: '8px 10px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: WX.sans, fontSize: 9, letterSpacing: 1, color: WX.bone }}>◇ FREE</div>
                            <div style={{ fontFamily: WX.mono, fontSize: 13, color: WX.parchment }}>{kwLine(face.freeKw, face.freeVal)}</div>
                        </div>
                        <div style={{ width: 1, background: WX.ash }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <DiePip die={face.die} size={12} />
                                <span style={{ fontFamily: WX.sans, fontSize: 9, letterSpacing: 1, color: DIE[face.die].color }}>◆ PAID</span>
                            </div>
                            <div style={{ fontFamily: WX.mono, fontSize: 13, color: DIE[face.die].color }}>{kwLine(face.paidKw, face.paidVal)}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── use card ── */}
            {selected && face && !dead && (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Btn kind="ghost" onClick={() => playCard(false)} style={{ flex: 1, padding: '12px 8px', fontSize: 14 }}>
                        ◇ PLAY FREE
                    </Btn>
                    <button
                        onClick={() => playCard(true)}
                        style={{ flex: 1, padding: '12px 8px', cursor: 'pointer', font: 'inherit', fontFamily: WX.sans, fontSize: 14, letterSpacing: 1.5, background: DIE[face.die].soft, color: DIE[face.die].color, border: `1px solid ${DIE[face.die].color}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                        <DiePip die={face.die} size={13} /> PLAY PAID
                    </button>
                </div>
            )}

            {/* ── dummy's turn ── */}
            {S.phase === 'dummy' && !dead && (
                <div style={{ border: `1px solid ${WX.rust}`, background: 'rgba(158,58,26,0.08)', padding: 10 }}>
                    <div style={{ fontFamily: WX.sans, fontSize: 11, letterSpacing: 2, color: WX.rust, marginBottom: 8 }}>⚔ DUMMY'S TURN</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Btn kind="ghost" onClick={() => dummyAct('wait')} style={{ flex: 1, padding: '9px 6px', fontSize: 12 }}>
                            WAIT
                        </Btn>
                        <Btn kind="ghost" onClick={() => dummyAct('hit')} style={{ flex: 1, padding: '9px 6px', fontSize: 12 }}>
                            HIT (2 HP)
                        </Btn>
                        <Btn kind="ghost" onClick={() => dummyAct('poison')} style={{ flex: 1, padding: '9px 6px', fontSize: 12 }}>
                            APPLY 2 POISON
                        </Btn>
                    </div>
                    <div style={{ fontFamily: WX.mono, fontSize: 10, color: WX.bone, marginTop: 6 }}>each resolves immediately, then hands control back to you</div>
                </div>
            )}

            {/* ── action log ── */}
            <div style={{ borderTop: `1px solid ${WX.ashLine}`, paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: WX.sans, fontSize: 11, letterSpacing: 2, color: WX.bone }}>⚜ ACTION LOG</span>
                    <button onClick={reset} style={{ cursor: 'pointer', font: 'inherit', background: 'transparent', border: 'none', fontFamily: WX.mono, fontSize: 11, color: WX.blood, textDecoration: 'underline' }}>
                        reset dummy
                    </button>
                </div>
                <div ref={logRef} style={{ maxHeight: 180, overflowY: 'auto', background: '#06050a', border: `1px dashed ${WX.ash}`, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {S.log.map((l, i) => (
                        <div
                            key={i}
                            style={{ fontFamily: l.tone === 'head' ? WX.sans : WX.serif, fontSize: l.tone === 'head' ? 12 : 13, letterSpacing: l.tone === 'head' ? 1 : 0, color: toneColor[l.tone] || WX.bone, lineHeight: 1.3, opacity: i > 14 ? 0.5 : 1 }}
                        >
                            {l.t}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
