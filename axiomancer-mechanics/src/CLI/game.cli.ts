#!/usr/bin/env node

/**
 * Game CLI — demonstrational full-loop driver (Spec 09 Q7).
 *
 * Wires every public verb on the game store into a tabbed inquirer prompt
 * so the engine can be exercised by hand. Five tabs:
 *
 *   • Map             — list adjacent nodes, dispatch MOVE_TO_NODE, then
 *                       PROCESS_NODE to trigger the node's authored event.
 *                       Encounters are staged into combat state; the
 *                       Hazard-Pattern combat driver runs via `npm run combat`.
 *   • Journal         — read-only: active / completed quests + alignment stub.
 *   • Skills          — read-only: known/unlocked skills.
 *   • Inventory       — read-only listing of carried items.
 *
 * Logic stays in the store / reducer. This file only formats and dispatches.
 *
 * Run with: `npm run game` (which invokes `ts-node src/CLI/game.cli.ts`).
 *
 * Combat routing:
 *   `npm run combat`        = Hazard-Pattern combat (combat.cli.ts)
 *   `npm run combat-sim`    = Monte-Carlo balance witness (not agentic play)
 */

import fs from 'fs';
import { parseArgv, prompt, emit, log, logState, setIoMode, setOutputMode, setStateLogPath, type CliFlags } from './io';

import { createCharacter } from '../Character';
import { ENEMY_REGISTRY, EnemyLibrary, type EnemySlug } from '../Enemy/enemy.library';
import type { EquipmentSlot } from '../Items';
import {
    devSetLevel, devSetStats, devLearnSkills,
    devGrantAllEquipment, devGrantAllConsumables, devEquipItem,
    devGrantCurrency, devSetMoralMeter, devSetAlignment,
    devSpawnEnemy, devMaxOut, getEnemySlugs, getSkillIds,
    getEquipmentTemplateIds,
} from './dev-tools';
import type { CodexEntry } from '../Game/types';
import { createGameStore } from '../Game/store';
import { createEventEmitter } from '../Game/events';
import { nullAdapter } from '../Game/persistence/null.adapter';
import { createNodeAdapter } from '../Game/persistence/node.adapter';
import type { PersistenceAdapter } from '../Game/persistence/types';
import type { TypedLevelUpEvent } from '../Game/events.types';
import { getMapDefinition } from '../World/map.registry';
import { resolveMapEvent } from '../World';
import type { ResolvedEvent } from '../World';
import { getCardById } from '../Cards/cards.library';
import { getAvailableSkills } from '../Cards/skill.engine';
import { isConsumable } from '../Items/types';
import { buyItem, sellItem, defaultSellPrice } from '../Items/shop.reducer';
import { getConsumableById } from '../Items/consumable.library';
import { bucketAxis, getAlignmentCell } from '../Philosophy';
import { runHazardCombatCliEncounter, type CombatAutoPolicyId } from './combat.cli';

type Tab = 'map' | 'journal' | 'skills' | 'codex' | 'inventory' | 'character' | 'dev' | 'reset' | 'save' | 'load' | 'quit';

type GameStoreHandle = ReturnType<typeof createGameStore>;

// Phase 82 — Codex lookup. Walks EnemyLibrary once at module load to build
// an id → CodexEntry map. Future dialogue-driven codex entries will need a
// centralised codexRegistry export on the public barrel; today the
// Phase-73-only origin (Enemy.journalEntry?) makes this in-CLI walk correct
// per the brief D2.
const codexLookup: Map<string, CodexEntry> = (() => {
    const map = new Map<string, CodexEntry>();
    for (const enemy of EnemyLibrary) {
        if (enemy.journalEntry) {
            map.set(enemy.journalEntry.id, enemy.journalEntry);
        }
    }
    return map;
})();

async function bootstrapStore(adapter: PersistenceAdapter): Promise<GameStoreHandle> {
    const events = createEventEmitter();
    events.onAny(emit);
    // Phase 30 unit 2 — surface newly-eligible skills after a level-up.
    // The store's dispatch enriches the payload with `unlockedSkills`; the
    // CLI just renders the message.
    events.on('character:levelup', evt => {
        const unlocked = (evt as TypedLevelUpEvent).payload.unlockedSkills ?? [];
        if (unlocked.length > 0) {
            log(`You can now learn ${unlocked.length} new skill${unlocked.length === 1 ? '' : 's'}: ${unlocked.join(', ')}`);
        }
    });

    const player = createCharacter({
        name: 'Player',
        level: 1,
        baseStats: { heart: 5, body: 5, mind: 5 },
    });
    log('\nStarting with a blank character (level 1, 5/5/5). Use the DEV menu to configure.\n');

    const store = createGameStore(adapter, { player }, events);
    logState('bootstrap', null, store.getState(), { boot: 'blank' });
    return store;
}

