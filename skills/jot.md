# Skill: jot

> **REVAMP MODE (D58, since 2026-09-28; ends when Phase R11 ships).** The
> loop's phase work is only the ratified revamp build plan
> (`plan/steps/01_build_plan.md`; part plans in `plan/revamp/`). It creates
> no content of any kind: cards, keywords, enemies, relics, maps, NPCs, events
> or art. `/iterate` and `/expand` still run when no phase is ready, under the
> same no-content rule. THE CARD HOLD (D37) stands: no card or keyword is made
> outside a guided session with T. The content stewards, `/forge` and the
> `card-expert`, `content-curator`, `mechanics-expert` and `reader` agents
> were archived in R0; never route work to them. R11 revisits the loop to
> bring content phases back.

> **The user's quickfire.** You spotted something. You drop a
> note. The skill appends one row to `plan/CRITIQUE.md`,
> commits, pushes, and exits in seconds. The next `/iterate`
> scores it with every other finding (user-source findings carry
> a `+0.5` score bump — see `skills/iterate.md` §4 "User-source
> bump").
>
> **Decide-and-ship.** No questions back. No `AskUserQuestion`.
> Hard rule #6 (only `/oversight` asks the user anything)
> stands intact — `/jot` consumes user input via the
> slash-command argument alone.

## 1. Invocation

```
/jot <free-text observation>
/jot --url <path> <text>              # attach the route you were on
/jot --severity high <text>           # high (jumps the iterate queue)
/jot --severity low <text>            # low (drains when nothing else is pending)
/jot --category <category> <text>     # explicit category override
```

Examples:

```
/jot combat log padding too tight on small screens
/jot --url /village the empty shop state looks broken
/jot --severity high end-turn button disappears at 375px
/jot --category navigation the map legend hides behind the tab bar
/jot --url /settings the save button has no loading state
```

## 2. The procedure

Never ask questions, never run the verify or deploy gate (no
code change). Target end-to-end under 10 seconds.

### Step 0 — Re-sync

```bash
git pull --ff-only
```

The cloud loop may have written to `plan/CRITIQUE.md`. Always
pull before append.

### Step 1 — Parse the argument

Strip the `--flag value` pairs from the front of `$ARGUMENTS`;
the rest is the **observation text**.

| Flag | Purpose | Default if absent |
|---|---|---|
| `--url <path>` | route the user was on | `unspecified` |
| `--severity <high\|med\|low>` | severity of the issue | `med` |
| `--category <cat>` | explicit category override | infer from text (heuristic below); fallback `observation` |

**Category inference heuristics** (loose; just pick something
reasonable):

- Contains "padding", "spacing", "alignment", "color", "font",
  "size", "layout" → `visual`
- Contains "link", "click", "go to", "back", "menu", "nav" →
  `navigation`
- Contains "mobile", "375", "phone" → `mobile`
- Contains "load", "slow", "spin", "freeze" → `performance`
- Contains "alt", "focus", "keyboard", "screen reader" → `a11y`
- Contains "copy", "voice", "tone", "wording" → `voice`
- Contains "dialogue", "encounter", "missing", "stub" → `content`
- Otherwise → `observation`

### Step 2 — Append the row

Same shape as a `/critique` finding, so `/iterate` drains it
with no new code. Append to the **Pending** block of
`plan/CRITIQUE.md` (create the file with the standard header and
a Pending block if it does not exist):

```markdown
### [<SEVERITY-UPPER>] <url-or-"general"> — <one-line summary derived from observation, ≤ 60 chars>
- pass: user-jot (commit <git rev-parse HEAD>)
- viewport: unspecified
- category: <inferred-or-overridden>
- observation: <the user's text, verbatim, single line>
- evidence: user-spotted at <ISO timestamp>
- suggested fix: [user has not specified — iterate to determine]
- source: user
```

### Step 3 — Commit + push

```bash
git add plan/CRITIQUE.md
git commit -m "jot: <one-line observation summary, ≤ 70 chars>"
git push origin main
```

Commit body: leave empty. The row carries the detail.

### Step 4 — Done

Print one short confirmation line:

```
jot: filed [MED] /village — empty shop state looks broken (commit a3f1e2c).
```

`/march` ships pending phases before `/iterate` runs. To have
the jot acted on now, follow it with `/iterate` directly.

## 3. Hard rules

1. **Never ask questions.** Decide-and-ship.
2. **Never modify anything but `plan/CRITIQUE.md`.**
3. **Atomic commit, immediate push.**
4. **No verify gate, no deploy gate.**
5. **No emojis. No `Co-Authored-By:`.**
6. **Lowercase commit subject prefix `jot:`.**
7. **Source field is always `user`.** Never spoof it for
   automated entries.

## 4. Failure modes

- **`plan/CRITIQUE.md` write fails.** Print error, exit 1. The
  user re-jots.
- **`git push` rejected** (divergent remote). Pull again,
  re-append, push. Up to 3 retries.
- **Empty argument, or flags only** (`/jot`, `/jot --url /foo`).
  Print a one-line usage hint, exit 0. Do not commit.
