import { Character } from './types';
import { createCharacter } from './index';

export const Player: Character = createCharacter({
    name: 'Player',
    level: 1,
    baseStats: { heart: 4, body: 3, mind: 2 },
    // Phase 19 — the fixture player wears the default relic loadout so combat /
    // sim fixtures derive a full signature kit from the worn equipment.
    seedStartingRelics: true,
});
