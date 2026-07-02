/**
 * ErrorFallbackModal — "the binding tore" error fallback screen
 *
 * Dev-facing fallback modal that stays in-world. Features hatch overlay,
 * gothic title, error code as chapter marker, technical details panel
 * with copy functionality, and dual action buttons.
 */

import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View, ScrollView, Alert } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import AftermathBackdrop from './AftermathBackdrop';
import { TornPanel } from '@/components/TornPanel';

export interface ErrorFallbackModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** In-world error code */
    errorCode: string;
    /** Raw technical error string */
    technical: string;
    /** Optional author note/hint */
    hint?: string;
    /** Copy to clipboard handler */
    onCopy: () => void;
    /** Retry action handler */
    onRetry: () => void;
    /** Return to main menu handler */
    onReturnHome: () => void;
}

export default function ErrorFallbackModal({
    visible,
    errorCode,
    technical,
    hint,
    onCopy,
    onRetry,
    onReturnHome,
}: ErrorFallbackModalProps) {
    const AXM = usePalette();
    const styles = useStyles();
    const [copyPressed, setCopyPressed] = useState(false);

    if (!visible) {
        return null;
    }

    const handleCopyPress = async () => {
        try {
            // In a full implementation, this would use Clipboard.setString
            // For now, show the technical text in an alert for dev purposes
            Alert.alert('Technical Details', technical);
            setCopyPressed(true);
            onCopy();
            
            // Reset pressed state after brief flash
            setTimeout(() => {
                setCopyPressed(false);
            }, 200);
        } catch {
            // Silently handle errors
            onCopy();
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <AftermathBackdrop hatch={true} tint={AXM.panelBg}>
                <View style={styles.container}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Gothic title with blood drop-shadow */}
                        <Text style={[styles.title, { fontFamily: FONTS.gothic }]}>
                            THE BINDING TORE
                        </Text>

                        {/* Error code as chapter marker */}
                        <Text style={[styles.errorCode, { fontFamily: FONTS.sans, color: AXM.rust }]}>
                            {errorCode}
                        </Text>

                        {/* Technical details panel */}
                        <TornPanel style={styles.technicalPanel}>
                            <View style={styles.panelHeader}>
                                <TouchableOpacity 
                                    style={[
                                        styles.copyButton,
                                        copyPressed && styles.copyButtonPressed
                                    ]} 
                                    onPress={handleCopyPress}
                                    accessibilityRole="button"
                                    accessibilityLabel="Copy error details"
                                >
                                    <Text style={[
                                        styles.copyButtonText, 
                                        { fontFamily: FONTS.sans },
                                        copyPressed && { color: AXM.sulfur }
                                    ]}>
                                        ✎ COPY
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            
                            <Text style={[styles.technicalText, { fontFamily: FONTS.mono }]}>
                                {technical}
                            </Text>
                        </TornPanel>

                        {/* Optional hint message */}
                        {hint && (
                            <Text style={[
                                styles.hint, 
                                { fontFamily: FONTS.serifItalic, color: AXM.bone }
                            ]}>
                                {hint}
                            </Text>
                        )}

                        {/* Action buttons */}
                        <View style={styles.buttonSection}>
                            <TouchableOpacity 
                                style={styles.retryButton} 
                                onPress={onRetry}
                                accessibilityRole="button"
                                accessibilityLabel="Try again"
                            >
                                <Text style={[styles.retryButtonText, { fontFamily: FONTS.gothic }]}>
                                    ✠ TRY AGAIN
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.homeButton} 
                                onPress={onReturnHome}
                                accessibilityRole="button"
                                accessibilityLabel="Return to the hearth"
                            >
                                <Text style={[styles.homeButtonText, { fontFamily: FONTS.serifItalic }]}>
                                    return to the hearth
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Comfort message */}
                        <Text style={[
                            styles.comfortMessage, 
                            { fontFamily: FONTS.sans, color: AXM.bone }
                        ]}>
                            the chronicle is incomplete — but not lost.
                        </Text>
                    </ScrollView>
                </View>
            </AftermathBackdrop>
        </Modal>
    );
}

const useStyles = makeStyles((AXM) => ({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 40,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        lineHeight: 38,
        textAlign: 'center',
        color: AXM.parchment,
        marginBottom: 16,
        // Blood drop-shadow like combat outcome panel
        textShadowColor: AXM.blood,
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 3,
        letterSpacing: 0.5,
    },
    errorCode: {
        fontSize: 12,
        letterSpacing: 0.1,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 16,
    },
    technicalPanel: {
        marginHorizontal: 16,
        marginBottom: 24,
        padding: 16,
        backgroundColor: AXM.deepBg,
        position: 'relative',
    },
    panelHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 12,
    },
    copyButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    copyButtonPressed: {
        backgroundColor: AXM.sulfurMed,
    },
    copyButtonText: {
        fontSize: 12,
        color: AXM.bone,
        letterSpacing: 0.1,
        lineHeight: 16,
    },
    technicalText: {
        fontSize: 14,
        lineHeight: 18,
        color: AXM.parchmentDim,
        // Allow text wrapping for long error messages
        flexWrap: 'wrap',
    },
    hint: {
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'center',
        marginHorizontal: 16,
        marginBottom: 32,
        // Like a scribe's apology in the margin
    },
    buttonSection: {
        paddingHorizontal: 16,
        marginBottom: 32,
    },
    retryButton: {
        backgroundColor: AXM.silhouette,
        borderWidth: 2,
        borderColor: AXM.parchment,
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    retryButtonText: {
        color: AXM.parchment,
        fontSize: 16,
        letterSpacing: 2,
        textAlign: 'center',
        lineHeight: 20,
    },
    homeButton: {
        backgroundColor: 'transparent',
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    homeButtonText: {
        color: AXM.bone,
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 20,
        // Ghost button, lowercase per spec
    },
    comfortMessage: {
        fontSize: 12,
        letterSpacing: 0.1,
        textAlign: 'center',
        lineHeight: 16,
        paddingHorizontal: 16,
    },
}));