# Phase 47 — Knowledge-Gaps acceptance sweep

> Pure docs phase. Walks `Knowledge-Gaps.md` top-to-bottom and
> annotates every numbered question with its current status: open +
> deliberately deferred, resolved-not-marked (with shipping
> references), or queued for a pending phase. Mirrors Phase 41's
> spec-sweep pattern (which drained Q5 / Q12 / Q15 / Q17-Q20). After
> this phase a reader landing on Knowledge-Gaps.md can tell open
> from resolved without grepping each question against the spec or
> build-plan trail.

## Outcome

- Every numbered question in `Knowledge-Gaps.md` (1-28) carries a
  status annotation: `**Resolved at <spec / phase> (<hash>).**`
  for resolved entries, an explicit "deferred" callout for
  open-but-deliberately-deferred entries, or "queued for Phase 48"
  for the two entries the next pending phase will close.
- `Knowledge-Gaps.md` becomes navigable: a single grep for
  "Resolved" vs "deferred" classifies every entry.
- No engine touch, no test churn, no Knowledge-Gaps wording
  changes beyond appending the annotation block at the end of each
  resolved entry.
- Phase 47 row in `plan/steps/01_build_plan.md` flipped to `[x]`.

## Source spec

- Build-plan row Phase 47 (`plan/steps/01_build_plan.md`).
- Promoted via `/oversight` 2026-05-16 (commit `c8cb53a`,
  promote-multiple sequence 46 → 47 → 48 — Phase 46 closed at
  `3765c31`).
- Expand pass 7 candidate (filed at `5b37528`).
- Mirrors Phase 41 (commits `b5c4d0b` / `3b1fd88` / `518b5dd` /
  `74e7389`) — Phase 41 drained Spec 04 / 10 / 23 acceptance plus
  KG Qs 15 / 17-20. Phase 47 finishes the KG side.

## Question classification (full inventory)

Pre-sweep state: 28 questions; 9 explicitly resolved (5, 7, 12, 15,
17, 18, 19, 20, 21); 19 untagged. Post-sweep target: every entry
carries a status block.

| # | Topic | Status target |
|---|---|---|
| 1 | Attack vs Defense roll model | **Deferred** — combat-tuning, deliberately open per Spec 02 |
| 2 | Damage formula | **Deferred** — combat-tuning |
| 3 | CritStyle (`double` vs `pierce`) | **Resolved at Phase 32** (`e456322`) — auto-select shipped |
| 4 | Defend action defense base | **Deferred** — combat-tuning |
| 5 | Friendship mechanic | (already half-resolved at Phase 36; narrative-content half tagged as content-author work) — verify wording |
| 6 | Initiative / turn order | **Deferred** — combat-tuning |
| 7 | `teir` typo | RESOLVED (already marked) |
| 8 | Stat modifiers not applied at runtime | **Queued for Phase 48** — promoted; engine work pending |
| 9 | Intensity scaling for stat modifiers | **Queued for Phase 48** — same |
| 10 | Negative `healthPerRound` regen | Verify: `applyRegen` behaviour at negative — may be resolved at Spec 01 or still open |
| 11 | Effect application outside combat | **Resolved at Spec 08** — `processWorldEffectTick` exists; check live coverage |
| 12 | Character.id field | RESOLVED at Phase 35 + 38 (already marked) |
| 13 | Experience formula | **Resolved at Spec 06** — linear `level × EXPERIENCE_PER_LEVEL` shipped pre-loop; per-difficulty XP via `DEFAULT_XP_BY_DIFFICULTY` (Spec 07) |
| 14 | Stat allocation cap | **Resolved at Phase 29** (`9f2e3f6` / `121aea8` / `db7c26f`) — 3 points per level, no cap, deferred allocation via Character tab |
| 15-21 | (already marked resolved) | Skip |
| 22 | Map vs MapState | **Resolved at Phase 23 / 24** — see Q20 trail; static `MapDefinition` + runtime `MapState` is the shipped pattern |
| 23 | React Native consumption | **Resolved at Phase 12** (`251dda9`) — core barrel is RN-safe; `createNodeAdapter` lives on `'/node'` subpath; documented in `docs/api.md` |
| 24 | Zustand placement | **Resolved at Phase 12 + Spec 12** — store ships in the engine package; React Native app subscribes via `useStore` |
| 25 | Event system | **Resolved at Phase 12 + Phase 21** — `GameEventEmitter` + typed event surface (10 `TypedGameEvent` aliases, 10 guards) |
| 26 | How punishing should combat be? | **Deferred** — game-design question; ties into Q1/Q2/Q4/Q6 tuning |
| 27 | Moral choice system | **Resolved at Phase 10 + Phase 42-46** — moralMeter shipped; philosophical alignment cube added alongside; both persist orthogonally |
| 28 | Multiple endings | **Deferred** — endgame question; Spec 10 Q8 picked "specific story flags as ending selector"; content authoring TBD |

