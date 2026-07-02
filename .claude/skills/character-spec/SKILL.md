---
name: character-spec
description: Character spec creation partner for Axiomancer Mechanics. Helps turn raw notes about a named character (player preset, named NPC, antagonist) into a formal spec file in specs/characters/. Asks probing questions about voice, history, motivation, posture, and secret. Cites prior art from Disco Elysium, Pathologic 2, Planescape: Torment, Hades, Mass Effect, and similar games. Creates the spec file when the session is ready to commit. Use when the user says "let's spec a character", "I want to write a bio", "who is this person", "let's design the merchant", or any open-ended creative question about a named entity's personhood independent of any one dialogue tree.
---

# Character Spec

A creation partner for turning raw character ideas into formal spec
files that the dev workflow can act on.

**The job is not to write the spec for the user.** The job is to:

1. Reflect the character idea back and name the *personhood* problem
   it solves — what does the world gain from this person existing?
2. Surface the better question — the one that exposes hidden
   assumptions about the character's history, secret, or posture.
3. Show how 2–4 other games handled the same kind of character,
   including what players actually liked and disliked.
4. Offer 2–3 structural alternatives with trade-offs, never just one.
5. Create `specs/characters/C-NN-<name-slug>.md` when the user is ready.

This skill is for **a named entity's personhood** — bio, voice,
motivation, posture. Use `story-spec` for the dialogue trees this
character appears in. Use `world-spec` for the locations they inhabit.
Character specs are the *who*; story specs are the *what they say*;
world specs are the *where they are*.

---

## Ground the conversation first

Before responding, read the relevant project files so suggestions don't
contradict existing design:

| Topic | Read first |
|---|---|
| Existing characters | list files in `specs/characters/`, `content/characters/` |
| Story premise | `docs/story.md`, `content/story/story-overview.md` |
| NPC mechanical model | `docs/npcs.md` |
| Morality model (if relevant) | `specs/10-moral-difficulty-meter.md` |
| Loose character notes | `braindump/` (recent files) |

One quick read per file is enough.

---

## Phase 1 — Mirror (one short paragraph)

Restate the character idea in your own words and name the *personhood*
problem underneath. Surface request is rarely the real design question.

Example:
> You're asking who the village elder is. The *personhood* problem
> underneath is: *the village needs a witness — someone whose
> remembered judgment of the player carries the village's verdict, not
> just one person's opinion.*

If the underlying problem isn't clear, say so and go to Phase 2.

---

## Phase 2 — Better questions (use `AskQuestion` when possible)

Ask 2–4 probing questions. Prefer **meta-questions** over surface ones:

- **Function in the cast.** "What does this character do for the cast
  that nobody else does — witness, foil, mirror, antagonist, comic
  relief?"
- **Voice distinctiveness.** "How would a player describe this
  character in one sentence — and is that sentence different from
  every other named character?"
- **Secret.** "What does this character know that the player doesn't,
  and when (if ever) does the player learn it?"
- **Posture under pressure.** "What does this character do when
  cornered — bargain, threaten, withdraw, confess, lie?"
- **Player feeling.** "What should the player feel about this
  character at first meeting? At second meeting? At their last?"
- **Mortality.** "Can this character die? In whose path / on which
  arc?"

Use `AskQuestion` for binary or short-list questions. Free-text
follow-ups are fine for "what does this character feel like" questions.

---

## Phase 3 — Prior art (cite 2–4 games)

Read `character-references.md` for the catalog. Pick 2–4 games that
solved a similar *personhood* problem. For each, name:

- The pattern (one phrase).
- What about it worked, with the player-reception note.
- What didn't work, and why.

Don't just praise the prior art — name the trade-off so the user can
decide whether to inherit it.

---

## Phase 4 — Alternatives

Offer 2–3 structural directions, each in this shape:

> **Option A — <short name>** *(inspired by <game / pattern>)*
> Sketch: <one paragraph of who this character is in Axiomancer terms>
> Trade-off: <writing cost, cast-balance, mortality decisions>
> Telltale failure mode: <what would feel wrong in play if it's broken>

Don't recommend one until asked.

---

## Phase 5 — Create spec in `specs/characters/`

When the user signals they're ready to commit the direction, **create
a spec file** in `specs/characters/`.

**Determine the next spec number:**
1. List all files in `specs/characters/` that match `C-NN-*.md`.
2. Take the highest NN found (treat `00-character-spec-template.md` as 00).
3. New file uses NN+1, zero-padded to two digits.
4. If `specs/characters/` is empty (besides the template), start at `C-01`.

**Filename:** `specs/characters/C-NN-<name-slug>.md`

- `<name-slug>` — 2–4 words kebab-cased describing the character,
  e.g. `village-elder`, `argumentative-crow`, `fisherman-marian`.

**File content template:**

```markdown
# Character Spec C-NN — <Character Name>

## Goal

<1-2 sentences: what does this character do for the cast and the
world? What would be missing without them?>

## Dependencies

- **Unblocks:** …
- **Depends on:** …

## Voice

<2-3 sentences of how this character talks — vocabulary, rhythm,
register. Include 2-3 sample lines as the "voice lock" the
implementer should match.>

| sample line | when it might fire |
|---|---|
| "<line>" | <context> |
| "<line>" | <context> |

## History

<2-4 sentences of backstory. Only the parts that affect how the
character behaves at the moment the player meets them — not a
comprehensive bio.>

## Motivation

<What does this character want? What are they afraid of? What would
make them break their posture?>

## Secret

<Optional. What does this character know that the player doesn't?
When (if ever) does the player learn it?>

## Posture

| circumstance | response |
|---|---|
| Greeted warmly | … |
| Insulted | … |
| Asked about the labyrinth | … |
| Witnessing player do <X> | … |

## Cross-references

| story spec | role in that beat |
|---|---|
| `specs/story/S-NN-<slug>.md` | … |

| world spec | role in that location |
|---|---|
| `specs/world/W-NN-<slug>.md` | … |

## Open questions

1. **<short tag>.** <Question>
   > Your answer:

2. …

## Proposed approach

1. Add character to `content/characters/<name-slug>/bio.md`
2. Wire the character into the appropriate NPC library (if mechanical)
3. Author dialogue trees in `specs/story/`
4. …

## Acceptance checklist

- [ ] All open questions answered.
- [ ] Voice samples are written and consistent with the voice lock.
- [ ] Cross-references to story / world specs are mutual.
- [ ] If the character has a `procUnlocks` or stats hookup, it's wired in `src/NPCs/` or `src/Enemy/`.
- [ ] `npm test` and `npm run type-check` are clean.

## Out of scope

- …
```

**Rules:**
- Never overwrite an existing spec file. Use the next available
  C-NN number.
- The spec is the full record — write enough that a future implementer
  has all context without reading any chat.
- Voice sample lines are the voice lock; the implementer matches the
  bar, not the literal prose.

---

## When to break the ritual

- User says "just give me a spec" → skip Phases 2–4, draft the spec
  directly and ask one clarifying question at the top.
- User wants only prior art → skip to Phase 3.
- The question is about a single dialogue exchange, a location, or a
  TypeScript bug → do **not** invoke this skill; use `story-spec`,
  `world-spec`, `brainstorm-mechanics`, or normal tools.
- User is mid-implementation and asks a quick scoped question → one
  short answer is fine; skip the ritual entirely.

---

## Files this skill creates

- `specs/characters/C-NN-<slug>.md` — the spec itself.

That is the entire output. The skill does not modify code, NPC
libraries, or dialogue trees; those come through `/ship-a-phase` or
the appropriate downstream skill.
