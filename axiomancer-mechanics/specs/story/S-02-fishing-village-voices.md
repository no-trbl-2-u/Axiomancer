# Story Spec S-02 — The Fishing Village Voices

> **Status: designed, not implemented.** Queued as build-plan phases
> 53a → 53e. This spec decides *which* voices the village has and *where*
> they stand; the phases wire them. Evidence for every claim about the
> current state is in
> [`docs/reports/NARRATIVE-ENCOUNTER-AUDIT.md`](../../docs/reports/NARRATIVE-ENCOUNTER-AUDIT.md).

## Goal

The fishing village has eight authored NPCs, every one with a written
dialogue tree, and **no player has ever spoken to any of them** — the map's
single `interaction` node names a `Weathered Fisher` who exists in no
roster. This spec picks which of those eight get a home on the map, puts the
quest-giver where the map's premise requires him, and defines the one thing
the village has never had: characters who react to what the player already
did.

Without it, the first map is a walk with a boss at the end. The player is
told, in the arrival cutscene, that nobody here has hauled a full net since
the breakwater went quiet — and then meets nobody who could confirm it.

## Dependencies

- **Depends on:** the 2026-08-08 first-map audit (topology, the revived kill
  objective) and the 2026-08-09 narrative-encounter audit (this spec's
  evidence base). Phase 53a must land before any content here is authored —
  authoring against a broken gate ships more dead content.
- **Unblocks:** S-01's four dilemmas, which want somewhere for their flags to
  land; Phase 44g, whose retheme surface grows from 3 reachable trees to 7.
- **Contests nothing in `docs/story.md`** — see "The doc was right" below.

## The doc was right; the map drifted

`docs/story.md` already names Old Marrow's home:

> ### Old Marrow (Fishing Village, `fv-2`)
> A weather-worn dockmaster on the player's home dock. Old Marrow is the
> **first canonical moral NPC**…

And `maps.ts`'s own header comment still describes the map that had him:

> `fv-1 (start) → fv-2 (interaction — quest giver) → fv-3 (village — shop)`

`fv-2` is a loot cache today. The quest-giver lost his node in the Phase 65
expansion from 6 nodes to 25, and nothing failed, because nothing checks.
This spec is therefore **not a new design** for Old Marrow's placement — it
restores a placement two committed documents still assert, and adds the
guard that would have caught the loss.

## Which voices get homes — and which deliberately do not

Eight NPCs, a 25-node map, and a route ten nodes long. Homing all eight
would put an NPC on roughly every other step of a run and turn a hollowed-out
village into a crowd. The village is described as *empty*; the cast should
be small enough that the emptiness is legible.

**Four get homes.** Each earns it by doing something no other node does.

| NPC | Why this one | Placement rule |
|---|---|---|
| **Old Marrow** | Starts `starting-quest`. The map has no premise without him. | Spine, before the first fork — every route, every run |
| **Coastal Beggar** | The morality set-piece: seven branches spanning `moralDelta` −5 to +5. Spec 10's demonstration NPC. | Before the boss — the moral choice should be fresh at the climax |
| **Captain Blackwater** | Five root replies, three of them alignment-gated. The specimen that proves Phase 53b's gate repair in play. | After the boss, wharf lane — he is a docks character |
| **Fisherman's Daughter** | The largest tree on the map (31 nodes) and the only peer-aged voice. The counterweight to the father dilemma. | After the boss, inland lane — reacts to `fv-14` |

**Four stay unhomed, on purpose, with the reason recorded** so the Phase 53a
guard can tell a deliberate omission from a lost NPC:

| NPC | Why not now |
|---|---|
| **Tide-Shopkeeper** | `isShopkeeper: true`, and the shop UI has been out of scope since Spec 08. A shop node that cannot sell is worse than no shop node. |
| **Village Healer** | Wants the context of a rest node, and rest is being rebuilt underneath her by phases 52c/52d. Place her after that settles, not before. |
| **Dockworker's Union Leader** | A village-politics voice with no village to be political in. Belongs to whatever map gets a real settlement screen. |
| **Merchant's Widow** | Same. Also the third grief-shaped character on a map that already has Old Marrow and the Beggar; the register would repeat. |

The unhomed four keep their trees. Nothing is deleted. They are recorded as
*written, not yet staged* — which is a different fact from *lost*, and the
guard test must be able to say which.

