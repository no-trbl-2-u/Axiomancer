# Prompt: THE ROAD, EVENT BY EVENT — build the story outline from the ground up

> Written 2026-09-17 at T's direction, the same session that wrote
> `content/story/story-bible.md` (THE TALLY). This file is a **handoff
> prompt**: paste it, or point a fresh attended Claude Code session at
> it, to run one outlining session. §1 is the standing frame. §2 is the
> single decision you settle before the first pitch. §3 is the method.
> §4 is the pivot rule. §5 is the output contract.
>
> **What this is not.** It is not `/story-spec`, which turns one beat
> into one spec file. It is not `/brainstorm-mechanics`, which is
> Socratic and widens the design space. This session is **linear and
> narrowing**: it walks the player's road from the first minute forward,
> one event at a time, and stops when the road has become a story. It
> ends by recommending a pivot to higher-level work, not by doing it.
>
> **T's own words on the shape.** *"I don't want to talk about big
> picture stuff just yet, rather, where does the player start? Then the
> agent will pitch 4 ideas with the option for me to write one in. And
> we'll go on like that, at this start-to-end, event-by-event scale,
> until the agent feels as though we might have enough for an actual
> over-arching story. At that point the agent will recommend we pivot to
> higher-level brainstorming."*

---

## 0. Your mandate

You are the **story lead running an outlining session** for Miserere
Mei, Deus. T is present. Every question goes through `AskUserQuestion`
(root `AGENTS.md` hard rule; shape per `docs/asking-well.md`). You
pitch, T chooses, you record, you advance. You do not write prose for
the game in this session. You write the **road**: the ordered list of
things that happen to the player, each one concrete enough that
`/story-spec` or `/world-spec` could pick it up without asking what it
meant.

## 1. Standing frame — read before the first pitch, do not re-litigate

1. **`content/story/story-bible.md` (THE TALLY) is canon.** It is the
   thesis and the ending: the rite is a cull, the boy talks the girl
   into it, he walks out of the capital with no ribbon, the Labyrinth
   opens to what the gate already spent. This session builds the road
   *toward* that. It does not rebuild it. If a pitch would contradict
   the bible, say so in the pitch and let T choose knowingly — but the
   default is that the bible wins. T reopens it explicitly or not at
   all.
2. **Register.** McCarthy-influenced, per the bible's header: unquoted
   dialogue, sparse commas, `and`-chained clauses, flat declaratives
   about terrible things, landscape as an indifferent fact. People
   named by function. **Every pitch is written in this register.** T
   is choosing between things that sound like the game, not between
   summaries of things.
3. **Seven maps are shipped and playable**, in this order:
   `fishing-village` → `northern-forest` → `caverns` → `northern-city`
   → `connecting-river` → `town-across-river` → `the-capital`. ~186
   dialogue nodes, 21 story flags (all `boy-*`), and the NPCs the bible
   names. **Inventory these before pitching anything** — read
   `src/World/Continents/*/maps.ts` and `src/World/MapEvents/content.ts`
   once each. A pitch may keep, move, or replace a shipped beat, but it
   must know the beat exists. The first pitch of the session is always
   against `fishing-village` as it stands.
4. **LOCKED MECHANICS** (Conviction, Surge, Dice — `plan/bearings.md`)
   are not story material. A beat may feed or spend them; no beat
   removes them.
5. **Not a spec session.** No `specs/` file is created here. The output
   is one outline file (§5). Specs come later, one per beat, through
   the existing skills.

## 2. The one big-picture decision — settle it first, then never again

**Is the player a named character, or is there character creation?**

This is the single exception to "no big picture yet," because you
cannot pitch "where does the player start" without an answer. Ask it
once, with `AskUserQuestion`, before the first pitch. Present these
facts with the ballot, because they are the cost of each option:

- The engine writes 21 story flags and every one is `boy-*`. Every
  dialogue tree addresses him. The bible's mechanism — *his* persuasion
  is what kills her — depends on him being a specific person with a
  specific history the game has been keeping.
- Character creation would mean renaming those flags, re-voicing every
  tree that assumes him, and losing the indictment, since a blank
  cannot be blamed for a history it did not have.

Recommended default: **the boy, unnamed, as shipped.** The house style
already names people by function; a proper name would be the first one
in the game, and it would be the wrong first. If T picks creation
anyway, record it, note the wiring cost as a follow-up row, and pitch
against a blank from then on. Either way: decided once, in the outline
file's header, and not raised again in this session.

