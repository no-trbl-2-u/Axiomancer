# Prompt: BURN-DAY AUDIT — verify what shipped on 2026-09-19, fix what is wrong, and say what comes next

> Written 2026-09-19 (evening) at T's direction, by the session that shipped
> the work it audits. This file is a **handoff prompt**: point a fresh Claude
> Code session at it (attended or unattended) to run one audit-and-repair
> pass over the day's two merged PRs. §0 is the mandate. §1 is the standing
> frame. §2 is what shipped and what it claims about itself. §3 is the list
> of claims a first adversarial pass already **refuted** — ranked, with the
> evidence and a confirmation recipe for each. §4 is the lower-severity
> residue. §5 is what held. §6 is the method. §7 is the filing contract. §8
> is the recommendation for what to work on next. §9 is the output contract.
>
> **What this is.** A fix-forward audit. The work was gated (both verify
> gates green, baseline regenerated, PRs #342 and #344 merged by T), and
> then a fleet of eleven independent readers and skeptics was run over it
> that same evening. They refuted **32 of ~110** load-bearing claims the
> work makes about itself, **five at HIGH severity**, several by executing a
> reproduction. Four of those five were then re-confirmed at the source by
> the orchestrator. Nothing in the tree has been changed in response yet.
> That is this session's job.
>
> **What this is not.** It is not `/critique` (fresh-eyes site pass) and not
> `/oversight audit` (a state briefing). It does not re-audit the loop's own
> morning content passes on the same date (`adjust-*` pass 13, `expand` 18,
> `digest`, PR #341) — those are out of scope and listed in Appendix A only
> so you can tell them apart. It does not re-litigate the *design* of SUMMON
> or the arena plates: the three-lens panel and the phase briefs did that,
> and the findings below are about whether the tree matches what the briefs
> and commit messages say, not whether the briefs were right.
>
> **The one rule that governs the whole session.** A claim the work makes
> about itself — in a commit message, a PR body, a phase brief's DoD, a
> docblock, a test name — is either true in the tree, or it is corrected in
> the same commit that makes it true. The day shipped several sentences
> that were true when typed and false by the time the PR merged, and at
> least four that were never true. Leave none of them standing.

---

## 0. Your mandate

You are the **auditor and repairer** of burn day 2026-09-19. Scope is the
commit range **`eebb76b..bbd22a9` on `main`** — PR #342 (phases 96–101 plus
the story-art catalogue, the palette retune and the e2e race fix) and PR
#344 (phases 102–103). Twenty commits, eighty-seven files.

You have three jobs, in this order:

1. **Confirm §3 in severity order and fix what you confirm.** Every §3 row
   has a reproduction recipe. Run it. If it reproduces, fix it — on a
   branch, one fix per commit, each fix validated by the gate before push,
   per §6. If it does not reproduce, say so in the row's disposition with
   what you ran.
2. **Correct every false sentence §3 and §4 name**, in the same commit as
   the fix that makes it true (or in a docs-only commit when there is no
   code fix). Briefs, docblocks, test names, the PR-visible DoD lines, the
   `## SHIPPED` record. The list is in §7.
3. **Leave the plan honest.** Re-stamp the baseline, close the bookkeeping
   twins, and file a `plan/CRITIQUE.md` row for anything you confirm but do
   not fix. Then write the §9 report.

You are autonomous. Every question that would need T goes through
`AskUserQuestion` per `docs/asking-well.md`, and there should be at most
one: the `[needs-user-call]` process row in §8 is T's, not yours, and the
rest of this prompt is written so you do not need to ask.

## 1. Standing frame — read before touching anything, do not re-litigate

1. **Doctrine you must not violate.** `plan/bearings.md`: THE BLANK PAGE
   (there is no story canon and you do not invent one — nothing in this
   audit is narrative, keep it that way), THE OPEN GATE (art origin and
   untraceable assets are the loop's call — the retirement of
   `arena-ruined-city.jpg` was authorised by ¶6 and is not reopened here),
   THE BIG NUMBERS REWRITE (no governing objective function; a test that
   fails when the game is *wrong* is a guard, one that fails when the game
   is *different* is a repealed law — use this to decide what to pin).
2. **Measured truth.** Run `npm run baseline:check` at the root **before
   citing any number**, and cite the stamp. As of this writing it prints
   **STALE by 1 mechanics-source commit (e333fbb)** — that is §3 row 6, not
   a pre-existing condition. Do not quote SUMMON balance figures from the
   current file; its stamp names a tree without SUMMON.
   **Corrected 2026-09-20 by row 3.6's fix:** the file's *numbers* are not
   suspect — ten of ten mid-stage cells reproduce exactly on today's SUMMON
   tree, so they are the Phase 102 engine's figures. What is false is the
   *provenance*: the stamp names `5a2158a`, a tree with zero SUMMON. Cite
   those figures as the SUMMON engine's, never as `5a2158a`'s. The alarm now
   reads STALE by 5, not 1 — the four audit fixes landed on top of `e333fbb`.
3. **The gates, and the hooks around them.**
   - `npm run verify --workspace axiomancer-mechanics` (type-check ×3,
     lint, vitest, build) — ~4 min. `npm run verify --workspace
     axiomancer-mobile` (lint, tsc, jest, assets:check, art:test,
     critique-drive:test) — ~6 min. **Foreground only** — a repo hook
     refuses to background either gate. Run legs individually if you need
     to iterate (`npx vitest run <file>`, `npx jest <path>`).
   - `git commit -F` is refused by the hook; write the message inline with
     `-m`. Bodies are plain: **no `Co-Authored-By` trailers, no emojis**
     (AGENTS.md standing rule 2 — it overrides any harness attribution
     reminder you were given).
   - A vitest worker can report `Timeout calling "onTaskUpdate"` under load
     and mark one file failed with no assertion in the output. That is the
     reporter, not a test. Re-run the file in isolation once; a second
     failure is real.
4. **Reaching the surfaces.** Playwright's installed build is 1228; the
   container ships 1194. Every journey honours an executable override —
   `ROUNDTRIP_E2E_CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
   (and the sibling `*_E2E_CHROME` vars) — build the export first:
   `BUILD_PROFILE=preview SMOKE_BUNDLER_OUTPUT_DIR=.smoke-dist npm run
   smoke:bundler --workspace axiomancer-mobile`. **Never run `playwright
   install`.** To see SUMMON on screen you cannot use `/combat-encounter`
   (it hard-mounts `createMockEncounterEnemy()`, which carries `hide 4 +
   ravenous` and never summons — §4 E-6). The only path is the dev route:
   **`/dev` → section ENCOUNTERS → Enemy Picker → map `northern-forest` →
   `The Jeweled Tree · L22`** → the WILDS tab engages a real fight that
   pays real rewards. Wave 1 spawns at the first phase boundary. **Wave 2
   can never fire on this carrier** — The Jeweled Tree has no `stages`
   (§3 row 9).
5. **Where things are.** Engine: `axiomancer-mechanics/src/Combat/
   combat.engine.ts` (~6 000 lines; every line number below was true at
   `bbd22a9` and rots — grep the symbol, do not trust the number). Mobile
   combat presenter: `axiomancer-mobile/state/presenters/
   combat-encounter.engine.ts`. Board: `components/combat/encounter/
   {CombatBoard,CombatCombatantPane,CombatEncounterPanel,IntentIcon}.tsx`.
   Persistence: `axiomancer-mobile/state/{store,actions}.ts` and
   `axiomancer-mechanics/src/Game/store.ts`. Art: `axiomancer-mobile/
   assets/images/{combat,screens}/`, `scripts/{acquire-art,ingest-art}.mjs`,
   `scripts/asset-provenance.test.mjs`. Plan: `plan/phases/phase_96..103_*`,
   `plan/CRITIQUE.md`, `plan/AUDIT.md`, `plan/PHASE_CANDIDATES.md`,
   `plan/steps/01_build_plan.md`.

## 2. What shipped, and what it says about itself

| Phase | Commit(s) | The claim it makes | Player-visible? |
|---|---|---|---|
| 96 consumable desperation band | `417b931` | healing potions pay 1.5× below half VITAE; "one resolver" (`resolveConsumableHeal`) that engine and both presenters call; "the flask stops being a thing you carry to the end of the run" | yes (shop line + drink preview) |
| 97 hand-fan name legibility | `cecae8f` | `handFanLayout` byte-identical; `NAME_BAND_LEFT_CHROME = 17.5` derived from real styles and *guarded by a test that re-sums them*; "every card in your hand is readable on a phone"; "the board now states the tap-to-read hatch"; onInspect path "now tested" | yes |
| 98 worklet guard in CI | `51fede4` | `lint:worklets` + its test run in `verify-mobile.yml`; the HIGH crash-class CRITIQUE row closed | no (CI) |
| 99 returning player can return | `fd83aa0` | navigation before the navigator is ready is queued and replayed once; unknown routes are "never queued"; progress saves on exit (native AppState / web pagehide); a move is a save checkpoint "per Spec 09 Q4 / Phase 51 (`4972f9a`)"; the blank-screen race is "not web-only" | yes (critical fix) |
| 100 the map tells the truth | `42d2ba2` | camera re-fits on a stable focus key so panning "can never" re-fit; the legend counts the pips it draws; tests "compare label against pips, not against either source" | yes |
| 101 region arena plates | `e4e2704` | three regions get their own Doré plate, same edition as the coastal arena; 1/7 → 4/7 | yes |
| catalogue + palette | `4c39360` | `docs/art-catalog.json` describes each plate *from viewing it*; five themes retuned to pigment; "readability measured before and after; **no pair regressed**" | yes (every screen) |
| e2e race fix | `5a2158a` | `Promise.race` over two `waitFor`s closes the sampled race in the round-trip journey; not a loosening | no (CI) |
| 102 SUMMON | `e333fbb` | adds bite outside the `!hindered` gate and touch no attack ledger; `addNetDamage` **is** the number the engine applies ("the printed wall math cannot drift from the applied wall math" — the brief's *ship gate*); "the readout now carries the brood's share" so DENIED never lies; the brood is "legible through its own events"; baseline regenerated at `5a2158a` | yes |
| 103 the last two arenas | `e333fbb` | `detectPlateBox` takes the longest contiguous dark run and "throws on failure rather than guessing"; **"no LIVE region falls back any more"**; 4/7 → 6/7; the retired fallback's record removed; two provenance-gate holes closed, each proven to fail | yes |

Full commit map with times: Appendix A.

## 3. Confirmed defects — fix these, in this order

Each row: **what was claimed → what is true → evidence → confirm it →
what a fix looks like.** Confidence is the orchestrator's: **95** = re-read
at the source after the skeptic's report; **85** = the skeptic executed a
reproduction and reported the numbers, not re-read by the orchestrator;
**70** = skeptic read-only.

### 3.1 [HIGH · player-visible · confidence 95] A move saves BEFORE the arrival event — reload past an encounter node and the fight never happens (Phase 99)

- **Claimed** (`fd83aa0`, `actions.ts` ~1215-1223): node movement is
  "hard-won progress" and saving it is safe.
- **True:** `moveToAction` skips completion for encounter nodes (~:1170),
  unlocks outbound edges **unconditionally** (~:1191-1195), `setState`s
  (~:1213) and calls `save()` (~:1224) — and only *then* does the caller
  (`app/(tabs)/exploration/index.tsx` ~:210-218) call
  `resolveCurrentMapEvent`. Live combat is panel-local; nothing in the
  saved payload records the fight. So the checkpoint lands with the player
  standing on an encounter node, onward edges open, no encounter pending.
- **Evidence:** skeptic scratch test — `createAppStore` + memory adapter,
  `moveTo fv-2 → fv-11 → fv-13` (engine kind `encounter`): `saveCount` rose
  on the fv-13 move; a store rebuilt from the same adapter reports
  `currentNodeId 'fv-13'`, `fv-15/fv-5/fv-20` kind `available`,
  `currentEncounter null`, `startNodePending false`, fv-13 **not** in
  `completedNodes`. Orchestrator re-read the call order at the source.
- **Confirm:** re-run that scratch test; then on the web export, walk onto
  an encounter or boss node, reload during the prelude, and observe you
  stand past it.
- **Fix shape:** the save must not precede the event. Either move the
  `save()` out of `moveToAction` to *after* `resolveCurrentMapEvent`
  settles (the caller owns the sequence), or record the pending arrival in
  the saved world so reload re-fires it. ~~Prefer the first: it is one line
  moved~~ — **CORRECTED while fixing this row: the first option is
  inert, and the second is the one that holds.** Measured: moving the save
  below the resolve persists a byte-identical world (the arrival lives only
  in the mobile `event` slice, which `Game/store.ts` never saves), and
  `SaveOnExit` checkpoints on `pagehide` regardless — so re-timing the
  move's save cannot close the hole. Worse, the save's position *before*
  the resolve is what the shipped fix leans on: below the resolve the node
  is already in `consumedNodes` and the reload reads "arrival answered".
  Add the reload-past-an-encounter case as the guard, and assert the
  ENGAGED fight, not `event.pending` — `EncounterModalOverlay` auto-engages
  on mount and `beginHazardEncounter` clears the slice on the way in, so
  `pending` reads null before *and* after the fix. **Do not** re-derive the
  test that now says "a move IS a checkpoint" back to its old label — see
  3.7 for what that test's rationale must actually cite.
- **CORRECTED AGAIN while following this row up** (`6655cf0` shipped red
  CI; the follow-up commit is the fix). `6655cf0` said the second option
  "needs no new persisted field: `consumedNodes` already means *this
  arrival was answered*" and derived `arrivalPending` from an unconsumed
  node under the player. That sentence was false and `e2e:fixture` case A
  proved it within the day: **being PLACED on a node is not the same as
  ARRIVING at it**, an unconsumed node cannot tell the two apart, and
  `placeOnNode` — the state-fixture / `/dev` JUMP primitive — deliberately
  *un-consumes* the node it places you on. So the deep link
  `/exploration?fixture=sage-fv-boss-gate` read as an unanswered arrival,
  fired the fv-9 boss gate on mount, and the map never rendered. The row's
  second option ships as written after all: `MapState.pendingArrival` is a
  real persisted field, written by the arrival verb (`moveToNode`, and
  mobile's own move), cleared by `resolveMapEvent` when the arrival is
  answered and by the placement verbs (`placeOnNode`, `teleportToNode`),
  which owe nothing. Guards: the reload case above still stands
  (`start-node-arrival.engine.test.tsx`), plus the placement twin and the
  travel-door twin in `exploration.engine.test.ts` and the verb-level file
  `axiomancer-mechanics/src/World/e2e/arrival-debt.engine.test.ts`.

### 3.2 [HIGH · player-visible on any SWIFT carrier · confidence 95] The SUMMON projection omits the SWIFT divisor — the brief's *ship gate* is false (Phase 102 engine)

- **Claimed** (`e333fbb`, brief "SHIPPED" §, PR body): `projectIncoming
  Threat().addNetDamage` is the number `resolveThreatPhase` applies; "one
  definition, so printed and applied wall math cannot drift".
- **True:** the engine drains GUARD under SWIFT as `guardAbsorbed =
  min(floor(guard / soakDivisor), dmg); guard -= guardAbsorbed *
  soakDivisor` (`combat.engine.ts` ~:4287-4289). ~~The projection's
  Phase-102 absorption is `guardAbsorbed = Math.min(guard, remaining)`
  (~:5977)~~ — **CORRECTED while fixing this row: the site is mislabelled.**
  The Phase-102 add term (~:5977-5984) already called `soakFlatHit`
  correctly. The defective statement was the projection's *own telegraph*
  soak, `const guardAbsorbed = Math.min(guard, remaining)` at ~:5966-5969 —
  no divisor, **and no `playerArmor` either** — so the leftover wall handed
  to `soakFlatHit` is **overstated** and the add term **under-reported**.
  The causal chain the row states is exactly right; only the line label was
  off. The shipped parity suite (`summon.engine.test.ts` ~:528-582) empties
  or denies every telegraph, so it cannot see it.
- **Evidence:** skeptic 20-cell probe (`swift × guard{0,5,10,20,40} ×
  telegraph{10,30}`, two 4-bite adds): `swift=true guard=20 tele=10 →
  projected 3, engine add-bit.dealt 8`; `swift=true guard=40 tele=30 → 3 vs
  8`. All non-SWIFT cells agree. Orchestrator re-read both sites.
- ~~**Latent today, live tomorrow:**~~ — **CORRECTED while fixing this row:
  the SWIFT half is latent; the armor half is LIVE TODAY.** The Jeweled Tree
  has no SWIFT (its auto SWIFT was deliberately dropped), and
  `defaultEnemyStages` SECOND WIND grants SWIFT, so the first boss/unique
  carrier — §8 recommends one — would put the SWIFT half on screen. But the
  same block also dropped the flat `playerArmor` soak, which needs no SWIFT
  at all: the shipped Jeweled Tree against a player holding
  `buff_damage_reduction` (body-elixir / iron-skin-draught, armor 5) reads a
  brood bite the engine does not apply, in a band around `projectedDamage`.
  Both halves shipped closed in one commit — divisor-only left non-SWIFT
  armored cells lying, so the row's own prescribed guard could not be
  written honestly. Note also that SECOND WIND bundles `gain: [{kind:
  'swift'}]` with `threatBonus: 0.15` in the same stage object, and
  `stageThreatBonus` is a *separate*, still-open projection omission: the
  fix makes the staged case strictly closer, not exact.
- **Fix shape:** apply the same divisor in the projection's own absorption
  (`floor(guard / div)` absorbed, `× div` consumed) — this also moves
  `netDamage` for SWIFT foes, which is the *correct* number and a
  pre-existing understatement the brief documents (§4 D-8), so state that
  in the commit. Then rewrite the parity test to run **live telegraphs
  through GUARD** with SWIFT on and off, asserting `addNetDamage ===
  add-bit.dealt` cell by cell. A parity test that only tests the empty
  case is not a ship gate.
  **AMENDED while fixing this row: the divisor alone is not enough.** The
  same block also dropped the flat `playerArmor` soak, so divisor-only
  leaves armored cells wrong — including **non-SWIFT** ones — and the guard
  test this row prescribes cannot then be written honestly. Shipped as one
  `soakFlatHit` call covering armor, divisor and wall together, which also
  moves `netDamage` for every **armored player**, not only for SWIFT foes.

### 3.3 [HIGH · player-visible · confidence 85] Three DENIED surfaces still lie, and a bite plays no hit reaction (Phase 102 surface)

- **Claimed** (PR body headline): "`IntentIcon` printed a bare DENIED …
  fixed; the readout now carries the brood's share."
- **True:** IntentIcon was fixed. Three siblings were not:
  1. `CombatCombatantPane.tsx` ~:666-669 — `else if (denied || (threatFired
     && enemy.intent.damage > 0)) pushEnemy('DENIED', gold)`. A hindered
     summoner phase emits `phase-resolved:clear` + `add-bit dealt>0` and
     **no** `threat-fired`, so a gold **DENIED float** plays while VITAE
     drops.
  2. `selectEnemyActionCard` (presenter ~:1063) — `denied = !fired`; the
     enemy-action reveal card reads DENIED with lines from the foe's
     telegraph only.
  3. Log history (~:1309) prints `PHASE n — DENIED.` on a hindered phase;
     the bite has no line at all (3.4).
  And the medallion/pane damage reactions (~:430, ~:601-602) count player
  damage **only** from `damage-dealt && target === 'self'`; `add-bit`
  matches nothing, so a bite produces no recoil, flash, float, haptic or
  shake. Real stream probe: phase 2 = `dot-tick, threat-fired, add-bit(raw
  8, dealt 8), phase-resolved, hand-drawn`; VITAE 384→333; zero
  self-damage events.
- **Confirm:** write the juice test the skeptic outlined — feed
  `CombatCombatantPane` the REAL event stream (`initializeCombatEncounter`
  with a SUMMON 2 foe, hinder the foe, `resolveThreatPhase`) and assert: no
  gold DENIED float when `add-bit.dealt > 0`; a player hit reaction fires
  for `add-bit`; the enemy-action card does not read bare DENIED.
- **Fix shape:** treat `add-bit` with `dealt > 0` as player damage in the
  pane's fx reducer (a float `−N` in the add colour, the same recoil
  bundle); make `denied` in the three surfaces mean "the foe's own blow was
  denied **and nothing else landed**", printing `DENIED · brood −N`
  otherwise. Same honesty rule IntentIcon now follows.

### 3.4 [HIGH · player-visible · confidence 85] The combat log silently drops every brood event (Phase 102 surface)

- **Claimed** (`e333fbb` brief §4, PR body): the brood is legible through
  its own `add-spawned` / `add-bit` / `add-struck` events.
- **True:** the engine emits them (~:4570, ~:5000-5006, ~:5651).
  `selectCombatLogLines` (presenter ~:1106-1211) and `selectCombatLog
  History` (~:1250-1352) both fall to `default:` and drop them; `grep -rn
  'add-bit\|add-spawned\|add-struck' axiomancer-mobile` → **zero** hits in
  source or tests. `effect-fizzled` (the strike shortfall) is also
  unrendered. The brief's own §4 planned `combat-log-lines.engine.test.ts`
  assertions; the SHIPPED matrix omits that suite with no note.
- **Confirm:** `selectCombatLogLines([{ kind: 'add-bit', addIds: ['x'],
  raw: 8, dealt: 8 }])` returns `[]`.
- **Fix shape:** three log cases (+ the fizzle line), the §4 test, and a
  line in the SHIPPED record saying they were late. House voice: the log
  narrates in the second person and names the foe's keyword in caps
  (`LOG_STAGE_COLOR` and the `enemy-keyword-fired` case are the model).

### 3.5 [HIGH · latent · confidence 85] `detectPlateBox` returns the whole page when nothing reaches `darkPct` — the not-found case it claims to catch (Phase 103)

- **Claimed** (brief decision 4, PR body): "the detector throws on failure
  rather than guessing: `frac < 0.2` means the plate was not found."
- **True:** `span()` (`acquire-art.mjs` ~:251-265) initialises `best =
  [0, len-1]`, `bestLen = -1`, and only overwrites when a run *closes*.
  When **no** row or column reaches `darkPct`, it returns `[0, 1]` — the
  full page — with `frac ≈ 0.96` and no throw. The guard fires only when a
  *small* run **is** found. A blank page and a 120×120 plate on a 1000×1200
  page both came back as full-page crops. Second, longest-run picks
  whichever dark block is *widest*: a 600px book edge beside a 200px plate
  crops the edge (`frac 0.568`, no throw). Neither is in the tree today —
  all three shipped plates were looked at — but the next `plate-page`
  acquisition (the Northern Forest, §8 #2) is one dark two-page spread
  away from shipping a page.
- **Confirm:** the skeptic's synthetic probe — generate a cream page with
  no dark run, call `detectPlateBox`; expect a throw, observe `[0,1]`.
- **Fix shape:** `bestLen < 0` must throw ("no plate detected"); consider
  preferring the run whose *mean darkness* is highest over the longest,
  or requiring the chosen box to be at least `minFrac` on **both** axes.
  And the function is exported "for its own test" that does not exist —
  write it, with the three synthetic pages (tight scan, page-with-margins,
  blank) before the next acquisition.

### 3.6 [MED · process · confidence 95] The baseline stamp names a tree without SUMMON; `baseline:check` is red on `main` (Phase 102)

- **Claimed** (brief DoD, PR body): "baseline regenerated (mechanics source
  moved) — `5a2158a`, confidence full."
- **True:** `git show 5a2158a:…/combat.engine.ts | grep -c SUMMON` → 0. The
  numbers were measured **with** SUMMON in the working tree; the stamp
  (`regen-deck-matrix-baseline.mjs:60`, `git rev-parse --short HEAD`)
  recorded the commit the tree was *at*, not the content. `npm run
  baseline:check` on `main` prints `STALE by 1 mechanics-source commit ·
  e333fbb`.
- **Fix shape:** two commits. (1) Make the regen script refuse when
  `git status --porcelain axiomancer-mechanics/src` is non-empty, so this
  cannot recur; guard it in `scripts/regen-deck-matrix-baseline.test.mjs`
  — **not** in `scripts/check-baseline-freshness.test.mjs`, as this row
  first said: that file executes in no CI job (it is reachable only through
  the root `npm test`, which no workflow invokes), so the guard could never
  have gone red on `main`. Landed 2026-09-20 with both baseline-stamp tests
  wired into `.github/workflows/verify-mechanics.yml` and that job's
  `paths:` filters widened to carry the four files, without which a
  scripts-only change does not even trigger the job. (2) Re-run `npm run baseline:regen` on a clean HEAD **after 3.2 and
  3.8 land** (both move SUMMON cells) and stamp it with a note naming the
  causes — the brief's own risk row 8 asked for "a stamp naming BOTH
  causes" (SUMMON + the dropped SWIFT on The Jeweled Tree) and got neither.

### 3.7 [MED · doctrine · confidence 95 → REFUTED-IN-PART] Phase 99's persistence rationale inverts which layer owns the policy (the commit it cites is real)

- **Claimed** (brief :80-84, `exploration.engine.test.ts` :344-361): Spec 09
  Q4 is resolved at Phase 51 (`4972f9a`) via the engine's `DURABLE_ACTIONS`
  allowlist; mobile "simply never inherited it, because it bypasses the
  reducer".
- **True, as corrected 2026-09-20 by this row's own fix:**
  - **The citation half is REFUTED.** This row shipped saying `4972f9a`
    "does not exist" on the strength of `git cat-file -t 4972f9a` → *Not a
    valid object name*. That proves only that the working tree is a
    **shallow clone** (graft `4b19f2d`, 2026-09-17): 154 of the 161
    hash-like tokens cited across `axiomancer-mechanics/{specs,docs,
    RELEASES.md,CHANGELOG.md}` and `plan/phases` fail identically there.
    The commit is real on `origin` — `4972f9a39ede…`, 2026-05-19, "feat(game):
    Phase 51 — autosave throttling via DURABLE_ACTIONS allowlist" — and all
    four sites citing it are correct. **Commit existence cannot be settled
    in this tree; check the remote.** Any other row in this audit whose
    evidence is a failed `git cat-file` / `git show` / `git log -S` against
    a pre-graft hash is suspect on the same grounds.
  - **The mechanism half is CONFIRMED.** The story is backwards: mobile's
    `wrapDeflectingAdapter` (`state/store.ts` ~:270-287) **swallows every
    engine autosave**, durable actions included, unless inside the explicit
    `store.save()` passthrough. Dispatching `MOVE_TO_NODE` through the
    reducer would *also* not have saved on mobile. Two contradictory owners
    exist: the engine allowlist, and **15** hand-placed `save()` sites in
    mobile (13 checkpoints + the exposed verb + the exit flush — not the
    "seven" this row first counted) behind a comment (~:262-264, "engine
    auto-persists on every dispatch as of 0.5.0 … saves are explicit") that
    is itself stale. Note the pin this row cited does not pin:
    `combat-hud.engine.test.ts` ~:228-238 drives `START_COMBAT`, which is
    **not** a durable action, so it passes with or without the wrapper.
- **Fix shape (first instruction DROPPED — see above):** ~~find the real
  commit and cite it~~ — `4972f9a` already **is** the real commit, and that
  `git log -S` recipe cannot run in a shallow clone (it returns only the
  graft commit), so following it would have replaced four correct citations
  with a wrong hash. What stands: rewrite the test's rationale and the
  brief's decision to say *"mobile owns save timing via the deflecting
  adapter; a move is a checkpoint by mobile policy, guarded here"* — which
  is true — and open the doctrine row (one owner, or two with a written
  rule) in `plan/AUDIT.md` as a `[loop-call]`, per §7.

### 3.8 [MED · measurement · confidence 85] The quality index does not count Conviction spent on the strike tap (Phase 102 sim) — FIXED

- `combat.objective.telemetry.ts` ~:235 accrues `convictionSpent` only from
  `signature-cast`; `add-struck` is invisible to it. Confirmed at source and
  reproduced. Separately the sim's strike block (`combat.encounter.sim.ts`
  ~:463) runs **before** the round's wall is bought, so the matrix
  over-strikes in a known direction. Confirmed: on a board with guard 2 and
  two bite-1 adds the witness paid 4 ◆ for a brood the same phase's own
  wall (+5) took to `addNetDamage` 0.
- **Corrections to this row, from the confirmation pass (2026-09-20).** The
  row as first written overstated three things and they are restated here
  rather than left standing:
  - "scores a strike-spending fight as **zero** Conviction" is literally true
    only when the strike tap is the fight's **only** sink — reproduced
    (board spent 4, ledger 0). On a real jeweled-tree cell the ledger still
    reads whatever the signature casts contributed: a 24-run greedy cell
    charged 38 ◆, 34 of it on 17 strikes, and the ledger read 4. The defect
    is **proportional and silent** (89.5% missing), not a flat zero.
  - The figures `convictionSpent 36→0`, `spine 0.559→0.409`,
    `combatQuality.index 0.711→0.651`, `avgConvictionSpent 0.88→2.18`
    are **not reproducible** and are withdrawn. They came from a baseline
    matrix whose stamp (`5a2158a`, measured 2026-09-19) names a tree without
    SUMMON — the very defect §3.6 files. Direction confirmed on fresh runs;
    magnitudes wait on §3.6's regen.
  - "the matrix over-strikes in a known direction" is confirmed but is **not
    board-independent**. `addNetDamage` soaks against the wall left after the
    foe's own telegraph, so on a big brood (bite 4+9) a +5 wall changes
    nothing and the strike was in fact correct. The honest claim, and the one
    the guard pins, is narrower: the witness **can** pay for a brood the same
    phase answers for free.
  - The two Conviction ledgers do disagree on every SUMMON row, but they are
    two different quantities: the sim's `avgConvictionSpent` is the crude
    proxy `max(0, turn - conviction)` (`combat.encounter.sim.ts` ~:854), not
    a sink census, and it disagrees with the fold off the SUMMON rows too.
    Only the fold feeds the score.
- **Fixed as:** `add-struck.cost` folded into `convictionSpent` (a spend, not
  a cast — `signatureCasts` is left alone); the `strikeAddsAt` decision moved
  out of the powered-play preamble to a bounded pass after the card pass and
  the wind-down, re-projecting after each strike. The alternative the row
  offered — "evaluate it against the policy's projected guard" — was
  **rejected**: it would make the sim predict its own card pass, a second
  speculative model of the thing it is about to do. Reading the wall the phase
  actually ends holding is the truth instead of a guess. Guards:
  `combat-objective.engine.test.ts` (fold arithmetic),
  `combat-sim-policies.engine.test.ts` (the ledger reconciles the board; the
  witness declines a brood its own wall answers).
- **Still open, found here and filed rather than folded in (out of this row's
  scope):** `omen-declared.ante` (`combat.engine.ts` ~:2825) is a **third**
  live Conviction sink the fold still cannot see — two shipped trial cards
  carry `anteConviction: 2` (`Cards/library/trial.cards.ts` :360, :527). The
  docstring on `convictionSpent` names the gap.
- The matrix's jeweled-tree cells all move on this commit — that is §3.6's
  regen, which must FOLLOW it.

### 3.9 [MED · design-reach · confidence 95] The only SUMMON carrier cannot reach wave 2

- The Jeweled Tree has no `stages` field; 21 shipped enemies can fire a
  stage (`KingOfRevenge`, `Kudan`, `Mirac`, `RawheadRex`, `FateSpinner`, …)
  and the sole SUMMON carrier is not one of them. `ADD_WAVE_CAP = 2` and
  the STAGE-gated second wave are therefore dead in play. Not a bug in the
  engine (the tests drive it with a synthetic staged foe) — a coverage gap
  the brief's Follow-ups name as "a second carrier".
  **Corrected 2026-09-20 by this row's own fix**, on two counts. (a) The
  cross-reference was wrong: the second carrier is **§8 Block 2 item 2**,
  not #4 (#4 is add-spawn motion in the fx layer), and it is not the first
  content move — §8 ranks the Northern Forest arena plate ahead of it and
  gates the carrier "after 3.2". (b) "21 enemies do" counted authored
  `stages:` fields; every boss and unique also inherits a two-stage floor
  from `defaultEnemyStages`, and the count survives only because each of
  them authors its own. **Disposition:** recorded, not closed — the
  SHIPPED record's "Engine deviations" now carries it, `plan/CRITIQUE.md`
  has the row, and the carrier retrofit stays §8 Block 2 item 2 for a
  content tick. §4 D-3's pin rode along.

### 3.10 [MED · a11y · confidence 85] "No pair regressed" is false — `rust` text is below AA on the default theme after the palette retune

- Independent WCAG recompute of `4c39360^` vs current `palette.ts`: the two
  advertised gains are exact (blood/bg 4.16→5.39, 3.63→5.72). But
  parchment/bg fell on all five themes, sulfur/bg fell on all five (ashen
  12.52→9.75), heal/bg fell on all five, and **rust/bg and rust/panelBg
  now sit below 4.5 on ashen-gold (the default), coastal-verdant and
  ember-depths** — `rust` is a text colour at 14 `color: AXM.rust` sites
  across 9 components (`ErrorBoundary`, `PrevSessionCrashPrompt`,
  `CombatFriendshipPanel`, …) and is **absent from `READABLE_PAIRS`**. The
  false sentence appears verbatim in `palette.ts:145`, `docs/
  VISUAL_LANGUAGE.md:37-38` and the commit body.
- **Fix shape:** add `rust` to `READABLE_PAIRS` (the test will then fail —
  that is the point), retune `rust` on the three themes to ≥ 4.5 against
  bg **and** panelBg, and rewrite the three sentences to what was measured.
  Also: the retune orphaned `CombatSummaryModal.tsx:17-19` — `defeat:
  '#e01f33'` is the *pre-retune* ashen-gold blood, now on no palette, one of
  six hex literals in that component (§4 C-5).

### 3.11 [MED · truth-in-docs · confidence 95] "No LIVE region falls back any more" is false — the Northern Forest is live and falls back

- `state/exploration-maps/northern-forest.layout.ts:6` → `region:
  'Northern Forest'`; matches none of the six patterns in
  `assets/images/combat/index.ts`. It is a live, encounter-bearing map
  (`map.registry.ts:31`, `encounter.ts:42` routes `nf-` nodes; `content.ts:
  998` is a travel edge to it). The test's `KEYED_REGIONS` simply omits
  it, and the docblocks at `index.test.ts` ~:56-58 ("there is no longer any
  live region among them") and `CombatCombatantPane.tsx` ~:693-694 ("no
  LIVE region takes that path") assert the opposite of the truth. The
  orchestrator wrote both. The brief and catalogue say "6 of 7" correctly
  and even name the forest as the residual; the code comments do not.
- **Fix shape:** either ship the plate (§8 #2, small, unblocked) and make
  the sentence true, or correct the two docblocks and add `'Northern
  Forest'` to the test as the one *expected* fallback with a comment that
  says so. Do not leave a test whose list is the only place the omission
  is visible.

### 3.12 [MED · truth-in-art · confidence 85] The most-seen arena carries legible period signage the catalogue neither describes nor flags

- `arena-desolation.webp` (the fallback), right third at 2.2× brightness:
  **`COMMERCIAL WHAR[F]`** on the right-edge building. Phase 101 decision 7
  dropped a plate for `LLOYD NEWS ONE PENNY` and `ludgate-hill` is flagged
  for the same class; this one is unrecorded. And `docs/art-catalog.json`
  contradicts itself: `_meta.house_register` and `_meta.how_to_use` say no
  entry carries a `coherenceFlag` — `ludgate-hill` still does — and
  `__comment` still says "the ten … (five combat arenas, five map
  backdrops)" while `_meta.scope` says twelve.
