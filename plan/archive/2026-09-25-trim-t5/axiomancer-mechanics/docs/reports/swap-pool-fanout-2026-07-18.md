# Swap-pool fan-out — 2026-07-18

> **Status:** HISTORICAL — archived 2026-09-25 (trim T5). The ten swap sets it
> ledgers were cleared by the Profane Canon reset; `/deck-tuning` was retired (D10).

**What shipped:** ten per-theme sandbox card sets (`swap-<theme>`,
`src/Cards/swap-pool/<theme>.swap-pool.ts`) — 300 new SPELLS (30 per theme,
10 commons / 12 uncommons / 8 rares each) authored as `/deck-tuning`
measurement-seat candidates for the preset recipes. **None are player-facing
and none sit in a preset deck**: the sandbox layer is the only place they
live, and promotion into `cards.library.ts` (with matrix evidence) remains
the only shipping path. This executes the owner's 2026-07-18 direction,
upsizing the earlier 10–15/theme swap-pool ballot to 30/theme.

**Why:** Act 1 = the player cycles through the 10 preset decks; preset
quality is the owner's top concern. Each theme had only 7 unique cards —
one recipe, zero alternatives per seat. The pool gives `/deck-tuning` real
seat choices (carrier-density lesson from Dawncaster: ~11 cards/keyword vs
our ~2).

## Process

Per theme: a **card-expert** designer (Dawncaster KB receipts + spec 32
doctrine + `VERB_POINTS` arithmetic) authored the 30; a **mechanics-expert**
adversarially reviewed — re-running `scoreCard` rather than trusting the
`// pts:` comments, cross-checking effect ids, hunting near-clones of
library cards; a **card-expert** fixer applied the findings. Every card:
existing verbs/effect ids only (the 29-keyword registry vocabulary — no new
keywords, no new mechanics kinds), FREE line in (or declared out of) the
25–35% window, rank-band pricing, terse cold-old voice.

| theme | review findings (blockers/minors) | fixes applied |
|---|---|---|
| affliction | 2 / 5 | 5 |
| peroration | 0 / 3 | 3 |
| forge | 1 / 4 | 5 |
| akrasia | 2 / 4 | 6 |
| control | 4 / 3 | 7 |
| oracle | 2 / 2 | 4 |
| harvest | 3 / 3 | 6 |
| charm | 1 / 3 | 4 |
| bulwark | 10 / 2 | 11 |
| echo | 5 / 2 | 7 |

Typical blockers: strict-superset near-clones of library cards (power creep
in a ×4 seat makes the A/B degenerate), engine-false printed text (e.g. a
`d1` on a `calendarExpiry:false` MARK), out-of-band totals.

**Doctrine-witness catches (post-review, fixed in integration):** the
strike-dead sim witness caught two self-funding shapes the static review
could not — `bar-the-granary-door` (same-play SOUL mint funding its own
REAP max-HP erosion; fixed by mechanic order: reap now draws only the
standing bank) and `ratio-decidendi` (same-play premise deposits crossing
`at: 4` and cashing its own MARK plant; fixed by making the cadence
conclusion a pure consumer — no self-plant). Both are recorded as authoring
precedents in the affected files' comments.

## Contract (pinned by tests)

`src/Cards/e2e/swap-pool.engine.test.ts`: 30 spells per set, on-theme,
10/12/8 quota, ≤3 tier-3, `scoreCard` in rank band (same bands as the
pricing lint), FREE-share rails, only real effect ids, all ten sets
register together collision-free. The doctrine strike-dead sweep and the
sandbox registry pin also cover all 300 automatically.

## New tooling for the swap loop

- `--deck=preset:<id>+swap:<out>/<in>,...` — preset with measurement-seat
  substitutions (every copy of `out` → `in`; loud failure on bad pairs);
  shared by `combat-playtest` and `combat` CLIs; `applyDeckSwaps` exported.
- `--sandbox=<setId[,setId...]>` — comma-separated sets apply in order.
- Cookbook: `docs/playtest.md`; procedure: `.claude/commands/deck-tuning.md`.

## Not in scope / needs-user-call

- **Enchantment/disenchant seats have no swap candidates.** Their passives
  are per-card ENGINE hooks (`resonant-chamber`, `quagmire-of-doubt` are
  referenced by id in `combat.engine.ts`), so new ones cannot be sandbox
  data. Growing those seats is a propose-only engine follow-up.
- **[needs-user-call] forge:** the pool header records a working ruling
  that OVERHEAT is theme-engine manufacture, NOT a die-interaction line for
  the one-line law — ratify or reverse.
- **[needs-user-call] echo:** die-line law read: a `synergy` state
  predicate counts as the same condition-line class per spec 32 §2 — the
  pool is authored to that reading.
- **[needs-user-call] peroration:** 7 deliberate off-seat reach cards
  (heart/body/mind spread noted in the set description) are unswappable
  without a coordinated multi-seat recolor.
- **akrasia watch item:** `absolution-on-account` / `the-wound-that-teaches`
  CLEANSE while Fallen (state checked at play, then walked back) — a
  deliberate tension knob; watch the matrix for anti-synergy confusion.
- **harvest note:** TICK appears in `THEME_KEYWORDS.harvest` but is
  owner-ratified dead (2026-07-10) — the pool deposits Souls/seeds instead;
  the family row may deserve a cleanup pass.

## KB receipt highlights (full receipts in the per-file headers)

- POISON's card-played clock and BLEED's self-limiting stack economy match
  the genre (kb:dawncaster/keywords/{poison,bleeding}.okf.md).
- Carrier density: the genre fills hallmark density with many cheap simple
  appliers + few scalers (35 poison / 46 bleeding / 85 armor / 40 charmed
  carriers of 1,692) — the pools' 10-common floors follow that shape.
- Banked-counter-cashes-out (Momentum) grounds PREMISE/TURNABOUT shapes;
  Reaping's max-HP erosion matches REAP; Blood/Frenzy/Lifedrain ground
  akrasia's cost-carrier density.

## The estimates ledger (post-merge addendum, same day)

`swap-pool-estimates-2026-07-18.json` (this directory; deleted 2026-09-25, T1) carried the
per-card DESIGN ESTIMATES a second card-expert pass produced after the
merge: for each of the 300 cards — why it exists (<=12 words), expected
effect on its preset if seated, the recipe seat it contends for,
directional calls on statusEngagement / dotHpFraction / early win-rate,
a spam-risk flag, plus per-theme outlooks with trial-first picks — and
the verbatim printed FREE/PAID face text + flavor line for wording
review. All pre-simulation; the measurement pass turns them into
numbers and should LEAD with each theme's trial-first picks and the
spam-risk highs. The owner-facing rendering of the same data is the
"Swap-Pool Atlas" claude.ai artifact (id cb034e8d-e3d6-44dd-851d,
private to the owner).

## Next

A `/deck-tuning` pass (separate PR, review-only) swaps candidates into
preset recipes seat by seat with the new grammar and delivers the evidence
tables for the owner to arbitrate. **Gated: the owner asked to be checked
in with before it runs** (see the PHASE_CANDIDATES entry).
