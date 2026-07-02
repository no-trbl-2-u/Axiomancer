/**
 * Hermetic E2E Tests — Utils module
 *
 * Drives the Utils module's public surface through hermetic tests covering
 * the primary entry points: stat derivation, die rolling, math utilities,
 * and string formatting functions. RNG-dependent functions use stubbed
 * RNG for deterministic testing.
 *
 * Coverage areas:
 *   1. Stat derivation: deriveStats, deriveNonCombatStats, calculateMaxHealth
 *   2. Die rolling: createDie, createDieRoll, determineRollAdvantageModifier
 *   3. Math utilities: clamp, randomInt, deepClone, average, sum, max, min, inRange
 *   4. String utilities: capitalize, formatPercent
 *
 * Hermetic: no real Math.random, no I/O. All inputs constructed inline.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { mockFixedRng } from '../../test-utils/rng';
import {
  // Math utilities
  clamp,
  randomInt,
  deepClone,
  average,
  sum,
  max,
  min,
  inRange,
  
  // String utilities
  capitalize,
  formatPercent,
  
  // Die rolling
  createDie,
  createDieRoll,
  determineRollAdvantageModifier,
  
  // Stat derivation
  deriveStats,
  deriveNonCombatStats,
  calculateMaxHealth
} from '../index';

describe('Utils engine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Math utilities', () => {
    it('clamps values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('generates random integers in range with stubbed RNG', () => {
      mockFixedRng([0.0, 0.5, 0.999]);
      
      // 0.0 should give min value
      expect(randomInt(1, 6)).toBe(1);
      // 0.5 should give middle value  
      expect(randomInt(1, 6)).toBe(4); // 0.5 * 6 = 3.0, floor(3.0) + 1 = 4
      // 0.999 should give max value
      expect(randomInt(1, 6)).toBe(6);
    });

    it('deep clones objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
      
      cloned.b.c = 3;
      expect(original.b.c).toBe(2);
    });

    it('calculates averages', () => {
      expect(average(1, 2, 3)).toBe(2);
      expect(average(10)).toBe(10);
      expect(average()).toBe(0);
      expect(average(1, 2, 3, 4, 5)).toBe(3);
    });

    it('sums arrays', () => {
      expect(sum([1, 2, 3])).toBe(6);
      expect(sum([])).toBe(0);
      expect(sum([10])).toBe(10);
    });

    it('finds max values', () => {
      expect(max([1, 5, 3])).toBe(5);
      expect(max([10])).toBe(10);
      expect(max([-1, -5, -2])).toBe(-1);
    });

    it('finds min values', () => {
      expect(min([1, 5, 3])).toBe(1);
      expect(min([10])).toBe(10);
      expect(min([-1, -5, -2])).toBe(-5);
    });

    it('checks if values are in range', () => {
      expect(inRange(5, 0, 10)).toBe(true);
      expect(inRange(0, 0, 10)).toBe(true);
      expect(inRange(10, 0, 10)).toBe(true);
      expect(inRange(-1, 0, 10)).toBe(false);
      expect(inRange(11, 0, 10)).toBe(false);
    });
  });

  describe('String utilities', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('HELLO');
      expect(capitalize('')).toBe('');
      expect(capitalize('a')).toBe('A');
    });

    it('formats percentages', () => {
      expect(formatPercent(50)).toBe('50%');
      expect(formatPercent(33.333)).toBe('33%');
      expect(formatPercent(33.333, 2)).toBe('33.33%');
      expect(formatPercent(100, 1)).toBe('100.0%');
    });
  });

  describe('Die rolling', () => {
    it('creates die roll functions with stubbed RNG', () => {
      mockFixedRng([0.0, 0.5, 0.999]);
      const d6 = createDie(6, 1);
      
      expect(d6()).toBe(1); // 0.0 * (6-1+1) = 0 -> floor(0) + 1 = 1
      expect(d6()).toBe(4); // 0.5 * (6-1+1) = 3.0 -> floor(3.0) + 1 = 4  
      expect(d6()).toBe(6); // 0.999 * (6-1+1) = 5.994 -> floor(5.994) + 1 = 6
    });

    it('creates multi-die rolls with aggregation functions', () => {
      mockFixedRng([0.0, 0.5]); // Two dice rolls
      const d20Advantage = createDie(20, 2, max);
      
      // First roll: 0.0 * 20 = 0 -> floor(0) + 1 = 1
      // Second roll: 0.5 * 20 = 10 -> floor(10) + 1 = 11
      // max(1, 11) = 11
      expect(d20Advantage()).toBe(11);
    });

    it('creates advantage/disadvantage d20 rolls', () => {
      const advantageRoll = createDieRoll('advantage');
      const disadvantageRoll = createDieRoll('disadvantage');
      const neutralRoll = createDieRoll('neutral');
      
      // Should create 2d20 keep highest for advantage
      expect(typeof advantageRoll).toBe('function');
      expect(typeof disadvantageRoll).toBe('function');
      expect(typeof neutralRoll).toBe('function');
    });

    it('determines roll advantage modifiers', () => {
      const advMod = determineRollAdvantageModifier('advantage');
      const disMod = determineRollAdvantageModifier('disadvantage');
      const neuMod = determineRollAdvantageModifier('neutral');
      
      expect(advMod([10, 15])).toBe(15); // max
      expect(disMod([10, 15])).toBe(10); // min
      expect(neuMod([10, 15])).toBe(25); // sum
    });
  });

  describe('Stat derivation', () => {
    it('derives combat stats from base stats', () => {
      const baseStats = { body: 10, heart: 8, mind: 12 };
      const derived = deriveStats(baseStats);
      
      // Derived stats use STAT_MULTIPLIERS (attack=1, skill=1, defense=3)
      expect(derived.physicalAttack).toBe(10);    // 10 * 1
      expect(derived.physicalSkill).toBe(10);     // 10 * 1
      expect(derived.physicalDefense).toBe(30);   // 10 * 3
      expect(derived.mentalAttack).toBe(12);      // 12 * 1
      expect(derived.mentalSkill).toBe(12);       // 12 * 1
      expect(derived.mentalDefense).toBe(36);     // 12 * 3
      expect(derived.emotionalAttack).toBe(8);    // 8 * 1
      expect(derived.emotionalSkill).toBe(8);     // 8 * 1
      expect(derived.emotionalDefense).toBe(24);  // 8 * 3
      expect(derived.luck).toBe(10);              // average(10, 8, 12) = 10
    });

    it('derives non-combat stats from base stats', () => {
      const baseStats = { body: 10, heart: 8, mind: 12 };
      const nonCombat = deriveNonCombatStats(baseStats);
      
      // Non-combat stats use save=2, test=4 multipliers
      expect(nonCombat.physicalSave).toBe(20);    // 10 * 2
      expect(nonCombat.physicalTest).toBe(40);    // 10 * 4
      expect(nonCombat.mentalSave).toBe(24);      // 12 * 2
      expect(nonCombat.mentalTest).toBe(48);      // 12 * 4
      expect(nonCombat.emotionalSave).toBe(16);   // 8 * 2
      expect(nonCombat.emotionalTest).toBe(32);   // 8 * 4
    });

    it('calculates max health from base stats', () => {
      const baseStats = { body: 10, heart: 8, mind: 12 };
      const level = 5; // Should be ignored per function documentation
      
      // Health = (10 + 8 + 12) * HEALTH_PER_STAT (5) = 30 * 5 = 150
      expect(calculateMaxHealth(level, baseStats)).toBe(150);
    });

    it('calculates max health ignoring level parameter', () => {
      const baseStats = { body: 5, heart: 5, mind: 5 };
      
      // Should get same result regardless of level
      const health1 = calculateMaxHealth(1, baseStats);
      const health10 = calculateMaxHealth(10, baseStats);
      
      expect(health1).toBe(health10);
      expect(health1).toBe(75); // (5 + 5 + 5) * 5 = 75
    });
  });
});