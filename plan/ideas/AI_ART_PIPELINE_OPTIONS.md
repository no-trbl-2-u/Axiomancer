# AI Art Pipeline — Options, Trade-offs, Roadmaps

> Decision document for how Axiomancer generates, post-processes, and
> ingests its illustration set. Written 2026-07-19 from a repo survey
> plus a web research pass (sources + confidence at the bottom).
> Companion to `plan/archive/2026-09-25-trim-t5/axiomancer-mobile/specs/11-asset-pipeline.md`, which
> already decided **art source = AI-generated + post-processed** — this
> doc chooses *how* and turns it into a pipeline.
>
> Status: **DECIDED 2026-08-22 — Option 1 (A-then-B).** T ruled in the
> content-pipelines walkthrough; see §9. Implementation is queued as
> build-plan Phase 73 (adapter + prompt compiler + ingest automation).
> Recorded as a standing decision in `plan/bearings.md` § "ART PIPELINE
> ROUTE".

---

## Executive summary

- **The demand:** ~150+ discrete illustrations at current content size —
  ~73 enemies (54 have temp art), ~71 cards (21 have temp art), a
  growing NPC roster (17 temp portraits), 3 continents of location art,
  labyrinth wall/door tiles, treasure/equipment objects. All existing
  art is explicitly placeholder ("Temp art drop 2026-07-06"). Content
  keeps growing, so this is a *pipeline* problem, not a one-off batch.
- **The house style is already written down:** dark "cold-codex"
  woodcut/ink aesthetic (Mörk Borg as tonal prior art), painted
  figures on black, alpha-matted with glow edges, ≤512–640px WebP.
  The ingest contract exists (per-directory `index.ts` registries +
  `provenance.json`) but every step is manual today.
- **Subscriptions do different jobs.** Claude has no image generation
  (confirmed as of July 2026); Claude Code is the *orchestrator* —
  prompt authoring from specs, batch driving, QA review, registry
  writes. The ChatGPT subscription generates only interactively; an
  automated pipeline needs the **OpenAI API (separate pay-per-use
  billing)** — but at ~$0.04–0.21/image, the full backlog is tens of
  dollars, not a budget item.
- **Four viable routes:** (A) hosted **gpt-image-2 API** with
  reference-image style locking — fastest to ship, zero hardware;
  (B) local **ComfyUI + FLUX.2 [klein] 4B** (Apache 2.0) with a
  trained style LoRA — strongest consistency + reproducibility, free
  per image, needs a ~13 GB VRAM GPU (or rented) and a learning curve;
  (C) **specialist hosted services** (Scenario custom-style training;
  Recraft/Ideogram per-image APIs) — middle ground; (D) **Midjourney**
  — great images, **no public API**, automation violates ToS → manual
  concepting only, never the pipeline.
- **Recommendation:** ship **Option A now** (hosted API + rigorous
  prompt-template system + automated post-process/ingest), designed so
  the generation call is a swappable adapter; upgrade to **Option B**
  (local LoRA) later if/when style drift across the set becomes the
  binding problem. ~80% of the pipeline work (style bible, prompt
  compiler, post-processing, registry/provenance automation, QA loop)
  is identical across options and is never wasted.
- **Legal reality (US):** raw AI outputs are not copyrightable (USCO
  Jan 2025; *Thaler* affirmed Mar 2025), but the game as a whole —
  code, rules, curation, human-modified art — stays protected. Steam
  requires AI-asset disclosure; Apple/Google currently do not for
  pre-generated art. Keep `provenance.json` rigorous; it doubles as
  the disclosure/registration record.

---

## 1. Current state (repo survey, 2026-07-19)

### 1.1 What exists

| Category | Path (under `axiomancer-mobile/assets/images/`) | Have | Need (approx.) |
|---|---|---|---|
| Enemy portraits | `enemies/` | 54 | ~73 in `enemy.library.ts` → **~19 gap** |
| Card art | `cards/` | 21 | ~71 in `cards.library.ts` → **~50 gap** |
| Character portraits | `portraits/` | 17 | grows with `specs/characters/`, story NPCs |
| Combat backgrounds | `combat/` | 1 | per-region arenas (3 continents) |
| Labyrinth tiles | `labyrinth/` | ~34 | 3 acts × ~47 rooms (reuse-heavy) |
| Treasure/objects | `treasure/` | 4 | equipment library (`specs/05b`) |
| UI vector marks | `body.svg`, `heart.svg` | 2 | full icon set per `SVG_ASSET_SPEC.md` |

