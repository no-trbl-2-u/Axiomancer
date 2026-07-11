# Phase 29 — The Language (keyword registry)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document judgment calls in the commit body.

## Scope

Work items KW-1, KW-2, KW-3, KW-5, KW-6, KW-7, KW-8 from
`plan/tuning/2026-07-10-keyword-registry.md`, executed against the fuller
evidence in `plan/tuning/2026-07-10-audit-evidence/cross-keywords.md` §8-9
(the "TARGET REGISTRY"). **KW-4 (kill TICK entirely) is explicitly OUT of
scope** — it rides Phase 30's FREE-line rework per the build-plan row. TICK
stays live, printed, and glossed in this phase.

Research grounding (`Agent(Explore)` pass, 2026-07-11, code-verified):
mobile's `state/combat/keywords.ts` KEYWORD_GLOSS ships **32** keywords + 2
card-type labels (spec 32 §3 shipped 30; FESTER/TRANSMUTE were bolted on
2026-07-10 without a spec amendment). `card-themes.ts` THEME_KEYWORDS is a
hand-authored, un-derived family list that already lies about CLEANSE
(affliction, akrasia — zero cleansing cards in either) and RUPTURE
(harvest — no harvest card ruptures). `docs/keyword-atlas.md` is still
pinned at 30 rows with 1 of 30 prior-art receipts filled (BLEED). Six
debuff ids (`debuff_argument_wound`, `debuff_kindling_ember`,
`debuff_backfire_acute`, `debuff_foretold_wound`, `debuff_nettle_sting`,
`debuff_echo_sting`) are fully defined in `debuffs.library.json` and applied
by 9 card-instances across 7 cards, but resolve to `null` from
`keywordForEffect` — the blank "◆ DIE" face bug.

## Decisions (documented, not asked)

