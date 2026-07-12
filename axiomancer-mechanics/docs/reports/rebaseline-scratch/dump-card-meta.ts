/** Scratch helper — dumps card id/rank/rarity/asymmetry for the Phase 27 re-baseline analysis. */
import { writeFileSync } from 'fs';
import { join } from 'path';

import { cardLibrary } from '../../../src/Cards/cards.library';
import { rankToRarity } from '../../../src/Cards/types';

const rows = cardLibrary.map(c => ({
    id: c.id,
    rank: c.rank,
    rarity: rankToRarity(c.rank),
    asym: !!(c as { intentionallyAsymmetric?: boolean }).intentionallyAsymmetric,
}));
writeFileSync(join(__dirname, 'card-meta.json'), JSON.stringify(rows, null, 1));
console.log('cards:', rows.length,
    'common:', rows.filter(r => r.rarity === 'common').length,
    'uncommon:', rows.filter(r => r.rarity === 'uncommon').length,
    'rare:', rows.filter(r => r.rarity === 'rare').length,
    'asym:', rows.filter(r => r.asym).length);
