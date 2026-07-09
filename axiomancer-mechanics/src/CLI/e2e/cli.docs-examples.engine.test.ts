/**
 * Doc/registry parity — `docs/cli.md` `--enemy` examples must name enemies
 * that actually exist. Phase 22: this is the cheap CI-visible guard the
 * brief asks for so a future enemy rename/removal can't leave stale
 * documented examples behind (the same failure class as the CLI-typecheck
 * gap, just for prose instead of code).
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

import { ENEMY_REGISTRY } from '../../Enemy/enemy.library';
import { ENEMIES as COMBAT_SIM_ENEMIES } from '../combat-sim.cli';

const DOCS_PATH = path.resolve(__dirname, '../../../docs/cli.md');

function readDocs(): string {
    return fs.readFileSync(DOCS_PATH, 'utf-8');
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
