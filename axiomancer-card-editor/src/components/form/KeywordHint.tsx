/** KeywordHint — a sulfur-ruled gloss explaining the selected display keyword. */
import { WX, KEYWORDS, type KeywordMeta } from '../../theme/wx';

export function KeywordHint({ id }: { id: string }) {
    const m = (KEYWORDS as Record<string, KeywordMeta>)[id];
    if (!m) return null;
    return (
        <div
            style={{
                marginTop: 6,
                paddingLeft: 9,
                borderLeft: `2px solid ${WX.sulfur}`,
                fontFamily: WX.serif,
                fontSize: 13,
                lineHeight: 1.35,
                color: WX.bone,
            }}
        >
            <span style={{ fontFamily: WX.mono, fontSize: 11, letterSpacing: 1, color: WX.sulfur }}>{m.label}</span>
            {'  '}
            {m.blurb}
        </div>
    );
}
