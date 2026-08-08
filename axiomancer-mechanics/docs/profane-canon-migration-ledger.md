# Profane Canon — test-migration ledger (UNFINISHED WORK)

**Status 2026-08-08:** the rework landed but its test-fixture migration is
incomplete — **24 mechanics test files (133 tests)** and **18 mobile suites
(88 tests)** still carry pre-rework fixtures. All three packages typecheck
clean. This file is the handoff: the old→new fixture map, the new engine
hooks, the carrier-less-verb policy, and the balance-suspension policy needed
to finish the job. Delete it once the suites are green.

Package: axiomancer-mechanics. Runner: **vitest** (`npx vitest run <file>` from the package dir).

Remaining mechanics files: bridge-rewards · card-effectiveness · cards-sandbox
· phase99-unlocked-access · roles-themes · sequencing-grammar · thoughtforms
(Cards/e2e); control-surfaces · coveted-die · defense-guard ·
grace-card-wording · hazard-pattern-combat.balance · legibility-sweep ·
paid-summary-honesty · phase-33b-enemy-archetypes · phase-d9-stance-check-variety
· playtest-dice-mode · reap-max-hp-erosion · status-depth.balance ·
status-depth-combat · themed-decks · threat-branches · turnabout-ledger ·
win-path-scaling (Combat/e2e).

## What happened
The card library was replaced wholesale (the Profane Canon rework, 2026-08-08):
- `src/Cards/cards.library.ts` — 57 new cards, 7 themes: rot, debt, grave,
  vigil, trial, choir, curse (enemy-injected junk). Old 86-card library + its
  10 themes are GONE (retired to git history, no rescues).
- `src/Combat/combat.starter-deck-presets.ts` — THREE campaign presets now:
  threadbare (18) / pilgrim (30) / apostate (45), snapshots of one evolving
  deck (PRESET_LINEAGE + PILGRIM_REMOVED/ADDED + APOSTATE_REMOVED/ADDED).
  Old ten theme presets GONE. PRESET_COLOR_BORROWS gone → PRESET_LINEAGE.
- Enemies now fight as DECKS of enemy cards: `src/Combat/combat.enemy-cards.ts`
  (104-card library) + `src/Combat/combat.enemy-decks.ts` (56 decks) compile
  into the same `AUTHORED_THREAT_SEQUENCES` export shape (same enemy ids).