- **Fix shape:** view the plate (`Read` the webp), decide (crop the right
  edge via a tighter `inset`/explicit box, or record it as a
  `coherenceFlag` like ludgate-hill), and reconcile the three `_meta`
  sentences with `plates.length`.

### 3.13 [MED · fake gate · confidence 85] Phase 97's chrome-sum guard is hand-typed literals, the tap-to-read hint never shows on the fan it was written for, and two tests execute zero assertions

- `NAME_BAND_LEFT_CHROME = 17.5` is arithmetically right (`faceCard
  borderWidth 1.5 + plateBand paddingHorizontal 6 + plateRarityPip width 5
  + gap 5`). But `CombatBoard.handfan.test.tsx` ~:106-111 declares `const
  faceCardBorder = 1.5; // styles.faceCard.borderWidth` **as literals** and
  never reads the styles — change `paddingHorizontal` to 8 and both the
  constant and the test stay green while every covered name over-wraps.
  The docblock at ~:271-285 promises a gate that does not exist. The
  stage-hint at `CombatBoard.tsx` ~:1548 renders only once a card is
  **staged** (un-fanned) — never while the player looks at the occluded
  fan — and grew to 67 chars inside `numberOfLines={1}` at 12pt with no
  ellipsize mode. `handfan.test.tsx` ~:186-195 renders with `stagedUids=
  {[]}` and guards `if (hint) expect(...)` → zero assertions run; the
  suite's header and brief decision 7 claim `onInspect` is now tested — no
  `fireEvent` in the file, no `expect(cbs.onInspect)`.
