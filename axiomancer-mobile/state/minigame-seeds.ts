/**
 * Shared mobile minigame seed resolver.
 *
 * Deterministic playtest/smoke tooling can set one unified global,
 * `globalThis.__AXM_MINIGAME_SEEDS__`, while older harnesses may still
 * set the per-minigame `__AXM_*_SEED__` globals. Begin actions use the
 * same precedence everywhere:
 *
 *   explicit begin option > unified global > legacy global > fallback
 */

export type MinigameSeedKey = 'hazard' | 'gathering' | 'rest' | 'cache' | 'quest';

export interface MinigameSeedEntry {
    seed?: number;
    hazardId?: string;
    id?: string;
    siteId?: string;
    site?: string;
    boardId?: string;
    board?: string;
}

export type MinigameSeedConfig = Partial<Record<MinigameSeedKey, MinigameSeedEntry>>;

declare global {
    // eslint-disable-next-line no-var
    var __AXM_MINIGAME_SEEDS__: MinigameSeedConfig | undefined;
}

function finiteNumber(value: number | undefined): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function nonEmptyString(value: string | undefined): value is string {
    return typeof value === 'string' && value.length > 0;
}

export function fallbackMinigameSeed(): number {
    return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

export function resolveMinigameSeed(
    key: MinigameSeedKey,
    explicitSeed: number | undefined,
    legacySeed: number | undefined,
    fallbackSeed: number | (() => number) = fallbackMinigameSeed,
): number {
    if (finiteNumber(explicitSeed)) return explicitSeed;
    const unified = globalThis.__AXM_MINIGAME_SEEDS__?.[key]?.seed;
    if (finiteNumber(unified)) return unified;
    if (finiteNumber(legacySeed)) return legacySeed;
    return typeof fallbackSeed === 'function' ? fallbackSeed() : fallbackSeed;
}

export function resolveMinigameString(
    key: MinigameSeedKey,
    names: readonly (keyof MinigameSeedEntry)[],
    explicitValue: string | undefined,
    legacyValue: string | undefined,
    fallbackValue?: string,
): string | undefined {
    if (nonEmptyString(explicitValue)) return explicitValue;
    const unified = globalThis.__AXM_MINIGAME_SEEDS__?.[key];
    for (const name of names) {
        const value = unified?.[name];
        if (nonEmptyString(value as string | undefined)) return value as string;
    }
    if (nonEmptyString(legacyValue)) return legacyValue;
    return fallbackValue;
}
