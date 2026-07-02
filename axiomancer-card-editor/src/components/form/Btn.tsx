/** Btn — primary (sulfur) / ghost / danger action button. */
import type { CSSProperties, ReactNode } from 'react';
import { WX } from '../../theme/wx';

export type BtnKind = 'primary' | 'ghost' | 'danger';

const KINDS: Record<BtnKind, { bg: string; fg: string; bd: string }> = {
    primary: { bg: WX.sulfur, fg: '#100d0a', bd: WX.sulfur },
    ghost: { bg: 'transparent', fg: WX.parchment, bd: WX.ash },
    danger: { bg: 'transparent', fg: WX.blood, bd: WX.blood },
};

export function Btn({
    children,
    onClick,
    kind = 'primary',
    style = {},
}: {
    children: ReactNode;
    onClick?: () => void;
    kind?: BtnKind;
    style?: CSSProperties;
}) {
    const k = KINDS[kind] || KINDS.primary;
    return (
        <button
            onClick={onClick}
            style={{
                padding: '11px 16px',
                cursor: 'pointer',
                font: 'inherit',
                fontFamily: WX.sans,
                fontSize: 15,
                letterSpacing: 2,
                background: k.bg,
                color: k.fg,
                border: `1px solid ${k.bd}`,
                ...style,
            }}
        >
            {children}
        </button>
    );
}
