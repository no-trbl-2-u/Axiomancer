/**
 * Combat momentum — UI-only helpers.
 *
 * Momentum is a single chain `{ color, length } | null`, advanced
 * and broken engine-native (`axiomancer-mechanics` combat.engine.ts). A BREAK
 * resets it to null and must be taught LOUDLY; a SURGE (length reached the
 * ceiling) forges a temporary gold die and also resets to null. These states
 * all read as null momentum, so the a11y sentence is driven by the transient
 * break/surge flags the presenter derives from the event log — not by the
 * null value alone.
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
        return 'Momentum BROKEN — the chain collapsed to nothing. Play the right next colour to rebuild it.';
    }
    if (m.color === null || m.length === 0) {
        return 'No momentum — play any coloured card to start the chain.';
    }
    return `Momentum ${m.length} of ${m.surgeAt} — chain on ${m.color.toUpperCase()};`
        + ` next colour ${m.next?.toUpperCase() ?? ''} to advance.`;
}
