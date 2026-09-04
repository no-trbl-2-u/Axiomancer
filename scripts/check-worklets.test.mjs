// scripts/check-worklets.test.mjs
//
// The scanner's own tests. The regression it guards (a plain-JS call inside a
// Reanimated worklet) killed the app process on device and was INVISIBLE to
// every web harness, so the check itself has to be trustworthy: it must catch
// the real bug, pass the real fix, and not cry wolf on the prose that fooled
// its first draft.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { scanSource, stripNonCode, scanRepo, WORKLET_SAFE } from './check-worklets.mjs';

test('catches the crash it was written for — EnemyActionCard, verbatim', () => {
    const bug = `
    const anim = useAnimatedStyle(() => ({
        opacity: shouldInstantSettleJuice() ? 1 : opacity.value,
        transform: [{ translateY: lift.value }],
    }));`;
    const hits = scanSource(bug, 'EnemyActionCard.tsx');
    assert.equal(hits.length, 1);
    assert.equal(hits[0].fn, 'shouldInstantSettleJuice');
    assert.equal(hits[0].hook, 'useAnimatedStyle');
});

test('passes the fix — the value is read on the JS thread and captured', () => {
    const fixed = `
    const instantSettle = shouldInstantSettleJuice();
    const anim = useAnimatedStyle(() => ({
        opacity: instantSettle ? 1 : opacity.value,
        transform: [{ translateY: lift.value }],
    }));`;
    assert.deepEqual(scanSource(fixed, 'EnemyActionCard.tsx'), []);
});

test('does not cry wolf on prose inside comments (the first draft did)', () => {
    // These exact comments made an earlier scanner report `fall()`/`bounce()`.
    const src = `
    const animStyle = useAnimatedStyle(() => {
        const t = fall.value;
        // >1 -> the landing micro-bounce (slight lift + wobble back to rest)
        /* <=1 -> the fall (drop + unwinding entry rotation) */
        return { opacity: Math.min(1, Math.max(0, t) * 3) };
    });`;
    assert.deepEqual(scanSource(src, 'RollingDie.tsx'), []);
});

test('does not flag string or template-literal contents', () => {
    const src = `
    const s = useAnimatedStyle(() => {
        const rotate = \`\${deg}deg\`;
        return { transform: [{ rotate }], opacity: notACall.value };
    });`;
    assert.deepEqual(scanSource(src, 'x.tsx'), []);
});

test('allows the Reanimated API and JS builtins', () => {
    const src = `
    const s = useAnimatedStyle(() => ({
        opacity: withTiming(1, { duration: 200 }),
        width: interpolate(p.value, [0, 1], [0, 100]),
        height: Math.max(0, p.value),
    }));`;
    assert.deepEqual(scanSource(src, 'x.tsx'), []);
    for (const fn of ['withTiming', 'interpolate', 'runOnJS', 'Math']) {
        assert.ok(WORKLET_SAFE.has(fn), `${fn} should be worklet-safe`);
    }
});

test('honours the // worklet-safe escape hatch, on the line and above it', () => {
    const inline = `
    const s = useAnimatedStyle(() => ({
        opacity: myWorkletFn(), // worklet-safe
    }));`;
    assert.deepEqual(scanSource(inline, 'x.tsx'), []);
    const above = `
    const s = useAnimatedStyle(() => ({
        // worklet-safe
        opacity: myWorkletFn(),
    }));`;
    assert.deepEqual(scanSource(above, 'x.tsx'), []);
});

test('covers every UI-thread hook, not just useAnimatedStyle', () => {
    for (const hook of ['useDerivedValue', 'useAnimatedProps', 'useAnimatedReaction']) {
        const src = `const v = ${hook}(() => sneaky());`;
        const hits = scanSource(src, 'x.tsx');
        assert.equal(hits.length, 1, `${hook} should be scanned`);
        assert.equal(hits[0].fn, 'sneaky');
    }
});

test('reports a usable line number', () => {
    const src = ['a', 'b', 'const s = useAnimatedStyle(() => ({', '  o: boom(),', '}));'].join('\n');
    const hits = scanSource(src, 'x.tsx');
    assert.equal(hits.length, 1);
    assert.equal(hits[0].line, 4);
});

test('stripNonCode preserves line count so numbers stay honest', () => {
    const src = 'a\n/* one\ntwo */\nb\n';
    assert.equal(stripNonCode(src).split('\n').length, src.split('\n').length);
});

test('the live tree is clean', () => {
    const { scanned, violations } = scanRepo();
    assert.ok(scanned > 50, `expected a real sweep, scanned ${scanned}`);
    assert.deepEqual(violations, [], `worklet violations:\n${
        violations.map((v) => `  ${v.file}:${v.line} calls ${v.fn}()`).join('\n')}`);
});
