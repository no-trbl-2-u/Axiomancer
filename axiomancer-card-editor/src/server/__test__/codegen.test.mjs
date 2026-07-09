/**
 * Self-contained round-trip test for skillCodegen.
 *
 * Copies the REAL src/Cards/cards.library.ts to a TEMP file, then exercises
 * upsert(new) → upsert(edit existing) → remove on the TEMP TEXT ONLY, asserting
 * the splices behave. It NEVER mutates the real source file (verified by an
 * before/after content compare at the end).
 *
 * Run:  node editor-web/src/server/__test__/codegen.test.mjs
 * Node ≥ 23.6 (this repo runs v24) strips the type annotations from the
 * imported .ts module natively — no build step / test framework needed.
 * Exits 0 on PASS, 1 on FAIL.
 */
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { serialize, upsertCard, removeCard, identFromId } from '../skillCodegen.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const REAL_LIB = path.resolve(here, '../../../../axiomancer-mechanics/src/Cards/cards.library.ts');

let failures = 0;
function check(label, cond) {
    if (cond) {
        console.log(`  ✓ ${label}`);
    } else {
        console.error(`  ✗ ${label}`);
        failures++;
    }
}

const NEW_ID = 'test-roundtrip-card';
const NEW_IDENT = identFromId(NEW_ID); // -> testRoundtripCard

const newDraft = {
    id: NEW_ID,
    name: "Tester's Gambit",
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'A deliberately long flavour line written so the serializer must wrap it ' +
        'across multiple quoted continuation lines, exactly the way the real ' +
        'hand-authored entries in the library are formatted for readability.',
    tier: 2,
    targetType: 'enemy',
    rank: 3,
    cardType: 'spell',
    free: { tickOne: true },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 3 }],
    learningRequirement: { requiresAlignment: { axis: 'outlook', op: 'lte', value: -10 } },
    tags: ['test', 'control'],
};

function countOccurrences(haystack, needle) {
    let n = 0;
    let i = 0;
    for (;;) {
        const j = haystack.indexOf(needle, i);
        if (j === -1) break;
        n++;
        i = j + needle.length;
    }
    return n;
}

async function main() {
    const realBefore = await fs.readFile(REAL_LIB, 'utf-8');

    // copy REAL -> TEMP (we operate on the temp copy only)
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillcodegen-'));
    const tmpLib = path.join(tmpDir, 'cards.library.ts');
    await fs.writeFile(tmpLib, realBefore, 'utf-8');
    const base = await fs.readFile(tmpLib, 'utf-8');

    console.log('serialize():');
    const block = serialize(newDraft);
    check('emits `const testRoundtripCard: Card = {`', block.includes(`const ${NEW_IDENT}: Card = {`));
    check('emits the id field', /id: 'test-roundtrip-card',/.test(block));
    check('smart-quotes the apostrophe name', block.includes(`name: "Tester's Gambit",`));
    check('wraps the long description with ` +` joins', block.includes(' +\n'));
    check('inlines single-element specialMechanics', block.includes('specialMechanics: [{ kind: \'guard\', amount: 3 }],'));
    check('emits rank + cardType on the tier line', block.includes("tier: 2, rank: 3, cardType: 'spell',"));
    check('emits the authored FREE line', block.includes('free: { tickOne: true },'));
    check('multi-line combatEffects array', block.includes('combatEffects: [\n'));
    check('nested learningRequirement w/ alignment', block.includes('requiresAlignment: { axis: \'outlook\', op: \'lte\', value: -10 }'));
    check('block terminates with `};`', block.trimEnd().endsWith('};'));

    console.log('upsert(new card):');
    const t1 = await (async () => {
        const out = upsertCard(base, newDraft);
        await fs.writeFile(tmpLib, out, 'utf-8');
        return out;
    })();
    check('text changed', t1 !== base);
    check('new block present', t1.includes(`const ${NEW_IDENT}: Card = {`));
    check('exactly one new block', countOccurrences(t1, `const ${NEW_IDENT}: Card = {`) === 1);
    check('registered in cardLibrary array', new RegExp(`^[ \\t]*${NEW_IDENT},`, 'm').test(t1));
    check('array membership appears once', countOccurrences(t1, `\n    ${NEW_IDENT},`) === 1);
    check('existing cards untouched (slippery-slope survives)', t1.includes("id: 'slippery-slope',"));

    console.log('upsert(edit existing — red-herring rank -> 4):');
    const editDraft = {
        ...newDraft,
        id: 'red-herring',
        name: 'Red Herring',
        philosophicalAspect: 'mind',
        rank: 4,
        free: { drawCards: 1 },
        specialMechanics: [],
        learningRequirement: undefined,
        tags: [],
        combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    };
    const t2 = await (async () => {
        const out = upsertCard(t1, editDraft);
        await fs.writeFile(tmpLib, out, 'utf-8');
        return out;
    })();
    check('redHerring still single const block', countOccurrences(t2, 'const redHerring: Card = {') === 1);
    check('edited rank present', /id: 'red-herring',[\s\S]*?rank: 4, cardType: 'spell',/.test(t2));
    // The v3 library registers several idents per line, so match the bare
    // `redHerring,` token (the const decl carries no trailing comma).
    check('redHerring array membership still single', countOccurrences(t2, 'redHerring,') === 1);
    check('new card still present after edit', t2.includes(`const ${NEW_IDENT}: Card = {`));

    console.log('remove(test-roundtrip-card):');
    const t3 = await (async () => {
        const out = removeCard(t2, NEW_ID);
        await fs.writeFile(tmpLib, out, 'utf-8');
        return out;
    })();
    check('block removed', !t3.includes(`const ${NEW_IDENT}: Card = {`));
    check('array membership removed', !new RegExp(`^[ \\t]*${NEW_IDENT},`, 'm').test(t3));
    check('red-herring edit survived removal', /id: 'red-herring',[\s\S]*?rank: 4, cardType: 'spell',/.test(t3));
    check('slippery-slope survived removal', t3.includes("id: 'slippery-slope',"));
    check('removing a missing id is a no-op', removeCard(t3, 'no-such-card-xyz') === t3);

    // SAFETY: the real source file must be byte-identical to before.
    const realAfter = await fs.readFile(REAL_LIB, 'utf-8');
    console.log('safety:');
    check('REAL cards.library.ts is UNCHANGED', realAfter === realBefore);

    await fs.rm(tmpDir, { recursive: true, force: true });

    console.log('');
    if (failures === 0) {
        console.log('PASS — all round-trip assertions held.');
        process.exit(0);
    } else {
        console.error(`FAIL — ${failures} assertion(s) failed.`);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error('FAIL — uncaught error:', err);
    process.exit(1);
});
