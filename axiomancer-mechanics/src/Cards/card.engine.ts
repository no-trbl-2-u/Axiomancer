/**
 * Card engine — pure execution helpers for Spec 04.
 *
 * The Hazard-Pattern combat engine drives card bottom-actions through
 * `executeCard`. Every helper here is pure: callers thread the updated state
 * forward themselves.
 */

import { Character } from '../Character/types';
import { Enemy } from '../Enemy/types';
import { ActiveEffect, Effect } from '../Effects/types';
import { lookupEffect, applyEffect } from '../Effects';
import { applyDamage, heal } from '../Combat/health';
import { removeRandomBuff } from '../Combat/effects';
import { resolveEffectApplication } from '../Combat/resist';
import { incrementFriendship } from '../Combat/combat.reducer';
import { isBefriendAttemptEligible } from '../Combat/index';
import { Combatant, CombatState } from '../Combat/types';
import {
    Card, CardCombatEffects,
    CardSpecialMechanic,
} from './types';
import { cardLibrary, getCardById } from './cards.library';

// ─── Damage Calculation ──────────────────────────────────────────────────────

/**
 * Spec 32 v3 §1 deleted `basePower` from the Card schema; THE BIG NUMBERS
 * REWRITE (2026-09-02) brought direct damage back as the combat-engine-owned
 * `deal` mechanic, not as a card magnitude, so the legacy card engine still
 * deals no damage of its own. This function is kept for API compatibility
 * (sim policies / projections multiply by it) and returns 0 unconditionally.
 */
export function calculateCardDamage(
    _actor: Combatant,
    _card: Card,
    _target?: Combatant,
): number {
    return 0;
}

// ─── Card Learning (Phase 30) ───────────────────────────────────────────────

/**
 * Returns every entry in `cardLibrary` that the character has not already
 * learned. Order matches the library order so the UI can show a stable list
 * across calls. Cards are learnable unconditionally — the legacy
 * learning-requirement gate (level / stat / prerequisite / alignment) was
 * removed 2026-07-08.
 */
export function getAvailableCards(
    character: Pick<Character, 'knownCards'>,
): Card[] {
    return cardLibrary.filter(s => !character.knownCards.includes(s.id));
}

/**
 * Appends `cardId` to `character.knownCards` when the card exists and is not
 * already known. Pure; returns the unchanged character (same reference) on any
 * guard miss.
 */
export function learnCard(
    character: Character,
    cardId: string,
): Character {
    if (character.knownCards.includes(cardId)) return character;
    if (!getCardById(cardId)) return character;
    return {
        ...character,
        knownCards: [...character.knownCards, cardId],
    };
}

// ─── Card Execution ─────────────────────────────────────────────────────────

/** One discrete thing that happened while a card resolved. */
export type CardEvent =
    | { kind: 'damage';
        cardId: string;
        target: 'self' | 'enemy';
        amount: number;
        hpBefore: number;
        hpAfter: number }
    | { kind: 'heal';
        cardId: string;
        target: 'self' | 'enemy';
        amount: number;
        hpBefore: number;
        hpAfter: number }
    | { kind: 'effect-applied';
        cardId: string;
        appliedTo: 'self' | 'enemy';
        effect: Effect;
        message: string }
    | { kind: 'buff-fumbled';
        cardId: string;
        appliedTo: 'self' | 'enemy';
        effect: Effect;
        message: string }
    | { kind: 'buff-stripped';
        cardId: string;
        target: 'self' | 'enemy';
        effect: Effect | null }
    | { kind: 'buff-converted';
        cardId: string;
        effect: Effect | null;
        message: string }
    | { kind: 'synergy-fired';
        cardId: string;
        /** Synergy damage added on top of the card's base damage.
         *  Already applied to the target by the time this event fires. */
        bonusDamage: number;
        /** Effect ids consumed from caster/target by `consumeMatched`. */
        consumedEffectIds: { caster: string[]; target: string[] };
        /** True if `clearAllEffectsBothSides` swept both sides. */
        clearedAllEffects: boolean }
    | { kind: 'friendship-incremented'; 
        cardId: string; 
        amount: number }
    | { kind: 'befriend-attempted';
        cardId: string;
        successful: boolean;
        message: string };

