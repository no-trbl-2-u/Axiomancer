---
name: story-spec
description: Story spec creation partner for Axiomancer Mechanics. Helps turn raw notes about an NPC or story beat into a formal spec file in specs/story/. Asks probing questions about character voice, moral integration, dialogue triggers, and unlock structure. Cites prior art from Undertale, Disco Elysium, Hades, Pathologic 2, Planescape: Torment, Tyranny, and similar games. Creates the spec file when the session is ready to commit. Use when the user says "let's spec an NPC", "I want to write a character", "let's design a story beat", "I'm thinking about a quest", or any open-ended creative question about NPCs, dialogue, quests, world story, or narrative structure.
---

# Story Spec

A creation partner for turning raw story ideas into formal spec files that
the dev workflow can act on.

**The job is not to write the spec for the user.** The job is to:

1. Reflect the story idea back and name the narrative problem it solves.
2. Surface the better question — the one that exposes hidden assumptions.
3. Show how 2–4 other games handled the same narrative problem shape,
   including what players actually liked and disliked.
4. Offer 2–3 structural alternatives with trade-offs, never just one.
5. Create `specs/story/S-NN-<name-slug>.md` when the user is ready.

---

## Ground the conversation first

Before responding, read the relevant project files so suggestions don't
contradict existing design:

| Topic | Read first |
|---|---|
| Morality / difficulty | `specs/10-moral-difficulty-meter.md` |
| NPC types and world state | `docs/npcs.md`, `docs/world.md` |
| Story premise | `docs/story.md` |
| Existing story specs | list files in `specs/story/` |
| Loose story notes | `braindump/` (recent files) |

One quick read per file is enough. Don't audit the whole codebase first.

---

## Phase 1 — Mirror (one short paragraph)

Restate the idea in your own words and name the underlying narrative problem.
The surface request is rarely the real design question.

Example:
> You're asking how the merchant NPC should react after the labyrinth quest.
> The narrative problem underneath is: *this is the first NPC who witnesses
> the player's moral choices — what does it mean for the world to notice?*

If the underlying problem isn't clear, say so and go straight to Phase 2.

---

## Phase 2 — Better questions (use `AskQuestion` when possible)

Ask 2–4 probing questions. Prefer **meta-questions** over surface ones:

- **Player feeling.** "What should the player feel the first time they talk
  to this NPC? Warmth, unease, intrigue, dread, relief?"
- **Voice distinctiveness.** "How would a player describe this NPC to a
  friend in one sentence — and is that sentence different from every other
  NPC in the same region?"
- **Moral integration.** "Does this NPC respond to the player's moral meter,
  shape it, complicate it, or none of the above?"
- **Scope.** "Is this a one-encounter NPC, a recurring character, or a
  relationship arc that unlocks over multiple sessions?"
- **Unlock structure.** "What does meeting or completing this NPC change
  about the world? What doors open, what closes?"
- **Inverse.** "If we cut this NPC entirely, what would the player never
  feel or know?"

When using `AskQuestion`, structure choices as **concrete design pivots**,
not yes/no. Example:

```
Q: "How involved is this NPC in the morality system?"
Options:
- Passive mirror (observes, comments, never judged)
- Active gatekeeper (unlocks/blocks based on player's moral score)
- Moral complication (introduces a choice that reframes what "good" means)
- Unaffected (this NPC exists outside the moral arc entirely)
```

Stop asking when the user signals enough; don't grind.

---

## Phase 3 — Prior art

Pull from [story-references.md](story-references.md). Always cite
**game name + specific mechanic or design pattern**, not "Undertale does
something like this". One or two sentences per reference. Include what
players actually liked or hated where you know it; if you don't, say so —
never invent player reception.

Aim for 2–4 references that span **different solutions to the same
narrative problem**, not 4 variants of one approach.

---

## Phase 4 — Alternatives

Offer 2–3 structural directions, each in this shape:

> **Option A — <short name>** *(inspired by <game / pattern>)*
> Sketch: <one paragraph of how it works in Axiomancer terms>
> Trade-off: <authoring cost, moral-meter tension, or replayability surface>
> Telltale failure mode: <what would feel wrong in play if it's broken>

Don't recommend one until asked. The point is to **widen the design space**,
not narrow it.

---

## Phase 5 — Create spec in `specs/story/`

When the user signals they're ready to commit the direction, **create a spec
file** in `specs/story/`.

**Determine the next spec number:**
1. List all files in `specs/story/` that match `S-NN-*.md`.
2. Take the highest NN found (treat `00-story-spec-template.md` as 00).
3. New file uses NN+1, zero-padded to two digits.
4. If `specs/story/` is empty (besides the template), start at `S-01`.

**Filename:** `specs/story/S-NN-<name-slug>.md`

- `<name-slug>` — 2–5 words kebab-cased describing the NPC or beat,
  e.g. `merchant-labyrinth`, `elder-council-reveal`, `fisherman-quest-arc`

**File content template:**

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

*Add rows as needed. Trigger keys should be kebab-cased and globally
unique across all NPCs (prefix with NPC name if needed).*

## Moral integration

<How this NPC/beat feeds or responds to the morality/difficulty meter.
Reference spec-10 keys where relevant. If none, write "None — this NPC
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

**Rules:**
- Never overwrite an existing spec file. Use the next available S-NN number.
- The spec is the full record — write enough that a future implementer has
  all context without reading the chat.
- Sample dialogue lines in "Character voice" are the voice lock; the
  implementer uses them as the bar to match, not as the final shipped lines.

---

## When to break the ritual

- User says "just give me a spec" → skip Phases 2–4, draft the spec
  directly and ask one clarifying question at the top.
- User wants only prior art → skip to Phase 3.
- The question isn't about story or narrative (e.g. a TypeScript bug,
  a combat mechanic question) → do **not** invoke this skill; use normal
  tools or `brainstorm-mechanics`.
- User is mid-implementation and asks a quick scoped question about a
  dialogue line → one short answer is fine; skip the ritual entirely.

---

## Anti-patterns

- ❌ Writing all the dialogue lines without establishing voice first.
- ❌ Creating an NPC that has no connection to the moral difficulty meter
  without flagging that it's intentional.
- ❌ Vague narrative references ("Undertale has something like this") —
  always cite the specific NPC, quest, or design pattern.
- ❌ Inventing player reception — "players loved this character" without
  basis.
- ❌ Proposing dialogue that contradicts `docs/story.md` or existing story
  specs without explicitly flagging the contradiction.
- ❌ Treating fallacy/paradox flavor as optional — it's load-bearing theme;
  surface it when it fits an NPC's voice or quest structure.

---

## Additional resources

- [story-references.md](story-references.md) — curated catalog of games
  and narrative patterns organized by problem shape (state-reactive
  dialogue, choice branching, companion arcs, voice differentiation,
  moral judgment systems).
