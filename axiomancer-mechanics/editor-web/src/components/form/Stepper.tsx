/** Stepper — big-tap –/+ numeric control (phone-friendly). */
import type { CSSProperties } from 'react';
import { WX } from '../../theme/wx';

export function Stepper({
    value,
    onChange,
    min = 0,
    max = 99,
}: {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
}) {
    const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
    const btn: CSSProperties = {
        width: 38,
        height: 38,
        cursor: 'pointer',
        font: 'inherit',
        flexShrink: 0,
        background: WX.panel2,
        border: `1px solid ${WX.ash}`,
        color: WX.parchment,
        fontFamily: WX.gothic,
        fontSize: 22,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };
    return (
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
            <button style={btn} onClick={() => set(value - 1)}>
                –
            </button>
            <div
                style={{
                    flex: 1,
                    textAlign: 'center',
                    background: WX.panel2,
                    border: `1px solid ${WX.ash}`,
                    color: WX.sulfur,
                    fontFamily: WX.mono,
                    fontSize: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {value}
            </div>
            <button style={btn} onClick={() => set(value + 1)}>
                +
            </button>
        </div>
    );
}
