/**
 * Export the game's canonical libraries into flat JSON the zero-dep DevLog
 * catalog build (`scripts/build-catalog.mjs`) renders into HTML pages. This is
 * the one place the art-free mechanics package meets the mobile art registries,
 * so the catalog can show real paintings next to real data.
 *
 * Run it (repo root):  npm run catalog:export
 * Then render HTML:     npm run catalog:build
 * Or both at once:      npm run catalog
 *
 * It writes:
 *   devlog/data/{cards,enemies,effects}.json  — flat records for the renderer
 *   devlog/assets/catalog/cards/*             — copied card paintings
 *   devlog/assets/catalog/enemies/*           — copied enemy portraits
 *
 * Card / enemy art lives in the mobile package as Metro `require('./x.webp')`
 * literals (not importable from Node), so the two art registries are parsed as
 * text to recover the id/key → filename mapping, then the files are copied into
 * devlog/ so the served site is self-contained.
 */

import {
    readFileSync,
    writeFileSync,
    mkdirSync,
    copyFileSync,
    existsSync,
    rmSync,
} from 'node:fs';
import { join } from 'node:path';

import { cardLibrary } from '../src/Cards/cards.library';
import { EnemyLibrary } from '../src/Enemy/enemy.library';
import { effectsLibrary, lookupEffect } from '../src/Effects/effects.library';
// Pure, dependency-free presentation mapping (effect → glyph + colour).
import { effectGlyph } from '../../axiomancer-mobile/components/combat/statusGlyphs';

const MECH = join(__dirname, '..');
const ROOT = join(MECH, '..');
const DEVLOG = join(ROOT, 'devlog');
const DATA = join(DEVLOG, 'data');
const CATALOG_ASSETS = join(DEVLOG, 'assets', 'catalog');

const MOBILE_IMAGES = join(ROOT, 'axiomancer-mobile', 'assets', 'images');
const CARD_ART_DIR = join(MOBILE_IMAGES, 'cards');
const ENEMY_ART_DIR = join(MOBILE_IMAGES, 'enemies');

// ---------------------------------------------------------------------------
// Art registry parsing — recover id/key → source filename from the mobile
// `index.ts` files (Metro require literals, so this is the only sane read path).
// ---------------------------------------------------------------------------

/** Enemy registry: `'portrait-key': require('./file.webp'),` — key → filename. */
function parseEnemyArt(): Record<string, string> {
    const src = readFileSync(join(ENEMY_ART_DIR, 'index.ts'), 'utf8');
    const map: Record<string, string> = {};
    const re = /'([^']+)':\s*require\('\.\/([^']+)'\)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) map[m[1]] = m[2];
    return map;
}

/**
 * Card registry is two-level: `const varName = require('./file.webp')` then
 * `'card-id': varName,` inside CARD_ART_BY_ID. Resolve id → filename, with the
 * shared placeholder as the fallback for unmapped ids.
 */
function parseCardArt(): { byId: Record<string, string>; fallback: string } {
    const src = readFileSync(join(CARD_ART_DIR, 'index.ts'), 'utf8');
    const varToFile: Record<string, string> = {};
    const varRe = /const\s+(\w+)\s*=\s*require\('\.\/([^']+)'\)/g;
    let m: RegExpExecArray | null;
    while ((m = varRe.exec(src)) !== null) varToFile[m[1]] = m[2];

    const fallbackMatch = src.match(/FALLBACK_CARD_ART\s*=\s*require\('\.\/([^']+)'\)/);
    const fallback = fallbackMatch ? fallbackMatch[1] : 'circe-placeholder.jpg';

    const byId: Record<string, string> = {};
    const idRe = /'([^']+)':\s*(\w+)\s*,/g;
    while ((m = idRe.exec(src)) !== null) {
        const file = varToFile[m[2]];
        if (file) byId[m[1]] = file;
    }
    return { byId, fallback };
}

/** Copy a source painting into devlog/ and return the site-relative path. */
function copyArt(srcDir: string, file: string, subdir: string): string | null {
    const from = join(srcDir, file);
    if (!existsSync(from)) return null;
    const destDir = join(CATALOG_ASSETS, subdir);
    mkdirSync(destDir, { recursive: true });
    copyFileSync(from, join(destDir, file));
    return `./assets/catalog/${subdir}/${file}`;
}

// ---------------------------------------------------------------------------
// How an enemy fights — human blurb per AI logic (Spec 07 / Enemy/types.ts).
// ---------------------------------------------------------------------------
const LOGIC_BLURB: Record<string, string> = {
    random: 'Unpredictable — any stance, any action, no pattern to read.',
    aggressive: 'Aggressive — attacks most turns, countering your last stance.',
    defensive: 'Defensive — turtles until wounded, then strikes your weakest stat.',
    balanced: 'Balanced — presses while healthy, defends once below half HP.',
    strategic: 'Strategic — reads your active effects and exploits your vulnerabilities.',
    boss: 'Boss script — a telegraphed, round-keyed signature pattern.',
};

