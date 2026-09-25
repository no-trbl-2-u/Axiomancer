# Prompt: THE ROAD, EVENT BY EVENT — build the new story overview from the ground up

> **Superseded (2026-09-24).** In attended sessions on 2026-09-23/24 T
> replaced the event-by-event road this prompt produced with a top-down
> over-arching story document at the same path,
> `axiomancer-mechanics/content/story/story-overview.md` (numbered rulings,
> the prologue, a per-map place-and-theme table, open questions). Do not run
> this method against it. The overview now grows in attended sessions with
> T. Kept as the record of how the 2026-09-18 road was built; that road is
> recoverable at `5089f43`.

> Written 2026-09-17 at T's direction, revised 2026-09-18 when T
> cleared every story law from the repo (THE BLANK PAGE). This file is
> a **handoff prompt**: paste it, or point a fresh attended Claude Code session at
> it, to run one outlining session. §1 is the standing frame. §2 is the
> single decision you settle before the first pitch. §3 is the method.
> §4 is the pivot rule. §5 is the output contract.
>
> **What this is.** The structural successor to the retired
> `content/story/story-overview.md` — the ordered list of what happens
> to the player, start to end. T: *"this is not to help write actual
> character voices or narration. This is to replace story overview."*
>
> **There is no story.** The repo has no canon and no law about what
> the story is — see `plan/bearings.md` (THE BLANK PAGE) and
> `content/story/README.md`. This session starts from nothing. That is
> the point, not an obstacle.
>
> **What this is not.** It is not `/story-spec`, which turns one beat
> into one spec file. It is not `/brainstorm-mechanics`, which is
> Socratic and widens the design space. It does not write voices,
> dialogue, or narration — that is `docs/narrative/` and the spec
> skills' job, later. This session is **linear and narrowing**: it
> walks the player's road from the first minute forward, one event at
> a time, and stops when the road has become a story. It
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
pitch, T chooses, you record, you advance. You do not write prose,
voices, or narration for the game in this session. You write the
**road**: the ordered list of things that happen to the player, each one concrete enough that
`/story-spec` or `/world-spec` could pick it up without asking what it
meant.

## 1. Standing frame — read before the first pitch, do not re-litigate

1. **There is no canon, and you do not invent one.** No arc, no
   premise, no ending, no theme, no canonical characters, no
   world-story. Every prior story document was deleted on T's
   instruction (`story-overview.md`, `S-01`, `S-02`, `C-01`,
   `story-bible.md`, `W-02`). **None is a draft to return to** — do not
   read them out of git history to "stay consistent," because there is
   nothing to be consistent with. The road you build in this session is
   the first story this game has. Where a turn needs a fact that does
   not exist, the pitch proposes it and T decides; nothing is inherited.

2. **Structural, not voiced.** Pitches are outline entries: what
   happens, to whom, where, and what it changes. Plain prose. The
   bible's McCarthy-influenced register is for shipped text and the
   voice-lock samples, not for this document. A pitch that reads like a
   scene has gone too far; a pitch that reads like a theme has not gone
   far enough. The bar is the old overview's own line-items, made
   concrete enough to spec.
3. **Seven maps are shipped and playable, and none of it is canon.**
   In order: `fishing-village` → `northern-forest` → `caverns` →
   `northern-city` → `connecting-river` → `town-across-river` →
   `the-capital`, with ~186 dialogue nodes and 21 `boy-*` flags.
   **Inventory these before pitching anything** — read
   `src/World/Continents/*/maps.ts` and `src/World/MapEvents/content.ts`
   once each — so that a pitch knows what exists. But a shipped line is
   evidence of what an old draft assumed, **never** evidence of what the
   story is. The road may keep, move, rewrite or discard any of it
   freely; no shipped beat has standing, and the flag names are
   identifiers, not a claim that X is a boy. The first pitch of the
   session is against `fishing-village` because it is where a player
   currently begins, not because it is where the story begins.
4. **LOCKED MECHANICS** (Conviction, Surge, Dice — `plan/bearings.md`)
   are not story material. A beat may feed or spend them; no beat
   removes them.
