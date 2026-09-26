/**
 * Map-plate crop gate — DECISION-6 (row C-267), the follow-through on
 * S4-world-C21.
 *
 * The owner's decision was "crop the Doré plates above their baked-in
 * captions", plural. `charon-crossing.webp` was cropped and the other three
 * were not, so the codex shipped plates that still carried the scanned book's
 * blank page paper. Under `contentFit="cover"` that paper does not vanish: at
 * 1280x800 a side margin survives as a pale bar down the screen edge, at
 * 375x812 a foot margin survives as a pale rule under the art. Either way the
 * backdrop stops being an engraving bled into the void and becomes a photo of
 * a page.
 *
 * So this gate states the invariant at the asset, where the damage lives:
 *
 *   1. No shipped plate may have an outermost row or column that is FLAT BLANK
 *      PAPER — mostly above the paper floor AND tonally dead. Both halves
 *      matter: Ludgate Hill's sky is a legitimately bright edge (70% of that
 *      row sits above the floor) but it is full of ink and reads as a tonal
 *      range of ~106, while a page margin reads under 10. Testing brightness
 *      alone would demand a crop that plate does not need.
 *   2. A `post_process` note that records a crop as "AxB -> CxD" must name the
 *      file's real size. The record is the only account of what was taken off;
 *      a record that drifts from the pixels is worse than none.
 *
 * Hermetic: committed bytes off disk, no network, no device. Follows the
 * sanctioned committed-source file-scan pattern used by
 * `lib/platform/__tests__/boundary.test.ts`.
 */

import { describe, expect, it } from '@jest/globals';
import { readdirSync, readFileSync } from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const MAPS_DIR = path.resolve(__dirname, '..');

/** Luminance at or below which a pixel is ink rather than page paper, after the recorded grade. */
const PAPER_FLOOR = 105;

/** A line this bright is a candidate page margin — Ludgate's sky sits at 0.70 and is cleared by flatness. */
const PAPER_SHARE = 0.45;

/** Tonal range below this is dead flat: a scanned margin reads under 10, the flattest real edge reads 94. */
const FLAT_RANGE = 85;

type EdgeName = 'top' | 'bottom' | 'left' | 'right';

/**
 * Read every .webp plate in this directory as 8-bit greyscale samples.
 *
 * Purpose: give the assertions the plate's real pixels rather than its
 * filename, so a crop that was recorded but never applied still fails.
 * Inputs: none (reads the committed directory).
 * Outputs: one entry per plate — file name, width, height, and the raw
 * single-channel sample buffer.
 * Resolves: DECISION-6 (row C-267).
 */
async function readPlates(): Promise<
    { name: string; width: number; height: number; samples: Buffer }[]
> {
    const names = readdirSync(MAPS_DIR)
        .filter((f) => f.endsWith('.webp'))
        .sort();
    return Promise.all(
        names.map(async (name) => {
            const { data, info } = await sharp(readFileSync(path.join(MAPS_DIR, name)))
                .greyscale()
                .raw()
                .toBuffer({ resolveWithObject: true });
            const stride = info.channels;
            const samples = Buffer.alloc(info.width * info.height);
            for (let i = 0; i < samples.length; i++) samples[i] = data[i * stride];
            return { name, width: info.width, height: info.height, samples };
        }),
    );
}

/**
 * The four outermost pixel lines of a plate.
 *
 * Purpose: a page margin always reaches the very edge of the file, so the
 * outermost line is where it is provable; a partial crop that leaves one paper
 * row still fails here.
 * Inputs: the greyscale samples plus the plate's width and height.
 * Outputs: a record of edge name to that edge's samples, top/bottom read
 * left-to-right and left/right read top-to-bottom.
 * Resolves: DECISION-6 (row C-267).
 */
function edgeLines(samples: Buffer, width: number, height: number): Record<EdgeName, number[]> {
    const across = (offset: number) => Array.from({ length: width }, (_, x) => samples[offset + x]);
    const down = (offset: number) => Array.from({ length: height }, (_, y) => samples[y * width + offset]);
    return {
        top: across(0),
        bottom: across((height - 1) * width),
        left: down(0),
        right: down(width - 1),
    };
}

