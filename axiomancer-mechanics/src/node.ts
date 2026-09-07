/**
 * Node.js-specific exports for axiomancer-mechanics.
 * Import from 'axiomancer-mechanics/node' for server-side adapters.
 */

export { createNodeAdapter } from './Game/persistence/node.adapter';
export type { PersistenceAdapter } from './Game/persistence/types';
// State fixtures (2026-09-07) — Node-side file loader for JSON fixture docs.
export { resolveStateFixture, bootStateFromFixture, looksLikePath } from './CLI/fixture-boot';