## Old Marrow on the spine — the topology this needs

`fishing-village` is a column-layered gauntlet: every edge runs column *x* →
*x+1*, and completed nodes lock behind you. Exactly two nodes sit on 100% of
the 1479 legal routes — `fv-1` (the arrival cutscene) and `fv-6` (the boss).
Every other node is a coin flip or worse. The quest board that names the
map's premise is on 33.3% of routes; the one moral dilemma is on 29.4%.

To guarantee Old Marrow, **column 1 narrows to a single node.** `fv-1 → fv-2`
only; `fv-2` then opens onto all three column-2 nodes. The fork is not
removed, it moves one column later.

This is better than a workaround. The boy leaves the hovel, and the
dockmaster is on the quay between him and the three roads — so the map's
premise is handed over *before* the first choice of lane, and the choice is
then an informed one. The arrival cutscene's closing line ("Three ways out of
the yard…") moves to Old Marrow's mouth, where a man pointing at roads is
more natural than a narrator listing them.

Cost, stated honestly: the route count drops (branching starts a column
later) and the two nodes displaced from column 1 move outward. Phase 53c
owns the re-layer and re-runs the strand invariant and the coverage walk.

## Character voice

The ratified register is spec 34 §2 — **terse, archaic-flavored, cold and
old; grim, bodily, superstitious; one clause per line, present tense; no
exclamation marks, no thee/thou, no explanatory parentheticals.**

The four homed NPCs must each be describable in one sentence that is not
true of the other three:

- **Old Marrow** — a man who has already buried more than he will mention,
  offering work in the tone of someone who expects to be refused.
- **The Coastal Beggar** — grief without dignity, asking plainly, and
  entirely aware of how it looks.
- **Captain Blackwater** — the only person here still doing business, and
  the only one who will judge you by how you do yours.
- **The Fisherman's Daughter** — the boy's own age, further along in the
  same reckoning, and not gentle about it.

**Voice lock.** These are the bar, not the shipped lines:

> Old Marrow, offering the quest:
> "A great crab has nested at the breakwater. Bigger than my hauling-table."
> "Bring me proof it is dead. The coin is yours."

> Old Marrow, when the boy has walked past two hazards to get here:
> "You are bleeding on my nets."
> "Sit. It costs me nothing to let you sit."

> The Fisherman's Daughter, if `boy-spared-father-worry` is set:
> "My father asks what a thing will cost. I tell him less than it does."
> "We are both good at it. That is the part I mind."

> The Coastal Beggar, if `boy-told-father-truth` is set:
> "You are the one who told his father the whole sum."
> "The village heard. It is a small village."

**Existing prose does not meet this bar and that is a known, owned gap.**
The eight coastal trees were written before Phase 42's Profane Canon: they
carry exclamation marks, `"Bless you, kind soul"`, and inline meter readouts
like `[Moral meter +5]` in the body text. **Phase 44g owns rewriting them**
— that phase already names `S-01` and "dialogue trees" as its scope. This
spec deliberately does not retheme a single existing line. It changes *which*
lines a player can reach; 44g changes what they say. The two are orthogonal
and can ship in either order, but 53a first is better: it grows 44g's
surface from 3 reachable trees to 7, so the retheme covers what players
actually see.

**New prose authored under this spec ships in the ratified register from the
first draft**, so 44g inherits nothing to redo.

## The read-back web — and the law a gauntlet imposes

The village's problem is not that choices lack consequence in the abstract.
`fv-14`'s three flags are set correctly and read by **nothing** — no
dialogue, no quest, no later node. `marrow_pressed` has the same shape:
authored, set, read by its own test only. Across every authored map there is
exactly one `requires.flag` gate in the whole game.

A gauntlet map constrains the repair in a way worth stating as a rule,
because it is not obvious and it will bite anyone who forgets it:

> **On a gauntlet map, an NPC can only react to something that happened in an
> earlier column.** There is no back-travel. A reaction authored on a node
> the player has already passed is unreachable content — the same defect
> class as N1, arriving by a different road.

That turns the columns into acts, and the web falls out of it:

