/**
 * PixelHeartEmblem — 16x16 pixel art heart for friendship modal
 *
 * Renders the friendship modal's distinctive 8-bit heart emblem as
 * specified in the design prompt. This is the only pixel art element
 * in the entire app - a deliberate aesthetic break for the "old friend
 * codices" lore motif.
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { usePalette } from '@/theme/runtime';

export interface PixelHeartEmblemProps {
    /** Size of each pixel cell (default 12px for 192px total) */
    cellSize?: number;
}

export default function PixelHeartEmblem({ cellSize = 12 }: PixelHeartEmblemProps) {
    const AXM = usePalette();
    const gridSize = 16;
    const totalSize = gridSize * cellSize;

    // 16x16 pixel heart pattern - red heart with white handshake in center
    // Heart fill: AXM.blood, shadow: darker red, highlight: white, sparkle: sulfur
    const heartPixels = [
        // Row 0-3: Heart top curves
        '0000011001100000',
        '0001111111110000', 
        '0011111111111000',
        '0111111111111100',
        // Row 4-7: Heart body with handshake area
        '0111111111111100',
        '0111110110111100',
        '0111101001011100',
        '0111110110111100',
        // Row 8-11: Heart taper
        '0111111111111100',
        '0011111111111000',
        '0001111111110000',
        '0000111111100000',
        // Row 12-15: Heart point
        '0000011111000000',
        '0000001110000000',
        '0000000100000000',
        '0000000000000000',
    ];

    // Handshake pixels (white) - overlay on heart
    const handshakePixels = [
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000001001000000',
        '0000010110100000',
        '0000001001000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
    ];

    // Sparkle pixel (sulfur) - top right of heart
    const sparklePixels = [
        '0000000000000001',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
    ];

    const renderPixelGrid = () => {
        const pixels = [];
        
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const heart = heartPixels[row]?.[col] === '1';
                const handshake = handshakePixels[row]?.[col] === '1';
                const sparkle = sparklePixels[row]?.[col] === '1';
                
                let color = 'transparent';
                
                if (sparkle) {
                    color = AXM.sulfur;
                } else if (handshake) {
                    color = AXM.parchment;
                } else if (heart) {
                    // Add shadow/highlight variation based on position
                    const isBottomRightEdge = (row === gridSize - 1 || col === gridSize - 1) && heart;
                    const isTopLeftHighlight = (row === 1 && col === 3) || (row === 1 && col === 8);
                    
                    if (isTopLeftHighlight) {
                        color = AXM.pixelHighlight; // White highlight pixel
                    } else if (isBottomRightEdge) {
                        color = AXM.pixelShadow; // Darker shadow pixels
                    } else {
                        color = AXM.blood; // Main heart color
                    }
                }
                
                if (color !== 'transparent') {
                    pixels.push(
                        <Rect
                            key={`${row}-${col}`}
                            x={col * cellSize}
                            y={row * cellSize}
                            width={cellSize}
                            height={cellSize}
                            fill={color}
                        />
                    );
                }
            }
        }
        
        return pixels;
    };

    return (
        <View style={{ alignItems: 'center', margin: 20 }}>
            {/* Parchment frame around emblem */}
            <View style={{
                borderWidth: 1,
                borderColor: AXM.parchment,
                padding: 4,
            }}>
                <Svg width={totalSize} height={totalSize}>
                    {renderPixelGrid()}
                </Svg>
            </View>
        </View>
    );
}