Plus `tmp-images/` at repo root (36 png walls/doors) awaiting ingest.
**Everything above is placeholder art.** Total demand at current
content size: **~150+ discrete illustrations**, growing with content.

### 1.2 Standing decisions already made (do not re-litigate)

- `plan/archive/2026-09-25-trim-t5/axiomancer-mobile/specs/11-asset-pipeline.md`: art source is
  **AI-generated + post-processed**; typed `assets/index.ts` registry;
  dark-mode-only v1; mixed formats (SVG icons / raster illos).
- Style: **"cold-codex"** woodcut/ink, dark painterly figures on
  black, alpha-matted with graded glow edges (`design-spec.md`,
  `SVG_ASSET_SPEC.md`, Mörk Borg reference doc).
- Post-process contract (documented, currently manual): resize to
  ≤512–640px, WebP conversion, black-background alpha-matting.
- Ingest contract: per-directory `index.ts` slug → `require(...)`
  registries; `provenance.json` per art dir (generator/tool/prompt/date).

### 1.3 The gap

Generation and batch post-processing are entirely off-repo and
by-hand. There is no image tooling in any `scripts/` dir (checked).
The pipeline to build = **generate → post-process → ingest → QA**,
where only the *generate* step differs between the options below.

---

## 2. Ground rules that shape the choice

1. **Consistency beats peak quality.** 150+ images viewed side by side
   in card grids and bestiaries: one gorgeous off-style image is worse
   than a merely-good on-style one. Whatever we pick must make
   image #151, generated months later, match image #3.
2. **Reproducibility is repo policy.** The engine forbids
   `Math.random()`; the art pipeline should honor the same spirit —
   versioned prompts, recorded seeds/parameters, regeneratable assets.
3. **Automation-first.** The nexus loop is autonomous; art should be a
   command (`npm run art:*`), not a chore. Anything requiring manual
   Discord/web-UI interaction can inform the style bible but cannot be
   the pipeline.
4. **Commercially clean.** Shipped mobile game → model licenses and
   output terms must permit commercial use without a lawyer on retainer.
5. **Solo-dev budget/attention.** Prefer cents-per-image or free;
   prefer one system over five subscriptions.

---

## 3. The options

### Option A — Hosted general API: OpenAI **gpt-image-2**

Generate via OpenAI's image API (flagship `gpt-image-2`, snapshot
`2026-04-21`, API since early May 2026), style-locked by passing 3–5
house-style **reference images** with every call (supports up to 16;
fewer, curated references reportedly work better).

**What you'd have to do**
1. Create an OpenAI **API key + pay-per-use billing** (your ChatGPT
   subscription does not cover API calls; Tier 1 = 5 images/min, fine
   for batches of tens).
2. Build the shared foundation (§4): style bible + reference set +
   prompt compiler + post-process + ingest automation.
3. Write a thin `openai` **generator adapter**: `slug + compiled
   prompt + reference images → candidate PNGs` (n=2–4 per subject).
4. Run the backfill in review batches of ~10–15 subjects; human picks
   winners; pipeline post-processes and ingests automatically.

**Costs**: ≈ $0.04 (medium) – $0.21 (high, square) per image;
batch API halves token cost. Full 150-image backlog at 3 candidates
each ≈ **$20–$90 one-time**; marginal card thereafter ≈ $0.12–$0.60.

**Strengths**
- Fastest path to shipping art — days, not weeks; zero hardware.
- Best-in-class prompt adherence + instruction-following edits
  ("same image, torch now extinguished") — good for variants.
- Reference-image conditioning is a real (if statistical) style lock.
- Simple ops: one HTTPS call; trivially driven from Claude Code.

**Weaknesses / risks**
- **Style consistency is probabilistic, not trained.** References + a
  frozen prompt preamble get ~most of the way; expect visible drift at
  the tails and plan a curation/reject loop (~2–3× candidates per keep).
- Reproducibility is weak: no seeds you control; same request twice ≠
  same image. "Regenerate card X like before" means "re-run and
  re-curate," mitigated by archiving originals.
- Platform dependence: model deprecations are real (gpt-image-1
  reportedly sunsets 2026-10-23 — unverified but plausible; assume
  models rotate ~yearly and keep the adapter thin).
- Content policy filters occasionally balk at grimdark subjects
  (gore-adjacent enemies); needs prompt tact or fallback to B/C.

