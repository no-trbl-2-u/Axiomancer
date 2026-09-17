# THE TALLY — story bible

> Canon for every authored beat in the game. Replaces
> `story-overview.md` (deleted 2026-09-17, attended `/oversight` +
> `/world-spec` session — T: *"Delete story overview and all mentions
> and extrapolations. I want you to write the most emotionally damaging
> story for this game using the voice of Cormac McCarthy instead of my
> story."*). Authority: THE LONGER LEASH R-D/R-F, THE OPEN GATE ¶8.
>
> **Register:** McCarthy-influenced. Unquoted dialogue, sparse commas,
> `and`-chained clauses, flat declarative sentences about terrible
> things, landscape as an indifferent geological fact. The house style
> already names people by function — the boy, the father, The Herald,
> The Factor, The Ribbon-Picker. That convention stays and hardens.
> **This is a register, not an author. Never reproduce his sentences.**

---

## 1. The lie the game tells you for six hours

The King's advisor is dead. The Labyrinth has opened for the first
time in a hundred years. Every province sends its best child up the
ribbon-roads to be measured, and one of them will be raised so high
that the rest of their life is a different life.

The boy believes this. The villages believe this. The rite is real,
the ribbons are real, the roads are real, the capital is real.

None of it is a lie anyone tells on purpose. That is what makes it
work. Everyone in the chain believes the part of it they can see.

## 2. What is actually true

There is no advisor's chair.

The Labyrinth does not open to be solved. It opens because it empties,
and something has to be put back into it, and what it takes is
children, and it takes them by the hundred, and it has done this every
hundred years since before the provinces had names for themselves.

The rite is the harvest's paperwork. The ribbon is a tag. The Factor's
ledger balances because it is a count of intake, and it has always
balanced, and it will balance this season too.

The Herald already says it, at the gate, to anyone who asks what
happens to the ones who lose:

> Go home. The tally balances either way. That's the whole of the
> mercy in it.

She is not being cruel. She is being accurate. She has said it ten
thousand times and every time it was true.

## 3. The damage

The boy does not lose the girl to the rite.

**He talks her into it.**

She does not want to go. She says so, plainly, in her own village,
with her own green behind her and the ribbon already cut for her. She
says she does not want this. And the boy — who has chased the rumor
since the northern city, who marked the crowning in the caves, who
stood at the river-court and watched a boy his own age be read like a
line of figures and called it a wonder — the boy tells her it is a
great thing. He tells her they will go together. He is not lying. He
believes every word. That is the point.

She agrees because he asked her to.

Every flag the engine already writes is a step on that road:
`boy-chased-the-rumor`, `boy-marked-the-crowning`,
`boy-witnessed-the-river-ritual`, `sweetheart-was-nominated`,
`capital-selection-witnessed`. The game has been keeping the boy's
ledger the whole time, in the same hand The Factor keeps his.

At the capital the bell rings and The Factor reads her color and marks
the page and she goes where the marked ones go. He does not call her
name. The Herald warned him about that at the gate and he did not
hear it.

He is not punished for this. No one blames him. Nobody in the capital
knows him well enough to blame him. That is worse.

## 4. Why the player cannot see it coming, and can see it coming

The information is all on the board from the first hour. The
Gate-Clerk keeps a dead office's ledger because the desk is dry and
the wage is real. The Ribbon-Picker sorts the cut-loose colors into
plain thread and sells the thread, because a ribbon only means
something tied on. The old woman at the river-court reads a boy like a
ledger line. Every one of them tells the truth to a boy who is not
asking the question yet.

On a second run the player sees it in the first ten minutes and cannot
do anything about it, because the only way to keep her home is to
never go to her at all, and the game will not give him that as a
choice, because he would not have taken it.

## 5. The father

The father does not approve and cannot say why. He is not wise. He
does not know about the Labyrinth. He is a man who has watched the
roads fill twice in his life and noticed, without ever forming it into
a sentence, that the children who walk up them do not walk back down.

He gives the boy the axe and the book and the tent and the cart of
fish anyway, because the boy asked, and because a man who cannot give
a reason cannot win the argument, and he knows it.

The last thing he says at the sending-off is not advice. It is:
*Come back and tell me I was wrong.*

## 6. After

The boy walks out of the capital with no ribbon.

That is the condition. Not merit, not the King's favor, not a quest
chain. **The Labyrinth opens to what is left over.** You cannot go in
as a candidate — candidates are what it eats. You go in as the thing
the gate already spent: unclaimed, untagged, nothing left to trade,
nobody's nominee.

So the road onward from the capital is not a promotion. It is what
remains when the thing you walked three hundred miles for has been
done to someone else on your recommendation.

He goes in to get her back. He will not get her back. He goes in
anyway. The game does not correct him and does not reward him. It
simply lets him go, and the doors are very tall, and they have been
open a hundred years at a time for longer than there have been
provinces, and they do not close behind him because they were never
closed to someone with nothing.

## 7. Voice lock

These are the bar, not shipped prose:

> The road went up through the burnt country and the ribbons on the
> fenceposts had gone the color of old blood in the weather and there
> was no one on it going the other way. There never was. He thought
> about that later.

> She said she did not want to go and he told her it would be a great
> thing and she looked at him for a while. All right, she said. If
> you think so.

> The Factor read the color and marked the page. That was all of it.
> It took less time than the bell.

> His father had said come back and tell me I was wrong. He stood in
> the road outside the wall and understood that he could do one of
> those things.

## 7b. The retired specs

`specs/story/S-01`, `specs/story/S-02` and `specs/characters/C-01`
were deleted with the overview (attended session, 2026-09-17, T:
*"Also purge the story specs"*). The content they specified stays
shipped and playable; only the authoring records are gone, and this
bible is the record now.

**One correction on the record.** S-01 and S-02 were fishing-village
and northern-forest narrative — the old overview's first act, fairly
called extrapolation. `C-01 (The Sophist, Protas)` was not: it never
mentioned the advisor or the overview, and its lineage is the Aporia
labyrinth (`W-01`), which is a separate design line with shipped
content in `src/World/Labyrinth/content/act3.content.ts`. It was
deleted because T's instruction named it, and it is recoverable:

```bash
git show 5e14166^:axiomancer-mechanics/specs/characters/C-01-the-sophist.md
```

`/adjust-npcs` runs a spec-to-NPC gap audit that read C-01. That
audit surface is now one file smaller; the steward should not file
the absence as a finding.

## 8. What this does NOT change

- The LOCKED MECHANICS (Conviction, Surge, Dice) are untouched.
- No shipped map graph changes. The capital keeps its nine nodes.
- The Herald, the Ribbon-Picker, the Gate-Clerk and The Factor keep
  every line they already have. **Not one of them needs rewriting** —
  they were already telling this story. That is the find of this
  session, not an accident.
- No new art, no new keyword, no engine wiring proposed here.

## 9. Open questions

1. **Is she recoverable, ever?** This bible says no and means it. A
   later beat that softens it would cost the whole structure.
   > Your answer:

2. **Does the player get to know?** Whether the Labyrinth's true
   function is ever stated outright, or only ever assembled by the
   player from what the minor characters already say.
   > Your answer: (recommendation — never stated outright; the
   > Herald's line is the whole thesis and it is already shipped)

3. **The father's last line** — shipped as written above, or held for
   an attended pass?
   > Your answer:
