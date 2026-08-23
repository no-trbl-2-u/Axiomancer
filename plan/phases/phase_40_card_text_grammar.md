# Phase 40 — Card-text grammar + full copy pass

> Agent-facing brief. Runs against `axiomancer-mechanics` (card library +
> the paid-summary honesty guard) and `axiomancer-mobile` (the keyword
> glossary + its lint). Generated at ship time, 2026-08-23, per
> `skills/plan-a-phase.md` §5 — written and executed in the same tick
> (`skills/ship-a-phase.md` §9 covers a missing-brief phase; the phase's
> own row explicitly deferred scope confirmation to "whatever #193 ships",
> so the brief-writing pass reads #193's diff and the current library
> before locking anything below).

## Why this phase is actionable now (resolved deps)

The build-plan row named two blocking deps and one re-scope condition, all
now satisfied:

- **44a-44i (the retheme)** — shipped 2026-08-22. The card set this pass
  writes copy for is the 57-card Profane Canon, not the retired 86-card
  library.
- **"the card redesign T reported in flight 2026-08-08"** — that redesign
  *was* the retheme (44a-44i); nothing separate is still in flight.
- **PR #193 ("strip the prose off the card face"), merged 2026-08-10** —
  moved the authored PAID sentence, the type strip, and the printed die
  lines OFF the glance card FACE and onto the **inspect overlay**. The face
  now prints only `KEYWORD` over its value (`CombatCardFace` /
  `paidValueFor` in `axiomancer-mobile/components/combat/encounter/CombatBoard.tsx`).
  This re-scopes the whole phase: the templating grammar governs the
  **overlay's authored sentence** (`Card.paidSummary` / `Card.persistentEffect`
  in `cards.library.ts`) and the **mobile glossary prose**
  (`KEYWORD_GLOSS` / `SYSTEM_GLOSSARY` in `state/combat/keywords.ts`), not a
  face that no longer carries any authored prose.

## Decisions made upfront — DO NOT ASK

1. **The templating grammar's home is `docs/card-frame-legend.md`** (the
   doc that already owns "the frame every card shares"), not a new file —
   added as a `## Card-text grammar` section with the seven clause shapes,
   the punctuation/vocabulary bans, and the budget. See that doc for the
   full text; this brief does not repeat it.
2. **"The 12 before→after rewrites" is read as "the full pass, evidenced by
   12+ examples"**, not "only 12 cards touched". The live library has 45
   spells carrying `paidSummary` and 12 oath/hex cards carrying
   `persistentEffect` (57 authored strings total). A hard em-dash/semicolon
   lint over a 12-card subset would leave the other 45 authored strings
   failing the same lint it claims to enforce — that is not a lint, it's
   theater. Scope is: **every** `paidSummary` / `persistentEffect` string
   that violates the grammar (31 of 57 did) gets rewritten; the commit body
   documents a representative sample as the "before→after" evidence.
3. **"Author the 4 machine-text faces (straw-mans-jab renders raw 'bleed i2
   d2')" is MOOT, not owed.** `straw-mans-jab` was retired at Phase D8 (see
   `plan/phases/phase_39_curve_repair_and_symmetry.md` — explicitly NOT
   restored) and does not exist in the current 57-card library. Checked:
   every current oath/hex card (the only cards that can lack a
   `paidSummary`, since a `persistentEffect` fallback exists) carries an
   authored `persistentEffect` — **zero** live cards fall through to the
   raw `paidText()` telegraphese this sub-item was written against. Added
   a durable regression guard instead (`paid-summary-honesty.engine.test.ts`
   "no card face prints a raw decimal") so a future card that DOES fall
   through gets caught structurally.
4. **Sub-call "drop PERORATION from the-closing-word's face" is ALREADY
   SATISFIED**, pre-dating this phase. `the-closing-word` retheme-renamed to
   `the-black-cap`; its `peroration` mechanic prints `SENTENCE at N` on the
   face today (`combat.cards.ts` `mechanicText` case `'peroration'`), not
   the literal word `PERORATION` — that swap shipped at phase 29 (KW-2/
   KW-3), well before this ruling. No `PERORATION` string exists anywhere
   in `axiomancer-mechanics/src` or `axiomancer-mobile` today. The
   `SYSTEM_GLOSSARY` row for `SENTENCE` stays, per the ruling. No-op,
   documented.
