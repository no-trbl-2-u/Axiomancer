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
const REAL_LIB = path.resolve(here, '../../../../src/Cards/cards.library.ts');

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
    basePower: 7,
    scalingStat: 'mind',
    scalingMultiplier: 1.5,
    combatEffects: [{ effectId: 'debuff_confusion', appliedTo: 'opponent', duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 3 }],
    learningRequirement: { level: 5, requiresAlignment: { axis: 'outlook', op: 'lte', value: -10 } },
    tags: ['test', 'damage'],
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
    check('existing cards untouched (ad-hominem-strike survives)', t1.includes("id: 'ad-hominem-strike',"));

    console.log('upsert(edit existing — false-dilemma basePower -> 99):');
    const editDraft = {
        ...newDraft,
        id: 'false-dilemma',
        name: 'False Dilemma',
        philosophicalAspect: 'mind',
        scalingStat: 'mind',
        basePower: 99,
        scalingMultiplier: undefined,
        specialMechanics: [],
        learningRequirement: undefined,
        tags: [],
        combatEffects: [{ effectId: 'debuff_confusion', appliedTo: 'opponent', duration: 2 }],
    };
    const t2 = await (async () => {
        const out = upsertCard(t1, editDraft);
        await fs.writeFile(tmpLib, out, 'utf-8');
        return out;
    })();
    check('falseDilemma still single const block', countOccurrences(t2, 'const falseDilemma: Card = {') === 1);
    check('edited basePower present', /id: 'false-dilemma',[\s\S]*?basePower: 99,/.test(t2));
    check('falseDilemma array membership still single', countOccurrences(t2, '\n    falseDilemma,') === 1);
    check('new card still present after edit', t2.includes(`const ${NEW_IDENT}: Card = {`));

    console.log('remove(test-roundtrip-card):');
    const t3 = await (async () => {
        const out = removeCard(t2, NEW_ID);
        await fs.writeFile(tmpLib, out, 'utf-8');
        return out;
    })();
    check('block removed', !t3.includes(`const ${NEW_IDENT}: Card = {`));
    check('array membership removed', !new RegExp(`^[ \\t]*${NEW_IDENT},`, 'm').test(t3));
    check('false-dilemma edit survived removal', /id: 'false-dilemma',[\s\S]*?basePower: 99,/.test(t3));
    check('ad-hominem-strike survived removal', t3.includes("id: 'ad-hominem-strike',"));
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
