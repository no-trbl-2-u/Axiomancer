# AXM Log — the structured logging contract

One logging system spans the monorepo so agents (and the owner) can see
how the game functions and where things go wrong. The logger lives in
the engine (`axiomancer-mechanics/src/Log/`), taps the chokepoints every
game fact already flows through, and exposes three consumption surfaces:
a JSONL file from the CLIs, a `globalThis.__AXM_LOG__` bridge in the app
(all builds, production APKs included — owner-ratified 2026-07-20), and
a crash tail that survives restarts.

Design laws (mirrors `io.ts` / `telemetry.mjs` conventions):

- **Never throws, never blocks play.** Every logger method and every
  sink call is guarded. A logging bug costs log lines, never a turn.
- **Default OFF, one-boolean-read hot path.** `isLoggingEnabled()` is a
  raw module boolean; sims and vitest leave it off so the playtest
  matrix pays a single branch per `withLog` batch. Mobile enables it at
  boot; CLIs enable it only when `--log-level`/`--log-file` are passed.
- **Bounded and honest.** Fixed-capacity ring buffer (1000 in the app);
  rotation is counted in `stats().dropped`, never silently.
- **Zero dependencies.**

## The envelope

```jsonc
{
  "seq": 41,            // monotonic, never resets (survives clear())
  "t": 1784500000000,   // Date.now() ms
  "level": "info",      // trace | debug | info | warn | error
  "domain": "combat",   // see the domain table
  "kind": "dot-tick",   // event kind within the domain
  "msg": "optional human one-liner",
  "data": { }           // optional sanitized payload
}
```

| Domain | What flows through it | Emitted from |
|---|---|---|
| `combat` | every `CombatEvent` (~80 kinds: `card-played`, `dot-tick`, `damage-dealt`, ...) at **debug**; `encounter-mounted`/`encounter-exited` markers at info | the engine's `withLog` chokepoint (`combat.engine.ts`); `CombatEncounterPanel` |
| `game` | sanitized `TypedGameEvent`s (`combat:started`, `world:moved`, ...) at info; `action:<TYPE>` dispatch traces at debug | `createGameStore` (`Game/store.ts`) |
| `rng` | `seed-set` / `rng-state-restored` / `rng-replaced` — **the replay keys** | `Utils/rng.ts`, `Game/store.ts` |
| `cli` | the CLI's stdout envelope stream mirrored at debug | `CLI/io.ts` `emit()` |
| `action` | mobile action dispatches: `{ durationMs }` at debug, failures at error (then rethrown) | `wrapActionsWithLogging` (`state/logging.ts`) |
| `nav` | `route-changed { pathname }` at info | `<NavLogger />` |
| `persistence` | `preload` / `save-written` / `save-failed` / `slot-cleared` / `corrupt-save-cleared` | `asyncStorageAdapter.ts`, `app/_layout.tsx` |
| `error` | `react-boundary` crashes (message + stacks) | `ErrorBoundary.tsx` |
| `world` / `minigame` / `ui` | reserved / sparse today (`ui/app-logging-initialized`); minigame engine taps are a filed follow-up | — |

**Sanitization contract:** `game` entries never carry `GameState` — the
store tap strips `payload.state` and keeps small scalars (action type,
node id, outcome, level). Emitters own sanitization; `data` is stored by
reference, so never log something huge or mutable-in-place.

**Two logs, one stream:** `CombatEncounterState.log` (the engine's
in-state `CombatEvent[]` for UI rendering) is unchanged and is the
SOURCE of the `combat` domain — `withLog` forwards the same events into
the logger. Don't confuse the two: `state.log` is per-encounter state;
AXM Log is the cross-domain session stream.

## Reading it from the app (agents)

The bridge is installed in every build at boot — no dev-tools flag
needed, works in the static `expo export` the Playwright harnesses
serve. It is frozen and read-only:

```js
// mcp__playwright__browser_evaluate / browser_evaluate:
globalThis.__AXM_LOG__.stats()                      // counts by level/domain, dropped
globalThis.__AXM_LOG__.tail(50)                     // last 50 entries
globalThis.__AXM_LOG__.tail(100, { minLevel: 'warn' })
globalThis.__AXM_LOG__.entries({ domains: ['combat'], sinceSeq: 400 }) // incremental poll
globalThis.__AXM_LOG__.prevSession()                // crash tail from the PREVIOUS session
```

Use `sinceSeq` (from the last entry you saw) for incremental polling.
"A number changed and I don't know why" → pull `tail(50)` and read the
`combat`/`game` entries around it; cite `seq` numbers in findings.

- Buffer: capacity 1000, debug+ in dev builds, info+ in production
  (static exports included). To capture the debug combat stream from an
  exported build, inject the inward override BEFORE boot:
  `page.addInitScript(() => { globalThis.__AXM_LOG_LEVEL__ = 'debug' })`.
- Console mirror: dev builds mirror info+ as `[axm] ...` one-liners;
  **errors mirror to `console.error` in every build**, so console
  listeners (`critique-drive.mjs`, playtester Console & Network) always
  catch them.
- Dev viewer: the `/dev` route → DIAGNOSTICS section renders the same
  buffer with level/domain chips and the previous-session toggle.

## Crash tail (APK forensics)

The last ~200 info+ entries are persisted to AsyncStorage under
`@axiomancer/logtail:v1` (separate from the save slot; ~64KB cap;
debounced 3s, fast-flushed 250ms on warn/error, force-flushed by the
ErrorBoundary). After a crash/restart: `__AXM_LOG__.prevSession()`, the
/dev viewer's PREVIOUS SESSION toggle, or the crash screen's RECENT LOG
section (its COPY button includes the tail on web).

## Reading it from the CLIs (agents)

Additive flags on `npm run game` and `npm run combat`:

```bash
# JSONL file, one envelope per line (level defaults to info; add --log-level debug
# for the full combat event stream). stdout stays machine-clean for --json-events.
npm run combat -- --auto --policy status --seed 7 --json-events --log-file scratch/axm.jsonl --log-level debug

# No file: entries pretty-print to STDERR (never stdout).
npm run game -- --route node-a,node-b --log-level info
```

No log flags → the logger stays disabled (sim sweeps and vitest run at
full speed). The older `--state-log` JSONL (`{tick, action, before,
after}` snapshots) is unchanged and complementary.

## Replay recipe

Every seeding writes an `rng` entry (`seed-set { seed, numericSeed }`).
To reproduce a logged session deterministically: take the last
`seed-set` before the window of interest, re-run the same driver with
that seed (`--seed`/`--combat-seed`, or `__AXM_MINIGAME_SEEDS__` on
web), and diff the `combat` streams.

## Programmatic surface (engine)

```ts
import { getLogger, configureLogging, isLoggingEnabled, createAxmLogger } from 'axiomancer-mechanics';

configureLogging({ enabled: true, level: 'debug', capacity: 2000 });
getLogger().info('ui', 'my-kind', { small: 'payload' });
const unsubscribe = getLogger().addSink(entry => { /* forward somewhere */ });
```

New engine code should log through the existing chokepoints (resolver
events reach `withLog`/the emitter already); reach for `getLogger()`
directly only for warn/error paths or genuinely new surfaces, always
behind `if (isLoggingEnabled())` on hot paths. Tests that enable logging
must call `resetLoggingForTests()` (`__resetAppLoggingForTests()` too in
mobile) in `afterEach`.
