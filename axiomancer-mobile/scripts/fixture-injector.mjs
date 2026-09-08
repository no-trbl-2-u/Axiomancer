// Shared state-fixture injector for browser-driven harnesses.
// Mirrors state/fixtures.ts's global contract without importing TS into
// Node ESM scripts. Sibling of minigame-seed-injector.mjs.
//
//   import { injectStateFixture } from './fixture-injector.mjs'
//   await injectStateFixture(context, 'sage-fv-boss-gate')          // registry id
//   await injectStateFixture(context, { id: 'x', seed: 1, ... })     // inline fixture
//
// The app honours the global only when dev tools are enabled, so the
// injector also sets `__AXM_FORCE_DEV_TOOLS__` (an export build has
// `__DEV__ === false`); pass `{ forceDevTools: false }` to test the gate.

export async function injectStateFixture(context, fixture, options = {}) {
    const { forceDevTools = true } = options
    await context.addInitScript(({ fixtureValue, force }) => {
        globalThis.__AXM_FIXTURE__ = fixtureValue
        if (force) globalThis.__AXM_FORCE_DEV_TOOLS__ = true
    }, { fixtureValue: fixture, force: forceDevTools })
    return fixture
}

/** Force only the dev-tools gate (for `?fixture=` URL deep-link runs). */
export async function forceDevTools(context) {
    await context.addInitScript(() => {
        globalThis.__AXM_FORCE_DEV_TOOLS__ = true
    })
}
