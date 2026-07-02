/**
 * Event codex presenter — Phase 50 tick C.
 *
 * Pure helpers consumed by `components/event/EncounterModalOverlay.tsx`
 * (and, later, the paced-event shell) when `useAesthetic()` returns
 * `'codex'`. Composes the mono header strip that the design source
 * places at the top of the codex event variant.
 *
 * Design source: `design/handoff-2026-05-16/project/app.jsx`
 * `function EventCodex` — the `EVENT/<KIND> · <hex-id>` /
 * `NODE/<id>` strip across the top of the modal.
 *
 * Mobile doesn't have the synthetic hex/node IDs the design source
 * showed; we render only what the VM actually carries (variant +
 * kind), so the line stays honest rather than decorative.
 */

import type { EventViewModel } from './event.engine';

export interface EventCodexHeader {
    /** Left-aligned token, e.g. `EVENT/ENCOUNTER`. */
    left: string;
    /** Right-aligned token, e.g. `KIND/COMBAT.PRELUDE`. */
    right: string;
}

/** Uppercase + replace any hyphens with dots for the codex mono register. */
function toCodexToken(value: string): string {
    return value.toUpperCase().replace(/-/g, '.');
}

/**
 * Compose the codex header tokens. Left side reads `EVENT/<variant>`;
 * right side reads `KIND/<event-kind>`. Both uppercase, hyphens
 * normalized to dots (matches the design source's mono register).
 */
export function selectEventCodexHeader(vm: EventViewModel): EventCodexHeader {
    return {
        left: `EVENT/${toCodexToken(vm.variant)}`,
        right: `KIND/${toCodexToken(vm.kind)}`,
    };
}
