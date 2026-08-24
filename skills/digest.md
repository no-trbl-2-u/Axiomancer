# Skill: digest

> **The night shift.** One tick a day: take the loop's pulse,
> append the day's briefing as a stylized, self-contained
> DevLog entry under `devlog/` (open it raw, via the repo's
> HTML preview, or the private hosted DevLog), run the breadth
> checks too slow for the per-commit path, propose gate tunings
> as candidates — never apply them. The instrument panel,
> delivered instead of fetched. The live unified-loop bearings are
> `plan/bearings.md`; the retired pre-monorepo `nexus/` tree is not authority.

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
3. **Breadth checks** (the night-only browser legs):

   ```bash
   npm --workspace axiomancer-mobile run e2e:minigames
   ```

   Failures become HIGH `plan/AUDIT.md` rows — the digest
   files them; the next dispatcher tick fixes them.

3b. **Measurement freshness** (the balance-truth leg,
    2026-07-17):

    ```bash
    npm run baseline:check
    ```

    - **Fresh** → one line in the `While you were out` panel
      ("deck-matrix baseline fresh at `<commit>`").
    - **Stale** (mechanics source moved past the stamp) →
      re-measure with the REDUCED nightly pass, then re-check:

      ```bash
      npm run baseline:regen -- --runs=30 --confidence=reduced-nightly
      ```

      Commit the regenerated
      `deck-matrix-baseline.json` with the digest (a
      measurement is briefing, not shipping). Then READ the
      new numbers as directional evidence. The former ten-preset
      curve (early ~80 / mid ~50 / late 25-35 / impossible 0)
      is historical after the Profane Canon; do not file current
      three-snapshot results as violations of that retired charter.
      Report CQI and terminal outcomes separately. The
      transitional-library hold on tuning work is LIFTED (THE PIPELINE
      LIBERATION, 2026-08-22 — `plan/bearings.md`): a measured
      regression MAY be filed as a `/deck-tuning` candidate again.
      **Measure and report only** — card/deck fixes stay with
      `/deck-tuning`, engine constants stay manual (§4.2-4.3
      rails apply). A reduced pass is directionally honest,
      not confirmation-grade: never cite it for close calls
      without the full 3-seed `npm run baseline:regen`.

