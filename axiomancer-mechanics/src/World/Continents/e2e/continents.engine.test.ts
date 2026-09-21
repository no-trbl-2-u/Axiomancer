/**
 * Hermetic e2e tests for World/Continents module functionality.
 * Tests map definitions, NPC dialogue trees, and quest integration.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { restoreOriginalRng } from '../../../test-utils/rng';
import { fishingVillage, northernForest } from '../Coastal-Village/maps';
import { captainBlackwater, fishermansDaughter, villageHealer, unionLeader, merchantWidow } from '../Coastal-Village/npcs';
import { shrineKeeper, chronicler, wanderingPhilosopher, forestRanger, hermitSage, lostTrader } from '../Northern-Forest/npcs';

describe('World/Continents Engine Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    restoreOriginalRng();
  });

  describe('Coastal Village Map Definition', () => {
    it('has valid map structure with all required properties', () => {
      expect(fishingVillage.name).toBe('fishing-village');
      expect(fishingVillage.continent).toBe('coastal-continent');
      expect(fishingVillage.description).toContain('home town');
      expect(fishingVillage.startingNode.id).toBe('fv-1');
      expect(fishingVillage.nodes).toHaveLength(28); // Phase 65 expanded grid + the three gates (2026-09-21)
      expect(fishingVillage.npcs).toHaveLength(8); // All coastal NPCs
      expect(fishingVillage.quests).toHaveLength(2); // starting-quest + get-to-forest (Phase 8)
    });

    it('has properly connected node network', () => {
      // The 2026-08-08 first-map audit re-layered the village into three
      // lanes across ten columns; Phase 53c (S-02) then narrowed column 1
      // to fv-2 alone (Old Marrow, the quest-giver) so the map's premise
      // is guaranteed on every route. fv-12 and fv-13, displaced from
      // column 1, re-home into column 3. The property under test: the
      // start opens onto Old Marrow's single node, he opens onto every
      // column-2 lane, a mid-map spine node keeps a spine exit plus both
      // flanks, and the map has an authored end.
      const fv1 = fishingVillage.nodes.find(n => n.id === 'fv-1');
      expect(fv1?.connectedNodes).toEqual(['fv-2']);

      // THE THREE GATES (2026-09-21): Old Marrow opens onto the first gate,
      // and the gate onto every column-3 lane; each lane funnels into the
      // next gate.
      const fv2 = fishingVillage.nodes.find(n => n.id === 'fv-2');
      expect(fv2?.connectedNodes).toEqual(['fv-26']);
      const gate1 = fishingVillage.nodes.find(n => n.id === 'fv-26');
      expect(gate1?.connectedNodes).toContain('fv-16');  // wharf lane
      expect(gate1?.connectedNodes).toContain('fv-3');   // spine
      expect(gate1?.connectedNodes).toContain('fv-11');  // inland lane

      const fv3 = fishingVillage.nodes.find(n => n.id === 'fv-3');
      expect(fv3?.connectedNodes).toEqual(['fv-27']);

      // Terminal column — the only place a run is allowed to run out of moves.
      const fv10 = fishingVillage.nodes.find(n => n.id === 'fv-10');
      expect(fv10?.connectedNodes).toHaveLength(0);
    });

    it('has valid starting quest with proper structure', () => {
      const startingQuest = fishingVillage.quests![0];
      expect(startingQuest.name).toBe('starting-quest');
      expect(startingQuest.mapName).toBe('fishing-village');
      expect(startingQuest.objectives).toHaveLength(1);
      expect(startingQuest.objectives[0].type).toBe('kill');
      expect(startingQuest.objectives[0].target).toBe('The King of Revenge');
    });

    it('has a get-to-forest quest gating on the mid-game gate (Phase 8)', () => {
      const getToForest = fishingVillage.quests!.find(q => q.name === 'get-to-forest');
      expect(getToForest).toBeDefined();
      expect(getToForest!.mapName).toBe('fishing-village');
      expect(getToForest!.objectives).toHaveLength(1);
      expect(getToForest!.objectives[0].type).toBe('reach');
      expect(getToForest!.objectives[0].target).toBe('nf-1');
    });
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

  describe('Coastal Village NPCs', () => {
    it('Captain Blackwater has valid dialogue tree with alignment-gated choices', () => {
      expect(captainBlackwater.name).toBe('Captain Blackwater');
      expect(captainBlackwater.dialogueTree!.id).toBe('captain-blackwater');
      
      const greetNode = captainBlackwater.dialogueTree!.nodes['greet'];
      expect(greetNode.choices!).toHaveLength(6); // +1 Phase 53e marrow_pressed read-back
      
      // Test alignment-gated fair trade choice
      const fairTradeChoice = greetNode.choices!.find(c => c.text.includes('how you deal fair'));
      expect(fairTradeChoice?.requires?.requiresAlignment?.axis).toBe('scope');
      expect(fairTradeChoice?.requires?.requiresAlignment?.op).toBe('gte');
      expect(fairTradeChoice?.requires?.requiresAlignment?.value).toBe(20);
    });

    it("Fisherman's Daughter has mentorship-themed dialogue with growth recognition", () => {
      expect(fishermansDaughter.name).toBe("Fisherman's Daughter");
      expect(fishermansDaughter.dialogueTree!.id).toBe('fishermans-daughter');
      
      const greetNode = fishermansDaughter.dialogueTree!.nodes['greet'];
      
      // Test growth recognition choice (Phase 63 pattern)
      const recognitionChoice = greetNode.choices!.find(c => 
        c.requires?.playerAlignmentCellChangedSince === true
      );
      expect(recognitionChoice).toBeDefined();
      expect(recognitionChoice?.nextNodeId).toBe('growth_recognition');
    });

    it('Village Healer has medical ethics dilemmas with resource constraints', () => {
      expect(villageHealer.name).toBe('Village Healer');
      expect(villageHealer.dialogueTree!.id).toBe('village-healer');
      
      const situationNode = villageHealer.dialogueTree!.nodes['talk_situation'];
      // Case-insensitive: this asserts the healer NAMES her constraints, not
      // where a sentence happens to break. The phase 75 re-voice split the line
      // and "fever spreads" became sentence-initial — content unchanged, casing
      // not. A content assertion should not fail on a full stop moving.
      expect(situationNode.text.toLowerCase()).toContain('fever spreads');
      expect(situationNode.text).toContain('hoarded in the wealthy district');
      
      // Test alignment-gated providence choice
      const providenceChoice = situationNode.choices!.find(c => 
        c.text.includes('Trust to providence')
      );
      expect(providenceChoice?.requires?.requiresAlignment?.axis).toBe('epistemology');
    });

    it('Union Leader has labor rights themes with collective action choices', () => {
      expect(unionLeader.name).toBe("Dockworker's Union Leader");
      expect(unionLeader.dialogueTree!.id).toBe('union-leader');
      
      const situationNode = unionLeader.dialogueTree!.nodes['talk_workers_situation'];
      expect(situationNode.text).toContain('calling a strike');
      
      // Test solidarity choice with flag setting
      const solidarityChoice = situationNode.choices!.find(c => 
        c.text.includes('stand with you')
      );
      expect(solidarityChoice?.effect?.setFlag).toBe('union_supporter');
      expect(solidarityChoice?.effect?.grantCurrency).toBe(-20);
    });

    it('Merchant Widow has grief and justice themes with moral complexity', () => {
      expect(merchantWidow.name).toBe("Merchant's Widow");
      expect(merchantWidow.dialogueTree!.id).toBe('merchant-widow');
      
      const troublesNode = merchantWidow.dialogueTree!.nodes['talk_troubles'];
      expect(troublesNode.text).toContain('husband was murdered');
      expect(troublesNode.text).toContain('tempering with mercy');
      
      // Test justice with mercy choice
      const mercyChoice = troublesNode.choices!.find(c => 
        c.text.includes('both justice and mercy')
      );
      expect(mercyChoice?.effect?.setFlag).toBe('widow_mediator');
      expect(mercyChoice?.effect?.moralDelta).toBe(3);
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
      expect(veilChoice?.requires?.requiresAlignment?.axis).toBe('epistemology');
      expect(veilChoice?.effect?.alignmentDelta?.epistemology).toBe(2);
    });

    it('Chronicler has scholarly documentation themes with chronicle integration', () => {
      expect(chronicler.name).toBe('The Chronicler');
      expect(chronicler.dialogueTree!.id).toBe('chronicler');
      
      const purposeNode = chronicler.dialogueTree!.nodes['chronicling_purpose'];
      expect(purposeNode.text).toContain('forgotten histories');
      expect(purposeNode.text).toContain('Pre-coastal civilizations');
      
      // Test contribution offer with flag setting
      const contributionNode = chronicler.dialogueTree!.nodes['contribution_offer'];
      const acceptChoice = contributionNode.choices![0];
      expect(acceptChoice.effect?.setFlag).toBe('chronicler_scholarly_mission');
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
      expect(fateChoice?.requires?.requiresAlignment?.axis).toBe('epistemology');
      expect(fateChoice?.requires?.requiresAlignment?.value).toBe(15);
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
      expect(sustainableChoice?.effect?.setFlag).toBe('forest_conservation_supporter');

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
      
      // Test balanced sharing choice with bridge flag
      const balancedChoice = solitudeNode.choices!.find(c =>
        c.text.includes('share your wisdom while preserving')
      );
      expect(balancedChoice?.effect?.setFlag).toBe('hermit_wisdom_bridge');

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
      expect(honestChoice?.effect?.setFlag).toBe('trader_honest_helper');
    });
  });

  describe('Dialogue Runtime Integration', () => {
    it('has alignment-gated choices with proper requirements', () => {
      const greetNode = captainBlackwater.dialogueTree!.nodes['greet'];
      const fairTradeChoice = greetNode.choices!.find(c => c.text.includes('how you deal fair'));
      
      // Choice should require scope >= 20
      expect(fairTradeChoice?.requires?.requiresAlignment?.axis).toBe('scope');
      expect(fairTradeChoice?.requires?.requiresAlignment?.value).toBe(20);
    });

    it('has choices with alignment delta effects', () => {
      // Test choice that modifies alignment
      const greetNode = fishermansDaughter.dialogueTree!.nodes['greet'];
      const wisdomChoice = greetNode.choices!.find(c => 
        c.text.includes('seen much of the world')
      );
      
      expect(wisdomChoice?.effect?.alignmentDelta?.scope).toBe(1);
      expect(wisdomChoice?.effect?.alignmentDelta?.epistemology).toBe(1);
    });

    it('handles flag-gated choices and flag setting', () => {
      // Test choice that sets a flag
      const situationNode = unionLeader.dialogueTree!.nodes['talk_workers_situation'];
      const solidarityChoice = situationNode.choices!.find(c => 
        c.text.includes('stand with you')
      );
      
      expect(solidarityChoice?.effect?.setFlag).toBe('union_supporter');
      
      // Test flag-gated choice (from beggar NPC in maps.ts)
      const oldDockmasterTree = fishingVillage.npcs!.find(npc => npc.name === 'Old Marrow')?.dialogueTree;
      if (oldDockmasterTree) {
        const greetNode = oldDockmasterTree.nodes['greet'];
        const alignmentChoice = greetNode.choices!.find(c => 
          c.requires?.playerAlignmentCellChangedSince === true
        );
        expect(alignmentChoice).toBeDefined();
      }
    });

    it('handles currency effects correctly', () => {
      // Test positive currency grant
      const showWaresNode = captainBlackwater.dialogueTree!.nodes['show_wares'];
      const valuesChoice = showWaresNode.choices![0];
      expect(valuesChoice.effect?.grantCurrency).toBe(5);
      
      // Test negative currency cost  
      const situationNode = villageHealer.dialogueTree!.nodes['talk_situation'];
      const helpChoice = situationNode.choices!.find(c => c.text.includes("I'll help you"));
      expect(helpChoice?.effect?.grantCurrency).toBe(-15);
    });

    it('handles moral meter effects', () => {
      // Test positive moral effect
      const wisdomNode = fishermansDaughter.dialogueTree!.nodes['worldly_wisdom'];
      const stayTrueChoice = wisdomNode.choices!.find(c => c.text.includes('Hold to what you are'));
      expect(stayTrueChoice?.effect?.moralDelta).toBe(2);
      
      // Test negative moral effect
      const troublesNode = merchantWidow.dialogueTree!.nodes['talk_troubles'];
      const vengeanceChoice = troublesNode.choices!.find(c => c.text.includes('hire the best hunters'));
      expect(vengeanceChoice?.effect?.moralDelta).toBe(-1);
    });
  });

  describe('Quest Integration', () => {
    it('has quest completion requirements in dialogue', () => {
      // Test quest completion requirement in Old Marrow's thanks node
      const oldMarrowTree = fishingVillage.npcs!.find(npc => npc.name === 'Old Marrow')?.dialogueTree;
      if (oldMarrowTree) {
        const thanksNode = oldMarrowTree.nodes['thanks'];
        thanksNode.choices!.forEach(choice => {
          expect(choice.requires?.questCompleted).toBe('starting-quest');
        });
      }
    });

    it('has quest start effects in dialogue', () => {
      // Test quest start effect in Old Marrow's offer node
      const oldMarrowTree = fishingVillage.npcs!.find(npc => npc.name === 'Old Marrow')?.dialogueTree;
      if (oldMarrowTree) {
        const offerNode = oldMarrowTree.nodes['offer'];
        const acceptChoice = offerNode.choices!.find(c => c.text.includes('Accept the quest'));
        expect(acceptChoice?.effect?.startQuest).toBe('starting-quest');
      }
    });
  });

  describe('Cross-NPC Flag Integration', () => {
    it('has flag-gated content referencing other NPCs', () => {
      // Test beggar's bell recognition (requires befriended-little-belle flag)
      const beggarTree = fishingVillage.npcs!.find(npc => npc.name === 'Coastal Beggar')?.dialogueTree;
      if (beggarTree) {
        const greetNode = beggarTree.nodes['greet'];
        const gullChoice = greetNode.choices!.find(c => 
          c.requires?.flag === 'befriended-little-belle'
        );
        expect(gullChoice).toBeDefined();
        expect(gullChoice?.text).toContain('gone quiet');
      }
    });

    it('has observer recognition patterns across multiple NPCs', () => {
      // Test that multiple NPCs have alignment observer recognition choices
      const npcTrees = [
        captainBlackwater.dialogueTree!,
        fishermansDaughter.dialogueTree!,
        shrineKeeper.dialogueTree!,
        chronicler.dialogueTree!,
        wanderingPhilosopher.dialogueTree!
      ];

      npcTrees.forEach(tree => {
        const greetNode = tree.nodes['greet'];
        const observerChoice = greetNode.choices!.find(c => 
          c.requires?.playerAlignmentCellChangedSince === true
        );
        expect(observerChoice).toBeDefined();
      });
    });
  });
});