/**
 * Combat momentum — UI-only helpers.
 *
 * Spec 33 §3: momentum is a single chain `{ color, length } | null`, advanced
 * and broken engine-native (`axiomancer-mechanics` combat.engine.ts). A BREAK
 * resets it to null and must be taught LOUDLY; a SURGE (length reached the
 * ceiling) forges a temporary gold die and also resets to null. These states
 * all read as null momentum, so the a11y sentence is driven by the transient
 * break/surge flags the presenter derives from the event log — not by the
 * null value alone. (The three-node Phase 31 wheel and its helpers were
 * deleted with the Upgradeable-Dice flag collapse, D7.)
 */

export type WheelStance = 'heart' | 'body' | 'mind';

/** The a11y sentence for the Momentum-V2 chain chip. */
export function momentumV2A11y(m: {
    color: WheelStance | null;
    length: number;
    next: WheelStance | null;
    surgeAt: number;
    broke: boolean;
    surged: boolean;
}): string {
    if (m.surged) {
        return 'Momentum SURGED — a wild momentum die waits in your tray; the chain resets.';
    }
    if (m.broke) {
        return 'Momentum BROKEN — the chain collapsed to nothing. Play the right next stance to rebuild it.';
    }
    if (m.color === null || m.length === 0) {
        return 'No momentum — play any stance to start the chain.';
    }
    return `Momentum ${m.length} of ${m.surgeAt} — chain on ${m.color.toUpperCase()};`
        + ` next stance ${m.next?.toUpperCase() ?? ''} to advance.`;
}
