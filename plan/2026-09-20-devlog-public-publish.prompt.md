# Prompt: DEVLOG PUBLIC — publish the development log to Cloudflare, with the evidence

> Written 2026-09-20 at T's direction. This file is a **handoff prompt**:
> point a fresh Claude Code session at it to build and deploy the public
> DevLog. Its sibling, `plan/2026-09-20-devlog-site-design.prompt.md`,
> designs what this one publishes. This prompt owns the **post contract**
> below; the design prompt treats it as the site's content inventory.
>
> **This prompt reverses a shipped ruling.** Read section 1 before anything
> else. Phase 57 deliberately un-published the DevLog. You are re-publishing
> it, deliberately, on different terms. Do not discover this halfway through
> and stop; do not quietly leave phase 57's record saying the opposite of
> what the tree now does.

## 0. Your mandate

Ship a **public DevLog at a Cloudflare Pages URL**, updated from the nightly
`/digest` entries, where every post carries visual proof of what changed and
a plain-language reason it changed.

Four jobs:

1. **Re-open publication, on new terms** (section 1) — and correct every
   record that says the DevLog is private.
2. **Build the evidence pipeline** (section 3) — before/after imagery for
   every kind of change that matters, not only UI screens.
3. **Build and deploy the site** (section 4) — a second Cloudflare Pages
   project, built at deploy time, leaving the existing guard intact.
4. **Teach `/digest` the new contract** (section 5) — the nightly skill has
   to produce what the site needs, every night, without a human.

You are autonomous. Per AGENTS.md standing rule 6 and THE OPEN GATE, decide
open questions yourself, record the call in the commit body, and file residue
to `plan/AUDIT.md` as `[loop-call]` rows. `AskUserQuestion` is not yours.

## 1. The reversal — read first, do not re-litigate

`plan/phases/phase_57_devlog_pages_scopedown.md` (shipped 2026-08-15) stopped
publishing the DevLog to Cloudflare Pages. The cause was real: an AUDIT
divergence row (impact 8, confirmed live 2026-08-12) found generated DevLog
HTML being committed to `main` *specifically so Pages would serve it*, and
that HTML's own header read "A private index of the game's content and the
nightly development log". 181 files were untracked, and
`scripts/check-devlog-not-served.mjs` was added as a guard, wired into
`.githooks/pre-commit` and the weekly `check-devlog-served.yml` sweep.

**T reversed the content policy on 2026-09-20**, with the spoiler cost
stated: the log, the evidence and the **full catalog** — every card, effect
and enemy, with art — are public. The reversal is of *what may be published*,
not of *how phase 57 prevented accidental publication*.

So, precisely:

- **The guard stays and keeps working.** `check-devlog-not-served.mjs`, the
  pre-commit hook and the weekly sweep are untouched. Generated output still
  never enters `main`'s tree. This is not a compromise — it is what makes the
  new publication deliberate rather than accidental, which was phase 57's
  actual complaint.
- **Publication happens at deploy time, from a build**, in a second
  Cloudflare Pages project, not by committing HTML.
- **Records get corrected, not left to rot.** Phase 57's brief gains a dated
  note that its content policy was superseded and by what; its AUDIT row gains
  the same; `devlog/README.md` stops describing a private site. The burn-day
  audit exists because this repo had sentences claiming the opposite of the
  tree. Do not add another.

If, while building, you find a class of content that genuinely should not be
public — a real secret, a credential, a third-party asset whose licence
forbids redistribution — that is not covered by T's ruling. Exclude it, and
file a `[loop-call]` row naming exactly what and why.

## 2. The post contract — what every published post contains

This section is the site's content inventory. The design prompt builds to it.

A post is one day. It carries:

