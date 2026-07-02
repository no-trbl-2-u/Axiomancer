/**
 * EnemyPortrait (visual-audit 2026-06) — the compact in-combat avatar.
 *
 * Renders just the archetype creature figure (no full CreatureScene
 * backdrop) in a small framed SVG, keyed by the enemy's art key. Used by
 * CombatEnemyPanel so the fight HUD shows a foe that matches the prelude
 * art instead of one generic hooded silhouette.
 *
 * The figure coordinate space matches CreatureScene (feet at y≈0, body
 * rising into negative-y, width within x∈[-72,72]); the viewBox frames
 * that so the creature fills the portrait.
 */

import React from 'react';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { usePalette } from '@/theme/runtime';
import { resolveEnemyArchetype, type EnemyArchetype } from '@/state/presenters/enemy-art';
import {
    AvianFigure,
    BeastFigure,
    CrustaceanFigure,
    EldritchFigure,
    FloraFigure,
    GenericFigure,
    SpiritFigure,
    TyrantFigure,
    VerminFigure,
    ZealotFigure,
} from './figures';

const FIGURES: Record<EnemyArchetype, React.ComponentType> = {
    vermin: VerminFigure,
    crustacean: CrustaceanFigure,
    spirit: SpiritFigure,
    beast: BeastFigure,
    avian: AvianFigure,
    flora: FloraFigure,
    zealot: ZealotFigure,
    eldritch: EldritchFigure,
    tyrant: TyrantFigure,
    generic: GenericFigure,
};

export interface EnemyPortraitProps {
    enemyArtKey?: string | null;
    isBoss?: boolean;
    width?: number;
    height?: number;
    label?: string;
}

export function EnemyPortrait({
    enemyArtKey,
    isBoss = false,
    width = 58,
    height = 70,
    label,
}: EnemyPortraitProps) {
    const AXM = usePalette();
    const archetype = resolveEnemyArchetype(enemyArtKey, isBoss);
    const Figure = FIGURES[archetype];
    return (
        <Svg
            viewBox="-76 -116 152 134"
            width={width}
            height={height}
            accessibilityRole="image"
            accessibilityLabel={label ?? 'Enemy portrait'}
        >
            <Defs>
                <RadialGradient id="enemyEyeGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor={AXM.blood} stopOpacity={0.95} />
                    <Stop offset="100%" stopColor={AXM.blood} stopOpacity={0} />
                </RadialGradient>
            </Defs>
            <Ellipse cx={0} cy={6} rx={56} ry={10} fill={AXM.deepBg} stroke={AXM.parchment} strokeWidth={0.75} opacity={0.7} />
            <Figure />
        </Svg>
    );
}
