import { describe, it, expect } from 'vitest';
import { clamp, average, sum, max, min, inRange, calculateMaxHealth } from './index';

describe('clamp', () => {
  it('clamps above max', () => expect(clamp(15, 0, 10)).toBe(10));
  it('clamps below min', () => expect(clamp(-5, 0, 10)).toBe(0));
  it('passes through in range', () => expect(clamp(5, 0, 10)).toBe(5));
});

describe('average', () => {
  it('averages numbers', () => expect(average(2, 4, 6)).toBe(4));
  it('returns 0 for empty', () => expect(average()).toBe(0));
});

describe('sum/max/min', () => {
  it('sums array', () => expect(sum([1, 2, 3])).toBe(6));
  it('finds max', () => expect(max([3, 1, 4, 1, 5])).toBe(5));
  it('finds min', () => expect(min([3, 1, 4, 1, 5])).toBe(1));
});

describe('inRange', () => {
  it('true when in range', () => expect(inRange(5, 1, 10)).toBe(true));
  it('false when out', () => expect(inRange(15, 1, 10)).toBe(false));
  it('inclusive boundaries', () => {
    expect(inRange(1, 1, 10)).toBe(true);
    expect(inRange(10, 1, 10)).toBe(true);
  });
});

describe('calculateMaxHealth', () => {
  it('body 3 heart 4 mind 2 → 50 + 12·3 + 6·2 + 6·4 = 122', () => {
    expect(calculateMaxHealth(1, { body: 3, heart: 4, mind: 2 })).toBe(122);
  });

  it('includes every base stat in max health', () => {
    expect(calculateMaxHealth(15, { body: 1, heart: 34, mind: 40 })).toBe(506);
  });

  it('weights body double (S3, D41): the worked builds', () => {
    expect(calculateMaxHealth(1, { body: 5, heart: 5, mind: 5 })).toBe(170);
    expect(calculateMaxHealth(10, { body: 32, heart: 5, mind: 5 })).toBe(494);
    expect(calculateMaxHealth(15, { body: 47, heart: 5, mind: 5 })).toBe(674);
    expect(calculateMaxHealth(15, { body: 19, heart: 19, mind: 19 })).toBe(506);
    expect(calculateMaxHealth(15, { body: 26, heart: 26, mind: 5 })).toBe(548);
  });

  it('does not multiply health by level because stat totals already encode level budget', () => {
    expect(calculateMaxHealth(2, { body: 2, heart: 2, mind: 2 })).toBe(98);
    expect(calculateMaxHealth(20, { body: 2, heart: 2, mind: 2 })).toBe(98);
  });
});

