/**
 * Unit tests — previewAllocation helper (Phase 88).
 *
 * Tests the derived stats preview calculation logic:
 *   - basic allocation application
 *   - stance-specific stat mappings (heart→emotional, body→physical, mind→mental)
 *   - formula approximations
 *   - edge cases (zero allocation, max allocation)
 */

import { describe, expect, it } from '@jest/globals';
import { previewAllocation, previewStanceStats } from '@/lib/previewAllocation';

const BASE_STATS = {
    heart: 10,
    body: 12,
    mind: 8,
};

describe('previewAllocation: basic functionality', () => {
    it('returns baseline when no allocation', () => {
        const result = previewAllocation(BASE_STATS, { heart: 0, body: 0, mind: 0 });
        
        // Should return calculated stats for baseline
        expect(result.physical).toBeDefined();
        expect(result.mental).toBeDefined();
        expect(result.emotional).toBeDefined();
        
        // All values should be positive integers
        expect(Number.isInteger(result.physical.attack)).toBe(true);
        expect(result.physical.attack).toBeGreaterThan(0);
    });

    it('applies allocations to base stats', () => {
        const allocation = { heart: 2, body: 1, mind: 3 };
        const result = previewAllocation(BASE_STATS, allocation);
        
        // With higher stats, derived stats should generally be higher
        const baseline = previewAllocation(BASE_STATS, { heart: 0, body: 0, mind: 0 });
        
        expect(result.physical.attack).toBeGreaterThan(baseline.physical.attack);
        expect(result.mental.attack).toBeGreaterThan(baseline.mental.attack);
        expect(result.emotional.attack).toBeGreaterThan(baseline.emotional.attack);
    });
});

describe('previewAllocation: stance influence patterns', () => {
    it('body allocation primarily affects physical stats', () => {
        const bodyAllocation = previewAllocation(BASE_STATS, { heart: 0, body: 5, mind: 0 });
        const baseline = previewAllocation(BASE_STATS, { heart: 0, body: 0, mind: 0 });
        
        const physicalIncrease = bodyAllocation.physical.attack - baseline.physical.attack;
        const mentalIncrease = bodyAllocation.mental.attack - baseline.mental.attack;
        const emotionalIncrease = bodyAllocation.emotional.attack - baseline.emotional.attack;
        
        // Physical should increase most from body allocation
        expect(physicalIncrease).toBeGreaterThan(mentalIncrease);
        expect(physicalIncrease).toBeGreaterThan(emotionalIncrease);
    });

    it('mind allocation primarily affects mental stats', () => {
        const mindAllocation = previewAllocation(BASE_STATS, { heart: 0, body: 0, mind: 5 });
        const baseline = previewAllocation(BASE_STATS, { heart: 0, body: 0, mind: 0 });
        
        const mentalIncrease = mindAllocation.mental.attack - baseline.mental.attack;
        const physicalIncrease = mindAllocation.physical.attack - baseline.physical.attack;
        const emotionalIncrease = mindAllocation.emotional.attack - baseline.emotional.attack;
        
        // Mental should increase most from mind allocation
        expect(mentalIncrease).toBeGreaterThan(physicalIncrease);
        expect(mentalIncrease).toBeGreaterThan(emotionalIncrease);
    });

    it('heart allocation primarily affects emotional stats', () => {
        const heartAllocation = previewAllocation(BASE_STATS, { heart: 5, body: 0, mind: 0 });
        const baseline = previewAllocation(BASE_STATS, { heart: 0, body: 0, mind: 0 });
        
        const emotionalIncrease = heartAllocation.emotional.attack - baseline.emotional.attack;
        const physicalIncrease = heartAllocation.physical.attack - baseline.physical.attack;
        const mentalIncrease = heartAllocation.mental.attack - baseline.mental.attack;
        
        // Emotional should increase most from heart allocation
        expect(emotionalIncrease).toBeGreaterThan(physicalIncrease);
        expect(emotionalIncrease).toBeGreaterThan(mentalIncrease);
    });
});

describe('previewStanceStats: simplified interface', () => {
    it('maps stances to appropriate derived stat categories', () => {
        const result = previewStanceStats(BASE_STATS, { heart: 1, body: 1, mind: 1 });
        
        expect(result.heart).toBeDefined();
        expect(result.body).toBeDefined();
        expect(result.mind).toBeDefined();
        
        // Each stance should have attack/skill/defense
        expect(result.heart.attack).toBeGreaterThan(0);
        expect(result.body.skill).toBeGreaterThan(0);
        expect(result.mind.defense).toBeGreaterThan(0);
    });

    it('returns consistent results with previewAllocation', () => {
        const allocation = { heart: 2, body: 1, mind: 3 };
        const fullResult = previewAllocation(BASE_STATS, allocation);
        const stanceResult = previewStanceStats(BASE_STATS, allocation);
        
        // Stance mappings should match full result
        expect(stanceResult.heart.attack).toBe(fullResult.emotional.attack);
        expect(stanceResult.body.attack).toBe(fullResult.physical.attack);
        expect(stanceResult.mind.attack).toBe(fullResult.mental.attack);
    });
});

describe('previewAllocation: edge cases', () => {
    it('handles zero base stats', () => {
        const zeroStats = { heart: 0, body: 0, mind: 0 };
        const result = previewAllocation(zeroStats, { heart: 10, body: 10, mind: 10 });
        
        // Should not crash and should return valid integers
        expect(Number.isInteger(result.physical.attack)).toBe(true);
        expect(result.physical.attack).toBeGreaterThanOrEqual(0);
    });

    it('handles large allocations', () => {
        const largeAllocation = { heart: 100, body: 100, mind: 100 };
        const result = previewAllocation(BASE_STATS, largeAllocation);
        
        // Should not crash and should scale appropriately
        expect(Number.isInteger(result.physical.attack)).toBe(true);
        expect(result.physical.attack).toBeGreaterThan(100); // Should be substantially higher
    });
});