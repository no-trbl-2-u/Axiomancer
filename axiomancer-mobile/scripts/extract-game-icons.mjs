#!/usr/bin/env node
/**
 * extract-game-icons.mjs — Phase V1 (the Woodcut Codex).
 *
 * Reads the curated icon manifest below, pulls each SVG's geometry out
 * of the owner-provided game-icons.net library at
 * `<repo>/Potential Assets/icons-TBR/ffffff/transparent/1x1/`, and
 * regenerates `components/icons/game-icon-paths.ts` (checked in — the
 * app never reads the library at runtime).
 *
 * To add an icon: add a manifest row, run
 * `node scripts/extract-game-icons.mjs`, give it a label in
 * `components/icons/icon-registry.ts`, and commit both.
 *
 * License: game-icons.net marks are CC BY 3.0 (some artists CC0) —
 * see `Potential Assets/icons-TBR/license.txt`. Attribution is carried
 * per-entry in the generated file.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIBRARY = join(HERE, '..', '..', 'Potential Assets', 'icons-TBR', 'ffffff', 'transparent', '1x1');
const OUT = join(HERE, '..', 'components', 'icons', 'game-icon-paths.ts');

/** registry name → library path (artist/file, no extension) */
const MANIFEST = {
    'action-sword': 'lorc/crossed-swords',
    'action-shield': 'delapouite/templar-shield',
    'action-arcane': 'lorc/magic-swirl',
    'action-bag': 'lorc/knapsack',
    'action-flee': 'lorc/wingfoot',
    'action-eye': 'lorc/semi-closed-eye',
    'action-crown': 'lorc/crown',
    'action-boss': 'lorc/crowned-skull',
    'action-chest': 'skoll/open-treasure-chest',
    'action-scroll': 'lorc/scroll-unfurled',
    'action-quill': 'delapouite/scroll-quill',
    'effect-poison': 'lorc/poison-bottle',
    'effect-bleed': 'lorc/droplets',
    'effect-stun': 'delapouite/star-struck',
    'effect-regen': 'zeromancer/heart-plus',
    'effect-burn': 'lorc/small-fire',
    'effect-buff': 'delapouite/biceps',
    'effect-debuff': 'lorc/despair',
    'effect-shield': 'lorc/bordered-shield',
};

const rows = Object.entries(MANIFEST).map(([name, source]) => {
    const svg = readFileSync(join(LIBRARY, `${source}.svg`), 'utf8');
    const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
    const ds = [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);
    if (!viewBox || ds.length === 0) {
        throw new Error(`no geometry extracted from ${source}`);
    }
    return { name, source, viewBox, ds };
});

const body = rows
    .map(({ name, source, viewBox, ds }) => {
        const paths = ds.map((d) => `            '${d.replace(/'/g, "\\'")}',`).join('\n');
        return `    '${name}': {\n        source: '${source}',\n        viewBox: '${viewBox}',\n        ds: [\n${paths}\n        ],\n    },`;
    })
    .join('\n');

writeFileSync(
    OUT,
    `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Curated silhouettes from the owner-provided game-icons.net library
 * (\`Potential Assets/icons-TBR\`, CC BY 3.0 / CC0 per artist — see the
 * library's license.txt). Regenerate with:
 *
 *   node scripts/extract-game-icons.mjs
 *
 * \`source\` is the attribution key: \`<artist>/<icon>\` on game-icons.net.
 */

export interface GameIconGeometry {
    /** game-icons.net attribution: artist/icon-name. */
    readonly source: string;
    readonly viewBox: string;
    readonly ds: readonly string[];
}

export const GAME_ICON_PATHS = {
${body}
} as const satisfies Record<string, GameIconGeometry>;

export type GameIconName = keyof typeof GAME_ICON_PATHS;
`,
);

console.log(`wrote ${rows.length} icons -> ${OUT}`);
