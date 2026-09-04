#!/usr/bin/env node
// scripts/check-worklets.mjs
//
// WORKLET SAFETY — no plain-JS function calls inside a Reanimated worklet.
//
// Why this check exists, in one paragraph: `EnemyActionCard.tsx` called
// `shouldInstantSettleJuice()` from inside a `useAnimatedStyle` worklet.
// Reanimated serializes a worklet's closure into a SEPARATE UI-thread
// runtime, and a plain (non-workletized) function crosses that boundary as an
// OBJECT, not a callable. Invoking it threw `CppException: Object is not a
// function` on the UI thread — a C++ exception no JS handler can catch, so
// Android killed the process outright. The app "minimized" the instant the
// enemy's action card mounted, which is every END PHASE. It took three owner
// reports and a Sentry integration to pin, because WEB CANNOT REPRODUCE IT:
// react-native-web's Reanimated has no separate UI runtime, so the same call
// just works and every Playwright run stayed green.
//
// That is the whole class of bug this guards. A worklet may only call
// Reanimated's own worklet-safe API, JS builtins, or a function that is
// itself marked `'worklet'`.
//
// Escape hatch: put `// worklet-safe` on the line of the call (or the line
// above) when a call really is workletized and the scanner cannot tell.
//
// Usage: node scripts/check-worklets.mjs [--json]

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Reanimated hooks whose callback body runs on the UI thread. */
export const WORKLET_HOOKS = [
    'useAnimatedStyle', 'useDerivedValue', 'useAnimatedProps',
    'useAnimatedReaction', 'useFrameCallback', 'useAnimatedScrollHandler',
];

/** Callables that are safe inside a worklet: Reanimated's own API, plus the
 *  JS builtins and common methods the UI runtime provides. */
export const WORKLET_SAFE = new Set([
    // Reanimated / worklets API
    'withTiming', 'withSpring', 'withDelay', 'withSequence', 'withRepeat', 'withDecay',
    'interpolate', 'interpolateColor', 'clamp', 'cancelAnimation',
    'runOnJS', 'runOnUI', 'measure', 'scrollTo', 'dispatchCommand', 'setGestureState',
    'Easing', 'makeMutable',
    // JS builtins / globals available on the UI runtime
    'Math', 'Number', 'String', 'Boolean', 'Array', 'Object', 'JSON', 'Date',
    'isNaN', 'isFinite', 'parseFloat', 'parseInt', 'RegExp', 'Error',
    // control flow the tokenizer sees as `name (`
    'if', 'for', 'while', 'switch', 'catch', 'return', 'typeof', 'function',
]);

/** Strip comments and string/template literals so their contents cannot be
 *  mistaken for code. (The first draft of this scanner reported `fall()` and
 *  `bounce()` in RollingDie.tsx — both were prose inside comments.) */
export function stripNonCode(src) {
    let out = '';
    let i = 0;
    const n = src.length;
    while (i < n) {
        const c = src[i];
        const d = src[i + 1];
        if (c === '/' && d === '/') {
            while (i < n && src[i] !== '\n') { i++; }
        } else if (c === '/' && d === '*') {
            i += 2;
            while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
                if (src[i] === '\n') out += '\n';
                i++;
            }
            i += 2;
        } else if (c === '"' || c === "'" || c === '`') {
            const quote = c;
            i++;
            while (i < n && src[i] !== quote) {
                if (src[i] === '\\') i++;
                if (src[i] === '\n') out += '\n';
                i++;
            }
            i++;
        } else {
            out += c;
            i++;
        }
    }
    return out;
}

/** The balanced-paren body starting at `open` (the index of `(`). */
function balanced(src, open) {
    let depth = 0;
    for (let j = open; j < src.length; j++) {
        if (src[j] === '(') depth++;
        else if (src[j] === ')') {
            depth--;
            if (depth === 0) return src.slice(open, j + 1);
        }
    }
    return src.slice(open);
}

/**
 * Find every plain-JS call inside a worklet body.
 * Returns `[{ file, line, hook, fn }]`.
 */
export function scanSource(src, file = '<inline>') {
    const code = stripNonCode(src);
    const raw = src.split('\n');
    const found = [];
    for (const hook of WORKLET_HOOKS) {
        const re = new RegExp(`\\b${hook}\\s*\\(`, 'g');
        let m;
        while ((m = re.exec(code)) !== null) {
            const body = balanced(code, m.index + m[0].length - 1);
            const hookLine = code.slice(0, m.index).split('\n').length;
            const callRe = /(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g;
            let c;
            while ((c = callRe.exec(body)) !== null) {
                const fn = c[1];
                if (WORKLET_SAFE.has(fn)) continue;
                if (WORKLET_HOOKS.includes(fn)) continue;
                if (/^use[A-Z]/.test(fn)) continue;          // hooks never run in a worklet body
                const line = hookLine + body.slice(0, c.index).split('\n').length - 1;
                const here = raw[line - 1] ?? '';
                const above = raw[line - 2] ?? '';
                if (/worklet-safe/.test(here) || /worklet-safe/.test(above)) continue;
                found.push({ file, line, hook, fn });
            }
        }
    }
    return found;
}

const SKIP_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', '.expo', '.smoke-dist',
    '.audit-dist', 'coverage', '__tests__', 'screenshots',
]);

function* walk(dir) {
    for (const name of readdirSync(dir)) {
        if (SKIP_DIRS.has(name)) continue;
        const p = join(dir, name);
        const st = statSync(p);
        if (st.isDirectory()) yield* walk(p);
        else if (/\.(tsx?|jsx?)$/.test(name) && !/\.test\.|\.d\.ts$/.test(name)) yield p;
    }
}

export function scanRepo(root = REPO_ROOT) {
    const roots = ['axiomancer-mobile/components', 'axiomancer-mobile/app',
        'axiomancer-mobile/lib', 'axiomancer-mobile/hooks'];
    const violations = [];
    let scanned = 0;
    for (const r of roots) {
        const abs = join(root, r);
        try { statSync(abs); } catch { continue; }
        for (const file of walk(abs)) {
            scanned++;
            const src = readFileSync(file, 'utf8');
            violations.push(...scanSource(src, relative(root, file).replace(/\\/g, '/')));
        }
    }
    return { scanned, violations };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    const { scanned, violations } = scanRepo();
    if (process.argv.includes('--json')) {
        console.log(JSON.stringify(violations, null, 2));
    }
    if (violations.length > 0) {
        console.error('check-worklets: plain-JS calls inside Reanimated worklets\n');
        for (const v of violations) {
            console.error(`  ${v.file}:${v.line}  [${v.hook}]  calls ${v.fn}()`);
        }
        console.error(`
A worklet's closure is serialized into Reanimated's UI-thread runtime, where a
plain JS function arrives as an OBJECT, not a callable. Calling it throws
"CppException: Object is not a function" on the UI thread — uncatchable, and
Android kills the process. Web never reproduces it (no separate UI runtime).

Fix: read the value on the JS thread and let the worklet capture the RESULT,
or mark the callee 'worklet'. If a call really is worklet-safe, annotate the
line with "// worklet-safe".`);
        process.exit(1);
    }
    console.log(`check-worklets: ${scanned} file(s) clean — no plain-JS calls inside worklets.`);
}
