/**
 * TEMP audit harness (charm theme audit, 2026-07-10) — replicates the CLI's
 * auto loop (status policy) but prints EVERY engine event turn by turn.
 * Delete after the audit.
 *
 * Usage: npx ts-node transcript-audit.ts <enemySlug> <stage> <presetId> <seed> <maxTurns>
 */
import {
    initializeCombatEncounter, rollEncounterDice, startTurn, draftStanceDie,
    endTurn, playCombatCard, playSignatureSkill, resolveThreatPhase, handCards,
    getDraftedDie, revealedCurrentStance, chooseDraft, buildCombatSummary,
    getSignatureSkill, selectMercyChoice,
} from './src/Combat/combat.engine';
import type { CombatEncounterState } from './src/Combat/combat.encounter.types';
import { ENEMY_REGISTRY } from './src/Enemy/enemy.library';
import type { EnemySlug } from './src/Enemy/enemy.library';
import { buildStagePlayer, getStageProfile, isCombatStageId } from './src/Combat/combat.stage-profiles';
import { resolveDeckSelection } from './src/Combat/combat.deck-draft';
import { createDeckSelectionRng, grantDeckKnowledge, parseDeckSelectionArg } from './src/Combat/combat.playtest';

const [enemySlug, stageId, presetArg, seedArg, maxTurnsArg, capArg] = process.argv.slice(2);
const seed = Number(seedArg ?? 3);
const maxTurns = Number(maxTurnsArg ?? 14);
/** Max player turns (startTurn calls) per enemy phase. The interactive CLI
 *  gives exactly 1; the stock auto loop is unbounded (farming exploit). */
const turnsPerPhaseCap = Number(capArg ?? 1);

function fmtEvent(e: any): string {
    const { kind, ...rest } = e;
    return `      · ${kind} ${JSON.stringify(rest)}`;
}
function snap(s: CombatEncounterState, label: string) {
    const dice = s.dice.map(d => `${d.id}[${d.color}${d.state === 'spent' ? '/spent' : d.state === 'locked' ? '/X' : ''}]`).join(' ');
    const eff = (who: any) => who.effects.map((e: any) => `${e.effectId}(i${e.intensity},d${e.duration})`).join(',') || '-';
    console.log(`    [${label}] pHP ${s.player.health}/${s.player.maxHealth} eHP ${s.enemy.health}/${s.enemy.maxHealth} SWAY ${s.sway ?? 0} ◆${s.conviction} guard ${s.guard ?? 0} | dice: ${dice}`);
    console.log(`      playerFx: ${eff(s.player)} | enemyFx: ${eff(s.enemy)}`);
    console.log(`      hand: ${handCards(s).map(h => h.card.id).join(', ')}`);
}