/** Result of `executeCard`. */
export interface CardResolution {
    state: CombatState;
    events: CardEvent[];
    /** Phase 108 - when true, indicates the card triggered mercy choice activation */
    activateMercyChoice?: boolean;
}

/** Lookup helper used by `executeCard` to resolve a card ID against an actor. */
export interface CardLookup {
    (cardId: string): Card | undefined;
}

/**
 * Runs a card end-to-end against the current `CombatState`:
 *
 *   1. Validate the card is owned (player: known / reward / haunt / curse) or
 *      in the enemy's rotation.
 *   2. Apply damage / heal based on `targetType`.
 *   3. Resolve each `combatEffects` payload through `resolveEffectApplication`
 *      so resist tier matches the card's `tier`.
 *
 * The caller — not this function — is responsible for surfacing the returned
 * `CardEvent[]` to any higher-level event stream.
 *
 * Phase 49 — `casterSide` decides which side is firing the card. Defaults
 * to `'player'` for back-compat with the pre-Phase-49 call site at
 * `src/Combat/phases/scenario.ts`. When `'enemy'`, the enemy is the caster
 * and the player is the target; `card.targetType` is interpreted relative
 * to the caster (`'self'` → caster's effects; `'enemy'` → opposing side).
 * Enemy-cast cards are validated against `Enemy.cards?` rather than
 * `Character.knownCards`.
 *
 * @throws if the card is not known (player path) or not in the enemy's
 *   rotation (enemy path), or not found in the lookup.
 */
