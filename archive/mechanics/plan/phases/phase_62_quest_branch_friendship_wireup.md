# Phase 62 — Quest-branch wire-in on `outcome === 'friendship'` (Phase 60 D3 follow-up)

> Closes the Phase 60 D3 deferral. The Phase 60 candidate scope said
> "quest entries that branch on `outcome === 'friendship'` vs
> `'victory'` for at least one quest" — Phase 60 shipped the
> mechanics + content half but deferred the quest-branch primitive.
> Phase 62 ships it via path (a): `FriendshipReward.flagSet?` +
> END_COMBAT reducer thread + one authored branching dialogue.

## Outcome

`FriendshipReward.flagSet?: string` field shipped on the engine; the
END_COMBAT reducer threads it to `state.flags` when outcome ===
'friendship'. MournfulGull's `friendshipReward` carries
`flagSet: 'befriended-mournful-gull'`; Coastal Beggar's dialogue
tree gains a new flag-gated branch surfacing only after befriending
the gull. Hermetic e2e drives the friendship → flag-set →
dialogue-gate path end-to-end. `docs/combat.md` + `docs/api.md` +
`docs/enemy.md` document the new field.

## Source

`plan/PHASE_CANDIDATES.md` Promoted Phase 62 row + Phase 60 D3
deferral.

## Implementation units

### Unit 1 — Type + engine: `FriendshipReward.flagSet?` + END_COMBAT thread

**Files:**
- `src/Enemy/types.ts` — extend `FriendshipReward` with `flagSet?: string`.
- `src/Game/game.reducer.ts` — extend the END_COMBAT case to append `enemy.friendshipReward?.flagSet` to `state.flags` on friendship outcome (de-duped).
- `scripts/public-surface.expected.json` — no fixture change (the field is on an existing exported type; the type's name doesn't grow).

### Unit 2 — Content: MournfulGull `flagSet` + Coastal Beggar branch

**Files:**
- `src/Enemy/enemy.library.ts` — add `flagSet: 'befriended-mournful-gull'` to MournfulGull's existing friendshipReward.
- `src/World/Continents/Coastal-Village/maps.ts` — add a 7th choice to `beggarTree.nodes.greet.choices` gated by `requires: { flag: 'befriended-mournful-gull' }`. Add a new terminal node for the branch.

### Unit 3 — Hermetic e2e + docs

**Files:**
- `src/Game/e2e/befriend.engine.test.ts` — extend with 1-2 cases: drive MournfulGull friendship → assert `state.flags` includes the flag; drive subsequent `visibleChoices(beggarTree.nodes.greet, ctx)` with the flag set → assert the new branch is visible. Also one negative case: pre-friendship `visibleChoices` does NOT surface the branch.
- `docs/combat.md` Friendship Path section — extend the FriendshipReward field-shape mention to include `flagSet?`.
- `docs/enemy.md` Befriendable enemies (Phase 60) subsection — extend the FriendshipReward interface code-block to include `flagSet?` + update the MournfulGull row to show the flag.
- `docs/api.md` — `CombatEndReport.friendshipReward` mention is unchanged (no report-side surface for the flag — it goes straight to `state.flags`).
- `CHANGELOG.md` `[unreleased]` `### Added` block — append a bullet for the `FriendshipReward.flagSet?` field (Phase 62).

## Decisions made upfront — DO NOT ASK