**Verdict**: the pragmatic default. Cheap, immediate, automatable;
its consistency ceiling is the one real question mark.

---

### Option B — Local open-weight: **ComfyUI + FLUX.2 [klein] 4B + style LoRA**

Run generation locally (or on a rented GPU): FLUX.2 [klein] 4B is
**Apache 2.0** (free commercial use, ~13 GB VRAM, sub-second gens),
orchestrated by **ComfyUI in headless API mode** with versioned JSON
workflows, plus a **LoRA trained on 20–50 curated house-style images**
so the style is *baked into the weights*, not begged for in prompts.

**What you'd have to do**
1. Hardware: an RTX 3090/4070-class GPU (~13 GB VRAM) — or rent
   (RunPod/Vast, ~$0.30–0.60/hr; a full batch run is an hour).
2. Install ComfyUI + FLUX.2 klein 4B weights; commit the workflow
   JSONs to the repo (`tools/art-pipeline/workflows/`).
3. Curate the style corpus: pick the ~20–50 best on-style images
   (Option A output works as the bootstrap corpus — this is the
   A→B upgrade path), caption them, train the LoRA (hours, one-off,
   also rentable).
4. Same shared foundation (§4); generator adapter targets the ComfyUI
   HTTP API instead of OpenAI, now with **fixed seeds recorded in
   provenance** → true regeneration.
5. Backfill + curation loop as in A (higher keep-rate expected once
   the LoRA converges).

**Costs**: $0 marginal per image. One-off: GPU you may already own or
~$20–50 of rented hours for setup + LoRA training + backfill.

**Strengths**
- **The consistency ceiling.** A trained LoRA is the only mechanism
  here that makes image #151 *structurally* match image #3.
- **Full reproducibility**: seed + workflow JSON + LoRA hash in
  `provenance.json` → byte-identical regeneration. Aligns with the
  engine's deterministic-RNG ethos.
- Free at the margin → experimentation is unconstrained (100 candidate
  batches, wall-tile permutations, A/B styles).
- No platform risk: weights are yours forever; Apache 2.0 is as clean
  as licensing gets. No content-policy filter on your own hardware.
- ControlNet-style conditioning available for the tile/frame work
  (consistent wall geometry, card-frame compositing).

**Weaknesses / risks**
- Highest up-front effort: ComfyUI learning curve, LoRA training
  craft (dataset curation matters), CUDA yak-shaving. Realistic
  setup-to-first-good-batch: **1–2 weeks of evenings** vs days for A.
- Needs the GPU (owned or rented); adds an ops surface (a server to
  run) that the all-hosted repo currently doesn't have.
- 4B model raw quality < gpt-image-2 on open-ended prompts — the LoRA
  closes this *for the one style that matters*, but hero art (key NPC
  portraits, marketing) may still want a hosted assist.
- Licensing footnote: it's specifically **klein 4B** that is Apache;
  FLUX.2 [dev] and klein 9B are non-commercial-weights tiers — don't
  drift up-model without checking. (Qwen-Image 2.0, also Apache 2.0,
  is the fallback if klein disappoints.)

**Verdict**: the destination if Axiomancer's art identity is a
long-term asset. Best consistency, best reproducibility, zero marginal
cost — paid for in setup time.

---

### Option C — Game-asset specialist services

**C1. Scenario** (~$15–200/mo): train a custom style model on your
art bible in their cloud, then generate style-locked via API — Option
B's consistency mechanism without owning the training stack.
**C2. Recraft** (API, ~$0.035/raster image, vector 2×): style-locked
generation including *custom uploaded styles*; uniquely strong at
**vector/SVG output** — the direct answer to `SVG_ASSET_SPEC.md`'s
icon backlog, which neither A nor B addresses well (raster models
make poor SVGs).
**C3. Ideogram** (API, ~$0.03–0.09/image): best text-in-image
rendering — only relevant if card frames/titles ever get baked into
art (currently they're composited in RN, so likely not needed).
**C4. Leonardo.ai** (~$12–60/mo): game-tuned models + custom training;
UI-first, API on higher tiers; strongest free tier for experiments.

**What you'd have to do (C1 path)**: subscribe → upload style corpus →
train custom model in their UI → same shared foundation (§4) with the
generator adapter pointed at their API → backfill loop.

**Strengths**: trained-style consistency without GPU/ComfyUI overhead;
Recraft slots in as an *additive* icon solution under any option.
**Weaknesses**: platform lock-in on the trained model (retrain
elsewhere from the corpus if they reprice/fold); subscription drag vs
A's pennies; aggregator-sourced pricing (medium confidence — verify
current tiers before committing); another account/billing surface.