- **Fix shape:** export the four style numbers (or read `useStyles()` in
  the test) so the sum is a real gate; render with a staged uid and assert
  the hint; fire a tap and assert `onInspect`; then capture the five-card
  fan at 375×812 with the four long fixture names and decide whether
  `plan/CRITIQUE.md` row (hand-fan overlap, ~:611) is RESOLVED or needs a
  residual — 40.25pt fits ~9-10 uppercase glyphs over two lines, so
  `FROSTBITTEN PALISADE` truncates, it does not read.
- **Independently corroborated.** `/critique` pass 42 (`ed416c8`, landed
  on `main` twenty minutes after the merge, before this prompt was
  written) filed the hint half of this row on its own: *"`[MED]` combat —
  Phase 97's 'tap a card to read it' hint never shows for the truncated
  hand fan it was built to fix"*, with the same gate line quoted. **Close
  that row** when you fix this; do not file a second one.

### 3.14 [MED · dropped ship gate · confidence 85] The enemy figure is still anchored to a static HUD height — the add row can paint over the foe's head

- Brief §1.6 called this a *prerequisite, shipped first*; the SHIPPED
  record does not mention dropping it. `CombatCombatantPane.tsx` ~:866
  `enemyFigureWrap.top: COMBAT_HUD_HEIGHT - 14` (static 148); `onLayout`
  ~:789 only forwards to the board (whose dock spacer **is** measured), so
  the play region moves and the figure does not. `hudRight` now stacks
  IntentIcon + keyword row + status row + add row (3 × 34px) over a wrap
  whose top is 134px. None of the eight `CombatBoard.adds.test.tsx` cases
  asserts `top`.
