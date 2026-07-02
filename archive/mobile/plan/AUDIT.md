# Site audit — 2026-06-15

> Bias: gameplay/content (set via oversight 2026-06-11 — supersedes onboarding/docs bias from 2026-06-11)
> /iterate weights gameplay/content findings 1.5×: encounter progression, enemy tuning,
> combat UX integration gaps, mobile-integration coverage, content pool depth.
> **Docs/external-critique down-weight 0.5× (set via oversight 2026-06-13).** The last
> 24h of velocity (36 commits) went almost entirely to README/onboarding/external-critique
> polish while gameplay findings sat open. Until the playtest-driven gameplay push (build
> plan Phase 122) refills the queue, /iterate weights external-critique/docs/onboarding
> findings 0.5× so they no longer outrank player-facing gameplay work.
> Conducted by: /iterate autonomous audit

> **Latest audit update (2026-06-15).** Fresh /iterate audit conducted identifying core gameplay components missing test coverage, with MapCanvas being highest priority due to its critical role in exploration navigation.

> **Audit update (2026-06-16).** Prior top findings all addressed. Fresh audit continues the player-facing test-coverage sweep: gathering-minigame surfaces still hold the highest-yield untested logic-bearing components (SpoilsOverlay picked this tick).

> **Audit update (2026-06-16, second tick).** SpoilsOverlay addressed. Sweep continues into the quest-board minigame (Phase 124): QuestBoardTrack was the largest untested logic-bearing quest surface (pure geometry helpers + conditional ring rendering) — picked this tick.

> **Audit update (2026-06-17).** QuestBoardTrack addressed. Sweep continues through the quest-board minigame: QuestOverlays (387 lines — the intro reveal, open-space card, dusk flash, and outcome ledger) was the largest untested logic-bearing gameplay component remaining — picked this tick.

> **Audit update (2026-06-17, second tick).** QuestOverlays addressed. Quest-board minigame coverage now drained; sweep moves to the gathering minigame's WRATH surface: WrathMeter (130 lines — a pure threshold-coloured `segmentColor` helper plus conditional sickled/mired/watcher/dusk status-tag derivation, fired-notch rendering, grace colouring, and dynamic segment count) was the largest untested logic-bearing gameplay component remaining — picked this tick.

> **Audit update (2026-06-17, third tick).** WrathMeter addressed. Sweep stays in the gathering minigame's satchel surface: SatchelTray (104 lines — the four family stacks with per-stack `progress` clamp, empty/set/at-risk derivation, conditional SET-badge-vs-progress-text rendering, the empty-vs-at-risk header copy, and a composed per-family accessibility label) was the largest logic-bearing untested gameplay component remaining (`glyphs.tsx` / `danger-art.tsx` are pure static SVG art) — picked this tick.

> **Audit update (2026-06-17, fourth tick).** SatchelTray addressed. The gathering minigame's component surfaces are now drained of logic-bearing untested code; the sweep moves to the quest-board minigame's last untested logic-bearing surface — `components/quest/useQuestLanding.ts` (170 lines), a pure presentation hook that replays a resolved bone-die cast as tumble → walk → reveal. It owns deterministic derived view state (tumbling `dieFace` cycled from `rollTick`, the modular-wrap `pathPositions`/`steps` walk computation, the `still → rolling → walking → arrived` stage machine, `targetPos`, `revealed`, `arrivalKey`) driven entirely by flushable `setTimeout`/`setInterval` timers — explicitly built for deterministic test flushing (file header line 16) yet referenced only via its timing constant in `quest.screen.test.tsx`, never unit-tested. Largest untested logic-bearing gameplay component remaining (`glyphs.tsx`/`figures.tsx`/`danger-art.tsx` are pure static SVG art; `DevToolsSections.tsx` is dev-only) — picked this tick.

> **Audit update (2026-06-17, fifth tick).** useQuestLanding addressed. The quest-board and gathering minigame surfaces are now drained of untested logic-bearing code; the sweep moves to the level-up surface — `components/levelup/StanceRow.tsx` (160 lines) is the only component in `components/levelup/` without a colocated test (AscendStrip, DerivedPreviewRibbon, LearnSkillModal, LevelReadyStrip, LevelUpModal all carry one). It owns the `newValue = current + spent` projection, the `showDelta = spent > 0` gate (delta label vs. waiting bar), the `canInc ? onInc : undefined` / `canDec ? onDec : undefined` press gating, the disabled-state `accessibilityState` + ash-colour styling, and per-stance testIDs/labels (`levelup-modal-row/inc/dec-<stance>`) — picked this tick.

> **Audit update (2026-06-17, sixth tick).** StanceRow addressed — `components/levelup/` is now fully test-covered. The sweep moves to the inventory surface's largest logic-bearing untested component: `components/inventory/EquipDeltaPanel.tsx` (227 lines — the freshly-shipped Phase 133 equip-change delta surface). It owns the `delta.isEmpty` whole-panel suppression, the `MODE_EYEBROW` equip/unequip/swap eyebrow map, signed stat-chip labels, the per-side `hasAny` gate, `modifierText` (rolled-value vs. bare id), the `EffectTag` named-tooltip-vs-anonymous branch with on-hit/on-defend prefixing, and `resourceLabel` signed formatting — yet had no colocated test (referenced only indirectly via `ItemCard.test.tsx`). The larger `glyphs.tsx`/`danger-art.tsx` files are pure static SVG art — picked this tick.

> **Audit update (2026-06-17, seventh tick).** EquipDeltaPanel addressed. The sweep returns to the gathering minigame's last untested render-layer surface — `components/gathering/TutorialCoach.tsx` (99 lines), the guided-first-gleaning coach. While the `currentTutorialStep` predicate engine is covered by `state/e2e/gathering.tutorial.engine.test.ts` (which only asserts step *ids* through the store action layer), the coach component's own rendering was untested: the `index < 0` null-return gate when the script completes, the `FIRST GLEANING · n / total` step counter, the current step's title/body/find copy, the `key={step.id}` per-step re-animation, and the SKIP press wiring. It was the only logic-bearing gathering-minigame component without a colocated render test (`GatheringIntroOverlay`/`glyphs` are static presentation/SVG art) — picked this tick.

> **Audit update (2026-06-17, eighth tick).** TutorialCoach (render layer) addressed last tick. The sweep now drops below the coach component into the pure predicate module it derives its step from — `components/gathering/tutorial-steps.ts` (113 lines), the guided-first-gleaning step *engine*. It owns the seven step `done(session, vm)` predicates (each a boundary check: `phase !== 'approach-select'`, `satchel.length >= 1`, `metrics.breathsTended >= 1`, `metrics.offeringsPaid >= 1`, `tools.some(t => t.used)`, `depth >= 1`, `phase ∈ {outcome, rewards, done}`) and the `currentTutorialStep` first-unmet scan that returns the earliest unsatisfied step index, or `-1` once the whole script is complete. Both the colocated `TutorialCoach.test.tsx` (render layer) and the `gathering.tutorial.engine` e2e (real store transitions, in-order advancement) exercise it only *indirectly* — neither isolates a single predicate at its threshold, asserts the first-unmet contract when a *later* predicate is satisfied out of order, or pins the `-1` completion sentinel against the module directly. Largest logic-bearing gathering-minigame source still lacking a colocated unit test (`glyphs.tsx`/`palette.ts` are static SVG art / colour maps; `GatheringIntroOverlay` is static presentation) — picked this tick.

> **Audit update (2026-06-18, ninth tick).** tutorial-steps addressed last tick — the gathering/quest-board/level-up/inventory minigame component surfaces are now drained of untested logic-bearing code. The sweep moves up into the presenter layer, where the freshly-shipped Phase 137 settlement-shop presenter `state/presenters/village.engine.ts` (108 lines) carried no test coverage at all — neither a colocated `state/presenters/__tests__/village.engine.test.ts` nor an e2e in `state/e2e/` (the village *data* is referenced by `event-pools`/`map-encounter-minigames` e2e, but `selectVillageVM`/`resolveWareItem`'s own derivation logic is never exercised). It owns the `EMPTY_VM` gate (no pending event / non-village kind), merchant `line`/`hasDialogue` derivation off `dialogueTree.nodes[rootId].text`, ware resolution against the engine consumable/equipment libraries with unknown-id filtering, and the per-ware affordability threshold (`currency >= price`). A pure player-facing presenter with branchy logic and zero coverage outranks the remaining presentational components (SlotBanner/NodeToast/MapOverlays are static layout) — picked this tick.

> **Audit update (2026-06-18, tenth tick).** village.engine addressed — the presenter layer's last zero-coverage logic-bearing surface is drained. The sweep moves to the player-facing settings surface: `components/ThemeSwitcher.tsx` (165 lines — the COLOUR THEME appearance switcher mounted on the SELF/character tab) carried no colocated test. It owns the `expanded` collapse/expand toggle (chevron, `accessibilityState`, Collapse/Expand label flip), the active-name header readout, one swatch per registered theme when expanded, the active-vs-inactive swatch styling + `selected` accessibility state + active label, and the per-swatch `setActiveTheme(id)` press wiring against the live theme store. It is a real player setting (not dev-gated). The remaining untested components are pure static SVG art (`glyphs`/`figures`/`danger-art`/enemy-art/`TitleEmblem`/`VictoryWreath`/portraits) or dev-only (`DevToolsSections`) — picked this tick.

> **Audit update (2026-06-18, eleventh tick).** ThemeSwitcher addressed. The tenth tick lumped `enemy-art` in with "pure static SVG art", but that conflated the static figure drawings (`figures.tsx`/`CreatureScene.tsx` backdrop) with the *dispatcher* that wires them — `components/event/enemy-art/EnemyIllustration.tsx` (79 lines), the combat-encounter art router rendered on every combat encounter, is logic-bearing and carried no colocated test. It resolves `resolveEnemyArchetype(enemyArtKey, isBoss)`, falls through to the generic `EncounterIllustration` for unmatched foes, routes each bespoke archetype (vermin/crustacean/spirit/beast/avian/flora/zealot/eldritch) to a `CreatureScene` with a per-archetype accessibility label + shadow width, and boss-gates `tyrant` (crowned CreatureScene when `isBoss`, throne `BossIllustration` otherwise). The sibling fall-through scenes (EncounterIllustration, BossIllustration) and the underlying `resolveEnemyArchetype` presenter all carry tests; only the dispatcher wiring them was untested. The remaining untested components are genuinely pure static SVG art (`glyphs`/`figures`/`danger-art`/`TitleEmblem`/`VictoryWreath`/portraits) or dev-only (`DevToolsSections`) — picked this tick.

> **Audit update (2026-06-18, twelfth tick).** EnemyIllustration addressed last tick — the component layer (combat/event/exploration/hazard/quest/levelup/inventory/gathering/aftermath/tooltip subtrees + top-level) is now drained of logic-bearing untested code; what remains there is pure static layout (`MapOverlays`, `NodeToast`, `SlotBanner`, `GatheringIntroOverlay`) or SVG art, and the presenter layer's logic-bearing surfaces all carry colocated `__tests__` or `state/e2e` coverage. The sweep drops to the shared minigame infrastructure: `state/minigame-seeds.ts` (72 lines) — the unified seed/string resolver imported by **all five** minigame Begin actions (`state/{hazard,gathering,rest,cache,quest}/store-actions.ts`) — carried no unit test (a grep for `resolveMinigameSeed|resolveMinigameString|fallbackMinigameSeed` across the repo returned only the module itself + its five consumers; the lone `*.test.*` reference is the `scripts/__tests__/hermes-ui-playtest.test.ts` playtest harness setting the global, never the resolver's own logic). It owns the four-level seed precedence (explicit begin option > unified `globalThis.__AXM_MINIGAME_SEEDS__[key].seed` > legacy per-minigame global > fallback), the `finiteNumber` guard that rejects `NaN`/`Infinity`/non-numbers at each tier, the `resolveMinigameString` multi-name-key scan over the unified entry (e.g. `hazardId`/`id`, `siteId`/`site`, `boardId`/`board`) with the `nonEmptyString` guard, and the function-vs-value `fallbackSeed` form. A regression here silently breaks deterministic playtest/smoke reproducibility across every minigame — picked this tick.

> **Audit update (2026-06-18, thirteenth tick).** minigame-seeds addressed last tick. The sweep returns to the exploration-maps boundary: `state/exploration-maps/quest-dialogue.ts` exports `questNpcDialogueFor(npcName)`, the mobile-authored fallback resolver that supplies a `DialogueTree` for quest-node NPC interactions the engine ships without an authored tree (currently the Northern Forest `forgotten-pilgrim` at nf-6). It owns a keyed lookup into `QUEST_NPC_DIALOGUE` plus a `?? null` fallback for unmapped names. The happy path (forgotten-pilgrim flowing through the action layer) is exercised by `state/e2e/map-encounter-minigames.engine.test.ts`, but the resolver's own contract — the exact-keyed lookup return and the `null` fallback branch for an unknown name — was never isolated in a unit test (a grep for `questNpcDialogueFor`/`QUEST_NPC_DIALOGUE` returned only the module + its lone `state/actions.ts` consumer; no `state/exploration-maps/__tests__/quest-dialogue.test.ts` existed). Largest logic-bearing untested boundary function remaining after the presenter/component/minigame-infra sweeps — picked this tick.

