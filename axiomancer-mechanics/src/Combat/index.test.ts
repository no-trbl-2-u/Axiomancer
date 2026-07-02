import { describe, it, expect, beforeEach } from 'vitest';
import {
  determineAdvantage, getAdvantageModifier, hasAdvantage,
  calculateFinalDamage, applyDamage, heal, tickAllEffects,
  isCriticalHit, isCriticalMiss, isAttackSuccessful,
  isAlive, isDefeated, getHealthPercentage,
  removeRandomBuff, extendRandomBuffDuration, updateEffectDuration,
  getStudyMarkIntensity, getThornsReflect, getActiveRollModifier,
} from './index';
import { createCharacter } from '../Character';
import { createEnemy } from '../Enemy';
import { ActiveEffect } from '../Effects/types';
import { setSeed } from '../Utils/rng';

const makePlayer = () => createCharacter({ name: 'Test', level: 1, baseStats: { heart: 4, body: 3, mind: 2 } });
const makeEnemy = () => createEnemy({
  id: 'e1', name: 'Foe', description: '', level: 1,
  baseStats: { heart: 1, body: 1, mind: 1 },
  mapName: 'fishing-village', logic: 'random',
});

describe('determineAdvantage', () => {
  it('heart > body', () => expect(determineAdvantage('heart', 'body')).toBe('advantage'));
  it('body > mind', () => expect(determineAdvantage('body', 'mind')).toBe('advantage'));
  it('mind > heart', () => expect(determineAdvantage('mind', 'heart')).toBe('advantage'));
  it('same = neutral', () => expect(determineAdvantage('body', 'body')).toBe('neutral'));
  it('heart < mind', () => expect(determineAdvantage('heart', 'mind')).toBe('disadvantage'));
});

describe('getAdvantageModifier', () => {
  it('+2 for advantage', () => expect(getAdvantageModifier('advantage')).toBe(2));
  it('-2 for disadvantage', () => expect(getAdvantageModifier('disadvantage')).toBe(-2));
  it('0 for neutral', () => expect(getAdvantageModifier('neutral')).toBe(0));
});

describe('hasAdvantage', () => {
  it('true for heart vs body', () => expect(hasAdvantage('heart', 'body')).toBe(true));
  it('false for heart vs mind', () => expect(hasAdvantage('heart', 'mind')).toBe(false));
});

describe('calculateFinalDamage', () => {
  it('subtracts defense', () => expect(calculateFinalDamage(10, 3, false)).toBe(7));
  it('minimum 0', () => expect(calculateFinalDamage(2, 10, false)).toBe(0));
  it('doubles on crit', () => expect(calculateFinalDamage(10, 3, true)).toBe(17));
  it('adds damage bonus', () => expect(calculateFinalDamage(10, 3, false, 2)).toBe(9));

  // ── Phase 32 — critStyle auto-selection ──
  it('crit against low defense — double wins (10 → 2*10-3 = 17 vs 10)', () => {
    // double = 17, pierce = 10 → max 17.
    expect(calculateFinalDamage(10, 3, true)).toBe(17);
  });
  it('crit against high defense — pierce wins (8 → 2*8-12 = 4 vs 8)', () => {
    // double = max(0, 16-12) = 4, pierce = 8 → max 8.
    expect(calculateFinalDamage(8, 12, true)).toBe(8);
  });
  it('crit with bonus — bonus rides both paths', () => {
    // base=5, defense=8, bonus=3.
    // double = max(0, 2*5+3-8) = 5; pierce = 5+3 = 8 → max 8.
    expect(calculateFinalDamage(5, 8, true, 3)).toBe(8);
  });
  it('crit with bonus enough to flip — double wins after bonus', () => {
    // base=5, defense=8, bonus=10.
    // double = max(0, 2*5+10-8) = 12; pierce = 5+10 = 15 → max 15.
    expect(calculateFinalDamage(5, 8, true, 10)).toBe(15);
  });
});

describe('applyDamage', () => {
  it('reduces HP on a Character', () => {
    const p = makePlayer();
    expect(applyDamage(p, 10).health).toBe(p.health - 10);
  });
  it('reduces HP on an Enemy', () => {
    const e = makeEnemy();
    expect(applyDamage(e, 5).health).toBe(e.health - 5);
  });
  it('clamps to 0', () => {
    const p = makePlayer();
    expect(applyDamage(p, 9999).health).toBe(0);
  });
});

describe('heal', () => {
  it('heals up to max', () => {
    const p = { ...makePlayer(), health: 5 };
    const healed = heal(p, 9999);
    expect(healed.health).toBe(p.maxHealth);
  });
});

describe('isAlive / isDefeated', () => {
  it('alive when health > 0', () => expect(isAlive(makePlayer())).toBe(true));
  it('defeated when health = 0', () => expect(isDefeated({ ...makePlayer(), health: 0 })).toBe(true));
});