// ---------------------------------------------------------------------------
// Raw-stat summarizers — turn a typed Card / Effect into flat, display-ready
// stat rows. `chips` are compact key/value badges; `lines` are the mechanical
// effects spelled out. No flavour text — just the numbers.
// ---------------------------------------------------------------------------
type Chip = { k: string; v: string };
const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
const pct = (n: number) => `${n > 0 ? '+' : ''}${Math.round((n - 1) * 100)}%`;

/** A card's special-mechanic entry → one short label. */
function specialMechanicLabel(sm: any): string {
    const amt = sm.amount ?? sm.count ?? sm.multiplier;
    switch (sm.kind) {
        case 'guard': return `Guard ${sm.amount}`;
        case 'barrier': return `Barrier ${sm.amount ?? ''}`.trim();
        case 'execute': return (
            `Execute < ${Math.round(sm.hpPct * 100)}% HP (needs ${sm.dotStacks} DoT` +
            `${sm.recoilPct ? `, recoil ${Math.round(sm.recoilPct * 100)}%` : ''})`
        );
        case 'amplify': return `Amplify pending DoT ×${sm.multiplier}`;
        case 'rupture': return 'Rupture (consume DoT)';
        default: return amt != null ? `${sm.kind} ${amt}` : String(sm.kind);
    }
}

function cardStats(c: any): { chips: Chip[]; lines: string[] } {
    const chips: Chip[] = [
        { k: 'Stance', v: c.philosophicalAspect },
        { k: 'Type', v: c.category },
        { k: 'Tier', v: String(c.tier) },
        { k: 'Target', v: c.targetType === 'self' ? 'self' : 'enemy' },
    ];
    const mult = c.scalingMultiplier && c.scalingMultiplier !== 1 ? `×${c.scalingMultiplier}` : '';
    chips.push({ k: 'Power', v: `${c.basePower} + ${c.scalingStat}${mult}` });
    if (c.learningRequirement?.level) chips.push({ k: 'Learn', v: `Lv ${c.learningRequirement.level}` });

    const lines: string[] = [];
    for (const ce of c.combatEffects ?? []) {
        const nm = lookupEffect(ce.effectId)?.name ?? ce.effectId;
        const who = ce.appliedTo === 'self' ? 'self' : 'enemy';
        const dur = ce.duration ? `, ${ce.duration}t` : '';
        lines.push(`Applies ${nm} ×${ce.intensity ?? 1}${dur} → ${who}`);
    }
    for (const sm of c.specialMechanics ?? []) lines.push(specialMechanicLabel(sm));
    if (c.threshold) lines.push(`Threshold: ${c.threshold.count}× ${c.threshold.color} die fires a rider`);
    if (c.dieBonus) lines.push(`Die bonus: powering die ${c.dieBonus.onColor} fires a rider`);
    if (c.fate) lines.push(`Fate: playable by an X die${c.fate.recoilHp ? ` (recoil ${c.fate.recoilHp} HP)` : ''}`);
    if (c.synergy) lines.push('Synergy clause (stance-switch payoff)');
    return { chips, lines };
}

/** An effect's payload → short mechanical stat lines. */
function payloadLines(p: any): string[] {
    if (!p) return [];
    const out: string[] = [];
    for (const m of p.statModifiers ?? []) {
        out.push(`${m.stat} ${m.isMultiplier ? `×${m.value}` : signed(m.value)}`);
    }
    const d = p.damageOverTime;
    if (d) out.push(`DoT ${d.damagePerRound}/round × intensity (${d.damageType}, ticks ${d.tickPhase ?? 'start'})`);
    const rh = p.regeneration?.healthPerRound;
    if (rh) out.push(`${rh > 0 ? `Regen +${rh}` : `Drain ${rh}`} HP/round`);
    if (p.rollModifier) out.push(`Roll ${signed(p.rollModifier)}`);
    if (p.rollModifierPerIntensity) out.push(`Roll ${signed(p.rollModifierPerIntensity)}/intensity`);
    if (p.defenseModifier) out.push(`Defense ${signed(p.defenseModifier)}`);
    if (p.reflectDamage) out.push(`Thorns ${p.reflectDamage}/intensity`);
    if (p.damageTakenMult && p.damageTakenMult !== 1) out.push(`Damage taken ${pct(p.damageTakenMult)}`);
    if (p.damageTakenMultForStance) {
        const s = p.damageTakenMultForStance;
        out.push(`Damage taken ${pct(s.mult)} from ${s.stance} plays`);
    }
    if (p.outgoingDamageMulPct) out.push(`Outgoing damage ${signed(p.outgoingDamageMulPct)}%`);
    if (p.powerMulPct) out.push(`Card power ${signed(p.powerMulPct)}%`);
    if (p.healingReceivedMulPct) out.push(`Healing received ${signed(p.healingReceivedMulPct)}%`);
    const ar = p.actionRestriction;
    if (ar?.skipTurn) out.push('Skips turn');
    if (ar?.forcedStance) out.push(`Forced stance: ${ar.forcedStance}`);
    if (ar?.blockedStances?.length) out.push(`Blocks stance: ${ar.blockedStances.join(', ')}`);
    const av = p.advantageModifier;
    if (av?.grantAdvantage?.length) out.push(`Advantage: ${av.grantAdvantage.join(', ')}`);
    if (av?.grantDisadvantage?.length) out.push(`Disadvantage: ${av.grantDisadvantage.join(', ')}`);
    if (p.revealsStance) out.push('Reveals hidden stance');
    if (p.blocksAdvantage) out.push('Blocks advantage/crit');
    if (p.reducesControlAccuracy) out.push('Reduces control accuracy');
    if (p.nextDotTierUpgrade) out.push(`Next DoT tick +${p.nextDotTierUpgrade} tier`);
    if (p.restrictsSurgeAccess) out.push('Denies enemy surge (next play weak-tier)');
    if (p.forceWildOnNextDie) out.push(`Next ${p.colorChoice ?? ''} die counts as Wild`.replace('  ', ' '));
    if (p.consumedOnUse && out.length === 0) out.push('Single-use trigger');
    return out;
}