**Verdict**: C1 is a legitimate middle path if B's ops burden is
unappealing but prompt-only consistency proves insufficient.
**Recraft is worth adopting for the SVG icon set regardless of the
main-pipeline choice.**

---

### Option D — Midjourney (manual only)

V8.1's `--sref`/moodboards produce superb stylized fantasy art, and a
$10–30/mo plan is cheap — but **there is no public API** (Enterprise
API still in survey stage as of July 2026), and automation through
third-party wrappers **violates ToS with real ban risk**. It can never
be the pipeline.

**Legitimate role**: one-off *style exploration* — spend an evening
finding the cold-codex look, export the winners into the style bible /
LoRA corpus / reference set that A, B, or C then consumes. Optional.

---

## 4. The shared foundation (build once, keeps working under A, B, or C)

This is ~80% of the real work and is option-independent. Proposed
home: `tools/art-pipeline/` (new top-level dev tool, sibling to
`axiomancer-card-editor`; not a workspace the app depends on).

### 4.1 Style bible (`tools/art-pipeline/STYLE.md` + `style-refs/`)
- Prose spec of the cold-codex look distilled from `design-spec.md` +
  Mörk Borg reference: palette (`--axm-*` tokens), linework, lighting
  (single-source, on-black), composition rules per category (enemy =
  ¾ figure on void; card = centered emblem/action; portrait = bust).
- **8–12 canonical reference images** (curated from the best current
  temp art + a Midjourney/gpt-image-2 exploration session), checked
  into the repo. These are the reference-conditioning set (A), the
  LoRA seed corpus (B), and the custom-model corpus (C1).
- A frozen **style preamble** string, versioned (`style/v1`), that
  prefixes every compiled prompt.

### 4.2 Manifest + prompt compiler
- `art.manifest.json` (generated): every art-bearing entity, scraped
  from the libraries — `enemy.library.ts`, `cards.library.ts`,
  portraits/story specs, world content — with slug, category, name,
  flavor/description text, and current asset status (missing / temp /
  final). This makes the art gap *queryable* (`npm run art:status`).
- Prompt compiler: `slug → { style preamble + category template +
  entity-specific description }`. Entity descriptions authored once
  per subject (Claude Code drafts them from specs/flavor text; human
  edits), stored in `prompts/<category>/<slug>.md` — **prompts are
  source code**: reviewed, versioned, diffable.

### 4.3 Generator adapter (the only option-specific part)
- One interface: `generate(slug, prompt, refs, n) → candidates/`.
- Implementations: `openai.ts` (A), `comfyui.ts` (B), `scenario.ts` /
  `recraft.ts` (C). Config picks the backend. Keys via env, never
  committed.

### 4.4 Post-process (automates the documented manual contract)
- `sharp`-based script: candidate PNG → trim → black-background
  **alpha-matte with graded glow edge** (the current hand process:
  luminance-keyed alpha ramp) → resize ≤512–640px → WebP (q≈80) →
  size budget check (warn >150 KB).
- Deterministic and idempotent; unit-testable on fixture images.

### 4.5 Ingest + provenance
- Writes the file into the right `assets/images/<category>/`, updates
  that directory's `index.ts` registry, and appends a full
  `provenance.json` record: backend, model + version, prompt file +
  hash, style version, references used, seed/workflow hash (B),
  date, raw-original archive path. Original uncompressed outputs
  archived (repo LFS or a `art-originals/` dir outside the app bundle)
  so post-processing can be redone without regeneration.

### 4.6 QA / review loop
- `npm run art:review` builds a static contact-sheet HTML (grid of
  candidates per subject, neighbors from the same category alongside
  for consistency judgment). Human picks; choices recorded.
- Claude-assisted pre-screen: Claude Code (vision) grades candidates
  against STYLE.md (palette adherence, composition, obvious artifacts)
  and flags/re-queues failures before human review — turns a 450-image
  curation slog into approving pre-filtered winners.
- The existing `verify:visual` mobile gate then covers in-app
  rendering as usual.

### 4.7 npm surface (root)
```
npm run art:status     # gap report from art.manifest.json
npm run art:gen -- --category enemies --missing   # generate candidates
npm run art:review     # build contact sheet
npm run art:ingest -- --picks picks.json          # post-process + registry + provenance
```