- **Fix shape:** render 375×812 with PLEA + CHARGE meters, a keyword row, a
  status row and two adds; measure. If it paints over the head, anchor the
  wrap to the measured height (the pane already has the number in hand)
  and add the `top` assertion. Either way, record the deviation in the
  SHIPPED record under "Engine deviations" (§7).

## 4. Refuted, lower severity — fix opportunistically, or file

Grouped by slice; each is one line. Line numbers as reported at `bbd22a9`.

**A — Phase 96 / 97**
- A-1 `village.engine.ts` ~:206-216 re-implements the band gate raw; the
  brief (:48) and `Items/index.ts` :13-16 say presenters import the ONE
  resolver. Call `resolveConsumableHeal` or drop the sentence.
- A-2 There is **no in-combat drink path** (`Combat/types.ts:19` declares
  `'item'`; no engine case; the only drink call is the inventory tab), so
  "below half" is post-fight residue and "the flask stops being carried to
  the end of the run" is unmeasured. `docs/quickstart.md:95` still
  advertises an in-combat `item-use` walkthrough. Decide the lever's
  reach; at minimum correct the brief's outcome sentence.
- A-3 `desperation-band.engine.test.ts` `it.each(HEALERS)` enumerates five
  ids; nothing requires a sixth healer to carry a band. Add the
  library-wide invariant.
