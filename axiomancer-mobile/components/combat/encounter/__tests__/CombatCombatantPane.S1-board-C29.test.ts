/**
 * CombatCombatantPane — fresh-eyes shard S1-board, cluster C29.
 *
 * The dark band behind the top HUD used to fade to nothing by 85% of the scene
 * band and then rise BACK to 0.4 ink, which the band's own hard bottom edge
 * sliced off: a horizontal seam ruled across the arena partway down the enemy
 * art. `combatTopScrimStops` is the scrim's stop table, and these cases pin the
 * shape that removes the seam — the tail runs all the way to the board's own
 * ground colour at full opacity, so the band's last row of pixels already IS
 * the paint behind it and there is nothing left to see an edge against.
 */

import { describe, expect, it } from '@jest/globals';

import { combatTopScrimStops } from '@/components/combat/encounter/CombatCombatantPane';

const INK = '#070509';     // AXM.deepBg — the HUD-legibility scrim ink
const GROUND = '#0b0a09';  // AXM.bg — what the pane sits on below the band

const stops = () => combatTopScrimStops(INK, GROUND);
const at = (offset: number) => stops().find((s) => s.offset === offset);

describe('S1-board-C29 — the top HUD scrim fades out instead of ending in an edge', () => {
    it('runs a well-formed table from the top of the band to its bottom', () => {
        const table = stops();
        expect(table.length).toBeGreaterThan(2);
        expect(table[0].offset).toBe(0);
        expect(table[table.length - 1].offset).toBe(1);
        for (let i = 1; i < table.length; i++) {
            expect(table[i].offset).toBeGreaterThan(table[i - 1].offset);
        }
        for (const s of table) {
            expect(s.opacity).toBeGreaterThanOrEqual(0);
            expect(s.opacity).toBeLessThanOrEqual(1);
        }
    });

    it('meets the board ground at the band edge, so no seam can show', () => {
        const last = stops()[stops().length - 1];
        expect(last.color).toBe(GROUND);
        expect(last.opacity).toBe(1);
    });

    it('no longer leaves the pre-fix step — transparent at 0.85, dark again at 1', () => {
        // The old table ended `{0.85, 0}` then `{1, 0.4}`: a dark tail with a
        // hard cut. Whatever the tail's shape now, it must be climbing into the
        // ground by the last third, never transparent at the very bottom.
        const table = stops();
        const tail = table.filter((s) => s.offset >= 0.66);
        expect(tail.length).toBeGreaterThan(0);
        for (let i = 1; i < tail.length; i++) {
            expect(tail[i].opacity).toBeGreaterThanOrEqual(tail[i - 1].opacity);
        }
        expect(table[table.length - 1].opacity).toBeGreaterThan(0.9);
    });

    it('keeps the HUD legible and the enemy art clear', () => {
        expect(at(0)!.color).toBe(INK);
        expect(at(0)!.opacity).toBeGreaterThanOrEqual(0.8);
        // Mid-band is where the foe is painted — the scrim all but vanishes.
        expect(at(0.5)!.opacity).toBeLessThanOrEqual(0.12);
    });
});