export function executeCard(
    state: CombatState,
    cardId: string,
    lookupCard: CardLookup,
    casterSide: 'player' | 'enemy' = 'player',
): CardResolution {
    const isPlayerCaster = casterSide === 'player';
    const caster: Combatant = isPlayerCaster ? state.player : state.enemy;
    const target: Combatant = isPlayerCaster ? state.enemy : state.player;

    if (isPlayerCaster) {
        // A player OWNS a combat card when it is a learned card OR a card-reward
        // pickup — the exact two sources `buildCombatDeck` deals from. Reward
        // cards (`combatRewardCards`) enter the deck WITHOUT joining `knownCards`
        // (they bypass the learning gate — the won combat is the gate), so a
        // knownCards-only check wrongly rejected legitimately-dealt reward cards
        // and crashed combat when one was played.
        const playerCaster = caster as Character;
        // WS2.1 (spec 32 v3 CONJURE): a Haunt (spec 34 R-13: was Thoughtform)
        // is never learned and never a reward — it can only reach a hand
        // through a `conjure_card` play, so the conjuring play IS its
        // ownership provenance. The tag lives on the registry record
        // (`cards.haunts.ts`), not on player state.
        const haunt = (lookupCard(cardId)?.tags ?? []).includes('haunt');
        // PROFANE CANON (2026-08-08): a CURSE is never learned and never a
        // reward — an enemy hexes it into the combat deck (`curseCardId`), and
        // the whole point of PURGE is that the player can play it back out.
        // The hex IS its ownership provenance, exactly as the conjuring play is
        // a Haunt's.
        const cursed = lookupCard(cardId)?.theme === 'curse';
        const owned = haunt || cursed
            || playerCaster.knownCards.includes(cardId)
            || (playerCaster.combatRewardCards ?? []).includes(cardId);
        if (!owned) {
            throw new Error(`Card '${cardId}' is not known.`);
        }
    } else {
        const rotation = (caster as Enemy).cards ?? [];
        if (!rotation.some(s => s.id === cardId)) {
            throw new Error(`Card '${cardId}' is not in the enemy's rotation.`);
        }
    }

    const card = lookupCard(cardId);
    if (!card) {
        throw new Error(`Card '${cardId}' not found in library.`);
    }

    const events: CardEvent[] = [];

    let workingCaster: Combatant = caster;
    let workingTarget: Combatant = target;

    // Phase 93: Only apply damage resistance for enemy-targeting cards
    // Self-targeting cards (heals) shouldn't have resistance applied
    const resistanceTarget = card.targetType === 'enemy' ? workingTarget : undefined;
    const damage = calculateCardDamage(workingCaster, card, resistanceTarget);

    // Phase 66 — synergy clause. Evaluate predicate against the
    // pre-damage effects pool (so the matched effect's intensity /
    // duration still reflects the field-state the caster saw); apply
    // synergy damage on top of the base damage; then run any
    // side-effects (consume matched / consume all resources / clear
    // both sides / apply effect on fire). Per D7, this happens before
    // the card's own `combatEffects` apply.
    // WS4.2 — a synergy clause carrying a combat-STATE predicate is
    // Hazard-Pattern-combat vocabulary (its ledger doesn't exist here): the
    // card engine no-ops it, mirroring how it no-ops `specialMechanics`.
    if (card.synergy && !card.synergy.statePredicate) {
        const syn = card.synergy;
        const pool = syn.predicate?.on === 'caster' ? workingCaster.effects : workingTarget.effects;
        const matched = syn.predicate
            ? pool.find(e =>
                e.effectId === syn.predicate!.effectId
                && (syn.predicate!.intensityMin === undefined || (e.intensity ?? 0) >= syn.predicate!.intensityMin)
                && (syn.predicate!.durationMin === undefined || (e.remainingDuration ?? 0) >= syn.predicate!.durationMin)
            ) ?? null
            : null;
        const fired = !syn.predicate || matched !== null;
        if (fired) {
            const bonusDamage =
                (syn.bonusDamage ?? 0)
                + (matched ? (matched.intensity ?? 0) * (syn.intensityDamageMul ?? 0) : 0)
                + (matched ? (matched.remainingDuration ?? 0) * (syn.durationDamageMul ?? 0) : 0);

            // Apply synergy damage to the same side as the card's
            // primary damage (enemy-targeted cards hit the enemy;
            // self-targeted cards heal the caster).
            if (bonusDamage > 0) {
                if (card.targetType === 'enemy') {
                    workingTarget = applyDamage(workingTarget, bonusDamage);
                } else {
                    workingCaster = heal(workingCaster, bonusDamage);
                }
            }

            // consumeMatched — clear the matched ActiveEffect.
            const consumedEffectIds: { caster: string[]; target: string[] } = { caster: [], target: [] };
            if (syn.consumeMatched && matched && syn.predicate) {
                if (syn.predicate.on === 'caster') {
                    workingCaster = { ...workingCaster, effects: workingCaster.effects.filter(e => e !== matched) };
                    consumedEffectIds.caster.push(matched.effectId);
                } else {
                    workingTarget = { ...workingTarget, effects: workingTarget.effects.filter(e => e !== matched) };
                    consumedEffectIds.target.push(matched.effectId);
                }
            }

            // clearAllEffectsBothSides — clear every ActiveEffect on
            // both combatants. Per D9 this includes Phase 60 set-bonus
            // passives (sourceId: 'set-bonus', remainingDuration: -1).
            if (syn.clearAllEffectsBothSides) {
                workingCaster = { ...workingCaster, effects: [] };
                workingTarget = { ...workingTarget, effects: [] };
            }

            // applyEffectOnFire — apply the additional effect on the
            // caster. Uses the same applyCardEffect path the rest of
            // the engine uses (so resist / rebound / stacking semantics
            // are honoured).
            if (syn.applyEffectOnFire) {
                const result = applyCardEffect(
                    syn.applyEffectOnFire, card, workingCaster, workingTarget, state.round,
                );
                workingCaster = result.caster;
                workingTarget = result.target;
                events.push(...result.events);
            }

            events.push({
                kind: 'synergy-fired', cardId,
                bonusDamage,
                consumedEffectIds,
                clearedAllEffects: syn.clearAllEffectsBothSides ?? false,
            });
        }
    }

    if (damage > 0) {
        if (card.targetType === 'enemy') {
            const hpBefore = workingTarget.health;
            workingTarget = applyDamage(workingTarget, damage);
            events.push({
                kind: 'damage', cardId, target: 'enemy',
                amount: damage, hpBefore, hpAfter: workingTarget.health,
            });
        } else {
            const hpBefore = workingCaster.health;
            workingCaster = heal(workingCaster, damage);
            events.push({
                kind: 'heal', cardId, target: 'self',
                amount: damage, hpBefore, hpAfter: workingCaster.health,
            });
        }
    }

    for (const payload of card.combatEffects ?? []) {
        const result = applyCardEffect(
            payload, card, workingCaster, workingTarget, state.round,
        );
        workingCaster = result.caster;
        workingTarget = result.target;
        events.push(...result.events);
    }

    for (const mechanic of card.specialMechanics ?? []) {
        const result = applySpecialMechanic(
            mechanic, card, workingCaster, workingTarget, state.round, state,
        );
        workingCaster = result.caster;
        workingTarget = result.target;
        events.push(...result.events);
    }

    // Phase 91 — friendship increment processing
    let workingState = {
        ...state,
        player: (isPlayerCaster ? workingCaster : workingTarget) as Character,
        enemy: (isPlayerCaster ? workingTarget : workingCaster) as Enemy,
    };
    if (card.incrementsFriendship && card.incrementsFriendship > 0) {
        for (let i = 0; i < card.incrementsFriendship; i++) {
            workingState = incrementFriendship(workingState);
        }
        events.push({ 
            kind: 'friendship-incremented', 
            cardId, 
            amount: card.incrementsFriendship 
        });
    }

    const nextPlayer = (isPlayerCaster ? workingCaster : workingTarget) as Character;
    const nextEnemy  = (isPlayerCaster ? workingTarget : workingCaster) as Enemy;

    // Phase 108 — Check for successful befriend attempts to activate mercy choice
    const successfulBefriend = events.find(
        e => e.kind === 'befriend-attempted' && e.successful
    );
    const activateMercyChoice = Boolean(successfulBefriend);

    return {
        state: {
            ...workingState,
            player: nextPlayer,
            enemy:  nextEnemy,
        },
        events,
        activateMercyChoice,
    };
}

