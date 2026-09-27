# The card purge (D36) — phase brief

> T, attended session 2026-09-26. Build-plan row **Phase P1**, after
> **Phase S3** (the D4 stat hooks and card damage scaling). Decisions:
> `plan/2026-09-25-refactor-strategy.decisions.md` D36–D38. Do not re-ask
> any of the scope below; it was put to T as a ballot.

## 1. What T ruled

T, near-verbatim: *"Once all the other parts of the revamp are over, I want
to purge all the cards and all the combat related keywords except for the
grey strike and grey guard cards and keyword. Then work can continue, but no
card generation unless it's a guided session with me."*

Ballot answers, the same day:

| Question | Answer |
|---|---|
| When, and after what | **After step 3** (S3, the stat-scaling hook), not before it |
| Enemy side | **Player cards only.** Enemy keywords, enemy decks, enemy abilities and the statuses enemies apply (Bleed and so on) stay; all 78 enemies still fight |
| Other card-shaped content | **Purge all three:** the 5 curse cards, the relic-granted cards (`relics.cards.ts`) and the apocrypha set |
| What the player starts with and finds | **The grey starter only.** Every run deals the 10-card grey deck (`grey-strike` ×7, `grey-ward` ×3). The 10 presets go, and with them the 5/5/5 aspect thirds. Card rewards and cache card offers are off until a guided session adds cards |

> **Amended 2026-09-27 (D39–D42).** A third grey card survives: the grey
> office's VULNERABLE card (D42), so the player keywords that survive are
> DEAL, GUARD and VULNERABLE. S3 (the stat model) and T6 (alignment and
> GRACE removed; `philosophicalAspect` renamed) ship before this.

## 2. What survives

- **Cards:** `grey-strike` (A Plain Blow: FREE 2 damage, PAID DEAL 5) and
  `grey-ward` (A Plain Ward: FREE 2 guard, PAID GUARD 5). Both are in
  `src/Cards/library/starters.cards.ts`, theme `grey` (Phase 104).
- **Player keywords:** DEAL and GUARD, the two the grey cards print. Every
  other player-card keyword leaves the atlas (`docs/keyword-atlas.md`), the
  gloss table and the card-face surfaces. An engine mechanic that enemies
  still use stays in the engine; only its player-card keyword entry goes.
- **The engine** (combat, dice, reads, VITAE, the S3 stat hooks) is
  untouched except where it only existed to serve a purged card.
- **Doctrine that stays:** every card has a FREE line; one tray roll per
  threat phase.

## 3. What goes

- Every other player card: the six archetype libraries (rot, vigil, grave,
  trial, choir, debt), the apocrypha set, the relic-granted cards, and the
  5 curses. That's 132 of the 134 cards in the 2026-09-26 tree.
- The 10 starter presets and the preset picker. `combat.starter-deck-presets.ts`
  shrinks to the grey deck, and the 5/5/5 thirds constraint is repealed.
  Update `axiomancer-mechanics/CLAUDE.md` pillar 2 and its test
  `Combat/e2e/deck-presets.engine.test.ts` in the same PR, citing D36.
- Card rewards after fights, and the "take a card" cache offer. The offer
  paths stay in code but are gated off with no pool to draw from; don't
  delete the reward machinery a guided session will refill.
- Enemy curse injection: enemies that add curses to your deck keep their
  other abilities; the curse-adding step goes.
- Relics keep their non-card effects (for example the armour relics'
  +5 max VITAE); only the granted card goes.

## 4. How to ship it

1. **Inventory first, in the PR body.** On the 2026-09-26 tree, about 36
   runtime files and about 64 test files read the card library; curse
   injection appears on about 45 lines. Grep for `cardLibrary`,
   `getCardById`, card ids, `CURSE_CARDS`, the preset table, and the
   keyword gloss. List every surface you'll touch: engine, mobile (deck,
   codex, card faces, reward and cache screens), the card editor, the
   DevLog catalog export, the sims and CLI.
2. **Delete, don't archive, the card literals.** They are source, not
   markdown, and git history keeps them. Markdown docs that describe purged
   cards archive into `plan/archive/` (hard rule 4, D6).
3. **Tests:** a test pinned to a purged card is rewritten to the grey
   cards or deleted with its subject. Never weaken a test to keep a purged
   card alive. The narrative-reachability guard and the pricing tests will
   need attention; D1 named exactly that coupling.
4. **Baselines:** the deck matrix measures presets that no longer exist.
   Re-shape `baseline:regen` to the grey deck and re-stamp, and say plainly
   in the PR that the matrix moved and why.
5. **Gates:** mechanics `verify`, mobile `verify`, card-editor `verify`,
   root `npm test`, `lint:content`, the e2e journeys (the map walk takes a
   card at `bw-5`; switch it to the cache's other offer).
6. It can be more than one PR if the diff is unreviewable: engine and
   content first, then mobile and editor. Keep main green between them.

> **Amended 2026-09-27 (D44).** Card rewards and the cache's card offer
> stay ON: the grey office (Blow, Ward, Word) becomes the reward pool, in
> place of the gate-off in §3. The fresh-run deck is Blow 5 / Ward 3 / Word 2
> (D43).

## 5. After the purge (D37)

- **No card generation outside a guided session with T.** No steward,
  `/forge`, `/expand` or phase creates a player card or a player keyword.
  New cards arrive only in an attended session T runs.
- `adjust-cards` and `adjust-keywords` stay paused (see `skills/march.md`
  §3b); they are T's to re-arm.
- Everything else continues: maps, enemies, equipment, NPCs, AUDIT fixes,
  critique.
