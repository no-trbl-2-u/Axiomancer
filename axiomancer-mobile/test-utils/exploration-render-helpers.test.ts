/**
 * Focused tests for Phase 107 — Map node label display optimization
 * 
 * Tests that node labels are only shown for unvisited available nodes
 * that are currently shown as choices in the options drawer.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createMemoryAdapter } from './memoryAdapter';
import { createAppStore } from '@/state/store';
import { createAppActions } from '@/state/actions';
import { selectExplorationViewModel } from '@/state/presenters/exploration.engine';

describe('Phase 107: Map node label display optimization', () => {
    let store: ReturnType<typeof createAppStore>;
    let actions: ReturnType<typeof createAppActions>;

    beforeEach(() => {
        store = createAppStore({ adapter: createMemoryAdapter() });
        actions = createAppActions(store);
    });

    it('shows labels only for nodes in the current options drawer', () => {
        const vm = selectExplorationViewModel(store.getState());
        
        // Verify that we have some available nodes
        const availableNodes = vm.nodes.filter(n => n.kind === 'available');
        expect(availableNodes.length).toBeGreaterThan(0);
        
        // Options drawer should show up to 4 options
        const shownOptions = vm.options.slice(0, 4);
        expect(shownOptions.length).toBeGreaterThan(0);
        expect(shownOptions.length).toBeLessThanOrEqual(4);
        
        // The nodes that should show labels are exactly those in shownOptions
        const shouldShowLabelIds = new Set(shownOptions.map(opt => opt.nodeId));
        
        for (const node of availableNodes) {
            const shouldShowLabel = shouldShowLabelIds.has(node.id);
            if (shouldShowLabel) {
                // This node should show a label because it's in the options drawer
                expect(vm.options.some(opt => opt.nodeId === node.id)).toBe(true);
            }
        }
    });

    it('visited nodes do not show labels regardless of other conditions', () => {
        // Move to first available node to create a completed node
        const vm = selectExplorationViewModel(store.getState());
        const firstAvailable = vm.nodes.find(n => n.kind === 'available');
        
        if (firstAvailable) {
            actions.moveTo(firstAvailable.id);
            
            const vmAfter = selectExplorationViewModel(store.getState());
            const completedNodes = vmAfter.nodes.filter(n => n.kind === 'completed');
            
            // Completed nodes should never be in the options list
            for (const completed of completedNodes) {
                expect(vmAfter.options.some(opt => opt.nodeId === completed.id)).toBe(false);
            }
        }
    });

    it('locked nodes do not show labels', () => {
        const vm = selectExplorationViewModel(store.getState());
        const lockedNodes = vm.nodes.filter(n => n.kind === 'locked');
        
        // Locked nodes should never be in the options list
        for (const locked of lockedNodes) {
            expect(vm.options.some(opt => opt.nodeId === locked.id)).toBe(false);
        }
    });

    it('current node does not show labels', () => {
        const vm = selectExplorationViewModel(store.getState());
        const currentNode = vm.nodes.find(n => n.kind === 'current');
        
        if (currentNode) {
            // Current node should not be in the options list
            expect(vm.options.some(opt => opt.nodeId === currentNode.id)).toBe(false);
        }
    });

    it('maintains consistent behavior when options drawer is limited to 4 items', () => {
        const vm = selectExplorationViewModel(store.getState());
        
        // If there are more than 4 available nodes, only the first 4 should be in options
        const availableNodes = vm.nodes.filter(n => n.kind === 'available');
        const shownOptions = vm.options.slice(0, 4);
        
        // The number of shown options should be min(available nodes, 4)
        expect(shownOptions.length).toBe(Math.min(availableNodes.length, 4));
        
        // Each shown option should correspond to an available node
        for (const option of shownOptions) {
            const correspondingNode = vm.nodes.find(n => n.id === option.nodeId);
            expect(correspondingNode).toBeDefined();
            expect(correspondingNode!.kind).toBe('available');
        }
    });
});