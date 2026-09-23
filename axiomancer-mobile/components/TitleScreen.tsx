import { View, Text, Pressable } from 'react-native';
import { Image } from '@/lib/platform/image';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

// The throne-room key art doubles as the launcher icon; here it anchors
// the top of the title screen and the painted "AxiomanceR" wordmark
// carries the brand.
const TITLE_ART = require('@/assets/images/title-embark.jpg');

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
 * in lower case — matching the map compass hint, which already reads
 * "N ↑ · leagues · drag · pinch". The step-card column
 * header keeps its all-caps LEAGUES; that is a header, not prose.
 */
export function TitleScreen({ onContinue }: TitleScreenProps) {
  const styles = useStyles();

  // Owner call 2026-09-23 (THE VERY START): EMBARK no longer dev-seeds the
  // character. It only hands off to the main menu; a new game starts with
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
          bands already darken toward for the CTA panel. */}
      {/* S4-world-C22: `contain` ends the square plate in a ruled line
          straight across the figures, with flat ground beneath it — a
          seam, not an edge. The art now sits in its own square wrapper
          so a short ramp of ground-coloured bands can be anchored to
          the ART's own foot (not the screen's), dissolving that line at
          any viewport height. Same no-gradient-dependency trick as the
          scrim below. */}
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
      <View style={styles.scrim} pointerEvents="none">
        <View style={styles.scrimBand1} />
        <View style={styles.scrimBand2} />
        <View style={styles.scrimBand3} />
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
  // The feathered foot of the plate (S4-world-C22). Seven bands of the
  // page ground over the art's own lower quarter, the last fully opaque,
  // so the image has already become the field by the time it ends. Seven
  // rather than the scrim's three: the scrim ramps over half a screen
  // where a coarse step reads as atmosphere, this one ramps over ~90px
  // where the same step would read as a stripe.
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
