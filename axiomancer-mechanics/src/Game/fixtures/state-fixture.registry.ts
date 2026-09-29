/**
 * Committed state fixtures — the shared vocabulary between the CLI, Jest,
 * and the browser harnesses. Reference one by id from any surface:
 *
 *   npm run game -- --fixture sage-bw-door-gate
 *   http://localhost:8081/exploration?fixture=sage-bw-door-gate
 *   buildStateFromFixture(getStateFixtureById('sage-bw-door-gate')!)
 *
 * Authoring rules:
 *   - ids are kebab-case and unique (the registry test enforces both)
 *   - every fixture must build (`buildStateFromFixture`) — the test walks them
 *   - name the surface the fixture exists for in `description`
 *   - node / map / preset ids are validated against the live registries
 *
 * Functions:
 *   STATE_FIXTURES              the frozen list
 *   getStateFixtureById(id)     lookup
 *   listStateFixtureIds()       ids in declaration order
 */

import type { StateFixture } from './state-fixture.types';

export const STATE_FIXTURES: readonly StateFixture[] = Object.freeze([
    {
        id: 'fresh-start',
        description: 'A brand-new game, seeded. Baseline for onboarding + title-screen surfaces.',
        seed: 'fixture-fresh-start',
    },
    {
        id: 'apprentice-nf-interaction',
        description: 'Apprentice standing on the Shrine Keeper\'s node of the parked northern forest (nf-3; no Act 1 map stages an NPC); `arrive` fires the dialogue so /dialogue is reachable cold.',
        seed: 'fixture-apprentice-nf-interaction',
        preset: 'apprentice',
        world: { continent: 'coastal-continent', map: 'northern-forest', node: 'nf-3' },
        flags: ['combat-tutorial-done'],
        arrive: true,
    },
    {
        id: 'sage-bw-door-gate',
        description: 'Sage (L15) on the Breakwater\'s bw-15, one step from the door fight (bw-17, the Doorwarden) and two from the river bridge (bw-18). Combat + travel surfaces.',
        seed: 'fixture-sage-bw-door-gate',
        preset: 'sage',
        world: { continent: 'coastal-continent', map: 'breakwater', node: 'bw-15' },
        flags: ['combat-tutorial-done', 'hazard-tutorial-done'],
    },
    {
        id: 'wanderer-nf-village',
        description: 'Wanderer (L8) on the northern-forest village node (nf-8); `arrive` pushes /village. Village + shop surfaces.',
        seed: 'fixture-wanderer-nf-village',
        preset: 'wanderer',
        world: {
            continent: 'coastal-continent',
            map: 'northern-forest',
            node: 'nf-8',
        },
        player: { currency: 240 },
        arrive: true,
    },
    {
        id: 'l30-caverns-hazard',
        description: 'L30 ladder kit at the first caverns hazard node (nc-17) on the northern continent, low on vitae. Hazard + late-kit surfaces.',
        seed: 'fixture-l30-caverns-hazard',
        preset: 'kid-l30',
        world: {
            continent: 'northern-continent',
            map: 'caverns',
            node: 'nc-17',
        },
        player: { health: 12 },
        flags: ['combat-tutorial-done', 'hazard-tutorial-done'],
    },
    {
        id: 'broke-l1-bw-rest',
        description: 'Fresh L1 with zero shillings and 1 vitae on the Breakwater\'s first rest node (bw-9, an inn). Rest-choice + empty-wallet surfaces.',
        seed: 'fixture-broke-l1-bw-rest',
        preset: 'kid-l1',
        world: { continent: 'coastal-continent', map: 'breakwater', node: 'bw-9' },
        player: { currency: 0, health: 1 },
    },
    // ── Arrival fixtures (2026-09-08) — one per state-gated screen ────────
    // Each stands the player on a node of the named kind with `arrive`, so
    // `/critique`'s drive, `verify:visual`, and the Playwright harnesses
    // open the gated screen cold. Kinds per `getNodePrimaryEventKind`.
    {
        id: 'wanderer-nf-cutscene',
        description: 'Wanderer (L8) on a mid-forest omen node (nf-17, cutscene); `arrive` pushes /cutscene. (Not the map start node: the exploration screen fires a start node\'s own arrival on landing, and a second resolve would bounce the screen.)',
        seed: 'fixture-wanderer-nf-cutscene',
        preset: 'wanderer',
        world: { continent: 'coastal-continent', map: 'northern-forest', node: 'nf-17' },
        flags: ['combat-tutorial-done'],
        arrive: true,
    },
    {
        id: 'apprentice-bw-rest',
        description: 'Apprentice on the Breakwater\'s first rest node (bw-9), hurt; `arrive` starts the night-watch session → /rest.',
        seed: 'fixture-apprentice-bw-rest',
        preset: 'apprentice',
        world: { continent: 'coastal-continent', map: 'breakwater', node: 'bw-9' },
        player: { health: 20 },
        flags: ['combat-tutorial-done'],
        arrive: true,
    },
    {
        id: 'apprentice-bw-cache',
        description: 'Apprentice on the Breakwater\'s first loot-cache node (bw-5); `arrive` starts the cache session → /cache.',
        seed: 'fixture-apprentice-bw-cache',
        preset: 'apprentice',
        world: { continent: 'coastal-continent', map: 'breakwater', node: 'bw-5' },
        flags: ['combat-tutorial-done'],
        arrive: true,
    },
    {
        id: 'wanderer-bw-blacksmith',
        description: 'Wanderer (L8) with shillings on the Breakwater\'s anvil node (bw-16); `arrive` starts the forge session → /blacksmith.',
        seed: 'fixture-wanderer-bw-blacksmith',
        preset: 'wanderer',
        world: { continent: 'coastal-continent', map: 'breakwater', node: 'bw-16' },
        player: { currency: 180 },
        flags: ['combat-tutorial-done', 'blacksmith-tutorial-done'],
        arrive: true,
    },
    {
        id: 'l30-caverns-hazard-arrive',
        description: 'L30 ladder kit on the first caverns hazard node (nc-17); `arrive` starts the hazard minigame → /hazard.',
        seed: 'fixture-l30-caverns-hazard-arrive',
        preset: 'kid-l30',
        world: { continent: 'northern-continent', map: 'caverns', node: 'nc-17' },
        flags: ['combat-tutorial-done', 'hazard-tutorial-done'],
        arrive: true,
    },
]);

/** Lookup by id; `undefined` when unknown. */
export const getStateFixtureById = (id: string): StateFixture | undefined =>
    STATE_FIXTURES.find(f => f.id === id);

/** Ids in declaration order — the CLI's `--fixture list` output. */
export const listStateFixtureIds = (): string[] => STATE_FIXTURES.map(f => f.id);
