#!/usr/bin/env node

/**
 * Hazard-style Combat CLI — agentic playthrough driver (Phase 165).
 *
 * Reachable as a SUBCOMMAND of the game CLI:
 *
 *   npm run game -- combat [flags]
 *   npm run combat -- [flags]          (convenience alias, new combat)
 *
 * COMBAT ROUTES:
 *   `npm run combat`        → this CLI, Hazard-style card/dice engine
 *   `npm run combat-sim`    → Monte-Carlo balance witness (not player-facing)
 *
 * Combat flags:
 *   --enemy <slug>       enemy from the registry (default mournful-gull)
 *   --preset <id>        character preset id (default apprentice)
 *   --seed <n>           deterministic RNG seed
 *   --auto               run a bot policy (no TTY required)
 *   --policy naive|safe|aggressive|status
 *                        bot policy for --auto (default status)
 *   --max-turns <n>      stop auto play after this many phases (default 8)
 *   --stage <id>         playtest stage profile (early|mid|late|impossible);
 *                        builds the stage player when no explicit --preset is
 *                        given, and scopes --deck drafting to the stage pool
 *   --deck <selection>   preset:<id> | draft:<focus> | cards:a,b,c | policy-pick
 *                        (policy-pick drafts with the --policy's natural focus;
 *                        status → dot, because status play is the efficient path)
 *   --sandbox <setId>    apply a sandbox card set (cards.sandbox-sets) first
 *   --script <path>      JSON answer array (shared io.ts layer)
 *   --stdin              JSONL answers (shared io.ts layer)
 *   --json-events        machine-clean stdout event stream
 *   --state-log <path>   JSONL state mutation log
 *
 * Logic stays in the engine modules. This file only parses flags, prompts,
 * dispatches engine verbs, and formats output.
 */

import {
    prompt, emit, log, logState,
    setIoMode, setOutputMode, setStateLogPath,
} from './io';
import {
    initializeCombatEncounter,
    rollEncounterDice,
    startTurn,
    draftStanceDie,
    endTurn,
    playCombatCard,
    playSignatureSkill,
    resolveThreatPhase,
    handCards,
    getDraftedDie,
    revealedCurrentStance,
    chooseDraft,
    buildCombatSummary,
    getSignatureSkill,
    selectMercyChoice,
    cardDieCostPreview,
} from '../Combat/combat.engine';
import type {
    CombatEncounterState,
    CombatOutcome,
} from '../Combat/combat.encounter.types';
import { ENEMY_REGISTRY } from '../Enemy/enemy.library';
import type { EnemySlug } from '../Enemy/enemy.library';
import { getPresetById, buildCharacterFromPreset } from '../Character';
import type { Character } from '../Character/types';
import type { Enemy } from '../Enemy/types';
import {
    COMBAT_STAGE_ORDER, buildStagePlayer, getStageProfile, isCombatStageId,
} from '../Combat/combat.stage-profiles';
import type { CombatStageId } from '../Combat/combat.stage-profiles';
import { resolveDeckSelection } from '../Combat/combat.deck-draft';
import type { CombatDeckSelection } from '../Combat/combat.deck-draft';
import type { CombatDeckFocus } from '../Combat/combat.deck-presets';
import { createDeckSelectionRng, grantDeckKnowledge, parseDeckSelectionArg } from '../Combat/combat.playtest';
import { applySandboxSet, listSandboxSets } from '../Cards/cards.sandbox-sets';

// ── Types ────────────────────────────────────────────────────────────────────

export type CombatAutoPolicyId = 'naive' | 'safe' | 'aggressive' | 'status';

export interface CombatCliFlags {
    enemySlug: string;
    presetId: string;
    /** True when --preset was passed explicitly (a --stage player only
     *  replaces the preset player when the preset was NOT asked for). */
    presetExplicit: boolean;
    seed?: number;
    auto: boolean;
    policy: CombatAutoPolicyId;
    maxTurns: number;
    /** Playtest stage profile id (--stage). */
    stage?: CombatStageId;
    /** Raw --deck selection string (parsed by `parseDeckSelectionArg`). */
    deck?: string;
    /** Sandbox card-set id (--sandbox), applied before the encounter. */
    sandbox?: string;
    scriptPath?: string;
    stdin: boolean;
    jsonEvents: boolean;
    stateLogPath?: string;
}