- A-4 `useItemAction` discards `desperate`; the post-drink toast says
  "Used."; `actions.ts` ~:964-966 comment is stale.
- A-5 `docs/items.md:185` describes `fv-3` as a shop at 25 shillings;
  `content.ts:970` makes it a rest event. Pre-existing, found on the read.

**B — Phase 98 / 99 / 100**
- B-1 Router "unknown routes are never queued" (decision 4) is false: the
  `isReady` gate (~:190) runs before `parseHref` (~:195); a stray href is
  queued and the `unknown-route` warn fires from the flush. Effect is a
  delayed warn, not a wrong navigation. Move `parseHref` ahead of the
  gate, and add the not-ready unknown-route test.
- B-2 "Not web-only" for the blank-screen race is doubtful: `app/_layout.
  tsx` ~:257-258 lists `(tabs)` before `index` with no `initialRouteName`,
  so natively `index` (and its `<Redirect>`) is never the initial route.
  Either the claim is wrong, or native never shows the title screen —
  verify on a dev client; file whichever it is.
- B-3 MapCanvas's rationale ("the presenter hands a fresh `nodes` array
  every render") is stale: `exploration.engine.ts` ~:355-364 memoises the
  VM on `state.world` (since `d4a51b8`, 2026-09-16). The `focusKeyOf` fix is
  still stricter and correct; the comments at `MapCanvas.tsx` ~:193,
  ~:241-243 and the commit rationale are not.
