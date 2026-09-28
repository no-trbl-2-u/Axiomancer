# Revamp — mobile app

> Part plan of [THE REVAMP](README.md). Phases **R8** (cleanup, loop),
> **B7** (Deck tab revamp, owner), **B8** (card art revamp, owner).
> Decision D60. Status: PROPOSED. Paths under `axiomancer-mobile/`.

## R8 — Mobile cleanup (loop)

Runs after R7 so the engine exports it consumes are final.

1. **Grey card art** — every grey card falls back to `circe-placeholder.jpg`
   because the 57 rows in `assets/images/cards/index.ts` key purged ids. Map
   Blow → `ice-sword`, Ward → `guard-1`, Word → `god-eye-silver`
   (placeholders; B8 replaces them) and delete the 57 dead rows. Keep the
   painting files as a pool (`provenance.json`).
2. **App label** — `app.json` `expo.name`: `axiomancer-mobile` →
   `"Miserere Mei, Deus"` (launcher label only; slug, scheme and package stay
   frozen per bearings). The painted "AxiomanceR" title wordmark goes to B8.
3. **Dead flows** —
   - Level-up Learn Card: `components/levelup/LearnCardModal.tsx` (+test),
     `app/(tabs)/character/index.tsx:75-116, 228-237`,
     `state/actions.ts:654-680` (README §6 call 4).
   - Starter bundles: `state/combat/store-actions.ts:71-165`
     (`seedStarterBundleAction`, `runArchetype`, `STARTER_BUNDLES`),
     `chosenStarterBundle` (`state/actions.ts:606`) → `ensureStarterCards`
     seeds `STARTING_CARD_IDS` directly; delete `starter-bundles.test.ts`.
   - Ally grant / goodwill: `state/presenters/cache.engine.ts:15, 49, 107-110`,
     `app/cache/index.tsx:140-141`, `state/cache/store-actions.ts:153-154`
     (goodwill leaves with fishing-village, R3).
   - Alt-win UI (R7 removes the engine side): `PerorationTrack`
     (`CombatBoard.tsx:770-790`), wrath/chain rows (`:1426-1440`), PLEA/CHARGE
     `AltWinMeter` (`CombatCombatantPane.tsx:854-860`), `deckFeedsMechanic`
     gates (`combat-encounter.engine.ts:1513-1613`), and their tests. **Keep**
     the mercy modal and `CombatFriendshipPanel` — befriend stays (D47).
   - Dev tools: merge `DebugPresetPicker` and `DebugPlayerTierPresets`
     (README §6 call 6); `learnAllCards` (`state/dev/rewards.ts:76`) and the
     CARDS button (`DebugRewardTriggers.tsx:57`) do nothing — delete.
4. **Glosses** — `state/combat/keywords.ts` and `KEYWORD_FAMILY`
   (`combat-encounter.engine.ts:2826-2834`) keep only atlas words with a live
   carrier after R2–R7 (D45); fix the "30 KEYWORDS" header.
5. **Copy** — HP → VITAE (`inventory.modal.engine.ts:180-197, 332`,
   `equipment-detail.engine.ts:114-115`); currency → shillings; Colour and
   MOMENTUM tutorial copy (`CombatTutorialPrimer.tsx:36, 51`,
   `combat-tutorial-steps.ts:83, 96, 105`, already an AUDIT row).
6. Tests on dead subjects go with them (`AltWinMeter.fe022.test.tsx`,
   the LearnCardModal and starter-bundle tests; `one-economy.engine.test.ts`
   loses its learn-card leg).

**Out of R8:** the 224 hard-coded hex colours (README §6 call 7 — B7/B8),
the Deck tab (B7).

## B7 — Deck tab UI revamp (owner)

T, 2026-09-28: leave the tab as-is now; revamp it as its own phase. Inputs:
RARE is always 0 (all cards rank 1; `rankToRarity` maps 1–2 → common); the
rarity tally is one COMMON chip, the colour tally one ANY chip, one SPELLS
group; the eyebrow wrongly says "STRIFE" (`app/(tabs)/deck/index.tsx:62`,
the combat tab's title); dead oath/hex copy (`deck.engine.ts:177-203`);
every reward offer shows "COMMON" (`CombatRewardsOverlay.tsx:80-111`); card
types are now Attack/Skill/Spell; the hazard deck is also called "deck" on
SELF (`character/index.tsx:243-254`). Consider moving the theme tokens for
the four most-repeated hex literals (`#a86bdc`, `#5bbf6a`, `#e2543b`,
`#d9b44a`) into `theme/axm.ts` here.

## B8 — Card art revamp (owner)

T, 2026-09-28: a card art revamp phase. Replaces R8's placeholder mapping,
decides art per card type, and repaints the title key-art wordmark
("AxiomanceR", `TitleScreen.tsx:7, 42`) as "Miserere Mei, Deus".
