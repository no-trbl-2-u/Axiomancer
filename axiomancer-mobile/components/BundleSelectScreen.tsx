/**
 * Starter-bundle selection — the pre-run "choose your path" screen.
 *
 * Shown once, after EMBARK, to a brand-new player (no skills seeded, no bundle
 * flag). The chosen bundle seeds the starter deck and tags the run with a
 * HIDDEN archetype (never shown here) that biases later card rewards. Returning
 * players never see this; `ensureStarterSkills` is the safety net if skipped.
 */

import { View, Text, Pressable, ScrollView } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import { getCard } from 'axiomancer-mechanics';
import { STARTER_BUNDLES, type StarterBundle } from '@/state/combat/store-actions';

// Accent per path, aligned to the stance palette (Heart purple / Body red /
// Mind blue) so the colour language is consistent with combat.
const ARCHETYPE_ACCENT: Record<string, string> = {
    bleeder: '#9a5fd0',
    guardian: '#d6543f',
    controller: '#4f7fd6',
};

interface BundleSelectScreenProps {
    onPick: (bundleId: string) => void;
}

export function BundleSelectScreen({ onPick }: BundleSelectScreenProps) {
    const styles = useStyles();
    return (
        <View style={styles.root} testID="bundle-select">
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.eyebrow}>CHOOSE YOUR PATH</Text>
                <Text style={styles.sub}>
                    Your starter cards set the shape of your run. You can find more as you go.
                </Text>
                {STARTER_BUNDLES.map((b: StarterBundle) => {
                    const accent = ARCHETYPE_ACCENT[b.archetype] ?? '#d4c026';
                    return (
                        <Pressable
                            key={b.id}
                            onPress={() => onPick(b.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Choose ${b.name}. ${b.description}`}
                            testID={`bundle-${b.id}`}
                            style={({ pressed }) => [
                                styles.tile,
                                { borderColor: accent },
                                pressed && styles.tilePressed,
                            ]}
                        >
                            <Text style={[styles.tileName, { color: accent }]}>{b.name}</Text>
                            <Text style={styles.tileDesc}>{b.description}</Text>
                            <View style={styles.pills}>
                                {b.pills.map((p) => (
                                    <Text key={p} style={[styles.pill, { color: accent, borderColor: accent }]}>{p}</Text>
                                ))}
                            </View>
                            <Text style={styles.cards} numberOfLines={2}>
                                {b.cardIds.map((id) => getCard(id)?.name).filter(Boolean).join(' · ')}
                            </Text>
                            <Text style={[styles.choose, { color: accent }]}>CHOOSE ›</Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: { flex: 1, backgroundColor: AXM.bg },
    scroll: { padding: 22, paddingTop: 64, paddingBottom: 48 },
    eyebrow: { fontFamily: FONTS.sans, fontSize: 13, letterSpacing: 3, color: AXM.sulfur, textAlign: 'center' },
    sub: {
        fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 13, color: AXM.bone,
        textAlign: 'center', marginTop: 8, marginBottom: 22, lineHeight: 18, maxWidth: 340, alignSelf: 'center',
    },
    tile: { borderWidth: 1.5, borderRadius: 4, padding: 16, marginBottom: 14, backgroundColor: 'rgba(0,0,0,0.35)' },
    tilePressed: { backgroundColor: 'rgba(255,255,255,0.05)' },
    tileName: { fontFamily: FONTS.gothic, fontSize: 20, letterSpacing: 0.5 },
    tileDesc: { fontFamily: FONTS.serif, fontSize: 13, color: AXM.parchment, marginTop: 5, lineHeight: 18 },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
    pill: {
        fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, borderWidth: 1, borderRadius: 2,
        paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden',
    },
    cards: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 11, color: AXM.bone, marginTop: 10, lineHeight: 15 },
    choose: { fontFamily: FONTS.sans, fontSize: 13, letterSpacing: 1.5, marginTop: 12, textAlign: 'right' },
}));
