/**
 * Doc/registry parity — `docs/cli.md` `--enemy` examples must name enemies
 * that actually exist. This is the cheap CI-visible guard so a future
 * enemy rename/removal can't leave stale
 * documented examples behind (the same failure class as the CLI-typecheck
 * gap, just for prose instead of code).
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

import { ENEMY_REGISTRY } from '../../Enemy/enemy.library';
import { ENEMIES as COMBAT_SIM_ENEMIES, DEFAULT_LOADOUT } from '../combat-sim.cli';
import { getCardById } from '../../Cards/cards.library';
import { parseDeckSelectionArg } from '../../Combat/combat.playtest';
import { HAZARD_LIBRARY } from '../../World/Hazard/hazard.content';

const DOCS_PATH = path.resolve(__dirname, '../../../docs/cli.md');
const PLAYTEST_DOCS_PATH = path.resolve(__dirname, '../../../docs/playtest.md');

function readDocs(): string {
    return fs.readFileSync(DOCS_PATH, 'utf-8');
}

function readPlaytestDocs(): string {
    return fs.readFileSync(PLAYTEST_DOCS_PATH, 'utf-8');
}

describe('docs/cli.md — --enemy examples stay in sync with the registries', () => {
    it('combat CLI kebab-case slugs (npm run combat / npm run game) resolve in ENEMY_REGISTRY', () => {
        const docs = readDocs();
        const registrySlugs = new Set(Object.keys(ENEMY_REGISTRY));

        const slugPattern = /--enemy\s+([a-z][a-z0-9-]*)/g;
        const found = new Set<string>();
        let match: RegExpExecArray | null;
        while ((match = slugPattern.exec(docs)) !== null) {
            found.add(match[1]);
        }

        expect(found.size).toBeGreaterThan(0);
        for (const slug of found) {
            expect(registrySlugs.has(slug), `docs/cli.md references unknown enemy slug "${slug}"`).toBe(true);
        }
    });

    it('combat-sim CLI PascalCase names (npm run combat-sim) resolve in the sim roster', () => {
        const docs = readDocs();
        const simNames = new Set(Object.keys(COMBAT_SIM_ENEMIES));

        const namePattern = /--enemy[=\s]+([A-Z][A-Za-z0-9]*)/g;
        const found = new Set<string>();
        let match: RegExpExecArray | null;
        while ((match = namePattern.exec(docs)) !== null) {
            found.add(match[1]);
        }
        // Also cover the "(e.g. `X`, `Y`)" prose form.
        const prosePattern = /`([A-Z][A-Za-z0-9]*)`/g;
        const proseSection = docs.slice(docs.indexOf('Run against one enemy only'));
        const proseEnd = proseSection.indexOf('\n', proseSection.indexOf('Omit to run'));
        const proseSlice = proseSection.slice(0, proseEnd === -1 ? undefined : proseEnd);
        while ((match = prosePattern.exec(proseSlice)) !== null) {
            found.add(match[1]);
        }

        expect(found.size).toBeGreaterThan(0);
        for (const name of found) {
            expect(simNames.has(name), `docs/cli.md references unknown combat-sim enemy "${name}"`).toBe(true);
        }
    });
});

describe('docs/cli.md — --loadout examples resolve in the card library', () => {
    it('the combat-sim default loadout and every documented --loadout id are real cards', () => {
        const docs = readDocs();
        const ids = new Set<string>(DEFAULT_LOADOUT);
        const flagPattern = /--loadout=([a-z0-9,-]+)/g;
        let match: RegExpExecArray | null;
        while ((match = flagPattern.exec(docs)) !== null) {
            for (const id of match[1].split(',')) ids.add(id);
        }
        // The flag table's default: `a,b,c` after "The default is".
        const tableDefault = /The default is[^`]*`([a-z0-9,-]+)`/.exec(docs);
        expect(tableDefault, 'docs/cli.md names the combat-sim default loadout').not.toBeNull();
        expect(tableDefault![1].split(',')).toEqual(DEFAULT_LOADOUT);

        expect(DEFAULT_LOADOUT.length).toBeGreaterThan(0);
        for (const id of ids) {
            expect(getCardById(id), `unknown card id "${id}" in a combat-sim loadout`).toBeDefined();
        }
    });
});

describe('docs/cli.md — --hazard examples stay in sync with HAZARD_LIBRARY', () => {
    it('every documented --hazard <id> example resolves in HAZARD_LIBRARY', () => {
        const docs = readDocs();
        const hazardIds = new Set(HAZARD_LIBRARY.map((h) => h.id));

        const found = new Set<string>();
        const flagPattern = /--hazard[=\s]+([a-z][a-z0-9-]*)/g;
        let match: RegExpExecArray | null;
        while ((match = flagPattern.exec(docs)) !== null) {
            found.add(match[1]);
        }
        // Also cover the "(e.g. `slug`)" prose form next to "hazard card".
        const prosePattern = /hazard card \(e\.g\. `([a-z][a-z0-9-]*)`\)/g;
        while ((match = prosePattern.exec(docs)) !== null) {
            found.add(match[1]);
        }

        expect(found.size).toBeGreaterThan(0);
        for (const id of found) {
            expect(hazardIds.has(id), `docs/cli.md references unknown hazard id "${id}"`).toBe(true);
        }
    });
});

describe('docs/playtest.md — --deck examples parse', () => {
    it('every documented --deck value parses under the deck-selection grammar', () => {
        const docs = readPlaytestDocs();
        const deckPattern = /--deck[=\s]+([a-z][a-z0-9:,-]*)/g;
        const found = new Set<string>();
        let match: RegExpExecArray | null;
        while ((match = deckPattern.exec(docs)) !== null) {
            found.add(match[1]);
        }

        expect(found.size).toBeGreaterThan(0);
        for (const value of found) {
            expect(() => parseDeckSelectionArg(value), `docs/playtest.md: --deck ${value}`).not.toThrow();
        }
    });
});
