# Lessons

> The domain-keyed corpus. Unlike `reflexes.md` (always read
> in full), this file is read **by offset** — a skill greps
> for its own `<!-- @domain:x -->` anchor and reads from
> there, not the whole file. Caps are hard: ≤500 bytes per
> bullet. See `../../customization/lessons-layer.md` for the
> promotion path (lesson → reflex) and the drain path (reflex
> → skill procedure edit).

<!-- @domain:deploy -->

## Deploy

1. 2026-07-18 — Background march/night loops share the ONE working
   tree. A live loop swept an uncommitted local edit into its own
   commit, entangled with its half-done feature (+ a type error), and
   my new branch inherited it. Pause the loop before local phase work;
   if you can't, ship clean via an isolated `git worktree add --detach
   <tmp> origin/main`, `git checkout <sha> -- <only-your-files>`,
   commit there, and push by SHA — never the shared tree. Source: PR
   #120 (color-match rider removal).

<!-- @domain:data -->

## Data

1. 2026-07-18 — An A/B court that swaps cards must VALIDATE the
   structural laws (5/5/5 color law, deck size) before measuring, or it
   ratifies illegal seats: D8's court measured augury's valve in a
   heart seat for a mind card (+3.3, best result) and only the
   structural test caught it — the ratified number was for an
   unshippable deck. Bake the law checks into the court harness, not
   just the after-the-fact tests. Source: 10ec4fe8 (Phase D8).

<!-- @domain:review -->

## Review

1. <ISO> — <one-line lesson, ≤500 bytes>. Source:
   <commit or issue reference>.

## Adding a domain

Append a new `<!-- @domain:<name> -->` anchor + `##` heading
at the bottom. Keep domain names short and stable — skills
reference them by name (`grep '@domain:deploy'`), so a rename
is a breaking change to every skill that reads this file.
