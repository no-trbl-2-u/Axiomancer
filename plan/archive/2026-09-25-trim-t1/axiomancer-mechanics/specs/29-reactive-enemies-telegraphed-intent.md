> **Status:** HISTORICAL — archived 2026-09-25 by TRIM THE FAT T1 (`plan/2026-09-25-trim-the-fat.spec.md` Tier 1 docs). Original path: `axiomancer-mechanics/specs/29-reactive-enemies-telegraphed-intent.md`. Describes removed or never-built code; not a source of rules.

# Spec 29 — Reactive Enemies + Telegraphed Intent

> **Status:** Superseded (partially shipped) — 2026-07-17. This draft predates
> the VITAE/HP-funnel architecture (it cites `CombatThreatPhase`'s old
> `pressureTracks`/`dotThreshold` model, removed from the codebase entirely).
> §4 Q1/Q3/Q4's recommended shape shipped under different names: the
> **reactive verb** is WS9's `CombatThreatPhase.branch` (spec 32 §12 item 7,
> ratified 2026-07-11) — a condition + fully-resolved `then`/`else` fork,
> committed at phase START, zero RNG, telegraphed (both outcomes shown
> pre-commit). Q4's guardrail (foreseeable, a fraction not all) is enforced by
> the shipped `enemyCleanse` hook. Phase 33a
> (`plan/phases/phase_33a_reactive_verb_core.md`) added two more counterplay
> hooks in the same shape: `swayCleanse` / `premiseShed`. **Still open** from
> §4's candidate set: Harden and Enrage abilities (Q1), Adapt-stance beyond
> what an authored branch fork's `enemyStance` already does, and telegraph
> presentation richer than the current condition+both-outcomes text (variable
> magnitude / rung-count — tracked as Phase 33b "variable-rung telegraphs").
> Do not re-implement the branch/cleanse mechanism from this doc's §Proposed
> approach — read `combat.encounter.types.ts`'s `CombatThreatBranch`/
> `CombatThreatEffect` and `combat.engine.ts`'s `resolveThreatPhase` instead.
> **Depends on:** Spec 25 (Hazard-Pattern Combat) · Spec 07 (enemy content & AI).
> **Theme inspiration:** Slay the Spire's *intents* (the enemy telegraphs its next move and you adapt) + Mage Knight creatures (resistances/fortifications you must answer). Into the Breach: a board-state dialogue, not a static puzzle.

## Goal

Turn the enemy threat sequence from a *passive accumulator* into a **reactive
opponent**: phases that telegraph and then respond to the player's strategy —
cleansing stacked DoT, hardening the track being raced, or enraging as a track
nears threshold — all shown in the threat timeline so the player must adapt
(switch tracks, race the cleanse, spend before the harden). This is the dynamic
counterplay both reference games are built on.

## Why now / dependencies

- **Unblocks:** the "static puzzle" risk. In Spec 25 the enemy only accumulates
  and fires a *fixed* threat action if a phase is Overwhelmed — it never reacts
  to *how* the player is winning. The diagnostic (status wins in ~2 flat phases)
  shows fights resolve before any real adaptation is demanded.
- **Depends on:** Spec 25's `CombatThreatPhase` / `CombatThreatAction` /
  `resolveThreatPhase` (`combat.threat.ts`, `combat.engine.ts`), the effects
  engine (`applyEffect`, `tickAllEffects`), and the full-information timeline UI.

## Current state

- `CombatThreatPhase` = `{ enemyStance, threatAction, dotPressureRequired,
  controlPressureRequired, isFinalPhase }`. `threatAction.effects` only ever
  *damage/debuff the player* on an Overwhelmed phase. There is **no enemy
  reaction to the player's tracks or effects** — no cleanse, no harden, no
  enrage, no intent that changes based on board state.
- The timeline is full-information but **static** — every phase is known and
  unchanging at combat start.
- The effects engine already supports cleanse/dispel (`applyCleanse`,
  `applyDispel`) — the primitives for an enemy "shake off DoT" exist.

## Open questions