async function pickTab(): Promise<Tab> {
    const tabs: Array<{ name: string; value: Tab }> = [
        { name: 'Map             — travel + resolve node events', value: 'map' },
        { name: 'Journal    — quests + alignment', value: 'journal' },
        { name: 'Skills     — known/unlocked', value: 'skills' },
        { name: 'Codex      — unlocked journal entries from befriended foes (Phase 73)', value: 'codex' },
        { name: 'Inventory  — items in pack', value: 'inventory' },
        { name: 'Character  — full stats + equipment + effects sheet', value: 'character' },
        { name: 'DEV        — manipulate character, grant items/skills, spawn enemies', value: 'dev' },
        { name: 'Begin again — reset to starting hearth, full or keep-character (Phase 72)', value: 'reset' },
        { name: 'Save       — write the current state to the save file', value: 'save' },
        { name: 'Load       — restore state from the save file', value: 'load' },
        { name: 'Quit',                                 value: 'quit' },
    ];
    const { tab } = await prompt<{ tab: Tab }>([
        { type: 'rawlist', name: 'tab', message: 'Where to?', choices: tabs },
    ]);
    return tab;
}


function asCombatPolicy(value: string | undefined): CombatAutoPolicyId {
    if (value === 'naive' || value === 'safe' || value === 'aggressive' || value === 'status') return value;
    if (value !== undefined) throw new Error(`Unknown --combat-policy '${value}'. Use naive|safe|aggressive|status.`);
    return 'status';
}

async function moveAndResolveMapNode(store: GameStoreHandle, target: string, flags: CliFlags): Promise<void> {
    const state = store.getState();
    const current = state.world.currentMap.currentNode;
    const def = getMapDefinition(state.world.currentMap.continent, state.world.currentMap.name);
    const node = def.nodes.find(n => n.id === current);
    const reachable = (node?.connectedNodes ?? []).filter(id => state.world.currentMap.availableNodes.includes(id));
    if (!reachable.includes(target)) {
        throw new Error(`Route target '${target}' is not reachable from '${current}'. Reachable: ${reachable.join(', ') || '(none)'}`);
    }

    const beforeMove = store.getState();
    store.getState().moveToNode(target);
    log(`Moved to ${target}.`);
    logState('moveToNode', beforeMove, store.getState(), { target });

    const before = store.getState();
    const result = resolveMapEvent(before);
    store.setState({
        player: result.state.player,
        world:  result.state.world,
        quests: result.state.quests,
        flags:  result.state.flags,
    });
    logState('resolveMapEvent', before, store.getState(), result.event);
    log(describeResolvedEvent(result.event));

    if (result.event.kind === 'encounter') {
        const enemy = result.event.encounter.enemies[0];
        if (!enemy) throw new Error(`Encounter at '${target}' had no enemy.`);
        await runHazardCombatCliEncounter({
            enemy,
            presetId: 'apprentice',
            seed: flags.combatSeed,
            auto: flags.autoCombat || flags.route !== undefined || flags.scriptPath !== undefined || flags.stdin,
            policy: asCombatPolicy(flags.combatPolicy),
            maxTurns: flags.combatMaxTurns ?? 20,
        });
    }

    if (result.event.kind === 'village' && result.event.shop && result.event.shop.wares.length > 0) {
        await shopLoop(store, result.event.shop);
    }
}

async function mapTab(store: GameStoreHandle, flags: CliFlags): Promise<void> {
    const state   = store.getState();
    const current = state.world.currentMap.currentNode;
    const def     = getMapDefinition(state.world.currentMap.continent, state.world.currentMap.name);
    const node    = def.nodes.find(n => n.id === current);

    log(`\n— Map: ${def.name} —`);
    log(`You are at ${current}.`);

    const available = state.world.currentMap.availableNodes;
    const reachable = (node?.connectedNodes ?? []).filter(id => available.includes(id));
    if (reachable.length === 0) {
        log('No adjacent nodes are open right now.');
        return;
    }

    const autoTarget = reachable[0];
    const { target } = await prompt<{ target: string }>([
        {
            type: 'rawlist',
            name: 'target',
            message: 'Move to which node?',
            choices: [
                { name: `Auto-advance: next node (${autoTarget})`, value: autoTarget },
                ...reachable.map(id => ({ name: id, value: id })),
                { name: 'Stay put', value: '' },
            ],
        },
    ]);
    if (!target) return;

    await moveAndResolveMapNode(store, target, flags);
}

