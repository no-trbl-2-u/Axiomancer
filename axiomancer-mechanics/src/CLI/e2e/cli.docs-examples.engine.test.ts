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
import { COMBAT_DECK_PRESETS } from '../../Combat/combat.starter-deck-presets';
import { HAZARD_LIBRARY } from '../../World/Hazard/hazard.content';
import { fishingVillage } from '../../World/Continents/Coastal-Village/maps';

const DOCS_PATH = path.resolve(__dirname, '../../../docs/cli.md');
const PLAYTEST_DOCS_PATH = path.resolve(__dirname, '../../../docs/playtest.md');
const FV_WALKTHROUGH_GOAL_PATH = path.resolve(
    __dirname,
    '../../../automation/scripts/walkthroughs/fishing-village-exploration.goal.md',
);

function readDocs(): string {
    return fs.readFileSync(DOCS_PATH, 'utf-8');
}

function readPlaytestDocs(): string {
    return fs.readFileSync(PLAYTEST_DOCS_PATH, 'utf-8');
}

function readFvWalkthroughGoal(): string {
    return fs.readFileSync(FV_WALKTHROUGH_GOAL_PATH, 'utf-8');
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

describe('fishing-village-exploration.goal.md — documented route stays connected in the live map', () => {
    it('every fv-N node id named in the goal doc exists on the fishing-village map', () => {
        const goal = readFvWalkthroughGoal();
        const nodeIds = new Set(fishingVillage.nodes.map((n) => n.id));

        const mentioned = new Set<string>();
        const nodePattern = /\bfv-\d+\b/g;
        let match: RegExpExecArray | null;
        while ((match = nodePattern.exec(goal)) !== null) {
            mentioned.add(match[0]);
        }

        expect(mentioned.size).toBeGreaterThan(0);
        for (const id of mentioned) {
            expect(nodeIds.has(id), `fishing-village-exploration.goal.md references unknown map node "${id}"`).toBe(true);
        }
    });

    it('the documented --route chain is actually connected node-to-node', () => {
        const goal = readFvWalkthroughGoal();
        const byId = new Map(fishingVillage.nodes.map((n) => [n.id, n]));

        const routeMatch = goal.match(/--route\s+([a-z0-9,-]+)\s*\\/);
        expect(routeMatch, 'goal doc must document a --route example').not.toBeNull();
        const route = routeMatch![1].split(',');
        expect(route.length).toBeGreaterThan(1);

        for (let i = 0; i < route.length - 1; i++) {
            const from = byId.get(route[i]);
            expect(from, `documented --route chain names unknown node "${route[i]}"`).toBeDefined();
            expect(
                from!.connectedNodes.includes(route[i + 1]),
                `documented --route chain breaks: ${route[i]} does not connect to ${route[i + 1]}`,
            ).toBe(true);
        }
    });
});

describe('docs/playtest.md — preset:<id> examples stay in sync with COMBAT_DECK_PRESETS', () => {
    it('every documented preset:<id> resolves in COMBAT_DECK_PRESETS', () => {
        const docs = readPlaytestDocs();
        const presetIds = new Set(Object.keys(COMBAT_DECK_PRESETS));

        const presetPattern = /preset:([a-z][a-z0-9-]*)/g;
        const found = new Set<string>();
        let match: RegExpExecArray | null;
        while ((match = presetPattern.exec(docs)) !== null) {
            found.add(match[1]);
        }

        expect(found.size).toBeGreaterThan(0);
        for (const id of found) {
            expect(presetIds.has(id), `docs/playtest.md references unknown preset id "${id}"`).toBe(true);
        }
    });
});
