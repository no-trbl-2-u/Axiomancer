# Phase 6 — Memoir run-history surface

> Agent-facing brief. Concise, opinionated, decisive. Ship without
> asking; document any judgment calls in the commit body.

## Outcome / Why

Two durable, flag-encoded records have accumulated on the save with
no reader: `hazardDeathCount` (`state/hazard/store-actions.ts`) counts
out-of-combat death tombstones (`hazard-death:<ts>` flags, Phase 130)
but is consumed only by its own tests today — the divergence doc
(`docs/hazard-v2-vs-mechanics-divergence.md`) explicitly calls it out
as built "for a future deaths-this-save surface." Separately, Rest
and LootCache mint narrative "keepsake" labels
(`RestOutcome.keepsakes`, `LootCacheOutcome.keepsakes`) that mobile
banks as `night-keepsake:<label>` / `cache-keepsake:<label>` flags —
today those only flash transiently on the Rest/Cache outcome screens
and are never read back. This phase gives both a permanent home: a
new "REMAINS" section on the already-shipped MEMOIR screen (Phase 33,
`app/(tabs)/memoir/`), which is exactly the run-history/journal
surface these two records belong on. Not a new screen — an extension
of an existing one.

## Routes / endpoints / CLI surface (locked in `bearings.md`)

No new routes. `/(tabs)/memoir` (existing, Phase 33) gains a fourth
section after MEASURE. No CLI change.

## Content / data reads

| Helper | Lookup | Use |
|---|---|---|
| `hazardDeathCount(flags)` (`state/hazard/store-actions.ts`) | `state.flags` | death tally |
| `HAZARD_DEATH_FLAG_PREFIX` | n/a | already encapsulated by `hazardDeathCount`; not re-parsed by memoir |
| `REST_KEEPSAKE_FLAG_PREFIX` (`state/rest/store-actions.ts`) | `state.flags` | strip prefix -> keepsake label (Rest) |
| `CACHE_KEEPSAKE_FLAG_PREFIX` (`state/cache/store-actions.ts`) | `state.flags` | strip prefix -> keepsake label (LootCache) |
| `state.flags` (engine `GameState.flags: string[]`, top-level on `GameStore`) | presenter | source array for both reads above |

No new engine surface. `hazard-scar:` flags and
`gleaning-token-banked:` flags are out of scope (see Follow-ups) —
this phase's scope is exactly the build-plan row: deaths + keepsakes.

## Components / handlers

- `state/presenters/memoir.engine.ts` — `selectMemoirViewModel` gains
  a `remains: MemoirRemainsViewModel` field (`{ deathCount, deathLine,
  keepsakes }`) plus `remainsEyebrow`, `remainsKeepsakesEyebrow`,
  `emptyKeepsakes` chrome fields. New pure helpers `buildDeathLine`
  and `extractKeepsakes`, module-local (mirrors `buildMoralAlignment`
  / `buildChronicle`'s existing pattern — small pure builders composed
  in `selectMemoirViewModel`).
- `app/(tabs)/memoir/index.tsx` — new "REMAINS" `View` section after
  the existing MEASURE section; subscribes to `state.flags` alongside
  the screen's existing slim-slice subscriptions.

No new mechanics-package code — this is a mobile-only read-back of
already-shipped mobile adapter state (Hard Rule 6: the flag-encoding
scheme for scars/deaths/keepsakes is itself a documented mobile
adapter, not engine truth; see
`docs/hazard-v2-vs-mechanics-divergence.md`).

## Cross-links

**In** (already shipped — verify still wired): the MEMOIR screen
itself (Phase 33), `hazardDeathCount` (Phase 130), Rest/LootCache
keepsake banking (existing `night-keepsake:` / `cache-keepsake:`
flag writers).

**Out** (this phase ships): the REMAINS section VM fields + screen
render. No new routes — nothing to retro-fit from other families
(this is itself the retro-fit of two orphaned data sources onto an
existing journal screen).

## Output schema / contracts

