import { Character } from './types';
import { createCharacter } from './index';

export const Player: Character = createCharacter({
    name: 'Player',
    level: 1,
    // A real fresh run's stats (5/5/5, VITAE 170): neutral under S3's stat
    // scaling (D41), so fixture plays land their printed numbers.
    baseStats: { heart: 5, body: 5, mind: 5 },
    // Phase 19 — the fixture player wears the default relic loadout so combat /
    // sim fixtures derive a full signature kit from the worn equipment.
    seedStartingRelics: true,
});