type Policy = 'status';
function bestAutoCard(s: CombatEncounterState) {
    const cards = handCards(s).filter(c => c.card.verbClass !== 'retreat');
    if (cards.length === 0) return null;
    const activeIds = new Set(s.enemy.effects.map(e => e.effectId));
    return cards.sort((a, b) => {
        const af = a.card.effectKind !== 'none' && !activeIds.has(a.card.primaryEffectId ?? '') ? 0 : a.card.effectKind !== 'none' ? 1 : 2;
        const bf = b.card.effectKind !== 'none' && !activeIds.has(b.card.primaryEffectId ?? '') ? 0 : b.card.effectKind !== 'none' ? 1 : 2;
        if (af !== bf) return af - bf;
        return b.card.bottomDamagePreview - a.card.bottomDamagePreview;
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

function autoPlayPhase(state: CombatEncounterState, phaseTurnLimit: number): CombatEncounterState {
    let s = state;
    let safety = 0;
    let turnsThisPhase = 0;
    while (s.phase === 'phase-play' && !s.finalOutcome && !s.mercyChoiceActive && safety < phaseTurnLimit * 6) {
        safety++;
        if (s.dice.length === 0 && turnsThisPhase >= turnsPerPhaseCap) break;
        if (s.conviction >= 6) {
            const sigId = bestAutoSignature(s);
            if (sigId) {
                const cast = playSignatureSkill(s, sigId);
                if (cast.state !== s) {
                    console.log(`    >> SIGNATURE ${sigId}`);
                    cast.events.forEach(e => console.log(fmtEvent(e)));
                    s = cast.state; if (s.finalOutcome) break; continue;
                }
            }
        }
        let drafted = getDraftedDie(s);
        if (!drafted || drafted.state !== 'available' || drafted.color === 'x') {
            if (s.draftedDieId !== null) {
                const et = endTurn(s);
                console.log('    >> END TURN (drafted die exhausted)');
                et.events.forEach(e => console.log(fmtEvent(e)));
                s = et.state;
            }
            if (s.dice.length === 0) {
                if (turnsThisPhase >= turnsPerPhaseCap) break;
                turnsThisPhase++;
                const st = startTurn(s);
                console.log(`    >> START TURN ${st.state.turn}`);
                st.events.forEach(e => console.log(fmtEvent(e)));
                s = st.state;
                if (s.phase !== 'phase-play') break;
                snap(s, 'post-roll');
            }
            const want = bestAutoCard(s);
            const enemyStance = revealedCurrentStance(s);
            const pick = chooseDraft(s.dice, want?.card.stance ?? 'wild', enemyStance);
            if (!pick) break;
            const dr = draftStanceDie(s, pick);
            console.log(`    >> DRAFT ${pick} (want ${want?.card.id ?? '?'} stance ${want?.card.stance})`);
            dr.events.forEach(e => console.log(fmtEvent(e)));
            s = dr.state;
            drafted = getDraftedDie(s);
            if (!drafted || drafted.state !== 'available' || drafted.color === 'x') {
                const topCard = handCards(s)[0];
                if (topCard) {
                    const r = playCombatCard(s, { uid: topCard.uid }, false);
                    console.log(`    >> FREE-TOP ${topCard.card.id} (X-die turn)`);
                    r.events.forEach(e => console.log(fmtEvent(e)));
                    s = r.state;
                }
                const et = endTurn(s);
                console.log('    >> END TURN (X die)');
                et.events.forEach(e => console.log(fmtEvent(e)));
                s = et.state;
                continue;
            }
        }
        const want = bestAutoCard(s);
        if (!want) {
            const topCard = handCards(s)[0];
            if (topCard) {
                const r = playCombatCard(s, { uid: topCard.uid }, false);
                console.log(`    >> FREE-TOP ${topCard.card.id} (no wanted card)`);
                r.events.forEach(e => console.log(fmtEvent(e)));
                s = r.state;
            }
            const et = endTurn(s);
            console.log('    >> END TURN (no card)');
            et.events.forEach(e => console.log(fmtEvent(e)));
            s = et.state;
            continue;
        }
        const res = playCombatCard(s, { uid: want.uid }, true);
        if (res.events.some(e => e.kind === 'effect-fizzled')) {
            const r = playCombatCard(s, { uid: want.uid }, false);
            console.log(`    >> PAID ${want.card.id} FIZZLED -> FREE-TOP instead`);
            res.events.forEach(e => console.log(fmtEvent(e)));
            r.events.forEach(e => console.log(fmtEvent(e)));
            s = r.state;
            continue;
        }
        console.log(`    >> PAID ${want.card.id}`);
        res.events.forEach(e => console.log(fmtEvent(e)));
        s = res.state;
        if (s.finalOutcome || s.mercyChoiceActive) break;
        const after = getDraftedDie(s);
        if (!after || after.state !== 'available') {
            const et = endTurn(s);
            console.log('    >> END TURN (die spent)');
            et.events.forEach(e => console.log(fmtEvent(e)));
            s = et.state;
        }
    }
    return s;
}

async function main() {
    const enemy = ENEMY_REGISTRY[enemySlug as EnemySlug];
    if (!enemy) throw new Error(`unknown enemy ${enemySlug}`);
    if (!isCombatStageId(stageId)) throw new Error(`bad stage ${stageId}`);
    const stage = getStageProfile(stageId)!;
    let player = buildStagePlayer(stage);
    const sel = parseDeckSelectionArg(presetArg);
    const deck = resolveDeckSelection(sel, stage, createDeckSelectionRng(seed));
    player = { ...player, knownCards: [...player.knownCards] };
    grantDeckKnowledge(player, deck);
    let s = initializeCombatEncounter(player, enemy, [...deck], seed);
    s = rollEncounterDice(s).state;
    console.log(`\n=== TRANSCRIPT ${presetArg} vs ${enemy.name} (${enemy.maxHealth} HP) stage=${stageId} seed=${seed} ===`);
    console.log(`capitulateThreshold ≈ ${Math.min(Math.max(10, 0.35 * enemy.maxHealth), enemy.maxHealth).toFixed(1)}`);
    let phaseCount = 0;
    while (s.phase !== 'complete' && !s.finalOutcome && phaseCount < maxTurns) {
        phaseCount++;
        const ph = s.threatPhases[Math.min(s.currentPhaseIndex, s.threatPhases.length - 1)];
        console.log(`\n── Phase ${phaseCount} (round ${s.round}) — enemy intent: ${ph?.intentType} / threat: ${ph?.threatAction?.description ?? '?'}`);
        snap(s, 'phase-start');
        s = autoPlayPhase(s, maxTurns);
        if (s.finalOutcome) break;
        if (s.mercyChoiceActive) {
            console.log('    >> MERCY CHOICE -> spare');
            s = selectMercyChoice(s, 'spare').state;
            break;
        }
        if (s.phase === 'phase-play') {
            const rt = resolveThreatPhase(s);
            console.log('    >> RESOLVE THREAT');
            rt.events.forEach(e => console.log(fmtEvent(e)));
            s = rt.state;
            snap(s, 'post-threat');
        }
    }
    console.log(`\nOUTCOME: ${s.finalOutcome ?? 'in-progress'}  pHP ${s.player.health}/${s.player.maxHealth} eHP ${s.enemy.health}/${s.enemy.maxHealth} SWAY ${s.sway ?? 0} phases ${phaseCount}`);
    const summary = buildCombatSummary(s);
    if (summary) console.log(`bestCard: ${summary.bestCard} | dot ${summary.totalDotDamage} direct ${summary.directDamage}`);
}
main().catch(e => { console.error(e); process.exit(1); });
