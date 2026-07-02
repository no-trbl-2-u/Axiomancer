/**
 * Hermetic structural tests — Hermes-native UI playtest harness contract.
 *
 * The harness is a procedure/config pair that Hermes reads and executes with
 * native browser tools. These tests pin the public contract so future edits do
 * not erode Tobin-facing report quality or accidentally reintroduce Claude MCP
 * coupling.
 */

import { describe, expect, it } from '@jest/globals';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const SKILL_PATH = resolve(__dirname, '..', '..', 'skills', 'hermes-playtest.md');
const CONFIG_PATH = resolve(__dirname, '..', '..', 'automation', 'hermes-ui-playtest.config.json');

describe('Hermes UI playtest harness files', () => {
    it('ships the Hermes procedure and config', () => {
        expect(existsSync(SKILL_PATH)).toBe(true);
        expect(existsSync(CONFIG_PATH)).toBe(true);
    });
});

describe('skills/hermes-playtest.md contract', () => {
    const body = readFileSync(SKILL_PATH, 'utf8');

    it('uses Hermes-native browser and process tools instead of Claude MCP names', () => {
        expect(body).toContain('browser_navigate');
        expect(body).toContain('browser_snapshot');
        expect(body).toContain('browser_console');
        expect(body).toContain('process(action="kill")');
        expect(body).not.toContain('mcp__playwright__');
    });

    it('requires Tobin-facing evidence and report sections', () => {
        for (const section of [
            '## Tobin-facing report contract',
            '## Required paths',
            '## Evidence rubric',
            '## Cleanup',
        ]) {
            expect(body).toContain(section);
        }
        for (const phrase of [
            'mechanic-to-UI fidelity',
            'player psychology',
            'friction',
            'delight',
            'verdict-ready summary',
        ]) {
            expect(body).toContain(phrase);
        }
    });
});

describe('automation/hermes-ui-playtest.config.json contract', () => {
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));

    it('defines server startup in a Hermes-compatible shape', () => {
        expect(config.server.command).toContain('npx expo start --web');
        expect(config.server.port).toBe(18081);
        expect(config.server.readyPattern).toContain('Waiting on http://localhost:18081');
        expect(config.server.killPolicy).toBe('kill-only-if-started-by-harness');
    });

    it('defines thorough paths for Tobin-facing reports', () => {
        const ids = config.paths.map((path: { id: string }) => path.id);
        expect(ids).toEqual(expect.arrayContaining([
            'golden-encounter',
            'failure-and-retreat',
            'tab-literacy',
            'edge-probes',
            'mechanics-fidelity',
        ]));
    });

    it('defines deterministic seeds for all five minigames', () => {
        expect(Object.keys(config.minigameSeeds).sort()).toEqual([
            'cache',
            'gathering',
            'hazard',
            'quest',
            'rest',
        ]);
        for (const key of ['hazard', 'gathering', 'rest', 'cache', 'quest']) {
            expect(config.minigameSeeds[key].seed).toEqual(expect.any(Number));
        }
        expect(config.minigameSeeds.hazard.hazardId).toEqual(expect.any(String));
        expect(config.minigameSeeds.gathering.siteId).toEqual(expect.any(String));
        expect(config.minigameSeeds.quest.boardId).toEqual(expect.any(String));
    });

    it('captures report schema fields needed for triage and Tobin review', () => {
        expect(config.report.requiredSections).toEqual(expect.arrayContaining([
            'verdict-ready summary',
            'paths walked',
            'findings',
            'mechanic-to-UI fidelity notes',
            'delight log',
            'console and network',
            'Tobin questions',
        ]));
        expect(config.report.findingFields).toEqual(expect.arrayContaining([
            'id',
            'severity',
            'type',
            'location',
            'playerFeeling',
            'mechanicImplication',
            'evidence',
            'expected',
            'actual',
            'tobinPrompt',
        ]));
    });
});
