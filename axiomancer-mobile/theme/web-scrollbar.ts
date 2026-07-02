/**
 * Web scrollbar skin (visual-audit 2026-06; reactive theming-hot-reload
 * 2026-06). React Native Web renders the platform's default scrollbar,
 * which clashes with the gothic chrome. This side-effect module injects
 * a slim themed scrollbar (ash thumb on a void track, sulfur on hover)
 * on web only. Colours track the active theme and re-skin in place when
 * the theme switches. No-op on native.
 */

import { Platform } from 'react-native';

import { currentPalette, onThemeChange } from './runtime';

if (Platform.OS === 'web') {
    const applyScrollbarSkin = () => {
        try {
            if (typeof document === 'undefined') return;
            let style = document.getElementById('axm-scrollbar-skin') as HTMLStyleElement | null;
            if (!style) {
                style = document.createElement('style');
                style.id = 'axm-scrollbar-skin';
                document.head.appendChild(style);
            }
            const AXM = currentPalette();
            style.textContent = `
                * { scrollbar-width: thin; scrollbar-color: ${AXM.ash} ${AXM.deepBg}; }
                ::-webkit-scrollbar { width: 9px; height: 9px; }
                ::-webkit-scrollbar-track { background: ${AXM.deepBg}; }
                ::-webkit-scrollbar-thumb {
                    background: ${AXM.ash};
                    border: 2px solid ${AXM.deepBg};
                }
                ::-webkit-scrollbar-thumb:hover { background: ${AXM.sulfur}; }
                ::-webkit-scrollbar-corner { background: ${AXM.deepBg}; }
            `;
        } catch {
            /* ignore — scrollbar styling is cosmetic */
        }
    };

    applyScrollbarSkin();
    onThemeChange(applyScrollbarSkin);
}
