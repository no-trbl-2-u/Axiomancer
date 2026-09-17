---
name: world-spec
description: World spec creation partner for Axiomancer Mechanics. Helps turn raw notes about a location, region, or environmental beat into a formal spec file in specs/world/. Asks probing questions about atmosphere, mechanical hazards, region state and unlocks, and how the place reacts to player progression. Cites prior art from Disco Elysium, Pathologic 2, Outer Wilds, Hollow Knight, Dark Souls, Sunless Sea, Mörk Borg, and similar games. Creates the spec file when the session is ready to commit. Use when the user says "let's spec a location", "I want to write a region", "let's design the fishing village", "I'm thinking about a map", or any open-ended creative question about places, atmosphere, world geography, environmental hazards, or region-level state.
---

# World Spec

A creation partner for turning raw location ideas into formal spec files
that the dev workflow can act on.

**The job is not to write the spec for the user.** The job is to:

1. Reflect the location idea back and name the *placeness* problem it
   solves — what does the world gain from this location existing?
2. Surface the better question — the one that exposes hidden
   assumptions about how the player will inhabit the space.
3. Show how 2–4 other games handled the same kind of place, including
   what players actually liked and disliked.
4. Offer 2–3 structural alternatives with trade-offs, never just one.
5. Create `specs/world/W-NN-<name-slug>.md` when the user is ready.

**Paths.** All `specs/`, `braindump/`, `content/`, and `docs/` paths
in this skill live under the `axiomancer-mechanics/` package — e.g.
`axiomancer-mechanics/specs/world/`. Never create these directories
at the monorepo root.

This skill is for **places, atmosphere, region-state, and environmental
mechanics**. Use `story-spec` for NPC dialogue trees and authored
beats. Use `character-spec` for a named entity's personhood. The three
rendezvous in `specs/story/` only when a beat couples two axes.

---

## Ground the conversation first

Before responding, read the relevant project files so suggestions don't
contradict existing design:

| Topic | Read first |
|---|---|
| World structure | `docs/world.md`, `content/story/story-bible.md` |
| Existing maps | `src/World/Continents/<continent>/maps.ts` |
| Encounter / hazard model | `docs/effects.md`, `src/Effects/` |
| Existing world specs | list files in `specs/world/` |
| Loose location notes | `braindump/` (recent files), `content/locations/<slug>/` |

One quick read per file is enough.

---

## Phase 1 — Mirror (one short paragraph)

Restate the location idea in your own words and name the *placeness*
problem underneath. Surface request is rarely the real design question.

Example:
> You're asking what should be in the cave north of the village. The
> *placeness* problem underneath is: *the cave is the first location
> with no human inhabitants — what does the world feel like when no
> NPC is around to react to the player?*

If the underlying problem isn't clear, say so and go to Phase 2.

---

## Phase 2 — Better questions (use `AskQuestion` when possible)

Ask 2–4 probing questions. Prefer **meta-questions** over surface ones:

- **Player feeling.** "What should the player feel the first time they
  enter? Wonder, dread, claustrophobia, suspicion, relief?"
- **Pacing.** "Is this a place to pass through, to settle in, or to
  unravel slowly across multiple visits?"
- **State reactivity.** "What about this location should change as the
  player progresses through the broader arc? Atmosphere? Inhabitants?
  Accessibility?"
- **Mechanical pressure.** "Does this place exert pressure on the
  player through hazards (DoT, attribute drain), restrictions
  (action-blocking effects), or scarcity (no rest, no shops)?"
- **Exit clarity.** "When the player leaves, what should they carry
  forward — a memory, a resource, an unlock, a debt?"

Use `AskQuestion` for binary or short-list questions. Free-text
follow-ups are fine for "what does this feel like" questions.

---

## Phase 3 — Prior art (cite 2–4 games)