export interface RunHazardCombatCliOptions {
    enemy: Enemy;
    player?: Character;
    presetId?: string;
    seed?: number;
    auto?: boolean;
    policy?: CombatAutoPolicyId;
    maxTurns?: number;
    /** Explicit deck (card ids) threaded into `initializeCombatEncounter`;
     *  default: the engine builds one from the player's known skills. */
    deck?: readonly string[];
    /** Playtest stage: builds the stage player when no `player` is given. */
    stage?: CombatStageId;
}

export interface RunHazardCombatCliResult {
    state: CombatEncounterState;
    outcome: CombatOutcome | null;
    summary: ReturnType<typeof buildCombatSummary>;
}

// ── Argv parsers ─────────────────────────────────────────────────────────────

const AUTO_POLICIES: readonly CombatAutoPolicyId[] = ['naive', 'safe', 'aggressive', 'status'];

/** `--deck policy-pick` drafts with the auto policy's natural focus. The
 *  default (status → dot) leans into the doctrine: status effects are the
 *  MAIN fun and the EFFICIENT way to drop HP to 0. */
const AUTO_POLICY_DECK_FOCUS: Record<CombatAutoPolicyId, CombatDeckFocus> = {
    status: 'dot',
    aggressive: 'damage',
    safe: 'utility',
    naive: 'balanced',
};

const COMBAT_USAGE =
    'Usage: npm run combat -- ' +
    '[--enemy <slug>] [--preset <id>] [--seed <n>] ' +
    '[--auto] [--policy naive|safe|aggressive|status] [--max-turns <n>] ' +
    '[--stage early|mid|late|impossible] ' +
    '[--deck preset:<id>|draft:<focus>|cards:a,b,c|policy-pick] ' +
    '[--sandbox <setId>] ' +
    '[--script <path>] [--stdin] [--json-events] [--state-log <path>]';

function takeValue(args: string[], i: number, flag: string): [string, number] {
    const arg = args[i]!;
    const eq = `${flag}=`;
    if (arg.startsWith(eq)) return [arg.slice(eq.length), i + 1];
    const next = args[i + 1];
    if (!next || next.startsWith('--')) {
        throw new Error(`${flag} requires a value argument.\n${COMBAT_USAGE}`);
    }
    return [next, i + 2];
}

export function parseCombatArgv(args: string[]): CombatCliFlags {
    const flags: CombatCliFlags = {
        enemySlug: 'mournful-gull',
        presetId: 'apprentice',
        presetExplicit: false,
        auto: false,
        policy: 'status',
        maxTurns: 8,
        stdin: false,
        jsonEvents: false,
    };
    let i = 0;
    while (i < args.length) {
        const arg = args[i]!;
        if (arg === '--auto') { flags.auto = true; i++; }
        else if (arg === '--json-events') { flags.jsonEvents = true; i++; }
        else if (arg === '--stdin') { flags.stdin = true; i++; }
        else if (arg.startsWith('--enemy')) {
            const [v, ni] = takeValue(args, i, '--enemy'); flags.enemySlug = v; i = ni;
        } else if (arg.startsWith('--preset')) {
            const [v, ni] = takeValue(args, i, '--preset');
            flags.presetId = v; flags.presetExplicit = true; i = ni;
        } else if (arg.startsWith('--seed')) {
            const [v, ni] = takeValue(args, i, '--seed');
            const n = Number(v);
            if (isNaN(n)) throw new Error(`--seed must be a number.\n${COMBAT_USAGE}`);
            flags.seed = n; i = ni;
        } else if (arg.startsWith('--policy')) {
            const [v, ni] = takeValue(args, i, '--policy');
            if (!(AUTO_POLICIES as readonly string[]).includes(v)) {
                throw new Error(`--policy must be one of: ${AUTO_POLICIES.join('|')}.\n${COMBAT_USAGE}`);
            }
            flags.policy = v as CombatAutoPolicyId; i = ni;
        } else if (arg.startsWith('--max-turns')) {
            const [v, ni] = takeValue(args, i, '--max-turns');
            const n = Number(v);
            if (isNaN(n) || n < 1) throw new Error(`--max-turns must be a positive integer.\n${COMBAT_USAGE}`);
            flags.maxTurns = n; i = ni;
        } else if (arg.startsWith('--script')) {
            const [v, ni] = takeValue(args, i, '--script'); flags.scriptPath = v; i = ni;
        } else if (arg.startsWith('--state-log')) {
            const [v, ni] = takeValue(args, i, '--state-log'); flags.stateLogPath = v; i = ni;
        } else if (arg.startsWith('--stage')) {
            const [v, ni] = takeValue(args, i, '--stage');
            if (!isCombatStageId(v)) {
                throw new Error(`--stage must be one of: ${COMBAT_STAGE_ORDER.join('|')}.\n${COMBAT_USAGE}`);
            }
            flags.stage = v; i = ni;
        } else if (arg.startsWith('--deck')) {
            const [v, ni] = takeValue(args, i, '--deck'); flags.deck = v; i = ni;
        } else if (arg.startsWith('--sandbox')) {
            const [v, ni] = takeValue(args, i, '--sandbox'); flags.sandbox = v; i = ni;
        } else {
            throw new Error(`Unknown combat CLI flag: '${arg}'.\n${COMBAT_USAGE}`);
        }
    }
    return flags;
}

