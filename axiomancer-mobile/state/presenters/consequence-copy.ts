/**
 * Shared copy for `EventConsequence` chips (Phase 46c).
 *
 * Ported out of `app/event/index.tsx` (the dead fallback shell) so
 * `/dialogue` can render the same preview without a component owning
 * player-facing copy (CLAUDE.md: no hardcoded copy in components) or
 * the two screens drifting on what a consequence kind means.
 */

import type { EventConsequence } from './event.engine';

export function consequenceLabel(c: EventConsequence): string {
    if (c.kind === 'damage') return `-${c.amount ?? 0} HP`;
    if (c.kind === 'heal') return `+${c.amount ?? 0} HP`;
    if (c.kind === 'currency') return `+${c.amount ?? 0} ${c.amount === 1 ? 'shilling' : 'shillings'}`;
    if (c.kind === 'moral') {
        const delta = c.amount ?? 0;
        return `${delta > 0 ? '+' : ''}${delta} grace`;
    }
    if (c.kind === 'item') return c.label ?? 'item';
    if (c.kind === 'flag') return c.label ?? 'flag';
    if (c.kind === 'quest-start') return `quest: ${c.label ?? ''}`;
    if (c.kind === 'quest-progress') return `progress: ${c.label ?? ''}`;
    if (c.kind === 'card-learn') return `card: ${c.label ?? ''}`;
    return '';
}
