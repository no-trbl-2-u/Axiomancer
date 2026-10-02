# Phase R10 — Theme colours

## Sources

- Part plan: [`plan/revamp/mobile.md`](../revamp/mobile.md) § R10.
- Reset rules: [`plan/revamp/README.md`](../revamp/README.md) §5.
- Decisions: **D62** (the mobile reset scope; R10 is the theme-colour row),
  **D58** (nothing is authored).
- Canonical sibling: Phase 104's `STANCE_COLORS.any`, which reads the theme
  token `AXM.bone` instead of a literal (`state/presenters/combat-encounter.engine.ts`).

## Reality check (2026-10-02, `main` at `a2ae951c`)

- After R8, **159 hex literals** remain in non-test code across 28 files under
  `app/`, `components/` and `state/presenters/` (the part plan's "224" was
  counted before R8). Seven more are comment text (issue numbers such as
  `#294`, a hex quoted in prose). They are not colours and stay.
- The four colours the part plan names are still not in the theme:
  `#a86bdc` (11 uses), `#e2543b` (10), `#5bbf6a` (8), `#d9b44a` (7).
- `components/hazard/palette.ts` already names its colours (`HZ`, `DIE`,
  `TYPE_ACCENT`, …), but it names them in `components/` with literal values.
- Tests pin some of these exact strings (`card-rarity.engine.test.ts`,
  `IntentIcon.test.tsx`, `CombatDie.*` and others). `CombatDie`'s `mixHex`
  parses only 6-digit `#rrggbb`.

## Outcome

`app/`, `components/` and `state/presenters/` contain no quoted hex colour
literal. Every colour they used is a named token exported from
`theme/axm.ts`, with its value unchanged, and a test keeps it that way.

## Scope

1. `theme/axm.ts` gains `HUE`, one frozen record of the fixed (not
   theme-driven) colours, grouped by surface: neutrals, combat feedback,
   card and verb classes, dice, hazard minigame, and art. Each token keeps
   the exact string it replaces (`#000` and `#000000` stay two spellings
   only where a test or `mixHex` needs the 6-digit form).
2. Every literal in the 28 files is replaced with its `HUE.*` token.
   `components/hazard/palette.ts` keeps its exports and shapes; only its
   values point at `HUE`.
3. A guard test, `theme/__tests__/no-hex-literals.test.ts`, walks `app/`,
   `components/` and `state/presenters/` (non-test `.ts`/`.tsx`) and fails
   on any quoted `#rgb`, `#rrggbb` or `#rrggbbaa` literal, naming the file
   and line.

## Consumers to update

Only the 28 files. No engine change, no export from `@mechanics`.

## Save / schema contracts

None.

## Carrier sweep (D45)

None. Nothing is removed.

## Decisions made upfront — DO NOT ASK

- **Fixed tokens, not theme hues.** The tokens go in a static `HUE` record,
  not into `ThemeSpec`. Promoting them into the five themes would change
  colours on four of them, and R10 is "no visual change". `card-rarity.engine.ts`
  already explains why rarity hues must not vary by theme.
- **Values are byte-identical.** A token holds the exact string it replaced,
  so pinned tests and `verify:visual` see nothing. Two near-twins
  (`#e08a3b` / `#e08a3c`) stay two tokens; merging them is a visual change,
  however small, and belongs to a later pass.
- **Names say what the colour is for.** A colour shared by several roles
  gets one name for its main role (for example `#a86bdc` is `tickPurple`,
  the part plan's poison-tick purple). Local aliases such as `GUARD_COLOR`
  stay where they help the reader and point at the token.
- **The guard matches quoted literals only.** Comment text (`issue #294`)
  and template suffixes (`${accent}aa`) are not colour literals. `theme/`
  itself is outside the scan.

## Verify

`npm run verify --workspace axiomancer-mobile`, root `npm test`,
`npm run lint:content`, `node scripts/check-lexicon.mjs`. Run
`npm run verify:visual` too if a browser is available; it should show no
diff.

## Follow-ups

- Folding near-twin colours together, and deciding which fixed hues should
  become theme hues, is a design pass for B7/B8 or a later candidate.