function describeResolvedEvent(event: ResolvedEvent): string {
    switch (event.kind) {
        case 'encounter':   return `Encounter! ${event.isBoss ? '(boss) ' : ''}${event.encounter.enemies.map(e => e.name).join(', ')}`;
        case 'interaction': return `You meet ${event.npcName}.`;
        case 'gathering':   return `You gather ${event.items.map(i => i.name).join(', ')}.`;
        case 'rest':        return `You rest. (+${event.healed} HP)`;
        case 'village': {
            const wareCount = event.shop?.wares.length ?? 0;
            const shopSuffix = wareCount > 0 ? ` — ${wareCount} ware${wareCount === 1 ? '' : 's'} for sale` : '';
            return `Village: ${event.villageName} (${event.merchants.length} merchant${event.merchants.length === 1 ? '' : 's'})${shopSuffix}.`;
        }
        case 'cutscene':    return event.lines.join(' ');
        case 'hazard':      return `Hazard! (-${event.damage} HP${event.effects.length > 0 ? `, ${event.effects.length} effect${event.effects.length === 1 ? '' : 's'}` : ''})`;
        case 'loot-cache':  return `Loot cache: ${event.items.length} item${event.items.length === 1 ? '' : 's'}, ${event.currency} currency.`;
        case 'quest':       return `Quest board: ${event.boardId}.`;
        case 'narration': {
            const root = event.dialogue.nodes[event.dialogue.rootId];
            return root ? root.text : 'A moment of narration passes.';
        }
        case 'none':        return 'Nothing of note happens.';
    }
}

async function shopLoop(store: GameStoreHandle, shop: { wares: ReadonlyArray<{ itemId: string; price: number }> }): Promise<void> {
    while (true) {
        const player = store.getState().player;
        log(`\n— Shop — currency: ${player.currency}`);
        const { action } = await prompt<{ action: 'buy' | 'sell' | 'leave' }>([{
            type: 'rawlist', name: 'action', message: 'Shop:',
            choices: [
                { name: 'buy   — browse wares', value: 'buy' },
                { name: 'sell  — list inventory', value: 'sell' },
                { name: 'leave — close the shop', value: 'leave' },
            ],
        }]);
        if (action === 'leave') return;

        if (action === 'buy') {
            const choices = shop.wares.map(w => {
                const item = getConsumableById(w.itemId);
                const label = item ? `${item.name} — ${w.price}` : `${w.itemId} — ${w.price} (unknown)`;
                return { name: label, value: w.itemId };
            });
            choices.push({ name: 'back', value: '' });
            const { wareId } = await prompt<{ wareId: string }>([{
                type: 'rawlist', name: 'wareId', message: 'Buy what?', choices,
            }]);
            if (!wareId) continue;
            const ware = shop.wares.find(w => w.itemId === wareId)!;
            const item = getConsumableById(ware.itemId);
            if (!item) { log(`Unknown item: ${ware.itemId}`); continue; }
            const before = store.getState();
            const next = buyItem(before.player, item, ware.price);
            if (next === before.player) {
                log(`You can't afford ${item.name} (need ${ware.price}, have ${before.player.currency}).`);
            } else {
                store.setState({ player: next });
                log(`Bought ${item.name} for ${ware.price}.`);
                logState('buyItem', before, store.getState(), { itemId: ware.itemId, price: ware.price });
            }
            continue;
        }

        // sell
        const inv = store.getState().player.inventory;
        if (inv.length === 0) { log('Nothing to sell.'); continue; }
        const choices = inv.map((i, idx) => {
            // Engine-tier policy (Phase 37 + iterate exploit-fix): defaultSellPrice
            // halves and floors a ware's buy price. Always strictly less than the
            // buy price for any positive integer, so buy → sell round-trips are
            // net-negative for the player. For items not on the current shop's
            // ware list, fall back to 1 (the pre-existing minimum) — that path
            // is unaffected by the exploit since it doesn't loop with a buy.
            const matching = shop.wares.find(w => w.itemId === i.id);
            const sellPrice = matching ? defaultSellPrice(matching) : 1;
            return { name: `${i.name} — sell for ${sellPrice}`, value: `${idx}:${sellPrice}` };
        });
        choices.push({ name: 'back', value: '' });
        const { sellChoice } = await prompt<{ sellChoice: string }>([{
            type: 'rawlist', name: 'sellChoice', message: 'Sell what?', choices,
        }]);
        if (!sellChoice) continue;
        const [idxStr, priceStr] = sellChoice.split(':');
        const idx = Number(idxStr);
        const price = Number(priceStr);
        const target = store.getState().player.inventory[idx];
        if (!target) { log('Item slot vanished.'); continue; }
        const before = store.getState();
        const next = sellItem(before.player, target.id, price);
        if (next === before.player) {
            log(`Couldn't sell ${target.name}.`);
        } else {
            store.setState({ player: next });
            log(`Sold ${target.name} for ${price}. Currency: ${next.currency}.`);
            logState('sellItem', before, store.getState(), { itemId: target.id, price });
        }
    }
}