// ---------------------------------------------------------------------------
// Build the three record sets
// ---------------------------------------------------------------------------
function buildCards() {
    const { byId, fallback } = parseCardArt();
    const seen = new Set<string>();
    return cardLibrary
        .filter((c) => {
            if (seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
        })
        .map((c) => {
            const file = byId[c.id] ?? fallback;
            const image = copyArt(CARD_ART_DIR, file, 'cards');
            return { id: c.id, name: c.name, image, ...cardStats(c) };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
}

function buildEnemies() {
    const art = parseEnemyArt();
    return EnemyLibrary.map((e: any) => {
        const file = art[e.portraitAsset];
        const image = file ? copyArt(ENEMY_ART_DIR, file, 'enemies') : null;
        const skills = (e.skills ?? []).map((s: any) => ({
            name: s.name,
            text: s.description ?? '',
        }));
        return {
            id: e.id,
            name: e.name,
            image,
            level: e.level,
            difficulty: e.difficulty,
            maxHealth: e.maxHealth,
            stats: {
                body: e.baseStats?.body ?? 0,
                mind: e.baseStats?.mind ?? 0,
                heart: e.baseStats?.heart ?? 0,
            },
            logic: e.logic,
            logicBlurb: LOGIC_BLURB[e.logic] ?? e.logic,
            stanceHint: e.stanceHint ?? '',
            skills,
        };
    }).sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || a.name.localeCompare(b.name));
}

function buildEffects() {
    const all = [...effectsLibrary.buffs, ...effectsLibrary.debuffs];
    return all
        .filter((e: any) => !(e.tags ?? []).includes('deprecated'))
        .map((e: any) => {
            const g = effectGlyph({
                id: e.id,
                name: e.name,
                type: e.type,
                category: e.category,
                payload: e.payload,
            });
            const chips: Chip[] = [
                { k: 'Type', v: e.type },
                { k: 'Category', v: e.category },
                { k: 'Tier', v: String(e.tier) },
                {
                    k: 'Duration',
                    v: e.duration === -1 ? 'permanent' : e.duration === 0 ? 'instant' : `${e.duration} rounds`,
                },
                { k: 'Stacking', v: e.stacking },
            ];
            return {
                id: e.id,
                name: e.name,
                type: e.type as 'buff' | 'debuff',
                glyph: g.glyph,
                color: g.color,
                kind: g.kind,
                chips,
                lines: payloadLines(e.payload),
            };
        })
        .sort(
            (a, b) =>
                a.type.localeCompare(b.type) || a.name.localeCompare(b.name),
        );
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
function main() {
    // Start the copied-art tree clean so renamed/removed paintings don't linger.
    if (existsSync(CATALOG_ASSETS)) rmSync(CATALOG_ASSETS, { recursive: true, force: true });
    mkdirSync(DATA, { recursive: true });

    const cards = buildCards();
    const enemies = buildEnemies();
    const effects = buildEffects();

    writeFileSync(join(DATA, 'cards.json'), JSON.stringify(cards, null, 1) + '\n');
    writeFileSync(join(DATA, 'enemies.json'), JSON.stringify(enemies, null, 1) + '\n');
    writeFileSync(join(DATA, 'effects.json'), JSON.stringify(effects, null, 1) + '\n');

    console.log(
        `catalog:export — ${cards.length} cards, ${enemies.length} enemies, ` +
            `${effects.length} effects → devlog/data/`,
    );
}

main();
