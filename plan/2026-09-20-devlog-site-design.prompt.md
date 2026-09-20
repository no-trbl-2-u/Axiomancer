# Prompt: DEVLOG SITE — design the public development log

> Written 2026-09-20 at T's direction. This file is a **handoff prompt**:
> point a fresh Claude Code session at it to design the public DevLog site.
> Its sibling, `plan/2026-09-20-devlog-public-publish.prompt.md`, builds and
> deploys what this one designs. **Read that file first** — it defines the
> post contract, and the post contract is this site's content inventory.
> Design nothing that the pipeline cannot fill, and leave nothing the
> pipeline produces without a place to live.
>
> This is a design prompt. It produces a design — a spec, a token sheet, and
> working static prototypes of every page type. It does not wire the build,
> the card renderer, or the deploy; those belong to the sibling prompt.

## 0. Your mandate

Design **the public face of Axiomancer's development log**: a site a
prospective player lands on, understands within one screen, and wants to
scroll. Each post shows what changed, shows it *visually* with a before and
an after, and says *why* in plain language.

Three jobs, in this order:

1. **Design the system** — tokens, type, spacing, the woodcut identity
   translated from an app to a web page. Not a restyle of the private
   DevLog: that one was an internal index and reads like one.
2. **Design every page type** as a working static HTML prototype with real
   content pulled from a real entry, not lorem.
3. **Design the before/after component**, which is this site's signature and
   the reason it exists. It gets its own treatment, its own states, and its
   own accessibility story.

You are autonomous. Per AGENTS.md standing rule 6 and THE OPEN GATE, decide
every open question yourself, record the call, and file residue to
`plan/AUDIT.md` as `[loop-call]` rows. `AskUserQuestion` is not yours to use.

## 1. Standing frame — read before designing anything

1. **The identity already exists.** `axiomancer-mobile/docs/VISUAL_LANGUAGE.md`
   — "The Woodcut Codex". Read it whole before you draw anything. The site is
   the same world as the game, seen through a browser: the page-of-a-chronicle
   chrome, the Doré-plate register, the lexicon. It is not a generic dev-blog
   theme with the game's colours dropped in.
2. **Tokens, never hex.** `axiomancer-mobile/theme/palette.ts` defines five
   themes (`ThemeId`; `ashen-gold` is the default). Port the token *names* to
   CSS custom properties so a token change in the app has an obvious
   counterpart here. Do not invent a sixth palette. Do not paste hex literals
   into components — VISUAL_LANGUAGE.md forbids it in the app and the same
   discipline applies here.
3. **Contrast is a gate, not a preference.** The burn-day audit's row 3.10
   found `rust` shipped below AA on three themes behind a commit message
   claiming "no pair regressed". Every text/background pair you ship is
   measured, and the measurement is written down. AA (4.5:1) for body text,
   3:1 for large text and meaningful non-text. A pair you cannot measure is a
   pair you do not ship.
4. **Mobile is the majority case.** Design at 375px first and let it grow. The
   before/after component in particular must work with a thumb, not only a
   mouse.
5. **No emojis** — AGENTS.md standing rule 2, in commits, code, and content.
   The register is woodcut and chronicle; emoji breaks it on sight.
6. **Weight is a design problem.** Every post carries image pairs, and a year
   of posts carries hundreds. If the index page fetches them all, the design
   has failed regardless of how it looks. Treat payload as a design
   constraint with a number attached, not an optimisation for later.

## 2. What exists today — read, do not reinvent

- `devlog/README.md` — what the private site is. The public one supersedes it.
- `devlog/entries/DIGEST_<date>.md` — 54 real entries. Your prototypes use
  the most recent ones. Read three before designing: the structure is already
  there, and it is better than a blank page.
- `scripts/build-devlog.mjs` — the zero-dependency renderer, and its header
  comment documents the entry grammar precisely.
- `devlog/assets/<date>/*.png` — real before/after/diff trios for UI screens,
  already captured (`2026-07-04`, `2026-08-11`, `2026-08-29`). Use these in
  the prototype. Do not mock up before/after with placeholder rectangles when
  three days of real pairs are sitting in the tree.