```ts
interface MemoirRemainsViewModel {
    /** Raw tally from `hazardDeathCount(state.flags)`. */
    deathCount: number;
    /** Narrative line — singular/plural/zero handled in the presenter
     *  so the screen carries no literal (Hard Rule #8). */
    deathLine: string;
    /** Distinct keepsake labels (Rest + LootCache), reverse-
     *  chronological — most recently banked first, matching the
     *  chronicle section's ordering convention. */
    keepsakes: readonly string[];
}
```

`MemoirViewModel` gains:

```ts
remainsEyebrow: string;           // '✠ REMAINS'
remainsKeepsakesEyebrow: string;  // '✠ KEEPSAKES'
remains: MemoirRemainsViewModel;
emptyKeepsakes: string;           // 'nothing kept.'
```

## Composition

```
✠ REMAINS
you have fallen <N> time(s). / you have not yet fallen.

✠ KEEPSAKES
<label>
<label>
...
(or: nothing kept.)
```

## Empty / loading / error states

- **No deaths recorded:** `deathLine` = `'you have not yet fallen.'`
  — always rendered (not gated on a length check like the other
  sections; a death tally is meaningful at zero, unlike an empty
  list).
- **Exactly one death:** `deathLine` = `'you have fallen once.'`
  (singular, not "1 times" — matches this project's narrative-voice
  bar for numeric copy).
- **N ≥ 2 deaths:** `deathLine` = `` `you have fallen ${N} times.` ``.
- **No keepsakes banked:** `emptyKeepsakes` = `'nothing kept.'`,
  rendered the same way the chronicle/quests sections render their
  empty lines (`vm.remains.keepsakes.length === 0` gate).

## Decisions made upfront — DO NOT ASK

- **REMAINS is a new section on the existing MEMOIR screen, not a new
  tab/route.** Confirmed via research: Memoir already shipped (Phase
  33) with Chronicle / Errands / Measure; deaths+keepsakes is the
  natural fourth section, not a new surface. The build-plan row's
  "(mobile; presenter-only)" tag is the group-level risk
  classification (see the "Mobile surfaces (presenter-only, low
  engine risk)" group header in `01_build_plan.md`), not a literal
  "don't touch the screen file" instruction — Phase 5 sits in the
  same group and shipped screen UI (the BUY/SELL tab toggle).
- **Scope is exactly deaths + keepsakes**, per the build-plan row.
  `hazard-scar:` flags (already consumed by Rest's inn-mend logic)
  and `gleaning-token-banked:` flags (a different concept — banked
  currency-like tokens, not narrative keepsakes) are not read here.
  Flagged as Follow-ups below; `plan/AUDIT.md` [1.5]'s "unbounded
  flag growth" debt item is a separate concern this phase does not
  close (it adds a *reader*, not a cap/GC — the debt item stays open
  for `/iterate`).
- **Keepsake source = two prefixes, merged.** `night-keepsake:` (Rest)
  and `cache-keepsake:` (LootCache) are the only two flag families
  whose engine-side field is literally named `keepsake`/`keepsakes`.
  Both feed one merged, reverse-chronological list — no Rest/LootCache
  sub-grouping in the UI; the player doesn't need to know which
  encounter minted which memento, mirroring how the chronicle section
  already merges multiple event kinds into one timeline.
- **No dedup surprises.** The existing writers
  (`state/rest/store-actions.ts` / `state/cache/store-actions.ts`)
  already guard `if (!flags.includes(flag)) flags = [...flags, flag]`
  before banking, so `state.flags` never carries a literal duplicate
  keepsake flag. `extractKeepsakes` still de-dupes defensively (by
  label, preserving first-seen/most-recent-first order) rather than
  trusting that invariant blindly — cheap, and consistent with this
  presenter's existing defensive-parsing style (`buildChronicle`,
  `buildMoralAlignment` both guard inputs that "shouldn't" be
  malformed).
- **Order = reverse-chronological**, matching the chronicle section's
  established convention (most recent first). `state.flags` is
  append-order, so reversing before de-dup (keeping the first
  occurrence encountered, i.e. the most recent) gives the right
  result.
