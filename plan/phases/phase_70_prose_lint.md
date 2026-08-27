# Phase 70 — Prose lint for shipped `.ts` content + naming law in CI

> Queued 2026-08-22 per THE PIPELINE LIBERATION. Brief generated
> 2026-08-27 by `/ship-a-phase` §9.

## Outcome

Two guardrails the narrative pipeline was authorized without:

1. `scripts/check-prose.mjs` lints the **string literals** of the
   authored `.ts` content surfaces against the retired-term registry
   and the house voice rules.
2. `scripts/check-naming-law.mjs` gains a `--sweep` mode over the
   shipped card/enemy names, wired to an npm script and a CI leg.

## Why

THE PIPELINE LIBERATION authorized autonomous narrative shipping. The
guardrail did not follow: `check-lexicon.mjs` scans `.md` only, so
every player-facing string ships un-linted, and `check-naming-law.mjs`
has a unit test but has never been run against a shipped name.
`content-curator.md` says so in its own text — "It does NOT yet scan
`.ts` prose — self-check your `.ts` strings against the registry by
hand." A hand-check is not a gate.

## Surface

| File | Change |
|---|---|
| `scripts/check-prose.mjs` | new — string-literal extraction + retired-term + voice rules over an explicit content-surface list |
| `scripts/check-prose.test.mjs` | new — rule cases, pragma, self-check |
| `scripts/check-naming-law.mjs` | `--sweep` mode over shipped names |
| `package.json` | `lint:prose`, `lint:names`, both into `test` |
| `.github/workflows/verify-prose.yml` | new lane on the content paths |
| `.claude/agents/content-curator.md` | the "not yet scanned, self-check by hand" note is now false |
| content fixes | what the new rules flag |

## The rules

**Retired terms** — the `identifier` rows of `lexicon.json`, applied to
string literals only. Scanning raw `.ts` would fire on code.

**Voice** (sourced from `docs/narrative/LEXICON.md` "Ban from house
narration" and `content-curator.md`):

| id | catches |
|---|---|
| `faux-archaic` | `thee`, `thou`, `thy`, `thine`, `hath`, `doth`, `ye` |
| `exclamation` | `!` in player-facing prose |
| `scriptural-weather` | "wrathful heavens", "blood-red sky", judgmental thunder |
| `prestige-dark` | "ineffable evil", "nameless dread" |

## Decisions made upfront — DO NOT ASK

- **String literals only, from an explicit file list.** Linting raw
  `.ts` would flag `!==` as an exclamation and every code identifier as
  prose. The file list is explicit rather than a glob so adding a
  content surface is a deliberate act — and the lint fails if a listed
  file yields no strings, so a moved file cannot silently stop being
  checked.
- **Short strings are skipped** (< 12 chars). They are ids, keys, and
  enum values, not prose.
- **`.ts` pragmas are `// lexicon-ok:` / `// prose-ok:` line comments**,
  file-level, mirroring the `.md` HTML-comment form. The `.md` form
  cannot appear in TypeScript.
- **The one retired-term hit is exempted, not rewritten.**
  `act3.content.ts`'s gate riddle asks "WHAT ARGUMENT HAS NO FIRST
  PREMISE?" — ordinary philosophical English in a riddle about
  arguments, not the retired card keyword (now CHARGE). It is shouted
  in caps because that is the house's gate-riddle style, which is what
  collides with the uppercase-scoped registry row.
- **The 12 exclamation-mark hits ARE rewritten.** All sit in one
  legacy file (`Northern-Forest/npcs.ts`) and read visibly off-voice
  ("Excellent!", "A noble quest!", "Beautifully spoken!") — they
  predate the style constitution. Rewriting them is the cleanup the
  rule exists to force; exempting them would ship the rule inert on
  the only content that violates it.
- **The one naming-law violation is grandfathered, not renamed.**
  "Blank Indenture" begins with the locked die-face word BLANK. NL-8 is
  a ratified rule introduced after the card shipped; renaming authored,
  player-visible content to satisfy a later rule is an authorial call,
  not a tooling one. It goes on a dated one-entry grandfather list with
  its reason and an AUDIT row, so the gate protects every NEW name
  while the rename stays a decision someone makes on purpose.
- **The naming sweep parses the library sources at the root** rather
  than importing them. Root scripts stay zero-dependency and
  TypeScript-free; the generated catalog JSON is gitignored, so CI
  would have to run `catalog:export` first to use it.

## Tests

| Case | Assert |
|---|---|
| each voice rule | a violating string is flagged with its line |
| retired term in a string | flagged; the same word in code is not |
| `// prose-ok:` pragma | exempts that rule for the file |
| short strings | ids and keys are not linted |
| self-check | a listed file yielding no strings fails |
| the live tree | `check-prose` and `--sweep` both exit 0 |

## Verify gate

`npm run verify`, plus `node scripts/check-prose.mjs`,
`node scripts/check-naming-law.mjs --sweep`, and the root `npm test`.

## DoD

- [ ] Prose lint covers every authored `.ts` content surface.
- [ ] Voice rules land with the content they flag fixed or exempted.
- [ ] `--sweep` runs over shipped names in an npm script + CI leg.
- [ ] `content-curator.md`'s stale "self-check by hand" note corrected.
- [ ] `npm run verify` green; build-plan row ticked.

## Follow-ups (out of scope)

- Rewriting the rest of `Northern-Forest/npcs.ts` — this phase fixes
  what the rules flag, not every off-voice line in a legacy file.
- Ruling on the "Blank Indenture" rename.
- Extending the sweep to place/NPC names, which live in map and NPC
  structures with no single `name:` convention yet.
