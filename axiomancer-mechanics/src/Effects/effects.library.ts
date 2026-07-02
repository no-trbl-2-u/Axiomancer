import buffsLibrary from './buffs.library.json';
import debuffsLibrary from './debuffs.library.json';
import { Effect, EffectType } from './types';

const buffs = buffsLibrary.buffs as Effect[];
const debuffs = debuffsLibrary.debuffs as Effect[];

const effectRegistry = new Map<string, Effect>();
[...buffs, ...debuffs].forEach(effect => effectRegistry.set(effect.id, effect));

/** Pre-computed library: lists by type and an O(1) registry by ID. */
export const effectsLibrary = { buffs, debuffs, registry: effectRegistry };

/** O(1) lookup by effect ID. Primary lookup function. */
export const lookupEffect = (effectId: string): Effect | undefined =>
    effectRegistry.get(effectId);

/** Find an effect by display name. O(n); use sparingly. */
export const getEffectByName = (name: string): Effect | undefined =>
    [...effectRegistry.values()].find(effect => effect.name === name);

/** All effects of a given type (`buff` or `debuff`). */
export const getEffectsByType = (type: EffectType): Effect[] =>
    [...effectRegistry.values()].filter(effect => effect.type === type);