function journalTab(store: GameStoreHandle): void {
    const { quests, flags } = store.getState();
    log('\n— Journal —');
    log(`Active quests   : ${quests.active.map(q => q.name).join(', ') || '(none)'}`);
    log(`Completed quests: ${quests.completed.join(', ') || '(none)'}`);
    log(`World flags     : ${flags.join(', ') || '(none)'}`);
    // Alignment / philosophy meter is the Phase 10 hook — print a placeholder
    // so the tab is reachable today.
    log('Alignment       : neutral (Spec 10 will compute this)');
}

function skillsTab(store: GameStoreHandle): void {
    const { player } = store.getState();
    log('\n— Skills —');
    log('Known skills:');
    for (const id of player.knownSkills) {
        const s = getCardById(id);
        log(`  • ${s?.name ?? id}`);
    }
}

function codexTab(store: GameStoreHandle): void {
    const { codex } = store.getState();
    log('\n— Codex —');
    if (codex.unlockedEntries.length === 0) {
        log('Your codex is empty — befriend a foe with a journal entry to start filling it.');
        return;
    }
    for (const entryId of codex.unlockedEntries) {
        const entry = codexLookup.get(entryId);
        if (!entry) {
            log(`  • ${entryId}  (unknown entry — source may have been removed from the library)`);
            continue;
        }
        log(`  • ${entry.title}`);
        log(`    ${entry.body}`);
        log('');
    }
}

async function resetTab(store: GameStoreHandle): Promise<void> {
    const { mode } = await prompt<{ mode: 'full' | 'keep' | 'cancel' }>([
        {
            type: 'rawlist',
            name: 'mode',
            message: 'Begin again — how?',
            choices: [
                { name: 'Full reset — new character + new world', value: 'full' },
                { name: 'Keep character — fresh world, same character ledger', value: 'keep' },
                { name: 'Cancel — back to the main menu', value: 'cancel' },
            ],
        },
    ]);
    if (mode === 'cancel') return;
    const keepCharacter = mode === 'keep';
    const before = store.getState();
    const after = store.getState().resetRun({ keepCharacter });
    log(`\nBegan again. (keepCharacter: ${keepCharacter})`);
    log(`Run id     : ${after.runId}`);
    log(`Hearth node: ${after.world.currentMap.currentNode}`);
    logState('resetRun', before, after, { keepCharacter });
}

function inventoryTab(store: GameStoreHandle): void {
    const { inventory } = store.getState().player;
    log('\n— Inventory —');
    if (inventory.length === 0) {
        log('(empty)');
        return;
    }
    for (const item of inventory) {
        const qty = isConsumable(item) ? `  ×${item.quantity}` : '';
        log(`  • ${item.name}${qty}  — ${item.description}`);
    }
}