- B-4 The legend tests assert exactly `counter.sealed === vm.nodes.filter
  (locked).length` (`exploration.engine.test.ts` :719/:735/:750) — the
  expression the commit says it avoided. Fix the prose or count rendered
  glyphs.
- B-5 `CRITIQUE.md:2140` citations (MapCanvas.tsx :67/:221, the test :440,
  the Phase 100 brief) were stale before the PR merged (row is now ~:2198).
  Cite the issue number (#294), never a line.
- B-6 The `save()` catches at `actions.ts` ~:1224 and `SaveOnExit.tsx`
  ~:73-88 swallow silently; route through `getLogger` like
  `reportRouterFault` so a lost save leaves a trace.
- B-7 Five root `npm test` files (`check-naming-law`, `axio-mcp-server`,
  `check-devlog-not-served`, `check-baseline-freshness`, `.claude/hooks/
  telemetry`) run in **no** workflow. Phase 98 closed one CI gap; this is
  the next. **Four, as of 2026-09-20:** row 3.6's fix wired
  `check-baseline-freshness.test.mjs` — and the new
  `regen-deck-matrix-baseline.test.mjs` beside it — into
  `verify-mechanics.yml`. The remaining four are still unrun.

**C — Phases 101 / 103, catalogue, palette, e2e**
- C-1 `arena-desolation`'s `used_by` / `replaces` were hand-edited after
  the script ran (the acquire script writes one `used_by` entry and no
  `replaces`); "records written by the script, not by hand" is overstated
  for that one record. Harmless; say so.
- C-2 `asset-provenance.test.mjs` :64 still cites the retired per-file
  form as an example; the require regex at ~:164 is single-quote-only
  (latent); `mean * 0.82` at `acquire-art.mjs` :238 is an undocumented
  second threshold.
- C-3 e2e residual: after WITHDRAW the tab bar is restored in the
  `closeEncounterModal` commit and the cutscene is pushed only after
  `setTimeout(0)` + two more commits, so the tab-bar `waitFor` can still
  win the race and reproduce the old sampled path. Timing-dependent; the
  fix held in CI once. Watch it; if it reds again, wait for the
  cutscene's *absence* to be confirmed by the tab's route, not by the bar.
- C-4 The `Promise.race` unhandled-rejection worry is **refuted** (race
  subscribes to every input; reproduced clean on Node 22). No action.
- C-5 `CombatSummaryModal.tsx` :17-19, :75 carries six hex literals
  including the orphaned pre-retune blood — against `VISUAL_LANGUAGE.md:
  203`; grep for the five old blood values across components.
- C-6 `detectPlateBox` / `buildPlatePage` have zero tests despite
  "exported for its own test" (see 3.5).

**D — Phase 102 engine**
- D-1 The bite feeds `enemyDamageThisTurn` / `enemyDamageLastRound` — the
  comment calls it "a decision on record", but the record names no
  consumer. It changes `every-stone-an-oath` (~:5113, barrier 0 vs 12 in
  the probe) and **eleven** library cards on `enemy-drew-blood` /
  `enemy-dealt-no-damage-last-round` (`vigil` ×8, `apocrypha` ×2, `trial`
  ×1). Probably correct — the player *was* hurt — but rule on it in the
  atlas and pin one predicate + the zone in `summon.engine.test.ts`.
- D-2 The brood's BARRIER drain emits no `barrier-absorbed` / SWIFT event
  from `soakFlatHit`; the telegraph loop's equivalent does.
- D-3 Nothing pins The Jeweled Tree's authored keyword list (HIDE 5 +
  SUMMON 2, no SWIFT) but the baseline. Add a mechanics test.
  **Done 2026-09-20 with row 3.9** — `axiomancer-mechanics/src/Enemy/e2e/
  new-enemies.engine.test.ts`, three pins against `defaultEnemyKeywords`
  rather than against literals: SUMMON present with a named brood, the
  hand-relisted HIDE at no less than the rank's default (the retrofit is
  not a silent nerf), and the rank's auto SWIFT absent.
- D-4 Hygiene: unused `_rng` on `strikeAdd`; the strike shortfall reuses
  `effect-fizzled` with `cardId = add id, effectId = ''` — give it its own
  event or document the reuse; the atlas says `2` where it should name
  `STRIKE_ADD_COST`.
- D-5 The brief's banner says "the `## SHIPPED` section"; the heading is
  `# SHIPPED — 2026-09-19` (H1). Cosmetic; align.

**E — Phase 102 surface**
- E-1 `AddChips` reuses the `EffectChips` shell (same 34×34 `chip`, same
  badge) and is mounted **last** in `hudRight`; brief §3 step 15 said a
  distinct shell, mounted first after IntentIcon. The docblock argues
  colour + own row suffice — fine, but the SHIPPED record must say it was a
  deviation.
- E-2 `ADD_COLOR '#b4543f'` is a fourth red (threat register is
  `INTENT_ICONS.damage.color '#e2543b'`; tokens are `blood`/`rust`); with
  `coastal-verdant` re-theming rust to teal, the chip stays oxblood.
  `CLAUDE.md` "no hex literals" is unenforced (no eslint rule; ~10 hex
  constants already in the file). Pick a token or add the lint; do not
  add an eleventh precedent.
- E-3 The keyword plaque footer prints `intensity 2 · 0 turns left` for
  SUMMON 2 (pre-existing for HIDE n). No tutorial/coach step mentions
  SUMMON, adds or the strike verb.
- E-4 The STRIKE/WAIT sheet end-to-end has zero tests: render the panel
  with a summoner state at `conviction = STRIKE_ADD_COST - 1`, press the
  chip, assert the button's `accessibilityState.disabled` and unchanged
  state; at 12, assert `strikeAdd` was applied.
- E-5 `strikeAddCost` / `canStrikeAdd` on the VM have no component
  consumer — make the sheet read them (one price source) or drop them.
- E-6 `/combat-encounter` hard-mounts the mock foe (hide 4 + ravenous), so
  `/critique` and `verify:visual` can never see a chip. Add an `?enemy=`
  or `?summon=1` param, or a seeded Jeweled Tree fixture id in
  `docs/state-fixtures.md`'s registry.
- E-7 The feature commit flipped the 3 000-line presenter CRLF→LF, so
  `blame` now points at `e333fbb` for every line; 16 mobile files remain
  CRLF and there is no `.gitattributes`. Add `* text=auto eol=lf` **in its
  own commit**.

## 5. What held — spot-check, do not redo

Verified once by an independent skeptic with the evidence recorded; a
second full pass is not a good use of the session. Re-check any of these
only if a §3 fix touches it.

- 96: band read off the *incoming* snapshot before heal; strictly-below-
  half; degenerate `maxHealth` never desperate; five potions at exactly
  1.5×; band-less consumables byte-identical; only production caller is
  the `USE_ITEM` reducer; rest heals untouched.
- 97: `handFanLayout` body byte-identical between `cecae8f~1` and
  `cecae8f`; C11-R / C11-R2 describes present and green; 375×5 arithmetic
  (step 57.75, peek 40.25) correct.
- 98: both worklet steps present in `verify-mobile.yml` with the path
  filters.
- 99: pending-navigation queue is last-wins, replayed once, cleared before
  dispatch; `SaveOnExit` feature-detects the listener on both platforms.
