import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyDamage, heal, tickAllEffects,
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

const BUFF_ID = 'buff_accuracy_up'; // spec 32 v3 re-pin: tier1_* card effects retired; support-tagged buff
const DEBUFF_ID = 'debuff_poison'; // spec 32 v3 re-pin: surviving affliction debuff
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
    const other: ActiveEffect = { effectId: 'debuff_poison', remainingDuration: 2, intensity: 2, appliedAt: 0, tier: 1 };
    const p = { ...makePlayer(), effects: [other] };
    expect(getStudyMarkIntensity(p)).toBe(0);
  });
});

describe('getThornsReflect', () => {
  it('returns 0 when no effects are present', () => {
    expect(getThornsReflect(makePlayer())).toBe(0);
  });

  it('returns reflectDamage × intensity for buff_thorns (reflectDamage: 1)', () => {
    const thorns: ActiveEffect = { effectId: 'buff_thorns', remainingDuration: 3, intensity: 2, appliedAt: 0, tier: 1 };
    const p = { ...makePlayer(), effects: [thorns] };
    expect(getThornsReflect(p)).toBe(2);
  });

  it('returns 0 for an effect with no reflectDamage payload', () => {
    const burn: ActiveEffect = { effectId: 'debuff_poison', remainingDuration: 2, intensity: 4, appliedAt: 0, tier: 1 };
    const p = { ...makePlayer(), effects: [burn] };
    expect(getThornsReflect(p)).toBe(0);
  });
});

describe('getActiveRollModifier', () => {
  it('returns 0 when no effects are present', () => {
    expect(getActiveRollModifier(makePlayer())).toBe(0);
  });

  it('returns flat rollModifier for an effect with a flat modifier (debuff_curse: -2)', () => {
    const curse: ActiveEffect = { effectId: 'debuff_curse', remainingDuration: 3, intensity: 1, appliedAt: 0, tier: 2 };
    const p = { ...makePlayer(), effects: [curse] };
    expect(getActiveRollModifier(p)).toBe(-2);
  });

  it('a flat rollModifier is intensity-independent (debuff_curse: -2 at intensity 3)', () => {
    // spec 32 v3 re-pin: no library effect carries rollModifierPerIntensity any
    // more — flat modifiers must NOT scale with intensity.
    const curse: ActiveEffect = { effectId: 'debuff_curse', remainingDuration: 2, intensity: 3, appliedAt: 0, tier: 2 };
    const p = { ...makePlayer(), effects: [curse] };
    expect(getActiveRollModifier(p)).toBe(-2);
  });

  it('sums flat rollModifier contributions across multiple effects', () => {
    // debuff_curse rollModifier -2 + buff_status_chance_up rollModifier +3 = +1
    // (buff_accuracy_up was re-themed off rollModifier onto advantageModifier;
    // buff_status_chance_up still carries the +3 flat roll payload.)
    const curse: ActiveEffect = { effectId: 'debuff_curse', remainingDuration: 3, intensity: 1, appliedAt: 0, tier: 2 };
    const statusChance: ActiveEffect = { effectId: 'buff_status_chance_up', remainingDuration: 2, intensity: 1, appliedAt: 0, tier: 2 };
    const p = { ...makePlayer(), effects: [curse, statusChance] };
    expect(getActiveRollModifier(p)).toBe(1);
  });
});
