# Phase 41 — Constraint demolition

> Agent-facing brief. **Removes test/spec/doc machinery only — ships NO new
> card content and NO damage on any card.** Everything below it in the queue
> (42 the Dark Fantasy bible, 43 objective function v2, 44a-44i retheme,
> 45a-47e, 48-51) assumes this phase has already cleared the walls; ship it
> FIRST. **LOCKED MECHANICS GUARD applies:** Conviction, the Surge meter and
> the Dice system must survive this phase completely untouched — this is the
> phase most likely to break that by accident, since it deletes doctrine
> tests and some of those transitively pin dice/Conviction/surge behavior.
> Delete ONLY the assertions enforcing the three retired constraints; re-home
> any assertion that happens to pin a locked system into a suite that
> survives, rather than dropping it with the file.

## Inputs (read in this order)

1. `plan/bearings.md` §"THE UNSHACKLING" + §"LOCKED MECHANICS" (2026-08-08)
   — the ratified scope of what falls and what is carved out. Source of
   authority: T's direct ruling, recorded in commit `ad934542`.
2. `plan/steps/01_build_plan.md` Phase 41 row — the three-item scope (a/b/c)
   this brief expands.
3. `axiomancer-mechanics/specs/32-no-strike-card-library.md` — the spec
   carrying both retired laws (§1 strike-is-dead doctrine, and the
   2026-07-10 amendment block's FREE-line law).
4. The three named surfaces: `src/Cards/e2e/doctrine-strike-dead.engine.test.ts`,
   `src/Cards/e2e/swap-pool.engine.test.ts`,
   `src/Cards/e2e/curated-library.engine.test.ts`, `.claude/commands/deck-tuning.md`.

## Scope — exactly three removals, nothing else

### (a) The strike-is-dead witness — full file retirement

`src/Cards/e2e/doctrine-strike-dead.engine.test.ts` (314 lines) carries three
witnesses, all enforcing "no card deals raw enemy-HP damage": the 70(+)-card
clean-board sweep (incl. its sandbox/Thoughtform extension), the
`SIGNATURE_SKILLS` HP-kind sweep, and the source-level "strike" vocabulary
ban. None of its assertions touch Conviction, Surge, or Dice — it reads
`enemy.health` deltas and signature-kind/vocabulary text only. **Delete the
file outright.** No re-homing needed (checked: zero locked-system
assertions inside it).

The sibling "themed library — THE STRIKE IS DEAD (spec §1 schema gate)"
block inside `curated-library.engine.test.ts` (checks the library source
never mentions the deleted `basePower`/`chipHp` fields) is **NOT** named in
the build-plan row and is left untouched — those fields stay deleted from
the schema in this phase (no damage is being added to any card here), so
the block stays true and harmless. A future phase that authors a damage
verb decides then whether to revive/rename those fields and what to do with
this block.

### (b) Spec 32's FREE-line law + its lint

The FREE-line law lives in two places:

1. **Spec text** — the 2026-07-10 amendment block (spec 32, lines 3-16,
   item 1): *"every FREE line must deposit theme currency... never
   damage."* Amend in place with a dated superseding note directly under
   that amendment item — do NOT delete the amendment block (history) or the
   rest of the spec (cited by dozens of plan docs).
2. **The lint** — `describe('themed library — THE FREE-CURRENCY LAW
   (phase 30, turn-texture.md §1)', ...)` in `curated-library.engine.test.ts`
   (the block bracketed by that describe, currently ~47 lines): the
   `CURRENCY_FIELDS`/`UTILITY_ONLY_FIELDS` tables and their three `it(...)`
   assertions. **Delete the whole describe block.** (There is no separate
   ESLint rule — "lint-enforced" in the spec text refers to this vitest
   block; confirmed by grepping the repo for a `CURRENCY_FIELDS` /
   `FREE-CURRENCY` hit outside this one file.)

### (c) Sandbox-first / byte-identity / recolor-not-repartition gates

Three anchors, three different treatments:

1. **`src/Cards/e2e/swap-pool.engine.test.ts`** (whole file, 146 lines) —
   the swap-pool candidate contract exists to support the retired
   sandbox-first quarantine (candidates must earn a seat via measurement
   before promotion) and the retired recolor-not-repartition law (its
   "on-theme" assertion). **Delete the file outright.** The swap-pool
   *data* (`src/Cards/swap-pool/*.ts`, `src/Cards/cards.sandbox-sets.ts`
   registrations) is left in place untouched — it is still legal content
   `/deck-tuning` may use or ignore; only the witness enforcing the old
   gate comes down.
2. **`curated-library.engine.test.ts`'s `POST_D8_SHAPE` pin** — the `it('each
   theme matches the pinned post-restoration shape...')` block (with its
   `POST_D8_SHAPE` table and the `byTheme` map that exists only to serve
   it) is a hard repartition gate: it pins the exact card count, rarity
   split, and enchant/disenchant count PER THEME. Under "no
   recolor-not-repartition rule," this must come down. **Delete that
   `it(...)` block and the `byTheme` map/`describe`-scope helper that has no
   other consumer** (re-check: `themeOf()` itself is reused by the "every
   card carries exactly one of the ten theme tags" test and stays; only the
   `byTheme` Map built from it is POST_D8_SHAPE-only). Keep the "is exactly
   86 unique cards" and "every card carries exactly one theme tag" checks —
   those are identity/hygiene, not a repartition pin.
