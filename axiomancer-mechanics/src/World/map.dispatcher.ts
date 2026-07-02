/**
 * Map Dispatcher (Phase 135)
 * 
 * Route validation with blocking state and alternative path computation.
 * Integrates with moveToNode validation for hazard persistence effects.
 */

import { MapState, NodeId } from './types';
import { getMapDefinition } from './map.registry';

/**
 * Result of validating a move between two nodes, including alternative
 * path suggestions when the direct route is blocked.
 */
export interface RouteValidationResult {
    valid: boolean;
    blockedReason?: string;
    alternativePaths?: NodeId[][];
}

/**
 * Validates a proposed move between two nodes, checking for blocked routes
 * due to hazard outcomes. Provides alternative path suggestions when blocked.
 */
export function validateMoveToNode(
    mapState: MapState, 
    fromNode: NodeId, 
    toNode: NodeId
): RouteValidationResult {
    // Check if route is blocked by hazard outcomes
    const blockedRoute = mapState.blockedRoutes.find(
        route => (route.from === fromNode && route.to === toNode) ||
                 (route.from === toNode && route.to === fromNode)
    );

    if (blockedRoute) {
        // Route is blocked - compute alternative paths
        const alternatives = findAlternativePaths(mapState, fromNode, toNode);
        return {
            valid: false,
            blockedReason: blockedRoute.reason,
            alternativePaths: alternatives
        };
    }

    return { valid: true };
}

/**
 * Finds alternative paths from source to destination using breadth-first
 * search while avoiding blocked routes. Returns multiple path options
 * sorted by length (shortest first).
 */
export function findAlternativePaths(
    mapState: MapState, 
    fromNode: NodeId, 
    toNode: NodeId,
    maxPaths: number = 3
): NodeId[][] {
    const mapDef = getMapDefinition(mapState.continent, mapState.name);
    
    // Build adjacency map from map definition
    const adjacency = new Map<NodeId, NodeId[]>();
    for (const node of mapDef.nodes) {
        adjacency.set(node.id, [...node.connectedNodes]);
    }

    // Remove blocked routes from adjacency
    for (const blockedRoute of mapState.blockedRoutes) {
        const fromAdj = adjacency.get(blockedRoute.from);
        if (fromAdj) {
            const index = fromAdj.indexOf(blockedRoute.to);
            if (index >= 0) fromAdj.splice(index, 1);
        }
        const toAdj = adjacency.get(blockedRoute.to);
        if (toAdj) {
            const index = toAdj.indexOf(blockedRoute.from);
            if (index >= 0) toAdj.splice(index, 1);
        }
    }

    // Breadth-first search for shortest paths
    const queue: { node: NodeId; path: NodeId[] }[] = [{ node: fromNode, path: [fromNode] }];
    const visited = new Set<NodeId>();
    const foundPaths: NodeId[][] = [];

    while (queue.length > 0 && foundPaths.length < maxPaths) {
        const current = queue.shift()!;
        
        if (current.node === toNode) {
            foundPaths.push(current.path);
            continue;
        }

        if (visited.has(current.node)) continue;
        visited.add(current.node);

        const neighbors = adjacency.get(current.node) || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor) && !current.path.includes(neighbor)) {
                queue.push({
                    node: neighbor,
                    path: [...current.path, neighbor]
                });
            }
        }
    }

    // Sort by path length and return
    return foundPaths.sort((a, b) => a.length - b.length);
}

/**
 * Checks if any routes from a node are blocked, useful for UI indicators
 * showing which directions are unavailable due to hazard outcomes.
 */
export function getBlockedRoutesFromNode(mapState: MapState, nodeId: NodeId): Array<{to: NodeId, reason: string}> {
    return mapState.blockedRoutes
        .filter(route => route.from === nodeId || route.to === nodeId)
        .map(route => ({
            to: route.from === nodeId ? route.to : route.from,
            reason: route.reason
        }));
}

/**
 * Computes all reachable nodes from a given starting point, accounting
 * for blocked routes. Used for determining valid movement options.
 */
export function getReachableNodes(mapState: MapState, fromNode: NodeId): NodeId[] {
    const mapDef = getMapDefinition(mapState.continent, mapState.name);
    const reachable = new Set<NodeId>();
    const queue = [fromNode];
    const visited = new Set<NodeId>();

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        
        visited.add(current);
        reachable.add(current);

        // Find neighbors from map definition
        const currentNode = mapDef.nodes.find(n => n.id === current);
        if (!currentNode) continue;

        for (const neighbor of currentNode.connectedNodes) {
            // Check if route to neighbor is blocked
            const isBlocked = mapState.blockedRoutes.some(
                route => (route.from === current && route.to === neighbor) ||
                         (route.from === neighbor && route.to === current)
            );
            
            if (!isBlocked && !visited.has(neighbor)) {
                queue.push(neighbor);
            }
        }
    }

    reachable.delete(fromNode); // Remove starting node from results
    return Array.from(reachable);
}