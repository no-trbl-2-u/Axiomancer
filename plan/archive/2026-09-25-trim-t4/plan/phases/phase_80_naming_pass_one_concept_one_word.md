# Phase 80 — Naming pass: one concept, one word

> Promoted 2026-09-15 via `/oversight` from `plan/PHASE_CANDIDATES.md`
> (score 6.5, source row "One concept, one word — a naming pass across
> the player-facing surfaces", 2026-09-12 swarm PR #302). Brief
> generated 2026-09-15 by `/ship-a-phase` §9 — this is a cross-cutting
> copy-consistency phase, not a page-family; adapted per Phase 79's
> precedent for tooling/content-fix phases without a routes/API
> surface.

## Outcome

Five player-facing naming clusters flagged by the 2026-09-12 UI
fresh-eyes swarm (money, journal/GRACE-account, SEALED, SURGE, "the
deck") are resolved against a written lexicon rather than one at a
time. The lexicon itself now lives in
`axiomancer-mobile/docs/VISUAL_LANGUAGE.md` § "Naming: one concept, one
word" so future screens and audits have a canonical reference instead
of re-litigating each cluster from scratch.

## Why

The swarm's three-lens adversarial panel refuted every cluster
taken screen-by-screen: no single screen shows two senses of the same
word at once, so each individual finding was disposed as not a bug.
That is a fair verdict on each screen alone, and it is exactly the
argument the source candidate row makes *for* doing the pass together
against a written lexicon — cross-screen drift (the same UI element
wearing a different word on two different screens a player visits in
the same run, or two different UI elements on the *same* screen
sharing a word) is real even when no single screen is caught
red-handed. This pass re-audited all five clusters against current
`main`, confirmed which were genuine same-screen or same-run
collisions (not just cross-screen echoes the panel already
considered and accepted), and fixed those.

## What shipped

| Cluster | Finding | Fix |
|---|---|---|
| Money | Inventory screen's own header block said `WALLET` (eyebrow chrome) and `SHILLING` (money-box label) a few pixels apart — two words for the same readout on one screen, while blacksmith/rest/village all already say `PURSE`. | Inventory eyebrow → `SATCHEL · PURSE · BURDEN`; money-box label → `PURSE`. Canonical: **PURSE** is the container word everywhere; **SHILLINGS** stays the currency unit (unchanged, never competed). |
| Journal / GRACE bookkeeping | The GRACE-arrears idea had three wordings: character sheet says "THE ACCOUNT", the GRACE tooltip says "nudges the account" (2 of 3 sites), but the exploration HUD's `StatusCard` alone said "the ledger runs to arrears" — the odd one out, and it echoes the *unrelated* journal tab's "LEDGER" word. | `StatusCard.tsx` → "the account runs to arrears." Canonical: **ACCOUNT** for GRACE bookkeeping. The journal tab (`THE LEDGER`) vs. its own screen header (`THE BOOK OF DEEDS`) is a *different*, deliberate pattern — see Decisions. |
| SURGE | `CombatTutorialPrimer.tsx` was already fixed (FE-054) to say "Conviction, MOMENTUM and your dice" instead of "Surge" (the engine's internal name, not the board's on-screen chip name). Its near-duplicate twin sentence in the in-board `combat-tutorial-steps.ts` coach script was never updated and still said "Surge" — reintroducing the exact bug FE-054 closed elsewhere, on the very next screen a player sees. | `combat-tutorial-steps.ts`'s `tracks` step body → "Conviction, MOMENTUM and your dice". |
| "the deck" | Two decks exist in a run (the combat deck, built at rest/cache; the hazard deck, built during the hazard minigame) and reused *identical* phrases for both: "ADD A CARD TO YOUR DECK" on both `CombatRewardsOverlay` (combat deck) and hazard `RewardsOverlay` (hazard deck); "THIN THE DECK" on both the hazard-deck screen's CTA + its `HazardRemoveGrid` modal (hazard deck) and near-verbatim on the rest screen (combat deck). | All three hazard-side sites now say "…HAZARD DECK" explicitly (`RewardsOverlay.tsx`, `HazardRemoveGrid.tsx`, `app/hazard-deck/index.tsx`'s CTA label + a11y label). Combat-side sites keep the unqualified default sense. Canonical: **unqualified "deck" = combat deck; the hazard pool is always spelled out.** |
| SEALED | Re-confirmed three genuinely separate systems (inventory quest-item tab, locked map/labyrinth path, no-retreat combat lock) with no new same-screen collision. | No code change — documented as intentional in the lexicon so a future pass doesn't re-flag it. |

## Decisions made upfront — DO NOT ASK

- **Tab-word vs. screen-title mismatches are out of scope by design,
  not an oversight.** `SATCHEL` (tab) → `INVENTORY` (screen title) is
  an established, precedented pattern in this app (evocative
  nav word, plainer screen title); `THE LEDGER` (tab) →
  `THE BOOK OF DEEDS` (screen eyebrow) is the same pattern, already
  refuted by the swarm (C-159/160/164) on exactly that basis. Renaming
  either would be undoing a deliberate design choice, not fixing a
  bug. Recorded in the lexicon so it stops getting re-flagged.
- **SEALED's three senses stay three words.** The swarm's panel found
  they never co-occur on one screen; this pass re-checked and agrees —
  no fix, just documentation. A future screen that *does* show two
  senses together needs a local qualifier on that screen, not a
  global rename (SEALED is too load-bearing across three systems to
  retire wholesale).
- **`fleeSubtitle` in `event.engine.ts` (`'sealed · no retreat'` on
  the boss KNEEL choice) is dead code, not a naming bug.**
  `ChoiceRow` (`app/event/index.tsx`) never renders `choice.subtitle` —
  only `choice.label` and `choice.description`. Left as-is; a
  dead-field cleanup is a different phase's scope (flagged here for
  the record, not fixed, per "small and focused" — pulling on it risks
  turning a copy pass into a component refactor).
