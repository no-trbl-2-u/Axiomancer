# Character Specs — Template and Conventions

Character specs live here: `specs/characters/`. They follow the same
principles as mechanic specs (one spec, one body of work, one branch,
one PR) but use a personhood-focused template.

**How to create a character spec:** invoke `/character-spec` and the
skill will walk you through the design conversation and create the
file automatically. You can also copy the template below directly if
you prefer.

---

## Numbering

Files are named `C-NN-<name-slug>.md` where NN is zero-padded and
sequential. This file is `00`; the first real character spec is
`C-01-*.md`.

---

## Template

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

---

## Conventions

- **Never overwrite** an existing spec file. Use the next available
  C-NN number.
- The spec is the **full record** — write enough that a future
  implementer has all context without reading any chat.
- **Voice sample lines** are the voice lock; the implementer matches
  the bar, not the literal prose.
- **Cross-references** to story and world specs should be **mutual** —
  if a character spec references a story spec, the story spec should
  back-reference the character spec.
