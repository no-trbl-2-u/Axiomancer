/** TextField — single-line parchment input with a sulfur focus ring. */
import { WX } from '../../theme/wx';

export function TextField({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
                width: '100%',
                boxSizing: 'border-box',
                background: WX.panel2,
                border: `1px solid ${WX.ash}`,
                color: WX.parchment,
                fontFamily: WX.gothic,
                fontSize: 18,
                padding: '8px 10px',
                outline: 'none',
            }}
            onFocus={(e) => {
                e.target.style.borderColor = WX.sulfur;
            }}
            onBlur={(e) => {
                e.target.style.borderColor = WX.ash;
            }}
        />
    );
}