describe('getHealthPercentage', () => {
  it('100% at full health', () => expect(getHealthPercentage(makePlayer())).toBe(100));
  it('50% at half health', () => {
    const p = makePlayer();
    expect(getHealthPercentage({ ...p, health: p.maxHealth / 2 })).toBe(50);
  });
});

describe('crit/miss checks', () => {
  it('nat 20 = crit', () => expect(isCriticalHit(20)).toBe(true));
  it('nat 1 = miss', () => expect(isCriticalMiss(1)).toBe(true));
  it('other rolls are neither', () => {
    expect(isCriticalHit(19)).toBe(false);
    expect(isCriticalMiss(2)).toBe(false);
  });
});

describe('isAttackSuccessful', () => {
  it('higher attack wins', () => expect(isAttackSuccessful(15, 10)).toBe(true));
  it('equal or lower fails', () => {
    expect(isAttackSuccessful(10, 10)).toBe(false);
    expect(isAttackSuccessful(5, 10)).toBe(false);
  });
});

const BUFF_ID = 'tier1_body_attack';
const DEBUFF_ID = 'debuff_burn';
const makeActiveBuff = (overrides: Partial<ActiveEffect> = {}): ActiveEffect => ({
  effectId: BUFF_ID, remainingDuration: 3, intensity: 1, appliedAt: 0, tier: 1, ...overrides,
});
const makeActiveDebuff = (): ActiveEffect => ({
  effectId: DEBUFF_ID, remainingDuration: 3, intensity: 1, appliedAt: 0, tier: 1,
});

describe('removeRandomBuff', () => {
  beforeEach(() => { setSeed('remove-buff-test'); });

  it('returns null removed when no active effects', () => {
    const p = makePlayer();
    const { target, removed } = removeRandomBuff(p);
    expect(removed).toBeNull();
    expect(target.effects).toHaveLength(0);
  });

  it('returns null removed when only debuffs are active', () => {
    const p = { ...makePlayer(), effects: [makeActiveDebuff()] };
    const { target, removed } = removeRandomBuff(p);
    expect(removed).toBeNull();
    expect(target.effects).toHaveLength(1);
  });

  it('removes the buff and returns it when one buff is active', () => {
    const buff = makeActiveBuff();
    const p = { ...makePlayer(), effects: [buff] };
    const { target, removed } = removeRandomBuff(p);
    expect(removed).not.toBeNull();
    expect(removed?.effectId).toBe(BUFF_ID);
    expect(target.effects).toHaveLength(0);
  });
});

describe('extendRandomBuffDuration', () => {
  beforeEach(() => { setSeed('extend-buff-test'); });

  it('returns null extended when no active effects', () => {
    const p = makePlayer();
    const { target, extended } = extendRandomBuffDuration(p, 2);
    expect(extended).toBeNull();
    expect(target.effects).toHaveLength(0);
  });

  it('returns null extended when only debuffs are active', () => {
    const p = { ...makePlayer(), effects: [makeActiveDebuff()] };
    const { target, extended } = extendRandomBuffDuration(p, 2);
    expect(extended).toBeNull();
    expect(target.effects).toHaveLength(1);
  });

  it('extends the buff duration when one buff is active', () => {
    const buff = makeActiveBuff({ remainingDuration: 3 });
    const p = { ...makePlayer(), effects: [buff] };
    const { target, extended } = extendRandomBuffDuration(p, 2);
    expect(extended).not.toBeNull();
    expect(extended?.remainingDuration).toBe(5);
    expect(target.effects[0].remainingDuration).toBe(5);
  });

  it('caps extended duration at MAX_EFFECT_DURATION (10)', () => {
    const buff = makeActiveBuff({ remainingDuration: 9 });
    const p = { ...makePlayer(), effects: [buff] };
    const { extended } = extendRandomBuffDuration(p, 5);
    expect(extended?.remainingDuration).toBe(10);
  });
});

describe('updateEffectDuration', () => {
  it('decrements duration for the matched effectId', () => {
    const effect: ActiveEffect = { effectId: 'e1', remainingDuration: 3, intensity: 1, appliedAt: 0, tier: 1 };
    const p = { ...makePlayer(), effects: [effect] };
    const result = updateEffectDuration(p, 'e1');
    expect(result.effects[0].remainingDuration).toBe(2);
  });

  it('leaves other effects untouched', () => {
    const e1: ActiveEffect = { effectId: 'e1', remainingDuration: 3, intensity: 1, appliedAt: 0, tier: 1 };
    const e2: ActiveEffect = { effectId: 'e2', remainingDuration: 5, intensity: 1, appliedAt: 0, tier: 1 };
    const p = { ...makePlayer(), effects: [e1, e2] };
    const result = updateEffectDuration(p, 'e1');
    expect(result.effects[0].remainingDuration).toBe(2);
    expect(result.effects[1].remainingDuration).toBe(5);
  });

  it('does not decrement permanent effects (remainingDuration === -1)', () => {
    const perm: ActiveEffect = { effectId: 'p1', remainingDuration: -1, intensity: 1, appliedAt: 0, tier: 1 };
    const p = { ...makePlayer(), effects: [perm] };
    const result = updateEffectDuration(p, 'p1');
    expect(result.effects[0].remainingDuration).toBe(-1);
  });
});

