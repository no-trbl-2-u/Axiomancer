/**
 * Grouped dev-tools surface — the body of the `/dev` route.
 *
 * Holds a live STATE inspector, XP / wallet / effect controls, the CARDS
 * section (lane test decks and the reward-pool lanes), world travel
 * to any map / node with its authored event, the labyrinth acts, an
 * any-foe enemy picker, every reward channel, real NPC trees, an item
 * picker, and run controls.
 *
 * Sections read top-down in the order a tester thinks: see state →
 * shape the player → shape the deck → stand somewhere → fight / play a
 * minigame → collect rewards → drive the story → tweak the UI → manage
 * the run and read the log. `testID`s: `dev-section-<key>`.
 *
 * Every section collapses: closed by default, its header toggles it, and
 * nothing is remembered — every entry to `/dev` opens on nine closed
 * headers, however the last visit was left. A closed section does not
 * mount its leaves.
 *
 * Every leaf is `React.lazy` so production bundles never import the
 * Debug* modules; the container also self-gates on `isDevToolsEnabled`.
 */

import React, { Suspense, lazy } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDevToolsEnabled } from '@/lib/buildProfile';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

/** Lazy-load a named export from a Debug* module (keeps prod bundles clean). */
const lazyNamed = <T extends React.ComponentType>(load: () => Promise<Record<string, unknown>>, name: string) =>
    lazy(() => load().then((m) => ({ default: m[name] as T })));

// ── STATE ──
const DebugStateInspector = lazyNamed(() => import('@/components/DebugStateInspector'), 'DebugStateInspector');
// ── PLAYER ──
const DebugXpGrant = lazyNamed(() => import('@/components/DebugXpGrant'), 'DebugXpGrant');
const DebugCurrencyControl = lazyNamed(() => import('@/components/DebugCurrencyControl'), 'DebugCurrencyControl');
const DebugEffectApply = lazyNamed(() => import('@/components/DebugEffectApply'), 'DebugEffectApply');
// ── DECKS & ITEMS ──
const DebugGetAllRelics = lazyNamed(() => import('@/components/DebugGetAllRelics'), 'DebugGetAllRelics');
const DebugItemPicker = lazyNamed(() => import('@/components/DebugItemPicker'), 'DebugItemPicker');
// ── CARDS ──
const DebugLaneDeck = lazyNamed(() => import('@/components/DebugLaneDeck'), 'DebugLaneDeck');
const DebugRewardPool = lazyNamed(() => import('@/components/DebugRewardPool'), 'DebugRewardPool');
// ── WORLD ──
const DebugWorldTravel = lazyNamed(() => import('@/components/DebugWorldTravel'), 'DebugWorldTravel');
// ── ENCOUNTERS ──
const DebugTriggerEncounter = lazyNamed(() => import('@/components/DebugTriggerEncounter'), 'DebugTriggerEncounter');
const DebugEnemyPicker = lazyNamed(() => import('@/components/DebugEnemyPicker'), 'DebugEnemyPicker');
const DebugSkipEvent = lazyNamed(() => import('@/components/DebugSkipEvent'), 'DebugSkipEvent');
// ── MINIGAMES & REWARDS ──
const DebugHazardButton = lazyNamed(() => import('@/components/DebugHazardButton'), 'DebugHazardButton');
const DebugRestButton = lazyNamed(() => import('@/components/DebugRestButton'), 'DebugRestButton');
const DebugBlacksmithButton = lazyNamed(() => import('@/components/DebugBlacksmithButton'), 'DebugBlacksmithButton');
const DebugRewardTriggers = lazyNamed(() => import('@/components/DebugRewardTriggers'), 'DebugRewardTriggers');
// ── STORY ──
const DebugDialogueJump = lazyNamed(() => import('@/components/DebugDialogueJump'), 'DebugDialogueJump');
// ── UI ──
// ── RUN & DIAGNOSTICS ──
const DebugRunControls = lazyNamed(() => import('@/components/DebugRunControls'), 'DebugRunControls');
const DebugLogViewer = lazyNamed(() => import('@/components/DebugLogViewer'), 'DebugLogViewer');
const DebugCrashTest = lazyNamed(() => import('@/components/DebugCrashTest'), 'DebugCrashTest');

