/**
 * Phase 169 — Curated Combat Deck: loadout persistence codec.
 *
 * The player's curated combat loadout is an ordered list of skill ids
 * persisted on `GameState.flags` via a `combat-loadout-card:` prefix —
 * exact mirror of the Hazard deck-flags codec (`hazard.deck-flags.ts`).
 *
 * Encoding: one flag per slot, `combat-loadout-card:<skillId>:<n>` where
 * `<n>` disambiguates duplicate copies (`combat-loadout-card:slippery-slope:1`,
 * `combat-loadout-card:slippery-slope:2`, …). Decode order mirrors insertion
 * order (flag-array order is preserved by the Zustand store).
 *
 * When no loadout flags exist `getCombatLoadout` returns `[]` and
 * `buildCombatDeck` falls back to `player.knownSkills` — full backwards
 * compatibility with saves that pre-date Phase 169.
 */

export const COMBAT_LOADOUT_FLAG_PREFIX = 'combat-loadout-card:';

/** Maximum number of cards in the curated loadout. */
export const COMBAT_LOADOUT_MAX = 20;

/** Decodes the ordered loadout from `GameState.flags`. Returns [] when no
 *  loadout flags are present (caller falls back to knownSkills). */
export function decodeCombatLoadout(flags: readonly string[]): string[] {
    const out: string[] = [];
    for (const flag of flags) {
        if (!flag.startsWith(COMBAT_LOADOUT_FLAG_PREFIX)) continue;
        const rest = flag.slice(COMBAT_LOADOUT_FLAG_PREFIX.length);
        const sep = rest.lastIndexOf(':');
        out.push(sep === -1 ? rest : rest.slice(0, sep));
    }
    return out;
}

/** Convenience alias for `decodeCombatLoadout` — the canonical read API. */
export const getCombatLoadout = decodeCombatLoadout;

/** Returns `flags` with `cardId` appended to the loadout.
 *  No-ops if the loadout is already at `COMBAT_LOADOUT_MAX` capacity. */
export function addToLoadout(flags: readonly string[], cardId: string): string[] {
    if (decodeCombatLoadout(flags).length >= COMBAT_LOADOUT_MAX) return flags.slice();
    const copies = flags.filter(
        (f) => f.startsWith(`${COMBAT_LOADOUT_FLAG_PREFIX}${cardId}:`),
    ).length;
    return [...flags, `${COMBAT_LOADOUT_FLAG_PREFIX}${cardId}:${copies + 1}`];
}

/** Returns `flags` with the first occurrence of `cardId` removed from the
 *  loadout. No-ops when the card is not in the loadout. */
export function removeFromLoadout(flags: readonly string[], cardId: string): string[] {
    let removed = false;
    return flags.filter((flag) => {
        if (removed) return true;
        if (!flag.startsWith(`${COMBAT_LOADOUT_FLAG_PREFIX}${cardId}:`)) return true;
        removed = true;
        return false;
    });
}
