# 00 — How to use these specs

This file is the practical "operator's manual" for the spec folder. The
why-this-exists rationale lives in [`README.md`](./README.md). This file is
what to do when you sit down to work on the project.

---

## When you don't know what to work on

1. Open [`specs/README.md`](./README.md) and read the **Recommended order**
   table.
2. Pick the topmost spec that isn't `[DONE]` and isn't waiting on you for
   answers.
3. Open that spec. Read sections 1–3 (Goal, Why now, Current state).
4. If section 4 has unanswered questions, you have your task: **answer the
   questions**. You don't need to write code. Answers are a deliverable.
5. If section 4 is fully answered, your task is to tell the AI:
   `"Spec NN is ready, please implement."`

That's it. You're not picking a feature. You're picking a *spec*. The spec
tells you whether you're answering questions or asking the AI to ship.

---

## When you have an idea you want to capture

1. Is it small (single function, single file)? Skip the spec — open a PR
   directly or ask the AI to implement it.
2. Is it medium (a system, multiple files, multiple decisions)? Write a
   new spec in this folder using the template below. Add it to the
   `specs/README.md` table.
3. Is it big (whole new phase)? Update `GAME-ROADMAP.md` first, then
   write one spec per workable chunk.

---

## When the AI is implementing a spec

The AI's loop:

1. Re-reads the spec.
2. Confirms every question in section 4 has an answer (asks if any are
   `> Your answer:` blank).
3. Creates a feature branch `cursor/spec-NN-short-name-<suffix>`.
4. Works through the **Proposed approach** as a series of commits.
5. Updates the **Acceptance checklist** as it ticks boxes.
6. Opens a PR linking the spec.
7. Marks the spec `[DONE on YYYY-MM-DD — see PR #N]` at the top.

If the AI hits an unanswered sub-question that wasn't in section 4 at the
start, it adds the question to section 4 (with a note explaining why it
came up) and stops to ask. It does not invent answers.

---

## When you're answering questions

- Short answers are great. `Yes`, `No`, `(A)`, `Defer to default`, `B but
  with X` are all valid.
- If you have a strong reason, write it. Future-you (and future-AI) will
  appreciate it.
- If a question feels wrong (asking about something that's already been
  decided, or missing the real choice), strike it through and add a new
  question that's correct.
- It's OK to answer half the questions and ship a partial spec — the AI
  will work on what it has and re-prompt for the rest.

---

## Spec template

Copy this into a new file when starting a fresh spec.

```md
# Spec NN — <Short Title>

## Goal

<1-2 sentences: success state.>

## Why now / dependencies

- **Unblocks:** …
- **Depends on:** …

## Current state

<What's already in code? Honest inventory.>

## Open questions

1. **<short tag>.** <Question>
   > Your answer:

2. …

## Proposed approach

If you have no overrides, the AI will implement in this order:

1. …
2. …

## Acceptance checklist

- [ ] All questions answered.
- [ ] At least one hermetic e2e test under `src/<Module>/e2e/` covers the
      change (see `docs/testing.md`).
- [ ] `npm test` and `npm run type-check` are clean.
- [ ] …

## Out of scope

- …
```

> **Reminder:** the hermetic-e2e checkbox is non-negotiable for any spec
> that touches runtime code. If a spec is purely docs / planning, strike
> the line through with a one-sentence reason.

---

## Common pitfalls

- **Trying to implement before answering questions.** Don't — the answers
  drive the design. Implementation without them produces churn.
- **Answering questions you don't actually have an opinion on.** Use
  "Defer to default" or "Either fine — pick whichever". Honest "I don't
  care" is better than a forced opinion.
- **Adding features mid-implementation.** Stop, write a spec, link it
  back to the original. Don't let scope creep eat the PR.
- **Letting specs go stale.** If you change your mind, edit the spec and
  add a `> Updated <date>:` note next to the answer. The spec is the
  source of truth, not your memory.
