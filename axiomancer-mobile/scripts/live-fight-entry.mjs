// Shared entry into a live fight for browser-driven harnesses.
//
//   import { enterLiveFight } from './live-fight-entry.mjs'
//   await enterLiveFight(page, baseUrl, { seed: 16 })            // standard foe
//   await enterLiveFight(page, baseUrl, { seed: 16, kind: 'boss' })
//
// Boots the app on /character, opens /dev through the SELF tab's link, and
// presses `debug-trigger-encounter-<kind>`. `<CombatGate>` engages the fight
// and pushes `/combat-encounter`; this resolves once that route shows the
// combat reveal. The seed pins the engine through `__AXM_COMBAT_SEED__`,
// which the route honours in dev builds only, so the helper also sets the
// documented dev-tools opt-in (`__AXM_FORCE_DEV_TOOLS__`, lib/buildProfile.ts)
// that a static web export needs.
//
// Replaces the pre-v1 `/combat-encounter` dev sandbox (mock foe, demo deck),
// which tools used to cold-load directly; it was deleted in phase CR1a.

import { openAllDevSections } from './dev-sections.mjs'

/**
 * @param {import('playwright').Page} page
 * @param {string} baseUrl the static server's origin.
 * @param {{ seed?: number, kind?: string, timeout?: number }} [options]
 */
export async function enterLiveFight(page, baseUrl, options = {}) {
    const { seed, kind = 'encounter', timeout = 25000 } = options
    await page.addInitScript((s) => {
        globalThis.__AXM_FORCE_DEV_TOOLS__ = true
        if (typeof s === 'number') globalThis.__AXM_COMBAT_SEED__ = s
    }, seed ?? null)
    await page.goto(`${baseUrl}/character`, { waitUntil: 'networkidle' })
    const link = page.getByTestId('self-dev-tools-link')
    await link.waitFor({ state: 'visible', timeout })
    await link.click()
    await page.waitForURL((url) => url.pathname.endsWith('/dev'), { timeout })
    await openAllDevSections(page, timeout)
    const trigger = page.getByTestId(`debug-trigger-encounter-${kind}`)
    await trigger.waitFor({ state: 'visible', timeout })
    await trigger.click({ force: true })
    await page.waitForURL((url) => url.pathname.endsWith('/combat-encounter'), { timeout })
    await page.getByTestId('combat-reveal').waitFor({ state: 'visible', timeout })
}