// ── Auto-policy helper (reuses combat.encounter.sim logic + extends for CLI) ─

const currentPhaseStance = (s: CombatEncounterState) =>
    s.threatPhases[Math.min(s.currentPhaseIndex, s.threatPhases.length - 1)]?.enemyStance ?? 'heart';

function bestAutoCard(s: CombatEncounterState, policy: CombatAutoPolicyId) {
    const cards = handCards(s).filter(c => c.card.verbClass !== 'retreat');
    if (cards.length === 0) return null;
    const activeIds = new Set(s.enemy.effects.map(e => e.effectId));

    return cards.sort((a, b) => {
        switch (policy) {
            case 'status': {
                const af = a.card.effectKind !== 'none' && !activeIds.has(a.card.primaryEffectId ?? '') ? 0 : a.card.effectKind !== 'none' ? 1 : 2;
                const bf = b.card.effectKind !== 'none' && !activeIds.has(b.card.primaryEffectId ?? '') ? 0 : b.card.effectKind !== 'none' ? 1 : 2;
                if (af !== bf) return af - bf;
                return b.card.bottomDamagePreview - a.card.bottomDamagePreview;
            }
            case 'aggressive':
                return b.card.bottomDamagePreview - a.card.bottomDamagePreview;
            case 'safe': {
                const at = a.card.verbClass === 'defend' || a.card.verbClass === 'buff-self' ? 0 : 1;
                const bt = b.card.verbClass === 'defend' || b.card.verbClass === 'buff-self' ? 0 : 1;
                if (at !== bt) return at - bt;
                return a.card.bottomDamagePreview - b.card.bottomDamagePreview;
            }
            default:
                return 0;
        }
    })[0] ?? null;
}

function bestAutoSignature(s: CombatEncounterState): string | null {
    for (const id of s.signatures) {
        const sig = getSignatureSkill(id);
        if (!sig || s.conviction < sig.cost) continue;
        if (['dot', 'strike', 'control'].includes(sig.kind)) return id;
    }
    return null;
}

