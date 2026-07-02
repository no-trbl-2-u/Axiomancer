import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles } from '@/theme/runtime';

interface ScreenBgProps {
  children: React.ReactNode;
  scrollable?: boolean;
}

export function ScreenBg({ children, scrollable = true }: ScreenBgProps) {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.bg}>
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
