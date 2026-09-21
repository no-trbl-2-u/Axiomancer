/**
 * Pure presenter for the tab bar visibility, labels, and fit.
 *
 * Combat is mutually exclusive with exploration — the player cannot move
 * around the world while in a fight, and there is no out-of-combat
 * "combat" screen to enter, so the bottom tab bar shows exactly one of
 * the exploration / combat pair at any time. Display strings live on
 * `TAB_TITLES` below.
 *
 * Tested in state/e2e/tabs.engine.test.ts.
 */

export type TabKey = 'exploration' | 'combat' | 'character' | 'memoir' | 'inventory' | 'deck';

export interface TabsViewModel {
    /** Tabs the user can currently see in the bottom bar, in display order. */
    visibleTabs: TabKey[];
    /** Tabs registered with the router but hidden from the bar (href: null). */
    hiddenTabs: TabKey[];
}

/**
 * Display titles for the bottom tab bar, keyed by route name.
 * Lives on the presenter so the screen has no inline string
 * literals on the navigation chrome (Hard Rule #8). Pinned by
 * `state/e2e/tabs.engine.test.ts` — Phase 30 Tick B added this
 * extraction in response to a user-observed runtime regression
 * where the tab labels rendered as `{ TAB NAME }"--index"`
 * literally (the user saw raw template-string output in place of
 * the configured titles). Pinning the strings here makes any
 * future regression visible at verify time even if the
 * `_layout.tsx` `title:` props end up bypassed.
 *
 * Phase 31 (Tabs design pass, 2026-05-16) flipped the four
 * strings from the mixed-register pre-fix set
 * (`MAP · COMBAT · SHEET · SACK` — three places + one
 * event-state) to the coherent all-places register the user
 * picked via `/oversight`: `WILDS · STRIFE · SELF · SACK`.
 *
 * Phase 33 (MEMOIR tab, 2026-05-16) added the journal surface
 * as a fifth route. Display order in the bottom bar:
 * exploration/combat → character → memoir → inventory.
 *
 * Phase 32 (Claude Design handoff port, 2026-05-16) renamed the
 * fourth slot from `SACK` to `SATCHEL` — the design canvas
 * decisions doc §V calls SACK out as register-mismatched ("SACK
 * is bag-shaped slang"; SATCHEL preserves the period serif
 * voice). Inventory section header (`inventory.engine.ts`)
 * tracks the same rename so all places sit in one register.
 *
 * DECK (2026-09-21, owner finding 7 / ratified decision D2) is the
 * fifth VISIBLE tab: the player had no way to see the combat deck
 * they carry. It is appended LAST rather than slotted beside SELF so
 * that no existing tab changes position — four tabs' worth of muscle
 * memory survives the addition — and because DECK and SATCHEL are the
 * two "what you carry" surfaces, which reads better adjacent than
 * split by THE LEDGER. `DECK` is a thing, not a place, so it sits
 * slightly outside the all-places register; the alternative in that
 * register ("THE HAND", "THE CANON") would collide with the combat
 * hand and the Apocrypha canon respectively, both live terms.
 */
export const TAB_TITLES: Record<TabKey, string> = {
    exploration: 'WILDS',
    combat: 'STRIFE',
    character: 'SELF',
    memoir: 'THE LEDGER',
    inventory: 'SATCHEL',
    deck: 'DECK',
};

const ALWAYS_VISIBLE: TabKey[] = ['character', 'memoir', 'inventory', 'deck'];

export function selectVisibleTabs(inCombat: boolean): TabsViewModel {
    const positional: TabKey = inCombat ? 'combat' : 'exploration';
    const hidden: TabKey = inCombat ? 'exploration' : 'combat';

    return {
        visibleTabs: [positional, ...ALWAYS_VISIBLE],
        hiddenTabs: [hidden],
    };
}

export function isTabHidden(inCombat: boolean, tab: TabKey): boolean {
    return selectVisibleTabs(inCombat).hiddenTabs.includes(tab);
}

// ---------------------------------------------------------------------------
// Tab-bar FIT — the overflow contract the fifth tab has to clear
// ---------------------------------------------------------------------------

/**
 * Per-glyph advance widths, in em, of the app's sans face
 * (`FONTS.sans` = Bebas Neue 400, `assets/fonts/BebasNeue_400Regular.ttf`).
 *
 * MEASURED, not estimated: read straight out of the shipped `.ttf`'s
 * `hmtx`/`head` tables (unitsPerEm 1000) on 2026-09-21, covering exactly the
 * characters the tab titles use — space plus A-Z. Bebas Neue is a condensed
 * display face, so a generic 0.6em-per-character rule of thumb overstates its
 * labels by ~50% and would have failed a fit that in fact passes comfortably.
 *
 * Numbers rather than a guess because the fifth tab makes this a real
 * constraint: five tabs across a 360pt phone leave 72pt each, and the tab item
 * truncates with an ellipsis rather than pushing the bar wider
 * (`@react-navigation/elements`' `Label` hardcodes `numberOfLines: 1`), so an
 * overflow is silent — a clipped word, not a broken layout.
 */
