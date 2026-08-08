import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { usePalette } from '@/theme/runtime';
import { AXM_ICON_SPECS, type AxmIconName } from './icon-registry';

interface AxmIconProps {
    name: AxmIconName;
    size?: number;
    /** Monochrome icon color; defaults to parchment. */
    color?: string;
    /** Per-placement accessibility label override. */
    label?: string;
}

/**
 * AxmIcon — the one renderer for the icon canon (Phase V1).
 *
 * Draws a registry silhouette in a single caller color over the AXM
 * token contract; the reserved accent channel (`stroke: 'accent'`)
 * resolves to `AXM.blood`. Prefer this (or the `ActionIcon` /
 * `EffectGlyph` adapters) over ad-hoc inline `<Svg>` icons — see
 * `components/icons/icon-registry.ts`.
 */
export function AxmIcon({ name, size = 28, color, label }: AxmIconProps) {
    const AXM = usePalette();
    const spec = AXM_ICON_SPECS[name];
    if (!spec) return null;
    const c = color ?? AXM.parchment;

    return (
        <Svg
            viewBox={spec.viewBox}
            width={size}
            height={size}
            accessibilityRole="image"
            accessibilityLabel={label ?? spec.label}
        >
            {spec.primitives.map((p, i) => (
                <Path
                    key={i}
                    d={p.d}
                    fill={p.fill ? c : 'none'}
                    fillOpacity={p.fillOpacity}
                    stroke={p.stroke === 'accent' ? AXM.blood : p.stroke === 'color' ? c : undefined}
                    strokeWidth={p.strokeWidth}
                    strokeLinecap={p.strokeLinecap}
                    strokeLinejoin="round"
                    opacity={p.opacity}
                />
            ))}
        </Svg>
    );
}
