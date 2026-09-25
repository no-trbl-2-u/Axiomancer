# Prompt: configure the Mörk Borg North Star

> Written via `/oversight` 2026-08-20, at T's direction. This file is a
> **trigger prompt** — paste it (or reference it) to open a fresh session
> that runs the actual brainstorm. It is not itself a design decision, and
> nothing in the live build plan depends on it yet.

## Context you're picking up

T just ruled two things in the same breath, mid-`/oversight` conversation:

1. **The product's tonal North Star is now *Mörk Borg*.** Deck/dice-building
   mechanics stay exactly as they are — this is not a mechanics brief.
   Everything else (art direction, narration voice, encounter design, content
   pipelines) should move toward it.
2. **The product name changed:** "Axiomancer" → **"Miserere Mei, Deus"**
   (Latin, Psalm 51 — "Have mercy on me, God"). This part is *done* — see
   `plan/AUDIT.md`'s product-name row, `plan/archive/2026-09-25-trim-t4/plan/naming-session-2026-08-12.md`
   §6, and build-plan **Phase 67** (queued, not yet shipped — it's the code
   migration for the new title). Don't re-litigate the name in this session;
   it's closed.

What T explicitly deferred to *this* session, rather than deciding inline
during oversight, is everything else the pivot touches:

- What "Mörk Borg direction" concretely means for this game's art, prose,
  and encounter design.
- Reconfiguring narration, art, content-creation, and decision-making
  pipelines to give AI (you, and the skills/subagents you dispatch) **more
  creative freedom** than the current process grants.
- What T needs to provide (references, examples, approval checkpoints,
  budget/scope boundaries) for this to actually ship, not just get designed.

## The tension to open with

Read `plan/bearings.md`, `spec.md`, and
`axiomancer-mechanics/specs/34-dark-fantasy-campaign.md` (the Profane Canon
retheme) before anything else — the current shipped register is
**gothic-cathedral liturgical**: the Drowned Parish, GRACE / THE OATHS,
*Miserere*, *Vitae*, *Aporia*, *the Sophist*. That's a real, coherent,
already-authored identity, not a placeholder.

*Mörk Borg* is not that. Its actual design signature — worth confirming
against the book/community reception rather than assumed — leans
apocalyptic-doom-metal, starkly minimalist prose, a literal countdown to the
world's end, visually loud/collage-hostile layout, and a nihilistic,
irreverent tone that undercuts its own grimness. That is a different flavor
of dark than "liturgical gothic," even though both are "dark fantasy."

**The first thing this brainstorm needs to resolve, before touching
pipelines:** is this a hard pivot away from the liturgical/Drowned-Parish
identity toward Mörk Borg's specific starkness and doom-clock structure, or
an evolution — keep the liturgical vocabulary and setting, but adopt Mörk
Borg's *brutality, minimalism, and irreverence* as the delivery register?
Those produce very different follow-on work. Don't guess — ask T directly,
early, with concrete side-by-side examples (a rewritten line of existing
narration in each direction is more useful than an abstract description).

## What a finished session should produce

1. **A tonal doctrine**, written up as a spec addition or amendment
   (parallel to spec 34's own NL-1..NL-9 register rules) — concrete enough
   that a content-authoring pass or an art brief could be checked against
   it, the way spec 34 is checked today.
2. **An art-direction brief** — palette, layout/collage sensibility,
   reference points — if art generation/commissioning is in scope at all
   (confirm with T; don't assume a pipeline exists yet).
3. **A narration voice guide** — sentence length, register, how much the
   prose is allowed to undercut its own tone — with before/after examples
   against real shipped copy, not invented samples.
4. **A concrete "more AI creative freedom" pipeline design** — this is the
   part that touches process, not just content. Figure out, specifically:
   what review/approval gates exist today for narration, art, and
   encounter content (check `skills/story-spec.md`, `skills/world-spec.md`,
   `skills/character-spec.md`, `skills/brainstorm-mechanics.md`, and the
   `card-expert`/`mechanics-expert` agent definitions for the current
   gates), which of those gates T wants loosened or removed, and what
   guardrail replaces each one that's loosened (a lint, a spot-check
   cadence, a different kind of review) so "more freedom" doesn't become
   "no review."
5. **An explicit list of open questions for T** — anything the session
   can't resolve on its own (budget, timeline, how much of the existing
   \~90-card library / authored NPCs / map content is in scope for a
   retheme vs. grandfathered, whether this blocks or runs alongside the
   normal `/march` phase queue).

## How to run it

This is exactly the shape `skills/brainstorm-mechanics.md` (mechanics-facing)
and `skills/world-spec.md` / `skills/story-spec.md` (content-facing) exist
for — Socratic, cites prior art, offers alternatives with trade-offs, ends
in a written file (they use `braindump/` inside `axiomancer-mechanics/` by
convention). Given this spans tone/art/pipeline rather than one mechanic or
one NPC, treat it as its own session that borrows their method rather than
invoking one of them directly: ask probing questions one at a time (per T's
own stated preference in the oversight conversation this prompt came out
of), don't dump a finished doctrine unprompted, and capture the session as a
new file once it's ready to commit — `plan/` (not `braindump/`, since this
is product-wide, not one mechanic) is the right home, e.g.
`plan/north-star-mork-borg.md`.

**Do not** start editing game content, art assets, or pipeline config in
this session unless T explicitly asks you to move from brainstorm to
execution — the deliverable is the doctrine + pipeline design + open
questions, written up, same as any other spec-creation skill in this repo.
Execution becomes its own build-plan phase(s) once the doctrine exists,
the normal way every other design decision in `plan/` becomes a phase.