- **Date and lede** — the day in one paragraph. Already authored.
- **Work items**, each a card with a bracketed category (`content`,
  `mechanics`, `infra`, `balance`, `ui`), and each carrying:
  - **What changed** — already authored as `**What:**`.
  - **Why it changed** — already authored as `**Why:**`, and now
    **mandatory and substantive**. A why that restates the what ("because
    the number was wrong") fails the contract. It names the player-facing
    consequence, the evidence, or the decision behind the change. This is
    the single most important field on the page for the audience.
  - **Visual before/after** — for every item where a before and an after can
    exist. Section 3 defines the kinds and how each is captured.
  - **Commits** — present, subordinate, linked.
- **Panels** — `While you were out`, `Needs you`, `Tuning proposals`,
  `Queues now` already exist in the entries. Several are written for an
  internal reader. Decide per panel whether it is published, rewritten for a
  public reader, or held back, and record the decision.

The entry grammar is already defined and already parsed — see
`scripts/build-devlog.mjs`'s header comment and `skills/digest.md` section 3.
Extend that grammar; do not invent a second one.

## 3. The evidence pipeline — before/after for everything important

`scripts/devlog-shots.mjs` already solves this for **UI screens**, and solves
it well: it diffs the committed baseline PNGs across the day's git range, so
"before" is the blob at the start ref and "after" is the current blob, with a
pixelmatch highlight as the third image and a 2% minimum-difference gate so
trivial diffs stay out. No model calls, no browser run. Read it before you
build anything: **its design is the pattern the rest of this section
follows.** Deterministic, derived from what the repo already commits, gated on
significance.

Kinds of change and how each gets its pair:

1. **UI screens** — done. Reuse as is.
2. **Cards** — new. Cards are data in `axiomancer-mechanics/src/Cards/cards.library.ts`;
   nothing renders one to an image today. Build a renderer that takes a card
   id and a git ref and produces a PNG of the card as a player sees it, then
   produce the same before/after/diff trio for every card the day's range
   changed. Decisions you own: how the card is rendered (the mobile card
   component driven headlessly, or a faithful standalone renderer), and how
   you prove the rendering matches what ships rather than drifting into a
   second, prettier truth. A renderer that flatters the card is worse than no
   renderer.
3. **Enemies and equipment** — same mechanism as cards where the data shape
   allows. Reuse, do not fork, the card renderer's plumbing.
4. **Keywords** — a keyword's before/after is its rules text and its carriers.
   Decide whether that is an image or a rendered text pair, and say why.
5. **Balance numbers** — the baseline is measured and stamped
   (`npm run baseline:check`, `axiomancer-mechanics/docs/reports/baselines/`).
   A tuning change's before/after is the measured delta. Present it honestly:
   the baseline's own stamp and confidence ride along with any number
   published, per AGENTS.md "Measured truth".
6. **Arena and map art** — plate images already live in
   `axiomancer-mobile/assets/images/`. A new or replaced plate is a natural
   pair.
7. **Engine behaviour with no picture** — a rendered code diff is already
   supported by the entry grammar and stays the answer. Do not manufacture an
   image where a diff is the honest evidence.

Rules for the whole pipeline:

- **Deterministic, no model calls.** Same constraint `devlog-shots.mjs` was
  built under, for the same reason: it runs every night unattended.
- **Gated on significance.** Every kind needs its own version of the 2%
  threshold, or the log fills with noise and the signal dies.
- **Alt text is generated, not omitted.** The design prompt specifies the
  rule; you implement it. An unlabelled image pair is inaccessible and the
  site ships to the public.
- **Missing evidence is stated, never faked.** If a change had no capturable
  before, the post says so. Never show an "after" twice, never reuse a
  neighbouring day's capture.

## 4. Build and deploy

- **A second Cloudflare Pages project**, separate from `axiomancer` (which
  serves the game's web build from `main`'s tree). Public DevLog output is
  produced by a build command and published from the build directory, so
  nothing generated is ever committed. Creating the project needs a human at
  the dashboard once — phase 57 recorded the same constraint. Prepare
  everything that can be prepared in-repo, document the dashboard steps
  exactly, and file the handoff rather than leaving it implied.
- **A build entry point** alongside the existing `site:build`, producing the
  public site rather than the private one. The private local DevLog keeps
  working unchanged; contributors who run `npm run site:build` today see no
  regression.
- **Guard compatibility is a test, not a hope.** Add coverage proving the
  public build's output does not become tracked and that
  `check-devlog-not-served.mjs` still exits 0 on the resulting tree.
- **A deploy check** in the spirit of the repo's existing `deploy:check`:
  after deploy, the public URL serves the newest post and the catalog.
- **Licences.** The catalog publishes art. Provenance is already recorded
  (`docs/art-catalog.json`, `scripts/asset-provenance.test.mjs`,
  `ACCEPTED_LICENCES`). Before publishing any asset, verify its licence
  permits public redistribution and that required attribution is rendered on
  the page. An asset that fails this is excluded and filed — see section 1's
  carve-out. This is the one place where "publish everything" meets a rule
  that is not T's to waive.

## 5. Teach `/digest` the contract

`skills/digest.md` authors the nightly entry. Phase 57 already edited its
step 4 once. Update it so a normal night produces a post that satisfies
section 2 without human help:

- Capture the day's evidence across all applicable kinds from section 3, not
  only screens.
- Enforce the substantive `**Why:**`. The skill is where that standard lives;
  a field the site merely hopes is filled will be empty within a week.
- Commit only source — entries and dated captures — exactly as phase 57 set
  down. The guard will reject generated output, correctly.
- Trigger or tolerate the public deploy per whatever you build in section 4.

## 6. Output contract

Done when all of the following are true on a branch with a ready-for-review PR:

1. The public site builds from a single documented command and renders every
   page type the design prompt specifies.
2. Before/after evidence works for at least: UI screens (existing), cards
   (new), and one further kind from section 3 — with the remainder either
   implemented or filed as named follow-ups, never silently dropped.
3. `check-devlog-not-served.mjs` still exits 0, its hook and weekly sweep are
   untouched, and a test proves the public build cannot regress that.
4. Phase 57's brief, its AUDIT row, and `devlog/README.md` all describe what
   is now true. No record left claiming the DevLog is private.
5. Art licences verified for everything published, with attribution rendered.
6. `skills/digest.md` updated so tonight's unattended run produces a
   conforming post.
7. Both verify gates green, plus the Playwright journeys — the burn-day audit
   learned that `npm run verify` does not run them and CI does.
8. The Cloudflare dashboard handoff documented precisely enough for T to do
   it in one sitting, with the resulting URL recorded once it exists.
