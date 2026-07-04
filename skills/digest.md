# Skill: digest

> **The night shift.** One tick a day: take the loop's pulse,
> append the day's briefing as a stylized, self-contained
> DevLog entry under `devlog/` (open it raw, via the repo's
> HTML preview, or the private hosted DevLog), run the breadth
> checks too slow for the per-commit path, propose gate tunings
> as candidates — never apply them. The instrument panel,
> delivered instead of fetched. See
> `nexus/concepts/loop-shapes.md` §2.

## 1. Purpose

The dispatcher's ticks are visible one at a time; nobody
reads twenty run logs. This verb compresses a day of loop
activity — shipped ticks, no-ops, crashes — into one
committed, phone-readable DevLog entry, and owns the
O(everything) work that must never run per-commit.

## 2. Invocation

```
/digest                      # the full nightly pass
```

Runs from `.github/workflows/night.yml` (daily) or by hand.
Never dispatched by `/march` — it is its own loop shape with
its own cadence.

## 3. The procedure

1. **Sync:** `git pull --ff-only`.
2. **Gather the pulse:**

   ```bash
   git log --since="26 hours ago" --oneline
   gh run list --workflow march -L 20 \
     --json displayTitle,conclusion,createdAt,updatedAt
   ```

   Plus queue states: build-plan `[ ]` / `[blocked:]` counts,
   `plan/AUDIT.md` pending, `plan/CRITIQUE.md` pending + last
   pass age, `plan/PHASE_CANDIDATES.md` pending, open
   `triage:needs-user` / `loop:do` issues, deploy state
   (`npm run deploy:check`).
3. **Breadth checks** (the night-only legs — adapt per
   project; see `nexus/customization/hermetic-e2e.md`):

   ```bash
   SMOKE_SAMPLE=full npm run e2e     # every URL, not the sample
   ```

   Failures become HIGH `plan/AUDIT.md` rows — the digest
   files them; the next dispatcher tick fixes them.
4. **Write today's DevLog entry** — create
   `devlog/entries/DIGEST_<YYYY-MM-DD>.md`. Never overwrite a
   past day; the DevLog is an accumulating ledger. Author it
   as Markdown; sections, in order, each a `##` heading:
   `Headline`, `While you were out` (pulse table: tick, verb,
   outcome — no-ops included), `Shipped`, `Queues now`,
   `Needs you` (blocked rows, needs-user issues,
   `[needs-user-call]`s), `Today's intent` (next `[ ]` phase +
   top finding), `Tuning proposals` (step 5, or "none"). Then
   run `npm run devlog:build` to render the styled HTML page
   and refresh `devlog/index.html` — commit the entry and the
   built output together. Supported Markdown: `#`–`######`
   headings, pipe tables, `-`/`1.` lists, fenced code,
   `**bold**`, `_italic_`, `` `code` ``, `[links](url)`.

   **Format contract** (each entry is a page, not a doc — the
   shared shell in `scripts/build-devlog.mjs` guarantees this;
   keep the shell honest if you touch it):
   - Fully self-contained HTML: inline `<style>`, no external
     assets, no fetches, no JS required. It renders from a raw
     file open on a phone.
   - Phone-first: single column, centered ~`42rem` measure,
     base font ≥16px, tables scroll horizontally in their own
     container — the page itself never scrolls sideways.
   - Respect the reader's theme: light via
     `prefers-color-scheme` with a dark default befitting the
     night shift — near-black ground, warm text, one accent
     (Axiomancer's occult-scholar voice; restrained, no
     emojis, no decorative images).
   - Status is color + text, never color alone: the word is
     always present (`shipped`, `no-op`, `crashed`,
     `blocked`); `Needs you` reads loudest; a quiet day says
     "quiet day" in the Headline.
   - `<title>Axiomancer digest — YYYY-MM-DD</title>`; the date
     in a small header strip; every entry links back to the
     index.
   - Boring, diffable DOM: semantic tags, stable slugged
     section ids (`#headline`, `#while-you-were-out`,
     `#shipped`, `#queues-now`, `#needs-you`, `#todays-intent`,
     `#tuning-proposals`), styles at the top, content in source
     order. Git history is the archive; legible diffs matter.
5. **Meta-loop, within rails:** if the pulse shows a mistuned
   gate (critique never firing, the ceiling hibernating
   productive days, a starved queue), file the tuning as a
   `plan/PHASE_CANDIDATES.md` candidate citing the pulse
   numbers. **Never edit gates, cadences, ceilings, or rules
   directly** — proposals only; `/oversight` promotes. The
   loop does not vote on its own constraints.
6. **Gate + commit + push:** `npm run verify`, then one commit
   `digest: <YYYY-MM-DD>` and push. Cloud ticks confirm the
   deploy per the standing rules if the digest commit
   triggers one.

## 4. Hard rules

1. Append a new `devlog/entries/DIGEST_<date>.md` each run;
   never overwrite a past day — the DevLog is a ledger. Run
   `npm run devlog:build` so the committed HTML + index stay
   in sync with the entries.
2. Ship nothing else — breadth failures become findings, not
   fixes. The night shift briefs; the dispatcher ships.
3. Proposals, never actions (the meta-loop rail).
4. A quiet day still gets a digest — "quiet" is information.
5. One commit; cloud ticks carry the `Cloud-Run:` trailer.
6. No `Co-Authored-By`, no emojis, no `--no-verify` — the
   standing rules apply at 3am too.

## 5. Failure modes

1. **`gh` unavailable** — degrade to a git-only pulse; note
   the degradation in the digest itself.
2. **Breadth check red** — that's a finding (HIGH AUDIT row),
   not a stop; the digest ships with the finding filed.
3. **Verify gate red on the digest commit itself** — fix only
   what the digest broke; ≤3 iterations, then stop loud per
   the standing rules.
4. **`git pull` divergence** — stop.

## 6. Quick reference

```bash
devlog/entries/DIGEST_<date>.md      # the deliverable (append, never overwrite)
npm run devlog:build                 # render styled HTML + refresh index
plan/AUDIT.md                        # breadth failures land here
plan/PHASE_CANDIDATES.md             # tuning proposals land here
gh run list --workflow march -L 20   # the invisible no-ops
SMOKE_SAMPLE=full npm run e2e           # the nightly breadth leg
npm run verify
git commit -m "digest: <YYYY-MM-DD>" && git push origin main
```