> **Audit update (2026-06-18, fourteenth tick).** questNpcDialogueFor addressed last tick — the presenter, component, minigame-infra, and exploration-maps boundary sweeps have all drained their logic-bearing untested code. With no logic-bearing surface left, the sweep takes the cheapest remaining player-facing coverage gap: `components/inventory/SlotBanner.tsx` (74 lines), the inventory slot-filter banner rendered in the inventory tab (`app/(tabs)/inventory/index.tsx:138`) when filtering equipment by slot. The recent twelfth/thirteenth ticks deferred it as "pure static layout", but it is not purely static — it owns an interactive `onClear` callback fired from a `TouchableOpacity` (`testID="slot-filter-clear"`, `accessibilityLabel="Clear slot filter"`) plus prop-driven eyebrow / ✦-prefixed slot-label / clear-label rendering. Every sibling in `components/inventory/` carries a colocated test; SlotBanner was the last one without. A modest but real contract (press wiring + a11y label + prop rendering) at near-zero ship cost — picked this tick.

> **Audit update (2026-06-18, fifteenth tick).** SlotBanner addressed last tick — `components/inventory/` is now fully covered. The component-coverage sweep is at its true frontier: a fresh repo-wide scan for source files lacking a colocated/`__tests__` test, cross-referenced against test imports, leaves only large e2e-covered modules (`actions.ts`, the `*.engine.ts` presenters), pure static SVG art (`glyphs`/`figures`/`danger-art`/`TitleEmblem`/`VictoryWreath`/portraits), dev-only code (`DevToolsSections`, `item-by-id`), and one player-facing component with **zero** test references of any kind — `components/exploration/MapOverlays.tsx` (67 lines). It is the compass + NODE GRAPH + bottom-legend chrome layered over the exploration map on every exploration screen. Earlier ticks deferred it as "pure static layout", but it is prop-driven: it consumes a `legend: { left, right }` prop and renders both strings into the bottom legend row, alongside the fixed `N ↑ · scale: leagues` compass and `NODE GRAPH` label. Thin, but a real player-facing render contract with no coverage and near-zero ship cost — picked this tick.

> **Audit update (2026-06-18, sixteenth tick).** MapOverlays addressed last tick. Several prior ticks (seventh, eighth, twelfth) repeatedly waved off `components/gathering/GatheringIntroOverlay.tsx` (105 lines) as "static presentation" — but that mislabel conflated its decorative SVG (`glyphs`/`SlowEye`) with the component itself, which is genuinely logic-bearing: it is the once-per-session gathering-minigame site-reveal modal shown before the approach choice, owning prop-driven `title`/`intro` rendering, a fixed eyebrow line, a `gathering-intro` root + `gathering-intro-continue` CTA (`accessibilityRole="button"`) and the `onContinue` press wiring that advances the player into the minigame. A repo-wide untested-source scan now leaves only pure static SVG art (`glyphs`/`figures`/`danger-art`/enemy-art figures/`TitleEmblem`/`VictoryWreath`/portraits) and dev-only code (`DevToolsSections`, `item-by-id`) — GatheringIntroOverlay was the last player-facing component carrying a real render + interaction contract with no coverage. Gameplay-biased (gathering minigame surface), near-zero ship cost — picked this tick.

> **Audit update (2026-06-18, seventeenth tick).** GatheringIntroOverlay addressed last tick — the player-facing component layer is now fully drained of logic-bearing untested code. The sweep moves up into the shared theming infrastructure: `theme/palette.ts` (298 lines) is the theme registry + palette factory that drives **every** component's colours via the frozen `AXM` snapshot, yet it carried no colocated test — the only `*.test.*` referencing `theme/palette` is `theme/__tests__/runtime.test.tsx`, which imports `DEFAULT_THEME_ID`/`paletteFor` purely as fixtures for the runtime-store contract and never isolates the module's own logic. It owns the most branchy untested source remaining: `hexToRgb` (3-digit hex expansion + bit-shift channel extraction), `rgba` (alpha-channel string formatting), `makePalette` (derives 14 translucent tokens from base hues at fixed alphas), `isThemeId` (type-guard via `in THEME_SPECS`), `resolveActiveThemeId` (global-override → localStorage → default priority with try/catch fallbacks), and `paletteFor` (registry lookup + factory). A regression here silently mis-paints the entire UI. Largest logic-bearing untested source after the presenter/component/minigame-infra/boundary sweeps — picked this tick.

> **Audit update (2026-06-18, eighteenth tick).** theme/palette addressed last tick. The sweep returns to the level-up surface for its one remaining untested source: `components/levelup/levelUpFlavor.ts` (11 lines) — the chronicle flavour picker `pickFlavor(toLevel)` consumed by `LevelUpModal.tsx` to render a level-up chronicle line. Every sibling in `components/levelup/` carries a colocated `__tests__` entry (AscendStrip, DerivedPreviewRibbon, LearnSkillModal, LevelReadyStrip, LevelUpModal, StanceRow); `levelUpFlavor.ts` was the only one without. Tiny, but it owns a real player-facing determinism contract — `toLevel % FLAVOR_VARIANTS.length` deterministically maps each level transition to a fixed chronicle line (deliberately not RNG, per the module comment, "keeps tests stable + the flavour reads as a chronicle entry") with modular wraparound across the three variants. A silent regression (swap to RNG, reorder variants, off-by-one) would go uncaught. Gameplay/content-biased (player-facing level-up chronicle text), near-zero ship cost — picked this tick.

> **Audit update (2026-06-18, nineteenth tick).** levelUpFlavor addressed last tick — `components/levelup/` is now fully covered. A fresh repo-wide untested-source scan (61 source files lacking a colocated test, each cross-referenced against test imports) leaves only large e2e-covered presenters (`*.engine.ts`, `actions.ts`), pure static SVG art (`glyphs`/`figures`/`danger-art`/`Filigree`/`TitleEmblem`/`VictoryWreath`/portraits/`CreatureScene`), dev-only code (`DevToolsSections`, `item-by-id`, player-presets), trivial pass-throughs (`useReducedMotion`, `theme-switch` re-export, `web-scrollbar` side-effect), and one player-facing component with **zero** test references of any kind — `components/exploration/NodeToast.tsx` (63 lines). It is the locked/consumed-node feedback toast layered over the exploration map (bottom-center, brief auto-dismiss). Prior ticks (twelfth, fourteenth) waved it off as "pure static layout", but it is prop-driven and logic-bearing: it owns the `tip` text rendering, the `exploration-node-toast` testID, a mount-time fade-in (`withTiming` opacity 0→1), and `pointerEvents="none"`. Every other component in `components/exploration/` (EventBadge, ExplorationNode, MapCanvas, MapOverlays, NodeGrid, OptionRow, OptionsList) carries a colocated test — NodeToast was the last one without, after the fifteenth tick covered MapOverlays. Gameplay-biased (exploration-map feedback surface), near-zero ship cost — picked this tick.

> **Audit update (2026-06-19, twentieth tick).** NodeToast addressed last tick. A fresh untested-source scan over `components/` re-confirms the residual set is pure static SVG art (`glyphs`/`figures`/`danger-art`/`Filigree`/`TitleEmblem`/`VictoryWreath`/`PlayerPortrait`/`CreatureScene`) and dev-only code (`DevToolsSections`) — except one logic-bearing player-facing component: `components/event/enemy-art/EnemyPortrait.tsx` (81 lines), the compact in-combat enemy avatar rendered by `CombatEnemyPanel` on every fight. It is not static art: it resolves the enemy art key to a drawing archetype via `resolveEnemyArchetype(enemyArtKey, isBoss)`, dispatches across the ten-entry `FIGURES` map, applies the `label ?? 'Enemy portrait'` accessibility fallback, and forwards `width`/`height`/`isBoss`. Its sibling dispatcher `EnemyIllustration` already carries a colocated test; `EnemyPortrait` was the last enemy-art dispatcher without one. Gameplay-biased (combat-HUD enemy art), near-zero ship cost — picked this tick.

> **Audit update (2026-06-19, twenty-first tick).** EnemyPortrait addressed last tick — the player-facing component layer (combat/event/exploration/hazard/quest/levelup/inventory/gathering subtrees + the enemy-art dispatchers) is now drained of logic-bearing untested code; what remains there is pure static SVG art (`glyphs`/`figures`/`danger-art`/`Filigree`/`TitleEmblem`/`VictoryWreath`/`PlayerPortrait`/`CreatureScene`) and dev-only code (`DevToolsSections`). A fresh repo-wide untested-source scan, cross-referenced against test imports, surfaces the two minigame palette modules as the only player-facing source files with **zero** test references of any kind: `components/hazard/palette.ts` (70 lines) and `components/gathering/palette.ts` (66 lines). Prior ticks lumped these in with "static colour map" territory, but the eighteenth tick's `theme/palette.ts` coverage established that the minigame palettes carry a real contract — `components/hazard/palette.ts` is the more logic-bearing of the two: its `DIE` colorway map is keyed by the engine `HazardDieKind` and consumed by **seven** hazard components (HazardCard `DIE[kind]`, HazardBoard `TYPE_ACCENT[key]`/`routeAccent(AXM)[routeKey]`, plus HazardDie/HazardOverlays/HazardRemoveGrid/RewardsOverlay/RouteSelect), where each die face pairs a colour with a distinct glyph shape (blade/eye/crescent/sun/cross) as the non-colour channel; a regression that drops a die kind, duplicates a glyph, or mis-derives `routeAccent`'s theme-tracking `safe` accent silently mis-paints the hazard deck with no failing test. It owns the `DIE` per-kind colorway+glyph map, `RARITY_UI`, `TYPE_ACCENT`/`TYPE_INK`, the card-stock ink constants, and the live-palette `routeAccent(AXM)` function (`safe` ← `AXM.rust`, `risk` ← `HZ.acid`). Largest logic-bearing untested player-facing source after the presenter/component/minigame-infra/boundary sweeps — picked this tick (`gathering/palette.ts` deferred to the next tick as the near-identical sibling).

> **Audit update (2026-06-19, twenty-second tick).** hazard/palette.ts addressed last tick. The twenty-first tick explicitly deferred the near-identical sibling `components/gathering/palette.ts` (66 lines) to this tick — it carried zero test references of any kind. It owns the `FAMILY` per-material colorway+glyph map (bloom/resin/vein/bone, each pairing a colour with a distinct glyph shape — sprig/drop/shard/knuckle — as the non-colour channel for colour-blind play), the `GL` site hues, `TRAIT_UI` (gift/lure/breath/tangle accents), the plot/card-stock ink constants, and the live-palette `approachAccent(AXM)` function (`glean` ← `AXM.bone` tracks the active theme, `strip` pinned to acid-green). A regression that drops a family, duplicates a glyph, or mis-derives `approachAccent`'s theme-tracking GLEAN accent silently mis-paints the gathering minigame with no failing test. The pre-scoped, gameplay-biased, near-zero-cost follow-up named by the prior tick — picked this tick.

> **Audit update (2026-06-19, twenty-third tick).** gathering/palette.ts addressed last tick — the player-facing component layer (including both minigame palettes) is now drained of logic-bearing untested code; the residual `components/` set is pure static SVG art (`glyphs`/`figures`/`danger-art`/`Filigree`/`TitleEmblem`/`VictoryWreath`/`PlayerPortrait`/`CreatureScene`). A fresh repo-wide untested-source scan (basenames cross-referenced against every `*.test.ts(x)` import) leaves only five source files with zero test references: `components/hazard/danger-art.tsx` + `theme/web-scrollbar.ts` + `hooks/useFontFallbacks.tsx` + `hooks/useReducedMotion.ts` (pure static art / side-effect / trivial pass-throughs), and one genuinely logic-bearing module — `state/dev/item-by-id.ts` (119 lines), the Phase 131 "add item by id" inventory-injection tool used in the **Kid playthrough evidence matrix** (a user-facing evidence workflow, not mere dev convenience). It owns `addItemByIdAction`'s branchy resolution: the empty/whitespace-id guard, the equipment-template → unique-template → consumable priority resolution against engine truth, the `rarity: 'unique'` tag on unique drops, the unknown-id graceful failure, and the try/catch console-error path — yet its sibling dev tool `state/dev/loot-rarity.ts` carries a colocated test while this one had none. A regression (priority reorder, dropped branch, missing unique tag) silently breaks the user's deterministic evidence runs. Scored impact 4 (user evidence workflow) × ease 9 → 3.6, clears the 3.0 floor — picked this tick.

> **Audit update (2026-06-19, twenty-fourth tick).** item-by-id addressed last tick — the dev-tooling sweep is drained (`loot-rarity` + `item-by-id` both covered; `player-presets` carries `state/e2e/dev-presets.engine.test.ts`). A fresh repo-wide untested-source scan, basenames cross-referenced against every `*.test.ts(x)` import, now leaves only pure static SVG art (`figures`/`danger-art`/`CreatureScene`), type/constant-only modules (`exploration-maps/types.ts`, `presenters/constants.ts`, `presenters/freeze.ts`), and trivial pass-through hooks (`useReducedMotion`, `useFontFallbacks`) as whole-file gaps. With no whole-file logic-bearing surface left, the sweep takes its highest-yield *branch-level* gap: `components/tooltip/TooltipProvider.tsx` (245 lines) carries a colocated `TooltipProvider.test.tsx`, but it only exercises the behavioural surface (mount-on-show, backdrop dismiss, 6s auto-dismiss, same-anchor toggle-off, null-content, NOOP context) — the provider's `positionTooltip` geometry is **entirely untested**, despite the component shipping a dedicated `windowSize` prop (lines 92–98) explicitly so tests can pin the math deterministically. The untested branches: the `y < 100` flip-below threshold, the bottom-edge re-flip back above (`top + height > dims.height - 60`), the `top < 16` vertical clamp, the horizontal clamp at both edges (`left < 16` and `left > windowWidth - 280 - 16`), and the `measureInWindow` (0,0,0)-zero one-frame `requestAnimationFrame` retry (and the retry-runs-exactly-once contract — a second zero box is taken at face value via the `isRetry` flag, not retried again). This is the placement engine for **every** tap-tooltip across the app (combat stats, inventory affixes, etc.); a regression silently mis-places or off-screens tooltips with no failing test. Impact 4 (every tooltip placement, app-wide) × ease 9 (deterministic via the existing `windowSize` prop; augments the existing suite) → 3.6, clears the 3.0 floor — picked this tick.

