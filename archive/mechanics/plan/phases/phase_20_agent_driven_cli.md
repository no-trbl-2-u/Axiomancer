# Phase 20 — Scripted / agent-driven CLI mode

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

`npm run game` accepts three new flags so an external driver (a test
harness, an agent, or a replay tool) can drive the demo loop without a
human at the keyboard:

- `--script <path>` — load a JSON file of pre-recorded answers and feed
  them to subsequent prompts in order.
- `--stdin` — read JSON-per-line from stdin; each line is the next
  answer payload.
- `--json-events` — replace the human-readable event log with one
  `JSON.stringify(event)` line per emitted GameEvent on stdout.

A small `src/CLI/io.ts` module owns the I/O abstraction so the rest of
`game.cli.ts` doesn't sprout if-mode-then conditionals at every prompt.
Hermetic tests cover the script-mode and JSON-event paths without
touching real stdio.

## Source spec

No dedicated `specs/20-*.md` file — feature row in
`plan/steps/01_build_plan.md`:

> Phase 20 — Scripted / agent-driven CLI mode (`--script`, `--json-events`, stdin agent control)

Resolved questions:

1. **Why an I/O abstraction (`src/CLI/io.ts`) instead of branching in
   each tab?**
   Three modes × ~10 prompt sites = 30 conditionals if we inline. The
   abstraction is two small functions (`prompt`, `emit`) plus a mode
   setter — far smaller blast radius.
2. **Script file format?**
   Top-level JSON array of answer objects. Each object matches the
   shape inquirer's `prompt<T>` returns (e.g.
   `{"presetId": "apprentice"}`, `{"tab": "debug"}`,
   `{"slug": "disatree"}`). The driver shifts one entry per
   `prompt` call. Exhaustion throws — fail loudly, no silent fall-through.
3. **`--stdin` line format?**
   One JSON object per line. Same payload shape as `--script`. The
   driver reads a line each time `prompt` fires, blocks on next data.
   EOF before a prompt completes throws.
4. **`--json-events` output shape?**
   One line per event: `JSON.stringify(event)` where `event` is the
   `GameEvent` the emitter received. No prefix, no extra fields. A
   final `{"type":"cli:exit","payload":{"reason":"quit"|"end"}}` line
   flushes when the loop ends — gives consumers a clean EOF marker.
   In `--json-events` mode, `console.log` for human prose is rerouted
   to stderr so stdout stays machine-clean.
5. **Argv parsing — third-party lib or hand-roll?**
   Hand-roll. Three flags, no positional args, no nested commands.
   Drop the commander dep (already gone after Phase 17). Use a tiny
   `parseArgv(process.argv.slice(2))` helper inside `src/CLI/io.ts`.
6. **What about mixed modes?**
   `--script` and `--stdin` are mutually exclusive. If both are passed,
   `--script` wins (file is more deterministic). Document the rule;
   don't error.
7. **What if `--script` runs out of answers mid-loop?**
   Throw. The script is the agent — running out is a programming
   error, not a fall-back-to-TTY case. Same for `--stdin` EOF.
8. **`debugTab` shape with scripted input?**
   The Debug tab prompts for `{ slug }`. A script entry of
   `{"slug": "hush-wraith"}` drives it the same way it drives any
   other prompt — no special-casing.
9. **Tests?**
   `src/CLI/e2e/io.engine.test.ts` covers the I/O abstraction in
   isolation: `parseArgv`, `setIoMode('script', answers)` round-trip,
   `setOutputMode('json')` round-trip. No CLI test — TTY remains
   excluded by convention.
10. **What about the `bootstrapStore`'s console.log header line?**
    Move the `Axiomancer — game loop demo.` banner to stderr in
    `--json-events` mode (handled by the `console.log` → `process.stderr.write`
    redirect inside `src/CLI/io.ts`).

## Implementation units (commit per unit)

### Unit 1 — Add `src/CLI/io.ts` (I/O abstraction + argv parser)

File: `src/CLI/io.ts` (new)

Exports:

```ts
export interface CliFlags {
    scriptPath?: string;
    stdin: boolean;
    jsonEvents: boolean;
}

export function parseArgv(args: string[]): CliFlags;

export type IoMode =
    | { kind: 'tty' }
    | { kind: 'script'; answers: object[] }
    | { kind: 'stdin' };

export type OutputMode = 'human' | 'json';

export function setIoMode(mode: IoMode): void;
export function setOutputMode(mode: OutputMode): void;

export async function prompt<T extends object>(
    questions: Parameters<typeof import('inquirer').default.prompt>[0],
): Promise<T>;

export function emit(event: { type: string; payload?: unknown }): void;
export function log(...args: unknown[]): void;
```

Implementation notes:

- `prompt`:
  - `tty` → defer to `inquirer.prompt(questions)`.
  - `script` → shift the front of `answers`. If empty, throw
    `Error('CLI script exhausted; pass more answers in the --script JSON.')`.
  - `stdin` → read one line off `process.stdin`, `JSON.parse` it. EOF
    throws. Use `readline.createInterface` (Node built-in).
- `emit` always pushes through to whatever `OutputMode` is in force:
  human prints `  [event] ${ev.type}`; json prints
  `JSON.stringify(event)` to stdout.
- `log` is the human-prose channel. `human` → stdout; `json` → stderr
  (so stdout stays machine-clean for JSON consumers).
