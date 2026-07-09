/**
 * EditTab — browse / search / filter the REAL card library (typed `Card[]`),
 * tap a card to load it into the shared CardForm, then UPDATE / DUPLICATE /
 * DELETE. Rarity is the spec 32 v3 band (common / uncommon / rare), derived
 * from the card's `rank` ladder.
 */
import { useMemo, useState } from 'react';
import { toDraft, type CardDraft } from '../../types';
import { rarityOf, type Card } from '../../data/mechanics';
import { WX, RARITY, type RarityKey } from '../../theme/wx';
import { CardFace } from '../CardFace';
import { CardForm } from '../CardForm';
import { Btn } from '../form';

type RarFilter = 'all' | RarityKey;

function FilterChip({
    label,
    active,
    color,
    count,
    onClick,
}: {
    label: string;
    active: boolean;
    color?: string;
    count?: number;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                cursor: 'pointer',
                font: 'inherit',
                padding: '5px 11px',
                fontFamily: WX.sans,
                fontSize: 13,
                letterSpacing: 1.5,
                background: active ? color ?? WX.sulfur : 'transparent',
                color: active ? '#100d0a' : color ?? WX.bone,
                border: `1px solid ${active ? color ?? WX.sulfur : WX.ash}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
            }}
        >
            {label}
            {count != null && <span style={{ fontFamily: WX.mono, fontSize: 10, opacity: 0.8 }}>{count}</span>}
        </button>
    );
}

function LibThumb({ card, selected, onClick }: { card: Card; selected: boolean; onClick: () => void }) {
    const rar: RarityKey = rarityOf(card);
    return (
        <button
            onClick={onClick}
            style={{
                cursor: 'pointer',
                font: 'inherit',
                padding: 6,
                textAlign: 'left',
                background: selected ? 'rgba(212,192,38,0.08)' : 'transparent',
                border: `1px solid ${selected ? WX.sulfur : 'transparent'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
            }}
        >
            <CardFace card={toDraft(card)} width={96} height={134} />
            <div style={{ fontFamily: WX.serif, fontSize: 11, lineHeight: 1.1, color: WX.parchment, textAlign: 'center', maxWidth: 96, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {card.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: RARITY[rar].color, display: 'inline-block' }} />
                <span style={{ fontFamily: WX.sans, fontSize: 9, letterSpacing: 1, color: WX.bone }}>{RARITY[rar].label}</span>
            </div>
        </button>
    );
}

export function EditTab({
    library,
    draft,
    setDraft,
    selectedId,
    onSelect,
    onUpdate,
    onDuplicate,
    onDelete,
    onNew,
}: {
    library: Card[];
    draft: CardDraft;
    setDraft: (d: CardDraft) => void;
    selectedId: string | null;
    onSelect: (card: Card) => void;
    onUpdate: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onNew: () => void;
}) {
    const [q, setQ] = useState('');
    const [rarFilter, setRarFilter] = useState<RarFilter>('all');

    const counts = useMemo(() => {
        const c = { all: library.length, common: 0, uncommon: 0, rare: 0 };
        for (const s of library) c[rarityOf(s)] += 1;
        return c;
    }, [library]);

    const filtered = library.filter((s) => {
        if (rarFilter !== 'all' && rarityOf(s) !== rarFilter) return false;
        if (q.trim() && !s.name.toLowerCase().includes(q.trim().toLowerCase())) return false;
        return true;
    });

    const editing = selectedId != null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* search */}
            <div style={{ position: 'relative' }}>
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by name…"
                    style={{ width: '100%', boxSizing: 'border-box', background: WX.panel2, border: `1px solid ${WX.ash}`, color: WX.parchment, fontFamily: WX.serif, fontSize: 15, padding: '9px 10px 9px 32px', outline: 'none' }}
                />
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: WX.bone, fontSize: 13 }}>⌕</span>
            </div>

            {/* rarity filter chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <FilterChip label="ALL" active={rarFilter === 'all'} count={counts.all} onClick={() => setRarFilter('all')} />
                <FilterChip label="COMMON" active={rarFilter === 'common'} color={RARITY.common.color} count={counts.common} onClick={() => setRarFilter('common')} />
                <FilterChip label="UNCOMMON" active={rarFilter === 'uncommon'} color={RARITY.uncommon.color} count={counts.uncommon} onClick={() => setRarFilter('uncommon')} />
                <FilterChip label="RARE" active={rarFilter === 'rare'} color={RARITY.rare.color} count={counts.rare} onClick={() => setRarFilter('rare')} />
            </div>

            {/* library grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))',
                    gap: 4,
                    maxHeight: editing ? 230 : undefined,
                    overflowY: editing ? 'auto' : 'visible',
                    border: `1px solid ${WX.ashLine}`,
                    padding: 6,
                    background: 'rgba(0,0,0,0.25)',
                }}
            >
                {filtered.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 24, fontFamily: WX.serif, fontStyle: 'italic', color: WX.ash }}>no cards match</div>
                )}
                {filtered.map((s) => (
                    <LibThumb key={s.id} card={s} selected={s.id === selectedId} onClick={() => onSelect(s)} />
                ))}
            </div>

            {/* editor panel */}
            {editing ? (
                <div style={{ borderTop: `1px solid ${WX.ashLine}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: WX.gothic, fontSize: 22, color: WX.parchment }}>Editing</span>
                        <button onClick={onNew} style={{ cursor: 'pointer', font: 'inherit', background: 'transparent', border: 'none', fontFamily: WX.mono, fontSize: 12, color: WX.bone, textDecoration: 'underline' }}>
                            ✕ close
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                        <CardFace card={draft} width={180} height={252} />
                    </div>
                    <CardForm card={draft} setCard={setDraft} />

                    <div style={{ display: 'flex', gap: 8, position: 'sticky', bottom: -16, paddingTop: 14, paddingBottom: 4, background: `linear-gradient(transparent, ${WX.bg} 32%)` }}>
                        <Btn onClick={onUpdate} style={{ flex: 2, padding: '13px', fontSize: 16 }}>
                            ✠ UPDATE CARD
                        </Btn>
                        <Btn kind="ghost" onClick={onDuplicate} style={{ flex: 1, padding: '13px' }}>
                            DUPLICATE
                        </Btn>
                    </div>
                    <Btn kind="danger" onClick={onDelete} style={{ padding: '9px', fontSize: 12 }}>
                        DELETE CARD
                    </Btn>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '8px 0 4px', fontFamily: WX.serif, fontStyle: 'italic', fontSize: 13, color: WX.bone }}>tap a card to edit it</div>
            )}
        </div>
    );
}