/** Runs one full phase in auto mode (start-turn → draft → play → end-turn loop). */
function autoPlayPhase(
    state: CombatEncounterState,
    policy: CombatAutoPolicyId,
    phaseTurnLimit: number,
): CombatEncounterState {
    let s = state;
    let safety = 0;

    while (s.phase === 'phase-play' && !s.finalOutcome && !s.mercyChoiceActive && safety < phaseTurnLimit * 6) {
        safety++;

        // Spend Conviction on a Signature when banked well.
        if (s.conviction >= 6) {
            const sigId = bestAutoSignature(s);
            if (sigId) {
                const cast = playSignatureSkill(s, sigId);
                if (cast.state !== s) { s = cast.state; if (s.finalOutcome) break; continue; }
            }
        }

        // Ensure a drafted die exists.
        let drafted = getDraftedDie(s);
        if (!drafted || drafted.state !== 'available' || drafted.color === 'x') {
            if (s.draftedDieId !== null) s = endTurn(s).state;
            if (s.dice.length === 0) {
                s = startTurn(s).state;
                if (s.phase !== 'phase-play') break;
            }
            const want = bestAutoCard(s, policy);
            const enemyStance = revealedCurrentStance(s);
            const pick = chooseDraft(s.dice, want?.card.stance ?? 'wild', enemyStance);
            if (!pick) break;
            s = draftStanceDie(s, pick).state;
            drafted = getDraftedDie(s);
            // Forced X die — chip with a free top, then end the turn.
            if (!drafted || drafted.state !== 'available' || drafted.color === 'x') {
                const topCard = handCards(s)[0];
                if (topCard) s = playCombatCard(s, { uid: topCard.uid }, false).state;
                s = endTurn(s).state;
                continue;
            }
        }

        const want = bestAutoCard(s, policy);
        if (!want) {
            // No suitable card — play first card top action and end turn.
            const topCard = handCards(s)[0];
            if (topCard) s = playCombatCard(s, { uid: topCard.uid }, false).state;
            s = endTurn(s).state;
            continue;
        }

        const res = playCombatCard(s, { uid: want.uid }, true);
        if (res.events.some(e => e.kind === 'effect-fizzled')) {
            // Fizzled — drain via free top.
            s = playCombatCard(s, { uid: want.uid }, false).state;
            continue;
        }
        s = res.state;
        if (s.finalOutcome || s.mercyChoiceActive) break;

        const after = getDraftedDie(s);
        if (!after || after.state !== 'available') s = endTurn(s).state;
    }

    return s;
}

// ── New Hazard-style combat loop (interactive) ───────────────────────────────

async function promptDraftChoice(state: CombatEncounterState): Promise<string | null> {
    const diePairs = state.dice.filter(d => d.state !== 'spent');
    if (diePairs.length === 0) return null;
    const choices = diePairs.map(d => ({
        name: `${d.id}  [${d.color}]${d.state === 'locked' ? ' (locked-X)' : ''}`,
        value: d.id,
    }));
    choices.push({ name: 'skip (end turn)', value: '__skip__' });
    const { dieId } = await prompt<{ dieId: string }>([{
        type: 'rawlist', name: 'dieId', message: 'Draft a stance die:', choices,
    }]);
    return dieId === '__skip__' ? null : dieId;
}

async function promptCardChoice(state: CombatEncounterState): Promise<{ uid: string; useBottom: boolean } | null> {
    const cards = handCards(state);
    if (cards.length === 0) return null;
    const enemyStance = revealedCurrentStance(state);
    const choices = cards.flatMap(({ uid, card }) => {
        const preview = cardDieCostPreview(state, card);
        const costLabel = preview.cost === 0 ? 'free' : `${preview.cost} die`;
        const stanceLabel = enemyStance ? ` vs ${enemyStance}:${preview.advantage}` : '';
        return [
            { name: `[top] ${card.name}  (${card.stance}, ${card.effectKind})`, value: `top:${uid}` },
            { name: `[bot] ${card.name}  cost ${costLabel}${stanceLabel}  ${card.bottomActionText}`, value: `bot:${uid}` },
        ];
    });
    choices.push({ name: 'resolve phase (stop playing cards)', value: '__resolve__' });
    choices.push({ name: 'end turn (clear draft)', value: '__end__' });

    const { action } = await prompt<{ action: string }>([{
        type: 'rawlist', name: 'action', message: 'Play a card or resolve:', choices,
    }]);
    if (action === '__resolve__') return null;
    if (action === '__end__') return { uid: '__end__', useBottom: false };
    const [mode, uid] = action.split(':') as [string, string];
    return { uid, useBottom: mode === 'bot' };
}

async function promptSignatureChoice(state: CombatEncounterState): Promise<string | null> {
    const affordable = state.signatures
        .map(id => getSignatureSkill(id))
        .filter((s): s is NonNullable<ReturnType<typeof getSignatureSkill>> => s !== undefined && state.conviction >= s.cost);
    if (affordable.length === 0) return null;
    const { choice } = await prompt<{ choice: string }>([{
        type: 'rawlist', name: 'choice',
        message: `Use a Signature (${state.conviction} ◆)?`,
        choices: [
            ...affordable.map(s => ({ name: `${s.name} (${s.cost}◆) — ${s.description}`, value: s.id })),
            { name: 'skip', value: '__skip__' },
        ],
    }]);
    return choice === '__skip__' ? null : choice;
}