function LoadingFallback() {
    const AXM = usePalette();
    return (
        <View style={{ padding: 8 }} testID="dev-tools-loading">
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone }}>Loading debug tools...</Text>
        </View>
    );
}

/**
 * One titled, dashed-border group of leaves; its header opens and closes it.
 *
 * `open` is plain route-local state: leaving `/dev` unmounts it, so the next
 * visit starts closed. Nothing is hoisted to module scope on purpose — an
 * open set that outlived the route meant one session of poking left every
 * header open for the life of the app, which is the whole of the clutter.
 */
function DevSection({ label, hint, testID, children }: { label: string; hint: string; testID: string; children: React.ReactNode }) {
    const styles = useStyles();
    const [open, setOpen] = React.useState(false);
    const toggle = () => setOpen((was) => !was);
    return (
        <View style={styles.section} testID={testID}>
            <Pressable
                accessibilityRole="button"
                aria-expanded={open}
                onPress={toggle}
                style={[styles.sectionHeader, open && styles.sectionHeaderOpen]}
                testID={`${testID}-toggle`}
            >
                <Text style={styles.sectionLabel}>{open ? '▾' : '▸'} {label}</Text>
                <Text style={styles.sectionHint}>{hint}</Text>
            </Pressable>
            {open && (
                <View style={styles.sectionBody}>
                    {/* Per section, so opening one does not blank the menu while it loads. */}
                    <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
                </View>
            )}
        </View>
    );
}

/** The grouped dev controls. Mounted by the `/dev` route. */
export function DevToolsSections() {
    const styles = useStyles();
    if (!isDevToolsEnabled()) return null;

    return (
        <View style={styles.root} testID="dev-tools-sections">
            <DevSection label="STATE" hint="see everything" testID="dev-section-state">
                <DebugStateInspector />
            </DevSection>

            <DevSection label="PLAYER" hint="xp · wallet · effects" testID="dev-section-player">
                <DebugXpGrant />
                <DebugCurrencyControl />
                <DebugEffectApply />
            </DevSection>

            <DevSection label="DECKS & ITEMS" hint="satchel" testID="dev-section-decks">
                <DebugGetAllRelics />
                <DebugItemPicker />
            </DevSection>

            <DevSection label="CARDS" hint="lane deck · reward pool" testID="dev-section-cards">
                <DebugLaneDeck />
                <DebugRewardPool />
            </DevSection>

            <DevSection label="WORLD" hint="any map · any node · the labyrinth" testID="dev-section-world">
                <DebugWorldTravel />
            </DevSection>

            <DevSection label="ENCOUNTERS" hint="quick triggers · any foe · skip" testID="dev-section-encounters">
                <DebugTriggerEncounter />
                <DebugEnemyPicker />
                <DebugSkipEvent />
            </DevSection>

            <DevSection label="MINIGAMES & REWARDS" hint="hazard · rest · anvil · reliquary · journal" testID="dev-section-rewards">
                <DebugHazardButton />
                <DebugRestButton />
                <DebugBlacksmithButton />
                <DebugRewardTriggers />
            </DevSection>

            <DevSection label="STORY" hint="real NPC trees" testID="dev-section-story">
                <DebugDialogueJump />
            </DevSection>

            <DevSection label="RUN & DIAGNOSTICS" hint="save · reset · galleries · log · crash test" testID="dev-section-run">
                <DebugRunControls />
                <DebugLogViewer />
                <DebugCrashTest />
            </DevSection>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { gap: 12 },
    section: {
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
        backgroundColor: AXM.panelBg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 10,
        gap: 8,
    },
    sectionHeaderOpen: {
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
        borderStyle: 'dashed',
    },
    sectionLabel: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 2, color: AXM.sulfur },
    sectionHint: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, flexShrink: 1, textAlign: 'right' },
    sectionBody: { paddingTop: 4, paddingBottom: 6 },
}));