- `parseArgv` walks the args once. Supports `--script=path` /
  `--script path`, `--stdin`, `--json-events`, in any order. Unknown
  flags → throw with a usage string.

Commit: `feat(cli): add I/O abstraction for scripted + JSON event modes`

### Unit 2 — Wire `game.cli.ts` to use `prompt` / `emit` / `log`

File: `src/CLI/game.cli.ts`

- Import from `'./io'`: `parseArgv`, `prompt`, `emit`, `log`,
  `setIoMode`, `setOutputMode`.
- Replace every `inquirer.prompt(...)` call with `prompt(...)`.
- Replace every prose `console.log(...)` call with `log(...)`.
- Replace the event handler `events.onAny(ev => console.log(...))`
  with `events.onAny(emit)` (the abstraction does the formatting).
- In `main`, before doing anything else: parse argv, install the
  matching `IoMode` and `OutputMode`, then proceed.
- Emit a final `{ type: 'cli:exit', payload: { reason: 'quit' } }`
  event when the main loop returns (Quit tab or thrown).

Commit: `feat(cli): wire game.cli through io.ts (preps script + json modes)`

### Unit 3 — Implement `--json-events`

This is mostly already done by Unit 2 plumbing — Unit 3 is the
verification: a sanity test that the JSON output shape is what
external consumers will see.

File: `src/CLI/e2e/io.engine.test.ts` (new)

Cases:
- `parseArgv` parses each flag in isolation and combined.
- `parseArgv` throws on unknown flags.
- `setOutputMode('json')` + `emit({type, payload})` writes
  `JSON.stringify(event)` to stdout via a captured `process.stdout.write`.
- `setOutputMode('human')` + `emit(event)` writes the
  `  [event] <type>` line.

Use `vi.spyOn(process.stdout, 'write')` to capture; restore in
`afterEach`.

Commit: `test(cli): cover json-events output and argv parsing`

### Unit 4 — Implement `--script <path>`

Mostly already done by Unit 1's `setIoMode({ kind: 'script', ... })`.
Unit 4 covers wiring the flag in `main()`:

```ts
const flags = parseArgv(process.argv.slice(2));
if (flags.jsonEvents) setOutputMode('json');
if (flags.scriptPath) {
    const raw = fs.readFileSync(flags.scriptPath, 'utf-8');
    const answers = JSON.parse(raw) as object[];
    if (!Array.isArray(answers)) throw new Error('--script JSON must be a top-level array.');
    setIoMode({ kind: 'script', answers });
} else if (flags.stdin) {
    setIoMode({ kind: 'stdin' });
}
```

Add a test case to `io.engine.test.ts`:
- `setIoMode({ kind: 'script', answers: [{a:1},{a:2}] })` → two
  `prompt(...)` calls return `{a:1}` then `{a:2}`; third call throws.

Commit: `feat(cli): implement --script flag (JSON answer array)`

### Unit 5 — Implement `--stdin`

Implementation is the `stdin` branch of `setIoMode` from Unit 1.
Unit 5 adds the integration: `main()` calls `setIoMode({ kind: 'stdin' })`
when `flags.stdin` is true (covered by the Unit 4 code).

Tests are harder for stdin (real `process.stdin` is global). Skip a
direct test; the script-mode tests cover the prompt contract; the
stdin variant is read-one-line-vs-shift-from-array. Document this in
the file comment.

Commit: `feat(cli): implement --stdin flag (one JSON object per line)`

### Unit 6 — Docs + DoD

- Append a short "Agent-driven CLI" section to `README.md` (right
  after the `npm run game` row) with usage examples.
- Flip Phase 20 in `plan/steps/01_build_plan.md` to `[x]` with hash.

Commit: `plan: phase 20 shipped — scripted / agent-driven CLI mode`

## Decisions made upfront — DO NOT ASK

- Three flags only: `--script`, `--stdin`, `--json-events`.
- Hand-roll argv parsing (no commander).
- I/O abstraction in `src/CLI/io.ts`; everything else stays put.
- Script-mode exhaustion throws; no TTY fall-back.
- `--script` wins over `--stdin` if both passed.
- `--json-events` reroutes prose `log` calls to stderr.
- No interactive integration test — TTY excluded by project convention.

## Verify gate

```bash
npm run type-check
npm test
npm run verify
npm run deploy:check
```

## Definition of Done

- [ ] `src/CLI/io.ts` exists with `parseArgv`, `prompt`, `emit`, `log`,
      `setIoMode`, `setOutputMode`
- [ ] `src/CLI/game.cli.ts` uses the abstraction for every prompt and
      every human-prose log
- [ ] `--script <path>` loads a JSON answer array and feeds prompts
- [ ] `--stdin` reads one JSON object per line as the next answer
- [ ] `--json-events` emits one `JSON.stringify(event)` line per
      GameEvent and reroutes prose to stderr
- [ ] `src/CLI/e2e/io.engine.test.ts` covers argv parsing, script-mode
      answers, json-vs-human emit
- [ ] `npm run verify` exits 0
- [ ] `npm run deploy:check` exits 0
- [ ] Phase 20 row in `plan/steps/01_build_plan.md` is `[x]` with hash

## Follow-ups (out of scope)

- Bidirectional protocol (driver writes scripted answers, reads JSON
  events on the same stream) — current shape splits stdin (answers) and
  stdout (events). Track as a Z-LOW candidate if a use case appears.
- An LLM-driven loop example in `docs/` — out of scope.
