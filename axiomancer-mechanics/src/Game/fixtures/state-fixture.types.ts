/**
 * State fixtures — declarative, versionless descriptions of a game state.
 *
 * A fixture names WHAT a test wants (a preset, a map, a node, some flags),
 * never the raw `GameState` shape. `buildStateFromFixture` compiles it
 * through the engine's own builders (`createNewGameState`,
 * `buildCharacterFromPreset`, the world reducer), so a fixture keeps
 * working across `GAME_STATE_VERSION` bumps without a migration.
 *
 * One fixture drives every surface:
 *   CLI    `npm run game -- --fixture <id|path.json>`
 *   Jest   `createAppStore({ adapter: createMemoryAdapter(buildStateFromFixture(f)) })`
 *   Web    `?fixture=<id>` or `globalThis.__AXM_FIXTURE__` before boot
 *
 * Every field is optional except `id`; an empty fixture is a new game.
 */

import type { BaseStats } from '../../Character/types';
import type { PhilosophicalAlignment } from '../../Ledger/types';
import type { ContinentName, MapName } from '../../World/map.library';

/** Player overrides layered over the preset (or the new-game player). */
export interface StateFixturePlayer {
    /** Display name. */
    name?: string;
    /** Level ≥ 1. Rebuilds the character so max health / thresholds follow. */
    level?: number;
    /** Partial stats; unspecified axes keep the preset's value. */
    baseStats?: Partial<BaseStats>;
    /** Current health, clamped to `[1, maxHealth]` after the rebuild. */
    health?: number;
    /** Currency counter (shillings). */
    currency?: number;
    /** Extra card ids learned on top of the preset's known set (deduped). */
    knownCards?: string[];
}

/** Where the player stands. `map` must belong to `continent`. */
export interface StateFixtureWorld {
    continent: ContinentName;
    map: MapName;
    /** Node id on `map`; defaults to the map's starting node. */
    node?: string;
    /** Maps stamped complete on `continent` before the player is placed. */
    completedMaps?: MapName[];
}

/** The fixture document. Author these in `state-fixture.registry.ts` or as JSON. */
export interface StateFixture {
    /** Kebab-case id; the CLI flag, URL param, and registry key. */
    id: string;
    /** One line for humans; shown by `--fixture list`. */
    description?: string;
    /**
     * Engine RNG seed applied BEFORE the state is built, so run id, rng
     * state, and every later roll are reproducible. Omit for a random run.
     */
    seed?: string | number;
    /** `CharacterPreset` id: apprentice | wanderer | sage | kid-l1 | kid-l15 | kid-l30 | kid-l50. */
    preset?: string;
    player?: StateFixturePlayer;
    world?: StateFixtureWorld;
    /** Flags appended to the new-game flag set (deduped). */
    flags?: string[];
    /** Moral meter value. */
    moralMeter?: number;
    /** Partial alignment; each axis is clamped to `[-100, 100]`. */
    alignment?: Partial<PhilosophicalAlignment>;
    /**
     * Ask the consumer to fire the current node's authored event on boot,
     * so state-gated screens (`/event`, `/village`, `/dialogue`, `/cutscene`)
     * are reachable without a walk. The engine only records the intent;
     * the CLI honours it via `--resolve-start`, mobile via `<FixtureBoot>`.
     */
    arrive?: boolean;
}
