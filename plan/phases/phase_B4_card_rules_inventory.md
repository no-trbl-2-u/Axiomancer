# Phase B4 — Card-rules inventory

## Sources

- Part plan: [`plan/revamp/cards.md`](../revamp/cards.md) (the B4 gate
  banner, "B4 — Card-rules inventory").
- Gate: `plan/bearings.md` → THE CARD HOLD (T, 2026-09-28): no card,
  card-type or keyword work starts until this inventory is merged.
- Decisions: **D37** (the card hold), **D44** (grey reward pool), **D45**
  (carrier rule), **D51** (Attack / Skill / Spell), **D56** (card editor
  deleted), **D58** (the loop creates nothing), **D69–D71, D73** (the
  ratified-but-unbuilt card model, recorded as "planned", not as live rules).
- Runs after R7 and R7e2 so it records the post-purge tree.

## Outcome

`plan/revamp/card-rules-inventory.md` lists every rule and fixture that
exists around cards today. For each: what it is, where it lives
(`file:line`), what enforces it (test / lint / guard / type), and a status
of **live** (read on a play path), **dormant** (code exists, nothing in the
grey library or a live path exercises it) or **dead** (unreachable or a
stale pointer to something deleted). It is the input B5 and B6 start from.

## Scope

The inventory covers at least the rows named by the part plan:

1. Card types and the `CardType` union.
2. The rank ladder (Ash → Saint) and tiers.
3. `color` body / mind / heart (and the D65 colour law as it stands).
4. FREE / PAID anatomy.
5. Complexity budget by rank.
6. Keyword families and S3 scaling.
7. The carrier rule (D45).
8. The keyword atlas; gloss and glyph registries.
9. The KW-* lints; face-honesty guards.
10. The reward pool.
11. Card upgrades (D8); die growth (D20).
12. Any surviving pricing remnants.

Plus anything else a sweep of both workspaces and the root scripts turns
up (deck composition, hand size, card removal, card-text rendering, the
sandbox, catalog export, content-drift).

## Decisions made upfront — DO NOT ASK

- **Documentation only.** No code changes. A dead rule found here is
  recorded with a "candidate for removal" note, not deleted: deletion is a
  separate decision (B5/B6 or an iterate tick), so the inventory reads the
  tree it was taken from.
- **Status is judged against the grey library.** A mechanic with no grey
  carrier is *dormant* even when well tested.
- **Planned rules are a separate section.** D69–D73 (Global, Curse,
  EXILE, SACRIFICE, lanes, families) are listed as "ratified, not built",
  so no one mistakes them for live rules.
- **Line numbers are taken at the ship commit.** The doc names its commit
  so later drift is visible.

## Tests matrix

None: no code changes. The doc must pass `npm run lint:content` and
`node scripts/check-lexicon.mjs`.

## Verify gate

Root `npm test`, `npm run lint:content`, `node scripts/check-lexicon.mjs`.
The workspace gates are untouched by a docs-only change.

## DoD

- `plan/revamp/card-rules-inventory.md` exists and covers every scope row.
- `plan/revamp/cards.md` and `plan/bearings.md` point at it and record the
  B4 gate as met.
- B4 ticked.

## Follow-ups (out of scope)

- Removing the dead rows the inventory finds: an iterate tick or B5.
- B5 (card-creator workflow) and B6 (card sessions): T's sessions.