5. **Not a spec session.** No `specs/` file is created here. The output
   is one outline file (§5). Specs come later, one per beat, through
   the existing skills.

## 2. Who the player is — DECIDED, do not ask

**The player is X.** No name, no figure, no identifiers. Decided by T,
2026-09-18, in the session that commissioned this prompt: *"let's go
with this unknown person, no name, no figure, no identifiers except for
'X' which will be a placeholder identifier while we brainstorm."*

**Do not put this to a ballot.** It is settled. Record it in the
overview's header and proceed.

### What X means

- **`X` is scaffolding, not a name.** It is how this document refers to
  the player while the road is being built. It never appears in shipped
  game text, and it is not a working title for a name to be chosen
  later. If the outline ever needs to *call* X something, that is a
  finding for the pivot, not a decision for a turn.
- **No figure** is stronger than *unnamed*. Do not presume X's age,
  gender, body, station, trade, or family. A pitch that needs X to be a
  child, or to have a father, is a pitch that is *proposing* that — say
  so in the tag line, and let T take it knowingly.
- **The order is inverted, deliberately.** Normally the character is
  fixed and events follow. Here the events come first and X is whoever
  the road turns out to have happened to. Who X is becomes an *output*
  of this session, not an input. Lean into that — it is the reason the
  decision was made this way.

### Two live consequences the session carries

1. **The 21 shipped `boy-*` flags assume a figure.** They are live and
   playable (`boy-chased-the-rumor`, `boy-marked-the-crowning`, …). This
   session does **not** rename them — that is engine work, and pausing
   the road for it would be the tail wagging the dog. Note the cost once
   in the overview's `Noted for the pivot`, then keep walking.
2. **X has no relationships either.** No family, no friend, no beloved,
   no rival. If the road needs a bond for a beat to land, that bond is
   something a pitch **proposes** and T accepts — never something the
   session assumes because a story usually has one. Who X is connected
   to is an output of this session, exactly as who X is.

## 3. The method — one event per turn

Each turn has exactly this shape.

**3.1 Anchor.** Re-read the outline file (§5) from the top. State in one
line where the player is and what they carry — memory, resource, debt,
flag. Do not skip this. Turn fourteen forgets turn three otherwise.

**3.2 Pitch four.** Four candidate next events. Each is:

- **An event, not a theme.** *"The ribbon is cut for someone else in the
  village that morning, and X is the one handed the knife"* is an event.
  *"Starts in a fishing village"* is not. Note the pitch presumes X can
  be handed a knife and nothing more — keep pitches that thin unless you
  are deliberately proposing a figure, and tag it when you are.
- **Plain and short.** One to three sentences of outline prose. Not
  a scene, not dialogue, not voice — the old overview's register, made
  sharper.
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
   the last event without a ballot, and it would not surprise T. The
   road has found its own destination; walking further is decoration.
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

One file: `axiomancer-mechanics/content/story/story-overview.md` —
the same path the retired overview held, because this IS the new
overview. Created on the first turn, appended every turn, committed
every turn. While it does not exist, `content/story/README.md` stands
in its place and says there is no story; **when this file is created,
update that README to point at it** and repoint `docs/story.md` and the
two `.claude` spec skills. THE BLANK PAGE's ¶1 lifts at that moment and
not before.

```markdown
# Story overview — the road, event by event

> Session <date>, T present. Built from nothing — no prior canon, by
> T's instruction (THE BLANK PAGE, plan/bearings.md). This file is the
> first story this game has.
> Player: **X** — no name, no figure, no identifiers (decided 2026-09-18,
> §2 of the prompt). X is a placeholder for brainstorming, never shipped text.
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

That is the entire output. No spec files, no code, no voices, no
narration. If the session ends before the pivot, the file's `Status` line
says `walking` and the next session resumes at 3.1 from the last event.

## 6. Hard rules

1. **The bible wins** unless T reopens it by name.
2. **Every pitch is an event.** Not a theme, not a scene.
3. **One event per turn.** No batching, no "here are the next three."
4. **Commit every turn.**
5. **Recommend the pivot; do not perform it.**
6. **`AskUserQuestion` for every choice.** Never infer T's pick.
7. **No emojis.** House style.