async function characterTab(store: GameStoreHandle): Promise<void> {
    const state = store.getState();
    const p = state.player;

    log('\n— Character Sheet —');
    log(`Name:     ${p.name}`);
    log(`Level:    ${p.level}  (XP ${p.experience}/${p.experienceToNextLevel})`);
    log(`Health:   ${p.health}/${p.maxHealth}`);
    log(`Currency: ${p.currency}`);
    log(`Moral:    ${state.moralMeter}`);
    if (p.availableStatPoints > 0) {
        log(`Points:   ${p.availableStatPoints} available to allocate`);
    }

    // Philosophical alignment block (Phase 42).
    const a = state.philosophicalAlignment;
    const cell = getAlignmentCell(a);
    log('\nPhilosophical alignment:');
    log(`  Cell:         ${cell.label}`);
    log(`  Philosopher:  ${cell.philosopher}`);
    log(`  Character:    ${cell.literaryCharacter.name} — ${cell.literaryCharacter.work}`);
    log(`  Epistemology: ${bucketAxis(a.epistemology)} (${a.epistemology})`);
    log(`  Outlook:      ${bucketAxis(a.outlook)} (${a.outlook})`);
    log(`  Scope:        ${bucketAxis(a.scope)} (${a.scope})`);

    log('\nBase stats:');
    log(`  heart ${p.baseStats.heart}   body ${p.baseStats.body}   mind ${p.baseStats.mind}`);

    log('\nDerived stats:');
    const ds = p.derivedStats;
    log(`  physical  attack ${ds.physicalAttack}    skill ${ds.physicalSkill}    defense ${ds.physicalDefense}`);
    log(`  mental    attack ${ds.mentalAttack}      skill ${ds.mentalSkill}      defense ${ds.mentalDefense}`);
    log(`  emotional attack ${ds.emotionalAttack}   skill ${ds.emotionalSkill}   defense ${ds.emotionalDefense}`);
    log(`  luck      ${ds.luck}`);

    log('\nNon-combat stats:');
    const nc = p.nonCombatStats;
    log(`  physical  save ${nc.physicalSave}    test ${nc.physicalTest}`);
    log(`  mental    save ${nc.mentalSave}      test ${nc.mentalTest}`);
    log(`  emotional save ${nc.emotionalSave}   test ${nc.emotionalTest}`);

    log('\nEquipment:');
    const slots = ['weapon', 'armor', 'accessory', 'head', 'body', 'hands', 'feet'] as const;
    for (const slot of slots) {
        const eq = p.equipment[slot];
        if (!eq) {
            log(`  ${slot.padEnd(10)} (empty)`);
        } else {
            const rarity = eq.rarity ? ` [${eq.rarity}]` : '';
            log(`  ${slot.padEnd(10)} ${eq.name}${rarity}`);
        }
    }

    log('\nActive effects:');
    if (p.effects.length === 0) {
        log('  (none)');
    } else {
        for (const e of p.effects) {
            log(`  • ${e.effectId}  intensity ${e.intensity}  remaining ${e.remainingDuration}`);
        }
    }

    log('\nSkills:');
    log(`  Known/Unlocked: ${p.knownSkills.length > 0 ? p.knownSkills.join(', ') : '(none)'}`);

    log('\nInventory summary:');
    const grouped = new Map<string, number>();
    for (const item of p.inventory) {
        const qty = isConsumable(item) ? item.quantity : 1;
        grouped.set(item.category, (grouped.get(item.category) ?? 0) + qty);
    }
    if (grouped.size === 0) {
        log('  (empty)');
    } else {
        for (const [cat, count] of grouped) {
            log(`  ${cat}: ${count}`);
        }
    }

    // Spec 06 Q3 + Q8 — deferred allocation. Prompt only when there are
    // points to spend; loop until the player either spends them all or
    // picks "leave them unspent". Each allocation is a dispatch so the
    // autosave + state-log records reflect the change.
    while (store.getState().player.availableStatPoints > 0) {
        const pool = store.getState().player.availableStatPoints;
        const { stat } = await prompt<{ stat: 'heart' | 'body' | 'mind' | 'skip' }>([{
            type: 'rawlist', name: 'stat',
            message: `Allocate stat point (${pool} remaining)?`,
            choices: [
                { name: 'heart  — emotion / willpower / charisma', value: 'heart' },
                { name: 'body   — physical / constitution',         value: 'body'  },
                { name: 'mind   — intelligence / reflexes',         value: 'mind'  },
                { name: 'leave them unspent',                       value: 'skip'  },
            ],
        }]);
        if (stat === 'skip') break;
        const before = store.getState();
        store.getState().allocateStatPoint(stat);
        logState('allocateStatPoint', before, store.getState(), { stat });
        log(`Allocated 1 point to ${stat}.`);
    }

    // Spec 06 Q7 — runtime skill learning (Phase 30 unit 3). Prompt loop
    // mirrors the Allocate flow: visible only when there's something eligible
    // to learn, scriptable via a "skip" exit. Each learn dispatches so the
    // autosave + state log records the change.
    let learnable = getAvailableSkills(
        store.getState().player,
        store.getState().philosophicalAlignment,
    );
    while (learnable.length > 0) {
        const choices = learnable.map(s => {
            const blurb = s.description.length > 60
                ? `${s.description.slice(0, 57)}…`
                : s.description;
            return {
                name: `${s.name}  (tier ${s.tier}, ${s.category})  — ${blurb}`,
                value: s.id,
            };
        });
        choices.push({ name: 'leave them unlearned', value: 'skip' });
        const { skillId } = await prompt<{ skillId: string }>([{
            type: 'rawlist', name: 'skillId',
            message: `Learn a skill? (${learnable.length} available)`,
            choices,
        }]);
        if (skillId === 'skip') break;
        const before = store.getState();
        store.getState().learnSkill(skillId);
        logState('learnSkill', before, store.getState(), { skillId });
        log(`Learned ${skillId}.`);
        learnable = getAvailableSkills(
            store.getState().player,
            store.getState().philosophicalAlignment,
        );
    }
}