---

## 5. Trade-off matrix

| | A: gpt-image-2 API | B: ComfyUI + FLUX.2 klein + LoRA | C1: Scenario | C2: Recraft | D: Midjourney |
|---|---|---|---|---|---|
| Automatable | ✅ trivial | ✅ full | ✅ | ✅ | ❌ (ToS) |
| Style consistency | ◐ refs + prompt (drift at tails) | ✅ trained LoRA | ✅ trained model | ◐ custom style | ✅ `--sref` (manual) |
| Reproducible (seed) | ❌ | ✅ | ◐ | ◐ | ❌ |
| Marginal cost/image | ~$0.04–0.21 | $0 | sub'n | ~$0.035 | sub'n |
| Up-front effort | days | 1–2 wks | ~week | days | evening |
| Hardware | none | ~13 GB VRAM GPU (or rented) | none | none | none |
| Commercial license | ✅ (user owns outputs) | ✅ Apache 2.0 (klein 4B specifically) | ✅ | ✅ | ✅ (<$1M rev tier) |
| Platform risk | model rotations | none | lock-in | low | n/a |
| Raw quality ceiling | highest | good (LoRA closes gap in-style) | good | good (best SVG) | highest |
| Grimdark content filters | occasional | none | some | some | some |

---

## 6. Recommendation + roadmap

**Recommended path: A-then-B ("hosted now, sovereign later"), with
Recraft as an icon side-channel when the SVG backlog comes due.**
Rationale: A ships real art this month for tens of dollars and
produces, as a by-product, exactly the curated on-style corpus B's
LoRA needs. The adapter seam (§4.3) makes the switch a config change.
Skip straight to B only if you already own the GPU *and* enjoy the
tinkering; choose C1 instead of B if trained-style consistency proves
necessary but you never want to run ComfyUI.

### Phase art-1 — Foundation + style lock (~2–4 evenings)
- [ ] Optional: one manual exploration session (ChatGPT UI and/or a
      $10 Midjourney month) to nail the cold-codex look.
- [ ] Write `STYLE.md` + commit 8–12 reference images (`style/v1`).
- [ ] Build manifest scraper + `art:status` (makes the gap queryable).
- [ ] Decision gate: generate the **same 10 test subjects** (5 enemies,
      3 cards, 2 portraits) via gpt-image-2 with references; judge
      consistency on a contact sheet. Good enough → Phase art-2.
      Not → pull Phase art-4 (B) forward, or trial C1.

### Phase art-2 — Pipeline build (~1 week of evenings)
- [ ] `tools/art-pipeline/`: prompt compiler, openai adapter,
      sharp post-process (alpha-matte/glow/WebP), ingest + provenance
      + registry writer, contact-sheet review tool. Unit tests on
      fixtures; no app-code changes beyond generated registries.
- [ ] OpenAI API billing set up; keys in env; costs logged per batch.

### Phase art-3 — Backfill (~2–3 weeks calendar, mostly review time)
- [ ] Author entity prompt files category-by-category (Claude drafts
      from specs, human edits).
- [ ] Batches of 10–15 subjects, 3 candidates each: cards gap (~50) →
      enemies gap (~19) → replace worst temp art → portraits →
      combat backgrounds → treasure. (Cards first: biggest gap,
      smallest per-image stakes, fastest style-calibration feedback.)
- [ ] Ingest `tmp-images/` walls/doors through the same post-process
      so the labyrinth set stops living at repo root.
- [ ] Running cost check vs the ~$90 ceiling; archive all originals.

### Phase art-4 — Consistency upgrade (optional, when drift bites)
- [ ] Curate 20–50 best ingested images → LoRA corpus.
- [ ] ComfyUI + FLUX.2 klein 4B (local or rented GPU); train
      `axiomancer-codex-v1` LoRA; commit workflow JSONs.
- [ ] `comfyui` adapter with fixed seeds in provenance; re-run the
      Phase art-1 test set; if it beats A on consistency, flip the
      default backend. Regenerate outliers flagged in review history.

### Phase art-5 — Icons + ship hygiene (when UI icon work is scheduled)
- [ ] Recraft custom style from the reference set → burn down the
      `SVG_ASSET_SPEC.md` icon backlog via API (~$0.07/vector).
