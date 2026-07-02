/** Segmented — a row of mutually-exclusive pills, optionally accent-coloured. */
import { WX } from '../../theme/wx';

export interface SegOption<T extends string | number> {
    value: T;
    label: string;
}

export function Segmented<T extends string | number>({
    options,
    value,
    onChange,
    colorFor,
}: {
    options: ReadonlyArray<SegOption<T>>;
    value: T;
    onChange: (v: T) => void;
    colorFor?: (v: T) => string;
}) {
    return (
        <div style={{ display: 'flex', gap: 4 }}>
            {options.map((o) => {
                const sel = o.value === value;
                const accent = colorFor ? colorFor(o.value) : WX.sulfur;
                return (
                    <button
                        key={String(o.value)}
                        onClick={() => onChange(o.value)}
                        style={{
                            flex: 1,
                            padding: '7px 4px',
                            cursor: 'pointer',
                            font: 'inherit',
                            fontFamily: WX.sans,
                            fontSize: 13,
                            letterSpacing: 1.5,
                            background: sel ? accent : 'transparent',
                            color: sel ? '#100d0a' : WX.bone,
                            border: `1px solid ${sel ? accent : WX.ash}`,
                            transition: 'all .12s',
                        }}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}