function saveTab(store: GameStoreHandle, snapshotAdapter: PersistenceAdapter | null): void {
    // The Save tab writes the current state to the snapshot slot
    // (a separate adapter from any autosave path). This keeps explicit
    // save / load decoupled from the dispatch-time autosave, so a Load
    // can roll the player back to a labelled checkpoint even after
    // subsequent dispatches have written newer autosave state.
    if (!snapshotAdapter) {
        log('\nNo save slot — pass --save-file <path> to enable Save / Load.');
        logState('save', store.getState(), store.getState(), { result: 'no-slot' });
        return;
    }
    const before = store.getState();
    const { currentEncounter: _drop, ...persistable } = before;
    snapshotAdapter.save(persistable);
    logState('save', before, store.getState());
    emit({ type: 'game:saved', payload: { state: store.getState() } });
    log('\nGame saved.');
}

function loadTab(store: GameStoreHandle, snapshotAdapter: PersistenceAdapter | null): void {
    if (!snapshotAdapter) {
        log('\nNo save slot — pass --save-file <path> to enable Save / Load.');
        logState('load', store.getState(), store.getState(), { result: 'no-slot' });
        return;
    }
    const saved = snapshotAdapter.load();
    if (!saved) {
        log('\nNo save file to load — Save first.');
        logState('load', store.getState(), store.getState(), { result: 'no-save' });
        return;
    }
    const before = store.getState();
    store.setState({
        version:    saved.version,
        player:     saved.player,
        world:      saved.world,
        quests:     saved.quests,
        flags:      saved.flags,
        moralMeter: saved.moralMeter,
        rngState:   saved.rngState,
    });
    logState('load', before, store.getState());
    emit({ type: 'game:loaded', payload: { state: store.getState() } });
    log('\nGame loaded.');
}

type DevAction = 'set-level' | 'set-stats' | 'learn-skills' | 'equip-skills'
    | 'grant-equipment' | 'grant-consumables' | 'equip-item' | 'grant-currency'
    | 'set-moral' | 'set-alignment' | 'spawn-enemy' | 'max-out' | 'back';

