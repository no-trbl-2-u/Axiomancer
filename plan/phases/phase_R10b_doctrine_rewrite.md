# Phase R10b — Doctrine rewrite (1/2: the doctrine)

## Sources

- Part plan: [`plan/revamp/doctrine.md`](../revamp/doctrine.md) § R10b, items 1-4.
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D67** (R10b rewrites spec.md and bearings, adds the game
  model, retires specs 33/34), **D66** (the archive leaves the tree, in
  R10b2), **D58** (nothing is authored), **D65** (the Color Law and colour
  match stay; stances go).
- Fact sources for the game model: the B4 inventory
  ([`plan/revamp/card-rules-inventory.md`](../revamp/card-rules-inventory.md))
  and the current tree. Never the archive, a HISTORICAL spec or a
  Superseded-bannered doc.
- Canonical sibling: Phase R0's doctrine reset of the loop verbs
  (`ba658cba`), which rewrote verb text against D58 the same way.

## Split (2026-10-02)

The part plan's R10b has seven items. Items 5-7 (the plan-queue sweep, the
`plan/archive/` tag and removal with ~60 live pointer files, and the
`check-lexicon` retired-term guard) do not fit one 75-minute tick beside
items 1-4. Like R2, R3 and R7 before it, the row splits:

- **R10b** (this brief): items 1-4, the doctrine itself.
- **R10b2**: items 5-7, the queues, the archive and the guard. Requires
  R10b. R10c now requires R10b2.

## Reality check (2026-10-02, `main` at `5b3e64b6`)

- `spec.md` (154 lines) still describes the pre-revamp game: THE BIG
  NUMBERS pillar, enemy keywords and stages, RELENT and CONDEMN, faction
  reputation, the Labyrinth driver as live, engine v0.37.0 and specs 26-30
  as queued.
- `plan/bearings.md` (923 lines) keeps nine standing entries whose text is
  wholly or partly marked SUPERSEDED (THE BIG NUMBERS REWRITE, THE CONTENT
  LIFECYCLE SPLIT, THE UNSHACKLING ¶2, THE PIPELINE LIBERATION ¶1-3, the
  struck TRANSITIONAL entry, THE GROWTH FLOOR, the CQI half of Balance
  doctrines), plus THE OPEN GATE ¶4/¶8 and THE LONGER LEASH's authority
  list, which D58 overrides without a marker.
- Spec 33 (IMPLEMENTED) still opens with "enemy HP falls only to status"
  and "starter presets hold the 80/50/25-35/0 win curve", and its §2 is the
  stance layer R7d deleted. Its dice, Conviction and die-gear sections are
  still true.
- Spec 34 (RATIFIED) is mostly retired law (§3 and §8 repealed, §6
  deleted by D39), but §2 (voice: the register, the V-bans, sentence form,
  the six lexicons) and §2.5 (MB-1 to MB-8) are live:
  `scripts/check-prose.mjs` cites MB-1 as `spec 34 §2.5.1` and its test
  asserts the citation.
- `docs/game-model.md` does not exist.

## As shipped

- Scope widened by three files the brief missed, because they are always
  loaded and taught the old game as current: `axiomancer-mechanics/CLAUDE.md`
  (its "Load-bearing doctrine" was the BIG NUMBERS charter, with RELENT,
  CONDEMN, WRATH and the read), `axiomancer-mechanics/AGENTS.md` and
  `axiomancer-mechanics/VISION.md` (alignment, faction reputation, Befriend at
  5 heart tokens). VISION keeps T's wants; the built facts point to the game
  model; unbuilt mercy wants are listed as not built, minus the deleted
  alignment and faction ones.
