/**
 * Hermetic E2E — Fate Engine P1 (spec 31 §3): the DEPRECATION contract.
 *
 * Effect ids are NEVER renamed or deleted (world content, equipment, and old
 * saves resolve them forever), but ids tagged `deprecated` are BANNED from the
 * combat card library — the curated pool speaks only the canonical set. Each
 * deprecated entry may carry `deprecatedFor` naming its canonical replacement,
 * which must exist and must not itself be deprecated.
 */

import { describe, it, expect } from 'vitest';

import debuffsJson from '../debuffs.library.json';
import buffsJson from '../buffs.library.json';
import { lookupEffect } from '../effects.library';
import { cardLibrary } from '../../Cards/cards.library';
import { EFFECT_INTERACTIONS } from '../amplification.registry';
import { AUTHORED_THREAT_SEQUENCES } from '../../Combat/combat.threat-sequences';

interface LibEntry { id: string; tags?: string[]; deprecatedFor?: string }
const entries: LibEntry[] = [
    ...(debuffsJson as { debuffs: LibEntry[] }).debuffs,
    ...(buffsJson as { buffs: LibEntry[] }).buffs,
];
const deprecated = new Set(entries.filter(e => (e.tags ?? []).includes('deprecated')).map(e => e.id));
const live = new Set(entries.filter(e => !(e.tags ?? []).includes('deprecated')).map(e => e.id));

describe('effect deprecation contract (spec 31 §3)', () => {
    it('every deprecated id still RESOLVES (never renamed, never deleted)', () => {
        for (const id of deprecated) {
            expect(lookupEffect(id), `${id} must stay resolvable`).toBeDefined();
        }
    });

    it('every deprecatedFor points at a live, canonical effect', () => {
        for (const e of entries) {
            if (!e.deprecatedFor) continue;
            expect(live.has(e.deprecatedFor), `${e.id} → ${e.deprecatedFor} must be live`).toBe(true);
        }
    });

    it('the card library never references a deprecated effect id', () => {
        for (const skill of cardLibrary) {
            for (const ce of skill.combatEffects ?? []) {
                expect(deprecated.has(ce.effectId), `${skill.id} uses deprecated ${ce.effectId}`).toBe(false);
            }
            if (skill.synergy?.predicate) {
                expect(deprecated.has(skill.synergy.predicate.effectId),
                    `${skill.id} synergy predicate uses deprecated ${skill.synergy.predicate.effectId}`).toBe(false);
            }
            if (skill.synergy?.applyEffectOnFire) {
                expect(deprecated.has(skill.synergy.applyEffectOnFire.effectId),
                    `${skill.id} synergy fire-effect uses deprecated ${skill.synergy.applyEffectOnFire.effectId}`).toBe(false);
            }
        }
    });

    it('threat sequences and the combo registry speak only canonical ids', () => {
        for (const [slug, phases] of Object.entries(AUTHORED_THREAT_SEQUENCES)) {
            for (const p of phases) {
                const id = (p as { threatEffectId?: string }).threatEffectId;
                if (id) expect(deprecated.has(id), `${slug} threat uses deprecated ${id}`).toBe(false);
            }
        }
        for (const combo of EFFECT_INTERACTIONS) {
            const ids = [combo.trigger.primaryEffectId, ...combo.trigger.secondaryEffectIds, combo.result.targetEffectId];
            for (const id of ids) {
                expect(live.has(id), `combo ${combo.id} references non-canonical ${id}`).toBe(true);
                expect(deprecated.has(id), `combo ${combo.id} uses deprecated ${id}`).toBe(false);
            }
        }
    });

    it('every live combat effect does something the engine reads (no-op regression guard)', () => {
        // The live-channel list the HP engine + Fate Engine actually consume.
        for (const id of live) {
            const def = lookupEffect(id)!;
            const p = def.payload;
            const real = !!(p.damageOverTime || p.regeneration || p.actionRestriction
                || (p.rollModifier ?? 0) !== 0 || (p.rollModifierPerIntensity ?? 0) !== 0
                || p.damageTakenMult !== undefined || p.damageTakenMultForStance
                || p.reflectDamage || p.revealsStance
                || p.outgoingDamageMulPct !== undefined || p.powerMulPct !== undefined
                || p.healingReceivedMulPct !== undefined || p.dotModifiers
                || p.blocksAdvantage || p.restrictsSurgeAccess || p.forcesWeakTierNextPlay
                || p.deniesAllyBuffTargeting || p.forceWildOnNextDie || p.nextDotTierUpgrade);
            expect(real, `${id} is a live effect with no engine-read channel`).toBe(true);
        }
    });
});