## Implementation units

### Unit 1 — Engine-resolved Qs (Q3, Q5 verify, Q10 verify, Q11, Q13, Q14, Q16, Q22)

Single file edit: `Knowledge-Gaps.md`. For each question, append a
**Resolved** block at the end with the spec / phase / commit
reference. Mirrors the Phase 41 wording style:

```
13. **Experience formula**: ...
    *(Tracked in `specs/06-character-progression.md`.)*
    **Resolved at Spec 06 (pre-loop) + Spec 07.** The shipped curve
    is linear `level × EXPERIENCE_PER_LEVEL` (`src/Game/game-mechanics.constants.ts`);
    per-difficulty XP awards via `DEFAULT_XP_BY_DIFFICULTY` (`src/Enemy/index.ts:37`)
    — simple 10 / normal 20 / elite 50 / boss 200 / unique 500.
```

Q5 + Q10 require a brief verification read against the engine before
annotating. Q16 is `equippedSkills` — fixed-count slot via the
Character preset path; check current shape.

Commit: `docs(knowledge-gaps): Phase 47 unit 1 — annotate engine-resolved Qs`.

### Unit 2 — RN-integration Qs (Q23, Q24, Q25)

Same file edit. Annotate each with the Phase 12 / Phase 21 shipping
trail. These are conceptually grouped — RN consumption story.

Commit: `docs(knowledge-gaps): Phase 47 unit 2 — annotate RN-integration Qs`.

### Unit 3 — Deferred Qs + plan tick

Annotate Q1, Q2, Q4, Q6 with a uniform `**Deferred — combat-tuning
(genuinely open per Spec 02; revisit during a future balance pass).**`
block. Annotate Q8 + Q9 with `**Queued for Phase 48.**` Annotate
Q26 + Q28 with the appropriate deferred-design note. Tighten Q5 + Q27
wording (cross-reference Phase 42-46). Flip Phase 47 `[ ]` → `[x]`.

Commit: `docs(knowledge-gaps): Phase 47 unit 3 — deferred Qs + plan tick`.

## Decisions made upfront — DO NOT ASK

- **Status-annotation-only.** Don't rewrite the question prose; just
  append the resolution / deferred block. Original wording stays so
  the trail to the spec stays readable.
- **Verify Q10 + Q16 before annotating.** Q10 (negative regen) and
  Q16 (skill slots) need a quick engine grep to confirm shipping
  status. If unshipped, annotate as deferred or queue with a candidate.
- **Q5 and Q27 get tightened, not rewritten.** Q5 is already
  partial-resolved (mechanics at Phase 36, content open); Q27 is now
  fully resolved by the Phase 10 + Phase 42-46 stack. Update the
  annotations to reflect current state.
- **Q26 + Q28 are genuinely open.** Game-design questions about
  combat punishment + multiple endings are tagged "deferred" with
  pointers to the relevant specs (`spec.md`, `specs/10-...`).
  Don't try to resolve them; tag them so future readers know.
- **No new specs files.** Phase 47 doesn't author `specs/14-philosophical-alignment.md`
  even though critique-18 filed it. That's a separate row on the
  CRITIQUE queue and gets drained by /iterate, not by this phase.
- **No KG renumbering.** Numbered list stays 1-28; gap-filling is
  out of scope.

## Verify gate

`npm run type-check && npm run lint && npm test && npm run build`.
Then `npm run deploy:check`. All four should be no-ops since this
phase is docs-only.

## Definition of Done

- [ ] Every numbered question in `Knowledge-Gaps.md` has a status block (resolved + reference, deferred + reason, or queued + phase reference).
- [ ] Q3 cites Phase 32 (`e456322`); Q11 cites Spec 08; Q13 cites Spec 06 + 07; Q14 cites Phase 29; Q22 cites Phase 23/24; Q23/24/25 cite Phase 12 (+ Phase 21 for events).
- [ ] Q1, Q2, Q4, Q6, Q26, Q28 carry a uniform `**Deferred**` block.
- [ ] Q8, Q9 carry a `**Queued for Phase 48.**` block.
- [ ] Phase 47 row in `plan/steps/01_build_plan.md` flipped to `[x]` with all three commit hashes.
- [ ] `npm run verify` + `npm run deploy:check` green.

## Follow-ups (out of scope)

- **`specs/14-philosophical-alignment.md`** — critique-18 LOW; separate iterate row.
- **`docs/effects.md` count drift** — critique-19 LOW; separate iterate row.
- **`Spec 23 13th acceptance line` for alignmentDelta** — critique-19 LOW.
- **`docs/morality.md` cross-link to docs/philosophy.md** — critique-19 LOW.
- **Phase 48 (effect runtime statModifiers aggregation)** — already promoted; closes Q8 + Q9 mechanically.
- **Genuinely open design Qs (Q1, Q2, Q4, Q6, Q26, Q28)** — these are deliberately deferred; revisit during a future balance / endgame pass.
