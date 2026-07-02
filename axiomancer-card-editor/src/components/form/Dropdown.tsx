/** Dropdown — styled native <select> with a custom chevron. */
import { WX } from '../../theme/wx';

export interface DropOption<T extends string | number> {
    value: T;
    label: string;
}

export function Dropdown<T extends string | number>({
    options,
    value,
    onChange,
}: {
    options: ReadonlyArray<DropOption<T>>;
    value: T;
    onChange: (v: T) => void;
}) {
    return (
        <div style={{ position: 'relative' }}>
            <select
                value={String(value)}
                onChange={(e) => {
                    const raw = e.target.value;
                    const match = options.find((o) => String(o.value) === raw);
                    if (match) onChange(match.value);
                }}
                style={{
                    width: '100%',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    boxSizing: 'border-box',
                    background: WX.panel2,
                    border: `1px solid ${WX.ash}`,
                    color: WX.parchment,
                    fontFamily: WX.sans,
                    fontSize: 15,
                    letterSpacing: 1.5,
                    padding: '9px 30px 9px 10px',
                    outline: 'none',
                    cursor: 'pointer',
                }}
            >
                {options.map((o) => (
                    <option key={String(o.value)} value={String(o.value)} style={{ background: WX.panel2 }}>
                        {o.label}
                    </option>
                ))}
            </select>
            <span
                style={{
                    position: 'absolute',
                    right: 11,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: WX.bone,
                    pointerEvents: 'none',
                    fontSize: 11,
                }}
            >
                ▼
            </span>
        </div>
    );
}
