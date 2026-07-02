/**
 * Spec 26 / 26b — Combat encounter screen (DEV route).
 *
 * Phase 200: the combat surface itself now lives in the reusable
 * `<CombatEncounterPanel>` so the LIVE map flow can host it in-place inside
 * the encounter modal. This route is the dev-only launcher: it bootstraps a
 * mock foe + demo deck and does NOT persist the outcome (a sandbox), so
 * playing here never mutates the real player's progression. The live map
 * path (EncounterModalOverlay) feeds the panel the real enemy + player and
 * sets `persistOutcome`.
 *
 * Turn flow (Spec 26b): reveal → roll 2 → DRAFT one (the other → ◆) → POWER a
 * card with your stance die → END TURN to re-roll → END PHASE to resolve.
 */

import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenBg } from '@/components/ScreenBg';
import { CombatEncounterPanel } from '@/components/combat/encounter/CombatEncounterPanel';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { useGameState } from '@/state/GameStoreProvider';
import { makeStyles } from '@/theme/runtime';

function readSeed(explicit?: string): number {
    const g = (globalThis as { __AXM_COMBAT_SEED__?: number }).__AXM_COMBAT_SEED__;
    if (typeof g === 'number') return g;
    const n = explicit ? Number(explicit) : NaN;
    return Number.isFinite(n) ? n : 12025;
}

// Dev/e2e-only deck override. Mirrors `readSeed`'s `__AXM_COMBAT_SEED__`
// test-global pattern: a browser harness can pin the demo deck (e.g. to
// surface a defend/GUARD card or a gold card) by setting
// `globalThis.__AXM_COMBAT_DECK__` before this sandbox route boots. Inert
// in production — nothing sets the global there, and this route is dev-only.
function readDeckOverride(): string[] | undefined {
    const g = (globalThis as { __AXM_COMBAT_DECK__?: unknown }).__AXM_COMBAT_DECK__;
    return Array.isArray(g) && g.every((x) => typeof x === 'string') ? (g as string[]) : undefined;
}

const DEMO_SKILLS = ['slippery-slope', 'eternal-regress', 'achilles-gambit', 'befriend'];
function withDemoDeck<T extends { knownSkills?: string[]; baseStats?: { heart: number; body: number; mind: number }; health?: number; maxHealth?: number }>(player: T): T {
    const known = player.knownSkills ?? [];
    if (known.length >= 3) return player;
    return { ...player, knownSkills: Array.from(new Set([...known, ...DEMO_SKILLS])), baseStats: { heart: 12, body: 12, mind: 12 }, health: 160, maxHealth: 160 };
}

export default function CombatEncounterScreen() {
    const styles = useStyles();
    const router = useRouter();
    const params = useLocalSearchParams<{ seed?: string; tutorial?: string }>();
    const player = useGameState((s) => s.player);

    if (!player) {
        return <ScreenBg><View style={styles.root} testID="combat-encounter-empty" /></ScreenBg>;
    }

    // Dev/e2e deck override (see `readDeckOverride`): when pinned, the overridden
    // ids are also marked known so the player's archetype/signatures resolve
    // against them. Inert without the global.
    const deckOverride = readDeckOverride();
    const base = withDemoDeck(player);
    const bootstrapPlayer = deckOverride
        ? { ...base, knownSkills: Array.from(new Set([...(base.knownSkills ?? []), ...deckOverride])) }
        : base;

    return (
        // scrollable={false}: the combat board is a full-bleed game surface —
        // inside the default ScrollView its flex regions collapse to intrinsic
        // height and the battlefield squashes into the top half of the screen.
        <ScreenBg scrollable={false}>
            <View style={styles.root}>
                <CombatEncounterPanel
                    enemy={createMockEncounterEnemy()}
                    bootstrapPlayer={bootstrapPlayer}
                    deck={deckOverride}
                    seed={readSeed(params.seed)}
                    forceTutorial={params.tutorial === '1'}
                    persistOutcome={false}
                    onExit={() => { if (router.canGoBack()) router.back(); }}
                />
            </View>
        </ScreenBg>
    );
}

const useStyles = makeStyles(() => ({
    root: { flex: 1 },
}));
