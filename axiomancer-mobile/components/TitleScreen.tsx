import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Image } from '@/lib/platform/image';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

// The throne-room key art doubles as the launcher icon; here it anchors
// the top of the title screen and the painted "AxiomanceR" wordmark
// carries the brand.
const TITLE_ART = require('@/assets/images/title-embark.jpg');

export interface TitleScrimStop { offset: number; opacity: number; }

/**
 * The bottom scrim's gradient stop table, top of the scrim (0) to the
 * screen's foot (1).
 *
 * Purpose: a continuous ramp, so no edge shows. The scrim was three flat
 * bands; on a desktop window their edges ran straight across the king's
 * crown and beard (CRITIQUE pass 74). It starts fully clear, so its top has
 * no seam either, and holds the old bottom band's 0.9 darkness over the
 * lower fifth, where the CTA sits.
 *
 * Output: the ordered stop table for the scrim's LinearGradient.
 */
export function titleScrimStops(): readonly TitleScrimStop[] {
  return [
    { offset: 0, opacity: 0 },
    { offset: 0.25, opacity: 0.18 },
    { offset: 0.5, opacity: 0.52 },
    { offset: 0.67, opacity: 0.8 },
    { offset: 0.8, opacity: 0.9 },
    { offset: 1, opacity: 0.94 },
  ];
}

interface TitleScreenProps {
  onContinue: () => void;
}

/**
 * TitleScreen — the launch screen presenter: key art, the tagline, the
 * EMBARK call-to-action and the closing flavour line.
 *
 * Inputs: `onContinue` — invoked once the player commits to EMBARK (the
 * index route then shows the main menu).
 * Output: the title screen element tree (no state of its own).
 *
 * Resolves DECISION-5 (rows C-103, C-105): `leagues` is a unit of
 * distance, not a proper noun, so the tagline says "the leagues beyond"
 * in lower case. The step-card column
 * header keeps its all-caps LEAGUES; that is a header, not prose.
 */
export function TitleScreen({ onContinue }: TitleScreenProps) {
  const styles = useStyles();
  const AXM = usePalette();

  // EMBARK does not seed the character. It only hands off to the main
  // menu; a new game starts with
  // nothing in every build, and the `/dev` route seeds on demand.
  const handleStartGame = () => {
    onContinue();
  };

  return (
    <View style={styles.container}>
      {/* The source art is a 1024x1024 square with the painted
          "AxiomanceR" wordmark near its top edge. A full-bleed
          `cover` fit on a narrow/tall phone viewport scales the
          square up to match screen height, which crops both sides
          — cutting the wordmark's leading "A" and trailing "R".
          `contain` keeps the whole square (wordmark included)
          intact at full width instead; the container's own dark
          background fills the space below it, which the scrim
          already darkens toward for the CTA panel. */}
      {/* `contain` ends the square plate in a ruled line
          straight across the figures, with flat ground beneath it — a
          seam, not an edge. The art sits in its own square wrapper
          so a short ramp of ground-coloured bands can be anchored to
          the ART's own foot (not the screen's), dissolving that line at
          any viewport height. */}
      <View style={styles.artWrap} pointerEvents="none">
        <Image
          source={TITLE_ART}
          style={styles.artImage}
          contentFit="contain"
          contentPosition="top center"
          accessibilityLabel="A crowned king enthroned beside a horned axiomancer in a stained-glass hall"
        />
        <View style={styles.artFoot}>
          <View style={[styles.artFootBand, styles.artFootBand1]} />
          <View style={[styles.artFootBand, styles.artFootBand2]} />
          <View style={[styles.artFootBand, styles.artFootBand3]} />
          <View style={[styles.artFootBand, styles.artFootBand4]} />
          <View style={[styles.artFootBand, styles.artFootBand5]} />
          <View style={[styles.artFootBand, styles.artFootBand6]} />
          <View style={[styles.artFootBand, styles.artFootBand7]} />
        </View>
      </View>

      {/* Bottom scrim so the call-to-action reads over the art. */}
      <View style={styles.scrim} pointerEvents="none" testID="title-scrim">
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <LinearGradient id="axmTitleScrim" x1="0" y1="0" x2="0" y2="1">
              {titleScrimStops().map((st) => (
                <Stop key={st.offset} offset={st.offset} stopColor={AXM.bg} stopOpacity={st.opacity} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#axmTitleScrim)" />
        </Svg>
      </View>

      {/* Call to action */}
      <View style={styles.content}>
        <Text style={styles.tagline}>
          The cursed lands await. Carry your ancient knowledge and cold
          iron into the leagues beyond.
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
          <Text style={styles.embarkHint}>begin the pilgrimage</Text>
        </Pressable>

        <Text style={styles.footerText}>
          Your path begins on the coast, at a windmill above the
          breakwater.
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
  // Square art pinned to the top edge, full width — see the
  // `contentFit="contain"` comment above for why this replaces
  // absoluteFill+cover.
  artWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    aspectRatio: 1,
  },
  artImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // The feathered foot of the plate. Seven bands of the
  // page ground over the art's own lower quarter, the last fully opaque,
  // so the image has already become the field by the time it ends. Seven
  // so the step stays finer than the eye picks out over ~90px.
  artFoot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '24%',
    justifyContent: 'flex-end',
  },
  artFootBand: {
    height: '14.28%',
    backgroundColor: AXM.bg,
  },
  artFootBand1: { opacity: 0.08 },
  artFootBand2: { opacity: 0.2 },
  artFootBand3: { opacity: 0.35 },
  artFootBand4: { opacity: 0.52 },
  artFootBand5: { opacity: 0.71 },
  artFootBand6: { opacity: 0.89 },
  artFootBand7: { opacity: 1 },
  // A real gradient (SVG), fading the art into the dark CTA panel; see
  // `titleScrimStops`.
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
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
