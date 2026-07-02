import { describe, it, expect, beforeEach } from 'vitest';
import { getRng, setSeed } from '../rng';
import { randomInt } from '../index';

describe('RNG engine', () => {
    beforeEach(() => {
        // Reset to default for each test
        setSeed('test_seed');
    });
    
    it('produces identical sequences for same seed', () => {
        setSeed('identical_test');
        const sequence1 = Array.from({ length: 10 }, () => getRng().random());
        
        setSeed('identical_test');
        const sequence2 = Array.from({ length: 10 }, () => getRng().random());
        
        expect(sequence1).toEqual(sequence2);
    });
    
    it('produces different sequences for different seeds', () => {
        setSeed('seed_a');
        const sequenceA = Array.from({ length: 10 }, () => getRng().random());
        
        setSeed('seed_b');
        const sequenceB = Array.from({ length: 10 }, () => getRng().random());
        
        expect(sequenceA).not.toEqual(sequenceB);
    });
    
    it('integrates with randomInt helper', () => {
        setSeed('dice_test');
        const rolls1 = Array.from({ length: 20 }, () => randomInt(1, 20));
        
        setSeed('dice_test');
        const rolls2 = Array.from({ length: 20 }, () => randomInt(1, 20));
        
        expect(rolls1).toEqual(rolls2);
        expect(rolls1.every(r => r >= 1 && r <= 20)).toBe(true);
    });
    
    it('persists and restores state correctly', () => {
        setSeed('state_test');
        
        // Generate some numbers to advance the state
        getRng().random();
        getRng().random();
        const stateAfterTwo = getRng().getState();
        
        const nextValue = getRng().random();
        
        // Restore state and verify next value matches
        getRng().setState(stateAfterTwo);
        expect(getRng().random()).toBe(nextValue);
    });

    it('handles string seed conversion consistently', () => {
        setSeed('hello');
        const sequence1 = Array.from({ length: 5 }, () => getRng().random());
        
        setSeed('hello');
        const sequence2 = Array.from({ length: 5 }, () => getRng().random());
        
        expect(sequence1).toEqual(sequence2);
    });

    it('handles numeric seeds', () => {
        setSeed(12345);
        const sequence1 = Array.from({ length: 5 }, () => getRng().random());
        
        setSeed(12345);
        const sequence2 = Array.from({ length: 5 }, () => getRng().random());
        
        expect(sequence1).toEqual(sequence2);
    });

    it('produces values in range [0, 1)', () => {
        setSeed('range_test');
        for (let i = 0; i < 100; i++) {
            const value = getRng().random();
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
    });
});