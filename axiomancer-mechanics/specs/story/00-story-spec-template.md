# Story Specs — Template and Conventions

Story specs live here: `specs/story/`. They follow the same principles as
mechanic specs (one spec, one body of work, one branch, one PR) but use a
narrative-focused template.

**How to create a story spec:** invoke `/story-spec` and the skill will
walk you through the design conversation and create the file automatically.
You can also copy the template below directly if you prefer.

---

## Numbering

Files are named `S-NN-<name-slug>.md` where NN is zero-padded and sequential.
This file is `00`; the first real story spec is `S-01-*.md`.

---

## Template

```markdown
# Story Spec S-NN — <NPC Name or Beat Title>

## Goal

<1-2 sentences: what role does this NPC/beat play in the world and
player journey? What would be missing without it?>

## Dependencies

- **Unblocks:** …
- **Depends on:** …

## Character voice

<2-3 sentences of personality and tone. Include 1-2 sample dialogue
lines that establish voice — these are the "voice lock" examples the
implementer should match.>

## Dialogue triggers

| trigger key | context | lines (pick randomly) | unlocks / locks |
|---|---|---|---|
| `greeting` | First meeting | "…" | — |
| `quest_offer_<name>` | After [condition] | "…" | `unlock: <key>` |
| `after_quest_complete` | After [condition] | "…" | `unlock: <key>` |

*Trigger keys are kebab-cased and globally unique across all NPCs.
Prefix with NPC name if needed (e.g. `merchant-greeting`).*

## Moral integration

<How this NPC/beat feeds or responds to the morality/difficulty meter.
Reference spec-10 keys where relevant. If none: "None — this NPC
exists outside the moral arc.">

## Cross-references

<Other NPCs, world nodes, quests, or mechanic specs this connects to.>

## Open questions

1. **<short tag>.** <Question>
   > Your answer:

2. …

## Proposed approach

1. Add NPC dialogue entries to `src/NPCs/<Name>/dialogue.library.ts`
2. Wire unlock/lock keys to world state actions in the appropriate reducer
3. …

## Acceptance checklist

- [ ] All open questions answered.
- [ ] Dialogue lines are written and live in the appropriate `.library.ts`.
- [ ] Unlock/lock keys are wired to world state.
- [ ] Moral integration reviewed against spec-10 (or marked "None").
- [ ] Character voice is consistent across all trigger lines.
- [ ] `npm test` and `npm run type-check` are clean.

## Out of scope

- …
```