interface CardEffectResult {
    caster: Combatant;
    target: Combatant;
    events: CardEvent[];
}

/**
 * Routes a single `CardCombatEffects` payload through the Spec 03
 * `resolveEffectApplication` resolver and lands the outcome on the correct
 * combatant. Tier-driven resist behaviour is inherited from the underlying
 * effect definition (Tier 1 auto, Tier 2 resisted, Tier 3 nat-20 only).
 *
 * `payload.intensity` and `payload.duration` override the effect's default
 * stack/duration so cards like Liar's Echo (+2 intensity, 2-round mark) and
 * Sorites' Cascade (intensity-2 bleed) can lean on the same library entry as
 * the proc system without warping the underlying effect definition.
 *
 * Phase 49 — caster-agnostic. `payload.appliedTo === 'self'` routes to
 * `caster.effects`; `'enemy'` routes to `target.effects` (the opposing
 * side, regardless of which Combatant subtype that is).
 */
function applyCardEffect(
    payload: CardCombatEffects,
    card: Card,
    caster: Combatant,
    target: Combatant,
    round: number,
): CardEffectResult {
    const events: CardEvent[] = [];
    const effect = lookupEffect(payload.effectId);
    if (!effect) {
        return { caster, target, events };
    }

    const targetIsSelf = payload.appliedTo === 'self';
    const effectTarget: Combatant = targetIsSelf ? caster : target;
    const intensityOverride = payload.intensity;
    const durationOverride  = payload.duration;

    const built = buildActiveEffect(effect, round, intensityOverride, durationOverride);
    const result = resolveEffectApplication(
        effectTarget,
        built,
        effect.type,
        caster.baseStats.heart,
    );

    // When the card payload explicitly overrides duration we must apply in
    // `additive` mode so the override survives the apply path, which otherwise
    // resets to `effect.duration` on first application. The override value is
    // also the value to write.
    const buildApplyOptions = (intensity: number, duration: number) => {
        if (durationOverride !== undefined) {
            return {
                intensityDelta: intensity,
                durationMode:   'additive' as const,
                durationDelta:  duration,
            };
        }
        return {
            intensityDelta: intensity,
            durationDelta:  duration,
        };
    };

    if (!result.success) {
        events.push({
            kind: 'buff-fumbled', cardId: card.id,
            appliedTo: targetIsSelf ? 'self' : 'enemy',
            effect, message: result.message,
        });
        return { caster, target, events };
    }

    const appliedIntensity = result.activeEffect?.intensity ?? intensityOverride ?? 1;
    const appliedDuration  = result.activeEffect?.remainingDuration ?? durationOverride ?? effect.duration;

    const applied = applyEffect(
        effectTarget.effects, effect, round,
        { ...buildApplyOptions(appliedIntensity, appliedDuration), sourceId: caster.id },
    );

    events.push({
        kind: 'effect-applied', cardId: card.id,
        appliedTo: targetIsSelf ? 'self' : 'enemy',
        effect, message: result.message,
    });

    if (targetIsSelf) {
        return {
            caster: { ...caster, effects: applied.activeEffects } as Combatant,
            target,
            events,
        };
    }
    return {
        caster,
        target: { ...target, effects: applied.activeEffects } as Combatant,
        events,
    };
}

