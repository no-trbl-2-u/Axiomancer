import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle as SvgCircle, Defs as SvgDefs, RadialGradient as SvgRadialGradient, Stop as SvgStop } from 'react-native-svg';
import { usePalette } from '@/theme/runtime';

interface ModalRivetProps {
    position: 'tl' | 'tr' | 'bl' | 'br';
}

export function ModalRivet({ position }: ModalRivetProps) {
    const AXM = usePalette();
    const offsetStyle =
        position === 'tl' ? styles.rivetTL :
        position === 'tr' ? styles.rivetTR :
        position === 'bl' ? styles.rivetBL :
        styles.rivetBR;
    return (
        <View style={[styles.rivetWrap, offsetStyle]} pointerEvents="none">
            <Svg width={8} height={8} viewBox="0 0 8 8">
                <SvgDefs>
                    <SvgRadialGradient id="rivetFill" cx="35%" cy="30%" r="65%">
                        <SvgStop offset="0%" stopColor={AXM.bone} />
                        <SvgStop offset="60%" stopColor={AXM.ash} />
                        <SvgStop offset="100%" stopColor={AXM.bg} />
                    </SvgRadialGradient>
                </SvgDefs>
                <SvgCircle cx={4} cy={4} r={3.5} fill="url(#rivetFill)" stroke={AXM.bg} strokeWidth={0.5} />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    rivetWrap: {
        position: 'absolute',
        width: 8,
        height: 8,
        zIndex: 5,
    },
    rivetTL: { top: 6, left: 6 },
    rivetTR: { top: 6, right: 6 },
    rivetBL: { bottom: 6, left: 6 },
    rivetBR: { bottom: 6, right: 6 },
});