- 100: `focusKeyOf` is order-independent, ignores `locked`/`completed`,
  stable on an empty map; the legend and pips now read one array.
- 101/103: every shipped plate's licence field was read from Commons
  extmetadata (`license_verified` present on all seven records);
  `ACCEPTED_LICENCES` refuses CC BY; the two new provenance gates fail on
  their conditions (reproduced); the `Promise.race` fix is not a loosening.
- 102 engine: bite outside the loop and outside `!hindered`; no attack
  ledger touched (four-assertion isolation gate vs a control run); no
  RAVENOUS off the bite; `spawnAddWave` consumes no RNG (counting-rng
  test); `adds`/`addWavesSpawned` survive every `next` rebuild; `strikeAdd`
  identity no-op returns the same reference; STAGE cleanse leaves adds
  standing; `netDamage` byte-unchanged; `checkImmediateOutcome` reads
  `state.enemy` alone.
- 102 surface: chips on the enemy pane; badge is the bite; unaffordable
  chips tappable, sheet disables STRIKE; IntentIcon never prints bare
  DENIED with `addNetDamage > 0`; presenter forwards the bite verbatim past
  `stageThreatBonus`/`enemyThreatMult`; `STRIKE_ADD_COST` imported.

## 6. Method

1. **Sync and stamp.** `git fetch origin main && git checkout -B
   claude/burn-day-audit origin/main`. `npm run baseline:check` — record
   the line verbatim in your report. Run both verify gates **once, now,
   foreground**, so you know the tree is green before you touch it (if it
   is not, that is finding zero — stop and report).
2. **§3 in order, one commit each.** For each row: run the confirmation
   recipe → if it reproduces, write the guard test **first** (it must fail),
   then the fix, then run the affected package's gate → commit with a
   message whose body names the row (`audit 3.2 — …`) and the sentence it
   corrects. If it does not reproduce, record what you ran in §9's table
   and move on. **Never** skip, loosen, quarantine or `.only` a test to get
   green; a test that stops asserting is worse than a red one.
3. **Corrections ride the fix.** Every false sentence a row names is
   rewritten in that row's commit (§7 has the full list). No "will fix the
   docs later".
4. **§4 as you pass.** A §4 item that a §3 fix already touches goes in
   that commit. The rest: fix if under ~30 lines and obviously right; else
   file (§7). Do not widen a commit to chase a §4 item that is not in its
   files.
5. **Re-stamp last.** 3.6's regen runs after 3.2 and 3.8, on a clean
   HEAD, as the final mechanics commit. It takes minutes; run it foreground.
6. **Push, PR, watch.** `git push -u origin claude/burn-day-audit`, open a
   ready-for-review PR against `main` using `.github/PULL_REQUEST_TEMPLATE.
   md` (mirror its headings; paste real gate output; no secrets section
   content beyond the diff), subscribe to it, and drive it to green. Do not
   merge; T merges (auto-merge is off repo-wide).

Budget guidance: §3 rows 1-4 are each an hour of careful work with a
guard test; 5-14 are twenty minutes each; §4 is an afternoon of small
commits. If the session is time-boxed, **stop after §3 row 6 with §7 and
§9 done** rather than half-doing §4 — an honest plan beats a wider diff.

## 7. Filing contract

**Rows.** Anything confirmed and not fixed gets a `plan/CRITIQUE.md`
Pending row in the `/critique` shape (`### [SEV] area — one line`, then
`- pass:`, `- viewport:`, `- category:`, `- observation:`, `- evidence:`,
`- suggested fix:`, `- source: burn-day audit 2026-09-19`). Severity: 3.1–
3.5 are `[HIGH]`; 3.6–3.14 `[MED]`; §4 `[LOW]` unless you find it bites.
Process findings (3.6's stamp rule, 3.7's two-owner persistence) go to
`plan/AUDIT.md` Pending as `[loop-call]` rows, not CRITIQUE.

**Sentences to correct** (each in the commit that makes it true, or one
docs commit at the end):
- `plan/phases/phase_102_summon_adds_archetype.md` — DoD "baseline
  regenerated" (3.6); SHIPPED matrix must list the log-lines suite once
  it exists (3.4); "Engine deviations" gains the dropped figure anchor
  (3.14), the shell/mount deviation (E-1), the wave-2 unreachability
  (3.9); the banner's `## SHIPPED` → `# SHIPPED` (D-5).
- `plan/phases/phase_103_the_last_two_arenas.md` — decision 4 (3.5);
  Follow-ups gain the signage (3.12).
- `plan/phases/phase_99_returning_player_can_return.md` — :80-84 (3.7);
  the "not web-only" sentence pending B-2.
- `plan/phases/phase_97_hand_fan_name_legibility.md` — decision 7 and the
  outcome sentence (3.13).
- `plan/phases/phase_96_consumable_desperation_band.md` — :48 (A-1); the
  "deferred regen" note is stale (the regen happened at `f1cdbba`); the
  outcome sentence (A-2).
- `axiomancer-mobile/assets/images/combat/__tests__/index.test.ts`
  ~:56-58 and `CombatCombatantPane.tsx` ~:693-694 (3.11).
- `CombatBoard.tsx` ~:271-285 and `CombatBoard.handfan.test.tsx` header
  ~:24-26 (3.13).
- `exploration.engine.test.ts` :344-361 (3.7); `MapCanvas.tsx` :67, :193,
  :221, :241-243 and `MapCanvas.test.tsx` :440 (B-3, B-5).
- `palette.ts:145`, `docs/VISUAL_LANGUAGE.md:37-38` (3.10).
- `docs/art-catalog.json` `__comment`, `_meta.house_register`, `_meta.
  how_to_use` (3.12).
- `state/store.ts` ~:262-264 stale "0.5.0" comment (3.7).
- `combat.engine.ts` add-block comment "a decision on record" — add the
  record (D-1).

**Bookkeeping twins** (one docs commit): `plan/CRITIQUE.md` ~:763 still
says "commit pending" for the post-combat-ACCEPT crash row — cite
`51fede4`; `plan/AUDIT.md` :279 `[5.9]`, :326 `[3.0]` and :1587 `[tests]`
are un-ticked while their CRITIQUE / Top-5 twins are RESOLVED; `plan/steps/
01_build_plan.md` rows 102/103 cite subjects only — add `e333fbb`; split
the `[x]` heading at `CRITIQUE.md` ~:556 from its open `[needs-user-call]`
at ~:575 so triage sees the open decision.

**What you do not touch.** Narrative content (THE BLANK PAGE). The SUMMON
numbers (N, bite fraction, cost) — measure first (3.6), tune later. The
palette's *identity* per theme — 3.10 is a contrast fix on one token.

## 8. What to work on next — the recommendation

Ranked by player-visible impact, then whether it is unblocked, then size.
The first block is this audit; the day's shipped work is not "done" until
it is true. Confidence is the orchestrator's on the *ranking*, not the
item.

**Block 1 — make today true (this session).** 3.1 (skip-a-fight by reload:
the only new *regression* on the list), 3.3 + 3.4 (the DENIED lie was the
PR's headline and three of four surfaces still tell it), 3.2 (the ship
gate), 3.6 + 3.8 (measurement), 3.10 (default-theme text below AA). Size
M in total. **Confidence 90.**

**Block 2 — finish the two archetypes the day opened (next 1-3 ticks).**
1. **Northern Forest arena plate** — 6/7 → 7/7 and 3.11 becomes true by
   construction. S, unblocked, most-seen remaining fallback (the forest is
   the second map). Fix 3.5 first or you will crop a page. **90.**
2. **A second SUMMON carrier that has `stages`** — so wave 2 exists in
   play and the SWIFT path (3.2) is exercised on a real foe. `Mirac` and
   `RawheadRex` are already in the mid-stage matrix roster beside The
   Jeweled Tree; either is a one-keyword retrofit under THE GROWTH FLOOR.
   S, unblocked; after 3.2. **85.**
3. **Close `projectIncomingThreat`'s six boss-side divergences** — the
   wall number understates against exactly the foes where it matters
   (staged, SWIFT, BRUTAL); 3.2's fix is the first of the six. M,
   unblocked, its own tuning change with a before/after sweep. **80.**
4. **Add-spawn / add-struck motion** in the fx layer — the one archetype
   that changes the enemy side's shape does it silently; 3.3's fix lays
   the event plumbing. S. **75.**

