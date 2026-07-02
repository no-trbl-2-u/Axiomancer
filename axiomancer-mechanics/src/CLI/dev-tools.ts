import { createCharacter } from '../Character';
import type { BaseStats } from '../Character/types';
import type { EquipmentSlot } from '../Items/types';
import type { ItemRarity } from '../Items/types';
import { dropItem } from '../Items/item.factory';
import { equipmentTemplates } from '../Items/equipment.templates';
import { consumableLibrary } from '../Items/consumable.library';
import { cardLibrary } from '../Cards/cards.library';
import { ENEMY_REGISTRY, EnemySlug } from '../Enemy/enemy.library';
import type { PhilosophicalAlignment } from '../Philosophy/types';
import type { createGameStore } from '../Game/store';
import { clamp } from '../Utils';

type Store = ReturnType<typeof createGameStore>;

interface DevResult { ok: boolean; detail: string }

export function devSetLevel(store: Store, targetLevel: number): DevResult {
    const clamped = Math.max(1, Math.floor(targetLevel));
    const state = store.getState();
    const p = state.player;

    const rebuilt = createCharacter({
        id: p.id,
        name: p.name,
        level: clamped,
        baseStats: { ...p.baseStats },
        inventory: [...p.inventory],
        currency: p.currency,
        equipment: { ...p.equipment },
        knownSkills: [...p.knownSkills],
        effects: [...p.effects],
        procUnlocks: p.procUnlocks,
    });

    store.setState({ player: rebuilt });
    return { ok: true, detail: `Level set to ${clamped}` };
}

export function devSetStats(store: Store, stats: Partial<BaseStats>): DevResult {
    const state = store.getState();
    const p = state.player;
    const next: BaseStats = {
        heart: stats.heart ?? p.baseStats.heart,
        body: stats.body ?? p.baseStats.body,
        mind: stats.mind ?? p.baseStats.mind,
    };

    const rebuilt = createCharacter({
        id: p.id,
        name: p.name,
        level: p.level,
        baseStats: next,
        inventory: [...p.inventory],
        currency: p.currency,
        equipment: { ...p.equipment },
        knownSkills: [...p.knownSkills],
        effects: [...p.effects],
        procUnlocks: p.procUnlocks,
    });

    store.setState({ player: rebuilt });
    return { ok: true, detail: `Stats set to H:${next.heart} B:${next.body} M:${next.mind}` };
}

export function devLearnSkills(store: Store, skillIds: string[] | 'all'): DevResult {
    const ids = skillIds === 'all'
        ? cardLibrary.map(s => s.id)
        : skillIds;

    const state = store.getState();
    const known = new Set(state.player.knownSkills);
    for (const id of ids) known.add(id);

    store.setState({
        player: { ...state.player, knownSkills: [...known] },
    });
    return { ok: true, detail: `${ids.length} skill(s) learned (total known: ${known.size})` };
}

/**
 * Grant/unlock named skills or all skills by writing knownSkills.
 * (Phase 99 / ADR-0002 — skills are known, not equipped; the legacy
 * `devEquipSkills` was removed in Phase 159.)
 */
export function devUnlockSkills(store: Store, skillIds: string[] | 'all'): DevResult {
    const ids = skillIds === 'all'
        ? cardLibrary.map(s => s.id)
        : skillIds;
    const state = store.getState();
    const known = new Set(state.player.knownSkills);
    for (const id of ids) known.add(id);
    store.setState({
        player: { ...state.player, knownSkills: [...known] },
    });
    return { ok: true, detail: `${ids.length} skill(s) unlocked (total known: ${known.size})` };
}

export function devGrantAllEquipment(store: Store, rarity: ItemRarity = 'common'): DevResult {
    const state = store.getState();
    const level = state.player.level;
    const eligible = equipmentTemplates.filter(t => t.requiredLevel <= level);
    let count = 0;
    for (const t of eligible) {
        const item = dropItem(t.id, level, rarity);
        state.addItem(item);
        count++;
    }
    return { ok: true, detail: `Granted ${count} equipment pieces at ${rarity} rarity` };
}

export function devGrantAllConsumables(store: Store, quantity = 5): DevResult {
    const state = store.getState();
    let count = 0;
    for (const c of consumableLibrary) {
        state.addItem({ ...c, quantity });
        count++;
    }
    return { ok: true, detail: `Granted ${count} consumable types (×${quantity} each)` };
}

export function devEquipItem(store: Store, templateId: string, slot: EquipmentSlot, rarity: ItemRarity = 'common'): DevResult {
    const state = store.getState();
    const item = dropItem(templateId, state.player.level, rarity);
    state.equipItem(item);
    return { ok: true, detail: `Equipped ${templateId} (${rarity}) in ${slot}` };
}

export function devGrantCurrency(store: Store, amount: number): DevResult {
    const state = store.getState();
    store.setState({
        player: { ...state.player, currency: state.player.currency + amount },
    });
    return { ok: true, detail: `Currency: ${state.player.currency} → ${store.getState().player.currency}` };
}

export function devSetMoralMeter(store: Store, value: number): DevResult {
    const clamped = clamp(value, -100, 100);
    store.setState({ moralMeter: clamped });
    return { ok: true, detail: `Moral meter set to ${clamped}` };
}

export function devSetAlignment(store: Store, alignment: Partial<PhilosophicalAlignment>): DevResult {
    const state = store.getState();
    const current = state.philosophicalAlignment;
    const next: PhilosophicalAlignment = {
        epistemology: clamp(alignment.epistemology ?? current.epistemology, -100, 100),
        outlook: clamp(alignment.outlook ?? current.outlook, -100, 100),
        scope: clamp(alignment.scope ?? current.scope, -100, 100),
    };
    store.setState({ philosophicalAlignment: next });
    return { ok: true, detail: `Alignment: E:${next.epistemology} O:${next.outlook} S:${next.scope}` };
}

export function devSpawnEnemy(store: Store, slug: EnemySlug): DevResult {
    const enemy = ENEMY_REGISTRY[slug];
    if (!enemy) return { ok: false, detail: `Unknown enemy slug: ${slug}` };
    store.getState().startCombat({ enemies: [enemy] });
    return { ok: true, detail: `Spawned ${enemy.name}` };
}

export function devMaxOut(store: Store): DevResult {
    devSetLevel(store, 20);
    devSetStats(store, { heart: 20, body: 20, mind: 20 });
    devUnlockSkills(store, 'all');
    devGrantAllEquipment(store, 'rare');
    devGrantAllConsumables(store, 10);
    devGrantCurrency(store, 999);
    return { ok: true, detail: 'Maxed out: level 20, 20/20/20 stats, all skills, all items, 999 currency' };
}

export function getEnemySlugs(): EnemySlug[] {
    return Object.keys(ENEMY_REGISTRY) as EnemySlug[];
}

export function getSkillIds(): string[] {
    return cardLibrary.map(s => s.id);
}

export function getEquipmentTemplateIds(): string[] {
    return equipmentTemplates.map(t => t.id);
}