- New mechanics: `immolate`, `purge_self` (CardSpecialMechanic), `requiem`
  (SynergyStatePredicate — discard ≥ n), enemy `curseCardId` threat effect
  (shuffles a curse card into the player's combat deck), DOOM =
  `debuff_creeping_doom` promoted to card vocabulary.
- STARTING_CARD_IDS = ['spoiled-poultice', 'chilblain-watch'].
- Reward pool excludes theme 'curse'.

## YOUR JOB
Fix ONLY the test files assigned to you so they pass, preserving what each
test PROVES. Read the failing test, read the relevant new source, update
fixtures/expectations. Verify by running vitest on your files. NEVER edit
non-test source files (src outside e2e/__tests__) — if a failure looks like a
REAL engine or card-data bug, leave that test failing and report it clearly.

## Fixture id map (old → new, by mechanical role)
slippery-slope → spoiled-poultice (weak poison starter, tier 1, rank 1)
  (need a TIER-2 poison common? use unction-of-boils)
brace-for-impact → chilblain-watch (guard starter; also threadbare-cope)
festering-argument → the-long-lent (PROLONG / extend_dots)
red-herring / zenos-half-step → scolds-bridle (STAGGER + BACKFIRE)
soft-word → thin-hymn (SWAY); the-olive-branch → alms-of-breath
heart-of-the-matter → the-offertory-plate (sway engine) / miserere (finisher)
exordium / videtur-quod → petty-indictment or reading-of-the-charges (PREMISE)
quod-erat-demonstrandum / the-closing-word → the-black-cap (peroration, at 6, concedeAt 8; rider ruptureMarks 2 + draw 1)
resonance-detonation → communion-of-the-worm (RUPTURE ALL + SIPHON 50%)
the-reaping → miserere (REAP ALL 3/soul + siphon + fate line)
the-gleaners-due / winnowing / delphic-ambiguity → last-rites-sung-early (consume_affliction, souls 2)
brief-candle → passing-bell (soul_gain 1 + DOOM)
refrain → dirge-for-the-disinterred (ECHO + DOOM + requiem synergy)
circular-reasoning → shallow-grave (reprise 1 + foretell 2 + tickOne)
ouroboros → open-every-grave (replay_last ×2 + reprise 1)
pact-of-akrasia → promissory-cut (recoil 3 + draw 2; FREE recoil 1 + draw 1)
sweet-poison / against-my-judgment → the-vig (recoil 2 + DOOM 2 + MARK)
self-flagellant → distraint (immolate + fallen line)
the-open-vein (sandbox) → blank-indenture (recoil_x min 3, poisonPerX 0.5 — now a LIBRARY card)
nettle-cloak / pebble-in-the-boot → hoarfrost-teeth (THORNS) or chilblain-watch
tu-quoque / measured-answer / the-anvil-speaks → the-reprisal-bell (riposte 4 parry 2 + guard 8)
the-adamant-wall → nothing-crossed-the-ice (barrier 6 + foretell 2)
crumbling-resolve → caltrops-under-the-snow (disenchant: enemy hits seed BLEED 2 on itself)
hedgehogs-dilemma → every-stone-an-oath (enchant: bloodless round → +3 barrier)
venom-and-vein → the-untended-garden (enchant: end-round FESTER 1)
suppurating-curse → the-congregation-below (disenchant: end-round 1 dmg per 3 discards)
glimpse / signs-and-portents → shallow-grave (FORETELL) or first-spadeful
grandmothers-psalter = heirloom draw2+cleanse1 (rank 5 spell)
Preset ids: erosion/penitent/tithe/etc → 'threadbare' (early) / 'pilgrim' (mid) / 'apostate' (late). buildPresetDeck sizes: 18/30/45 (flag-on same sizes).
Curses (theme 'curse', purge_self, unpriced): mouthful-of-brine, gnaw-marks, arrears, overheard-name.

## Enchant/disenchant engine hooks (new carriers)
the-untended-garden: end-of-round +1 intensity to enemy DoTs.
edict-of-the-open-wound: enemy DoT calendars frozen + enemy heals fail.
the-red-ledger: recoil paid → BLEED 1 (2 turns) on enemy (per play / per FREE recoil).
joint-and-several: recoil paid → enemy loses same HP.
the-sextons-count: RECALL/REPLAY resolve → DOOM 1 on enemy.
the-congregation-below: end-of-round floor(discard/3) damage.
every-stone-an-oath: bloodless round end → barrier +3.
caltrops-under-the-snow: enemy landing damage → BLEED 2 on itself.
the-assize-bell: rungs denied at threat resolution → +1 premise per rung.
choirbone-reliquary: affliction expiry/consumption → +1 extra soul + sway 1 (inside gainSouls / gainSoulsLocal, reason !== 'granted').
the-long-amen: end-of-round enemy gains SWAY = souls held.

## Mechanics with NO library carrier any more (engine stays, verbs live for future cards)
omen, forge_floating_die, float_x_die (TRANSMUTE), overheat, spend_all_pips,
spend_premises, turnabout, echo_next_spell, conjure_card (thoughtforms still
exist), lock_stance, strip_random_buff, convert_dots (REARGUE), boost_all_dots
lives only on gangrene-gospel, glyphs (sandbox-only as before).
For ENGINE tests of these verbs: register a SYNTHETIC fixture card via
`registerSandboxCards` (src/Cards/cards.sandbox.ts) instead of a library id —
the engine behavior is still under test; only the carrier moved out of the
library. Old id-keyed zone hooks that lost their card (resonant-chamber,
irresistible-grace, bone-orchard, the-tithe, mirror-of-guilt, anvil-of-form,
entropy-tax, forge-masters-stamp, practiced-cadence, quagmire-of-doubt,
crown-of-thorns, mirror-of-longing, captive-audience, fated-course,
the-oracles-eye, achilles-and-the-tortoise, stuck-in-their-head): tests
pinning THOSE hooks should be DELETED (note it in your report) — the hooks are
scheduled for a cleanup sweep.

## Balance-suspension policy (owner directive: balance is explicitly NOT a goal yet)
Sim tests asserting win-rate BANDS / engagement bands / curve shapes
(hazard-pattern-combat.balance.sim, status-depth.balance.sim,
combat-playtest.matrix band asserts, win-rate-curve-shape, balance-bands):
keep the sim RUNNING (it must not crash) but convert band ASSERTIONS to
`describe.skip`/`it.skip` with this comment:
  // PROFANE-CANON SUSPENSION (2026-08-08): balance bands deliberately
  // suspended for the rework — "no need to worry about balance yet" (owner).
  // /deck-tuning re-baselines and re-arms these against the new canon.
Structure/coverage assertions (deck sizes, card coverage universes, sim
completing without error) stay ARMED — update universes to the new 57-card /
3-preset shape.

## Deck laws to pin where relevant
Presets: sizes 18/30/45 (cap 50), aspect thirds, ≤4 copies, lineage law
(see deck-presets.engine.test.ts — already rewritten, don't touch it).
Enemy decks: 56 ids (AUTHORED_THREAT_ENEMY_IDS.length === 56 still true),
boss/unique stake on exactly the 2nd card, final card is the spike.
Curse cards never in presets or reward pool.

## DOOM print convention
"DOOM N (grows +1 each time the foe acts)" — no duration parenthetical
(debuff_creeping_doom has no calendar).

## MOBILE ADDENDUM (axiomancer-mobile; runner: **jest** — `npx jest <path>` from the package dir)
- Registry count: keywords.ts gained Fester, Replay, Requiem, Immolate, Purge
  (Doom was already glossed) → allRegistryKeywords() length pin becomes 42.
- MECHANIC_KEYWORD gained: immolate→Immolate, purge_self→Purge,
  replay_last→Replay; boost_all_dots now → Fester (was Prolong).
- THEME_KEYWORDS parity (KW-6 test): mechanics' THEME_KEYWORDS is now the
  7-family profane-canon map (rot/debt/grave/vigil/trial/choir/curse) — see
  axiomancer-mechanics/src/Cards/card-themes.ts; update the parity fixture.
- store-actions: ThemedDeckId = 'threadbare'|'pilgrim'|'apostate';
  COMBAT_DECK_PRESETS = starter-baseline + those three (sizes 18/30/45);
  BUNDLE_CHROME/STARTER_BUNDLES now three bundles (threadbare archetype null,
  pilgrim 'bleeder', apostate 'guardian').
- state/combat/__tests__/deck-presets.test.ts was ALREADY REWRITTEN by the
  orchestrator — if it fails, fix forward (do not revert to ten presets).
- starter-baseline deck = ['spoiled-poultice','chilblain-watch'].
- The mobile card-face-honesty guard sweeps the whole new library: persistent
  cards' `persistentEffect` prose must print registry words in CAPS to render
  payload chips — if a canon card's prose lacks a chip, prefer fixing the
  GUARD's alias table (PERSISTENT_TEXT_ALIAS) or report; card text changes in
  mechanics need the orchestrator (report, don't edit mechanics).
  EXCEPTION to the no-source-edits rule: axiomancer-mobile STATE/PRESENTER
  source (keywords.ts alias tables, glyphShapes silhouettes) MAY be edited
  when the guard demands a new keyword row — that IS presentation-layer data.
  New FREE-rider verbs needing silhouettes: none (canon FREE lines reuse
  existing rider fields) — but verify glyphShapeFor covers every canon FREE
  rider; add silhouettes to components/combat/glyphShapes.ts if missing.
- CombatBoard.*.test.tsx fixture themes must be one of the 7 new theme slugs.
- DebugPlaythroughPresets endgame list was updated by the orchestrator to
  canon ids — its test should assert those.