**Consult the knowledge base first.** Region state, environmental
hazards, and pacing (pass-through vs. settle-in vs. unravel-slowly) are
mechanic shapes the board-game corpus tracks directly — campaign-game,
modular-board, tile-placement, area-movement, push-your-luck. Use
`kb_find_games` (filter by mechanics slug or better-if label) and
`kb_search` / `kb_read_doc` to pull reception evidence for the shape
under discussion — the `mcp__kb-query__*` tools are the only route to
the corpus; there is no local copy to grep, so if they are unreachable,
say so and mark anything offered from memory as UNGROUNDED. Cite hits
as `kb:<game-slug>/<doc> (src-NNN)`; the
`reception/better-if.okf.md` docs (onboarding friction, setup-teardown
cost, rules-ambiguity) are the highest-value pulls for a *place* — they
tell you what real players found tedious or confusing about inhabiting
a space, not just what worked narratively. If the KB has nothing for a
shape you wanted, file it: `gh issue create --repo
no-trbl-2-u/game-knowledge-base --label wishlist --title "<shape>"
--body "<why this session wanted it>"`.

Then read `world-references.md` for the video-game catalog. Pick 2–4
games total (kb corpus + references.md combined) that solved a similar
*placeness* problem. For each, name:

- The pattern (one phrase).
- What about it worked, with the player-reception note.
- What didn't work, and why (so the user can avoid the failure mode).

Don't just praise the prior art — name the trade-off so the user can
decide whether to inherit it.

---

## Phase 4 — Alternatives

Offer 2–3 structural directions, each in this shape:

> **Option A — <short name>** *(inspired by <game / pattern>)*
> Sketch: <one paragraph of how it works in Axiomancer terms>
> Trade-off: <authoring cost, pacing friction, state-tracking surface>
> Telltale failure mode: <what would feel wrong in play if it's broken>

Don't recommend one until asked. The point is to **widen the design
space**, not narrow it.

---

## Phase 5 — Create spec in `specs/world/`

When the user signals they're ready to commit the direction, **create
a spec file** in `axiomancer-mechanics/specs/world/` (not at the
monorepo root).

**Determine the next spec number:**
1. List all files in `axiomancer-mechanics/specs/world/` that match `W-NN-*.md`.
2. Take the highest NN found (treat `00-world-spec-template.md` as 00).
3. New file uses NN+1, zero-padded to two digits.
4. If the directory is empty (besides the template), start at `W-01`.

**Filename:** `axiomancer-mechanics/specs/world/W-NN-<name-slug>.md`

- `<name-slug>` — 2–5 words kebab-cased describing the location,
  e.g. `northern-cave`, `island-village-arrival`, `labyrinth-outer-ring`.

**File content template:**

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

*Add rows as needed. Region state keys follow the naming convention
in `docs/world.md`.*

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

**Rules:**
- Never overwrite an existing spec file. Use the next available
  W-NN number.
- The spec is the full record — write enough that a future implementer
  has all context without reading the chat.
- Atmosphere samples are the voice lock; the implementer uses them as
  the bar to match, not as the final shipped prose.

---

## When to break the ritual

- User says "just give me a spec" → skip Phases 2–4, draft the spec
  directly and ask one clarifying question at the top.
- User wants only prior art → skip to Phase 3.
- The question isn't about a location or place (e.g. an NPC's
  dialogue, a TypeScript bug, a combat mechanic) → do **not** invoke
  this skill; use `story-spec`, `character-spec`, `brainstorm-mechanics`,
  or normal tools.
- User is mid-implementation and asks a quick scoped question about a
  hazard or node id → one short answer is fine; skip the ritual entirely.
- **Unattended (the autonomous loop, e.g. `content-curator` inside
  `/ship-a-phase` or `/iterate`, no human present)** → skip Phases 2 and
  4's back-and-forth. Resolve Phase 2's questions and Phase 4's
  alternatives internally against `world-references.md` prior art and
  spec 34 §2.5 (the delivery register), pick the strongest option, note
  the call in one line under a "Decided unattended" heading in the
  spec's Open Qs section, then go straight to Phase 5 and write the spec
  file. Authorized by `plan/north-star-mork-borg.md` R-D: the loop has
  full authority to author and ship regions/beats without a per-item
  attended session. **The file is still written, always** — it is the
  record the pipeline audits against (`/digest`, `/oversight`), not a
  request for permission that a human must grant first.

---

## Files this skill creates

- `specs/world/W-NN-<slug>.md` — the spec itself.

That is the entire output. The skill does not modify code, world
reducers, or map files; those come through `/ship-a-phase` once a
mechanic phase picks the spec up.
