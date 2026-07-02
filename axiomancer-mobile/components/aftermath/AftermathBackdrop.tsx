/**
 * AftermathBackdrop — shared backdrop for aftermath modals
 *
 * Covers the entire viewport with non-dismissible backdrop behavior.
 * Provides the common styling foundation for all four aftermath modal
 * types. Follows the design handoff specification for backdrop handling.
 */

import React from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

import { usePalette } from '@/theme/runtime';

export interface AftermathBackdropProps {
    /** Child modal content */
    children: React.ReactNode;
    /** Background tint override */
    tint?: string;
    /** Whether to show diagonal hatch overlay */
    hatch?: boolean;
}

export default function AftermathBackdrop({
    children,
    tint,
    hatch = false,
}: AftermathBackdropProps) {
    const AXM = usePalette();
    // Non-dismissible: swallow tap-outside events
    const handleBackdropPress = () => {
        // Intentionally empty - no dismissal on tap-outside
    };

    return (
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <View style={[styles.backdrop, { backgroundColor: tint ?? AXM.deepBg }]}>
                {hatch && <View style={styles.hatchOverlay} />}
                <TouchableWithoutFeedback>
                    <View style={styles.content}>
                        {children}
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    hatchOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // Diagonal hatch pattern - would need custom implementation
        // or SVG pattern for full fidelity
        opacity: 0.3,
    },
    content: {
        width: 390,
        height: 844,
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
});