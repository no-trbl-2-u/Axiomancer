// scripts/dev-sections.mjs
//
// The `/dev` screen's sections start closed (components/dev/DevToolsSections.tsx)
// and a closed section mounts none of its Debug* leaves. Harnesses that reach
// `/dev` call this before querying a `debug-*` testID: it opens every section
// still closed. Sections remembered open from an earlier visit are left alone.

/**
 * @param {import('playwright').Page} page
 * @param {number} [timeout]
 */
export async function openAllDevSections(page, timeout = 15000) {
    await page.getByTestId('dev-tools-sections').waitFor({ state: 'visible', timeout })
    // Re-query each pass: opening one changes which toggles still match.
    const closed = page.locator('[data-testid^="dev-section-"][data-testid$="-toggle"][aria-expanded="false"]')
    for (let guard = 0; guard < 32 && (await closed.count()) > 0; guard++) {
        await closed.first().click()
    }
}