async function interactiveHazardCombatLoop(
    initial: CombatEncounterState,
    flags: CombatCliFlags,
): Promise<CombatEncounterState> {
    let s = rollEncounterDice(initial).state;
    let phaseCount = 0;

    while (s.phase !== 'complete' && !s.finalOutcome && phaseCount < flags.maxTurns) {
        phaseCount++;
        const phase = s.threatPhases[Math.min(s.currentPhaseIndex, s.threatPhases.length - 1)];
        const revealed = revealedCurrentStance(s);
        log(`\n── Phase ${phaseCount} (round ${s.round}) ──`);
        log(`  Enemy: ${s.enemy.name}  HP ${s.enemy.health}/${s.enemy.maxHealth}`);
        log(`  Player HP ${s.player.health}/${s.player.maxHealth}  Conviction ${s.conviction}◆`);
        log(`  Enemy intent: ${phase?.intentType ?? 'unknown'}  stance: ${revealed ?? '?'}  guard: ${s.guard ?? 0}`);
        log(`  Threat: ${phase?.threatAction.description ?? '?'}`);

        const before = s;

        // Start turn: roll dice.
        const turned = startTurn(s);
        s = turned.state;
        logState('hazardCombat:start', before, s, { turn: s.turn, dice: s.dice.map(d => `${d.id}[${d.color}]`) });

        // Draft phase.
        const dieId = await promptDraftChoice(s);
        if (dieId) {
            const drafted = draftStanceDie(s, dieId);
            const beforeDraft = s;
            s = drafted.state;
            logState('hazardCombat:draft', beforeDraft, s, {
                dieId, color: getDraftedDie(s)?.color, read: s.lastRead,
            });
            log(`  Read: ${s.lastRead}  (Conviction: ${s.conviction}◆)`);
        }

        // Signature opportunity (before cards).
        const sigId = await promptSignatureChoice(s);
        if (sigId) {
            const beforeSig = s;
            const cast = playSignatureSkill(s, sigId);
            s = cast.state;
            logState('hazardCombat:signature', beforeSig, s, { skillId: sigId });
        }

        // Card play loop.
        let keepPlaying = true;
        while (keepPlaying && s.phase === 'phase-play' && !s.finalOutcome) {
            const cardChoice = await promptCardChoice(s);
            if (!cardChoice) { keepPlaying = false; break; }
            if (cardChoice.uid === '__end__') { s = endTurn(s).state; break; }

            const beforeCard = s;
            const res = playCombatCard(s, { uid: cardChoice.uid }, cardChoice.useBottom);
            s = res.state;
            logState('hazardCombat:playCard', beforeCard, s, {
                uid: cardChoice.uid, useBottom: cardChoice.useBottom,
                events: res.events.map(e => e.kind),
            });
            emit({ type: 'hazardCombat:card', payload: { events: res.events } });

            if (s.finalOutcome) break;
        }

        if (s.finalOutcome) break;

        // Mercy choice.
        if (s.mercyChoiceActive) {
            const { choice } = await prompt<{ choice: 'spare' | 'exploit' }>([{
                type: 'rawlist', name: 'choice', message: 'Mercy choice:',
                choices: [
                    { name: 'spare (befriend)', value: 'spare' },
                    { name: 'exploit (free strike)', value: 'exploit' },
                ],
            }]);
            const beforeMercy = s;
            const mercyRes = selectMercyChoice(s, choice);
            s = mercyRes.state;
            logState('hazardCombat:mercy', beforeMercy, s, { choice });
            if (s.finalOutcome) break;
        }

        // Resolve threat phase + between-phases.
        const beforeResolve = s;
        const resolved = resolveThreatPhase(s);
        s = resolved.state;
        logState('hazardCombat:resolveThreat', beforeResolve, s, {
            phaseIndex: s.currentPhaseIndex,
            events: resolved.events.map(e => e.kind),
        });
        emit({ type: 'hazardCombat:resolvedPhase', payload: { events: resolved.events } });
        log(`  After phase: player HP ${s.player.health}/${s.player.maxHealth}  enemy HP ${s.enemy.health}/${s.enemy.maxHealth}`);
    }

    return s;
}

