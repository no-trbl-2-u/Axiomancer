# Phase CS1 — Card-spec scaffold and card-rules lint

> Agent-facing brief, plotted by T (`/plot`, 2026-10-12). Tooling and a
> fill-in document only. **This phase authors no card, keyword, relic or
> card text and changes none** (THE CARD HOLD, D37; D88). It builds the
> skeleton T fills in and the enforcers for rules T has already ratified.
> Ship without asking; record judgment calls in the commit body.

## Sources

- The `/plot` request (T, 2026-10-12): "Card-spec scaffold + ledger lint:
  template from the B4 inventory for T to fill, plus a lint. No cards
  authored." T's calls in the session: the skeleton lives at
  **`docs/card-spec.md`**; the lint **pins today's violations and fails on
  new ones**; and (T, later the same session) **the calls are gathered in
  an interactive HTML ballot** (a claude.ai artifact T fills in during a
  conversation, built outside the loop). The ballot exports one Markdown
  block per section; the skeleton's "T's call" blocks hold either
  `[T to fill]` or that export, pasted verbatim with its date.
- `plan/revamp/card-rules-inventory.md` (Phase B4, the 100% inventory):
  §§1–16 for the rules and their enforcers, **§17 "Ratified, not built"**
  (the rules this phase enforces), **§18 findings F1, F4** (the carrier
  rule has no enforcer; `check-prose` never reads the card text).
- `plan/revamp/cards.md`: "The card process: Plan B" (D73, D74), the scrap
  floor and the Global card text template (T, 2026-09-30), "The trial set"
  (D75, D80), B5 (card-creator workflow, owner: tool shape is T's call and
  is **not** pre-empted here).
- `plan/card-ledger/rehearsal-blood-price.md` → "Verdicts": the kept slots
  and the id rule `bp-<slot><option>`; "Revision 2" (D81).
- `axiomancer-mechanics/docs/keyword-atlas.md` → the complexity budget by
  rank (doc-only today, inventory §9).
- Decisions: **D37** (no card or keyword outside a guided session with T),
  **D45** (carrier rule), **D69–D71** (Global, Curse, EXILE, SACRIFICE,
  lanes and the reward), **D73/D74** (families of sub-lanes; Blood Price
  first), **D88** (cards and keywords owner-only), **D84** (code by PR),
  **D90** (in-tick defects fixed in-tick).

## Outcome

T opens `docs/card-spec.md` and finds every card rule the game has, one
section each, with what is live, what is ratified-but-unbuilt and a
blank "T's call" to fill; and the ratified text rules (complexity budget,
scrap floor, Global template, carrier rule, house prose) are enforced by
tests that pin today's offenders and fail on a new one, so the first card
session after the spec inherits a fence, not a backlog.

## Acceptance

- **A1** `docs/card-spec.md` exists with these sections, in this order,
  each carrying three fixed sub-blocks: **Live rule** (one paragraph plus
  `file:line` pointers copied from the inventory), **Ratified, not built**
  (the §17 rows that belong to it, or "none"), and **T's call** (an empty
  fenced block `[T to fill]`, or the ballot's exported Markdown for that
  section when T has already answered it, dated): 1 Card types; 2 The `Card` record; 3 Rank,
  rarity and tier; 4 Colour and the colour law; 5 FREE / PAID anatomy;
  6 Mechanics, riders and card text; 7 Keyword families and S3 scaling;
  8 Keyword registries, the atlas and the carrier rule; 9 Complexity
  budget; 10 Deck, hand, scrap and removal; 11 Rewards and lanes; 12
  Upgrades and die growth; 13 Pricing; 14 Save and migration; 15 Lanes,
  families and the ledger (Plan B); 16 Relics as lane keys (pointer to
  `plan/revamp/relics.md` B1; no relic content); 17 Enforcement (which test
  guards which rule, generated from A2–A6).