const SANS_ADVANCE_EM: Readonly<Record<string, number>> = Object.freeze({
    ' ': 0.16,
    A: 0.401, B: 0.404, C: 0.383, D: 0.406, E: 0.363, F: 0.344, G: 0.391,
    H: 0.42, I: 0.192, J: 0.265, K: 0.414, L: 0.344, M: 0.538, N: 0.427,
    O: 0.4, P: 0.386, Q: 0.4, R: 0.403, S: 0.372, T: 0.364, U: 0.402,
    V: 0.382, W: 0.557, X: 0.406, Y: 0.394, Z: 0.362,
});

/** Widest measured glyph (`W`), used for any character outside the table so an
 *  unmeasured title is over-estimated rather than waved through. */
const SANS_ADVANCE_EM_FALLBACK = 0.557;

/** Tab label type size. `_layout.tsx` styles the label from this constant, so
 *  the fit contract below measures what the bar actually renders. */
export const TAB_BAR_LABEL_FONT_SIZE = 10;

/**
 * Tab label letter-spacing. Dropped from 2 to 1 when DECK made the bar five
 * tabs wide (2026-09-21): at spacing 2, THE LEDGER measures 55.8pt against a
 * 62pt budget at 360pt — it fits, but the same label overflows a 320pt phone
 * (iPhone SE), where the budget is 54pt. Spacing 1 measures 45.8pt and clears
 * both with room to spare. The tracked, all-caps register survives; only the
 * amount of air between letters changes.
 */
export const TAB_BAR_LABEL_LETTER_SPACING = 1;

/**
 * Horizontal padding `@react-navigation/bottom-tabs` puts inside each tab item
 * (`styles.tabVerticalUiKit`: `padding: 5`), per side. Not ours to set, so it
 * is subtracted from the label budget rather than styled away.
 */
export const TAB_ITEM_HORIZONTAL_PADDING = 5;

/** The narrow-phone width the bar is contracted to fit (the brief's bar). */
export const NARROW_VIEWPORT_PT = 360;

/** The narrowest phone still in the support range — SE-class, checked too. */
export const NARROWEST_VIEWPORT_PT = 320;

/**
 * Rendered width of one tab label, in points.
 *
 * Letter-spacing is charged for EVERY character including the last, which is
 * how React Native's `letterSpacing` behaves on both platforms and is in any
 * case the conservative reading — an over-estimate here can only make the fit
 * check stricter than reality.
 */
export function measureTabLabel(
    title: string,
    fontSize: number = TAB_BAR_LABEL_FONT_SIZE,
    letterSpacing: number = TAB_BAR_LABEL_LETTER_SPACING,
): number {
    let em = 0;
    for (const ch of title) {
        em += SANS_ADVANCE_EM[ch] ?? SANS_ADVANCE_EM_FALLBACK;
    }
    return em * fontSize + title.length * letterSpacing;
}

/** What a tab bar of `titles` does at `viewportPt` wide. */
export interface TabBarFit {
    /** Viewport width the check was run at. */
    viewportPt: number;
    /** How many tabs share it. */
    tabCount: number;
    /** Width of one tab item (the bar divides evenly — every item is flex: 1). */
    perTabPt: number;
    /** Width left for the label once the navigator's own padding is removed. */
    labelBudgetPt: number;
    /** The title that comes closest to overflowing. */
    widestTitle: string;
    /** That title's rendered width. */
    widestLabelPt: number;
    /** Points of headroom on the widest title; negative means it is clipped. */
    slackPt: number;
    /** True when every label renders whole. */
    fits: boolean;
}

/**
 * Does a bar of these labels render without clipping at this width?
 *
 * Pure arithmetic over measured font metrics — no layout engine, no device.
 * It cannot prove a pixel-perfect result, but it catches the failure this
 * change actually risks (one more tab, the same longest word) and it fails
 * LOUDLY in `state/e2e/tabs.engine.test.ts` if a future title, type size, or
 * sixth tab eats the headroom.
 */
export function measureTabBarFit(
    titles: readonly string[],
    viewportPt: number = NARROW_VIEWPORT_PT,
): TabBarFit {
    const tabCount = Math.max(1, titles.length);
    const perTabPt = viewportPt / tabCount;
    const labelBudgetPt = perTabPt - TAB_ITEM_HORIZONTAL_PADDING * 2;

    let widestTitle = '';
    let widestLabelPt = 0;
    for (const title of titles) {
        const width = measureTabLabel(title);
        if (width > widestLabelPt) {
            widestLabelPt = width;
            widestTitle = title;
        }
    }

    return {
        viewportPt,
        tabCount,
        perTabPt,
        labelBudgetPt,
        widestTitle,
        widestLabelPt,
        slackPt: labelBudgetPt - widestLabelPt,
        fits: widestLabelPt <= labelBudgetPt,
    };
}

/** The titles actually on the bar in a given mode — the fit check's input. */
export function visibleTabTitles(inCombat: boolean): string[] {
    return selectVisibleTabs(inCombat).visibleTabs.map((tab) => TAB_TITLES[tab]);
}
