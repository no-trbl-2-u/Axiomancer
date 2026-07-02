# Phase 128 — Hazard scar recovery at inn rest (max-VITAE healing path)

## Source

Promoted via `/oversight` 2026-06-16 from expand pass 78 [score 6.5].

`state/hazard/store-actions.ts` permanently applies
`maxVitaeDelta -= HAZARD_MAXHP_SCAR` on the `maxhp` consequence at
hazard claim, with **no recovery path**. The Rest encounter ("The
Night Watch") restores current VITAE but never scarred max-VITAE.
The divergence catalogue already names this gap
(`docs/hazard-v2-vs-mechanics-divergence.md`:
"Max-VITAE scar recovery: mobile applies the scar, but 'until next
inn rest' is not wired.")

## Goal

After a hazard scars the player's max-VITAE, a full-restoration
**inn rest** restores that scarred max-VITAE back toward the
player's baseline. A wilderness **field-camp watch** (the authored
`healFraction: 0.5` rests) restores current VITAE only and never
touches the scar.

## Engine-truth boundary

`axiomancer-mechanics` does **not** own scar-recovery truth:

- `RestOutcome` (`World/Rest/rest.types.d.ts`) exposes `healFraction`
  and `cleansed` only — no max-VITAE / scar field.
- The scar itself is applied as a documented **mobile adapter** in
  `claimHazardRewardsAction` (the scar is baked directly into
  `player.maxHealth`; it is not currently recorded anywhere).

Per the build-plan instruction ("otherwise treat as a documented
mobile adapter consistent with the existing scar-apply adapter"),
Phase 128 ships a **mobile adapter**: record the scar magnitude as a
durable flag at apply time, and consume + clear it at inn rest.

## Inn vs field-camp distinction (autonomous decision)

There is no first-class "inn" map-event kind. The authored rest
pools (`state/exploration-maps/event-pools.ts`) all emit
`{ kind: 'rest', healFraction: 0.5 }` — these are field-camp
watches. `beginRestAction`'s default `healFraction` is `1.0`
(full restoration). The cleanest distinction that respects the
existing data model: a rest is **inn-grade** when its
`healFraction >= 1.0` (a full-recovery shelter), and a **field
camp** otherwise. Recorded on the `RestSession` via
`baseHealFraction`, so the inn/camp split survives the night without
new event-kind plumbing. Documented in commit body + divergence doc.

## Scope

1. **Track the scar.** In `state/hazard/store-actions.ts`, when the
   `maxhp` consequence fires at claim, append a durable scar flag
   (`hazard-scar:<magnitude>`) recording the lost max-VITAE so a
   later rest can read the magnitude and restore toward baseline.
2. **Recover at inn rest.** In `state/rest/store-actions.ts`
   `claimRestOutcomeAction`, when the night was inn-grade
   (`baseHealFraction >= 1.0`), sum the banked scar magnitudes,
   restore them to `player.maxHealth`, and clear the scar flags.
   Field-camp nights (`baseHealFraction < 1.0`) leave scar flags and
   maxHealth untouched. Top current health up to the recovered max
   only as the existing heal already does — do not over-heal.
3. **Preserve existing UX + boundary.** No change to the rest-watch
   posture/watch/dawn flow, the engine RestOutcome contract, or the
   hazard claim spoils. The scar flag is a mobile-only adapter flag,
   same family as `hazard-token-banked:` / `night-keepsake:`.
4. **Document.** Update
   `docs/hazard-v2-vs-mechanics-divergence.md` to record that scar
   recovery at inn rest is now wired (and how inn vs camp is
   distinguished).

## Non-goals

- Do not add a new "inn" map-event kind or author new rest nodes.
- Do not change `HAZARD_MAXHP_SCAR` or the consequence ladder.
- Do not introduce engine changes; this is a mobile adapter.
- Do not heal current VITAE beyond the existing rest heal.

## Acceptance criteria

- [ ] A `maxhp` hazard scar records a durable scar flag at claim.
- [ ] An inn rest (`healFraction >= 1.0`) after a scar restores
      max-VITAE toward baseline and clears the scar flags.
- [ ] A field-camp watch (`healFraction: 0.5`) after a scar does
      **not** restore max-VITAE and leaves the scar flags intact.
- [ ] Recovered max-VITAE never exceeds the pre-scar baseline.
- [ ] Existing rest heal / cleanse / keepsake behaviour unchanged.
- [ ] Hermetic tests pin all of the above through the store action
      layer.
- [ ] Divergence doc updated.

## Verification

Run:

- focused hazard + rest store-flow Jest tests
- `npm run typecheck`
- `npm run verify`