- Bearings went from 923 to ~520 lines. Kept, rewritten to the live part:
  LOCKED MECHANICS (folded with THE LONGER LEASH's keep-list), THE OPEN GATE
  (¶1 and ¶7 only), THE BLANK PAGE (as "Story canon"), THE REFACTOR STRATEGY
  (its never-re-propose rules), the art route and image-license rule.
- `.github/workflows/verify-prose.yml`'s header cited THE PIPELINE
  LIBERATION; it now cites the delivery register.
- V-1's examples in the delivery register drop the words the lexicon lint
  retires; the rule is unchanged.

## Outcome

An agent that reads `AGENTS.md`, `docs/game-model.md`, `spec.md` and
`plan/bearings.md` learns only the post-revamp game. No live doctrine
file describes stances, presets, pricing, themes, enemy keywords or the
cut alt-wins as current.

## Scope

1. **`docs/game-model.md`** (new, one page): the game as the code stands,
   with the constant behind each number: the grey cards, the four dice and
   their faces, the Color Law and colour match, the tray, FREE/PAID, the
   hand, VITAE (player and enemy formulas), Conviction and The Open Hand,
   S3 scaling, the three foes, Act 1, befriend and mercy, potions, the one
   relic, rewards, rest and the Anvil, XP. A closing "What the game does
   not have" list. `AGENTS.md` points to it first, above `spec.md`;
   `docs/truth-sources.md` ranks it.
2. **`spec.md`** rewritten to the post-revamp product: no enemy keywords,
   no RELENT/CONDEMN, no BIG NUMBERS pillar, no "queued" specs, the Act 1
   scope and the rebuild track named as what comes next.
3. **`plan/bearings.md`**: every SUPERSEDED paragraph deleted, not
   annotated; partly superseded entries rewritten to the part still true.
   "What we're building" restated without history.
4. **Specs 33 and 34 leave the live set.** Their true parts are folded
   first: the dice, Conviction and die-gear facts into `docs/game-model.md`;
   spec 34 §2 and §2.5 (MB-1 to MB-8) into a new
   `axiomancer-mechanics/docs/narrative/DELIVERY_REGISTER.md`. Then both
   files are deleted (git keeps them). `specs/README.md` and
   `plan/README.md` are fixed; `check-prose.mjs` and its test cite the new
   register file.

## Not in scope

- Items 5-7 of the part plan (R10b2).
- The bannered docs and code comments that still cite spec 33 or 34
  (`docs/combat.md`, `keyword-atlas.md`, `lexicon.json`'s `since` fields,
  engine comments): R10c owns comment and doc truth. Markdown links to the
  two deleted files are repointed in this phase so nothing dangles.
- No rule, card, keyword or number changes (doctrine.md "Not in these
  phases").

## Save / schema contracts

None.

## Carrier sweep (D45)

None. Nothing in the engine is removed.

## Decisions made upfront — DO NOT ASK

- **Split, not squeeze.** Precedent R2/R3/R7; the archive removal and the
  queue sweep are mechanical but wide, and a half-done archive removal
  leaves dangling pointers on `main`.
- **Delete specs 33/34, don't archive them.** D66 removes `plan/archive/`
  next tick, so moving them there would be undone a tick later. Git keeps
  them; the specs README names the commit to read them from.
- **The voice register moves to `docs/narrative/`**, beside the style
  constitution and voice registers, because `check-prose.mjs` enforces it
  and the narrative docs are already craft law that survived THE BLANK
  PAGE. Only its rules move; the provenance and R-C/R-F narration do not.
  MB-8's pointer to the repealed Naming Law (§3) goes.
- **Bearings keeps engineering law and standing permissions that are still
  true** (direct pushes to `main`, the art route and provenance rule,
  `[needs-user-call]` retired, the LOCKED MECHANICS keep-list, THE BLANK
  PAGE's live paragraphs, THE CARD HOLD, THE REVAMP). Content-authority
  grants that D58 overrides go; R11 decides what content authority comes
  back and writes it fresh.
- **The game model states numbers with their constant names**, so R10c's
  "every rule of play in a live doc" has an anchor. Values come from the
  tree at this commit, checked by reading the code, not from any spec.
- **The Surge meter is named as the momentum chain** (heart, body, mind
  completes a surge and grants a temporary gold die), which is what the
  code does now that the wheel is gone.

## Verify

Root `npm test` (includes `check-prose.test.mjs`), `npm run lint:content`,
`node scripts/check-lexicon.mjs`, `npm run verify --workspace
axiomancer-mechanics` (prose lint and doc-link checks live there). No
mobile code changes.

## Follow-ups

- R10b2: plan-queue sweep, archive tag and removal, lexicon guard.
- R10c: the comments and bannered docs that still cite specs 33/34.
