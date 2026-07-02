// Shared deterministic minigame seed injector for browser-driven harnesses.
// Mirrors state/minigame-seeds.ts's global contract without importing TS into
// Node ESM scripts.

export const DEFAULT_MINIGAME_SEEDS = Object.freeze({
    hazard: Object.freeze({ seed: 424242, hazardId: 'cracked-cliff' }),
    gathering: Object.freeze({ seed: 9090, siteId: 'mire-mint' }),
    rest: Object.freeze({ seed: 515151 }),
    cache: Object.freeze({ seed: 626262 }),
    quest: Object.freeze({ seed: 737373, boardId: 'build-the-boat' }),
})

export function buildMinigameSeedInitPayload(overrides = {}) {
    return {
        hazard: { ...DEFAULT_MINIGAME_SEEDS.hazard, ...(overrides.hazard ?? {}) },
        gathering: { ...DEFAULT_MINIGAME_SEEDS.gathering, ...(overrides.gathering ?? {}) },
        rest: { ...DEFAULT_MINIGAME_SEEDS.rest, ...(overrides.rest ?? {}) },
        cache: { ...DEFAULT_MINIGAME_SEEDS.cache, ...(overrides.cache ?? {}) },
        quest: { ...DEFAULT_MINIGAME_SEEDS.quest, ...(overrides.quest ?? {}) },
    }
}

export async function injectMinigameSeeds(context, options = {}) {
    const { theme = null, seeds = DEFAULT_MINIGAME_SEEDS } = options
    const payload = buildMinigameSeedInitPayload(seeds)
    await context.addInitScript(({ minigameSeeds, themeValue }) => {
        globalThis.__AXM_MINIGAME_SEEDS__ = minigameSeeds

        // Back-compat for exported bundles or manual dev snippets that still
        // consult legacy globals directly. Begin actions prefer the unified
        // config, so these cannot outrank it.
        globalThis.__AXM_HAZARD_SEED__ = minigameSeeds.hazard.seed
        globalThis.__AXM_HAZARD_ID__ = minigameSeeds.hazard.hazardId
        globalThis.__AXM_GATHER_SEED__ = minigameSeeds.gathering.seed
        globalThis.__AXM_GATHER_SITE__ = minigameSeeds.gathering.siteId
        globalThis.__AXM_REST_SEED__ = minigameSeeds.rest.seed
        globalThis.__AXM_CACHE_SEED__ = minigameSeeds.cache.seed
        globalThis.__AXM_QUEST_SEED__ = minigameSeeds.quest.seed
        globalThis.__AXM_QUEST_BOARD__ = minigameSeeds.quest.boardId

        if (themeValue) globalThis.__AXM_THEME__ = themeValue
    }, { minigameSeeds: payload, themeValue: theme })
    return payload
}
