# Phase 44f — World, maps and minigame naming

> Agent-facing brief. Spec 34 §5.8 already resolved almost this entire row:
> node ids are frozen (`fv-*`, `W-01`, map-event ids — display names only),
> the three minigame names are RATIFIED as shipped (zero action), and the
> rest node's naming is explicitly gated on Phase 52e, which has **not**
> shipped as of this run (`plan/steps/01_build_plan.md` Phase 52e row is
> still `[ ]`). Per the row's own instruction and §5.8's restatement: *"If
> 52e has not shipped when 44f runs, retheme nothing about rest and say
> so."* Said so; done.
>
> What's actually left, per spec 34 §10 residue item 7: *"Author the
> Parish's places — §5.8 froze node ids and named the rest node but left
> the coastal settlements to 44f."* Exactly one settlement exists in the
> shipped first continent (the Fishing Village map; Northern Forest is
> wilderness, not a settlement, and is not named in the row or in §5.8 —
> left as a follow-up, not this phase's to invent without spec grounding).

## Inputs (read in this order)

1. `axiomancer-mechanics/specs/34-dark-fantasy-campaign.md` §5.8 (ids
   frozen, display names only, rest node gated on 52e), §3.4 NL-18 (place
   names: "a feature plus a fact that went wrong" — worked example is
   literally **"the Drowned Parish"**), §1.2 (the `drowned-parish` estate:
   *"The coastal parishes the sea took. Still ringing, still collecting."*
   — word-for-word the fiction §5.8 assigns to 44f's "coastal parish the
   sea is taking"), §10 item 7 (residue: settlement naming left to 44f).
2. `docs/retheme-map.json` — checked: **no `applies: "44f"` pairs are
   actionable this run.** The four staged pairs (`RestChoice` → *The
   Confessor's House*, `rest`/`anvil`/`cut` offer names) all carry
   `"DO NOT APPLY until Phase 52e ... has shipped"` notes. The `keep` list
   confirms the three minigame names and `the Aporia` are ratified
   unchanged.
3. `axiomancer-mobile/state/exploration-maps/fishing-village.layout.ts` —
   the `region: 'Fishing Village'` field, the only title-case "Fishing
   Village" UI display string in the mobile app (verified via repo-wide
   grep; every other hit is either an id (`mapId: 'fishing-village'`,
   `fv-*` node ids — frozen per §5.8), a code comment, a test description,
   or Phase 44g-scoped quest-board content).

## Scope — the one pair

| kind | old | new | ruling |
|---|---|---|---|
| world-node region display name | `Fishing Village` | `the Drowned Parish` | §5.8 (coastal-parish fiction) + §3.4 NL-18 (worked example) + §1.2 (`drowned-parish` estate description) |

Everything else: **KEEP, zero action.**

- `mapId: 'fishing-village'` and all `fv-*` node ids — frozen (§5.8, "node
  ids do not change").
- `W-01` continent id and the Aporia's own name — frozen / KEEP (already
  ratified, §5.8 + NL-9).
- The three minigame names (The Gleaning, The Reliquary, The Boy's
  Almanac) — RATIFIED as shipped (§5.8), no code currently spells them
  under a different name.
- The rest node (`RestChoice` / `rest` / `anvil` / `cut`) — **explicitly
  skipped at the time this phase ran.** Phase 52e (rest minigame
  retirement) has since shipped (2026-08-15); `docs/retheme-map.json`'s
  staged pairs for this are no longer gated. The retheme itself is still
  a follow-up (below), not applied by this note.
- Northern Forest's `region: 'Northern Forest'` — not a settlement, not
  named in the build-plan row or in §5.8's text, and no spec ruling
  grounds a specific replacement the way the Drowned Parish fiction does
  for the fishing village. Left as a follow-up (below), not invented here
  without a spec anchor.
- Quest-board content (including the player-facing `storyBeat` copy that
  currently reads "Fishing Village — Main Quest: ...") — explicitly Phase
  44g's scope ("dialogue trees, quest board content"), not 44f's. Left
  untouched.
- Docs, specs, `CHANGELOG.md`, `plan/` history, devlog entries — dated
  records / zoned per the lexicon guard's own exemptions; not rewritten
  (same carve-out 44e used). They keep saying "Fishing Village" until
  44i's prose sweep.

## Decisions made upfront — DO NOT ASK

- **"the Drowned Parish" is not an invented name — it is spec 34's own
  worked example.** §3.4 NL-18 states the place-naming rule ("a feature
  plus a fact that went wrong") and its own worked example is *"the
  Drowned Parish, the Cold Watch."* §1.2 independently describes the
  `drowned-parish` enemy estate as *"The coastal parishes the sea took"* —
  which is verbatim the fiction §5.8 assigns to the starting region
  ("a coastal parish the sea is taking"). No display string "The Drowned
  Parish" exists anywhere in shipped code today (verified: `git grep`
  finds only the bare id `drowned-parish` in `combat.enemy-cards.ts` and
  `cards.library.ts`, plus one flavor comment) — this phase is the first
  place the name is actually rendered, and it renders it as the fishing
  village's own region, not as a duplicate of the enemy archetype label
  (the archetype has no display string to collide with).
- **No `docs/lexicon.json` row this phase.** "Fishing Village" is not a
  retired game-mechanics term the way `basePower` or the §5.2 keyword list
  are — it is a display string gaining a parallel proper name while
  dozens of specs, story docs (S-01, S-02), CLI test descriptions, and
  `plan/` history correctly keep using it to describe the map/feature
  area by its working name. Registering it now would fail
  `check-lexicon.mjs` against every one of those legitimate references.
  Same reasoning 44e used for deferring "Incompleteness" to 44i's sweep.
- **`mapBackdropFor()` is untouched and unaffected.** It matches
  `/forest/i` for the forest backdrop and falls through to `FOREST_DARK`
  for everything else — it never matched on "fishing" or "village", so
  the region-string rename changes nothing about backdrop resolution.
- **The codex header token is unaffected in kind, only in value.**
  `selectExplorationCodexHeader` slugifies `vm.region` into
  `REGION/<SLUG>` via `toCodexToken`; "the Drowned Parish" slugifies
  cleanly to `THE.DROWNED.PARISH` (no punctuation to strip beyond spaces),
  matching the exact `THE.ASH.MARCHES`-style pattern the function's own
  doc comment already anticipates.
- **`quest-board.content.ts`'s "Fishing Village" comments and the
  `storyBeat` string are Phase 44g's, not this phase's.** They are
  authored quest/dialogue content, explicitly listed under 44g's row
  ("dialogue trees, quest board content"), and 44g depends on 44a (already
  shipped) and 42 — not on 44f. Touching them here would be scope creep
  into a sibling phase.
- **Northern Forest stays unnamed this phase.** Naming it would require
  inventing a place identity with no spec anchor (unlike the Drowned
  Parish, which spec 34 names twice independently). Filed as a follow-up
  below rather than guessed.

## Codemod invocation

Single-field edit, not a multi-file codemod run (the `applies: "44f"` map
entries are all rest-node pairs gated on 52e, so
`scripts/apply-retheme-map.mjs --applies=44f` has nothing eligible to
apply this run). Direct edit:

```
axiomancer-mobile/state/exploration-maps/fishing-village.layout.ts
  region: 'Fishing Village'  ->  region: 'the Drowned Parish'

axiomancer-mobile/state/exploration-maps/__tests__/fishing-village.layout.test.ts
  expect(fishingVillageLayout.region).toBe('Fishing Village')
    -> expect(fishingVillageLayout.region).toBe('the Drowned Parish')
```

## Prove (DoD)

```bash
# Region rename applied, nothing else in the layout file moved
git diff axiomancer-mobile/state/exploration-maps/fishing-village.layout.ts
# -> exactly one line changed (the region field)

# No other title-case "Fishing Village" UI display string remains
grep -rn "Fishing Village" axiomancer-mobile --include="*.tsx" --include="*.ts" \
  | grep -v __tests__ | grep -v "\.test\." | grep -v quest-board
# -> no output (the layout.ts hit is now "the Drowned Parish")

# mapId and node ids untouched
git grep -n "mapId: 'fishing-village'\|id: 'fv-" -- axiomancer-mobile/state/exploration-maps
# -> same hits as before

# Targeted suite green
cd axiomancer-mobile && npx jest state/exploration-maps

# Full verify gate
npm run verify
```

- Flip Phase 44f's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`, append
  the commit hash.

## Follow-ups (out of scope this phase)

- **Rest node naming** (`RestChoice` → The Confessor's House, `rest` →
  the Hearth, `anvil` → the Anvil, `cut` → the Shears) — Phase 52e has
  shipped; the `docs/retheme-map.json` pairs are unstaged and ready. A
  future tick just needs `--write`.
- **Northern Forest region naming** — no spec anchor exists yet; a
  `/world-spec` session (per spec 34 §10 item 7's own suggestion, "if 44f
  finds that too thin a brief, a `/world-spec` session is the right
  instrument") is the right way to derive it, same as the Drowned Parish
  was derived from existing estate fiction.
- Phase 44g — characters, story, dialogue, quest board content (including
  the `storyBeat` string that currently names the village).
- Phase 44i — docs/prose sweep; specs, CHANGELOG, `plan/` history keep
  saying "Fishing Village" until then.
