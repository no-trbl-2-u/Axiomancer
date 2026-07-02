/**
 * Hermetic unit tests for `createNodeAdapter`.
 *
 * Cover the three behaviours that aren't exercised elsewhere:
 *   - Round-trip save → load reproduces the state.
 *   - `load()` returns null when the save file is missing.
 *   - `load()` returns null (with a warning) when the file is malformed.
 *
 * Filesystem boundary is acceptable here — the adapter's job is fs I/O,
 * so the test runs against a real tmpfile path. Each case uses a fresh
 * `os.tmpdir()` + `crypto.randomUUID()` filename and cleans up after
 * itself.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { createNodeAdapter } from './node.adapter';
import { createNewGameState } from '../game.reducer';
import type { GameState } from '../types';

function tmpSavePath(): string {
    return path.join(os.tmpdir(), `axiomancer-save-${randomUUID()}.json`);
}

const writtenFiles: string[] = [];

function track(p: string): string {
    writtenFiles.push(p);
    return p;
}

afterEach(() => {
    vi.restoreAllMocks();
    while (writtenFiles.length > 0) {
        const p = writtenFiles.pop()!;
        try { fs.unlinkSync(p); } catch { /* swallow */ }
    }
});

describe('createNodeAdapter', () => {
    it('round-trips a GameState through save → load', () => {
        const filePath = track(tmpSavePath());
        const adapter = createNodeAdapter(filePath);

        const original: GameState = createNewGameState();
        adapter.save(original);

        const loaded = adapter.load();
        expect(loaded).not.toBeNull();
        expect(loaded).toEqual(original);
    });

    it('load returns null when the file does not exist', () => {
        const filePath = tmpSavePath(); // not written
        const adapter = createNodeAdapter(filePath);
        expect(fs.existsSync(filePath)).toBe(false);
        expect(adapter.load()).toBeNull();
    });

    it('load returns null and warns when the file is malformed JSON', () => {
        const filePath = track(tmpSavePath());
        fs.writeFileSync(filePath, '{not valid json,', 'utf-8');

        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const adapter = createNodeAdapter(filePath);

        expect(adapter.load()).toBeNull();
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0]?.[0]).toMatch(/save file could not be read/i);
    });

    it('save overwrites an existing file at the same path', () => {
        const filePath = track(tmpSavePath());
        const adapter = createNodeAdapter(filePath);

        const first: GameState = createNewGameState();
        adapter.save(first);

        const second: GameState = { ...first, version: first.version + 1 };
        adapter.save(second);

        const loaded = adapter.load();
        expect(loaded?.version).toBe(second.version);
    });
});
