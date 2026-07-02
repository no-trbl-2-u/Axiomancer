import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import { useGameActions } from '@/state/GameStoreProvider';

// The throne-room key art doubles as the launcher icon; here it fills
// the title screen and the painted "AxiomanceR" wordmark carries the brand.
const TITLE_ART = require('@/assets/images/title-embark.jpg');

interface TitleScreenProps {
  onContinue: () => void;
}

export function TitleScreen({ onContinue }: TitleScreenProps) {
  const styles = useStyles();
  const actions = useGameActions();

  const handleStartGame = () => {
    // Seed the game with basic starter equipment/stats if needed
    if (__DEV__) {
      actions.debugSeed();
    }
    onContinue();
  };

  return (
    <View style={styles.container}>
      {/* Full-bleed key art — anchored to the top so the painted
          wordmark stays in frame on tall portrait screens. */}
      <Image
        source={TITLE_ART}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="top center"
        accessibilityLabel="A crowned king enthroned beside a horned axiomancer in a stained-glass hall"
      />

      {/* Bottom scrim so the call-to-action reads over the art. */}
      <View style={styles.scrim} pointerEvents="none">
        <View style={styles.scrimBand1} />
        <View style={styles.scrimBand2} />
        <View style={styles.scrimBand3} />
      </View>

      {/* Call to action */}
      <View style={styles.content}>
        <Text style={styles.tagline}>
          The cursed lands await. Carry your ancient knowledge and modern
          steel into the LEAGUES beyond.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.embarkButton,
            pressed && styles.embarkButtonPressed,
          ]}
          onPress={handleStartGame}
          accessibilityRole="button"
          accessibilityLabel="Embark on your journey"
        >
          <Text style={styles.embarkButtonText}>EMBARK…</Text>
          <Text style={styles.embarkHint}>tap a glowing node on the map to begin</Text>
        </Pressable>

        <Text style={styles.footerText}>
          Your path begins in the fishing village, where travelers gather
          before venturing into the realms beyond.
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((AXM) => ({
  container: {
    flex: 1,
    backgroundColor: AXM.bg,
    justifyContent: 'flex-end',
  },
  // Stacked translucent bands fake a bottom-up gradient without an
  // extra gradient dependency, fading the art into the dark CTA panel.
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    justifyContent: 'flex-end',
  },
  scrimBand1: {
    height: '34%',
    backgroundColor: 'rgba(10,10,10,0.25)',
  },
  scrimBand2: {
    height: '33%',
    backgroundColor: 'rgba(10,10,10,0.6)',
  },
  scrimBand3: {
    height: '33%',
    backgroundColor: 'rgba(10,10,10,0.9)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 48,
    gap: 22,
  },
  tagline: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    color: AXM.parchment,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 340,
    // Keep the line legible where it crosses brighter art.
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  embarkButton: {
    backgroundColor: AXM.sulfur,
    paddingVertical: 16,
    paddingHorizontal: 56,
    borderWidth: 1,
    borderColor: AXM.parchment,
    // Lift the CTA off the dark field with an accent glow.
    shadowColor: AXM.sulfur,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  embarkButtonPressed: {
    backgroundColor: AXM.rust,
    borderColor: AXM.parchment,
  },
  embarkButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 20,
    color: AXM.bg,
    letterSpacing: 4,
    textAlign: 'center',
  },
  embarkHint: {
    fontFamily: FONTS.serifItalic,
    fontSize: 11,
    color: AXM.bg,
    letterSpacing: 0.5,
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 4,
  },
  footerText: {
    fontFamily: FONTS.serifItalic,
    fontSize: 12,
    color: AXM.bone,
    textAlign: 'center',
    lineHeight: 17,
    opacity: 0.85,
    maxWidth: 320,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
}));
