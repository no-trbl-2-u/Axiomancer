/**
 * PlayerPortraitImage (temp art pass 2026-07-06) — the raster pilgrim bust.
 *
 * Successor to the procedural `PlayerPortrait` SVG at every production call
 * site (character-sheet header, combat medallion, pilgrim inspect modal).
 * Reads the chosen portrait from the store (`portrait:<id>` flag — see
 * assets/images/portraits); decorative, the caller's frame supplies a label.
 */

import React from 'react';
import { Image } from 'expo-image';

import { getPlayerPortrait, portraitIdFromFlags } from '@/assets/images/portraits';
import { useGameState } from '@/state/GameStoreProvider';

interface PlayerPortraitImageProps {
    width?: number;
    height?: number;
    /** 'contain' shows the full figure (sheet header); 'cover' crops toward the
     *  head for tight circular frames (combat medallion). */
    fit?: 'contain' | 'cover';
}

export function PlayerPortraitImage({ width = 80, height = 96, fit = 'contain' }: PlayerPortraitImageProps) {
    const portraitId = useGameState((s) => portraitIdFromFlags(s.flags));
    const portrait = getPlayerPortrait(portraitId);
    return (
        <Image
            source={portrait.source}
            style={{ width, height }}
            contentFit={fit}
            contentPosition="top center"
            transition={0}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        />
    );
}
