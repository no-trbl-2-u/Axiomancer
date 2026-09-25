# Bearings history — 2026

> Verbatim text moved out of `plan/bearings.md` § "Decisions standing
> for the autonomous loop" (and one stale Stack note) by TRIM THE FAT
> phase T4, 2026-09-25 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 2).
> Each block is the pre-T4 wording of the passage named in its heading,
> copied unchanged from `plan/bearings.md` at the T4 base commit. The
> current ruling stays in bearings; nothing here is binding unless
> bearings still says it. Line numbers are pre-T4 bearings lines.

## Stack — Expo decouple exception, first paragraph (pre-T4 wording) (was line 81)

> **Exception (2026-08-08): the Expo rows are now scheduled to change.**
> T lifted the "not now" on the Expo decouple; **Phase 47** re-platforms
> the mobile framework and CI/CD rows (`expo-router`, `expo-image`,
> `expo-font`, `expo-haptics`, `expo-constants`, `expo-linking`,
> `expo-splash-screen`, `expo-status-bar`, `expo-navigation-bar`, the
> `jest-expo` preset, `expo lint`, and the EAS deploy path). Reanimated 4
> / gesture-handler / rn-svg / screens / safe-area-context are bare-RN
> and carry over unchanged. Do not pre-emptively drift off Expo before
> that phase — the rows below stay authoritative until it lands.

## THE UNSHACKLING, items 1-3 (pre-T4 wording, with the Phase 41/42/44 execution narrative) (was line 315)

  1. **The strike is alive.** Cards MAY deal raw enemy-HP damage. Spec 32
     v3 §1/§12's no-strike law and the status-dominance balance doctrine
     are retired for combat. The enforcing witness
     (`Cards/e2e/doctrine-strike-dead.engine.test.ts`) and spec 32's
     FREE-line "never damage" law come down in **Phase 41**.
  2. **`/deck-tuning` has full card authority** — no sandbox-first
     quarantine, no byte-identity law, no recolor-not-repartition rule,
     no per-change owner ballot, no `[needs-user-call]` on recolors or
     new cards. Anything about any card is fair game — **bounded only by
     the LOCKED MECHANICS carve-out below**: cards may do anything to
     Conviction, the Surge meter and the Dice system except make them
     irrelevant.
  3. **Philosophy theming is retired** as the organising fiction.
     **RATIFIED the same day — the replacement is "a Dark Fantasy
     deckbuilding RPG campaign", WHOLE PRODUCT.** T's framing:
     *"It's looser, not that different from what we already have, and
     should be an easy pivot while opening up A LOT of doors for us."*
     Read "looser" as the governing constraint: this is a re-skin plus
     permission, **not** a ground-up redesign — engine mechanics, keyword
     *behavior*, the dice model and the minigame doctrines all survive.
     **Phase 42** authored the bible (`specs/34-dark-fantasy-campaign.md`)
     and **Phases 44a-44i** executed it across cards, keywords, themes,
     enemies, world, story, morality and the product shell — **all
     shipped as of 2026-08-22, so the "until 42 is ratified, do not
     improvise flavor" gate is SATISFIED and lifted**. Dark-fantasy
     flavor is authorable; the retheme map + lexicon lint (Phase 44a)
     remain the guardrails. Keywords that already read dark
     fantasy (POISON, BLEED, MARK, DOOM, THORNS, GUARD, RIPOSTE) are
     expected to survive unchanged; renaming what already works is churn.

## Direct pushes to main (pre-T4 wording, with the remote-session ambiguity narrative) (was line 349)

