# Phase 53e — The read-back web: consequences that come back

> Agent-facing brief. Across every authored map there is exactly **one**
> `requires.flag` gate in the whole game. Every moral choice the player makes
> is currently a fork with one outcome. This is the phase where the village
> notices. Mechanics content. Last of the **narrative-encounters** batch;
> needs 53d's flags and 53b's working gates.

## Why this exists

`fv-14` "What Do I Tell Father?" is well made: three replies, no
engine-signposted correct answer, each setting a distinct flag —
`boy-told-father-truth` / `boy-spared-father-worry` / `boy-deflected-father`.

Those flags are read by exactly one thing in the repository: the test that
asserts they are set. `marrow_pressed` has the same shape — authored, set,
documented in `docs/story.md`, read by its own test only.

So the apparatus for reactive narrative is complete and unused. The player
chooses, the choice is recorded faithfully, and the world never mentions it.
S-01 itself acknowledged this, describing its flags as existing "purely for a
future NPC to react differently in a later conversation." This is that
phase.

## Inputs

1. `specs/story/S-02-fishing-village-voices.md` § "The read-back web" — the
   column table and the through-line.
2. `specs/story/S-01-...-dilemmas.md` — the four dilemmas' flag names, as
   shipped by 53d.
3. `src/World/Continents/Coastal-Village/maps.ts` — `beggarTree` (which
   already has the one working `requires.flag`, on
   `befriended-little-belle`), `oldDockmasterTree` (`marrow_pressed`).
4. `src/World/Continents/Coastal-Village/npcs.ts` — `captainBlackwaterTree`,
   `fishermansDaughterTree`.
5. `src/NPCs/dialogue.ts` — `visibleChoices` and the `requires` shapes.
6. `src/World/MapEvents/content.ts` — `fvFatherWorryDialogue`, the flag
   source.
7. `docs/story.md` — Old Marrow's reward table and `marrow_pressed`.

## Scope

Add reactive branches to the three post-boss NPCs 53c homed, each gated on
something the player did in an earlier column.

| NPC | reads | what it is |
|---|---|---|
| Coastal Beggar | the three `boy-*-father` flags | the village heard; it is a small village |
| Captain Blackwater | `marrow_pressed`, `starting-quest` completed | one businessman's read of how you did business |
| Fisherman's Daughter | the father flags, The Stranger's Net's flags | the peer who is further along the same reckoning |

The existing `befriended-little-belle` branch on the Beggar is the pattern —
it is already correct, already gated, and already reads as the village being
a network of people who notice. Follow it.

**Branches are additive.** They appear alongside the ordinary replies, never
replacing them. A player who set no flag sees a complete conversation with
nothing visibly missing. Place reactive choices **last** in the array, per
the stable-index convention the existing trees already document (several
tests assert choices by index).

**The through-line is deliberate and worth protecting in review:** the boy
who lied to his father, to spare him, meets someone later who asks a
question of the same shape and is not fooled. That is one authored arc across
three separate scenes, not three unrelated callbacks.

## Decisions made upfront — DO NOT ASK

- **Forward-only, strictly.** An NPC may only read a flag set in a strictly
  earlier column. There is no back-travel on a gauntlet; a reaction placed
  before its cause is unreachable content, which is the exact defect class
  this batch exists to end. Assert it, do not trust it.
- **The Fisherman's Daughter sets no `moralDelta` on any reactive branch.**
  The dilemmas refuse to score themselves (53d, ruled); an NPC who scores
  them retroactively overrules that refusal. She notices. She does not
  grade. Blackwater and the Beggar keep their existing meter behaviour on
  their *ordinary* branches — that is their function — but their reactive
  branches are recognition, not judgment.
- **No new flags are introduced here.** This phase only reads. A read-back
  that also writes starts a second web nobody has designed.
- **Do not gate an entire node.** Every homed NPC must have a full
  conversation for a player who set nothing. `visibleChoices` fails closed,
  so a node whose only interesting content is gated reads as broken to the
  majority of players.
- **One reactive branch per NPC minimum, three maximum.** The Beggar reading
  all three father flags is one branch with three leaf texts, not three
  branches — the player made one choice and should see one acknowledgement.

## Surface as `[needs-user-call]`

- Nothing here needs a ruling. If a scene wants a flag that does not exist,
  that is a signal it belongs in a later content pass, not that a new flag
  should be minted mid-phase.

## Prove (DoD)

- **The finding, as a test:** set `boy-spared-father-worry`, walk to the
  Fisherman's Daughter, and her recognition branch is visible; without the
  flag it is not, and the rest of her conversation is unchanged. That
  round-trip — a choice made in column 3, noticed in column 7 — has never
  once worked in this project.
- Every reactive branch covered: gated hidden without the flag, visible with
  it, and the ungated conversation identical in both cases.
- The forward-only law asserted mechanically: for each reactive branch,
  the reader's column index is strictly greater than the setter's.
- Choice-index stability: the tests that assert existing choices by index
  still pass, because reactive branches were appended.
- The `requires.flag` count in authored content moves from 1 to its new
  number, asserted, so a future refactor that silently drops gates is
  caught.
- `npm run verify --workspace axiomancer-mechanics` and
  `--workspace axiomancer-mobile` — 53b's gate context is what makes these
  branches render, and this is the phase that proves it end to end in the
  app rather than only in the engine.

## Follow-ups

- Northern-forest's own read-backs (Pell in dilemma 2, the crowning in
  dilemma 4) are deliberately left for whenever inter-map travel and the
  Northern City exist. S-01 designs both as connective tissue toward content
  that is not built.
- With this landed, the pattern is established and cheap: a new dilemma
  costs one pool and one gated branch. Worth saying so in the phase log —
  the reason this took five phases is that the machinery was broken, not
  that reactive narrative is expensive.
