/**
 * Hermetic e2e tests for World/Continents module functionality.
 * Tests map definitions, NPC dialogue trees, and quest integration.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { restoreOriginalRng } from '../../../test-utils/rng';
import { northernForest } from '../Coastal-Village/maps';
import { shrineKeeper, chronicler, wanderingPhilosopher, forestRanger, hermitSage, lostTrader } from '../Northern-Forest/npcs';

describe('World/Continents Engine Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    restoreOriginalRng();
  });

  describe('Northern Forest Map Definition', () => {
    it('has valid map structure with expanded node network', () => {
      expect(northernForest.name).toBe('northern-forest');
      expect(northernForest.continent).toBe('coastal-continent');
      expect(northernForest.description).toContain('pine-thick wood');
      expect(northernForest.startingNode.id).toBe('nf-1');
      expect(northernForest.nodes.length).toBeGreaterThan(10);
      expect(northernForest.npcs).toHaveLength(6); // All northern NPCs
      expect(northernForest.quests).toHaveLength(2); // gather-wood + get-to-cave (Phase 8)
    });

    it('has a gather-wood quest targeting the nf-2 gathering node\'s item (Phase 8)', () => {
      const gatherWood = northernForest.quests!.find(q => q.name === 'gather-wood');
      expect(gatherWood).toBeDefined();
      expect(gatherWood!.mapName).toBe('northern-forest');
      expect(gatherWood!.objectives).toHaveLength(1);
      expect(gatherWood!.objectives[0].type).toBe('collect');
      expect(gatherWood!.objectives[0].target).toBe('oak-branch');
      expect(gatherWood!.objectives[0].requiredCount).toBe(3);
    });

    it('has a get-to-cave quest targeting the cave-mouth node (Phase 8)', () => {
      const getToCave = northernForest.quests!.find(q => q.name === 'get-to-cave');
      expect(getToCave).toBeDefined();
      expect(getToCave!.mapName).toBe('northern-forest');
      expect(getToCave!.objectives).toHaveLength(1);
      expect(getToCave!.objectives[0].type).toBe('reach');
      expect(getToCave!.objectives[0].target).toBe('nf-10');
    });

    it('has proper sub-area connectivity', () => {
      // Re-layered 2026-08-08 alongside the village (same soft-lock defect).
      // Edges now run strictly forward one column, so the sub-area ids that
      // used to point backwards point onward instead.
      const nf11 = northernForest.nodes.find(n => n.id === 'nf-11');
      expect(nf11?.location).toEqual([4, -1]);
      expect(nf11?.connectedNodes).toContain('nf-8');

      const nf12 = northernForest.nodes.find(n => n.id === 'nf-12');
      expect(nf12?.connectedNodes).toContain('nf-4');
      expect(nf12?.connectedNodes).toContain('nf-13');

      const nf15 = northernForest.nodes.find(n => n.id === 'nf-15');
      expect(nf15?.connectedNodes).toContain('nf-7');
      expect(nf15?.connectedNodes).toContain('nf-16');
    });
  });

  describe('Northern Forest NPCs', () => {
    it('Shrine Keeper gates belief vs skepticism about the stone\'s pattern', () => {
      expect(shrineKeeper.name).toBe('Shrine Keeper');
      expect(shrineKeeper.dialogueTree!.id).toBe('shrine-keeper');

      const greetNode = shrineKeeper.dialogueTree!.nodes['greet'];
      expect(greetNode.text).toContain('keeps its own count');

      // Test veil recognition choice
      const veilChoice = greetNode.choices!.find(c =>
        c.text.includes('feels different')
      );
      expect(veilChoice).toBeDefined();
    });

    it('Chronicler has scholarly documentation themes with chronicle integration', () => {
      expect(chronicler.name).toBe('The Chronicler');
      expect(chronicler.dialogueTree!.id).toBe('chronicler');
      
      const purposeNode = chronicler.dialogueTree!.nodes['chronicling_purpose'];
      expect(purposeNode.text).toContain('forgotten histories');
      expect(purposeNode.text).toContain('Pre-coastal civilizations');
      
      // Test contribution offer (its unread flag went in R3c)
      const contributionNode = chronicler.dialogueTree!.nodes['contribution_offer'];
      const acceptChoice = contributionNode.choices![0];
      expect(acceptChoice.effect).toBeUndefined(); // R3c: its unread flag went
    });

    it('Wandering Philosopher has diverse philosophical perspectives with Socratic dialogue', () => {
      expect(wanderingPhilosopher.name).toBe('The Wandering Philosopher');
      expect(wanderingPhilosopher.dialogueTree!.id).toBe('wandering-philosopher');
      
      const seekingNode = wanderingPhilosopher.dialogueTree!.nodes['seeking_place'];
      expect(seekingNode.text).toContain('fate, forged by will, or discovered through relationship');
      
      // Test fate perspective choice with alignment requirements
      const fateChoice = seekingNode.choices!.find(c => 
        c.text.includes('Fate guides us')
      );
      expect(fateChoice).toBeDefined();
    });

    it('Forest Ranger has conservation vs exploitation themes', () => {
      expect(forestRanger.name).toBe('Forest Ranger');
      expect(forestRanger.dialogueTree!.id).toBe('forest-ranger');
      
      const dutiesNode = forestRanger.dialogueTree!.nodes['talk_duties'];
      expect(dutiesNode.text).toContain('logging operation');
      expect(dutiesNode.text).toContain('heartwood of the eldest trees');
      
      // Test sustainable alternatives choice
      const sustainableChoice = dutiesNode.choices!.find(c =>
        c.text.includes('sustainable forest trades')
      );
      expect(sustainableChoice?.effect?.grantCurrency).toBe(-25);

      // Phase 8 — get-to-cave quest grant, appended to greet.
      const caveChoice = forestRanger.dialogueTree!.nodes['greet'].choices!.find(c =>
        c.effect?.startQuest === 'get-to-cave'
      );
      expect(caveChoice).toBeDefined();
      expect(caveChoice!.nextNodeId).toBe('ranger_cave_directions');
      expect(forestRanger.dialogueTree!.nodes['ranger_cave_directions']).toBeDefined();
    });

    it('Hermit Sage has isolation vs community obligation themes', () => {
      expect(hermitSage.name).toBe('Hermit Sage');
      expect(hermitSage.dialogueTree!.id).toBe('hermit-sage');
      
      const solitudeNode = hermitSage.dialogueTree!.nodes['talk_solitude_choice'];
      expect(solitudeNode.text).toContain('wisdom earned in isolation');
      expect(solitudeNode.text).toContain('enlightenment selfish');
      
      // Test balanced sharing choice (its unread flag went in R3c)
      const balancedChoice = solitudeNode.choices!.find(c =>
        c.text.includes('share your wisdom while preserving')
      );
      expect(balancedChoice?.effect?.grantCurrency).toBe(-10);

      // Phase 8 — gather-wood quest grant, appended to greet.
      const firewoodChoice = hermitSage.dialogueTree!.nodes['greet'].choices!.find(c =>
        c.effect?.startQuest === 'gather-wood'
      );
      expect(firewoodChoice).toBeDefined();
      expect(firewoodChoice!.nextNodeId).toBe('hermit_firewood');
      expect(hermitSage.dialogueTree!.nodes['hermit_firewood']).toBeDefined();
    });

    it('Lost Trader has trust and deception themes in crisis situations', () => {
      expect(lostTrader.name).toBe('Lost Trader');
      expect(lostTrader.dialogueTree!.id).toBe('lost-trader');
      
      const happenedNode = lostTrader.dialogueTree!.nodes['talk_what_happened'];
      expect(happenedNode.text).toContain('Bandits took everything');
      expect(happenedNode.text).toContain('should I trust you');
      
      // Test honest mutual aid choice
      const honestChoice = happenedNode.choices!.find(c => 
        c.text.includes('honest action')
      );
      expect(honestChoice?.effect?.grantCurrency).toBe(-5);
    });
  });

  // adjust-npcs pass 21 — T6 (D39) deleted the observer cache that let six
  // NPCs notice "you have changed since we last spoke", but left the replies
  // ungated, so a first meeting offered them. Nothing in the game can make
  // that line true now, so no staged tree may claim it.
  it('no staged NPC claims to remember a change since a previous talk', () => {
    const trees = [
      northernForest.npcs ?? [],
    ].flat().flatMap(n => (n.dialogueTree ? [n.dialogueTree] : []));
    expect(trees.length).toBeGreaterThan(0);
    for (const tree of trees) {
      for (const node of Object.values(tree.nodes)) {
        expect(node.text).not.toMatch(/since we last (spoke|talked)/i);
        for (const choice of node.choices ?? []) {
          expect(choice.text).not.toMatch(/who you have become|something in you has changed|how you deal differently now/i);
        }
      }
    }
  });
});
