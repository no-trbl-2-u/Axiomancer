/**
 * Card Workshop — the 3-tab CARD (Action) editor shell.
 *
 * Faithfully ports the zero-build prototype's app shell (header + CREATE / EDIT
 * / DUMMY tabs + toast), but the card library is backed by the REAL mechanics
 * package source (`src/Cards/cards.library.ts`) via the dev-server JSON API in
 * `src/api/cards.ts` — NOT localStorage/SEED_LIBRARY. We keep an optimistic
 * local copy for snappy UX and re-fetch from disk after every write so the UI
 * always reflects what was actually codegen'd into the file.
 *
 * Vocabulary: everything the user sees says CARD / ACTION. The literal type
 * name `Card` survives only as the imported TS type.
 */
import { useCallback, useEffect, useState } from 'react';
import { WX } from './theme/wx';
import { blankCard, toDraft, fromDraft, type CardDraft } from './types';
import type { Card } from './data/mechanics';
import { fetchCards, saveCard, deleteCard } from './api/cards';
import { CreateTab, EditTab, DummyTab } from './components/tabs';

type Tab = 'create' | 'edit' | 'dummy';

/** Derive a fresh, unused id for a duplicated card (codegen matches by id). */
function uniqueDupId(baseId: string, library: Card[]): string {
    const taken = new Set(library.map((s) => s.id));
    let n = 2;
    let candidate = `${baseId}_copy`;
    while (taken.has(candidate)) {
        candidate = `${baseId}_copy${n}`;
        n += 1;
    }
    return candidate;
}

