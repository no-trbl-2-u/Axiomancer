# Phase 73 — Art generation pipeline (Option A, adapter-shaped)

> Implements T's 2026-08-22 route ruling
> (`plan/ideas/AI_ART_PIPELINE_OPTIONS.md` §9: Option 1, A-then-B).
> Depends on Phase 71. Brief generated 2026-08-27 by `/ship-a-phase` §9.

## Outcome

A `generate(spec) -> image` adapter with a hosted implementation behind
it, a prompt compiler that renders the house style plus a per-subject
spec into a request, wiring into Phase 71's post-process/ingest legs so
a generated image lands as WebP + provenance, and a QA pass that
reports style drift.

## The honesty constraint, stated up front

**No live generation is exercised in this phase.** There is no `.env`
and no API key in this checkout, and spending against a paid image API
is not a call the loop makes for itself. The ruling anticipated exactly
this: *"Absent the key, the acquisition and post-process legs still run;
only the generate call is inert."*

So the shape of the work is: everything except the network call is
built, tested, and proven; the network call is written against the
documented request shape, isolated to one small module, and marked
**UNEXERCISED** in its own header until someone runs it with a key.
Claiming otherwise would be the worst possible outcome for a pipeline
whose entire output is a provenance record.

## Surface

| File | Role |
|---|---|
| `axiomancer-mobile/scripts/art/style.mjs` | the versioned style preamble + per-category composition rules |
| `axiomancer-mobile/scripts/art/prompt.mjs` | the prompt compiler: subject spec -> request |
| `axiomancer-mobile/scripts/art/adapter.mjs` | `generate(spec)`; backend registry; the inert null backend |
| `axiomancer-mobile/scripts/art/backends/openai.mjs` | the hosted implementation (UNEXERCISED) |
| `axiomancer-mobile/scripts/art/qa.mjs` | style-drift report over the shipped set |
| `axiomancer-mobile/scripts/generate-art.mjs` | the CLI: compile -> generate -> hand to Phase 71's ingest |
| `axiomancer-mobile/scripts/art.test.mjs` | the whole pipeline against a fake backend |
| `.env.example` | the key, documented and never committed |

## Decisions made upfront — DO NOT ASK

- **Home is `axiomancer-mobile/scripts/art/`, not a new top-level
  `tools/art-pipeline/`.** The design doc proposed the latter for a
  much larger surface (a manifest, a review UI, a contact-sheet
  builder). What this phase ships is a handful of scripts that wire
  into `ingest-art.mjs`, which already lives in
  `axiomancer-mobile/scripts/`. Splitting them across a new top-level
  directory would separate the generate leg from the ingest leg it
  exists to feed. Reversible: moving them later is a rename.
- **The model id is configuration, not a constant.** The ruling names
  gpt-image-2; `ART_MODEL` in `.env` defaults to it. Hardcoding a
  model this phase cannot call would bake in an unverified assumption,
  and a swappable adapter that pins its own model is not swappable.
- **The null backend is the default when no key is present**, and it
  is not an error. It compiles the prompt, reports exactly what it
  would have sent, and exits 0. That makes the compiler and the ingest
  wiring testable and reviewable without spending anything — and it is
  what the ruling asked for.
- **Provenance is written by the generate path, not bolted on.**
  Backend, model, the full prompt, the style version, and the date go
  into the record, because that record is simultaneously the Steam
  AI-disclosure artifact and the human-curation evidence (raw AI output
  is not copyrightable). A generated asset with no prompt on file is
  worse than no asset.
- **Style drift is measured on what is measurable without a model.**
  Real perceptual drift needs vision judgement; this phase reports the
  mechanical proxies — palette distance from the AXM tokens, luminance
  distribution, alpha coverage, dimension conformance — per asset and
  per category, so the "B upgrade" trigger has a baseline series to
  move against. The vision-assisted grade is named as the follow-up it
  is, not faked.
- **No generated art is committed in this phase.** There is nothing to
  generate with, and adding placeholder output would poison the very
  provenance record the phase exists to produce.

## Tests

| Case | Assert |
|---|---|
| prompt compiler | preamble + category rules + subject text, deterministic |
| style version | changing the preamble changes the recorded version |
| adapter | selects the null backend with no key, the named one with |
| null backend | reports the request and writes nothing |
| fake backend | end-to-end: generate -> post-process -> provenance |
| provenance | carries backend, model, prompt, style version, date |
| QA report | computes its metrics over real shipped assets |
| the sweep | fails if it finds no assets to grade |

## Verify gate

`npm run verify`, the new art test, `npm run assets:check`.

## DoD

- [ ] Adapter with a hosted implementation and an inert default.
- [ ] Prompt compiler renders style + subject deterministically.
- [ ] Generate path hands off to Phase 71's ingest with provenance.
- [ ] QA reports drift metrics with a baseline.
- [ ] Key documented in `.env.example`, absent from the repo.

## Follow-ups (out of scope)

- **Running it.** The first live generation needs a key and a human
  who accepts the spend.
- The vision-assisted candidate pre-screen (§4.6) and the
  contact-sheet review UI.
- `art.manifest.json` + `npm run art:status` — the queryable gap
  report over every art-bearing entity (§4.2).
- The B migration (ComfyUI + FLUX + LoRA), which this adapter exists
  to make cheap and which the QA series exists to trigger.
