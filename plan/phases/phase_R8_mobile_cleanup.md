# Phase R8 — Mobile cleanup

## Sources

- Part plan: [`plan/revamp/mobile.md`](../revamp/mobile.md) (R8).
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D45** (carrier rule), **D47** (befriend stays), **D50**
  (delete; git is the archive), **D58** (nothing is authored), **D62** (the
  dev menu changes only where a deletion forces it), **D63** (no learn-card
  leg on level-up), **D65** (card colour, dice colour, the Color Law and the
  momentum chain stay).
- Canonical sibling: R7d2 (stance residue and the carrier sweep, a mobile-heavy
  cleanup of dead copy and VM fields).

## Reality check (2026-10-01)

The part plan was written on 2026-09-28. R2–R7e2 have since landed part of it:

- **Alt-win UI** (`PerorationTrack`, wrath/chain rows, `AltWinMeter`,
  `deckFeedsMechanic`): already gone with R7. Nothing to do.
- **Ally grant / goodwill** in the cache presenter and screen: already gone
  with R3. Nothing to do.
- **HP → VITAE**: the inventory and equipment presenters already print VITAE.
  **Currency**: player copy already says shillings. Nothing to do.
- **Glosses**: `KEYWORD_GLOSS` already holds only live words. Left: the stale
  "30 KEYWORDS" header and the `KEYWORD_FAMILY` table, which still lists
  twelve deleted words.

## Outcome

The three grey cards show real paintings instead of the fallback; the launcher
reads "Miserere Mei, Deus"; levelling up no longer offers a card to learn; the
starter-bundle machinery is gone and a new player is seeded the grey office
directly; the face colour table and the tutorial copy name only live words.

## Scope

1. **Grey card art.** `assets/images/cards/index.ts`: map `grey-strike`
   (A Plain Blow) → `ice-sword`, `grey-ward` → `guard-1`, `grey-word` →
   `god-eye-silver`; delete the 57 dead rows and the requires they leave
   unused. The painting files stay as a pool. Header comment rewritten to the
   three-row truth (placeholders until B8).
2. **App label.** `app.json` `expo.name` → `"Miserere Mei, Deus"`. Slug,
   scheme and package stay.
3. **Learn Card.** Delete `components/levelup/LearnCardModal.tsx` and its
   test; the character screen's learn-pick state, handlers and modal mount;
   `getLearnableCardOffers`, `learnCard`, `LearnableCardOffer` and their
   helpers in `state/actions.ts`; the learn-card leg of
   `one-economy.engine.test.ts`. LEVEL UP opens the stat ledger only.
4. **Starter bundles.** Delete `StarterBundle`, `StarterArchetype`,
   `STARTER_BUNDLES`, `starterBundleById`, `NEW_PLAYER_STARTER_BUNDLE_ID`,
   `chosenStarterBundle`, `runArchetype`, `seedStarterBundleAction` and
   `BUNDLE_CHOSEN_FLAG` from `state/combat/store-actions.ts`, and
   `starter-bundles.test.ts`. `ensureStarterCards` seeds `STARTING_CARD_IDS`
   when the player knows no card, and writes no flag. The dev flag list loses
   its BUNDLE PICKED row (the deletion forces it, D62).
5. **Glosses.** `KEYWORD_FAMILY` keeps DEAL, GUARD, HEAL, BLEED and
   VULNERABLE. The `keywords.ts` header states the live registry instead of
   "30 KEYWORDS".
6. **Tutorial copy.** The primer and the first-combat steps stop naming
   MOMENTUM (no grey card can feed the chain) and POISON (deleted in R4).
   The colour-match lines stay (D65).

## Carrier sweep (D45)

Any glossary, copy or test row left naming the learn-card flow or a starter
bundle goes, mobile workspace.

## Decisions made upfront — DO NOT ASK

- **No save migration.** The `starter-bundle-chosen`, `bundle:*` and
  `archetype:*` flags are inert strings in `flags`; nothing reads them after
  this phase. Removing them from saves buys nothing and costs a hop.
- **The momentum chip and its info popup stay** (D65). Only the tutorial
  stops teaching a system a grey deck cannot reach (AUDIT row 2026-09-27).
- **KEYWORD_FAMILY keeps HEAL and BLEED**: both still have glosses and live
  carriers (the healing potions, a map hazard).

## Tests matrix

- Deleted with their subjects: `LearnCardModal.test.tsx`,
  `starter-bundles.test.ts`, the learn-card leg of `one-economy`.
- Updated: any suite pinned to the primer or tutorial copy, the card-art
  registry and the app label.
- Added: a card-art test that each starting card resolves to a painting, not
  the fallback; a new-player seeding test that `ensureStarterCards` writes
  `STARTING_CARD_IDS`.

## Verify gate

`npm run verify` (both workspaces), root `npm test`, `npm run lint:content`,
`node scripts/check-lexicon.mjs`.

## DoD

- The grey cards render paintings; the card-art map has three rows.
- No learn-card or starter-bundle symbol is left in live code.
- `KEYWORD_FAMILY` and the tutorial copy name only live words.
- Gates green; R8 ticked.

## Follow-ups (out of scope)

- Hard-coded hex colours: R10.
- The momentum info popup's v1 wheel copy (AUDIT): with the chain's next
  owner, when coloured cards return.
- The Deck tab (B7), card art and the title wordmark (B8), the dev menu (B10).
