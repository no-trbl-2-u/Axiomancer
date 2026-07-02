import React from 'react';
import { Text, View } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

const DIAMOND_STRAND = '◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆ ◆';

interface ChainBarFixedProps {
    position: 'top' | 'bottom';
    label: string;
    accentColor: string;
}

export function ChainBarFixed({
    position,
    label,
    accentColor,
}: ChainBarFixedProps) {
    const styles = useStyles();
    return (
        <View
            style={[
                styles.chainBarFixed,
                position === 'top' ? styles.chainBarTop : styles.chainBarBottom,
            ]}
            testID="encounter-modal-chain"
            pointerEvents="none"
        >
            <Text
                style={[styles.chainDiamonds, { color: accentColor }]}
                numberOfLines={1}
                ellipsizeMode="clip"
            >
                {DIAMOND_STRAND}
            </Text>
            <Text style={[styles.chainText, { color: accentColor }]}>{label}</Text>
            <Text
                style={[styles.chainDiamonds, { color: accentColor }]}
                numberOfLines={1}
                ellipsizeMode="clip"
            >
                {DIAMOND_STRAND}
            </Text>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    chainBarFixed: {
        position: 'absolute',
        left: 4,
        right: 4,
        height: 18,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        backgroundColor: AXM.dockBg,
    },
    chainBarTop: {
        top: 4,
        borderBottomWidth: 1,
        borderBottomColor: AXM.bloodStrong,
    },
    chainBarBottom: {
        bottom: 4,
        borderTopWidth: 1,
        borderTopColor: AXM.bloodStrong,
    },
    chainDiamonds: {
        flex: 1,
        fontFamily: FONTS.mono,
        fontSize: 8,
        letterSpacing: 2,
        opacity: 0.85,
        overflow: 'hidden',
    },
    chainText: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 2.4,
        textAlign: 'center',
        paddingHorizontal: 6,
    },
}));