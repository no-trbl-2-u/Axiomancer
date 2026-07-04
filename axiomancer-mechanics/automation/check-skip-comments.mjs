#!/usr/bin/env node
// automation/check-skip-comments.mjs
//
// CI gate: every `.skip(` in a `*.test.ts` file must carry a tracking-issue
// comment (`// SKIP-ISSUE: #<n>`) on the same line or the line immediately
// above it. A skip with no tracking issue is a skip nobody is accountable
// for re-enabling — this gate makes that a hard failure instead of silent
// debt.
//
//   exit 0  →  every `.skip(` is tracked
//   exit 1  →  one or more untracked `.skip(` found (listed on stderr)
//
// Wired into verify-mechanics.yml as a step before the vitest step.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP_RE = /\.skip\s*\(/;
const TRACKING_RE = /\/\/\s*SKIP-ISSUE:\s*#\d+/;

/** @param {string} dir @returns {string[]} */
function findTestFiles(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            findTestFiles(full, out);
        } else if (entry.isFile() && entry.name.endsWith('.test.ts')) {
            out.push(full);
        }
    }
    return out;
}

function main() {
    const srcDir = path.join(ROOT, 'src');
    if (!fs.existsSync(srcDir)) {
        console.error(`check-skip-comments: no 'src/' directory under ${ROOT}; run from axiomancer-mechanics/.`);
        process.exit(1);
    }

    const files = findTestFiles(srcDir);
    /** @type {{file: string, line: number, text: string}[]} */
    const untracked = [];

    for (const file of files) {
        const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            if (!SKIP_RE.test(lines[i])) continue;
            const sameLineTracked = TRACKING_RE.test(lines[i]);
            const prevLineTracked = i > 0 && TRACKING_RE.test(lines[i - 1]);
            if (!sameLineTracked && !prevLineTracked) {
                untracked.push({ file: path.relative(ROOT, file), line: i + 1, text: lines[i].trim() });
            }
        }
    }

    if (untracked.length > 0) {
        console.error('check-skip-comments: untracked .skip( found (no `// SKIP-ISSUE: #<n>` on the same or preceding line):\n');
        for (const u of untracked) {
            console.error(`  ${u.file}:${u.line}: ${u.text}`);
        }
        console.error('\nFile a tracking issue for each and add `// SKIP-ISSUE: #<n>` immediately above the `it.skip(`/`describe.skip(` line.');
        process.exit(1);
    }

    console.log(`check-skip-comments: OK (${files.length} test files scanned, all .skip( tracked).`);
}

main();