| column | node | sets | reads |
|---|---|---|---|
| 0 | `fv-1` arrival | — | — |
| 1 | `fv-2` **Old Marrow** | `starting-quest`, `marrow_pressed` | — (nothing precedes him) |
| 3 | `fv-14` father dilemma | one of three `boy-*-father` flags | — |
| 4 | `fv-15` quest board | `build-the-boat` | — |
| 5 | `fv-6` **the boss** | completes `starting-quest` | — |
| 6–8 | **Beggar**, **Blackwater**, **Daughter** | moral / alignment deltas | the father flags, `marrow_pressed`, `starting-quest` completion |

So the second half of the map is where the village answers. Every homed NPC
after the boss carries at least one branch gated on something the player did
before it — and the through-line is deliberate: **the boy who lied to his
father, to spare him, meets someone later who asks a question of the same
shape and is not fooled.**

Reactive branches are **additive**. They appear alongside the ordinary
replies, never replacing them, and a player who set no flag sees a complete
conversation with nothing visibly missing. A gate that empties a node is a
bug; `visibleChoices` fails closed by design, so an under-populated context
silently hides content (this is precisely N3).

## Moral integration

Central, not incidental — and per spec 10 the meter is a *difficulty* input,
so these are mechanical choices wearing narrative clothes.

- **Old Marrow** is the first canonical moral NPC (`docs/story.md`). His
  reward branch is the map's first `moralDelta` fork: take the coin (0),
  take half (+5), demand double (−4, sets `marrow_pressed`). Unchanged by
  this spec — it was always right, it was only unreachable.
- **The Coastal Beggar** is spec 10's demonstration NPC: −5 to +5 across
  seven branches. Unchanged.
- **Captain Blackwater** moves the alignment cube rather than the moral
  meter — `scope` and `outlook`, via gated branches. He is the reason Phase
  53b exists: today those branches cannot render.
- **The Fisherman's Daughter** is the one deliberate exception. Her reactive
  branches set **no `moralDelta` at all**. The father dilemma pointedly
  refuses to score itself; an NPC who then scores it retroactively would
  overrule that refusal. She notices. She does not grade.

## Prior art

Four different solutions to *the world notices what you did*:

- **Pathologic 2 — townspeople memory.** NPCs remember whether the player
  visited them, helped them, or let them die; praised for making the town
  feel alive and consequential. The failure mode is instructive: players who
  fell behind found relationships collapsing for unclear reasons. Our
  forward-only column law is a natural guard against that — a reaction can
  only reference a beat in an earlier column, so it can always be traced to
  something the player just did.
- **Hades — Chronotree / heat-reactive narration.** Characters notice every
  major event without the player ever choosing to tell them; players
  described feeling genuinely known by the cast. Its acknowledged weakness —
  dialogue reflects outcomes but never changes them — is acceptable here,
  because the reactive branches are texture and the *choices* live in the
  dilemmas themselves.
- **Disco Elysium — skill-gated dialogue options.** Options unlock by stat,
  not by virtue; players felt authorship without feeling judged, because the
  gate was competence rather than goodness. This is the model for
  `requiresAlignment` on Captain Blackwater: the branch opens because of who
  the boy has become, not because he passed a morality check.
- **Tyranny — loyalty/fear companion meters.** Both are valid states and the
  game declines to moralize; players appreciated the ambiguity, though some
  found two axes too coarse for "complicated respect". That ambiguity is
  exactly the Fisherman's Daughter's brief — she is the NPC who notices the
  lie and does not tell the player what it made him.

## Cross-references

- `src/World/Continents/Coastal-Village/maps.ts` — `oldDockmasterTree`,
  `beggarTree`, the roster at `fishingVillage.npcs`.
- `src/World/Continents/Coastal-Village/npcs.ts` — Blackwater, the Daughter,
  the Healer, the Union Leader, the Widow.
- `src/World/MapEvents/content.ts` — `fvShoreInteraction` (the mismatch),
  `fvFatherWorryDialogue` (the pattern to follow).
- `specs/story/S-01-fishing-village-northern-forest-dilemmas.md` — the four
  designed dilemmas; its open questions are answered there as of this pass.
- `specs/10-moral-difficulty-meter.md`, `specs/14-philosophical-alignment.md`.
- `specs/34-dark-fantasy-campaign.md` §2 — the ratified register.
- `docs/story.md` — Old Marrow at `fv-2`, and the `marrow_pressed` flag.

