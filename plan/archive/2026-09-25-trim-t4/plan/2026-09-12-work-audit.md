# Work audit — 2026-09-12

Scope: every commit that reached `main` between `72881ac` (exclusive, 02:51Z)
and `baaba03` (inclusive, 00:50Z 09-13) — the owner's local day (UTC−4).
Method: git history, GitHub Actions history, the full verify gate re-run
locally on `baaba03`, and three independent diff reviews (PR #301, PR #302,
bot ticks + plan docs).

## Ledger

| Stream | Commits | Files | Lines |
|---|---|---|---|
| Whole day | 76 (62 Claude, 14 claude[bot]) | 127 | +11 969 / −471 |
| Code only (no `*.md`, `plan/`, telemetry) | — | 114 | +6 491 / −444 |

PRs merged: #300 (fresh-eyes prompt), #301 (FE-001..028, 27 findings),
#302 (FE-029..058, 30 findings + 10 regression repairs), #303 (pitch-session
prompt), #304 (content pitches: 14 pitches, 3 tentpoles, 34-row ladder).
Bot ticks direct to `main`: adjust-equipment ×2, adjust-enemies, adjust-keywords,
adjust-npcs, adjust-cards, iterate ×2, critique.

## Gates

| Gate | Result |
|---|---|
| CI on `baaba03`: verify-mechanics / verify-mobile / close-trailers | green |
| CI on every earlier `main` push today | green (path-filtered where nothing relevant changed) |
| Local `verify -w axiomancer-mechanics` | green — 212 files / 3 422 tests, build ok |
| Local `verify -w axiomancer-mobile` | green — 297 suites / 2 844 tests, assets + art ok |
| Root `npm test`, `lint:content` | green — 123 / 123; prose + naming clean |
| `baseline:check` | STALE by 2 commits (`5282cc0`, `df6e98f`) — both string-only, no sim effect; `91f9895` records why it was not regenerated |

Bot-tick claims verified: the five "zero-diff re-audit" passes touch only
`TELEMETRY.md` + `plan/CONTENT_LEDGER.md`; every ledger "shipping commit" SHA
resolves to the right tick; `2dc459b` (as-any removal) is type-correct and
behaviour-preserving; `3c39acb` is a pure test-title fix (SENTENCE→PERORATION).

## Findings

| Sev | Where | Finding |
|---|---|---|
| MED | `axiomancer-mobile/state/presenters/rest.copy.ts:38-42` (FE-024, #301) | `restOfferDesc` prints `round(max × fraction)` without the engine's `healCap = max − health` clamp (`restchoice.engine.ts:115-117`). At 170/175 the offer says "Restores 44 VITAE", the engine heals 5. Same promise-vs-payoff class the sweep set out to fix; a rule re-derived in a presenter. |
| MED | `axiomancer-mobile/components/EventGate.tsx:36-41` (#302) | Push latch keys on route and clears only when `pending` goes null. Android hardware back on `/cutscene` `/dialogue` `/village` pops the modal (`HardwareBackHandler` locks only combat/rest), the pending event stays, nothing re-pushes — player parked on the tabs with an unshown event. The old double-push masked this. |
| MED | `app/(tabs)/character/index.tsx:306` + `state/presenters/character.engine.ts:401` (#302) | New legend "arrears at 2 or below" words a tic hard-coded at grace 2 (moral ≈ −60), while `/memoir` puts IN ARREARS at moral ≤ −34 (`memoir.engine.ts:275`). Two surfaces now name two thresholds for one band. |
| MED | `6924eba` (iterate) | Tick logged "handing to expand"; no `expand` telemetry row and no `PHASE_CANDIDATES` change followed. Handoff announced, not executed. |
| MED | march run 369 (22:26Z) | Dispatched adjust-enemies, spawned one subagent, then ended its turn waiting on a background verify (the standing-rule-3 hang). Exit "success", 23 turns, ~$1.56, no commit, no telemetry row. Silent no-op. |
| MED | `skills/march.md` §3b, `skills/adjust-*.md` | Six adjust-* ticks today, all Zero-CREATE; cards and equipment at 5 consecutive empty passes. No back-off rule exists, and the ≥15-commit half of the gate is satisfied by the sweep's own commits, so the loop re-audits identical content roughly every 2 h. |
| LOW | `state/e2e/character.engine.test.ts` (FE-015, FE-017), `CombatEncounterPanel.fe025.test.ts` | Three #301 tests pass with the fix reverted: they assert the unchanged view-model, not the screen change. FE-026 has no test. |
| LOW | `state/presenters/rest.engine.ts:118` | `restDisplayHealth` clamps at `maxHealth`; the host applies at `maxHealth + scarMended`. Readout under-reads after an inn rest with a scar. |
| LOW | `state/presenters/village.engine.ts:168-218` | `wareEffectLine` renders a subset of payload kinds; a ware carrying DoT / reflect / roll-modifier prints '' or a half-truth. |
| LOW | `axiomancer-mobile/scripts/fresh-eyes-capture.mjs` | Header says "THROWAWAY … delete before the final commit"; shipped (171 lines + a `.gitignore` entry). |
| LOW | `CLAUDE.md` | Calls `TELEMETRY.md` append-only; the hook rotates at 400 rows, so every tick deletes old rows. Wording, not behaviour. |
| LOW | `030e26a` | adjust-equipment pass 8 has `/march` rows but no `adjust-equipment` skill row (pass 7 had one). |

Verified sound: all 10 regression repairs in #302 restore prior behaviour
rather than loosen tests; the re-pinned constants are consequences of the
fallback band, not weakenings. No `.skip` / `.only` / deleted tests anywhere in
the day. The world-content diff (`df6e98f`) is pure quote-glyph substitution.
Spot-checked commit messages (5 in #301, 6 findings in #302) match their diffs.

## Fixed in this PR (owner's call, 2026-09-13)

The three MED code items ship here, each one file plus a test:

- **Rest heal copy** — `previewRestChoiceHeal(session)` added to the engine
  (`restchoice.engine.ts`, exported through the barrel) and used by
  `chooseRestChoiceOffer`; `restOfferDesc` now words that number instead of
  re-deriving it. Engine suite + `rest-offer-heal-cap.audit.test.ts` pin
  170/175 → "Restores 5 VITAE".
- **Android back on a paced event** — `HardwareBackHandler` locks while
  `selectHasActivePacedEvent` is true, the same doctrine as the rest node.
  Three new cases in `HardwareBackHandler.test.tsx` (paced locks, resolves
  unlocks, combat-prelude does not lock).
- **Arrears threshold** — `graceTrack(meter)` in `character.engine.ts` derives
  the tic from `AXIS_LOW_THRESHOLD` (33% of the track) and the fill from the
  raw meter; both surfaces use it; the legend names the mark, not a tenth.
  `grace-track.audit.test.ts` proves `inArrears` agrees with `bucketAxis` at
  every meter value.

The three loop items (unexecuted expand, silent march tick, no adjust-*
back-off) and the six LOW items are not fixed here.

## Verdict

Everything on `main` is green and the shipped claims are honest. Risk is
low-to-medium: three user-facing copy/flow defects introduced by the sweeps
(rest heal overstated, Android back strands a paced event, two arrears
thresholds), plus a loop that spent two ticks producing nothing and one that
exited mid-work. None blocks; all three MED code items are one-file fixes.