- **The written lexicon lives in `VISUAL_LANGUAGE.md`, not
  `lexicon.json`.** `lexicon.json`/`check-lexicon.mjs` is scoped to
  retired *doctrine and identifiers* enforced against `.md` prose
  surfaces (Phase 66/79) — it does not scan `.tsx`/`.ts` player-facing
  strings and its retirement model doesn't fit "prefer word A over
  word B in new UI copy" guidance. `VISUAL_LANGUAGE.md` is the
  existing home for design-system conventions a screen author reads
  before writing new copy; the naming table extends it rather than
  standing up a second, overlapping mechanism.
- **Scope held to genuine same-screen/same-run collisions.** The
  inventory sub-agent surfaced several *cross-screen-only* echoes
  (e.g. the labyrinth's "THE FOURTH LEDGER" / "Ledger of Assertions",
  the hazard card literally named "THE RED LEDGER") that never appear
  alongside the journal tab or each other in one sitting. Per the
  swarm's own standard (screen-local collision is the bar), these are
  left alone — they're proper nouns for distinct, self-contained
  mechanics, not the same UI concept wearing a second name.

## Verify gate

`npm run verify` (root, since changes touch `axiomancer-mobile` app +
state + component + test files) and `node scripts/check-lexicon.mjs`
(unaffected — no `.md` prose surfaces gained a retired-term hit; run
anyway as a repo-wide sanity check since `VISUAL_LANGUAGE.md` changed).

## DoD

- [x] Money cluster: inventory eyebrow + money-box label both read
      PURSE; `SATCHEL · WALLET · BURDEN` test expectation updated.
- [x] Journal/GRACE cluster: `StatusCard.tsx` reads "the account runs
      to arrears."
- [x] SURGE cluster: `combat-tutorial-steps.ts`'s `tracks` step matches
      `CombatTutorialPrimer.tsx`'s MOMENTUM wording.
- [x] "The deck" cluster: all three hazard-side sites say HAZARD DECK;
      `HazardRemoveGrid.test.tsx` updated to match.
- [x] Written lexicon added to `VISUAL_LANGUAGE.md`.
- [x] `npm run verify` (axiomancer-mobile) green.
- [x] `node scripts/check-lexicon.mjs` (root) clean.

## Follow-ups (out of scope)

- `event.engine.ts`'s unused `EventChoice.subtitle` field (dead code
  on at least the fight/flee choices) — a component-wiring cleanup,
  not a naming fix.
- The swarm's own un-drained candidate rows outside these five named
  clusters remain `/iterate`'s / a future `/expand` pass's territory.
