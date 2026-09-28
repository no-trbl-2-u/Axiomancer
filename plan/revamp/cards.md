# Revamp — cards

> Part plan of [THE REVAMP](README.md). Phases **B4** (card-rules inventory,
> loop), **B5** (card-creator workflow, owner), **B6** (card sessions,
> owner). Decisions D37, D44, D50, D51, D56. Status: PROPOSED.

> [!IMPORTANT]
> **Gate before any card work (T, 2026-09-28).** Before a card session,
> card-creator work, card-type work or keyword work starts, determine
> **100%** of the fixtures and rules that exist around cards — card types,
> keyword families, pricing, rarity/rank ladder, tiers, colour, FREE/PAID
> anatomy, complexity budget, the carrier rule, and every lint, guard and
> test that pins them. That is Phase B4. No card work begins until its
> inventory is merged. (Also recorded in `plan/bearings.md` → THE CARD HOLD.)

## Where things stand

- Library: the grey office only — A Plain Blow (DEAL), A Plain Ward (GUARD),
  A Plain Word (VULNERABLE) — `Cards/library/starters.cards.ts`. Fresh deck
  Blow 5 / Ward 3 / Word 2 (D43). The grey cards are the reward pool (D44).
- THE CARD HOLD (D37): no card or keyword is created outside a guided
  session with T.
- Card types: purged to **Attack / Skill / Spell** (D51, shipped in R7).
- The keyword/card revamp process plans:
  [`plan/2026-09-27-keyword-card-revamp.plans.md`](../2026-09-27-keyword-card-revamp.plans.md)
  and its summary — **UNDECIDED**; B6 is where T picks one.
- The card editor package is deleted in R1 (D56); B5 replaces it.
- `card-expert` is archived in R0 (D58); a fresh card agent is written at
  the first card session.

## Rewards (D44, D50)

T, 2026-09-28: keep the post-fight card reward; gut the keyword-, theme-
and rarity-focused selection logic (R7).

**Research note for B6:** find the best way for rewards to steer players
toward *focused* deckbuilding. Starting prior art to examine (via `scout`
and the KB): Slay the Spire's class pools and rarity pity, Monster Train's
clan pairs, Dawncaster's talent/card gating, Balatro's shop steering,
Inscryption's totem/sigil drafting. Output: options with trade-offs, not a
decision.

## B4 — Card-rules inventory (loop; creates nothing)

Runs after R7 so it records the post-purge tree. Produces
`plan/revamp/card-rules-inventory.md`: for each rule or fixture — what it
is, where it lives (file:line), what enforces it (test/lint/guard), and
whether it is live, dormant or dead. Must cover at least: card types, the
`CardType` union, rank ladder (Ash → Saint), tiers, `color` body/mind/heart,
FREE/PAID anatomy, complexity budget by rank, keyword families and S3
scaling, the carrier rule (D45), the keyword atlas, gloss/glyph registries,
the KW-* lints, face-honesty guards, the reward pool, card upgrades (D8),
die growth (D20), and any surviving pricing remnants. The loop may ship
this — it is an inventory, not a design.

## B5 — Card-creator workflow (owner)

T, 2026-09-28: "Create card-editor / card-creator workflow" as a phase of
the card-creation build plan. Replaces the deleted card editor. Designed
with T after B4; scope (UI tool vs. agent-driven authoring vs. both) is
T's call.

## B6 — Card sessions (owner)

T picks a plan (or splice) from the keyword/card revamp plans, ratifies its
banner there, and runs the sessions. A fresh card agent is written at the
first session. More card types beyond Attack/Skill/Spell are added here.