async function autoHazardCombatLoop(
    initial: CombatEncounterState,
    flags: CombatCliFlags,
): Promise<CombatEncounterState> {
    let s = rollEncounterDice(initial).state;
    logState('hazardCombat:start', null, s, { auto: true, policy: flags.policy, seed: flags.seed });
    emit({ type: 'hazardCombat:start', payload: { enemy: s.enemy.name, preset: flags.presetId, policy: flags.policy } });

    let phaseCount = 0;
    while (s.phase !== 'complete' && !s.finalOutcome && phaseCount < flags.maxTurns) {
        phaseCount++;
        const before = s;

        s = autoPlayPhase(s, flags.policy, flags.maxTurns);
        logState('hazardCombat:autoPhase', before, s, { phaseCount, policy: flags.policy });

        if (s.finalOutcome) break;
        if (s.mercyChoiceActive) {
            const beforeMercy = s;
            s = selectMercyChoice(s, 'spare').state;
            logState('hazardCombat:mercy', beforeMercy, s, { choice: 'spare' });
            break;
        }
        if (s.phase === 'phase-play') {
            const beforeResolve = s;
            s = resolveThreatPhase(s).state;
            logState('hazardCombat:resolveThreat', beforeResolve, s, { phaseCount });
        }
    }
    return s;
}

// ── Main entry points ─────────────────────────────────────────────────────────

/**
 * Run a Hazard-Pattern combat encounter from an already-resolved enemy.
 * This is the reusable map/mobile handoff surface; `runCombatCli` is only an
 * argv wrapper around it.
 */
export async function runHazardCombatCliEncounter(
    options: RunHazardCombatCliOptions,
): Promise<RunHazardCombatCliResult> {
    const presetId = options.presetId ?? 'apprentice';
    const preset = getPresetById(presetId);
    const stageProfile = options.stage !== undefined ? getStageProfile(options.stage) : undefined;
    if (options.stage !== undefined && !stageProfile) {
        throw new Error(`Unknown combat stage: '${options.stage}'. Valid: ${COMBAT_STAGE_ORDER.join(', ')}`);
    }
    if (!preset && !options.player && !stageProfile) {
        throw new Error(`Unknown preset: '${presetId}'. Try: apprentice, wanderer, sage`);
    }
    // Player precedence: explicit player > stage player > preset player.
    let player = options.player
        ?? (stageProfile ? buildStagePlayer(stageProfile) : buildCharacterFromPreset(preset!));
    if (options.deck && options.deck.length > 0) {
        // The engine refuses to fire cards outside knownSkills; an explicit
        // deck may reach beyond the player's learned pool. Grant on a copy so
        // a caller-supplied player is never mutated.
        player = { ...player, knownSkills: [...player.knownSkills] };
        grantDeckKnowledge(player, options.deck);
    }
    const playerLabel = options.player ? presetId
        : stageProfile ? `stage:${stageProfile.id}` : presetId;
    const flags: CombatCliFlags = {
        enemySlug: '',
        presetId,
        presetExplicit: options.presetId !== undefined,
        auto: options.auto ?? false,
        seed: options.seed,
        policy: options.policy ?? 'status',
        maxTurns: options.maxTurns ?? 8,
        stage: options.stage,
        stdin: false,
        jsonEvents: false,
    };

    log(`\nHazard-style Combat — new engine (Phase 165)`);
    log(`Player: ${player.name} (${playerLabel})  HP ${player.health}/${player.maxHealth}`);
    log(`Enemy:  ${options.enemy.name}  HP ${options.enemy.maxHealth}`);
    if (options.deck) log(`Deck:   ${options.deck.length} cards (explicit --deck)`);
    log(`Policy: ${flags.auto ? flags.policy : 'interactive'}  Seed: ${flags.seed ?? 'random'}\n`);

    const enc = initializeCombatEncounter(
        player, options.enemy,
        options.deck && options.deck.length > 0 ? [...options.deck] : undefined,
        flags.seed,
    );
    const final = flags.auto
        ? await autoHazardCombatLoop(enc, flags)
        : await interactiveHazardCombatLoop(enc, flags);

    const summary = buildCombatSummary(final);
    const outcomeLabel: Record<CombatOutcome, string> = {
        victory: 'Victory',
        mercy: 'Mercy / Befriended',
        defeat: 'Defeat',
        retreat: 'Retreated',
    };
    const label = final.finalOutcome ? outcomeLabel[final.finalOutcome] : 'In progress';

    logState('hazardCombat:end', null, final, { summary, outcome: final.finalOutcome });
    emit({ type: 'hazardCombat:end', payload: { outcome: final.finalOutcome, summary } });

    log(`\nOutcome: ${label}`);
    log(`  Player HP: ${final.player.health}/${final.player.maxHealth}`);
    log(`  Enemy HP:  ${final.enemy.health}/${final.enemy.maxHealth}`);
    log(`  Phases:    ${final.phaseResults.length}`);
    log(`  Conviction left: ${final.conviction}◆`);
    if (summary) {
        log(`  DoT damage:      ${summary.totalDotDamage}`);
        log(`  Direct damage:   ${summary.directDamage}`);
        log(`  Best card:       ${summary.bestCard || '(none)'}`);
        log('  Per-card attribution:');
        for (const row of summary.rows) {
            log(`    ${row.name}: ${row.damageDealt} dmg (${row.dotDamage} DoT) over ${row.phases} phases`);
        }
    }

    return { state: final, outcome: final.finalOutcome ?? null, summary };
}

