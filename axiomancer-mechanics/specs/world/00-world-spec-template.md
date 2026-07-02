# World Specs — Template and Conventions

World specs live here: `specs/world/`. They follow the same principles
as mechanic specs (one spec, one body of work, one branch, one PR) but
use a location-focused template.

**How to create a world spec:** invoke `/world-spec` and the skill will
walk you through the design conversation and create the file
automatically. You can also copy the template below directly if you
prefer.

---

## Numbering

Files are named `W-NN-<name-slug>.md` where NN is zero-padded and
sequential. This file is `00`; the first real world spec is `W-01-*.md`.

---

## Template

```markdown
# World Spec W-NN — <Location Name>

## Goal

<1-2 sentences: what role does this location play in the world and
player journey? What would be missing without it?>

## Dependencies

- **Unblocks:** …
- **Depends on:** …

## Atmosphere

<2-3 sentences of sensory language: what does it smell, sound, look
like at first arrival? Include 1-2 sample descriptive lines as the
"voice lock" the implementer should match when writing the in-game
prose.>

## Region state

| state key | meaning | how it changes |
|---|---|---|
| `fog-of-war.<slug>` | Unlocks the location on the world map | Set when player completes <event> |
| `<location>.completed` | Marks the location as exhausted | Set after the boss/quest fires |

*Region state keys follow the naming convention in `docs/world.md`.*

## Mechanical hazards

<Effects active in this region — DoT, action restrictions, stat
modifiers. Reference Spec 01 (Effects) keys where relevant.>

| effect id | trigger | intensity / duration | who it targets |
|---|---|---|---|
| `<effect_id>` | <on-enter / per-round / on-leave> | <…> | <player / all combatants> |

## Map / node sketch

<Optional ASCII or text sketch of the node graph: how the player moves
through the location, which nodes connect, where the boss / exit lives.>

## Cross-references

<Other locations, story beats, characters, or mechanic specs this
connects to.>

## Open questions

1. **<short tag>.** <Question>
   > Your answer:

2. …

## Proposed approach

1. Register the new map in `src/World/Continents/<continent>/maps.ts`
2. Add MapNodes for each location beat
3. Wire region state keys to world reducer
4. …

## Acceptance checklist

- [ ] All open questions answered.
- [ ] Atmosphere prose is written and consistent with voice-lock samples.
- [ ] Region state keys are wired to the world reducer.
- [ ] Mechanical hazards reference real effect IDs from `src/Effects/`.
- [ ] Cross-references to story / character specs are mutual.
- [ ] `npm test` and `npm run type-check` are clean.

## Out of scope

- …
```

---

## Conventions

- **Never overwrite** an existing spec file. Use the next available
  W-NN number.
- The spec is the **full record** — write enough that a future
  implementer has all context without reading any chat.
- **Atmosphere samples** are the voice lock; the implementer matches
  the bar, not the literal prose.
- **Region state keys** must align with `docs/world.md`'s naming.
- **Hazard effect IDs** must reference real entries in
  `src/Effects/buffs.library.json` / `debuffs.library.json`.