- **A2** The document's header states its status (`DRAFT — T is filling
  it in; nothing here is a rule until T marks the section RATIFIED`), and
  no section states a rule the inventory does not already record. It
  passes `check-lexicon` and `check-prose`.
- **A3** `axiomancer-mechanics/src/Cards/e2e/card-rules.engine.test.ts`
  enforces, over every library card (grey, trial sets): the **complexity
  budget by rank** (`cardComplexity` from
  `Combat/combat.card-complexity.ts` against the atlas bands), the **scrap
  floor** (no FREE or PAID line whose only effect is "gain 1 Conviction"),
  the **Global text template** (a Global card's text opens with one of the
  closed-set triggers; no duration in the rules text; PAID line only when
  it differs), and the **carrier rule** (every atlas keyword row is carried
  by a live card, enemy ability, signature, item or system; every keyword
  a card prints has an atlas row). Each rule reads an exemptions fixture
  `card-rules.exemptions.json` (`{ rule, id, reason, filed }`) and fails on
  any violation not listed, and on any listed exemption that no longer
  violates (stale exemption).
- **A4** The fixture is seeded by running the test once with
  `CARD_RULES_SEED=1`, which writes the current offenders with
  `reason: "pinned at CS1, awaits T's card session"`. The shipping PR
  commits the seeded fixture and files one `[content]` AUDIT row per
  pinned exemption, grouped by rule, with `next:` "T's next card session
  (D37)".
- **A5** `scripts/check-prose.mjs` `CONTENT_SURFACES` gains
  `axiomancer-mechanics/src/Cards/library/*.ts` (F4). Any violations it
  finds on the live card text are pinned the same way, via that script's
  existing allowlist mechanism if it has one, else a sibling
  `check-prose.exemptions.json`, and filed as `[content]` rows.
- **A6** `scripts/content-drift.mjs` gains a **ledger ↔ library parity**
  extractor: the kept slots in the ledger's Verdicts table (plus Revision
  2's changes) map to `bp-<slot><option>` and must equal the Blood Price
  lane's `cardIds` (less `bp-curse`); the test in
  `scripts/content-drift.test.mjs` fails on either side drifting. The
  extractor self-checks (throws on zero rows), like the others.
- **A7** `docs/card-spec.md` §17 lists each rule → test name → fixture, and
  `docs/truth-sources.md`'s source-derived table gains one row for the
  card spec with its DRAFT status.
- **A8** No file under `axiomancer-mechanics/src/Cards/library/` and no
  keyword registry, atlas row or gloss changes in this phase. The PR body
  states it; a reviewer can confirm with `git diff --stat`.

**Measure:** `npm run verify -w axiomancer-mechanics && npm test` green,
`card-rules.engine.test.ts` runs every rule over every library card, and
the committed exemptions fixture equals what `CARD_RULES_SEED=1` would
write at HEAD (a re-seed produces no diff).

## Scope

| File | Workspace | Role |
|---|---|---|
| `docs/card-spec.md` | root | A1, A2, A7. New. Written from the inventory, not from the code. |
| `axiomancer-mechanics/src/Cards/e2e/card-rules.engine.test.ts` | mechanics | A3, A4. One `describe` per rule; a shared `loadExemptions()` / `seedExemptions()`. |
| `axiomancer-mechanics/src/Cards/e2e/card-rules.exemptions.json` | mechanics | The pinned offenders. Generated, committed. |
| `axiomancer-mechanics/src/Cards/card-rules.ts` | mechanics | Pure rule functions (`checkComplexityBudget`, `checkScrapFloor`, `checkGlobalTemplate`, `checkCarrierRule`) returning `{ id, rule, detail }[]`, so the test and any future tool share them. Exported from `Cards/index.ts`. |
| `scripts/check-prose.mjs` | root | A5. |
| `scripts/content-drift.mjs`, `scripts/content-drift.test.mjs` | root | A6. |
| `docs/truth-sources.md` | root | A7. |
| `plan/revamp/cards.md` | root | One line under B5: "CS1 shipped the spec skeleton (`docs/card-spec.md`) and the rules fence; B5's tool shape is still T's call." |
| `plan/AUDIT.md` | root | A4/A5 `[content]` rows. |

Nothing deleted. B5's tool (editor, agent, or both) is not designed or
started here.

## Consumers to update

- `axiomancer-mechanics/src/Cards/index.ts` and `src/index.ts`: export the
  rule functions (additive).
- `check-prose` surfaces list (A5).
- No mobile change.

## Save / schema contracts

None.

## Carrier sweep

Not an R-phase. The carrier-rule *check* is added; no carrier is added or
removed.

## Decisions made upfront — DO NOT ASK

1. **The skeleton states nothing new.** Every "Live rule" paragraph is
   traceable to an inventory section; every "Ratified, not built" row to
   §17 or `cards.md`. If a rule is unclear in the inventory, the skeleton
   says "unclear in the inventory, §N" in the T's-call block rather than
   guessing.
2. **The spec is DRAFT and non-authoritative** until T marks sections
   RATIFIED. `docs/truth-sources.md` records it as a draft; `check-lexicon`
   governs it from day one because it lives in `docs/` (T's call).
3. **Pin, then fail** (T's call). Today's offenders are exemptions with a
   reason and a filed AUDIT row; the fence is for new cards. A stale
   exemption fails too, so the fixture cannot rot.
4. **The complexity budget bands** are the atlas's (Ash/Tooth ≤ 1 keyword
   beyond damage/guard and no trigger; Splinter/Rib ≤ 2 with one
   condition; Skull/Saint unbudgeted), scored by the existing
   `cardComplexity`. If `cardComplexity`'s notion of "keyword" and the
   atlas's disagree, the test follows the atlas and the commit body says
   where they differ; the scorer is not changed.
5. **The closed trigger set** for Globals is the three phrases in
   `cards.md` (turn start, SACRIFICE, Curse played), matched on the text
   after any leading badge glyph. A fourth trigger is a violation, not an
   extension.
6. **Carrier sources** are D45's list verbatim: player card, enemy deck or
   ability, signature skill, item, the dice and blacksmith systems. A word
   inside another keyword's reminder text is not a carrier.
7. **Ledger parity is by slot id**, not by name: names are placeholders
   until T names the cards (ledger "Verdicts"). The Curse is excluded from
   parity because the ledger lists it outside the slot table.
8. **No relic lint.** Relics have no lane field yet (BT left the lane relic
   open); §16 of the spec is a pointer for T, and a relic-names-a-registered-
   lane check is a follow-up once the field exists.
9. **Scrap floor reading**: a line "gives only 1 Conviction" when its
   mechanics resolve to a single `gain conviction 1` and nothing else;
   "gain 2" or "gain 1 and DEAL" pass.

## Tests matrix

| Suite | Subject |
|---|---|
| `Cards/e2e/card-rules.engine.test.ts` (new) | four rules over every library card; exemptions honoured; stale exemption fails; seed mode writes the fixture; synthetic cards prove each rule fires |
| `Cards/card-rules.test.ts` (new, unit) | each pure checker on hand-built `Card` objects |
| `scripts/content-drift.test.mjs` (existing, extended) | ledger ↔ lane parity, extractor self-check |
| `scripts/check-prose.test.mjs` (existing) | the new surfaces are read; exemptions honoured |
| `check-lexicon`, `check-prose` | `docs/card-spec.md` clean |

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
npm test
CARD_RULES_SEED=1 npm test -w axiomancer-mechanics -- card-rules && git diff --exit-code axiomancer-mechanics/src/Cards/e2e/card-rules.exemptions.json
```

Run `npm run typecheck -w axiomancer-mobile` once for the additive export.

## Commit body template

```
loop: phase CS1 — card-spec scaffold and card-rules lint

docs/card-spec.md: one section per card rule from the B4 inventory, each
with Live / Ratified-not-built / T's call; DRAFT until T ratifies.
card-rules.engine.test.ts fences the complexity budget, scrap floor,
Global template and carrier rule with a pinned exemptions fixture;
check-prose reads the card libraries; content-drift checks ledger <->
lane parity. No card, keyword, relic or text changed (D37, D88).

Acceptance: A1-A8.
Judgment calls: <pinned offenders by rule and count; any atlas vs
cardComplexity disagreement>.
```

## DoD

A1–A8 ticked in the PR body; the `[content]` rows for pinned offenders are
in `plan/AUDIT.md` Pending.

## Follow-ups (out of scope)

- **B5** (owner): the card-creator tool shape; it can consume
  `Cards/card-rules.ts` as its validation layer.
- A relic → registered-lane parity check once relics carry a lane field
  (the lane relic left open by BT).
- Rendering `docs/card-spec.md` section status (DRAFT / RATIFIED) in the
  DevLog once T has ratified at least one section.
