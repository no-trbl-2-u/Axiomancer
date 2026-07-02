/**
 * EnemyIllustration (visual-audit 2026-06) — resolves an enemy id to a
 * bespoke archetype illustration drawn in the shared CreatureScene. Falls
 * back to the generic moonlit creature (or the boss throne) when an enemy
 * doesn't match any archetype, so coverage is total even before every
 * foe has hand-tuned art.
 */

import React from 'react';

import { resolveEnemyArchetype, type EnemyArchetype } from '@/state/presenters/enemy-art';
import { EncounterIllustration } from '../EncounterIllustration';
import { BossIllustration } from '../BossIllustration';
import { CreatureScene } from './CreatureScene';
import {
    AvianFigure,
    BeastFigure,
    CrustaceanFigure,
    EldritchFigure,
    FloraFigure,
    SpiritFigure,
    TyrantFigure,
    VerminFigure,
    ZealotFigure,
} from './figures';

export interface EnemyIllustrationProps {
    /** Enemy id (e.g. "enemy-coastal-tyrant" / "salt-gnaw-rat"). */
    enemyArtKey?: string | null;
    isBoss?: boolean;
}

const LABELS: Record<EnemyArchetype, string> = {
    vermin: 'a hunched vermin baring its teeth',
    crustacean: 'a broad-shelled crustacean with raised claws',
    spirit: 'a tattered shroud-spirit drifting above the ground',
    beast: 'a four-legged beast with a lowered, fanged head',
    avian: 'a hunched carrion bird with a hooked beak',
    flora: 'a gnarled treant with branch-like arms',
    zealot: 'a hooded zealot bearing a staff',
    eldritch: 'a broken sigil of light around a single eye',
    tyrant: 'a crowned tyrant upon a throne',
    generic: 'a horned creature in a moonlit clearing',
};

export function EnemyIllustration({ enemyArtKey, isBoss = false }: EnemyIllustrationProps) {
    const archetype = resolveEnemyArchetype(enemyArtKey, isBoss);

    // Generic fall-throughs keep the original scenes (and their tests).
    if (archetype === 'generic') return <EncounterIllustration />;

    const label = `Combat encounter illustration showing ${LABELS[archetype]}`;

    switch (archetype) {
        case 'vermin':
            return <CreatureScene label={label} shadowWidth={54}><VerminFigure /></CreatureScene>;
        case 'crustacean':
            return <CreatureScene label={label} shadowWidth={62}><CrustaceanFigure /></CreatureScene>;
        case 'spirit':
            return <CreatureScene label={label} shadowWidth={40}><SpiritFigure /></CreatureScene>;
        case 'beast':
            return <CreatureScene label={label} shadowWidth={58}><BeastFigure /></CreatureScene>;
        case 'avian':
            return <CreatureScene label={label} shadowWidth={34}><AvianFigure /></CreatureScene>;
        case 'flora':
            return <CreatureScene label={label} shadowWidth={40}><FloraFigure /></CreatureScene>;
        case 'zealot':
            return <CreatureScene label={label} shadowWidth={44}><ZealotFigure /></CreatureScene>;
        case 'eldritch':
            return <CreatureScene label={label} shadowWidth={30}><EldritchFigure /></CreatureScene>;
        case 'tyrant':
            // A named/crowned boss without bespoke art still gets the throne
            // illustration; the crowned-figure scene reads as a boss beat.
            return isBoss
                ? <CreatureScene label={label} shadowWidth={58}><TyrantFigure /></CreatureScene>
                : <BossIllustration />;
    }
}