1. **KW-1 fold is presentation-only, not an engine/balance rewrite.** Each
   unmapped debuff id gets an `EFFECT_KEYWORD` entry mapping it to its
   closest registry keyword; none of the six effect payloads change.
   `debuff_backfire_acute` keeps its separate stacking track (a deliberate,
   commented design feature on `paralysis-of-analysis` — doubling the
   deck's intensity ceiling) — only the printed word changes, not the math.
   Mapping: `argument_wound`→Poison, `echo_sting`→Poison, `kindling_ember`→
   Bleed, `nettle_sting`→Bleed, `foretold_wound`→Mark (its
   `tickAmplifyFlat: 1` payload IS Mark's mechanical signature — "+1 per
   stack each tick" — a closer semantic fit than Poison), `backfire_acute`→
   Backfire.
2. **KW-3 rename pass**, all presentation-layer (`MECHANIC_KEYWORD` +
   `KEYWORD_GLOSS` + face-text in `combat.cards.ts` where it prints the
   renamed word): FESTER→PROLONG, TRANSMUTE→REARGUE (frees TRANSMUTE for
   the unrelated die-conversion sense if a future phase wants it),
   REPRISE→RECALL. Delete the `replay_last`→Echo mapping (ouroboros already
   gets full descriptive text from `mechanicText`'s own `replay_last` case
   — no keyword badge needed for a 1-of rare). Promote SIPHON: add a
   `MECHANIC_KEYWORD` entry + `KEYWORD_GLOSS` definition (was printing raw
   lowercase `siphon 40%` with zero gloss).
3. **KW-2/KW-6 merge/retire pass:**
   - BARRIER merges into GUARD (one card, `the-adamant-wall`): its face now
     reads "GUARD 10 — persists" (mechanicText's `barrier` case updated);
     `Barrier` keyword retired from the glossary; `buff_barrier` support id
     remaps to `Guard`.
   - CONJURE retires (zero library cards, confirmed by grep of
     `cards.library.ts` for `conjure_card`/`CONJURE`) — removed from
     `KEYWORD_GLOSS`, `MECHANIC_KEYWORD`, and the echo theme's family list.
     Re-admit if Thoughtform cards ever ship (logged, not re-litigated
     here).
   - PERORATION demotes to card-local rules text on its sole carrier
     (`the-closing-word`): the PREMISE gloss already explains the
     payoff-trigger mechanic. Its `KEYWORD_GLOSS` entry is removed; the
     card face still prints "PERORATION at 6" via `mechanicText` (that
     path doesn't route through the glossary).
   - `consume_affliction` re-maps from Soul→**Rupture** (extends RUPTURE's
     printed sense to "consume N afflictions; finishers consume ALL"
     instead of minting a redundant CONSUME word); its face text changes
     from "consume 1 affliction…" to "RUPTURE 1 — its fuel ticks now, +N
     Soul".
   - `card-themes.ts` THEME_KEYWORDS fixed: affliction/akrasia drop the
     false CLEANSE claim, harvest drops the false RUPTURE claim, bulwark
     drops BARRIER (merged), peroration drops PERORATION (demoted), echo
     swaps REPRISE→RECALL and drops CONJURE (retired).
   - Net: 32 registered keywords → **30** (−3 retired/merged: BARRIER,
     CONJURE, PERORATION; +1 promoted: SIPHON). This is short of the
     evidence doc's aggressive 27-keyword target because that target also
     folds TICK (−1, explicitly deferred to phase 30) and conditionally
     KINDLE (−1, its "≥3 carriers" bar is a Phase-30/32 FREE-line-content
     question, not a registry-honesty one — touching it now would be scope
     creep into content work this phase doesn't own).
4. **KW-6 "single-source"** is scoped to a **parity lint**, not a module
   move. `keywords.ts`'s own docstring declares it "pure + dependency-free"
   by design (ADR-0001/0003: engine owns truth, mobile owns how it reads;
   mobile must not import mechanics' keyword shape at runtime just to
   validate itself). A full module relocation into `axiomancer-mechanics`
   would invert that boundary and touch the `@mechanics` barrel contract
   for no player-facing gain. Instead: a new mobile-side test imports BOTH
   `@mechanics` `card-themes.ts` (THEME_KEYWORDS) and the local glossary,
   and asserts every keyword any theme family claims actually resolves in
   the glossary — this is exactly the mechanism that catches "family
   lies" like the CLEANSE/RUPTURE/CONJURE claims found in the audit, and
   it lives on the same side of the dependency graph mobile already sits
   on (mobile depends on mechanics, never the reverse).
5. **Spec 32 §3 and its stale SWAY rule get corrected in place** (not just
   amendment-noted): the table already drifted from shipped reality
   (2026-07-08 resolve-threshold rework), so this is a factual fix, and
   the amendment block at the top of the spec records the registry-count
   change from the "exactly 30" directive to the earned-count doctrine
   already ratified in the keyword-registry tuning doc.
6. **KW-8 atlas backfill is honest-partial, not fabricated-full.** The
   `kb-query` MCP tool was unavailable this session (only `axio-query`,
   which reads live Axiomancer data, not the Dawncaster corpus,
   responded). Per the doc's own rule ("no receipt, no entry"), only
   receipts already surfaced with citations in
   `cross-prior-art.md` are backfilled (POISON, STAGGER, SWAY, SOUL, REAP,
   FALLEN, RECOIL, ECHO — 8 new + the existing BLEED = 9 of the atlas's
   rows). The remaining rows keep `—` with a one-line note pointing at a
   follow-up KB pass rather than inventing analogues.

## Acceptance

- No card renders a blank "◆ DIE" face for the six debuff ids (unit test:
  every `debuffs.library.json` id used by `cards.library.ts` resolves via
  `keywordForEffect`/`keywordForMechanic`).
- `KEYWORD_GLOSS` key count drops from 34 (32 + 2 labels) to 32 (30 + 2
  labels); a test pins the exact count so silent drift is caught.
- Parity test: every `THEME_KEYWORDS` entry (mechanics) resolves in
  mobile's glossary.
- `npm run verify --workspace axiomancer-mechanics` and
  `npm run verify --workspace axiomancer-mobile` both green (mechanics
  touches spec/docs only + `card-themes.ts`; mobile touches
  `keywords.ts` + `combat.cards.ts`... wait `combat.cards.ts` is
  mechanics — verify both workspaces regardless since the `@mechanics`
  alias couples them).
