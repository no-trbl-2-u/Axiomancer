/**
 * Consumer hook for the tap-tooltip system (Phase 74 Tick A).
 *
 * Thin wrapper around `useTooltipContext()` so call sites read
 * `const tooltip = useTooltip(); tooltip.show({ ... });` without
 * having to import the context directly.
 *
 * Calling `show` outside the provider is a no-op (per the
 * NOOP_CONTEXT pattern in `TooltipProvider`); keeps tests that
 * don't mount the provider hermetic.
 */

import { useTooltipContext } from '@/components/tooltip/TooltipProvider';

export function useTooltip() {
    return useTooltipContext();
}