/**
 * Judge one edge line: is it the scanned book's blank page paper?
 *
 * Purpose: separate a bright edge that is ART (Ludgate's sky: bright and full
 * of ink) from a bright edge that is PAPER (flat, tonally dead).
 * Inputs: one edge's greyscale samples.
 * Outputs: the share of samples above the paper floor, the line's tonal range,
 * and the verdict — blank only when the line is both mostly light and flat.
 * Resolves: DECISION-6 (row C-267).
 */
function blankPaperVerdict(line: number[]): { share: number; range: number; blank: boolean } {
    const lit = line.filter((v) => v > PAPER_FLOOR).length;
    const share = lit / line.length;
    const range = Math.max(...line) - Math.min(...line);
    return { share, range, blank: share > PAPER_SHARE && range < FLAT_RANGE };
}

/**
 * The finished size a `post_process` note claims, when it records a crop.
 *
 * Purpose: hold the written account to the pixels, so "cropped 1120x895 ->
 * 1078x854" cannot outlive the file it describes.
 * Inputs: a provenance entry's `post_process` string.
 * Outputs: the recorded result size, or null when the note records no crop.
 * Resolves: DECISION-6 (row C-267).
 */
function recordedCrop(postProcess: string): { width: number; height: number } | null {
    const m = /(\d+)x(\d+)\s*->\s*(\d+)x(\d+)/.exec(postProcess);
    return m ? { width: Number(m[3]), height: Number(m[4]) } : null;
}

/**
 * Every provenance entry paired with each file it covers.
 *
 * Purpose: `covers` is a string on the oldest entry and an array on the rest;
 * flatten that difference once so the assertions stay about the art.
 * Inputs: none (reads the committed `provenance.json`).
 * Outputs: one entry per covered file — file name and its `post_process` note.
 * Resolves: DECISION-6 (row C-267).
 */
function provenanceByFile(): { name: string; postProcess: string }[] {
    const raw = JSON.parse(readFileSync(path.join(MAPS_DIR, 'provenance.json'), 'utf8')) as {
        covers: string | string[];
        post_process?: string;
    }[];
    return raw.flatMap((entry) =>
        (Array.isArray(entry.covers) ? entry.covers : [entry.covers]).map((name) => ({
            name,
            postProcess: entry.post_process ?? '',
        })),
    );
}

describe('map plates carry no page paper (DECISION-6 / C-267)', () => {
    it('finds the plates to check', async () => {
        const plates = await readPlates();
        expect(plates.map((p) => p.name)).toEqual([
            'act1-coast.webp',
            'act1-forest.webp',
            'act1-mountains.webp',
            'act1-underworld.webp',
            'charon-crossing.webp',
            'forest-dark.webp',
            'ludgate-hill.webp',
            'the-pit.webp',
            'wentworth-street.webp',
        ]);
    }, 20000);

    it('has no edge that is flat blank paper', async () => {
        const plates = await readPlates();
        const offenders: string[] = [];
        for (const plate of plates) {
            const edges = edgeLines(plate.samples, plate.width, plate.height);
            for (const [edge, line] of Object.entries(edges) as [EdgeName, number[]][]) {
                const verdict = blankPaperVerdict(line);
                if (verdict.blank) {
                    offenders.push(
                        `${plate.name} ${edge}: ${(verdict.share * 100).toFixed(0)}% above the paper `
                            + `floor over a tonal range of ${verdict.range}`,
                    );
                }
            }
        }
        expect(offenders).toEqual([]);
    }, 20000);

    it('records every crop at the size the file actually is', async () => {
        const plates = await readPlates();
        const drift: string[] = [];
        for (const { name, postProcess } of provenanceByFile()) {
            const recorded = recordedCrop(postProcess);
            if (!recorded) continue;
            const plate = plates.find((p) => p.name === name);
            expect(plate).toBeDefined();
            if (plate && (plate.width !== recorded.width || plate.height !== recorded.height)) {
                drift.push(
                    `${name}: provenance records ${recorded.width}x${recorded.height}, `
                        + `file is ${plate.width}x${plate.height}`,
                );
            }
        }
        expect(drift).toEqual([]);
    }, 20000);

    it('accounts for every plate in provenance.json', async () => {
        const plates = await readPlates();
        const covered = new Set(provenanceByFile().map((e) => e.name));
        expect(plates.filter((p) => !covered.has(p.name)).map((p) => p.name)).toEqual([]);
    }, 20000);
});
