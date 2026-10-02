/**
 * Phase R10 — no hex colour literal outside `theme/`.
 *
 * `app/`, `components/` and `state/presenters/` read every colour from a
 * named token: `AXM` (theme-driven) or `HUE` (fixed), both exported from
 * `theme/axm.ts`. This walks those trees' non-test sources and fails on any
 * quoted `#rgb`, `#rrggbb` or `#rrggbbaa` literal, naming file and line.
 * Comment text (`issue #294`) is not quoted, so it never matches.
 */

import { describe, expect, it } from '@jest/globals';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { HUE } from '../hue';

const ROOT = join(__dirname, '..', '..');
const SCANNED = ['app', 'components', join('state', 'presenters')];
const QUOTED_HEX = /(['"`])#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\1/;

function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sources(path);
        return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
    });
}

describe('hex colour literals (R10)', () => {
    it('app/, components/ and state/presenters/ hold none', () => {
        const hits = SCANNED.flatMap((d) => sources(join(ROOT, d))).flatMap((file) =>
            readFileSync(file, 'utf8')
                .split('\n')
                .flatMap((line, i) => (QUOTED_HEX.test(line) ? [`${relative(ROOT, file)}:${i + 1}`] : [])),
        );
        expect(hits).toEqual([]);
    });

    it('the guard matches the literal shapes it claims to', () => {
        for (const bad of [`'#000'`, `"#0b0812"`, `'#6fb3e055'`]) expect(QUOTED_HEX.test(bad)).toBe(true);
        for (const ok of ['issue #294', '`${accent}aa`', `'#12345'`]) expect(QUOTED_HEX.test(ok)).toBe(false);
    });

    it('every HUE token is a hex colour and no two tokens share a value', () => {
        const values = Object.values(HUE);
        for (const v of values) expect(v).toMatch(/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/);
        expect(new Set(values).size).toBe(values.length);
    });
});
