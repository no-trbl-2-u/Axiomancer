/**
 * PlayerPortraitImage (temp art pass 2026-07-06) — the raster pilgrim bust.
 *
 * Successor to the procedural `PlayerPortrait` SVG at every production call
 * site (character-sheet header, combat medallion, pilgrim inspect modal).
 * Reads the chosen portrait from the store (`portrait:<id>` flag — see
 * assets/images/portraits); decorative, the caller's frame supplies a label.
 */

import React from 'react';
import type { DimensionValue } from 'react-native';
import { Image } from '@/lib/platform/image';

import { getPlayerPortrait, portraitIdFromFlags } from '@/assets/images/portraits';
import { useGameState } from '@/state/GameStoreProvider';

interface PlayerPortraitImageProps {
    /** Accepts a percentage (e.g. '100%') so the portrait can fill a flex column. */
    width?: DimensionValue;
    height?: DimensionValue;
    /** 'contain' shows the full figure (sheet header); 'cover' crops toward the
     *  head for tight circular frames (combat medallion). */
    fit?: 'contain' | 'cover';
    /** Where the image sits within its box. Defaults to 'top center' (the head
     *  anchors up, letterboxing below); pass 'center' to sit it in the middle. */
    contentPosition?: 'top center' | 'center';
}

export function PlayerPortraitImage({
    width = 80,
    height = 96,
    fit = 'contain',
    contentPosition = 'top center',
}: PlayerPortraitImageProps) {
    const portraitId = useGameState((s) => portraitIdFromFlags(s.flags));
    const portrait = getPlayerPortrait(portraitId);
    return (
        <Image
            source={portrait.source}
            style={{ width, height }}
            contentFit={fit}
            contentPosition={contentPosition}
            transition={0}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        />
    );
}
