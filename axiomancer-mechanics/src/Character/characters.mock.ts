import { Character } from './types';
import { createCharacter } from './index';

export const Player: Character = createCharacter({
    name: 'Player',
    level: 1,
    baseStats: { heart: 4, body: 3, mind: 2 },
});