**Block 3 — the map, again (small, player-visible, unblocked).**
5. Off-viewport path affordance (Phase 100 Follow-up). S. **70.**
6. Quest acceptance as an explicit checkpoint (Phase 99 Follow-up) — the
   exact loss the unfiled report described, and 3.1's fix makes the save
   sequence explicit enough to add one more site cleanly. S. **75.**
7. `wearer` → drinker on two consumables (`CRITIQUE.md` ~:586). Two
   strings, lexicon-guarded. **95** that it is trivially right; **60**
   that it is worth a tick on its own — ride it on any Items commit.

**Needs T (do not do; ask via `/oversight`).**
8. **The `[needs-user-call]` process row** (`CRITIQUE.md` ~:575): where
   hand-written playtest reports get filed so the loop can see them. Three
   options are written — (a) a CRITIQUE row in the same commit, (b) teach
   `/iterate`/`/march` triage to sweep `*/docs/reports/*.md`, (c) route via
   `/jot`. The orchestrator recommends **(b)**: it is the only option that
   does not depend on the human remembering, and the sweep is a twenty-line
   addition to the triage step. THE OPEN GATE ¶1 technically lets the loop
   decide this as a `[loop-call]`, but the row was filed for T on purpose
   and should stay that way. **Confidence 80** on the recommendation.
9. **The story-outline session** (`plan/2026-09-17-story-outline.prompt.
   md`) — not started; `content/story/story-overview.md` does not exist at
   HEAD. Every narrative candidate stays frozen behind it by THE BLANK
   PAGE, and it requires an attended session with T by design. Not a loop
   item. **95** that it is blocked; no opinion on when.

**Explicitly not recommended next.** The 32 unscored `PHASE_CANDIDATES`
rows (Appendix A of the plan-state read): several are superseded by THE
BIG NUMBERS REWRITE and should be struck rather than built (enemy
budget-curve compliance, doctrine-curve baseline check, enemy themed
decks); one is a stale duplicate of a promoted phase (in-house crash
capture, ~:1485 vs Phase 77). A `/consolidate` pass over that file is worth
more than any single row in it. **70.**

## 9. Output contract

The session is done when all of the following exist on the branch and the
PR is open and green:

1. **One commit per confirmed §3 row**, each with its guard test, and a
   final regen commit (3.6). Message subjects `audit 3.N — <what>`.
2. **Every §7 sentence corrected**, and the bookkeeping twins closed.
3. **A `plan/CRITIQUE.md` row for each confirmed-not-fixed item**, and
   `plan/AUDIT.md` `[loop-call]` rows for the two process findings.
4. **The PR body carries the truth table:** one line per §3 row and each
   §4 item you touched — `row · claim · verdict (reproduced / not
   reproduced / already fixed) · action (fixed @sha / filed @row / no
   action because …)`. This table is the audit's deliverable; the diff is
   its evidence. Paste real gate output under Verification; if a gate was
   not run, say so.
5. **`npm run baseline:check` prints FRESH** on the branch head, and the
   stamp note names both causes.
6. **A one-paragraph note under the PR's Callouts** saying which §3 rows
   did *not* reproduce and why, so the next reader does not chase them.

Do not end the session with an uncommitted fix, a pushed branch without a
PR, or a §3 row with no disposition.

---

## Appendix A — commit map, 2026-09-19 on `main`

In scope (burn day, this session):

```
bbd22a9 20:04  Merge PR #344
e333fbb 19:49  feat: SUMMON archetype and the last two arenas — phases 102-103
01c70ce 19:15  Burn day — phases 96-101 (#342)  (merge)
5a2158a 18:07  fix(e2e): close the sampled race in the exploration round-trip journey
4c39360 18:00  feat: story-art catalogue, and retune the palettes to the plates
13fac67 17:08  plan: phase 101 shipped
e4e2704 17:08  feat(mobile): every settled region fights on its own ground — phase 101
3abcadf 16:57  phases: write up the SUMMON design as a brief
d266066 16:53  refactor(mobile): pair each arena plate with its own alt text
59a65fe 16:45  candidates: settle the summoner design; strike the shipped consumable row
f1cdbba 16:44  baseline: full re-measure at a3b91f3 after the phase 96 mechanics change
a3b91f3 16:42  plan: phase 100 shipped; file the unfiled playtest report
42d2ba2 16:42  fix(mobile): the map tells the truth — phase 100
b57046f 16:42  phases: brief for phase 100
b9acf40 16:36  plan: phase 99 shipped
fd83aa0 16:36  fix(mobile): a returning player can actually return — phase 99
2dcbabc 16:36  phases: brief for phase 99
263cf96 16:23  plan: phase 98 shipped
51fede4 16:23  ci(mobile): enforce the Reanimated worklet guard — phase 98
30fcf37 16:19  plan: phase 97 shipped
cecae8f 16:18  fix(mobile): the hand fan stops covering its own card names — phase 97
accf9fc 16:16  phases: brief for phase 97
55aa6d4 16:11  plan: phase 96 shipped
417b931 16:10  feat(items): consumable desperation band — phase 96
eebb76b 16:10  phases: brief for phase 96
```

Out of scope (the loop's own ticks, same date — listed so you can tell
them apart): `3017e98` triage; `4db3ea3`/`23383f1`/`6b7b8a9` PR #341
(agent-swarm prompt, Playwright-journey CI gap); `0226eba` expand 18;
`e38d723`/`0f9dd76` adjust-keywords 13; `655edc6` digest; `f79207c`/
`181a84e` adjust-enemies 13; `3bde06b`/`4694236` adjust-equipment 13;
`f61f949`/`30e2e11` adjust-cards 13.

## Appendix B — reproduction recipes the first pass used

Sketches, not scripts; each ran in a scratch file and was deleted. Rebuild
as the guard test where §3 says so.

- **3.1 reload-past-encounter.** `createAppStore({ adapter:
  createMemoryAdapter() })`; `createAppActions(store)`; count adapter
  saves; `moveTo('fv-2')`, `('fv-11')`, `('fv-13')`; assert save count
  rose on the last; `createAppStore` again on the same adapter; read
  `world.currentMap.currentNodeId`, the three onward nodes' kind,
  `currentEncounter`, `completedNodes`.
- **3.2 SWIFT parity cells.** For `swift ∈ {F,T}`, `guard ∈ {0,5,10,20,40}`,
  `telegraph ∈ {10,30}`: build a state with two 4-bite adds, the foe's
  current phase dealing `telegraph`, `state.guard = guard`; read
  `projectIncomingThreat(state).addNetDamage`; `resolveThreatPhase(state,
  () => 0.5)` and read the `add-bit` event's `dealt`; assert equal.
- **3.3 real stream.** `initializeCombatEncounter(player, { …mockFoe,
  level: 20, keywords: [{ kind: 'summon', n: 2 }] }, CARDS, 7)` →
  `rollEncounterDice` → `resolveThreatPhase` → `processBetweenPhases`
  (wave spawns) → apply a stagger to hinder → `resolveThreatPhase`; feed the
  events to the pane as `fx`; assert on the float queue.
- **3.5 synthetic pages.** With `sharp`: a 1000×1200 cream raw buffer; (a)
  no dark pixels; (b) a 120×120 dark square; (c) a 600px dark left edge +
  a 200px dark plate. Call `detectPlateBox` on each; expect throw / throw /
  the plate — observe `[0,1]` / `[0,1]` / the edge.
- **3.10 contrast.** `git show 4c39360^:axiomancer-mobile/theme/palette.ts`
  to a scratch module; WCAG relative luminance per token; ratio for every
  `(text, bg)` and `(text, panelBg)` pair on all five themes, old vs new;
  print every pair that fell and every pair below 4.5.
- **3.6 stamp.** `git show 5a2158a:axiomancer-mechanics/src/Combat/
  combat.engine.ts | grep -c SUMMON` → 0.
- **3.7 citation — THIS RECIPE IS INVALID, corrected 2026-09-20.**
  `git cat-file -t 4972f9a` → not a valid object, **in a shallow clone**,
  which every working tree here is. It shows nothing about the commit:
  154/161 hashes cited in repo prose fail the same way. `4972f9a` exists on
  `origin` (verified 2026-09-20). Check hashes against the remote, never
  against this tree.
