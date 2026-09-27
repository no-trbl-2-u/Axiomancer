/** KeywordHint — a sulfur-ruled gloss explaining the selected display keyword. */
import { WX, DIE, KEYWORDS, type KeywordMeta } from '../../theme/wx';

/** S3 — the stat glyph beside a keyword's family (matches the mobile dice glyphs). */
const STAT_GLYPH = { body: '⚡', mind: '★', heart: '♥' } as const;

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
            <span style={{ fontFamily: WX.mono, fontSize: 11, letterSpacing: 1, color: m.stat === 'grey' ? WX.sulfur : DIE[m.stat].color }}>
                {m.stat === 'grey' ? '' : `${STAT_GLYPH[m.stat]} `}{m.label}
            </span>
            <span
                style={{ fontFamily: WX.mono, fontSize: 10, letterSpacing: 1, color: WX.bone, opacity: 0.7, marginLeft: 6 }}
                data-testid="keyword-hint-stat"
            >
                {m.stat === 'grey' ? 'UNSCALED' : `SCALES WITH ${DIE[m.stat].label}`}
            </span>
            {'  '}
            {m.blurb}
        </div>
    );
}
