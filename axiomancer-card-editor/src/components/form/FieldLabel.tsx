/** FieldLabel — a small-caps sans label with an optional mono hint. */
import type { ReactNode } from 'react';
import { WX } from '../../theme/wx';

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: WX.sans, fontSize: 12, letterSpacing: 2, color: WX.bone }}>{children}</span>
            {hint && <span style={{ fontFamily: WX.mono, fontSize: 10, color: WX.ash }}>{hint}</span>}
        </div>
    );
}