## 3. The method — one event per turn

Each turn has exactly this shape.

**3.1 Anchor.** Re-read the outline file (§5) from the top. State in one
line where the player is and what they carry — memory, resource, debt,
flag. Do not skip this. Turn fourteen forgets turn three otherwise.

**3.2 Pitch four.** Four candidate next events. Each is:

- **A beat, not a theme.** *"The morning the ribbon is cut for someone
  else in the village, and he is the one handed the knife"* is a beat.
  *"Starts in a fishing village"* is not.
- **In the register** (§1.2). Two to four sentences. The reader should
  be able to hear it.
- **Tagged** with what it does to the road: which tension it opens or
  tightens, which shipped node it keeps / moves / replaces, which flag
  it would set. One line.
- **Distinct.** Four variations on one idea is one pitch. Aim for four
  different *kinds* of next: a quiet one, a violent one, one that turns
  a shipped beat, one that skips ahead.

**3.3 Ballot.** `AskUserQuestion`, one question, the four pitches as
options, the recommended one first and labelled `(Recommended)`, with
one sentence of why. The tool always adds "Other" — that is T's
write-in. When T writes one in, take it as given, ask at most one
clarifying question if it is genuinely ambiguous, and do not improve
it unasked.

**3.4 Record.** Append the chosen event to the outline file: number,
one-line title, the beat as chosen (T's words if written in), the tag
line, and any flag or node it names. Commit the file. Every turn
commits, so a session that dies mid-road loses one event, not the road.

**3.5 Advance.** Back to 3.1.

Keep turns tight. This is a walk, not a seminar. If T asks a big-picture
question mid-road, answer it in two sentences and offer to note it for
the pivot; do not stop walking.

## 4. The pivot rule — when the road has become a story

After every recorded event, check three conditions. **Recommend the
pivot when any one holds.** Say which one, and say it plainly.

1. **The ending is nameable.** From the events so far you could write
   the last event without a ballot, and it lands on the bible's §6.
   The road has found its destination; walking further is decoration.
2. **Three or more events lean on the same unresolved tension.** A
   thing keeps coming up that no single beat can settle — the father's
   silence, what the Ribbon-Picker actually knows, whether the girl
   ever had a choice. That is the story's spine showing through. It
   needs to be designed from above now, not discovered from below.
3. **Eight events and no throughline.** Nothing recurs, nothing tightens,
   each beat is fine and none of them need each other. That is a
   finding: the road does not know where it is going, and the fix is
   not a ninth event.

The pivot recommendation is one message: which condition fired, what
the road has established (five lines at most), and what the higher-level
session should decide first. Then stop. **Do not run the higher-level
session yourself.** T will open `/brainstorm-mechanics` or a story
session with the outline file as its input. This session's last act is
the recommendation and the final commit.

If T declines the pivot, keep walking. Re-check after every event. Do
not recommend again for the same condition unless something new fires
it.

## 5. Output contract

One file: `axiomancer-mechanics/braindump/<YYYY-MM-DD>-story-outline.md`
(the `braindump/` convention: session captures, dated). Created on the
first turn, appended every turn, committed every turn.

```markdown
# Story outline — the road, event by event

> Session <date>, T present. Canon: content/story/story-bible.md.
> Player: <the boy, unnamed | character creation — decided §2>.
> Status: <walking | pivot recommended (§4 condition N)>.

## Shipped inventory (read <date>)
<seven maps, one line each: what happens there today>

## The road
### 1. <title>
<beat as chosen>
— <tag: tension / node kept-moved-replaced / flag>

### 2. …

## Noted for the pivot
- <big-picture questions T raised mid-road, one line each>

## Pivot recommendation
<empty until §4 fires; then: condition, what the road established,
what to decide first>
```

That is the entire output. No spec files, no code, no prose for the
game. If the session ends before the pivot, the file's `Status` line
says `walking` and the next session resumes at 3.1 from the last event.

## 6. Hard rules

1. **The bible wins** unless T reopens it by name.
2. **Every pitch in the register.** No summaries.
3. **One event per turn.** No batching, no "here are the next three."
4. **Commit every turn.**
5. **Recommend the pivot; do not perform it.**
6. **`AskUserQuestion` for every choice.** Never infer T's pick.
7. **No emojis.** House style.
