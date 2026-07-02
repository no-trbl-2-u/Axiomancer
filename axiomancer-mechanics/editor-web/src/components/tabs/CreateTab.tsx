/**
 * CreateTab — author a brand-new card. Live face preview on top (updates as you
 * type), the full-fidelity form below, and a sticky SAVE action.
 */
import type { CardDraft } from '../../types';
import { WX } from '../../theme/wx';
import { CardFace } from '../CardFace';
import { CardForm } from '../CardForm';
import { Btn } from '../form';

export function CreateTab({
    draft,
    setDraft,
    onSave,
}: {
    draft: CardDraft;
    setDraft: (d: CardDraft) => void;
    onSave: () => void;
}) {
    const named = draft.name.trim().length > 0;
    const ided = draft.id.trim().length > 0;
    const valid = named && ided;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* live preview */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    padding: '22px 16px 18px',
                    background: 'radial-gradient(ellipse at center, rgba(212,192,38,0.06), transparent 70%)',
                    border: `1px solid ${WX.ashLine}`,
                }}
            >
                <div style={{ fontFamily: WX.sans, fontSize: 11, letterSpacing: 3, color: WX.bone, alignSelf: 'flex-start' }}>LIVE PREVIEW</div>
                <CardFace card={draft} width={210} height={294} />
            </div>

            {/* form */}
            <CardForm card={draft} setCard={setDraft} />

            {/* CTA */}
            <div style={{ position: 'sticky', bottom: -16, paddingTop: 14, paddingBottom: 4, marginTop: -8, background: `linear-gradient(transparent, ${WX.bg} 32%)` }}>
                <Btn
                    onClick={valid ? onSave : undefined}
                    style={{ width: '100%', padding: '14px', fontSize: 17, opacity: valid ? 1 : 0.4, cursor: valid ? 'pointer' : 'not-allowed' }}
                >
                    ✠ SAVE CARD
                </Btn>
                {!valid && (
                    <div style={{ fontFamily: WX.mono, fontSize: 11, color: WX.ash, textAlign: 'center', marginTop: 6 }}>
                        {!named ? 'name the card to save' : 'give the card an id to save'}
                    </div>
                )}
            </div>
        </div>
    );
}
