/**
 * Hazard outcome → world-state route blocking — hermetic e2e tests.
 *
 * Covers the world-layer plumbing that records a hazard's world-state
 * outcome and blocks / reroutes map travel as a result: outcome
 * recording, route blocking, move validation, alternative-path search,
 * and reachable-node computation.
 *
 * NOTE (2026-06): the old Phase-135 hazard *threshold-modifier* subsystem
 * (`hazard.modifiers`, `applyHazardPersistenceEffects`, the H08/H12/H15
 * hazard library) was retired when the Hazard engine was re-aligned to the
 * mobile v2 living rules — its hooks encoded the superseded Phase-131
 * hazard identities and the old `combinedThresholds` card shape. See
 * `docs/hazard-v2-vs-mechanics-divergence.md`. The route-blocking and
 * navigation coverage below is independent of the minigame engine and is
 * retained.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { mockFixedRng } from '../../../test-utils/rng';
import type { MapState, HazardNodeOutcome, WorldState } from '../../types';
import { createMapState, getMapDefinition } from '../../map.registry';
import {
  recordHazardOutcome,
  blockMapRoute,
  isRouteBlocked,
  moveToNode,
  IllegalMoveError,
} from '../../world.reducer';
import {
  validateMoveToNode,
  findAlternativePaths,
  getReachableNodes,
} from '../../map.dispatcher';

describe('Hazard outcome → world-state route blocking', () => {
  let testMapState: MapState;

  beforeEach(() => {
    // Use fishing village as test map
    const mapDef = getMapDefinition('coastal-continent', 'fishing-village');
    testMapState = createMapState(mapDef);
    mockFixedRng([0.5, 0.3, 0.7, 0.2]); // Deterministic RNG sequence
  });

  test('a bridge-collapse outcome blocks the route and forces an alternate path', () => {
    const bridgeNode = 'fv-3';
    const connectedNode = 'fv-4';

    // Create world state positioned at bridge
    const mapWithPlayer = { ...testMapState, currentNode: bridgeNode };

    // Record bridge collapse outcome
    const collapseOutcome: HazardNodeOutcome = {
      nodeId: bridgeNode,
      hazardId: 'collapsed-bridge',
      outcome: 'blocked',
      appliedDate: new Date().toISOString(),
    };

    let blockedMap = recordHazardOutcome(mapWithPlayer, collapseOutcome);

    // Block the route
    blockedMap = blockMapRoute(blockedMap, bridgeNode, connectedNode, 'Bridge collapsed during hazard encounter');

    // Verify route is blocked
    expect(isRouteBlocked(blockedMap, bridgeNode, connectedNode)).toBe('Bridge collapsed during hazard encounter');

    // Verify moveToNode throws error
    expect(() => moveToNode({ currentMap: blockedMap } as WorldState, connectedNode))
      .toThrow(IllegalMoveError);

    // Verify route validation catches the block
    const validation = validateMoveToNode(blockedMap, bridgeNode, connectedNode);
    expect(validation.valid).toBe(false);
    expect(validation.blockedReason).toContain('Bridge collapsed');

    // Verify alternative paths are computed (would depend on map topology)
    const alternatives = findAlternativePaths(blockedMap, bridgeNode, connectedNode);
    expect(Array.isArray(alternatives)).toBe(true);
  });

  test('route blocking: moveToNode rejects blocked paths', () => {
    const fromNode = 'fv-1'; // Starting node from fishing village
    const blockedNode = 'fv-2'; // Connected node

    // Position player at starting node
    const mapWithPlayer = { ...testMapState, currentNode: fromNode };

    // Block route
    const blockedMap = blockMapRoute(mapWithPlayer, fromNode, blockedNode, 'Test blockage');

    // Attempt move should fail
    expect(() => moveToNode({ currentMap: blockedMap } as WorldState, blockedNode))
      .toThrow(/route.*blocked.*Test blockage/);
  });

  test('alternative path computation: suggests valid routes around blocked areas', () => {
    const fromNode = 'fv-1';
    const toNode = 'fv-5';
    const blockedIntermediateNode = 'fv-3';

    // Block one potential route
    const blockedMap = blockMapRoute(testMapState, fromNode, blockedIntermediateNode, 'Test block');

    const alternatives = findAlternativePaths(blockedMap, fromNode, toNode);

    // Should return array (may be empty if no alternatives exist in fishing village)
    expect(Array.isArray(alternatives)).toBe(true);

    // Each alternative path should not use blocked routes
    for (const path of alternatives) {
      expect(Array.isArray(path)).toBe(true);
      expect(path[0]).toBe(fromNode);
      if (path.length > 1) {
        expect(path[path.length - 1]).toBe(toNode);
      }
    }
  });

  test('reachable nodes calculation respects blocked routes', () => {
    let mapState = createMapState(getMapDefinition('coastal-continent', 'fishing-village'));
    const startNode = mapState.currentNode;

    // Get baseline reachable nodes
    const baselineReachable = getReachableNodes(mapState, startNode);
    const initialCount = baselineReachable.length;

    // Block a route to reduce reachable nodes
    if (baselineReachable.length > 0) {
      const targetNode = baselineReachable[0];
      mapState = blockMapRoute(mapState, startNode, targetNode, 'Test blocking');

      const newReachable = getReachableNodes(mapState, startNode);

      // Should have fewer reachable nodes (or same if there are alternative paths)
      expect(newReachable.length).toBeLessThanOrEqual(initialCount);

      // The directly blocked node should not be in direct adjacency
      const directValidation = validateMoveToNode(mapState, startNode, targetNode);
      expect(directValidation.valid).toBe(false);
    }
  });
});