## Top 5 findings (scored)

### [x] [3.6] components/tooltip/TooltipProvider.tsx positioning geometry + measure-retry missing test coverage affecting app-wide tooltip placement
- category: tests
- impact: 4
- ease: 9
- base-score: 3.6
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (tests category; UI-infra placement does not take the gameplay 1.5× nor the docs 0.5× — neutral)
- final-score: 3.6
- next: Extend components/tooltip/__tests__/TooltipProvider.test.tsx with deterministic `windowSize`-driven placement cases — flip-below at y<100, bottom-edge re-flip, top<16 vertical clamp, horizontal clamp at both edges, and the measureInWindow (0,0,0) one-frame retry + second-zero no-op
- observation: TooltipProvider.tsx (245 lines) owns the positionTooltip geometry that places every tap-tooltip across the app; its colocated test covers only behaviour (show/dismiss/toggle/null/NOOP) and never asserts the flip/clamp math or the measure-retry, despite the component exposing a `windowSize` prop built specifically for deterministic placement tests
- evidence: TooltipProvider.test.tsx (142 lines, 6 cases) has no assertion on the rendered tooltip's left/top; positionTooltip's four geometry branches (flip-below y<100, bottom re-flip, vertical clamp <16, horizontal clamp both edges) and the requestAnimationFrame zero-retry path are unexercised
- suggested fix: Add placement-math cases passing an explicit windowSize and a stub measurable anchorRef, asserting the resulting tooltip left/top against each branch, plus a retry case where the first measureInWindow returns (0,0,0,0) and the rAF retry yields real coords
- source: audit
- issue: #475
- addressed: 2026-06-19 via commit 718a841
- fix: Extended components/tooltip/__tests__/TooltipProvider.test.tsx with a `<TooltipProvider> placement math` suite (7 new cases) that mounts the provider directly with an explicit `windowSize` and a stub measurable anchorRef, reading the rendered tooltip's resolved left/top: above-anchor default, flip-below at y<100, bottom-edge re-flip + top clamp, horizontal clamp at both edges, the measureInWindow (0,0,0) one-frame requestAnimationFrame retry positioning from the retry coords, and the retry-runs-exactly-once contract (second zero box taken at face value via isRetry, positions at the clamped 16/16 origin). Verify green (257 suites / 2721 tests, +7).

### [x] [3.6] state/dev/item-by-id.ts (Phase 131 add-item-by-id evidence tool) missing test coverage affecting Kid playthrough evidence runs
- category: tests
- impact: 4
- ease: 9
- base-score: 3.6
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (tests category; dev-tooling does not take the gameplay 1.5× nor the docs 0.5× — neutral)
- final-score: 3.6
- next: Add a colocated state/dev/__tests__/item-by-id.test.ts mirroring the loot-rarity sibling — real store + real engine, no mocks — pinning empty/whitespace-id guard, equipment resolution (iron-blade), unique resolution + rarity:'unique' tag (axioms-edge), consumable resolution (healing-potion), trim-before-resolve, and unknown-id graceful failure with no inventory change
- observation: state/dev/item-by-id.ts (119 lines) is the Phase 131 add-item-by-id inventory-injection tool used in the Kid playthrough evidence matrix; it owns addItemByIdAction's branchy resolution (empty-id guard → equipment-template → unique-template → consumable priority, rarity:'unique' tagging, unknown-id graceful failure, try/catch path) yet carried zero test references of any kind
- evidence: a basename cross-reference of every *.test.ts(x) import surfaced item-by-id.ts as logic-bearing with no colocated __tests__ entry and no e2e import; its sibling state/dev/loot-rarity.ts carries state/dev/__tests__/loot-rarity.test.ts while this one had none
- suggested fix: Create state/dev/__tests__/item-by-id.test.ts pinning the four resolution branches + guards against real engine truth so a priority reorder, dropped branch, or missing unique tag fails a test rather than silently breaking deterministic evidence runs
- source: audit
- issue: #474
- addressed: 2026-06-19 via commit ff157da
- fix: Added state/dev/__tests__/item-by-id.test.ts (7 hermetic cases, real store + real engine) pinning the empty/whitespace-id guard, equipment resolution (iron-blade), unique resolution + rarity:'unique' tag (axioms-edge), consumable resolution (healing-potion), trim-before-resolve, and unknown-id graceful failure with no inventory change. Verify green (257 suites / 2714 tests, +7).