3. **`.claude/commands/deck-tuning.md`'s promotion path** — strike the
   hard-gating language in §3 Autonomy contract and §6 Hard rules per the
   bearings summary (*"no sandbox-first quarantine, no byte-identity law,
   no recolor-not-repartition rule, no per-change owner ballot, no
   needs-user-call on recolors or new cards"*):
   - "Guarded — library card numerics" tier: remove the "ONLY after a
     sandbox-override A/B" requirement and "No cold edits to library
     literals" — direct edits are now permitted. Sim-evidence-before-edits
     becomes recommended practice, not a gate (keep the guidance prose,
     drop the enforcement framing).
   - "Free — swap-pool candidate authoring" bullet: remove "promotion of
     pool cards to player-facing is itself gated on a standing
     `[needs-user-call]`" — promotion is now a direct move, no ballot.
   - "Promotion path" bullet: remove the hard `>= 2 stages and >= 2
     policies` proving requirement before a promotion is allowed; keep the
     mechanic (move the literal into `cards.library.ts`, evidence table in
     the report) as good practice, not a precondition.
   - Cross-theme swap law (§3 measurement-seat bullet + §6 hard rule
     "Never swap in a card from another theme without the flag"): the
     recolor-not-repartition rule is void, so a cross-theme card move is no
     longer a standing owner call. Rewrite to say cross-theme moves are
     now permitted directly like in-theme ones; the `--cross-theme-swaps`
     CLI flag and its plumbing are left as-is (untouched code, now simply
     optional/redundant) — flag removal is a follow-up, not this phase's
     job.
   - Leave completely untouched: the verify-gate rule, "never edit engine
     logic," "never invent new specialMechanics kinds" (propose-only
     structure tier — not one of the three retired doctrines), "never
     push to main automatically," commit-style rules, and the whole §4
     design-targets / metric-slate section (balance measurement, not card
     authority).

## Explicit non-goals (do NOT do these in Phase 41)

- Do NOT add `basePower`/`chipHp`/any damage field back to `Card`/
  `CardRider`, and do NOT author a single card with raw HP damage. That is
  content work for a later phase (Phase 42+ or a `/deck-tuning` tick after
  this ships).
- Do NOT touch `pricing.engine.test.ts` or the rank-band pricing lint —
  pricing-band correctness is not one of the three named retired
  constraints.
- Do NOT touch the Upgradeable-Dice flag-off byte-identical parity suite
  (`deck-presets.engine.test.ts`'s "flag-off decks are byte-identical to
  their pre-D8 snapshots" and siblings) — that "byte-identical" is an
  engineering regression guard for a feature flag, unrelated to the design
  "byte-identity law" being retired. LOCKED MECHANICS guard: this is Dice
  system territory.
- Do NOT delete or rewrite spec 32 wholesale — amend in place with a dated
  header per item (b).
- Do NOT touch `.github/workflows/deck-tuning.yml` (the Action's
  `--cross-theme-swaps` checkbox) — doc-only phase.

## Decisions made upfront — DO NOT ASK

- `doctrine-strike-dead.engine.test.ts` and `swap-pool.engine.test.ts` are
  deleted as whole files (git `rm`), not emptied to a stub — the plan row
  explicitly frames this as retirement, and an empty file with no tests is
  pure noise.
- Spec 32 is amended, never deleted (dozens of plan docs cite it by
  section number; the doc stays the historical record with a superseding
  note).
- Where phase 41's row is silent (the STRIKE-IS-DEAD schema-gate block in
  `curated-library.engine.test.ts`, `pricing.engine.test.ts`, the
  `--cross-theme-swaps` CLI code), the default is **leave it alone** — the
  row lists three items, not "everything that smells like the old
  doctrine."

## Prove (DoD)

- `git diff --stat` touches only: the two deleted test files, spec 32,
  `curated-library.engine.test.ts`, `.claude/commands/deck-tuning.md`, this
  brief, and the build-plan status line.
- `npm run verify` (mechanics package) green — in particular
  `curated-library.engine.test.ts` still passes with the FREE-CURRENCY and
  POST_D8_SHAPE blocks gone, and no dangling reference to
  `swap-pool.engine.test.ts` remains in `deck-tuning.md`'s Step 0 cold-run
  list.
- Grep confirms zero remaining references to `CURRENCY_FIELDS`,
  `POST_D8_SHAPE`, or `RATIFIED_SPEC32_S12_CARD_EXCEPTIONS` in `src/`.
- Grep confirms every locked-mechanics anchor (`conviction`,
  `MOMENTUM_CHAIN_ORDER`, `MOMENTUM_SURGE_LENGTH`, `SURGE_DIE_PREFIX`,
  `combat.dice.ts`, `combat.upgradeable-dice.ts`, `DEFAULT_DIE_GEAR`) is
  untouched by `git diff`.
- Flip Phase 41's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`, append the
  commit hash.

## Follow-ups (out of scope this phase)

- Phase 42 — the Dark Fantasy campaign bible (next in queue).
- Authoring the first damage-dealing card/verb (a `/deck-tuning` or later
  design-phase job) — needs a new schema field/verb, which this phase
  deliberately does not decide.
- Retiring the now-optional `--cross-theme-swaps` CLI flag and its
  GitHub Action checkbox, if a later pass judges it dead weight.
