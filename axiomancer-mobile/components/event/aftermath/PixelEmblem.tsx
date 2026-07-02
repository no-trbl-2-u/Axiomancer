/**
 * PixelEmblem — the 16×16 pixel-art heart + clasped-hands sprite
 * rendered inside `<CombatFriendshipPanel>`.
 *
 * **DESIGN CARVE-OUT — DO NOT NORMALIZE THIS COMPONENT.** Pixel art
 * is intentionally the ONE deliberate aesthetic break in the
 * entire app. Everywhere else the design works in clipped torn-
 * edge panels and gothic illuminated-manuscript type; this emblem
 * is treated as a diegetic motif from an in-world "old friend
 * codex." The contrast lands only because the rest of the surface
 * stays in the gothic register.
 *
 * The carve-out's rationale is preserved in
 * `design/handoff-2026-05-22/chats/chat4.md:109-110` ("a deliberate
 * aesthetic carve-out. … pixel art [is] rendered as a 16×16 `<rect>`
 * grid, with one shadow column on the bottom-right, a single white
 * highlight pixel near the top-left, and one sulfur sparkle off the
 * upper-right of the heart. Treating it as a diegetic motif from an
 * in-world 'old friend codex' lets the contrast land — it reads as
 * a *thing inside the world*, not a stylistic mistake — and it
 * earns its place by being the only place this register appears.").
 *
 * Source-of-truth sprite: `PIXEL_HEART` from the handoff bundle's
 * `screens/aftermath-modal.jsx:386-403`. The grid is ported verbatim;
 * cell scaling (default 11px) yields a 176×176 sprite that matches
 * the design's framed-emblem proportions.
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { makeStyles, usePalette } from '@/theme/runtime';

/**
 * 16×16 sprite. Characters:
 *   .  transparent
 *   r  heart blood (AXM.blood)
 *   s  shadow (AXM.pixelShadow)
 *   h  highlight (AXM.pixelHighlight)
 *   p  hand parchment (AXM.parchment)
 *   *  sulfur sparkle (AXM.sulfur)
 *
 * Verbatim from the design handoff bundle. Do not edit individual
 * characters without re-rendering against the source artboard —
 * the silhouette is hand-tuned and the shadow / highlight pattern
 * carries the "in-world codex sprite" reading.
 */
export const PIXEL_HEART: readonly string[] = [
    '............*...',
    '..rrr......rrr..',
    '.rrrrr....rrrrr.',
    'rrrrrrr..rrrrrrr',
    'rhrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrs',
    'rrpprrrrrrrppr.s',
    'rppppprrrrppppps',
    'rpppppppppppppps',
    'rrppppppppppppss',
    '.rrrrrrrrrrrrss.',
    '..rrrrrrrrrrss..',
    '...rrrrrrrrss...',
    '....rrrrrrss....',
    '.....rrrrss.....',
    '......rrss......',
];

export interface PixelEmblemProps {
    /** Pixel size of one sprite cell. Default 11 yields a 176×176 sprite. */
    cell?: number;
}

export function PixelEmblem({ cell = 11 }: PixelEmblemProps) {
    const AXM = usePalette();
    const styles = useStyles();
    const PIX_COLORS: Record<string, string> = {
        r: AXM.blood,
        s: AXM.pixelShadow,
        h: AXM.pixelHighlight,
        p: AXM.parchment,
        '*': AXM.sulfur,
    };
    const side = 16 * cell;
    return (
        <View
            style={[styles.frame, { width: side + 16 }]}
            testID="pixel-emblem"
        >
            <Svg
                width={side}
                height={side}
                viewBox={`0 0 ${side} ${side}`}
            >
                {PIXEL_HEART.flatMap((row, y) =>
                    row.split('').map((ch, x) => {
                        if (ch === '.') return null;
                        const fill = PIX_COLORS[ch];
                        if (fill === undefined) return null;
                        return (
                            <Rect
                                key={`${x}-${y}`}
                                x={x * cell}
                                y={y * cell}
                                width={cell}
                                height={cell}
                                fill={fill}
                            />
                        );
                    }),
                )}
            </Svg>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    frame: {
        padding: 8,
        borderWidth: 1,
        borderColor: AXM.parchment,
        backgroundColor: AXM.silhouette,
        alignSelf: 'center',
    },
}));