## Open questions

Both are answered. They were resolved at phase-planning time on 2026-08-09
rather than left blocking, per `skills/plan-a-phase.md` §4 ("a brief that
leaves Open Qs is a brief that fails its job"). Each is a reversible content
call, not a contract change — T can overrule either without invalidating the
phases.

1. **Roster size.** Home all eight coastal NPCs, or a chosen few?
   > **Answered — four.** Old Marrow, the Coastal Beggar, Captain
   > Blackwater, the Fisherman's Daughter. The other four are recorded as
   > written-not-staged with a per-NPC reason, so the guard can distinguish
   > deliberate from lost. Reversible: adding a fifth later costs one node
   > reassignment and one roster line.

2. **Does the map grow, or do nodes change hands?** Homing NPCs means
   displacing existing content on a full 25-node grid.
   > **Answered — nodes change hands; the grid stays at 25.** The map's
   > size is load-bearing for the route-length and coverage numbers the last
   > audit tuned, and growing it re-opens the strand class. Three encounter
   > nodes convert to interactions, and `fv-2`'s loot cache moves to the
   > node displaced from column 1. Phase 53c owns the exact reassignment and
   > must re-run `auditMapTraversal` plus the coverage walk afterward.

## Proposed approach

1. **Phase 53a** — guard first. Every `interaction` payload's `npcName` must
   resolve in its host map's roster or the import throws, mirroring
   `FV_ENCOUNTER_FOES`. Every rostered NPC with a tree must be either homed
   or listed as written-not-staged with a reason. Repair the four live
   mismatches (`fv-7` → `Hermit Sage`; `nf-14` and `nf-23` are scenery and
   become `cutscene`, not people; `fv-19` resolves under 53c).
2. **Phase 53b** — the gate context. `composeNpcDialogue` supplies
   `alignment` and `lastSeenAlignmentCellId`; mobile carries the
   `lastSeenAlignmentCells` write-back through. Witness: Blackwater's
   greeting renders five replies in the app, not two.
3. **Phase 53c** — placement. Column 1 narrows to `fv-2`; Old Marrow lands
   there; the Beggar, Blackwater and the Daughter take their nodes; the
   arrival cutscene's third line moves into Marrow's mouth. Re-run the
   strand invariant and the coverage walk; add a coverage floor test.
4. **Phase 53d** — S-01's four dilemmas, authored in the ratified register.
5. **Phase 53e** — the read-back web: the post-boss three gain branches
   gated on the father flags, `marrow_pressed`, and `starting-quest`.

## Acceptance checklist

- [x] Open questions answered.
- [ ] Four NPCs homed; four recorded as written-not-staged with reasons.
- [ ] Old Marrow reachable on 100% of legal routes (measured, not asserted).
- [ ] `starting-quest` startable in live play — the fix that proves N2.
- [ ] Every homed tree's gated choices render in the app (53b's witness).
- [ ] At least one reactive branch per post-boss NPC, each reading a flag
      set in an earlier column.
- [ ] New prose reviewed against spec 34 §2; existing prose untouched
      (44g's).
- [ ] `npm test` and `npm run type-check` clean in `axiomancer-mechanics`;
      mobile gate too, for 53b.

## Out of scope

- **Rethemeing existing dialogue prose** — Phase 44g owns it, by name.
- **The shop UI**, and therefore the Tide-Shopkeeper.
- **Northern-forest placement** beyond repairing the three mismatched
  `npcName`s. That map is unreachable until inter-map travel exists
  (first-map audit F4, filed as a phase candidate); staging content there is
  premature.
- **Inter-map travel itself.**
- **The moral meter's numbers.** Existing `moralDelta` values are carried
  over untouched; this spec makes them reachable, it does not tune them.

---

**Note for the skill's next reader.** `.claude/skills/story-spec/SKILL.md`
lists as an anti-pattern: *"Treating fallacy/paradox flavor as optional —
it's load-bearing theme."* That instruction is **stale**. Spec 34 §2.2 bans
philosophy-native jargon (V-1: fallacy, syllogism, aporia, sophist…) outside
NL-9 proper nouns, and Phase 37 retired the fallacy/paradox card category
outright. This spec follows spec 34, which outranks the skill file. The skill
should be corrected in its own pass.
