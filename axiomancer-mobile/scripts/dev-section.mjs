// scripts/dev-section.mjs
//
// Every `/dev` section starts closed and does not mount its leaves until its
// header is tapped (`components/dev/DevToolsSections.tsx`). A journey that
// presses a Debug* button opens that button's section first. Open state is
// route-local: leaving `/dev` and coming back finds every header closed
// again, so a journey that re-enters the route must re-open its section.
// The header is tapped only when the leaf is not already showing — a blind
// tap on an already-open section would close it.

/**
 * Makes the `/dev` leaf `leafTestId`, which lives in the section `key`
 * (`dev-section-<key>`), visible, opening the section if it is closed.
 *
 * @param {import('playwright').Page} page the page, already on `/dev`.
 * @param {string} key the section key: state, player, decks, cards, world, encounters, rewards, story, run.
 * @param {string} leafTestId the testID of the control the journey presses next.
 * @param {number} [timeout] ms to wait for the header and then the leaf.
 */
export async function openDevSection(page, key, leafTestId, timeout = 15000) {
    const leaf = page.getByTestId(leafTestId).first()
    if (await leaf.isVisible().catch(() => false)) return
    const toggle = page.getByTestId(`dev-section-${key}-toggle`)
    await toggle.waitFor({ state: 'visible', timeout })
    // An open section whose lazy leaf is still loading reads aria-expanded; don't close it.
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click()
    await leaf.waitFor({ state: 'visible', timeout })
}