function buildActiveEffect(
    effect: Effect,
    round: number,
    intensityOverride?: number,
    durationOverride?: number,
): ActiveEffect {
    return {
        effectId:          effect.id,
        remainingDuration: durationOverride  ?? effect.duration,
        intensity:         intensityOverride ?? 1,
        appliedAt:         round,
        tier:              effect.tier,
        resistedBy:        effect.resistedBy,
        resistDR:          effect.resistDR,
    };
}

// ─── Special Mechanics ───────────────────────────────────────────────────────

/**
 * Resolves a `CardSpecialMechanic` (buff-strip, conversion, secondary heal,
 * etc.) against the current working player / enemy snapshots and returns the
 * updated snapshots plus any `CardEvent`s the resolver should forward to
 * the combat event stream.
 *
 * Mechanics run AFTER `combatEffects` so that, for example, Ship of Theseus
 * sees the same buff list a player can observe in the CLI before this round
 * resolves.
 */
function applySpecialMechanic(
    mechanic: CardSpecialMechanic,
    card: Card,
    caster: Combatant,
    target: Combatant,
    round: number,
    state: CombatState,
): CardEffectResult {
    const events: CardEvent[] = [];

    switch (mechanic.kind) {
        case 'strip_random_buff': {
            if (mechanic.appliedTo === 'enemy') {
                const { target: nextTarget, removed } = removeRandomBuff(target);
                events.push({
                    kind: 'buff-stripped', cardId: card.id, target: 'enemy',
                    effect: removed ? lookupEffect(removed.effectId) ?? null : null,
                });
                return { caster, target: nextTarget, events };
            }
            const { target: nextCaster, removed } = removeRandomBuff(caster);
            events.push({
                kind: 'buff-stripped', cardId: card.id, target: 'self',
                effect: removed ? lookupEffect(removed.effectId) ?? null : null,
            });
            return { caster: nextCaster, target, events };
        }

        case 'befriend_attempt': {
            // Phase 108 — Check if befriend attempt is valid
            const isEligible = isBefriendAttemptEligible(state);
            
            if (!isEligible) {
                events.push({
                    kind: 'befriend-attempted',
                    cardId: card.id,
                    successful: false,
                    message: 'Befriend failed: enemy not yet vulnerable to mercy.',
                });
                return { caster, target, events };
            }

            // Successful befriend attempt - opens mercy choice
            events.push({
                kind: 'befriend-attempted',
                cardId: card.id,
                successful: true,
                message: 'Befriend successful! Choose mercy or exploitation.',
            });
            return { caster, target, events };
        }

        // ── Hazard-Pattern / spec 32 v3 card mechanics ───────────────────────
        // Every other mechanic kind is COMBAT-ENGINE OWNED: the card engine
        // no-ops it (so the shared effect machinery stays untouched) and the
        // HP-model combat engine reads the mechanic at its `playBottomAction` /
        // `resolveThreatPhase` / `processBetweenPhases` call sites.
        default:
            return { caster, target, events };
    }
}