- **Direct pushes to `main` are sanctioned from ANY session, including
  remote/web ones** (T direct, 2026-08-08: *"Direct pushes to main are
  fine, keep going."*). Settles a standing ambiguity: remote Claude Code
  sessions are told by their harness to develop on a `claude/*` branch
  and open a PR, which conflicted with `skills/oversight.md` §6 and with
  "Loop pushes to trunk (`main`) directly" below. T's ruling is the
  explicit permission that resolves it — **no branch or PR is required**,
  and the AUDIT row that asked for a "remote-session delivery" note in
  the skill is drained as no-change-needed. Branch + PR remains available
  and is still the better choice when a change genuinely wants review
  before landing (large or risky diffs, anything a human should read
  first); it is simply no longer mandatory. Everything else is unchanged:
  the verify gate still runs pre-commit, the deploy gate still runs
  post-push, and no force-push or destructive git op is permitted.

## THE PIPELINE LIBERATION, preamble + items 1-4 (pre-T4 wording, with provenance narrative, lifted-ruling rationale and the stale count-pin list) (was line 363)

- **THE PIPELINE LIBERATION (T direct, remote session 2026-08-22) —
  every content pipeline is open to the loop.** Provenance: T
  commissioned a full content-pipelines audit
  (`docs/reports/content-pipelines-audit-2026-08-22.md`, PR #228) with
  the framing *"New/revamp cards, New keywords/effects, new narration
  content, New art, new everything. I want to make sure my nexus loop
  has the freedoms and capabilities it needs"*, then answered the
  audit's findings with *"what do you need from me to free up ALL
  these pipelines? Try to do it yourself first"*. Under the
  source-of-truth hierarchy that is T's latest explicit decision, and
  it rules the following:
  1. **The transitional-library ruling is LIFTED.** The 2026-08-08
     "do not tune" order named the 86-card library; that library was
     replaced by the 57-card Profane Canon the same day and Phase 43
     shipped CQI, so the ruling's rationale expired. `/deck-tuning`'s
     full card authority is live again against the current library:
     balance findings are work, replacement cards may be authored,
     tuning passes may open. (The historical ruling text is preserved
     below, marked superseded.)
  2. **Keyword and effect growth is open.** The 30-keyword proving
     gate no longer blocks new keywords: a new keyword or a new
     `specialMechanics` kind may ship WITHOUT a per-item owner
     ratification, provided it ships through the FULL wiring
     checklist (engine + pricing + display + mobile
     keyword-registry/gloss + card-editor union + keyword-atlas row +
     `docs/retheme-map.json` naming registry), with a hermetic e2e
     and the cross-package verifies. Engineering rigour is the gate
     now, not the count. Keyword retirement stays deliberate
     (retired ids never renamed or resurrected).
  3. **New content items are in scope for every content surface** —
     enemies, maps, continents, MapEvent kinds, hazard cards,
     gathering sites, loot-cache layers, quest boards, dialogue
     trees, narration. The tuning commands' "numeric-only /
     propose-only" walls on NEW CONTENT ITEMS are lifted; their walls
     on ENGINE STRUCTURE (dispatchers, resolution control flow,
     engine constants) remain. A new persisted kind or state field
     still rides `GAME_STATE_VERSION` with a migration hop and a
     pinned migration test — that discipline is engineering, not
     design law, and stands.
  4. **Count pins are growth ledgers, not walls.** The pinned totals
     (57 cards, 52 enemies, 42 glossary entries, the `addedIn` stamp,
     and their kin) exist to make growth DELIBERATE: a content add
     updates its pins in the same commit, citing this ruling in the
     commit body. Editing a pin without a content change alongside it
     remains forbidden.

## THE CURRENT CARD LIBRARY IS TRANSITIONAL (superseded 2026-08-22; full entry) (was line 459)

- ~~**THE CURRENT CARD LIBRARY IS TRANSITIONAL — do not spend tuning
  effort on it**~~ **— SUPERSEDED by THE PIPELINE LIBERATION above
  (2026-08-22); preserved for history.** (T direct, /oversight
  2026-08-08). Asked to rule on
  Phase 39's two open findings, T answered: *"This is fine. We're
  working on a new card redesign anyway."* Standing consequences
  (all now historical):
  1. **A card redesign is in flight.** Its scope was not specified to the
     loop, and the loop must NOT assume it is the same thing as Phase
     44c (the retheme, which changes names and faces). "Redesign" reads
     mechanical. If a tick needs to know, ask at the next `/oversight`
     — do not infer, and do not start it.
  2. **Balance findings against the present 86-card library are
     information, not work.** File them; do not promote phases off them,
     do not open `/deck-tuning` passes to chase them, and do not author
     replacement cards to patch measured regressions. Foundry's
     73%→44% early-stage regression is the worked example: real, filed,
     and deliberately not fixed.
  3. **This does not silence measurement.** `/digest` may keep reading
     baselines; it simply must not spawn tuning work off them until the
     redesign lands and **Phase 43** provides a live objective function.
  4. **Not a licence to skip the retheme phases.** 44a-44i still run —
     they are thematic and structural, not balance work.

## THE LONGER LEASH, closing sentence (pre-T4 wording: "questions T has not yet answered") (was line 508)

  rails. Folded into spec 34 as §2.5.9 (Phase 74 / N-1); full text and
  the five open questions T has not yet answered (retcon boundary,
  sequencing, the shell, reference calibration, the Surge meter) live in
  `plan/north-star-mork-borg.md` §6.

## THE OPEN GATE, provenance lines after the first quote (pre-T4 wording) (was line 518)

  And, in the same session, on being asked nothing: *"don't ask any
  questions in order to move forward ... It spits in the face of
  EXACTLY what I'm asking you to do."* The same message commissioned
  the content pipeline outright ("new enemies, new cards, new
  everything ... NEW CONTINENTS, NEW MAPS!") and a UI cleanup of every
  screen. Under the source-of-truth hierarchy this is T's latest
  explicit decision and it rules:

## LOCKED MECHANICS, item 3 anchors (pre-T4 wording) (was line 595)

  3. **The Dice mechanics system** — `Combat/dice.ts`,
     `Combat/combat.dice.ts`, `Combat/combat.upgradeable-dice.ts`,
     `DEFAULT_DIE_GEAR` / `activeDieGear`, the HONE/TEMPER die-gear
     economy, and the Upgradeable-Dice model that D-FLIP made the default
     (legacy dice stays as the explicit comparison mode). Spec 33.

## THE BLANK PAGE, item 1 (pre-T4 wording) (was line 621)

  1. **No canon exists.** No arc, no premise, no ending, no theme, no
     canonical characters, no world-story. `content/story/story-bible.md`
     (THE TALLY, written and cleared the same day) and
     `specs/world/W-02-the-capital-payoff.md` are deleted, following the
     2026-09-17 removal of `story-overview.md`, `specs/story/S-01`,
     `S-02` and `specs/characters/C-01`. Recoverable from git; **none is
     a draft to return to.**

## THE BLANK PAGE, items 6-7 (pre-T4 wording, with how the road was built) (was line 656)

  6. **How it ends — and it has ended, for ¶1.** A new overview got built
     from nothing, event by event, in an attended session per
     `plan/2026-09-17-story-outline.prompt.md`.
     `axiomancer-mechanics/content/story/story-overview.md` exists as of
     2026-09-18, so **¶1 is lifted**: canon exists again, and it is
     whatever that file says — nothing more. ¶2 (the player is X, amended
     2026-09-24 above), ¶3 (shipped content is not canon), ¶4 (the loop
     does not invent canon beyond the overview) and ¶5 stand. A fact the
     overview does not cover does not exist, and the loop still says so
     and stops rather than filling the gap.
  7. **The road became a top-down document (T, attended 2026-09-23/24).**
     T replaced the event-by-event road with an over-arching story
     document, clean slate: numbered rulings, T's prologue, a per-map
     place-and-theme table, and ordered open questions. The 2026-09-18
     road is recoverable at `5089f43` and is not a draft to return to.
     `plan/2026-09-17-story-outline.prompt.md`'s one-event-per-turn method
     is superseded; the overview grows in attended sessions with T.

## THE GROWTH FLOOR, provenance (pre-T4 wording, with the telemetry measurement) (was line 678)

  growth mandate gets guaranteed tick budget, and stewards ship small
  gaps instead of filing them.** THE OPEN GATE ¶8 made growth a standing
  mandate; measurement three weeks on showed the mandate had no tick
  budget to spend. Across the logged telemetry window the `adjust-*`
  family was dispatched 34 times and `/forge` once, and `/forge` shipped
  nothing in 30 days. Cause: `/march` Step 3 is first-match-wins, and
  3b's "or more than 36 hours ago" clause re-ripens one of five
  categories faster than the loop ticks, so 3c is almost never reached.
  T's ruling on being shown that:

## Balance doctrines (pre-T4 wording, with the CQI line and the struck minigame doctrines) (was line 711)

- **Balance doctrines (per encounter):** ~~status-effect play is
  the dominant win path (combat)~~ — **VOID for combat via the
  unshackling above; Phase 43 SHIPPED the replacement objective
  function (CQI, spec 35) on 2026-08-08 — combat readings now judge
  against CQI, not the dead status-dominance law.** Still live for the
  minigames:
  ~~Gathering greed < restraint <
  skill~~ — **VOID, Phase 76 retired the Gathering minigame**;
  ~~Loot-cache informed > blind > coward~~ — **VOID, Phase 63
  retired the Pick Pool minigame (the loot cache is a three-way
  one-shot choice now)**; ~~Quest Board
  naive-finishes / deliberate-finishes-well~~ — **VOID, Phase 61
  retired the Quest Board minigame**; ~~Rest
  meagre-but-never-lethal (posture gradient)~~ — **VOID, Phase 52e
  retired the minigame (the rest-choice node replacing it is a
  one-shot player pick, not a tuned balance curve)**; Hazard -> CDR-0006
  targets.