async function devTab(store: GameStoreHandle): Promise<void> {
    const { action } = await prompt<{ action: DevAction }>([{
        type: 'rawlist', name: 'action',
        message: 'DEV Menu:',
        choices: [
            { name: 'Set level',               value: 'set-level' },
            { name: 'Set base stats',           value: 'set-stats' },
            { name: 'Learn skills (pick/all)',   value: 'learn-skills' },
            { name: 'Unlock skills (DEPRECATED)',   value: 'equip-skills' },
            { name: 'Grant all equipment',       value: 'grant-equipment' },
            { name: 'Grant all consumables',     value: 'grant-consumables' },
            { name: 'Equip specific item',       value: 'equip-item' },
            { name: 'Grant currency',           value: 'grant-currency' },
            { name: 'Set moral meter',           value: 'set-moral' },
            { name: 'Set philosophical alignment', value: 'set-alignment' },
            { name: 'Spawn enemy',              value: 'spawn-enemy' },
            { name: 'MAX OUT (level 20, all skills/items)', value: 'max-out' },
            { name: '← Back',                  value: 'back' },
        ],
    }]);

    switch (action) {
        case 'set-level': {
            const { level } = await prompt<{ level: number }>([
                { type: 'number', name: 'level', message: 'Target level:', default: 10 },
            ]);
            const r = devSetLevel(store, level);
            log(`\n${r.detail}\n`);
            break;
        }
        case 'set-stats': {
            const { heart, body, mind } = await prompt<{ heart: number; body: number; mind: number }>([
                { type: 'number', name: 'heart', message: 'Heart:', default: store.getState().player.baseStats.heart },
                { type: 'number', name: 'body',  message: 'Body:',  default: store.getState().player.baseStats.body },
                { type: 'number', name: 'mind',  message: 'Mind:',  default: store.getState().player.baseStats.mind },
            ]);
            const r = devSetStats(store, { heart, body, mind });
            log(`\n${r.detail}\n`);
            break;
        }
        case 'learn-skills': {
            const { mode } = await prompt<{ mode: 'all' | 'pick' }>([{
                type: 'rawlist', name: 'mode', message: 'Learn:',
                choices: [
                    { name: 'All skills', value: 'all' },
                    { name: 'Pick specific', value: 'pick' },
                ],
            }]);
            if (mode === 'all') {
                const r = devLearnSkills(store, 'all');
                log(`\n${r.detail}\n`);
            } else {
                const known = new Set(store.getState().player.knownSkills);
                const available = getSkillIds().filter(id => !known.has(id));
                if (available.length === 0) { log('\nAll skills already known.\n'); break; }
                const { skills } = await prompt<{ skills: string[] }>([{
                    type: 'checkbox', name: 'skills', message: 'Pick skills to learn:',
                    choices: available.map(id => ({ name: id, value: id })),
                }]);
                const r = devLearnSkills(store, skills);
                log(`\n${r.detail}\n`);
            }
            break;
        }
        case 'equip-skills': {
            log('\n[DEPRECATED] Card equipment was removed in Phase 99.');
            log('All known skills are automatically available for combat use.');
            log('Use \'Learn skills\' to add skills to your known catalogue.');
            break;
        }
        case 'grant-equipment': {
            const r = devGrantAllEquipment(store, 'common');
            log(`\n${r.detail}\n`);
            break;
        }
        case 'grant-consumables': {
            const r = devGrantAllConsumables(store, 5);
            log(`\n${r.detail}\n`);
            break;
        }
        case 'equip-item': {
            const templates = getEquipmentTemplateIds();
            const { templateId } = await prompt<{ templateId: string }>([{
                type: 'rawlist', name: 'templateId', message: 'Which template?',
                choices: templates.map(id => ({ name: id, value: id })),
            }]);
            const slots: EquipmentSlot[] = ['weapon', 'armor', 'head', 'accessory'];
            const { slot } = await prompt<{ slot: EquipmentSlot }>([{
                type: 'rawlist', name: 'slot', message: 'Slot:',
                choices: slots.map(s => ({ name: s, value: s })),
            }]);
            const r = devEquipItem(store, templateId, slot);
            log(`\n${r.detail}\n`);
            break;
        }
        case 'grant-currency': {
            const { amount } = await prompt<{ amount: number }>([
                { type: 'number', name: 'amount', message: 'Amount to add:', default: 100 },
            ]);
            const r = devGrantCurrency(store, amount);
            log(`\n${r.detail}\n`);
            break;
        }
        case 'set-moral': {
            const { value } = await prompt<{ value: number }>([
                { type: 'number', name: 'value', message: 'Moral meter value (-100 to 100):', default: 0 },
            ]);
            const r = devSetMoralMeter(store, value);
            log(`\n${r.detail}\n`);
            break;
        }
        case 'set-alignment': {
            const cur = store.getState().philosophicalAlignment;
            const { epistemology, outlook, scope } = await prompt<{ epistemology: number; outlook: number; scope: number }>([
                { type: 'number', name: 'epistemology',   message: 'Epistemology (-100 to 100):',   default: cur.epistemology },
                { type: 'number', name: 'outlook',  message: 'Outlook (-100 to 100):', default: cur.outlook },
                { type: 'number', name: 'scope',    message: 'Scope (-100 to 100):',   default: cur.scope },
            ]);
            const r = devSetAlignment(store, { epistemology, outlook, scope });
            log(`\n${r.detail}\n`);
            break;
        }
        case 'spawn-enemy': {
            const slugs = getEnemySlugs();
            const { slug } = await prompt<{ slug: EnemySlug }>([{
                type: 'rawlist', name: 'slug', message: 'Spawn which enemy?',
                choices: slugs.map(s => ({ name: `${s} — ${ENEMY_REGISTRY[s].name}`, value: s })),
            }]);
            const before = store.getState();
            const r = devSpawnEnemy(store, slug);
            logState('debugSpawn', before, store.getState(), { slug, enemyName: ENEMY_REGISTRY[slug].name });
            log(`\n${r.detail}. Combat staged — run the Hazard-Pattern combat CLI: npm run combat\n`);
            break;
        }
        case 'max-out': {
            const r = devMaxOut(store);
            log(`\n${r.detail}\n`);
            break;
        }
        case 'back':
            break;
    }
}