5. **Sub-call "reprice the-overtake's `fuelPerPip` 3.5 → integer" is ALSO
   MOOT.** `the-overtake` retheme-renamed to `communion-of-the-worm`
   (comment trail: `PLAIN = 'communion-of-the-worm'` in
   `legibility-sweep.engine.test.ts`); its live `rupture` mechanic carries
   **no** `fuelPerPip` at all (`{ kind: 'rupture' }`, bare). The only place
   `fuelPerPip: 3.5` still exists is a synthetic test fixture
   (`FIXTURE_PIP_RUPTURE` in the same file) exercising the engine branch —
   not a card face, so it never renders a decimal to a player. No repricing
   needed; documented as satisfied by the retheme dropping the field.
6. **"The foe" fixed vocabulary applies to every authored `paidSummary` /
   `persistentEffect` string and to the mobile `KEYWORD_GLOSS` /
   `SYSTEM_GLOSSARY` prose** — both surfaces an authored human wrote. It
   does **not** extend, this pass, to the ENGINE's own generated strings in
   `combat.cards.ts` (`statePredicateText`'s `UNMOVED`/`enemy-drew-blood`
   clauses, the hex `Attaches to the enemy.` suffix, `lock_stance` /
   `boost_all_dots` mechanic text) or the mobile presenter's per-mechanic
   `verbLine` prose (`combat-encounter.engine.ts` `mechanicHeadline`) — both
   are a materially larger, separately-reviewed surface with no lint
   governing them today. Filed to `plan/AUDIT.md` as a follow-up, not
   fixed here (bounding scope per the autonomy contract — decide, document,
   ship, don't let one grammar rule cascade into an unbounded rename).
7. **The em-dash/semicolon lint covers the WHOLE of `KEYWORD_GLOSS` +
   `SYSTEM_GLOSSARY`, not just the six named glosses.** The row named Pip,
   Omen, Riposte, Forge, Doom, Poison as worked examples; a lint that only
   checked those six would leave Rupture, Recoil, Reap, Plea, Thorns,
   Recall, Immolate, Purge, Boon, Temper, and the RUNGS/CONDEMN system
   terms — all of which also carried an em dash or semicolon — permanently
   failing an "enforced" lint. Fixed all of them in the same pass.
8. **Honesty-guard budget tightens 200 → 130 for `paidSummary` only.**
   `persistentEffect` (oath/hex passives) keeps no fixed cap — a trigger
   clause plus its payoff is structurally longer than a spell's single
   payoff, and the row's 130-char figure was written against the spell
   sentence. Still banned from em dash/semicolon/"the enemy" regardless of
   length.

## Scope

### A. Mechanics (`axiomancer-mechanics`)

- `src/Cards/cards.library.ts` — rewrite every `paidSummary` /
  `persistentEffect` string violating the grammar (31 of 57; see the commit
  diff for the full before→after set). Numbers unchanged (pricing `// pts:`
  comments untouched); only punctuation/vocabulary/length.
- `src/Combat/e2e/paid-summary-honesty.engine.test.ts` — budget 200 → 130;
  new em-dash/semicolon ban (paidSummary + persistentEffect); new "the
  enemy" ban; new "no raw decimal" durability guard.
- `src/Combat/e2e/erosion-paid-wording.engine.test.ts` — update
  `spoiled-poultice`'s pinned production line.
- `src/Combat/e2e/choir-card-wording.engine.test.ts` — update the 4 pinned
  literals that quoted now-rewritten text (`last-rites-sung-early`,
  `miserere`, `choirbone-reliquary`, `the-long-amen`).

### B. Mobile (`axiomancer-mobile`)

- `state/combat/keywords.ts` — rewrite every `KEYWORD_GLOSS` /
  `SYSTEM_GLOSSARY` entry violating the grammar (17 entries: Forge, Tick,
  Rupture, Prolong, Fester, Curdle, Poison, Doom, Pip, Recoil, Stagger,
  Backfire, Foretell, Omen, Soul, Reap, Plea, Quarter, Thorns, Riposte,
  Recall, Immolate, Purge, Boon, Temper, Hex, RUNGS, CONDEMN — overlapping
  sets for punctuation vs. vocabulary).
- `state/combat/__tests__/keywords.test.ts` — new em-dash/semicolon lint
  + "the enemy" ban across `KEYWORD_GLOSS`/`SYSTEM_GLOSSARY` (the "mobile
  keyword-scanner lint" witness named in the row).

### C. Docs

- `axiomancer-mechanics/docs/card-frame-legend.md` — new `## Card-text
  grammar` section: the seven clause shapes, the five hard rules, the
  face/overlay re-scope note, the residue list.

## Witnesses (from the row)

- `paid-summary-honesty.engine.test.ts` — extended, not replaced.
- The mobile keyword-scanner lints — `state/combat/__tests__/keywords.test.ts`
  new suite + the pre-existing `card-face-honesty.guard.test.ts` /
  `choir-card-wording.engine.test.ts` sweeps (which already fail on a
  broken face and now also cover the rewritten text).
- One screenshot confirming the 130-char render cap — **N/A under the
  re-scope**: the 130-char text no longer renders on the glance face at all
  (that's what #193 changed), so there is no face screenshot to take. The
  overlay is a scroll surface with no fixed render width; the numeric
  budget is enforced by the lint, not a screenshot. Documented as
  satisfied-by-lint-not-screenshot, not skipped.

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
```

(`src/Cards/**` and `src/Combat/**` touched → mobile verify required per
AGENTS.md's cross-package checklist. Card-editor `type-check` not required —
no `CardSpecialMechanic`/`CardRider` type-union change, no `Card` schema
change, data-and-prose-only diff.)

## Commit body template

```
feat(cards): card-text grammar + full copy pass (phase 40)

- Adopt the templating grammar (docs/card-frame-legend.md): no em dash/
  semicolon, colon-as-trigger-label, "the foe" fixed vocabulary, 130-char
  paidSummary cap.
- Rewrite 31 cards.library.ts paidSummary/persistentEffect strings +
  17 mobile KEYWORD_GLOSS/SYSTEM_GLOSSARY entries for grammar compliance.
- Tighten the honesty-guard budget 200 -> 130; add em-dash/semicolon +
  "the enemy" lints on both mechanics and mobile.
- Two sub-calls already satisfied pre-phase (documented, not re-done):
  PERORATION already dropped from the-black-cap's face (phase 29); the
  fuelPerPip decimal has no live card carrier post-retheme.

Decisions:
- <the 8 items above, condensed>

Closes #<phase-issue-number>
```

## DoD

- [ ] `cards.library.ts` rewrite lands, pricing comments untouched.
- [ ] `paid-summary-honesty.engine.test.ts` extended + green.
- [ ] `erosion-paid-wording` / `choir-card-wording` pinned literals updated.
- [ ] `keywords.ts` glossary rewrite lands.
- [ ] `keywords.test.ts` new lint suite green.
- [ ] `card-frame-legend.md` grammar section added.
- [ ] `npm run verify -w axiomancer-mechanics` green.
- [ ] `npm run verify -w axiomancer-mobile` green.
- [ ] Build-plan row ticked `[x]` with commit hash.
- [ ] `npm run deploy:check` green.

## Follow-ups (out of scope, filed to `plan/AUDIT.md`)

- The engine-generated "the enemy" strings in `combat.cards.ts`
  (`statePredicateText`, the hex attach suffix, `lock_stance`,
  `boost_all_dots`) and the mobile `mechanicHeadline` `verbLine` prose in
  `combat-encounter.engine.ts` still say "the enemy" and still carry stray
  em dashes — a separate, larger surface with no lint today.