- [ ] Pre-ship: verify store policies against primary sources
      (Apple 5.1.2 / Play AI policy — currently no disclosure needed
      for pre-generated art; re-check at submission). If a
      Steam/desktop build ever happens, fill the AI disclosure from
      `provenance.json`.

---

## 7. Legal & disclosure notes (US, July 2026)

- **Copyright**: prompts alone ≠ authorship; raw AI images are public
  domain (USCO Part 2, 2025-01-29; *Thaler v. Perlmutter* aff'd D.C.
  Cir. 2025). Human selection/arrangement/modification *is*
  protectable, and AI art does not taint the rest of the game's
  copyright (code, text, rules, composition). Practical posture:
  competitors could copy individual raw images, not the game. The
  post-process + curation + compositing layer adds protectable human
  authorship; keep `provenance.json` records of human edits if
  registration ever matters.
- **Terms**: OpenAI assigns output ownership to the user, commercial
  use OK. FLUX.2 klein **4B** = Apache 2.0 (watch: dev/9B tiers are
  non-commercial weights). Midjourney: subscribers own outputs
  (<$1M revenue on any paid tier).
- **Stores**: Steam requires AI-content disclosure for player-facing
  assets (policy clarified 2026-01-17) — relevant only if a desktop
  port ships. Apple/Google: no disclosure currently required for
  pre-generated art; Google Play's AI rules target *in-app*
  generation (Axiomancer has none); verify primary policy pages at
  submission time (secondary-source confidence: medium).

---

## 8. Open questions / verify-before-commit

- Exact gpt-image-2 price matrix (pull OpenAI's in-docs calculator
  when budgeting Phase art-3; figures above are medium-confidence).
- Scenario current tiers + whether custom training is on the entry
  tier (aggregator data only).
- gpt-image-1 deprecation date (2026-10-23 reported, unverified) —
  irrelevant if we start on gpt-image-2.
- Whether the alpha-matte/glow recipe used for the July temp drop is
  written down anywhere beyond `provenance.json` notes — recover the
  exact recipe from the person who ran it before scripting it (§4.4).
- GPU situation: does the dev machine have ≥13 GB VRAM? Determines
  whether Phase art-4 is local or rented.

## 9. Decision — RULED 2026-08-22: Option 1 (A-then-B)

T's call, given in the content-pipelines walkthrough (attended remote
session, the same conversation that produced THE PIPELINE LIBERATION):

> **1. A-then-B** — start hosted, keep the LoRA upgrade path.

Binding consequences:

- **Now:** hosted **gpt-image-2 API** generation, with the generate
  call isolated behind a **swappable adapter** so option B can replace
  it without touching the rest of the pipeline.
- **Later, conditionally:** migrate to local **ComfyUI + FLUX.2
  [klein] 4B + trained style LoRA** when (and only when) style drift
  across the growing set becomes the binding problem. That trigger is
  a measurement, not a calendar date — the QA loop reports it.
- **Never:** option D (Midjourney) inside the automated pipeline —
  no public API, automation violates ToS. Manual concepting only.
- **Prerequisite:** an OpenAI API key in `.env` (gitignored). Absent
  the key, the acquisition and post-process legs still run; only the
  generate call is inert. The loop must never commit the key.
- **Provenance is mandatory, not best-effort:** generator, model,
  prompt and date per asset in `provenance.json`. Raw AI output is
  not copyrightable (USCO Jan 2025; *Thaler* Mar 2025), so that record
  is simultaneously the Steam AI-disclosure artifact and the
  human-curation evidence.

The route-independent ~80% (style bible, prompt compiler,
post-process, registry/provenance automation, QA loop) is built once
and carries across a future A→B migration.

---

### Research provenance

Repo survey and market research performed 2026-07-19 by subagents;
market claims carry the confidence labels noted inline. Key sources:
OpenAI API pricing/model docs (developers.openai.com), BFL licensing
(bfl.ai, HuggingFace model cards), flux2 GitHub, Midjourney official
docs/updates, Recraft + Ideogram vendor pricing pages, USCO
copyright.gov/ai + Part 2 report analyses (Skadden, Jones Day,
Perkins Coie), Steam disclosure coverage (PC Gamer, Game Developer,
2026-01-17), Anthropic Claude Design announcement (2026-04-17).
Aggregator-sourced items (Scenario/Leonardo tiers, some per-image
dollar figures, Apple/Google policy summaries) are flagged medium
confidence — re-verify against primary pages before spending.