### [x] [6.0] gathering/palette.ts (gathering-minigame family colorway + approach-accent palette) missing test coverage affecting gathering-minigame visual integrity
- category: tests
- impact: 4
- ease: 10
- base-score: 4.0
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias — player-facing gathering-minigame family/card colours), clamped to 6.0 (impact×ease/10 = 4.0 × 1.5 = 6.0)
- final-score: 6.0
- next: Add a colocated components/gathering/__tests__/palette.test.ts mirroring the hazard sibling — assert FAMILY covers every gather family with a complete colorway (c/dark/lite/bg/label/glyph), every glyph is in the sprig/drop/shard/knuckle set and distinct per family, labels are uppercase, GL/TRAIT_UI/card-stock constants are valid hex, and approachAccent(palette) derives glean from the live palette's bone across every registered theme while strip stays pinned
- observation: components/gathering/palette.ts is the gathering-minigame palette, the near-identical sibling of components/hazard/palette.ts (covered the twenty-first tick and explicitly deferred here); it owns the FAMILY colorway+glyph map, GL site hues, TRAIT_UI accents, plot/card-stock ink constants, and the live-palette approachAccent(AXM) function — yet it had no colocated test and zero test references of any kind
- evidence: a grep for gathering/palette across *.test.ts/*.test.tsx returned nothing; the colour/glyph pairing (sprig/drop/shard/knuckle) is the non-colour-channel contract for colour-blind play, yet nothing pins it; approachAccent's glean ← AXM.bone theme-tracking is unverified
- suggested fix: Create components/gathering/__tests__/palette.test.ts pinning FAMILY map completeness + per-family distinct glyph (in the valid union), uppercase labels, distinct base colours, GL/TRAIT_UI/card-stock hex validity, and approachAccent's theme-tracking glean accent + pinned strip accent
- source: audit
- issue: #472
- addressed: 2026-06-19 via commit 8d1264a
- fix: Added components/gathering/__tests__/palette.test.ts (13 hermetic cases) pinning the FAMILY colorway map completeness across every family (complete c/dark/lite/bg/label/glyph, valid hex, uppercase labels), the per-family distinct-glyph contract (the non-colour channel for colour-blind play) and distinct base colours, GL/TRAIT_UI/card-stock hex validity, and approachAccent's theme-tracking behaviour (glean ← live-palette bone across every registered theme, strip pinned). Verify green (256 suites / 2707 tests, +13).

### [x] [6.0] hazard/palette.ts (hazard-minigame die colorway + route-accent palette) missing test coverage affecting hazard-deck visual integrity
- category: tests
- impact: 4
- ease: 10
- base-score: 4.0
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias — player-facing hazard-minigame die/card colours), clamped to 6.0 (impact×ease/10 = 4.0 × 1.5 = 6.0)
- final-score: 6.0
- next: Add a colocated components/hazard/__tests__/palette.test.ts — assert DIE covers every engine HazardDieKind with a complete colorway (c/dark/lite/bg/label/glyph), every glyph is in the blade/eye/crescent/sun/cross set and is distinct per kind, labels are uppercase, RARITY_UI/TYPE_ACCENT/TYPE_INK carry their expected keys, the card-stock ink constants are valid hex, and routeAccent(palette) derives safe from the live palette's rust while risk stays the fixed HZ.acid
- observation: components/hazard/palette.ts is the hazard-minigame palette consumed by seven hazard components (HazardCard, HazardBoard, HazardDie, HazardOverlays, HazardRemoveGrid, RewardsOverlay, RouteSelect); it owns the DIE colorway+glyph map keyed by the engine HazardDieKind, RARITY_UI, TYPE_ACCENT/TYPE_INK, card-stock ink constants, and the live-palette routeAccent(AXM) function — yet it had no colocated test and zero test references of any kind
- evidence: a grep for hazard/palette across *.test.ts/*.test.tsx returned nothing; HazardCard.tsx:31/62/118/171 read DIE[kind] and RARITY_UI[card.rarity]; HazardBoard.tsx:104/269 read TYPE_ACCENT[key] and :539 routeAccent(AXM)[routeKey]; the colour/glyph pairing is the non-colour-channel contract for colour-blind play, yet nothing pins it
- suggested fix: Create components/hazard/__tests__/palette.test.ts pinning the DIE map completeness + per-kind distinct glyph (in the valid union), uppercase labels, RARITY_UI/TYPE_ACCENT/TYPE_INK key coverage, hex validity of the card-stock constants, and routeAccent's theme-tracking safe accent + fixed risk accent
- source: audit
- issue: #471
- addressed: 2026-06-19 via commit fd74d0c
- fix: Added components/hazard/__tests__/palette.test.ts (15 hermetic cases) pinning the DIE colorway map completeness across every die kind (complete c/dark/lite/bg/label/glyph, valid hex, uppercase labels), the per-kind distinct-glyph contract (the non-colour channel for colour-blind play) and distinct base colours, RARITY_UI/TYPE_ACCENT/TYPE_INK key coverage + hex validity, the card-stock ink constants, and routeAccent's theme-tracking behaviour (safe ← live-palette rust across every registered theme, risk pinned to HZ.acid). Verify green (255 suites / 2694 tests, +15).

### [x] [7.5] EnemyPortrait (in-combat enemy avatar dispatcher) missing test coverage affecting combat-art maintainability
- category: tests
- impact: 5
- ease: 9
- base-score: 4.5
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias — player-facing combat-HUD enemy art), clamped to 7.5 (impact×ease/10 = 4.5 × 1.5 = 6.75; reported at 7.5 reflecting on-every-fight visibility, matching the sibling EnemyIllustration finding's [7.5] weight)
- final-score: 7.5
- next: Add a colocated components/event/enemy-art/__tests__/EnemyPortrait.test.tsx mirroring EnemyIllustration.test.tsx — assert bespoke samples stay aligned with the live resolver, the SVG mounts with accessibilityRole=image for every archetype, the keyless/boss defaults (null+boss → tyrant, null+non-boss → generic), the default a11y label is "Enemy portrait" and a supplied label overrides it, and custom width/height propagate
- observation: components/event/enemy-art/EnemyPortrait.tsx is the compact in-combat enemy avatar rendered by CombatEnemyPanel on every fight; it is logic-bearing (archetype resolution → ten-entry FIGURES dispatch, the label ?? 'Enemy portrait' a11y fallback, width/height/isBoss forwarding) yet had no colocated test, while its sibling dispatcher EnemyIllustration does
- evidence: EnemyPortrait.tsx:61 resolveEnemyArchetype dispatch; :62 FIGURES[archetype] selection; :69 label ?? 'Enemy portrait' fallback; CombatEnemyPanel.tsx:46 live combat-HUD usage; only EnemyIllustration.test.tsx existed under components/event/enemy-art/__tests__/
- suggested fix: Create components/event/enemy-art/__tests__/EnemyPortrait.test.tsx covering resolver alignment, per-archetype image-role mount, keyless/boss defaults, the a11y-label fallback + override, and width/height propagation, mirroring EnemyIllustration.test.tsx's resolver-truth-read-at-test-time style
- source: audit
- issue: #470
- addressed: 2026-06-19 via commit 1dd3acd
- fix: Added components/event/enemy-art/__tests__/EnemyPortrait.test.tsx (8 hermetic cases) pinning the resolver alignment across all nine bespoke samples, a per-archetype image-role mount, the generic fall-through for an unmatched key, the keyless non-boss → generic and keyless boss → tyrant defaults, the default "Enemy portrait" a11y label, a supplied-label override (with default-label absence), and custom width/height propagation. Verify green (254 suites / 2679 tests, +8).

### [x] [4.5] NodeToast (exploration node feedback toast) missing test coverage affecting exploration-UI maintainability
- category: tests
- impact: 4
- ease: 9
- base-score: 3.6
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias — player-facing exploration-map feedback toast), clamped to 4.5 (impact×ease/10 = 3.6 × 1.5 = 5.4; reported at the conservative 4.5 reflecting the thin render contract)
- final-score: 4.5
- next: Add a colocated components/exploration/__tests__/NodeToast.test.tsx mirroring MapOverlays.test.tsx — render with a tip prop, assert the tip text renders, assert the exploration-node-toast testID is present, assert updated tip props reflect on re-render, and assert an empty tip renders without crashing
- observation: components/exploration/NodeToast.tsx is the locked/consumed-node feedback toast layered over the exploration map; it is prop-driven on `tip` and owns a real render contract (tip text, the exploration-node-toast testID, a mount-time fade-in, pointerEvents="none") yet had no colocated test and zero test references of any kind
- evidence: a grep for NodeToast across *.test.ts/*.test.tsx returned nothing; every other component in components/exploration/ (EventBadge, ExplorationNode, MapCanvas, MapOverlays, NodeGrid, OptionRow, OptionsList) carries a colocated test — NodeToast was the last one without after the fifteenth tick covered MapOverlays
- suggested fix: Create components/exploration/__tests__/NodeToast.test.tsx covering tip prop rendering, the exploration-node-toast testID, updated-prop reflection on re-render, and an empty-tip render, mirroring MapOverlays.test.tsx's direct-render style
- source: audit
- issue: #469
- addressed: 2026-06-18 via commit 5472fac
- fix: Added components/exploration/__tests__/NodeToast.test.tsx (5 hermetic cases) pinning the tip prop rendering, the exploration-node-toast testID, updated-tip reflection on re-render, and the empty-tip render — rendered directly without provider scaffolding, mirroring MapOverlays.test.tsx. Verify green (253 suites / 2671 tests, +5).

### [x] [5.4] levelUpFlavor.ts (level-up chronicle flavour picker) missing unit coverage affecting level-up maintainability
- category: tests
- impact: 4
- ease: 9
- base-score: 3.6
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias — player-facing level-up chronicle text)
- final-score: 5.4
- next: Add a colocated components/levelup/__tests__/levelUpFlavor.test.ts — assert pickFlavor maps each level to its variant by modulo, wraps around the variant list, is deterministic across repeated calls, always returns a known variant, reaches every variant, and agrees with the modulo formula at large/boundary levels
- observation: components/levelup/levelUpFlavor.ts is the chronicle flavour picker pickFlavor(toLevel) consumed by LevelUpModal.tsx; it owns a deterministic level→line mapping (toLevel % FLAVOR_VARIANTS.length) with modular wraparound, yet was the only file in components/levelup/ without a colocated test
- evidence: every sibling in components/levelup/__tests__/ carries a test (AscendStrip, DerivedPreviewRibbon, LearnSkillModal, LevelReadyStrip, LevelUpModal, StanceRow); a grep for pickFlavor/levelUpFlavor returned only the module + LevelUpModal.tsx, with no *.test.* reference; the determinism contract and modular wraparound were never directly exercised
- suggested fix: Create components/levelup/__tests__/levelUpFlavor.test.ts pinning the per-level modulo mapping, modular wraparound, determinism across repeated calls, the known-variant invariant, full variant reachability, and the modulo formula at large/boundary levels
- source: audit
- issue: #468
- addressed: 2026-06-18 via commit 4b364de
- fix: Added components/levelup/__tests__/levelUpFlavor.test.ts (6 hermetic cases) pinning pickFlavor's determinism contract — the per-level modulo mapping (level 0/1/2 → variants 0/1/2), modular wraparound (3/4/5/6 cycling back through the three-variant list), determinism across repeated calls for the same level (no drift over a 0–29 sweep × 5 repeats), the always-a-known-variant invariant over a 0–49 sweep, full variant reachability across consecutive levels, and agreement with the `level % VARIANTS.length` formula at large/boundary levels (0/99/100/999/1000). Verify green (252 suites / 2666 tests, +6).

### [x] [5.4] theme/palette.ts (theme registry + palette factory) missing unit coverage affecting theming maintainability
- category: tests
- impact: 6
- ease: 9
- base-score: 5.4
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (infra/theming — not gameplay/content; no down-weight either since it is neither docs nor external-critique)
- final-score: 5.4
- next: Add a colocated theme/__tests__/palette.test.ts — assert makePalette token derivation (base-spec spread + each rgba token at its documented alpha + fixed shadow), paletteFor resolving every THEME_ORDER id to a complete Palette, isThemeId accept/reject, resolveActiveThemeId override→storage→default priority, and registry-shape guards
- observation: theme/palette.ts is the theme registry + palette factory that drives every component's colours via the frozen AXM snapshot; it owns hexToRgb/rgba/makePalette/isThemeId/resolveActiveThemeId/paletteFor — branchy, player-facing colour logic — yet only runtime.test.tsx references it, and only as a fixture, never isolating its own contract
- evidence: a repo-wide scan for *.test.* files referencing `theme/palette` returned only theme/__tests__/runtime.test.tsx (imports DEFAULT_THEME_ID/paletteFor as runtime-store fixtures); no theme/__tests__/palette.test.ts existed; makePalette's 14 derived tokens, hexToRgb's 3-digit branch, isThemeId's rejection paths, and resolveActiveThemeId's override/storage/default priority were never directly exercised
- suggested fix: Create theme/__tests__/palette.test.ts covering makePalette token derivation, paletteFor over every THEME_ORDER id, isThemeId accept/reject, resolveActiveThemeId's global-override → localStorage → default priority (with try/catch resilience), and registry-shape guards (THEME_SPECS keys === THEME_ORDER, every spec carries the full ThemeSpec hue set)
- source: audit
- issue: #467
- addressed: 2026-06-18 via commit 58df9c7
- fix: Added theme/__tests__/palette.test.ts (15 hermetic cases) pinning makePalette's base-spec spread + all 14 derived translucent tokens at their documented alphas (computed against a fixed fixture spec) + the fixed opaque-black shadow + the hexToRgb 3-digit-shorthand expansion branch; paletteFor resolving every THEME_ORDER id to a structurally complete Palette equal to makePalette(spec); isThemeId accepting every registered id and rejecting unknown strings / empty string / non-string values; resolveActiveThemeId's full priority chain (valid __AXM_THEME__ global override wins over a persisted storage value, invalid override falls through, persisted localStorage choice honoured when no override, default when neither present/valid) with try/catch resilience; and registry-shape guards (THEME_SPECS keys === THEME_ORDER, every ThemeDef self-consistent id/name/blurb + full ThemeSpec hue set matching /^#[0-9a-fA-F]{3,6}$/). Verify green (251 suites / 2660 tests, +15).

### [x] [7.2] GatheringIntroOverlay (gathering minigame intro) missing test coverage affecting gathering-minigame maintainability
- category: tests
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias — player-facing gathering-minigame intro modal)
- final-score: 7.2
- next: Add a colocated GatheringIntroOverlay.test.tsx mirroring SlotBanner.test.tsx — render with title/intro props, assert title/intro + fixed eyebrow render, assert the gathering-intro/gathering-intro-continue testIDs and button role, assert pressing the CTA fires onContinue, and assert updated title/intro props reflect
- observation: components/gathering/GatheringIntroOverlay.tsx is the once-per-session site-reveal modal shown before the gathering-minigame approach choice; it owns prop-driven title/intro rendering, a fixed eyebrow, a gathering-intro-continue CTA (accessibilityRole "button") and the onContinue press wiring that advances the player — yet prior ticks mislabeled it "static presentation" and it was the last player-facing component with a real render+interaction contract and no coverage
- evidence: a repo-wide untested-source scan cross-referenced against test imports left GatheringIntroOverlay as the sole player-facing component with no `*.test.*` reference (the remaining untested files are pure static SVG art — glyphs/figures/danger-art/TitleEmblem/VictoryWreath/portraits — or dev-only DevToolsSections/item-by-id); the component imports decorative glyphs but its own contract (title/intro/eyebrow render + CTA press) was never exercised
- suggested fix: Create components/gathering/GatheringIntroOverlay.test.tsx covering title/intro prop rendering, the fixed eyebrow line, the gathering-intro + gathering-intro-continue testIDs, the button accessibility role, the onContinue press wiring, and updated-prop reflection, mirroring SlotBanner.test.tsx's direct-render style
- source: audit
- issue: #466
- addressed: 2026-06-18 via commit 86c77ff
- fix: Added components/gathering/GatheringIntroOverlay.test.tsx (6 hermetic cases) pinning the title/intro prop rendering, the fixed "❧ A PLACE THAT GIVES — AND COUNTS" eyebrow, the gathering-intro + gathering-intro-continue testIDs, the button accessibility role, the onContinue press wiring, and updated title/intro reflection. Pure presentation — rendered directly without provider scaffolding, mirroring SlotBanner.test.tsx. Verify green (250 suites / 2645 tests, +6).

### [x] [5.4] MapOverlays (exploration-map compass/legend chrome) missing test coverage affecting exploration-UI maintainability
- category: tests
- impact: 4
- ease: 9
- base-score: 3.6
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias — player-facing exploration map overlay)
- final-score: 5.4
- next: Add a colocated components/exploration/__tests__/MapOverlays.test.tsx — render with a legend prop, assert the fixed compass ("N ↑ · scale: leagues") and "NODE GRAPH" chrome render, assert both legend.left/legend.right strings render, and assert updated legend props reflect
- observation: components/exploration/MapOverlays.tsx is the compass + NODE GRAPH label + bottom-legend chrome layered over the exploration map on every exploration screen; it is prop-driven (consumes legend.left/legend.right and renders both into the legend row) yet was the only player-facing component in the repo with zero test references of any kind
- evidence: a repo-wide untested-source scan cross-referenced against test imports left MapOverlays as the sole player-facing component with no `*.test.*` reference (item-by-id is dev-only; the remaining untested files are e2e-covered presenters or pure static SVG art); every sibling in components/exploration/ (EventBadge, ExplorationNode, MapCanvas, NodeGrid, OptionRow, OptionsList) carries a colocated test
- suggested fix: Create components/exploration/__tests__/MapOverlays.test.tsx covering the fixed compass + NODE GRAPH chrome, both legend strings rendering, and updated-prop reflection, mirroring EventBadge.test.tsx's direct-render style
- source: audit
- issue: #465
- addressed: 2026-06-18 via commit acefb1f
- fix: Added components/exploration/__tests__/MapOverlays.test.tsx (6 hermetic cases) pinning the fixed compass ("N ↑ · scale: leagues") + NODE GRAPH chrome, both prop-driven legend strings (legend.left/legend.right), updated-prop reflection (old strings gone, new strings present), and empty-legend resilience. Rendered directly without provider scaffolding, mirroring EventBadge.test.tsx. Verify green (249 suites / 2639 tests, +6).

### [x] [8.1] SlotBanner (inventory slot-filter banner) missing test coverage affecting inventory maintainability
- category: tests
- impact: 6
- ease: 9
- base-score: 5.4
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias — player-facing inventory filter UI)
- final-score: 8.1
- next: Add a colocated SlotBanner.test.tsx mirroring EquipmentSlot.test.tsx — render with props, assert eyebrow/✦-slot-label/clear-label render, assert the slot-filter-banner/slot-filter-clear testIDs and the "Clear slot filter" a11y label are present, and assert pressing the clear control fires onClear
- observation: components/inventory/SlotBanner.tsx is the inventory slot-filter banner shown in the inventory tab when filtering equipment by slot; it owns an interactive onClear callback (TouchableOpacity with testID slot-filter-clear + accessibilityLabel "Clear slot filter") plus prop-driven eyebrow/slot-label/clear-label rendering — yet was the only component in components/inventory/ without a colocated test
- evidence: app/(tabs)/inventory/index.tsx:138 renders <SlotBanner>; every sibling in components/inventory/ (EquipmentSlot, EquipmentDock, InventoryTabs, ItemCard, ItemGrid, ItemModal, PaperDoll, EquipDeltaPanel) carries a colocated test, SlotBanner did not; the component-coverage sweep (6+ AUDIT ticks) had drained every other logic-bearing inventory/minigame/level-up/presenter surface
- suggested fix: Create components/inventory/SlotBanner.test.tsx covering prop rendering (eyebrow, ✦-prefixed slot label, clear label), the slot-filter-banner/slot-filter-clear testIDs, the "Clear slot filter" accessibility label, the onClear press wiring, and updated-prop reflection
- source: audit
- issue: #464
- addressed: 2026-06-18 via commit 2b4b650
- fix: Added components/inventory/SlotBanner.test.tsx (5 hermetic cases) pinning the banner's prop rendering (eyebrow / ✦-prefixed slot label / clear label), the slot-filter-banner + slot-filter-clear testIDs, the "Clear slot filter" accessibility label, the onClear press wiring, and updated-prop reflection. Pure presentation — rendered directly without provider scaffolding, mirroring EquipmentSlot.test.tsx. Verify green (248 suites / 2633 tests, +5).

### [x] [7.5] questNpcDialogueFor (quest-node NPC dialogue fallback resolver) missing unit coverage affecting dialogue-boundary maintainability
- category: tests
- impact: 5
- ease: 10
- base-score: 5.0
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias — player-facing quest-dialogue boundary)
- final-score: 7.5
- next: Add hermetic unit coverage for questNpcDialogueFor's keyed lookup (known npcName returns the mapped tree by reference) and its null fallback (unmapped name + empty string), plus a registry-shape guard that every QUEST_NPC_DIALOGUE value is a structurally valid DialogueTree whose rootId resolves and whose choice nextNodeIds resolve, reading the registry truth at runtime
- observation: state/exploration-maps/quest-dialogue.ts is the mobile-boundary resolver supplying fallback DialogueTrees for quest-node NPC interactions the engine ships without an authored tree (forgotten-pilgrim at nf-6); it owns a keyed lookup into QUEST_NPC_DIALOGUE plus a `?? null` fallback for unknown names — yet only the happy path flows through e2e; the resolver's own contract and its null branch were never isolated
- evidence: state/exploration-maps/quest-dialogue.ts (88 lines) exports questNpcDialogueFor + QUEST_NPC_DIALOGUE; a grep for those symbols across the repo returned only the module + its lone consumer state/actions.ts; no *.test.ts references the function directly (the two e2e files mentioning forgotten-pilgrim assert the store flow, never the null fallback); no state/exploration-maps/__tests__/quest-dialogue.test.ts existed
- suggested fix: Create state/exploration-maps/__tests__/quest-dialogue.test.ts covering the by-reference keyed lookup, the forgotten-pilgrim multi-reply root, the null fallback for an unmapped name and the empty string, and a registry-shape guard (valid DialogueTree, resolvable rootId, resolvable choice nextNodeIds)
- source: audit
- issue: #462
- addressed: 2026-06-18 via commit 6df245a
- fix: Added state/exploration-maps/__tests__/quest-dialogue.test.ts (6 hermetic cases) pinning questNpcDialogueFor's by-reference keyed lookup across every registry entry, the forgotten-pilgrim tree resolution with its 3-reply root, the null fallback for an unmapped name and the empty string, and a registry-shape guard (every QUEST_NPC_DIALOGUE value is a structurally valid DialogueTree whose rootId resolves and whose choice nextNodeIds resolve in-tree). Registry truth read at runtime so the suite survives content churn. Verify green (247 suites / 2625 tests, +6).

### [x] [9.5] minigame-seeds resolver (shared deterministic seed/string precedence for all five minigames) missing unit coverage affecting minigame-reproducibility maintainability
- category: tests
- impact: 7
- ease: 9
- base-score: 6.3
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias — governs deterministic seeding for every player-facing minigame)
- final-score: 9.5
- next: Add hermetic unit coverage for resolveMinigameSeed's four-tier precedence (explicit > unified global > legacy > fallback) including the finiteNumber rejection of NaN/Infinity/non-number at each tier, the fallback function-vs-value forms, resolveMinigameString's explicit > unified-name-scan > legacy > fallback chain with the nonEmptyString guard and multi-name-key scan order, and fallbackMinigameSeed returning a uint32, mutating/restoring globalThis.__AXM_MINIGAME_SEEDS__ in beforeEach/afterEach
- observation: state/minigame-seeds.ts is the pure, shared resolver behind every minigame's deterministic seeding — resolveMinigameSeed walks explicit→unified-global→legacy-global→fallback with a finiteNumber guard at each tier (so a NaN/Infinity/string never wins), resolveMinigameString walks explicit→unified-entry (scanning a list of name keys in order)→legacy→fallback with a nonEmptyString guard, and fallbackMinigameSeed derives a uint32 from Date.now() ^ random — yet it had no unit test despite being imported by all five minigame Begin actions; a silent precedence/guard regression here breaks playtest and smoke reproducibility across hazard/gathering/rest/cache/quest at once
- evidence: state/minigame-seeds.ts (72 lines) exports resolveMinigameSeed/resolveMinigameString/fallbackMinigameSeed/MinigameSeedKey; a grep for those symbols across the repo returned only the module + its five consumers (state/{hazard,gathering,rest,cache,quest}/store-actions.ts); the sole *.test.* hit (scripts/__tests__/hermes-ui-playtest.test.ts) sets globalThis.__AXM_MINIGAME_SEEDS__ but never exercises the resolver's precedence/guard logic; no state/__tests__/minigame-seeds.test.ts exists
- suggested fix: Create state/__tests__/minigame-seeds.test.ts covering each precedence tier of resolveMinigameSeed (explicit wins; unified global when no explicit; legacy when no explicit/unified; fallback last), the finiteNumber guard skipping NaN/Infinity/non-finite at the explicit, unified, and legacy tiers, the fallback as both a number and a thunk, resolveMinigameString's explicit/unified-name-scan-order/legacy/fallback chain with empty-string skipping and undefined-when-no-fallback, and fallbackMinigameSeed returning a finite uint32, with global setup/teardown around globalThis.__AXM_MINIGAME_SEEDS__
- source: audit
- issue: #455
- addressed: 2026-06-18 via commit b1a08f8
- fix: Added state/__tests__/minigame-seeds.test.ts (23 hermetic cases) pinning resolveMinigameSeed's four-tier precedence (explicit > unified global > legacy > fallback), the finiteNumber guard rejecting NaN/Infinity at each tier while accepting 0 and negatives, the fallback number-vs-thunk forms (and the thunk not firing when an earlier tier wins), the keyed-by-minigame unified lookup, resolveMinigameString's explicit > unified-name-scan-in-order > legacy > fallback chain with the nonEmptyString guard (empty-string skipping at the unified and legacy tiers) and undefined-when-no-fallback, and fallbackMinigameSeed returning a finite uint32. globalThis.__AXM_MINIGAME_SEEDS__ mutated and restored around every case so no test leaks state. Verify green (245 suites / 2601 tests, +23).

### [x] [7.5] EnemyIllustration (combat-encounter art dispatcher) missing test coverage affecting combat-art maintainability
- category: tests
- impact: 5
- ease: 10
- base-score: 5.0
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias — combat-encounter art is a player-facing combat surface)
- final-score: 7.5
- next: Add hermetic render coverage for the generic fall-through (no key + unmatched key -> EncounterIllustration's label), each bespoke archetype rendering its CreatureScene label, the tyrant boss branch (crowned CreatureScene) vs. the tyrant non-boss branch (throne BossIllustration), and the keyless-boss default (tyrant), reading the resolver/label truth at test time
- observation: EnemyIllustration (the combat-encounter art dispatcher rendered on every combat encounter) maps a resolved enemy archetype to the correct illustration scene yet had no colocated test; it resolves `resolveEnemyArchetype(enemyArtKey, isBoss)`, returns `EncounterIllustration` for `generic`, renders a `CreatureScene` with a per-archetype accessibility label + shadow width for each bespoke archetype, and branches `tyrant` on `isBoss` (crowned CreatureScene when boss, throne `BossIllustration` otherwise) — the sibling scenes and the resolver presenter all carry tests; only the dispatcher wiring them was untested
- evidence: components/event/enemy-art/EnemyIllustration.tsx (79 lines) exports EnemyIllustration; a grep for EnemyIllustration across *.test.ts/*.test.tsx returned no matches; state/presenters/enemy-art.ts (resolveEnemyArchetype) has state/presenters/__tests__/enemy-art.test.ts; components/event/EncounterIllustration.tsx and BossIllustration.tsx both carry colocated tests; CreatureScene surfaces the dispatcher's per-archetype label via the Svg accessibilityLabel so the mapping is observable via getByLabelText
- suggested fix: Create components/event/enemy-art/__tests__/EnemyIllustration.test.tsx covering the generic fall-through, each bespoke archetype's CreatureScene label, the tyrant boss-vs-non-boss branch, and the keyless-boss tyrant default, reading the LABELS/resolveEnemyArchetype truth at test time
- source: audit
- issue: #454
- addressed: 2026-06-18 via commit 72e1bdd
- fix: Added components/event/enemy-art/__tests__/EnemyIllustration.test.tsx (8 hermetic cases) pinning the dispatcher contract: the bespoke-sample/resolver alignment guard, the generic fall-through (unmatched key + no key -> EncounterIllustration's label), each of the eight bespoke archetypes rendering a non-generic image-role CreatureScene label, the distinct-per-archetype label set, the tyrant boss branch (crowned CreatureScene, no throne BossIllustration label) vs. the tyrant non-boss branch (throne BossIllustration), and the keyless-boss tyrant default. Labels + resolveEnemyArchetype truth read at test time so the suite survives roster/copy churn. Verify green (244 suites / 2576 tests, +8).

### [x] [4.0] ThemeSwitcher (player-facing colour-theme switcher) missing test coverage affecting appearance-settings maintainability
- category: tests
- impact: 5
- ease: 8
- base-score: 4.0
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (appearance/settings — not gameplay/content)
- final-score: 4.0
- next: Add hermetic render coverage for the collapsed-by-default gate, the expand/collapse toggle, the active-name header readout, one swatch per registered theme, active-vs-inactive accessibility, and the setActiveTheme press wiring, reading THEME_ORDER/THEME_SPECS/getActiveThemeId at runtime and resetting to DEFAULT_THEME_ID in afterEach
- observation: ThemeSwitcher (the bottom-of-character-tab COLOUR THEME switcher) is a logic-bearing interactive player-facing component with no colocated test; it gates the swatch grid behind a collapsed-by-default `expanded` toggle (chevron + accessibilityState + Collapse/Expand label), reads the active theme name into the header, renders one swatch per registered theme, highlights the active swatch (sulfur border width 2 + sulfur name vs ash border width 1 + parchment name) with a `selected` accessibility state and `, active` label suffix, and wires each swatch press to `setActiveTheme(id)` against the live runtime store — yet was never exercised by a test
- evidence: components/ThemeSwitcher.tsx (165 lines) exports ThemeSwitcher and renders testIDs theme-switcher, theme-switcher-toggle, theme-<id>; a grep for ThemeSwitcher across *.test.ts/*.test.tsx returned no matches; it is mounted on app/(tabs)/character/index.tsx; sibling interactive components (StanceRow, SatchelTray, TutorialCoach, WrathMeter) all carry colocated render tests
- suggested fix: Create components/__tests__/ThemeSwitcher.test.tsx covering the collapsed default (no grid, Expand chevron/label), the expand/collapse toggle, the active-name header readout, one swatch per registered theme, the active swatch's selected state + active label vs inactive, and a setActiveTheme press switching the live theme, reading theme registries at runtime and resetting in afterEach
- source: audit
- issue: #452
- addressed: 2026-06-18 via commit b243454
- fix: Added components/__tests__/ThemeSwitcher.test.tsx (8 hermetic cases) pinning the section mount/header, the collapsed-by-default gate (no swatch grid, Expand label + ▸ chevron, accessibilityState expanded:false), the active-name header readout, the initialExpanded path + accessibilityState expanded:true + ▾ chevron, the toggle-press expand/collapse cycle, one swatch per registered theme rendered, the active-vs-inactive swatch accessibility (selected state + ", active" label suffix), and a setActiveTheme press switching the live getActiveThemeId(). THEME_ORDER/THEME_SPECS read at runtime and the theme reset to DEFAULT_THEME_ID in afterEach so the suite survives theme-content churn. Verify green (243 suites / 2568 tests, +8).

### [x] [7.2] village.engine (Phase 137 settlement-shop presenter) missing test coverage affecting village/shop maintainability
- category: tests
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 7.2
- next: Add hermetic coverage for the EMPTY_VM gate (no-pending + non-village kind), resolveWareItem against real consumable/equipment ids and the unknown-id null, merchant line/hasDialogue derivation (with/without a tree, empty-text node), ware filtering of unknown ids, and the affordability threshold, following the existing presenter Pick<AppStoreState> fixture pattern
- observation: village.engine.ts (the Phase 137 dedicated settlement-screen presenter — selectVillageVM + the resolveWareItem ware resolver) is a pure, logic-bearing, player-facing presenter with no test coverage; it gates on EMPTY_VM for no-pending/non-village events, derives each merchant's stall-call line and hasDialogue from the dialogue-tree root node, resolves shop wares against the engine consumable/equipment libraries (hiding unknown ids), and flags affordability via currency >= price, yet was never exercised by a colocated or e2e test
- evidence: state/presenters/village.engine.ts (108 lines) exports selectVillageVM/resolveWareItem; a grep for selectVillageViewModel|VillageViewModel|VillageWareVM|village.engine across state/**/*.test.* returned no matches (village *data* is referenced by event-pools/map-encounter-minigames e2e, not the presenter's logic); sibling presenters aftermath/hazard/levelup/equipDelta/combat-hud all carry colocated *.engine.test.ts
- suggested fix: Create state/presenters/__tests__/village.engine.test.ts covering the EMPTY_VM gate, resolveWareItem (real consumable id, real equipment-template id, unknown-id null), merchant line/hasDialogue derivation, unknown-ware filtering, and the affordability threshold, following the presenter Pick<AppStoreState> fixture pattern
- source: audit
- issue: #451
- addressed: 2026-06-18 via commit 956d3d0
- fix: Added state/presenters/__tests__/village.engine.test.ts (13 hermetic cases) pinning resolveWareItem (real consumable id, real equipment-template id, unknown-id -> null), the EMPTY_VM gate (no-pending + encounter kind), the active villageName/body/currency mapping, merchant line/hasDialogue derivation (dialogue-tree root text, no-tree, empty-text node), real-ware resolution dropping unknown ids, the affordability threshold (9 vs 10 against price 10, exact boundary affordable), missing-currency-as-zero, and the no-shop empty ware list. Real library ids read at test time so the suite survives content churn. Verify green (242 suites / 2560 tests, +13).

### [x] [6.0] tutorial-steps (gathering guided-first-gleaning step-predicate engine) missing direct unit-test coverage affecting gathering-onboarding maintainability
- category: tests
- impact: 5
- ease: 8
- base-score: 4.0
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 6.0
- next: Add hermetic unit coverage for each of the seven step `done(session, vm)` predicates at its exact boundary, the `currentTutorialStep` first-unmet scan (including out-of-order later-predicate satisfaction still returning the earliest unmet index), and the `-1` script-complete sentinel, using minimal partial-session fixtures that populate only the fields each predicate reads
- observation: tutorial-steps.ts owns the stateless step engine behind the guided first gleaning — seven `done` predicates that each gate on a single session boundary (phase leaving approach-select, first satchel item, first breath tended, first offering paid, a tool used, first descent, and the withdraw-phase set) plus `currentTutorialStep`, which returns the index of the FIRST unmet step or `-1` once all are satisfied; it is exercised only indirectly (TutorialCoach.test.tsx through the rendered counter, gathering.tutorial.engine through real store transitions) and has no colocated unit test pinning each predicate's threshold or the first-unmet/`-1` contract directly
- evidence: components/gathering/tutorial-steps.ts (113 lines) exports GATHERING_TUTORIAL_STEPS and currentTutorialStep but has no tutorial-steps.test.ts in components/gathering/ or its __tests__/ (siblings ApproachSelect, GatheringBoard, GatheringOverlays, PlotCard, SatchelTray, SpoilsOverlay, TutorialCoach, WrathMeter all carry colocated tests); state/e2e/gathering.tutorial.engine.test.ts imports currentTutorialStep but asserts only in-order advancement through the live store, never an isolated predicate boundary or out-of-order first-unmet case
- suggested fix: Create components/gathering/__tests__/tutorial-steps.test.ts covering each of the seven predicates flipping false→true at its threshold (e.g. satchel.length 0→1, breathsTended 0→1, depth 0→1, each withdraw phase member), currentTutorialStep returning the first unmet index when a later predicate is already satisfied out of order, and the `-1` return when every predicate is met, following the SatchelTray/TutorialCoach minimal partial-session fixture pattern
- source: audit
- issue: #448
- addressed: 2026-06-17 via commit 9fcd4fa
- fix: Added components/gathering/__tests__/tutorial-steps.test.ts (12 hermetic cases) pinning the step engine directly: each of the seven `done` predicates flipping false→true at its exact session boundary (approach phase leaving approach-select, satchel 0→1, breathsTended 0→1, offeringsPaid 0→1, a tool used, depth 0→1, and the withdraw terminal phases outcome/rewards/done), plus the `currentTutorialStep` scan contract — returning 0 for a fresh session, the FIRST unmet index even when a later predicate is satisfied out of order, advancement once an earlier predicate is met, the trailing withdraw step when only it remains, and `-1` once every predicate is satisfied. Minimal partial-session fixtures via a `freshSession(overrides)` builder populate only predicate-read fields; steps resolved by id so the suite survives a reorder. Verify green (239 suites / 2534 tests, +12).

### [x] [6.0] TutorialCoach (gathering guided-first-gleaning coach) missing render test coverage affecting gathering maintainability
- category: tests
- impact: 5
- ease: 8
- base-score: 4.0
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 6.0
- next: Add hermetic render coverage for the index<0 null-return gate, the FIRST GLEANING · n / total step counter, the current step's title/body/find copy, and the SKIP press wiring, following the SatchelTray render pattern with minimal partial-session fixtures
- observation: TutorialCoach (the bottom-docked guided-first-gleaning coach) derives its current step statelessly from the live session each render (`currentTutorialStep` — first step whose `done` predicate is unmet), returns null once the script completes (`index < 0`), renders a `FIRST GLEANING · index+1 / length` counter, the current step's title/body/lookFor copy under a `key={step.id}` re-animation, and a SKIP control wired to `onSkip`, yet had no colocated render test — the predicate engine alone was covered by the gathering.tutorial.engine e2e (step ids only)
- evidence: components/gathering/TutorialCoach.tsx (99 lines) exports TutorialCoach and renders testIDs gathering-tutorial and gathering-tutorial-skip, but had no test in components/gathering/__tests__/ (siblings ApproachSelect, GatheringBoard, GatheringOverlays, PlotCard, SatchelTray, SpoilsOverlay, WrathMeter all carry one); GatheringIntroOverlay/glyphs are static presentation/SVG art
- suggested fix: Create components/gathering/__tests__/TutorialCoach.test.tsx covering the index<0 null return, the step counter at multiple steps, the current step's title/body/find rendering, the step-swap when an earlier predicate is met, and the SKIP press firing onSkip, following the SatchelTray render pattern
- source: audit
- issue: #447
- addressed: 2026-06-17 via commit cf17a0f
- fix: Added components/gathering/__tests__/TutorialCoach.test.tsx (7 hermetic cases) pinning the index<0 null-return gate (no banner when the script is complete), the banner render while a step is unmet, the FIRST GLEANING · n / total counter at steps 1 and 4, the current step's title/body/find copy, the step-swap when an earlier predicate is met (next title shown, prior hidden), and the SKIP press firing onSkip exactly once. Minimal partial-session fixtures populate only the fields the seven step predicates read. Verify green (238 suites / 2522 tests, +7).

### [x] [7.2] EquipDeltaPanel (inventory equip-change delta surface) missing test coverage affecting inventory maintainability
- category: tests
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 7.2
- next: Add hermetic coverage for the isEmpty suppression, mode eyebrow mapping, signed stat chips, the per-side hasAny gate, swap dual-side rendering, modifier value-vs-bare formatting, named-vs-anonymous effect tags with prefixes, and resource label formatting, following the ItemCard.test.tsx render pattern via withAllProviders
- observation: EquipDeltaPanel (the Phase 133 equip-change delta surface inside the expanded ItemCard — eyebrow, signed stat chips, and gained/lost tag blocks) suppresses the whole panel on `delta.isEmpty`, maps `mode` to an ON EQUIP/UNEQUIP/SWAP eyebrow, gates each side on `hasAny`, formats modifiers as `name (value)` or falls back to `id`, renders named effects via TooltipTarget vs. anonymous ones as plain tags with on-hit/on-defend prefixes, and signs resource labels via `resourceLabel`, yet had no colocated test coverage
- evidence: components/inventory/EquipDeltaPanel.tsx (227 lines) shipped in commit 8a46160 (Phase 133) and renders testIDs equip-delta-<itemId>, equip-delta-stats/gained/lost, but no EquipDeltaPanel.test.tsx existed in components/inventory/ or its __tests__/ (it was exercised only indirectly via ItemCard.test.tsx); the larger glyphs.tsx/danger-art.tsx files are pure static SVG art
- suggested fix: Create components/inventory/EquipDeltaPanel.test.tsx covering isEmpty suppression, the three mode eyebrows, signed stat chips, the hasAny side gate, swap dual-side rendering, modifierText value-vs-bare, EffectTag named-tooltip-vs-anonymous with prefixes, and resourceLabel formatting, following the ItemCard render pattern
- source: audit
- issue: #444
- addressed: 2026-06-17 via commit c9d10a2
- fix: Added components/inventory/EquipDeltaPanel.test.tsx (10 hermetic cases) pinning the isEmpty whole-panel suppression, the equip/unequip/swap eyebrow mapping, signed +/- stat chips, the per-side hasAny gate (empty side renders nothing), swap dual-side rendering, modifierText (rolled-value `name (5)` vs. bare-id fallback), EffectTag (named via TooltipTarget tip vs. anonymous plain tag) with on-hit/on-defend prefixing, and resourceLabel signed formatting. Verify green (236 suites / 2490 tests, +10).

### [x] [6.0] StanceRow (level-up stat-allocation row) missing test coverage affecting level-up maintainability
- category: tests
- impact: 5
- ease: 8
- base-score: 4.0
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 6.0
- next: Add hermetic coverage for the newValue projection, the showDelta label-vs-waiting-bar branch, the canInc/canDec press gating (handler fires vs. undefined), the disabled accessibilityState/colour, and the per-stance testIDs, following the DerivedPreviewRibbon/AscendStrip render pattern
- observation: StanceRow (the per-stance ± allocation row inside the level-up modal — emblem, "newValue from current" counter, +N delta, and increment/decrement controls) derives `newValue = current + spent`, a `showDelta = spent > 0` gate that swaps the +N delta label for a waiting bar, gated press handlers (`onPress={canInc ? onInc : undefined}` / `canDec ? onDec : undefined`), disabled-state border/glyph colours and `accessibilityState={{ disabled }}`, and per-stance testIDs/accessibility labels, yet had no colocated test coverage
- evidence: components/levelup/StanceRow.tsx (160 lines) exports StanceRow and renders testID levelup-modal-row-<stance> with levelup-modal-inc/dec-<stance> controls, but was the only file in components/levelup/ absent from components/levelup/__tests__/ (siblings AscendStrip, DerivedPreviewRibbon, LearnSkillModal, LevelReadyStrip, LevelUpModal all carry colocated tests)
- suggested fix: Create components/levelup/__tests__/StanceRow.test.tsx covering the newValue counter, the showDelta vs waiting-bar branch, the inc/dec press gating (fires when enabled, no-op when disabled), the disabled accessibilityState, and the per-stance testIDs/labels, following the DerivedPreviewRibbon render pattern
- source: audit
- issue: #443
- addressed: 2026-06-17 via commit 5cd8c21
- fix: Added components/levelup/__tests__/StanceRow.test.tsx (13 hermetic cases) pinning the per-stance testIDs/labels (heart/body/mind row + inc/dec controls, uppercased label), the newValue = current + spent projection ("from current" subline), the showDelta = spent > 0 gate (delta label hidden at spent 0, "+N" shown otherwise), the inc/dec press gating (onInc/onDec fire exactly once when enabled, no-op when disabled), and the canInc/canDec disabled accessibilityState on both controls. Verify green (235 suites / 2480 tests, +13).

### [x] [7.2] useQuestLanding (quest-board cast choreography hook) missing test coverage affecting quest-board maintainability
- category: tests
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 7.2
- next: Add hermetic coverage with fake timers for the die-tumble face cycling, the modular-wrap walk path/step computation, the still→rolling→walking→arrived stage machine, the no-movement short-circuit, the targetPos/pathPositions preview, the revealed gate, the arrivalKey bump, and the VM-sync reset when phase leaves `space`
- observation: useQuestLanding (the presentation-only choreography that replays a resolved bone-die cast as tumble → walk the piece one space at a time → reveal the landing card) derives a tumbling `dieFace` cycled deterministically from `rollTick` (`(rollTick % 6) + 1`), a modular-wrap walk route (`steps = (to - from + length) % length`, `pathPositions` listing each step in order), a `still → rolling → walking → arrived` stage machine, a `targetPos`/`pathPositions` "where you're headed" preview, a `revealed` gate that opens the card only after the arrive beat, an `arrivalKey` flourish bump, and a VM-sync reset whenever the phase leaves `space` — all on flushable setTimeout/setInterval timers, yet had no colocated test coverage
- evidence: components/quest/useQuestLanding.ts (170 lines) exports useQuestLanding(vm) and QUEST_LANDING_TIMING; its file header (line 16) states "All timers are plain setTimeout/setInterval so tests can flush them deterministically," but the only test reference (state/e2e/quest.screen.test.tsx:17) imports QUEST_LANDING_TIMING alone — the hook's derivation logic was absent from any __tests__/ dir
- suggested fix: Create components/quest/__tests__/useQuestLanding.test.ts using renderHook + jest fake timers covering the tumble face cycle, the walk path/step computation (including modular wrap), the stage transitions, the steps===0 short-circuit, the targetPos/pathPositions preview, the revealed timing gate, the arrivalKey bump, and the phase-leaves-space reset, following the combat-mode.engine renderHook pattern
- source: audit
- issue: #441
- addressed: 2026-06-17 via commit 0254973
- fix: Added components/quest/__tests__/useQuestLanding.test.ts (11 hermetic cases, jest fake timers) pinning the idle VM-sync + lastRoll seed, the deterministic tumbling die-face cycle (rollTick % 6 + 1 including the wrap back to 1), the settle-to-real-face + route preview once tumbling ends, the modular-wrap walk path/step computation (including lapping the slipway: from=6 to=1 -> route 7,0,1), the still->rolling->walking->arrived stage machine, the steps===0 no-movement short-circuit (rolling straight to arrived), the revealed timing gate (card opens only after the arrive beat), the arrivalKey flourish bump (exactly once per landing), and the phase-leaves-space reset/re-sync to the VM. Verify green (2448 tests, +11).

### [x] [6.0] SatchelTray (gathering satchel tray) missing test coverage affecting gathering-minigame maintainability
- category: tests
- impact: 5
- ease: 8
- base-score: 4.0
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 6.0
- next: Add hermetic coverage for the per-family progress clamp, empty/set/at-risk derivation, SET-badge-vs-progress-text branch, the empty-vs-at-risk header copy, and the composed accessibility label, following the SpoilsOverlay/WrathMeter render pattern
- observation: SatchelTray (the four family stacks under the gathering site showing set-progress — everything in it is "at risk" until the player withdraws) derives a per-stack `progress = Math.min(1, vm.richness / vm.setThreshold)` clamp, an `empty = vm.pieces === 0` dim, a `vm.set` border/badge swap, a conditional SET-badge vs `richness/threshold` progress-text, an empty-vs-at-risk header subline, and a composed per-family accessibility label, yet had no colocated test coverage
- evidence: components/gathering/SatchelTray.tsx (104 lines) renders testID gathering-satchel with the THE SATCHEL header, four FamilyStack children carrying accessibilityLabel "<label>: <pieces> pieces, richness <richness> of <setThreshold>[, set complete]", but was absent from components/gathering/__tests__/
- suggested fix: Create components/gathering/__tests__/SatchelTray.test.tsx covering the progress clamp at/over threshold, the empty dim, the SET-badge vs progress-text branch, the empty-vs-at-risk header copy, and the per-family accessibility label, following the SpoilsOverlay/WrathMeter render pattern
- source: audit
- issue: #440
- addressed: 2026-06-17 via commit cdbaa53
- fix: Added components/gathering/__tests__/SatchelTray.test.tsx (9 hermetic cases) pinning the THE SATCHEL header mount, the empty-and-safe vs at-risk header subline, every family label + piece count (including the two zero-piece stacks), the SET badge for a completed family, the richness/threshold progress-text for unset families (single + duplicate 0/5 stacks), and the three accessibility-label branches (set-complete suffix / in-progress / empty). Verify green (2437 tests, +9).

### [x] [7.2] WrathMeter (gathering WRATH meter) missing test coverage affecting gathering-minigame maintainability
- category: tests
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 7.2
- next: Add hermetic coverage for the pure segmentColor helper plus the status-tag derivation, notch fired/unfired, grace colouring, and dynamic segment-count render branches
- observation: WrathMeter (the segmented WRATH bar under the gathering site's opening eye — shows the place's escalating answer as the meter fills, with threshold notches and surcharge status tags) contains a pure `segmentColor(index, vm, AXM)` helper that picks one of three fills by how many thresholds the index has passed, plus conditional sickled/mired/watcher/dusk tag rows, per-threshold fired-vs-unfired notch tinting, grace-active colouring, eye-open ratio colouring, and a `vm.max`-driven dynamic segment count, yet had no colocated test coverage
- evidence: components/gathering/WrathMeter.tsx (130 lines) renders testID gathering-wrath with the WRATH value/max label, an accessibilityLabel reporting value/dusk, threshold notches, and the four status tags (sickled/mired/watcher/dusk), but was absent from components/gathering/__tests__/
- suggested fix: Create components/gathering/__tests__/WrathMeter.test.tsx covering the segmentColor threshold bands, the four conditional status tags, notch fired/unfired, grace value colouring, and the dynamic segment count, following the SpoilsOverlay/PlotCard render pattern
- source: audit
- issue: #438
- addressed: 2026-06-17 via commit 09db862
- fix: Exported the pure segmentColor helper and added components/gathering/__tests__/WrathMeter.test.tsx (17 hermetic cases) pinning the four segmentColor threshold bands (unfilled / 0 / 1 / 2+ thresholds plus the cell-equals-position boundary), the WRATH value/max label, the accessibility label's dusk suffix, all four surcharge tags individually + all-at-once + the calm no-tags case, the grace value + note, and the omitted-tag-row case. Verify green (2428 tests, +17).

### [x] [6.75] QuestOverlays (quest-board minigame overlays) missing test coverage affecting quest-board maintainability
- category: tests
- impact: 6
- ease: 7.5
- base-score: 4.5
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 6.75
- next: Add hermetic coverage for the four overlays' conditional render branches plus each overlay's prop-callback fire
- observation: QuestOverlays (the quest-board minigame's board-reveal intro, open-space card, dusk flash, and outcome ledger — Phase 124) exports four overlays with many conditional branches (vow kept/broken/active marks, option enabled/disabled + disabledReason, result-vs-pending swap with rolls/chips/market-ledger gating, dusk collapsed-vs-normal copy, outcome stat row + vows-kept count), yet had no colocated test coverage
- evidence: components/quest/QuestOverlays.tsx (387 lines) exports QuestIntroOverlay/QuestSpaceOverlay/QuestDuskOverlay/QuestOutcomeOverlay (testIDs quest-intro/quest-begin, quest-space/quest-option-<id>/quest-result-rolls/quest-result-chips/quest-market-ledger/quest-continue, quest-dusk/quest-dawn, quest-outcome/quest-claim) but was absent from components/quest/__tests__/
- suggested fix: Create components/quest/__tests__/QuestOverlays.test.tsx covering all four overlays' conditional branches and the onBegin/onChoose/onContinue/onClaim fires, following the QuestLegend/QuestBoardTrack render pattern
- source: audit
- issue: #437
- addressed: 2026-06-17 via commit b189bab
- fix: Added components/quest/__tests__/QuestOverlays.test.tsx (22 hermetic cases) pinning intro story-beat/title/intro + per-status vow marks + satchel charms + onBegin; space-card pending branch (option rows, WALK ON hidden, onChoose with id, disabled option + reason, market-ledger show/omit); resolved branch (title/body swap, options hidden, roll faces show/omit, delta chips, onContinue); dusk normal-vs-collapsed copy + onContinue; outcome tier/copy/stat-row + vows-kept count + onClaim. Verify green (2411 tests, +22).

### [x] [7.0] QuestBoardTrack (quest-board minigame ring) missing test coverage affecting quest-board maintainability
- category: tests
- impact: 7
- ease: 9
- base-score: 6.3
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 9.45 (clamped per bias band; reported 7.0 band conservatively for a presentation+helper surface)
- next: Add hermetic coverage for the pure helpers (perimeterCells/ringDimensions/questKindAccents) plus the component's piece/target/path/well render branches
- observation: QuestBoardTrack (the ring of spaces drawn around the board's center well — core quest-board minigame surface from Phase 124) exports three pure geometry/accent helpers and renders the piece marker, destination flag, route borders, per-landing arrival flash, and center-well children, yet had no colocated test coverage
- evidence: components/quest/QuestBoardTrack.tsx (252 lines) exports perimeterCells(w,h), ringDimensions(count), questKindAccents(palette) and the QuestBoardTrack component (testIDs quest-board-track, quest-space-<i>, quest-piece, quest-target-<i>, quest-space-glow-<i>) but was absent from components/quest/__tests__/
- suggested fix: Create components/quest/__tests__/QuestBoardTrack.test.tsx covering the pure helpers and the component's conditional branches, following the QuestLegend/QuestHullMeter render pattern
- source: audit
- issue: #430
- addressed: 2026-06-16 via commit 2a33c6f
- fix: Added components/quest/__tests__/QuestBoardTrack.test.tsx (14 hermetic cases) pinning perimeterCells clockwise walk + exact ring-count + no-repeat, ringDimensions 5x5/min-3x3/grow-until-seated, questKindAccents full kind→palette-colour map, and the component's track frame + per-space cells, piece marker (isPiece default vs pieceIndex override), target flag show + hide-when-piece-on-target, per-space glow overlays, and center-well children. Verify green (2349 tests, +14).

### [x] [8.1] SpoilsOverlay (gathering spoils ledger) missing test coverage affecting gathering-minigame maintainability
- category: tests
- impact: 7
- ease: 8
- base-score: 5.6
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 8.4 (clamped per bias; reported 8.1 band)
- next: Add hermetic test coverage for SpoilsOverlay across kept/empty stacks, family totals + SET gating, refinements, round harvest, ledger notes, boons, and confirm
- observation: SpoilsOverlay ("THE WEIGHING" — the gathering-minigame spoils ledger shown after the outcome screen) is a core player-facing gameplay surface with many conditional branches (kept stacks vs empty-site note, four-family totals + SET badges, set refinements, round-harvest line, coin/vitae/scar/boon ledger notes, boons with done/failed verdicts, bind/walk-on confirm) yet had no colocated test coverage
- evidence: components/gathering/SpoilsOverlay.tsx (186 lines) renders keptStacks/empty-note, familyTotals + SET badge, refinements, roundHarvest, ledger notes, boons (done/failed marks), and a single Pressable confirm (testID gathering-spoils-confirm) firing onConfirm — but was absent from components/gathering/__tests__/
- suggested fix: Create components/gathering/__tests__/SpoilsOverlay.test.tsx covering all conditional branches and the confirm fire, following the PlotCard.test.tsx render pattern
- source: audit
- issue: #429
- addressed: 2026-06-16 via commit e2431c8
- fix: Added components/gathering/__tests__/SpoilsOverlay.test.tsx (20 hermetic cases) pinning header + confirm mount, kept-stack rows + lost-count suffix, empty-site note, four-family totals/ratios + SET-badge gating, refinement rows, round-harvest show/hide, coin/vitae/scar/boon ledger notes + ledger-block omission, boon done/failed verdict marks, confirm-label swap, onConfirm fires once, and the accessible-button role. Verify green (2335 tests).

### [x] [10.0] HazardRemoveGrid component missing test coverage affecting Hazard-deck maintainability
- category: tests
- impact: 8
- ease: 9
- base-score: 7.2
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 10.8 (clamped to 10.0)
- next: Add hermetic test coverage for HazardRemoveGrid covering selection, confirm gating, blocked-banner flow, and empty state
- observation: HazardRemoveGrid (Phase 126 remove-card grid overlay) is a core Hazard-deck gameplay component handling tap-to-select, confirm gating, the blocked-removal banner, and the empty-deck state, yet had no colocated test coverage
- evidence: components/hazard/HazardRemoveGrid.tsx (183 lines) manages local selection state, confirm enable/disable, the blocked-banner show/dismiss flow, copy-count pips, and accessibility labels but was absent from components/hazard/__tests__/
- suggested fix: Create components/hazard/__tests__/HazardRemoveGrid.test.tsx with select/deselect toggle, confirm gating + label swap, blocked-banner appearance + dismiss, empty-state copy, count-pip rendering, and accessibility-state coverage following established hazard component test patterns
- source: audit
- issue: #428
- addressed: 2026-06-16 via commit 4c75b5d
- fix: Added components/hazard/__tests__/HazardRemoveGrid.test.tsx (14 hermetic cases) pinning heading/prompt copy, per-entry tile rendering, close-button wiring, confirm gating + label swap, tile select/deselect accessibilityState + CUT badge, confirm fires the chosen card id, blocked-banner show/dismiss (no onConfirm write while blocked), copy-count pip + accessibility-label annotation, and empty-state copy with the confirm footer hidden.

### [x] [10.0] MapCanvas component missing test coverage affecting core exploration gameplay maintainability
- category: tests
- impact: 9
- ease: 9
- base-score: 8.1
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 12.15 (clamped to 10.0)
- next: Add comprehensive test coverage for MapCanvas component focusing on gesture handling, viewport centering, and node positioning
- observation: MapCanvas component at components/exploration/MapCanvas.tsx lacks test coverage despite being the core interactive map component for exploration navigation
- evidence: Component handles complex pinch/pan gestures and viewport management but missing from components/exploration/__tests__/ directory. Critical for player navigation between game areas.
- suggested fix: Create components/exploration/__tests__/MapCanvas.test.tsx with gesture simulation, viewport calculations, and node rendering tests following exploration component patterns
- source: audit
- issue: #416
- addressed: 2026-06-15 via commit b7882aa
- fix: Added comprehensive test coverage for MapCanvas component including basic rendering, viewport layout handling, node lookup validation, centering logic for focus nodes, gesture integration points, and children rendering following established exploration component test patterns.

### [x] [10.0] PlotCard component missing test coverage affecting gathering minigame maintainability  
- category: tests
- impact: 8
- ease: 9
- base-score: 7.2
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 10.8 (clamped to 10.0)
- next: Add comprehensive test coverage for PlotCard component with all three render modes and plot data variations
- observation: PlotCard component at components/gathering/PlotCard.tsx is a core gameplay component missing tests despite handling complex plot rendering with multiple modes
- evidence: Component renders gathering plots with family colors, trait indicators, and wrath costs but missing from components/gathering/__tests__/ directory
- suggested fix: Create components/gathering/__tests__/PlotCard.test.tsx covering spread/detail/preview modes, trait rendering, and wrath cost display following gathering component patterns
- source: audit
- issue: #417
- addressed: 2026-06-15 via commit 7a41373
- fix: Added comprehensive test coverage for PlotCard component including all three render modes (spread/detail/preview), family rendering across all families, trait display for various traits, yield/wrath cost display, edge cases, and accessibility features following established gathering component test patterns.

### [x] [10.0] GatheringOverlays component missing test coverage affecting minigame interaction maintainability
- category: tests
- impact: 8
- ease: 8.5  
- base-score: 6.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 10.2 (clamped to 10.0)
- next: Add comprehensive test coverage for GatheringOverlays component including modal states and overlay interactions
- observation: GatheringOverlays component at components/gathering/GatheringOverlays.tsx handles critical gathering game overlays but lacks test coverage
- evidence: Component manages complex overlay states for gathering minigame but missing from components/gathering/__tests__/ directory
- suggested fix: Create components/gathering/__tests__/GatheringOverlays.test.tsx with overlay state transitions and interaction testing following gathering component patterns
- source: audit
- issue: #425
- addressed: 2026-06-16 via commit 35ab5ae
- fix: Added 23 hermetic tests across the three exported overlays — ReprisalOverlay (eyebrow/eruption/veiled branches, detail call-out presence, onDone press), GatheringOutcomeOverlay (each tier word, CTA label + onContinue), and PlotDetailOverlay (keyword call-outs, TAKE/TEND label + accessibility branches, onTake/onClose press wiring).

### [x] [9.0] InventoryTabs component missing test coverage affecting item management maintainability
- category: tests
- impact: 8
- ease: 7.5
- base-score: 6.0  
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.5 (gameplay/content bias)
- final-score: 9.0
- issue: #426
- next: Add comprehensive test coverage for InventoryTabs component including tab switching and accessibility compliance
- observation: InventoryTabs component at components/inventory/InventoryTabs.tsx handles inventory category navigation but lacks test coverage
- evidence: Component manages tab state for satchel/equipment/burden categories but missing from components/inventory/__tests__/ directory
- suggested fix: Create components/inventory/__tests__/InventoryTabs.test.tsx with tab selection, state management, and accessibility testing following inventory component patterns
- source: audit
- addressed: 2026-06-16 — see commit below
- fix: Added 10 hermetic tests in components/inventory/__tests__/InventoryTabs.test.tsx covering per-row button/label rendering, onTabPress key delegation, active-tab accessibilityState, pluralized count accessibility labels (item/items), zero-count label omission, count-badge visibility gating, dimmed-state render + pointerEvents-none press blocking, and the empty tab-list branch.

### [x] [7.2] Art components directory entirely missing test coverage affecting visual consistency
- category: tests  
- impact: 8
- ease: 9
- base-score: 7.2
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to art components)
- final-score: 7.2
- next: Add test coverage for all art components including Filigree, PlayerPortrait, TitleEmblem, and VictoryWreath
- observation: Components art directory at components/art/ has no __tests__ directory, leaving 4 visual components untested
- evidence: Filigree.tsx, PlayerPortrait.tsx, TitleEmblem.tsx, and VictoryWreath.tsx all lack test coverage despite being used across multiple screens
- suggested fix: Create components/art/__tests__/ directory with comprehensive rendering tests for all art components following established component test patterns
- source: audit
- issue: #427
- addressed: 2026-06-16 via commit 4b66fbb
- fix: Added components/art/__tests__/art-components.test.tsx (17 hermetic cases) pinning FiligreeRule/PlayerPortrait/TitleEmblem/VictoryWreath default + explicit dimensions, fixed viewBoxes, decorative-vs-labelled a11y posture, the 24-tick astrolabe ring count, and theme-aware colour forwarding (ARGB int-payload assertions).

### [x] [5.6] NodeGrid component missing test coverage affecting exploration maintainability
- category: tests
- impact: 7
- ease: 8
- base-score: 5.6
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 5.6
- next: Add hermetic test for NodeGrid component following existing exploration component test patterns
- observation: NodeGrid component at components/exploration/NodeGrid.tsx lacks test coverage despite being core to exploration navigation
- evidence: Component renders exploration nodes for player navigation but missing from components/exploration/__tests__/ directory
- suggested fix: Create components/exploration/__tests__/NodeGrid.test.tsx with node rendering and interaction testing
- source: audit
- issue: #410
- addressed: 2026-06-15 via commit 8078435
- fix: Added comprehensive test coverage for NodeGrid component including node rendering, empty state handling, onNodePress delegation, labeled node ID propagation, and available vs locked node behavior validation following established exploration component test patterns.

### [x] [5.6] ItemGrid component missing test coverage affecting inventory maintainability
- category: tests
- impact: 7
- ease: 8
- base-score: 5.6
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 5.6
- next: Add hermetic test for ItemGrid component following existing inventory component test patterns
- observation: ItemGrid component at components/inventory/ItemGrid.tsx lacks test coverage despite being core to inventory display
- evidence: Component handles inventory item rendering and categorization but missing from components/inventory/__tests__/ directory
- suggested fix: Create components/inventory/__tests__/ItemGrid.test.tsx following ItemCard test pattern with item rendering and categorization testing
- source: audit
- issue: #414
- addressed: 2026-06-15 via commit 6a3416c
- fix: Added comprehensive test coverage for ItemGrid component including empty state handling, category grouping and rendering, item delegation to ItemCard, scroll behavior, handler propagation, expansion state management, and accessibility props following established inventory test patterns.

### [x] [3.0] Engine version inconsistency in plan/bearings.md documentation
- category: external-critique
- impact: 6
- ease: 10
- base-score: 6.0
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 0.5 (external-critique down-weight)
- final-score: 3.0
- next: Update plan/bearings.md lines 62 and 79 to reflect current engine version ^0.21.0
- observation: plan/bearings.md still references stale engine version ^0.20.0 in two places while package.json shows ^0.21.0
- evidence: Line 62: '| Engine | `axiomancer-mechanics` npm package (pinned ^0.20.0)' and line 79: 'Pinned **exact** (currently `^0.20.0`)' vs package.json line 41: '"axiomancer-mechanics": "^0.21.0"'
- suggested fix: Update bearings.md lines 62 and 79 from ^0.20.0 to ^0.21.0 to match actual package version
- source: audit
- issue: #407
- addressed: 2026-06-14 via commit 00d8c70
- fix: Updated plan/bearings.md lines 62 and 79 from ^0.20.0 to ^0.21.0 to match actual package.json engine version, resolving documentation consistency issue for maintainer setup.

### [x] [2.4] Missing test coverage for DebugEncounterButtons component
- category: tests
- impact: 4
- ease: 6
- base-score: 2.4
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 2.4
- next: Add hermetic test for DebugEncounterButtons component following existing debug component test patterns
- observation: DebugEncounterButtons component at components/DebugEncounterButtons.tsx lacks test coverage
- evidence: Component missing from components/__tests__/ directory; other debug components have test coverage
- suggested fix: Create components/__tests__/DebugEncounterButtons.test.tsx following existing debug component test patterns
- source: audit
- issue: #408
- addressed: 2026-06-14 via commit 07de432
- fix: Added comprehensive test coverage for DebugEncounterButtons component including DEV gate functionality, action routing for quest/rest/cache encounters, and accessibility compliance following established debug component test patterns.

### [x] [2.0] Missing test coverage for DebugHazardButton component
- category: tests
- impact: 4
- ease: 5
- base-score: 2.0
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 2.0
- next: Add hermetic test for DebugHazardButton component following existing debug component test patterns
- observation: DebugHazardButton component at components/DebugHazardButton.tsx lacks test coverage
- evidence: Component missing from components/__tests__/ directory
- suggested fix: Create components/__tests__/DebugHazardButton.test.tsx following existing debug component test patterns
- source: audit
- issue: #409
- addressed: 2026-06-14 via commit 76172e5
- fix: Added comprehensive test coverage for DebugHazardButton component including DEV gate functionality, action routing for hazard session creation, and accessibility compliance following established debug component test patterns.

### [x] [1.5] SVG_ASSET_SPEC.md unclear guidance for new maintainers
- category: external-critique
- impact: 6
- ease: 5
- base-score: 3.0
- user-source-bump: 0.0 (external source)
- bias-multiplier: 0.5 (external-critique down-weight)
- final-score: 1.5
- next: Add clear trigger conditions for when asset replacement becomes relevant
- observation: SVG_ASSET_SPEC.md opens with warning for fresh maintainers but then provides complex asset replacement workflow without clear entry point for when this becomes relevant
- evidence: Lines 5-12 warn fresh maintainers they 'likely don't need this file yet' but no guidance on when they WOULD need it or how to know when asset replacement phase begins
- suggested fix: Add clear trigger conditions like 'Start using this when Spec 11 (asset pipeline) is ready to implement'
- source: external-critique
- addressed: 2026-06-15 via commit 4a7e671
- fix: Added clear trigger condition "Start using this when Spec 11 (asset pipeline) is ready to implement" to help fresh maintainers understand when the asset specification becomes relevant for their workflow.

### [x] [2.8] Setup guide references missing setup runbooks creating broken navigation
- category: external-critique
- impact: 8
- ease: 7
- base-score: 5.6
- user-source-bump: 0.0 (external source)
- bias-multiplier: 0.5 (external-critique down-weight)
- final-score: 2.8
- next: Add clear 'TODO' or 'Coming Soon' annotations to setup guide references until runbooks are authored
- observation: Setup guide references missing setup runbooks that are explicitly not authored yet, creating broken navigation paths for new maintainers
- evidence: Lines 232-234 reference setup/02_eas.md, setup/03_store_setup.md, setup/04_claude_playtest.md but plan/bearings.md line 82-84 states 'The `setup/NN_*.md` runbooks are not yet authored'
- suggested fix: Add clear 'TODO' or 'Coming Soon' annotations to setup guide references until runbooks are authored
- source: external-critique
- issue: #404
- addressed: 2026-06-14 via commit e253c8d
- fix: Added clear "Coming Soon" annotations to setup guide references (lines 232-234) for setup/02_eas.md, setup/03_store_setup.md, and setup/04_claude_playtest.md until runbooks are authored.

### [x] [4.8] GatheringGate component missing test coverage affecting navigation maintainability
- category: tests  
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 4.8
- next: Add hermetic test for GatheringGate component following existing gate test patterns
- observation: GatheringGate component at components/GatheringGate.tsx lacks test coverage despite being a critical navigation component
- evidence: Component missing from components/__tests__/ directory; other gate components (EventGate) have test coverage  
- suggested fix: Create components/__tests__/GatheringGate.test.tsx following EventGate test pattern with useGameState and router.push mocking
- source: audit
- issue: [mirror-failed: 2026-06-14T00:00:00.000Z]
- addressed: 2026-06-14 via commit eb17d4f
- fix: Added comprehensive test coverage for GatheringGate component including no session, active at mount, state flip, no re-push, and side-effect-only behavior following EventGate test pattern with useGameState and router.push mocking.

### [x] [4.8] RestGate component missing test coverage affecting navigation maintainability  
- category: tests
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 4.8
- next: Add hermetic test for RestGate component following existing gate test patterns
- observation: RestGate component at components/RestGate.tsx lacks test coverage despite being a critical navigation component
- evidence: Component missing from components/__tests__/ directory
- suggested fix: Create components/__tests__/RestGate.test.tsx following EventGate test pattern
- source: audit
- addressed: 2026-06-14 via commit 4cbb39f
- fix: Added comprehensive test coverage for RestGate component including no session, active at mount, state flip, no re-push, and side-effect-only behavior following EventGate test pattern with useGameState and router.push mocking.

### [x] [4.8] QuestGate component missing test coverage affecting navigation maintainability
- category: tests
- impact: 6  
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 4.8
- next: Add hermetic test for QuestGate component following existing gate test patterns
- observation: QuestGate component at components/QuestGate.tsx lacks test coverage despite being a critical navigation component
- evidence: Component missing from components/__tests__/ directory
- suggested fix: Create components/__tests__/QuestGate.test.tsx following EventGate test pattern
- source: audit
- issue: #402
- addressed: 2026-06-14 via commit 73ecab4
- fix: Added comprehensive test coverage for QuestGate component including no session, active at mount, state flip, no re-push, and side-effect-only behavior following EventGate test pattern with useGameState and router.push mocking.

### [x] [4.8] HazardGate component missing test coverage affecting navigation maintainability
- category: tests
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (audit source) 
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 4.8
- next: Add hermetic test for HazardGate component following existing gate test patterns
- observation: HazardGate component at components/HazardGate.tsx lacks test coverage despite being a critical navigation component
- evidence: Component missing from components/__tests__/ directory
- suggested fix: Create components/__tests__/HazardGate.test.tsx following EventGate test pattern
- source: audit
- issue: #403
- addressed: 2026-06-14 via commit c769fc1
- fix: Added comprehensive test coverage for HazardGate component including no session, active at mount, state flip, no re-push, and side-effect-only behavior following EventGate test pattern with useGameState and router.push mocking.

### [x] [2.7] Engine version mismatch between documentation and package.json affecting maintainer setup
- category: external-critique
- impact: 6
- ease: 9
- base-score: 5.4
- user-source-bump: 0.0 (external source)
- bias-multiplier: 0.5 (external-critique down-weight)
- final-score: 2.7
- next: Update README.md line 233 to reflect actual engine version ^0.21.0
- observation: README.md has conflicting information about engine version - states 'axiomancer-mechanics ^0.20.0' in AI workflow section but package.json shows ^0.21.0
- evidence: Line 233: 'Current engine version: `axiomancer-mechanics ^0.20.0`' vs package.json line 41: 'axiomancer-mechanics': '^0.21.0'
- suggested fix: Update README.md line 233 to reflect actual engine version ^0.21.0
- source: external-critique
- issue: #406
- addressed: 2026-06-14 via commit 2da4282
- fix: Updated README.md line 233 from 'axiomancer-mechanics ^0.20.0' to '^0.21.0' to match package.json engine version, resolving documentation consistency issue for maintainer setup.

### [x] [2.8] DebugGatheringButton component missing test coverage affecting debug maintainability
- category: tests
- impact: 4
- ease: 7
- base-score: 2.8
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 2.8
- next: Add hermetic test for DebugGatheringButton component following existing debug component test patterns  
- observation: DebugGatheringButton component at components/DebugGatheringButton.tsx lacks test coverage
- evidence: Component missing from components/__tests__/ directory while other debug components have coverage
- suggested fix: Create components/__tests__/DebugGatheringButton.test.tsx following DebugCombatButton test pattern
- source: audit
- issue: #405
- addressed: 2026-06-14 via commit df774ec
- fix: Added comprehensive test coverage for DebugGatheringButton component including dev gate functionality, action routing for both normal and tutorial gathering modes, and accessibility compliance following established debug component test patterns.

## Historical findings (addressed)

### [x] [2.8] Vision document voice inconsistency between archaic and technical language (external critique HIGH)
- category: external-critique
- impact: 8
- ease: 7
- base-score: 5.6
- user-source-bump: 0.0 (external source)
- bias-multiplier: 0.5 (external-critique down-weight)
- final-score: 2.8
- next: Maintain consistent archaic voice throughout vision document or clearly separate technical implementation details
- observation: Vision document uses inconsistent voice between archaic game language and modern technical language within same sections
- evidence: Lines 42-66 mix archaic terms like 'Befriend' and 'friendship counters' with modern technical language like 'modal when the engine emits the state' and 'status effect whose only purpose is qualifying future Befriend paths'
- suggested fix: Maintain consistent archaic voice throughout vision document or clearly separate technical implementation details from game vision
- source: external-critique
- issue: #396
- addressed: 2026-06-14 via commit 4c54c1f
- fix: Replaced modern technical terminology with game-oriented language in friendship/mercy section while preserving implementation clarity. Changed 'modal when engine emits state' to 'choice when moment arises', 'status effect' to 'condition', and other technical phrases to maintain voice consistency throughout the document.

### [x] [4.2] EquipmentDock component missing test coverage affecting inventory maintainability
- category: tests
- impact: 6
- ease: 7
- base-score: 4.2
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0 (no bias applied to tests category)
- final-score: 4.2
- next: Add hermetic test for EquipmentDock component following existing inventory component test patterns
- observation: EquipmentDock component at components/inventory/EquipmentDock.tsx lacks test coverage despite being a core inventory component
- evidence: Component missing from components/inventory/__tests__/ directory; ItemCard and other inventory components have comprehensive test coverage
- suggested fix: Create components/inventory/__tests__/EquipmentDock.test.tsx following ItemCard test pattern with equipment rendering and interaction testing
- source: audit
- addressed: 2026-06-13 via commit 925a8c3
- fix: Added comprehensive test coverage for EquipmentDock component including equipment rendering, empty state display, and equip action integration following established inventory test patterns.