describe('tickAllEffects', () => {
  it('decrements durations and removes expired', () => {
    const effects: ActiveEffect[] = [
      { effectId: 'a', remainingDuration: 2, intensity: 1, appliedAt: 1, tier: 1 },
      { effectId: 'b', remainingDuration: 1, intensity: 1, appliedAt: 1, tier: 1 },
    ];
    const p = { ...makePlayer(), effects };
    const { target, expired } = tickAllEffects(p);
    expect(target.effects).toHaveLength(1);
    expect(target.effects[0].effectId).toBe('a');
    expect(target.effects[0].remainingDuration).toBe(1);
    expect(expired).toHaveLength(1);
    expect(expired[0].effectId).toBe('b');
  });

  it('skips permanent effects', () => {
    const effects: ActiveEffect[] = [
      { effectId: 'perm', remainingDuration: -1, intensity: 1, appliedAt: 1, tier: 1 },
    ];
    const p = { ...makePlayer(), effects };
    const { target, expired } = tickAllEffects(p);
    expect(target.effects).toHaveLength(1);
    expect(expired).toHaveLength(0);
  });
});

describe('getStudyMarkIntensity', () => {
  it('returns 0 when no effects are present', () => {
    expect(getStudyMarkIntensity(makePlayer())).toBe(0);
  });

  it('returns the intensity of the mind studying mark when present', () => {
    const mark: ActiveEffect = { effectId: 'tier1_mind_mark', remainingDuration: 2, intensity: 3, appliedAt: 0, tier: 1 };
    const p = { ...makePlayer(), effects: [mark] };
    expect(getStudyMarkIntensity(p)).toBe(3);
  });

  it('returns 0 when only a non-mark effect is present', () => {
    const other: ActiveEffect = { effectId: 'debuff_burn', remainingDuration: 2, intensity: 2, appliedAt: 0, tier: 1 };
    const p = { ...makePlayer(), effects: [other] };
    expect(getStudyMarkIntensity(p)).toBe(0);
  });
});

describe('getThornsReflect', () => {
  it('returns 0 when no effects are present', () => {
    expect(getThornsReflect(makePlayer())).toBe(0);
  });

  it('returns reflectDamage × intensity for tier1_body_defend (reflectDamage: 1)', () => {
    const thorns: ActiveEffect = { effectId: 'tier1_body_defend', remainingDuration: 3, intensity: 2, appliedAt: 0, tier: 1 };
    const p = { ...makePlayer(), effects: [thorns] };
    expect(getThornsReflect(p)).toBe(2);
  });

  it('returns reflectDamage × intensity for buff_brazen_thorns (reflectDamage: 2)', () => {
    const thorns: ActiveEffect = { effectId: 'buff_brazen_thorns', remainingDuration: 3, intensity: 3, appliedAt: 0, tier: 2 };
    const p = { ...makePlayer(), effects: [thorns] };
    expect(getThornsReflect(p)).toBe(6);
  });

  it('returns 0 for an effect with no reflectDamage payload', () => {
    const burn: ActiveEffect = { effectId: 'debuff_burn', remainingDuration: 2, intensity: 4, appliedAt: 0, tier: 1 };
    const p = { ...makePlayer(), effects: [burn] };
    expect(getThornsReflect(p)).toBe(0);
  });
});

describe('getActiveRollModifier', () => {
  it('returns 0 when no effects are present', () => {
    expect(getActiveRollModifier(makePlayer())).toBe(0);
  });

  it('returns flat rollModifier for an effect with a flat modifier (debuff_confusion: -5)', () => {
    const confusion: ActiveEffect = { effectId: 'debuff_confusion', remainingDuration: 3, intensity: 1, appliedAt: 0, tier: 2 };
    const p = { ...makePlayer(), effects: [confusion] };
    expect(getActiveRollModifier(p)).toBe(-5);
  });

  it('returns rollModifierPerIntensity × intensity for an effect with per-intensity modifier (tier1_body_attack: 1/intensity, intensity=3)', () => {
    const bodyAttack: ActiveEffect = { effectId: 'tier1_body_attack', remainingDuration: 2, intensity: 3, appliedAt: 0, tier: 1 };
    const p = { ...makePlayer(), effects: [bodyAttack] };
    expect(getActiveRollModifier(p)).toBe(3);
  });

  it('sums flat and per-intensity contributions across multiple effects', () => {
    const confusion: ActiveEffect = { effectId: 'debuff_confusion', remainingDuration: 3, intensity: 1, appliedAt: 0, tier: 2 };
    const accuracy: ActiveEffect = { effectId: 'buff_accuracy_up', remainingDuration: 2, intensity: 1, appliedAt: 0, tier: 2 };
    const p = { ...makePlayer(), effects: [confusion, accuracy] };
    expect(getActiveRollModifier(p)).toBe(-2);
  });
});