- **D1 — Path (a) over path (b).** `FriendshipReward.flagSet?: string` reuses the existing `state.flags` + `requires.flag` machinery; no new `QuestObjective.completedOn?` slot. Path (a) is smaller, ships in one engine touch, and aligns with the Phase 60 D3 framing.
- **D2 — Flag append in the reducer, not the store.** The reducer is the single source of state-shape edits per `plan/bearings.md`; the store's `endCombat()` is the consumer-facing sugar but doesn't itself mutate `state.flags`. Reducer-side keeps purity intact.
- **D3 — De-dupe append.** `state.flags.includes(flag) ? state.flags : [...state.flags, flag]` — matches the `setFlag` semantics in `dialogue.runtime.ts:101-105`.
- **D4 — Flag name is `befriended-<enemy-id-stem>`.** Convention: `befriended-mournful-gull`. Future befriendable enemies follow the same pattern; mirrors the `state.flags` kebab-case convention used by existing flags (`quest-discovered-*`, etc.).
- **D5 — Coastal Beggar branch placement.** The 7th choice on `beggar.greet` per `docs/philosophy.md` "Authoring gates" stable-index advice. The branch's `nextNodeId` goes to a new `grateful_befriended_gull` terminal node with thematic flavor text + small moralMeter / alignmentDelta nudges.
- **D6 — No new quest** in Phase 62. The candidate row mentioned "quest entries that branch" but the cheapest viable proof of the primitive is a dialogue branch (the engine's existing flag-gating). Future content phases can author quest objectives that gate on the flag if desired.
- **D7 — Three commits.** Unit 1 + Unit 2 ship separately (engine vs content); Unit 3 (tests + docs) is the third commit. Step 11 ship-row flip is the fourth.

## Verify gate

- `npm run type-check` clean (additive optional field).
- `npm test` ≥629 (new e2e cases bump count by 2-3).
- `npm run build` clean.
- `npm run deploy:check` clean (fixture unchanged — no new exports).

## Commit body templates

### Unit 1 commit

```
feat(engine): Phase 62 unit 1 — FriendshipReward.flagSet? + END_COMBAT thread

- Extend FriendshipReward with flagSet?: string on src/Enemy/types.ts.
- END_COMBAT reducer (src/Game/game.reducer.ts) appends
  enemy.friendshipReward?.flagSet to state.flags when outcome ===
  'friendship' (de-duped per D3, matching dialogue.runtime setFlag
  semantics).

Decisions:
- D1 — path (a) flagSet field; reuses requires.flag machinery.
- D2 — reducer-side mutation; store stays consumer-facing sugar.
- D3 — de-dupe append.
- D4 — `befriended-<enemy-id-stem>` flag-naming convention.
```

### Unit 2 commit

```
feat(content): Phase 62 unit 2 — MournfulGull flagSet + Coastal Beggar branch

- src/Enemy/enemy.library.ts MournfulGull friendshipReward gains
  flagSet: 'befriended-mournful-gull'.
- src/World/Continents/Coastal-Village/maps.ts beggarTree.greet
  gains a 7th flag-gated choice + a new grateful_befriended_gull
  terminal node.

Decisions:
- D5 — branch placed LAST on choices[] for stable-index test compat.
- D6 — no new quest object; dialogue branch is sufficient proof of
  the primitive.
```

### Unit 3 commit

```
test(befriend): Phase 62 unit 3 — flag-set → dialogue-gate e2e + docs

- befriend.engine.test extended (2-3 cases): friendship sets the
  flag; visibleChoices surfaces the new branch after; pre-friendship
  visibleChoices does NOT surface it.
- docs/combat.md + docs/enemy.md document the flagSet field.
- CHANGELOG.md [unreleased] ### Added gains a Phase 62 bullet.
```

## Definition of Done

- [ ] `FriendshipReward.flagSet?` shipped + END_COMBAT thread.
- [ ] MournfulGull authoring + Coastal Beggar branch.
- [ ] Hermetic e2e covers the friendship → flag-set → gate path.
- [ ] Docs updated.
- [ ] `npm run verify` green; `npm run deploy:check` green.
- [ ] Build plan Phase 62 row flips `[ ]` → `[x]`.

## Follow-ups (out of scope)

- **`QuestObjective.completedOn?`** path (b) — defer; current
  flag-gated approach satisfies Phase 60 D3.
- **More authored branching** — let content phases drive.

## Canonical sibling

Phase 60 (the precedent for FriendshipReward + END_COMBAT threading);
Phase 43's `alignmentDelta` authoring is the precedent for the
flag-gated content branch shape.
