# Concepts: asking well

> A reusable convention for the rare moments where an agent is
> allowed to ask the user a question. In this repo that's
> `/oversight` (the only loop skill that may ask), the interactive
> design skills in `.claude/skills/` (brainstorm / character / story /
> world-spec, which interview by design), and any attended session
> (root `AGENTS.md` hard rules: every question goes through
> `AskUserQuestion`).
>
> The loop's standing rule is "skills decide, only `/oversight`
> asks." But when an agent *does* ask, the shape of the ask is
> load-bearing. Bad questions cost minutes per click and trash the
> user's trust. Good questions feel like a competent colleague
> handing you a short ballot with the obvious choice
> pre-highlighted.

---

## The six rules

### 1. One to four questions per batch.

Never five. Never one with eight sub-parts. The batch is the unit of
attention; if you can't fit the decision into 1-4 clean questions,
you've conflated two batches.

If the user is going to make 12 decisions, that's three batches of
four — not one wall of 12. Surface a batch, collect answers, apply
what you can, surface the next batch.

### 2. Recommended option first, labeled `(Recommended)`.

Every multiple-choice question has a recommended answer. Put it first
in the option list. Append the literal string `(Recommended)` to its
label. The user clicks faster, the agent's bias is honest and
visible, and "I disagree with the recommendation" becomes a
deliberate one-click override rather than a re-read of every option.

If you genuinely don't have a recommendation, you don't have a
question yet. Either decide outright (no question at all) or read
more state before this is decision-ready.

### 3. Descriptions name the trade-off, not just the choice.

Bad: "**Postgres** — a relational database."
Good: "**Postgres (managed)** — real-time writes, multi-user
concurrent. Cost: an external service the loop needs credentials
for; not hermetic."

Every option is a *trade* — picking it accepts a cost and forgoes an
alternative. Spell out the cost in 1-2 sentences. The user shouldn't
have to re-derive what they're giving up.

### 4. Lead with prose, ask with the question.

Before the question block, write 2-4 sentences of context naming the
2-3 most important trade-offs across the whole option space. Then
ask. The question itself stays terse ("Which auth model at v1?");
the prose above carries the "why this matters now, what you're
committing to" weight. Context inside every option bloats the
ballot; no context makes the user read every option twice.

### 5. Every question states its defer path.

The user must be able to answer "not now" without derailing the
loop — and must know exactly what that costs. Each question's option
set (or its prose lead) names what happens if they defer or don't
decide: which default the agent proceeds with, whether the item
resurfaces (e.g. as `[needs-user-call]` drained by `/oversight`
standing question 0), and whether the default is reversible.
"Defer — I proceed with X; resurfaces next oversight" is a complete
option. A question with no safe defer path is a blocking demand, not
a question — flag it as such explicitly (rare; usually means
something irreversible is on the table).

### 6. Answers are policy — file them, never re-ask.

An answer the user gives is a decision made; asking it again in a
later session is the fastest way to erode trust in the whole
pattern. The asker writes the answer somewhere durable in the same
turn: `/oversight` logs Q→A pairs in its commit body and applies
them as plan edits; a recurring policy goes to `plan/bearings.md`
§ "Decisions standing for the autonomous loop"; a design ruling goes
to the relevant spec or VISION.md. (This is standing rule 7 — file
the residue — applied to answers.) Before asking anything, check
those places: if the answer is already on file, decide from it and
cite it instead of asking.

---

## Mechanics of `AskUserQuestion` worth using

- **"Other" is automatic** — every question gets a free-text escape
  hatch; don't add your own "something else" option.
- **`multiSelect: true`** when options aren't mutually exclusive
  ("which of these five findings should I fix?") — one question
  instead of five yes/nos.
- **Option previews** — when choices are visual or concrete
  (a card face layout, a copy rewrite, a config diff), attach the
  actual artifact as the option's preview instead of describing it.
  Comparing two previews beats imagining two descriptions.
- **Headers** are 12-char chips ("Auth", "Scope") — name the
  decision, not the answer.
- **User notes** — answers can carry free-text annotations; when an
  override arrives with a note, treat the note as the *why* and file
  it with the decision (rule 6). The why is what lets future
  sessions generalize instead of re-asking adjacent questions.

---

## When the pattern doesn't fit

- **Free-form answers** (a name, a voice description): no
  recommended option exists, but rules 1, 4, 5 still hold. List 2-4
  likely values as options and let "Other" carry the real answer.
- **Yes/no** is a weak shape. Reword to "do X (Recommended) / do Y"
  — named branches carry more signal. The rare genuine yes/no is an
  irreversibility confirmation, and must say so in the question.
- **Confirmations** of an action already described in prose: don't
  spend a question — the user can accept or interrupt. Save the
  question budget for decisions that change behavior.

---

## Anti-patterns

- **Pre-canned question sets.** Compute the batch from current
  observed state; templates age into noise (`/oversight`'s
  questionnaire is computed from flags for exactly this reason).
- **Asking what you can decide.** If the answer is sitting in a
  state file, decide and document the call in the commit body.
- **Asking what's already answered.** Rule 6's converse — check
  bearings' standing decisions, prior oversight commit bodies, and
  the specs before asking.
- **Asking to confirm an undescribed action.** Describe first
  (prose), then ask.
- **More than 4 questions.** That's two batches. Split.
- **Recommended option anywhere but first.** The scan path lands on
  the first option; respect it.
- **A defer option with hidden cost.** If deferring silently loses
  the item, that's not defer — say where it resurfaces or don't
  offer it.

---

## Where this is used today

- [`skills/oversight.md`](../skills/oversight.md) §5 — the canonical
  questionnaire: computed from observed flags, standing question 0
  drains `[needs-user-call]`, answers applied as plan edits and
  logged in the commit body.
- Root [`AGENTS.md`](../AGENTS.md) § Hard rules — binds every
  attended-session question to this doc's pattern.
- The design skills (`.claude/skills/`) — Socratic interviews that
  batch their probing per rules 1 and 4.

New skills that need an `AskUserQuestion` exception should reference
this doc rather than re-deriving the pattern.