4. **Write today's DevLog entry** — create
   `devlog/entries/DIGEST_<YYYY-MM-DD>.md`. Never overwrite a
   past day; the DevLog is an accumulating ledger. The entry is
   a *visual, organized explanation of the day's work*, not a
   flat status dump. Structure (the build parses it — see
   `scripts/build-devlog.mjs`):

   - `# <YYYY-MM-DD>` then a `>` blockquote **headline** (one
     line; a quiet day says so here).
   - **Work-item cards** — one per meaningful change, each a
     `## [<category>] <title>` with `<category>` one of
     `mechanics | ui | content | infra | balance`. Under it:
     `**What:**` (one line — what changed) and `**Why:**` (one
     line — the reason, mined from the commit body / PR / ADR /
     `plan/` note; never invent). Optional: `**Commits:**` short
     SHAs; a fenced ```diff block with a *representative* hunk
     (≤~40 lines — the telling change, not the whole diff);
     `**Shot:** <screen> — <caption>` for UI (step 4a).
   - **Panels** — un-bracketed `##` sections rendered as-is:
     `While you were out` (pulse table: tick, verb, outcome —
     no-ops included), `Needs you` (blocked rows, needs-user
     issues, `[needs-user-call]`s), `Tuning proposals` (step 5,
     or "none"). Add `Queues now` / `Today's intent` as useful.

   Then `npm run site:build` renders the entry into styled HTML,
   refreshes the hub (`devlog/index.html`), AND regenerates the
   Cards / Enemies / Effects catalog from the current engine
   libraries (`npm run catalog` — ts-node export + zero-dep
   render) so the catalog never drifts from what ships. The
   built HTML, `devlog/data/**`, and `devlog/assets/catalog/**`
   are gitignored (phase 57 — Cloudflare Pages serves whatever
   `main`'s tree contains, so generated output never gets
   committed); commit the entry, and any new
   `devlog/assets/<date>/**` screenshots from step 4a. Body
   Markdown: pipe tables,
   `-`/`1.` lists, fenced code / ```diff, `**bold**`, `_italic_`,
   `` `code` ``, `[links](url)`.

4a. **UI shots (visual before/after)** — if the day's commits
    changed any baseline screen
    (`axiomancer-mobile/screenshots/baseline/*.png`), run:

    ```bash
    npm run devlog:shots -- <since-ref> <YYYY-MM-DD>
    # <since-ref> = range start, e.g. the previous digest commit
    # or `git rev-list -1 --before='26 hours ago' HEAD`
    ```

    It diffs the baselines across `<since>..HEAD` and writes
    `devlog/assets/<date>/<screen>.{before,after,diff}.png`
    (before = blob at `<since>`, after = current, diff = a
    pixelmatch highlight). For each `<screen>` it prints
    (`SHOTS_JSON`), add a `**Shot:** <screen> — <caption>` line
    to the matching `[ui]` card so the build embeds the trio.
    Only *noticeably* changed screens are emitted (≥2% pixels,
    `DEVLOG_SHOT_MIN_RATIO`), so trivial diffs stay out. No
    browser and no AI run here — it reuses the committed
    baselines (the verify gate's approved captures), already
    made when the UI change landed.

   **Format contract** (the shared shell in
   `scripts/build-devlog.mjs` guarantees this; keep it honest if
   you touch the shell):
   - Fully self-contained HTML: inline `<style>`, no external
     fetches, no JS. Renders from a raw file open on a phone
     (screenshots are local `devlog/assets/**` files).
   - Phone-first: single column, centered ~`46rem` measure,
     base font ≥16px; tables, diffs, and shot rows scroll in
     their own container — the page never scrolls sideways.
   - Light via `prefers-color-scheme` with a dark default; one
     accent per category chip; restrained, no emojis.
   - `<title>Axiomancer digest — YYYY-MM-DD</title>`; the date
     in the header strip; every entry links back to the index.
   - Boring, diffable DOM: semantic tags, slugged section/card
     ids, styles at the top. Git history is the archive.
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
   triggers one. Run `npm run verify` **synchronously, in the
   same turn** — do not background it and do not call
   `ScheduleWakeup`/`send_later` to resume and commit later.
   The night workflow is one `claude-code-action` invocation:
   when the turn ends, the runner tears down and anything
   uncommitted is gone, no matter what got scheduled. If
   verify is still running when you'd otherwise end the turn,
   keep waiting on it in-turn (a blocking `Bash` call, or a
   poll loop) until it resolves, then commit and push before
   finishing.

## 4. Hard rules

1. Append a new `devlog/entries/DIGEST_<date>.md` each run;
   never overwrite a past day — the DevLog is a ledger. Run
   `npm run site:build` so the committed HTML, hub, and the
   Cards / Enemies / Effects catalog stay in sync with the
   entries and the engine libraries.
2. Ship nothing else — breadth failures become findings, not
   fixes. The night shift briefs; the dispatcher ships.
3. Proposals, never actions (the meta-loop rail).
4. A quiet day still gets a digest — "quiet" is information.
5. One commit; cloud ticks carry the `Cloud-Run:` trailer.
6. No `Co-Authored-By`, no emojis, no `--no-verify` — the
   standing rules apply at 3am too.
7. Never end the turn with the commit/push still pending on
   a backgrounded command or a scheduled wakeup — this run has
   no later turn to resume into (§3.6).

## 5. Failure modes

1. **`gh` unavailable** — degrade to a git-only pulse; note
   the degradation in the digest itself.
2. **Breadth check red** — that's a finding (HIGH AUDIT row),
   not a stop; the digest ships with the finding filed.
3. **Verify gate red on the digest commit itself** — fix only
   what the digest broke; ≤3 iterations, then stop loud per
   the standing rules.
4. **`git pull` divergence** — stop.
5. **`npm run verify` is slow** — wait on it in-turn; do not
   background it past the turn boundary. If it risks the
   job's `timeout_minutes`, that's a finding for tomorrow's
   digest, not a reason to defer this one.

## 6. Quick reference

```bash
devlog/entries/DIGEST_<date>.md      # the deliverable (append, never overwrite)
npm run devlog:shots -- <ref> <date> # collect UI before/after/diff (if screens changed)
npm run site:build                   # catalog (export+render) + entry HTML + hub
npm run baseline:check               # is the deck-matrix baseline stale?
npm run baseline:regen -- --runs=30 --confidence=reduced-nightly  # the reduced re-measure
plan/AUDIT.md                        # breadth failures land here
plan/PHASE_CANDIDATES.md             # tuning proposals land here
gh run list --workflow march -L 20   # the invisible no-ops
npm --workspace axiomancer-mobile run e2e:minigames  # nightly breadth leg
npm run verify
git commit -m "digest: <YYYY-MM-DD>" && git push origin main
```