1. **Which reactive abilities ship first?** Candidate set: **Cleanse** (remove N
   DoT stacks / the highest DoT), **Harden** (raise the threshold of the track
   the player is ahead on, mid-combat), **Enrage** (a between-phase escalation
   when a track crosses X% of threshold), **Adapt-stance** (shift `enemyStance`
   to disadvantage the player's dominant card colour). Which 2–3 for v1?
   > Your answer:

2. **Telegraph timing.** Slay the Spire shows the *next* intent before you act.
   Should each phase show its reactive intent at the start of the phase (so the
   player plays around it this phase), or one phase ahead? How is a *conditional*
   reaction ("cleanses IF dot > control") shown legibly?
   > Your answer:

3. **Reaction trigger model.** Are reactions (a) authored per phase
   (`reactiveAction?` on `CombatThreatPhase`), (b) global per enemy (a
   `reactions: EnemyReaction[]` with predicates over the tracks/effects), or
   (c) both? Recommended: (a) for authored bosses + (b) for a small default set
   so every enemy gets *some* counterplay.
   > Your answer:

4. **Does this break the "status is the only win path" doctrine?** A cleanse that
   wipes DoT could make the DoT path frustrating. Guardrail: cleanse must be
   *foreseeable and beatable* (telegraphed, on a cooldown, removes a fraction not
   all), and the Control path stays open as the answer. Confirm the guardrail.
   > Your answer:

5. **Befriendable enemies.** Should a befriendable enemy's reactions be *softer*
   (it hesitates, doesn't enrage) to keep the mercy/Control path inviting, per
   their `befriendabilityConfig`?
   > Your answer:

6. **Authoring scope.** Spec 25 shipped 7 authored threat sequences. Do all of
   them get reactions now, or just bosses (coastal-tyrant, the-disagreement),
   with the default reaction set covering the rest?
   > Your answer:

## Proposed approach

1. Extend `CombatThreatPhase` with `reactiveAction?: CombatReaction` and/or add
   `Enemy.combatReactions?: EnemyReaction[]` (predicate over `pressureTracks` /
   enemy effects → an action). Pure data; the engine interprets it.
2. In `resolveThreatPhase` / `processBetweenPhases` (`combat.engine.ts`),
   evaluate reactions after the threat action: Cleanse via `applyCleanse`/
   `applyDispel` on the enemy; Harden by bumping the live `dotThreshold` /
   `controlThreshold` (or per-phase requirement); Enrage as a between-phase
   escalation; Adapt-stance by mutating the upcoming phase's `enemyStance`. Emit
   `{ kind: 'enemy-reacted', reaction, detail }` events.
3. Telegraph: the threat-timeline view model (`combat.threat`/presenter) exposes
   each phase's reactive intent + condition; mobile renders an intent chip on the
   current/next phase.
4. Author reactions for the boss sequences in `combat.threat.ts`; add a default
   reaction set for unauthored enemies. Keep befriendable enemies soft (§4 Q5).
5. `/combat-tuning`: reaction magnitudes (cleanse fraction, harden amount, enrage
   threshold) become tunable; the sim grows a policy that reacts to reactions.

## Acceptance checklist

- [ ] All §4 questions answered.
- [ ] At least 2 reactive abilities work, are telegraphed in the timeline, and
      fire on their conditions; the player can see and play around them.
- [ ] Cleanse removes only a fraction and is foreseeable; the Control path
      remains a viable answer to a DoT-cleansing enemy (doctrine guardrail holds).
- [ ] Befriendable enemies react softly per their config.
- [ ] Hermetic e2e: an enemy cleanses telegraphed DoT and the player adapts to
      the Control path to still win; an enrage fires on its threshold.
- [ ] `npm run verify` clean; mobile `verify` + a timeline-intent board test.

## Out of scope

- Per-round reactive AI (Spec 25 removed per-round enemy actions; reactions fire
  at phase boundaries only).
- Enemy *skill use* in the player's resource economy (folded into threat/
  reaction payloads, per Spec 25 §12 Q5).
- New effect definitions (reactions reuse the existing 112 effects + cleanse).
