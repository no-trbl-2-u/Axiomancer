/**
 * Hermetic — the settings presenter (`settings.engine.ts`).
 */

import { describe, expect, it } from '@jest/globals';

import { DEFAULT_SETTINGS, TEXT_SCALES } from '@/state/settings';
import {
    REDUCED_MOTION_OPTIONS,
    TEXT_SCALE_OPTIONS,
    TOGGLE_OPTIONS,
    selectSettingsViewModel,
    volumeStep,
} from '../settings.engine';

describe('option lists', () => {
    it('offer exactly the store\'s legal values', () => {
        expect(TEXT_SCALE_OPTIONS.map((o) => o.value)).toEqual([...TEXT_SCALES]);
        expect(TEXT_SCALE_OPTIONS.map((o) => o.label)).toEqual(['SMALL', 'DEFAULT', 'LARGE', 'LARGER']);
        expect(REDUCED_MOTION_OPTIONS.map((o) => o.value)).toEqual(['system', 'on', 'off']);
        expect(TOGGLE_OPTIONS.map((o) => o.value)).toEqual([true, false]);
    });
});

describe('volumeStep', () => {
    it('clamps to 0–100', () => {
        expect(volumeStep(0, -10)).toBe(0);
        expect(volumeStep(95, 10)).toBe(100);
        expect(volumeStep(50, 10)).toBe(60);
    });
});

describe('selectSettingsViewModel', () => {
    it('mirrors the settings and formats the volumes', () => {
        const vm = selectSettingsViewModel({ ...DEFAULT_SETTINGS, musicVolume: 40 }, true);
        expect(vm.musicLabel).toBe('40%');
        expect(vm.sfxLabel).toBe(`${DEFAULT_SETTINGS.sfxVolume}%`);
        expect(vm.inRun).toBe(true);
        expect(vm.textScale).toBe(1);
        expect(selectSettingsViewModel(DEFAULT_SETTINGS, false).inRun).toBe(false);
    });
});
