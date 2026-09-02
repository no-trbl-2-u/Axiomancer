import { describe, it } from 'vitest';
import { getThreatSequence } from '../combat.threat';
import { ElderFireGiant, TheSophist, Zoma } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';

describe('probe', () => {
    it('dumps', () => {
        for (const [n, e] of [['EFG', ElderFireGiant], ['Sophist', TheSophist], ['Zoma', Zoma]] as const) {
            const seq = getThreatSequence(deepClone(e));
            // eslint-disable-next-line no-console
            console.log(n, JSON.stringify(seq.map((p, i) => ({ i, rungs: p.rungs, name: p.threatAction?.name })), null, 1));
        }
    });
});