- `devlog/tuning-lab/tuning-lab-*.html` — hand-authored reports the site links.

## 3. Decisions made upfront — DO NOT ASK, DO NOT RE-LITIGATE

1. **Audience: players and prospective players.** T's call, 2026-09-20. Lead
   with the visual and the why. Commits, shas, test counts and loop machinery
   are secondary — present but subordinate, never the headline. Someone who
   has never opened a terminal is the reader you are designing for.
2. **The full catalog is public** — every card, effect and enemy, with art.
   T's call, 2026-09-20, made with the spoiler cost stated. Design it as a
   browsable feature, not a leak: filterable, linkable, and good enough that
   a reader uses it to get interested rather than to get spoiled.
3. **Five themes ship, `ashen-gold` is default.** A theme switcher is in
   scope. Respect `prefers-color-scheme` on first visit.
4. **Static output.** No framework, no client-side router, no build-time
   dependency beyond what the repo already carries. The existing renderer is
   zero-dep and the public one stays that way. JavaScript enhances; it never
   gatekeeps content.
5. **The before/after component is the product.** If a reader remembers one
   thing about this site, it is seeing the change. Budget your design effort
   accordingly.

## 4. The work

### 4.1 The design system
A single document (`devlog/DESIGN.md`) plus a token stylesheet. Cover: colour
tokens mapped from `palette.ts` and their measured contrast pairs; type scale
and the typefaces (state the licence for anything not already in the repo);
spacing and measure; the chronicle chrome — rules, plates, marginalia — and
how it degrades at 375px; iconography, reusing `components/icons/` canon
where it transfers; motion, and its `prefers-reduced-motion` answer.

### 4.2 Page types, each a working prototype
- **Landing** — what this game is, the newest post, a way in. A stranger's
  first fifteen seconds.
- **Post index** — chronological, scannable, filterable by category
  (`content`, `mechanics`, `infra`, `balance`, `ui`). Shows enough of each
  post to choose one.
- **Post** — the main event. A lede, then work-item cards, each with its
  what, its why, and its before/after. Panels (`While you were out`,
  `Needs you`, `Tuning proposals`, `Queues now`) need a public-facing
  treatment or a documented reason for omission — several are internal in
  tone and may not belong on a player-facing page. Decide and record.
- **Catalog** — cards, enemies, effects. Browse, filter, deep-link.
- **Tuning Lab** — the report index.
- **About** — what Axiomancer is, how the log is made, how to follow it.

### 4.3 The before/after component
Design it properly and specify it completely:
- The interaction. A drag slider, a hover/tap toggle, side-by-side, or a
  stacked pair — pick one as primary, justify it against the others, and make
  it work with touch, mouse and keyboard alike.
- The third image. `devlog-shots.mjs` also emits a `diff` highlight. Decide
  whether the reader ever sees it, or whether it stays an internal artifact.
- Labelling. A reader must never be unsure which side is new.
- Aspect ratios. Screens are tall phone captures; cards are small portraits;
  arena plates are wide. One component, three shapes, no layout break.
- Without JavaScript, and while images load. Both are real states.
- Alt text. Per pair, meaningful, and specified as a rule the pipeline can
  follow — the sibling prompt has to generate it.

## 5. Output contract

Done when all of the following exist on a branch, with a ready-for-review PR:

1. `devlog/DESIGN.md` — the system, the decisions, the contrast table with
   real measured numbers.
2. Working static prototypes of all six page types, using real entries and
   the real committed before/after PNGs, openable from the filesystem.
3. The before/after component as a self-contained, documented prototype with
   every state demonstrated: touch, keyboard, no-JS, loading, and all three
   aspect ratios.
4. A short section in `DESIGN.md` naming the payload budget per page type and
   what the design does to stay inside it.
5. Residue filed per standing rule 7 — anything the sibling prompt must build
   that this design assumes, named explicitly so the build session is not
   guessing.

Do not build the pipeline, the renderer, or the deploy here. Design only.
