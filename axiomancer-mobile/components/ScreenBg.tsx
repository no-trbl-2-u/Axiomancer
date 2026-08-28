import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Image } from '@/lib/platform/image';
import { screenBackdropFor, type ScreenArtKey } from '@/assets/images/screens';
import { makeStyles } from '@/theme/runtime';

interface ScreenBgProps {
  children: React.ReactNode;
  scrollable?: boolean;
  /**
   * Optional backdrop plate (phase V5). Screens opt IN: a backdrop under a
   * dense inventory table is noise, so a screen with no key keeps the flat
   * ground it has always had.
   */
  art?: ScreenArtKey;
}

export function ScreenBg({ children, scrollable = true, art }: ScreenBgProps) {
  const styles = useStyles();
  const plate = screenBackdropFor(art);
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.bg}>
        {/* The engraving, dimmed so copy keeps contrast — dim, never blur.
            The opacity and fit are lifted verbatim from MapCanvas's backdrop:
            two screens dimming art two different ways is exactly the drift a
            shared component exists to prevent, and the map's numbers are the
            ones that survived a critique pass. */}
        {plate != null && (
          <Image
            source={plate}
            style={styles.plate}
            contentFit="cover"
            testID="screen-backdrop"
          />
        )}
        {/* The vignette is NOT the dim. Dimming keeps text legible over the
            middle; this keeps the plate from ending in a hard rectangle
            against the panel chrome. Separate problems, separate knobs. */}
        {plate != null && <View style={styles.vignette} pointerEvents="none" />}
        {scrollable ? (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {children}
            <View style={styles.bottomPad} />
          </ScrollView>
        ) : (
          <View style={styles.fill}>{children}</View>
        )}
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((AXM) => ({
  safe: {
    flex: 1,
    backgroundColor: AXM.bg,
  },
  bg: {
    flex: 1,
    backgroundColor: AXM.bg,
  },
  plate: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderColor: AXM.bg,
    // A thick inner border reads as a soft edge once the plate is at 0.2 and
    // costs nothing — no gradient dependency, no extra draw pass.
    borderWidth: 28,
    borderRadius: 24,
  },
  scroll: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  bottomPad: {
    height: 20,
  },
}));