/** Run the new Hazard-style combat CLI. */
export async function runCombatCli(rawArgs: string[]): Promise<void> {
    const flags = parseCombatArgv(rawArgs);

    if (flags.jsonEvents) setOutputMode('json');
    if (flags.scriptPath) {
        const fs = await import('fs');
        const raw = fs.readFileSync(flags.scriptPath, 'utf-8');
        const answers = JSON.parse(raw);
        if (!Array.isArray(answers)) throw new Error('--script JSON must be a top-level array.');
        setIoMode({ kind: 'script', answers });
    } else if (flags.stdin) {
        setIoMode({ kind: 'stdin' });
    }
    if (flags.stateLogPath) setStateLogPath(flags.stateLogPath);

    const enemyDef = ENEMY_REGISTRY[flags.enemySlug as EnemySlug];
    if (!enemyDef) {
        const valid = Object.keys(ENEMY_REGISTRY).join(', ');
        throw new Error(`Unknown enemy slug: '${flags.enemySlug}'. Valid: ${valid}`);
    }

    // Sandbox set (if any) goes live BEFORE deck resolution so drafted /
    // preset decks see the experimental cards and overrides.
    if (flags.sandbox !== undefined) {
        const set = applySandboxSet(flags.sandbox);
        if (!set) {
            const valid = listSandboxSets().map(s => s.id).join(', ');
            throw new Error(`Unknown sandbox set: '${flags.sandbox}'. Valid: ${valid}`);
        }
    }

    // Deck selection: --stage scopes drafting to the stage's eligible pool;
    // 'policy-pick' drafts with the auto policy's natural focus. Seeded runs
    // resolve the deck from a LOCAL seeded rng so the deck is a pure function
    // of --seed and the encounter's own RNG stream stays untouched.
    let deck: string[] | undefined;
    if (flags.deck !== undefined) {
        const selection = parseDeckSelectionArg(flags.deck);
        const effective: CombatDeckSelection = selection.kind === 'policy-pick'
            ? { kind: 'draft', focus: AUTO_POLICY_DECK_FOCUS[flags.policy] }
            : selection;
        const stageProfile = flags.stage !== undefined ? getStageProfile(flags.stage) : undefined;
        const rng = flags.seed !== undefined ? createDeckSelectionRng(flags.seed) : undefined;
        deck = resolveDeckSelection(effective, stageProfile, rng);
    }

    await runHazardCombatCliEncounter({
        enemy: enemyDef,
        presetId: flags.presetId,
        seed: flags.seed,
        auto: flags.auto || flags.scriptPath !== undefined || flags.stdin,
        policy: flags.policy,
        maxTurns: flags.maxTurns,
        deck,
        // A stage player only replaces the preset player when --preset was not
        // asked for explicitly (the stage still scoped drafting above).
        stage: flags.presetExplicit ? undefined : flags.stage,
    });
}