- **No tooltip wiring for REMAINS.** Chronicle/Errands/Measure only
  gained `TooltipTarget` wrapping in the Phase 74 follow-up, after
  their base sections had already shipped and stabilized — REMAINS
  follows the same order: ship the section plain, tooltip content
  is a follow-up if/when the walkthrough content registry
  (`state/presenters/tooltip.engine.ts`) gets extended for it.
- **Section placement: after MEASURE, at the bottom.** REMAINS reads
  as a closing retrospective ("what remains of you") — placing it
  last mirrors how Measure (the philosophical/moral summary) already
  reads as the screen's closing beat; REMAINS extends that closing
  beat rather than interrupting Chronicle/Errands.

## Mobile reflow / responsive

No layout primitives beyond what MEASURE already uses — same
`styles.section` / `SectionLabel` / plain `Text` rows pattern as the
other three sections. No horizontal scrolling, no new width-dependent
styling; keepsake labels are prose sentences that wrap naturally in a
`ScrollView`.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `memoir.engine.ts` presenter | (colocated in the existing hermetic file below — this presenter has no separate `__tests__/` folder, all its coverage lives in the e2e-styled file per existing convention) | `state/e2e/memoir.engine.test.ts` — new "Tick E — remains section" describe block: zero-flags default (`deathCount: 0`, singular/plural death-line variants, empty keepsakes copy), `hazard-death:` flags drive `deathCount`, `night-keepsake:` + `cache-keepsake:` flags merge into `remains.keepsakes` with prefix stripped, reverse-chronological order, defensive de-dup on a repeated label, frozen-VM assertion extended to cover `vm.remains`. |
| `app/(tabs)/memoir/index.tsx` screen | — | no new Playwright/web e2e — mirrors Phase 5's precedent (screen has hermetic presenter+action coverage; no pre-existing screen-render e2e for this family to extend, and this phase doesn't introduce one net-new for the whole screen at this stage) |

## Verify gate

```bash
npm run verify --workspace axiomancer-mobile
```

## Commit body template

```
feat(mobile): memoir REMAINS section — phase 6

- selectMemoirViewModel gains a `remains` field: death tally (via
  the previously-unconsumed hazardDeathCount) + merged Rest/LootCache
  keepsake read-back
- New REMAINS section on the MEMOIR screen, placed after MEASURE
- Presenter-only data source: reads existing `night-keepsake:` /
  `cache-keepsake:` / `hazard-death:` flags, no engine change

Decisions:
- REMAINS extends the existing Phase 33 MEMOIR screen rather than a
  new tab (deaths/keepsakes are journal content, not a new surface)
- Rest + LootCache keepsakes merge into one undifferentiated list
  (mirrors the chronicle section's cross-source merge)
- hazard-scar: and gleaning-token-banked: flags stay out of scope
  (different concepts; AUDIT [1.5] flag-growth debt stays open)
```

## DoD

Flip Phase 6's `[ ]` -> `[x]` in `plan/steps/01_build_plan.md`,
append commit hash to the "Phase log" section.

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- `hazard-scar:` flags are not surfaced on MEMOIR (already consumed
  functionally by Rest's inn-mend logic; a read-back would be a
  distinct "scars carried" line, not deaths/keepsakes).
- `gleaning-token-banked:` flags are a different concept (Gathering's
  banked currency-like tokens) and not part of this phase's "deaths +
  keepsakes" scope.
- `plan/AUDIT.md` [1.5] "unbounded keepsake/death flag growth" is not
  closed by this phase — this phase adds a reader, not a cap/GC pass.
- No tooltip content for the REMAINS section (see Decisions above) —
  a follow-up phase can extend `tooltip.engine.ts`'s content registry
  the same way Phase 74 did for the other three sections.
- No screen-render (Playwright) e2e for `/(tabs)/memoir` — none
  existed before this phase either; adding one is cross-cutting
  testing debt, not scoped here (same call Phase 5 made for
  `/village`).