function TabBtn({ label, n, active, onClick }: { label: string; n: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                flex: 1,
                cursor: 'pointer',
                font: 'inherit',
                padding: '12px 4px',
                background: active ? 'rgba(212,192,38,0.1)' : 'transparent',
                border: 'none',
                borderBottom: `2px solid ${active ? WX.sulfur : 'transparent'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
            }}
        >
            <span style={{ fontFamily: WX.mono, fontSize: 10, color: active ? WX.sulfur : WX.ash }}>{n}</span>
            <span style={{ fontFamily: WX.sans, fontSize: 13, letterSpacing: 1.5, color: active ? WX.parchment : WX.bone }}>{label}</span>
        </button>
    );
}

export function App() {
    const [tab, setTab] = useState<Tab>('create');
    const [library, setLibrary] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [draft, setDraft] = useState<CardDraft>(blankCard); // CREATE-tab working card
    const [editDraft, setEditDraft] = useState<CardDraft>(blankCard); // EDIT-tab working card
    const [selectedId, setSelectedId] = useState<string | null>(null); // EDIT-tab selection
    const [testCardId, setTestCardId] = useState<string | null>(null); // DUMMY-tab selection
    const [toast, setToast] = useState<string | null>(null);

    const flash = (msg: string) => {
        setToast(msg);
        window.setTimeout(() => setToast(null), 1800);
    };

    // ── load the REAL library from disk ──
    const reload = useCallback(async (): Promise<Card[]> => {
        const cards = await fetchCards();
        setLibrary(cards);
        return cards;
    }, []);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const cards = await fetchCards();
                if (!alive) return;
                setLibrary(cards);
                setLoadError(null);
            } catch (err) {
                if (!alive) return;
                setLoadError(err instanceof Error ? err.message : String(err));
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    // ── CREATE ──
    const saveNew = async () => {
        if (busy) return;
        setBusy(true);
        const card = fromDraft(draft);
        // optimistic
        setLibrary((prev) => [card, ...prev.filter((c) => c.id !== card.id)]);
        try {
            await saveCard(draft);
            await reload();
            setDraft(blankCard());
            flash(`Saved "${card.name}"`);
        } catch (err) {
            await reload().catch(() => undefined);
            flash(err instanceof Error ? err.message : 'Save failed');
        } finally {
            setBusy(false);
        }
    };

    // ── EDIT ──
    const selectForEdit = (skill: Card) => {
        setSelectedId(skill.id);
        setEditDraft(toDraft(skill));
    };
    const closeEdit = () => {
        setSelectedId(null);
        setEditDraft(blankCard());
    };
    const updateCard = async () => {
        if (busy) return;
        setBusy(true);
        const card = fromDraft(editDraft);
        setLibrary((prev) => prev.map((c) => (c.id === card.id ? card : c)));
        try {
            await saveCard(editDraft);
            await reload();
            flash(`Updated "${card.name}"`);
        } catch (err) {
            await reload().catch(() => undefined);
            flash(err instanceof Error ? err.message : 'Update failed');
        } finally {
            setBusy(false);
        }
    };
    const duplicateCard = async () => {
        if (busy) return;
        setBusy(true);
        const dupId = uniqueDupId(editDraft.id || 'card', library);
        const copyDraft: CardDraft = { ...editDraft, id: dupId, name: `${editDraft.name} (copy)` };
        const copy = fromDraft(copyDraft);
        setLibrary((prev) => [copy, ...prev]);
        try {
            await saveCard(copyDraft);
            await reload();
            setSelectedId(copy.id);
            setEditDraft(copyDraft);
            flash('Duplicated');
        } catch (err) {
            await reload().catch(() => undefined);
            flash(err instanceof Error ? err.message : 'Duplicate failed');
        } finally {
            setBusy(false);
        }
    };
    const removeCard = async () => {
        if (busy || selectedId == null) return;
        const id = selectedId;
        setBusy(true);
        setLibrary((prev) => prev.filter((c) => c.id !== id));
        closeEdit();
        try {
            await deleteCard(id);
            await reload();
            flash('Deleted');
        } catch (err) {
            await reload().catch(() => undefined);
            flash(err instanceof Error ? err.message : 'Delete failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            style={{
                width: '100%',
                maxWidth: 480,
                height: '100%',
                maxHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: WX.bg,
                color: WX.parchment,
                position: 'relative',
                boxShadow: '0 0 60px rgba(0,0,0,0.7)',
                overflow: 'hidden',
            }}
        >
            {/* header */}
            <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${WX.ashLine}`, flexShrink: 0 }}>
                <div style={{ fontFamily: WX.sans, fontSize: 11, letterSpacing: 4, color: WX.sulfur }}>AXIOMANCER</div>
                <div style={{ fontFamily: WX.gothic, fontSize: 26, lineHeight: 1, color: WX.parchment, marginTop: 1 }}>Card Workshop</div>
                <div style={{ fontFamily: WX.mono, fontSize: 10, color: WX.bone, marginTop: 3 }}>
                    {loading ? 'loading cards…' : `${library.length} card${library.length === 1 ? '' : 's'} · live · src/Cards/cards.library.ts`}
                </div>
            </div>

            {/* tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${WX.ashLine}`, flexShrink: 0 }}>
                <TabBtn label="CREATE" n="01" active={tab === 'create'} onClick={() => setTab('create')} />
                <TabBtn label="EDIT" n="02" active={tab === 'edit'} onClick={() => setTab('edit')} />
                <TabBtn label="DUMMY" n="03" active={tab === 'dummy'} onClick={() => setTab('dummy')} />
            </div>

            {/* body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {loadError ? (
                    <div style={{ fontFamily: WX.serif, color: WX.blood, padding: 12, border: `1px solid ${WX.rust}`, background: 'rgba(158,58,26,0.08)' }}>
                        <div style={{ fontFamily: WX.sans, letterSpacing: 1.5, marginBottom: 6 }}>COULD NOT LOAD CARDS</div>
                        <div style={{ fontFamily: WX.mono, fontSize: 12 }}>{loadError}</div>
                        <div style={{ fontFamily: WX.serif, fontStyle: 'italic', fontSize: 13, marginTop: 8, color: WX.bone }}>
                            Is the dev server running? The editor reads/writes the real library through its Vite API.
                        </div>
                    </div>
                ) : (
                    <>
                        {tab === 'create' && <CreateTab draft={draft} setDraft={setDraft} onSave={saveNew} />}
                        {tab === 'edit' && (
                            <EditTab
                                library={library}
                                draft={editDraft}
                                setDraft={setEditDraft}
                                selectedId={selectedId}
                                onSelect={selectForEdit}
                                onUpdate={updateCard}
                                onDuplicate={duplicateCard}
                                onDelete={removeCard}
                                onNew={closeEdit}
                            />
                        )}
                        {tab === 'dummy' && <DummyTab library={library} selectedCardId={testCardId} setSelectedCardId={setTestCardId} />}
                    </>
                )}
            </div>

            {/* toast */}
            {toast && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 18,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: WX.sulfur,
                        color: '#100d0a',
                        fontFamily: WX.sans,
                        fontSize: 14,
                        letterSpacing: 1,
                        padding: '8px 18px',
                        boxShadow: '0 4px 18px rgba(0,0,0,0.6)',
                        whiteSpace: 'nowrap',
                        maxWidth: '90%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {toast}
                </div>
            )}
        </div>
    );
}
