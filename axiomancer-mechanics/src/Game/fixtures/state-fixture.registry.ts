/**
 * Committed state fixtures — the shared vocabulary between the CLI, Jest,
 * and the browser harnesses. Reference one by id from any surface:
 *
 *   npm run game -- --fixture sage-fv-boss-gate
 *   http://localhost:8081/exploration?fixture=sage-fv-boss-gate
 *   buildStateFromFixture(getStateFixtureById('sage-fv-boss-gate')!)
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
        id: 'apprentice-fv-interaction',
        description: 'Apprentice standing on the first NPC node of the fishing village; `arrive` fires the dialogue so /dialogue is reachable cold.',
        seed: 'fixture-apprentice-fv-interaction',
        preset: 'apprentice',
        world: { continent: 'coastal-continent', map: 'fishing-village', node: 'fv-2' },
        flags: ['combat-tutorial-done'],
        arrive: true,
    },
    {
        id: 'sage-fv-boss-gate',
        description: 'Sage (L15) on fishing-village fv-9, one step from the boss node (fv-24, encounter) and the travel door (fv-10). Combat + travel surfaces.',
        seed: 'fixture-sage-fv-boss-gate',
        preset: 'sage',
        world: { continent: 'coastal-continent', map: 'fishing-village', node: 'fv-9' },
        flags: ['combat-tutorial-done', 'hazard-tutorial-done'],
        moralMeter: 20,
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
            completedMaps: ['fishing-village'],
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
        alignment: { epistemology: 60, outlook: -40 },
    },
    {
        id: 'broke-l1-fv-rest',
        description: 'Fresh L1 with zero shillings and 1 vitae on the fishing-village rest node (fv-3). Rest-choice + empty-wallet surfaces.',
        seed: 'fixture-broke-l1-fv-rest',
        preset: 'kid-l1',
        world: { continent: 'coastal-continent', map: 'fishing-village', node: 'fv-3' },
        player: { currency: 0, health: 1 },
    },
]);

/** Lookup by id; `undefined` when unknown. */
export const getStateFixtureById = (id: string): StateFixture | undefined =>
    STATE_FIXTURES.find(f => f.id === id);

/** Ids in declaration order — the CLI's `--fixture list` output. */
export const listStateFixtureIds = (): string[] => STATE_FIXTURES.map(f => f.id);
