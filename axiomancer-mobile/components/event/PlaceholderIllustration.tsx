import { StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse, G, Line } from 'react-native-svg';

import { usePalette } from '@/theme/runtime';
import type { EventArtSlug } from '@/state/presenters/event-assets';

/**
 * Placeholder illustrations for non-encounter event kinds. Each is a
 * single procedural SVG keyed by slug; the real artwork ships via the
 * asset-swap workflow (see SVG_ASSET_SPEC.md). The visual variety is
 * deliberately minimal — the brief calls these out as "remain as
 * placeholders, but their slugs come from the engine."
 */
export function PlaceholderIllustration({ slug }: { slug: EventArtSlug }) {
    const AXM = usePalette();
    const getAccessibilityLabel = (slug: EventArtSlug): string => {
        const labels: Record<EventArtSlug, string> = {
            'interaction-generic': 'Generic interaction illustration showing a figure with speech elements', 
            'village': 'Village illustration showing multiple buildings',
            'cutscene': 'Cutscene illustration showing narrative elements with circular focus',
            'encounter': 'Combat encounter illustration showing a creature among twisted trees and ground debris',
            'boss': 'Boss encounter illustration showing a crowned figure with glowing eyes and ornate robes on a throne'
        };
        return labels[slug] || `Event illustration for ${slug}`;
    };

    return (
        <Svg 
            viewBox="0 0 374 320" 
            width="100%" 
            height="100%" 
            style={StyleSheet.absoluteFillObject}
            accessibilityLabel={getAccessibilityLabel(slug)}
            accessibilityRole="image"
        >
            <G stroke={AXM.bone} strokeWidth={0.5} opacity={0.3}>
                {Array.from({ length: 60 }).map((_, i) => (
                    <Line key={i} x1={i * 7} y1={200 + (i % 4) * 3} x2={i * 7 + 10} y2={200 + (i % 4) * 3} />
                ))}
            </G>
            {slug === 'interaction-generic' && (
                <G transform="translate(187 170)">
                    <Ellipse cx={0} cy={-10} rx={18} ry={22} fill={AXM.bg} stroke={AXM.parchment} strokeWidth={2} />
                    <Path d="M-25 25 L -25 70 L 25 70 L 25 25 Z" fill={AXM.deepBg} stroke={AXM.parchment} strokeWidth={1.5} />
                    <Circle cx={-6} cy={-12} r={2} fill={AXM.parchment} />
                    <Circle cx={6} cy={-12} r={2} fill={AXM.parchment} />
                </G>
            )}
            {slug === 'village' && (
                <G transform="translate(187 200)">
                    {[-80, -30, 30, 80].map((x, i) => (
                        <G key={i} transform={`translate(${x} 0)`}>
                            <Path d="M-20 0 L 0 -25 L 20 0 L 20 30 L -20 30 Z" fill={AXM.bg} stroke={AXM.parchment} strokeWidth={1.5} />
                            <Path d="M-5 10 L 5 10 L 5 28 L -5 28 Z" fill={AXM.parchment} opacity={0.4} />
                        </G>
                    ))}
                </G>
            )}
            {slug === 'cutscene' && (
                <G transform="translate(187 150)">
                    <Circle cx={0} cy={0} r={50} fill="none" stroke={AXM.sulfur} strokeWidth={1.5} opacity={0.6} />
                    <Circle cx={0} cy={0} r={30} fill="none" stroke={AXM.sulfur} strokeWidth={1} opacity={0.4} />
                    <Path d="M-10 0 L 10 0 M 0 -10 L 0 10" stroke={AXM.parchment} strokeWidth={1} />
                </G>
            )}
        </Svg>
    );
}