export async function runGameCli(rawArgs = process.argv.slice(2)): Promise<void> {
    // Subcommand: `npm run game -- combat [flags]` (Phase 165) hands off to
    // the new Hazard-style combat agentic driver. This is the NEW combat path.
    if (rawArgs[0] === 'combat') {
        const { runCombatCli } = await import('./combat.cli');
        await runCombatCli(rawArgs.slice(1));
        return;
    }

    // Subcommand: `npm run game -- hazard [flags]` hands off to the standalone
    // hazard mini-game driver, which owns its own flag set.
    if (rawArgs[0] === 'hazard') {
        const { runHazardCli } = await import('./hazard.cli');
        await runHazardCli(rawArgs.slice(1));
        return;
    }

    // Subcommand: `npm run game -- gathering [flags]` hands off to the
    // standalone gleaning driver, which owns its own flag set.
    if (rawArgs[0] === 'gathering') {
        const { runGatheringCli } = await import('./gathering.cli');
        await runGatheringCli(rawArgs.slice(1));
        return;
    }

    // Subcommand: `npm run game -- rest [flags]` hands off to the standalone
    // Night Watch driver, which owns its own flag set.
    if (rawArgs[0] === 'rest') {
        const { runRestCli } = await import('./rest.cli');
        await runRestCli(rawArgs.slice(1));
        return;
    }

    // Subcommand: `npm run game -- loot-cache [flags]` hands off to the
    // standalone Reliquary driver, which owns its own flag set.
    if (rawArgs[0] === 'loot-cache') {
        const { runLootCacheCli } = await import('./lootcache.cli');
        await runLootCacheCli(rawArgs.slice(1));
        return;
    }

    // Subcommand: `npm run game -- quest-board [flags]` hands off to the
    // standalone Boy's Almanac driver, which owns its own flag set.
    if (rawArgs[0] === 'quest-board') {
        const { runQuestBoardCli } = await import('./quest-board.cli');
        await runQuestBoardCli(rawArgs.slice(1));
        return;
    }

    const flags = parseArgv(rawArgs);
    if (flags.jsonEvents) setOutputMode('json');
    if (flags.scriptPath) {
        const raw = fs.readFileSync(flags.scriptPath, 'utf-8');
        const answers = JSON.parse(raw);
        if (!Array.isArray(answers)) {
            throw new Error('--script JSON must be a top-level array of answer objects.');
        }
        setIoMode({ kind: 'script', answers });
    } else if (flags.stdin) {
        setIoMode({ kind: 'stdin' });
    }
    if (flags.stateLogPath) {
        setStateLogPath(flags.stateLogPath);
    }

    log('Axiomancer — game loop demo.\n');

    // The Save / Load tabs use a dedicated snapshot adapter pointed at
    // the user-supplied --save-file path. The store itself uses
    // nullAdapter so dispatch-time autosaves don't overwrite an explicit
    // snapshot between Save and Load tabs (this is what makes Load a
    // meaningful rollback rather than a re-read of the latest dispatch).
    const snapshotAdapter: PersistenceAdapter | null = flags.saveFile
        ? createNodeAdapter(flags.saveFile)
        : null;

    const store = await bootstrapStore(nullAdapter);

    if (flags.route && flags.route.length > 0) {
        for (const target of flags.route) {
            await moveAndResolveMapNode(store, target, flags);
        }
        emit({ type: 'cli:exit', payload: { reason: 'route-complete', route: flags.route } });
        return;
    }

    try {
        while (true) {
            const tab = await pickTab();
            switch (tab) {
                case 'map':       await mapTab(store, flags);                  break;
                case 'journal':   journalTab(store);                         break;
                case 'skills':    skillsTab(store);                          break;
                case 'codex':     codexTab(store);                           break;
                case 'inventory': inventoryTab(store);                       break;
                case 'character': await characterTab(store);                 break;
                case 'dev':       await devTab(store);                       break;
                case 'reset':     await resetTab(store);                     break;
                case 'save':      saveTab(store, snapshotAdapter);           break;
                case 'load':      loadTab(store, snapshotAdapter);           break;
                case 'quit':
                    log('Goodbye.');
                    emit({ type: 'cli:exit', payload: { reason: 'quit' } });
                    return;
            }
        }
    } catch (err) {
        emit({ type: 'cli:exit', payload: { reason: 'error', message: String(err) } });
        throw err;
    }
}

if (require.main === module) {
    runGameCli().catch(err => {
        // eslint-disable-next-line no-console
        console.error(err);
        process.exitCode = 1;
    });
}
