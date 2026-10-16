// scripts/dev-section.mjs
//
// Every `/dev` section starts closed and does not mount its leaves until its
// header is tapped (`components/dev/DevToolsSections.tsx`). A journey that
// presses a Debug* button opens that button's section first. The open set
// outlives the route for the life of the page, so the header is tapped only
// when the leaf is not already showing; a blind tap would close the section.

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
