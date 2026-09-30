import { describe, it, expect } from 'vitest';
import {
  applyDamage, heal, tickAllEffects,
  isAlive, isDefeated, getHealthPercentage,
  updateEffectDuration,
} from './index';
import { createCharacter } from '../Character';
import { createEnemy } from '../Enemy';
import { ActiveEffect } from '../Effects/types';

const makePlayer = () => createCharacter({ name: 'Test', level: 1, baseStats: { heart: 4, body: 3, mind: 2 } });
const makeEnemy = () => createEnemy({
  id: 'e1', name: 'Foe', description: '', level: 1,
  baseStats: { heart: 1, body: 1, mind: 1 },
  mapName: 'breakwater', logic: 'random',
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
