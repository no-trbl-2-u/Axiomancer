import React from 'react';
import { ExplorationNode } from './ExplorationNode';
import type { ExplorationNode as ExplorationNodeType } from '@/state/presenters/exploration.engine';

interface NodeGridProps {
    nodes: readonly ExplorationNodeType[];
    onNodePress: (node: ExplorationNodeType) => void;
    /** The node the player has tapped but not yet confirmed (or null). */
    selectedNodeId: string | null;
}

export function NodeGrid({ nodes, onNodePress, selectedNodeId }: NodeGridProps) {
    return (
        <>
            {/* Node markers */}
            {nodes.map((n) => (
                <ExplorationNode
                    key={n.id}
                    node={n}
                    onNodePress={onNodePress}
                    isSelected={n.id === selectedNodeId}
                />
            ))}
        </>
    );
}