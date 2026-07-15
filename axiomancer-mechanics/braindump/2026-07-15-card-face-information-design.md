# Card face information design — FREE/PAID rendering — 2026-07-15

## Surface question
How should combat cards render FREE vs PAID effects when the full payload
doesn't fit the face (PAID today confined to ~1/6 of the card)? Four owner
ideas on the table: (1) two-sided flip on die-add, (2) half/half split with
art exiled to the back, (3) redesign mechanics until no wording is needed,
(4) FREE as a suit-style corner glyph+number, PAID as the only text.

## Better question surfaced
**Which of the face's three jobs is primary — in-hand triage, at-drag
decision support, or post-play comprehension?** Every layout debate resolves
downstream of that. Second gating question: **what is the honesty contract
for a *projected* face?** `card-frame-legend.md` already defines
resolvability at the system level ("face + atlas + legend leave nothing
unstated"), and the overlay's `freePill` is documented as the presenter
truth surface — so the face is already allowed to be a lossless-or-labeled
projection. Saying that out loud frees the face from having to be complete.

**Owner ruling this session (via structured question):**
- Face's primary job = **triage + identity**.
- Die-armed values (▲/—/▼ read result) render **on the card itself**.

## Grounding facts (verified at source this session)
- The face is already a two-surface system: 5-zone `CombatCardFaceVM`
  (hero keyword+value = PAID identity; ◇ FREE rail as `freeKeyword ·
  freeValue` terse projection — Option A split rail, owner-picked
  2026-07-09) + full-truth `CombatCardDetailVM` overlay (freePill,
  diePaidLine, dieTriplet, readLegend, durationFooter, colorMatchHint,
  systemTerms).
- Idea 4 is ~80% shipped: the delta is glyph-for-keyword, corner placement,
  and demoting remaining face prose.
- Idea 1's substrate exists: `read: CombatReadResult | null` plus exact
  armed values `statusAdv`/`statusDis` are already computed; the "flip" is
  purely a presentation metaphor over an existing state transition.
- Internal evidence against bare notation: the ▲/—/▼ triplet was "the
  most-cited undefined notation of the 10-deck playtest" (presenter source
  comment) — fixed by shipping `readLegend`. Glyphs without legends fail
  *in this game's own playtests*.
- Rider glyph grammar already exists: ⬡ threshold / ⬢ powering-die /
  ✕ fate / ◆ synergy (`docs/card-frame-legend.md`).
- Face glyphs source from `statusGlyphs` and match the board's status
  chips — card promises what the board will show.
- KB corpus unreachable in this sandbox (kb-sync MODULE_NOT_FOUND; no
  kb-query MCP) — prior-art reception below is from general knowledge,
  flagged, not KB-cited.

## Prior art consulted (memory-flagged, not KB receipts)
- **MTG — transform vs modal double-faced cards:** transform beloved as
  drama (state change already resolved); MDFCs drew information-access
  complaints because the flip hides a live *choice*. Owner idea 1 is the
  MDFC case: mid-decision.
- **Race for the Galaxy — pure iconography:** the canonical glyph-only
  language; fast for the initiated, but the iconography wall is its most
  consistent reception complaint. Evidence against idea 3 now.
- **Inscryption — sigils:** ~30 glyphs succeed because introduced one at a
  time and always tap-to-explain. Model for progressive glyph literacy.
- **Slay the Spire — live-recomputed card text:** numbers on faces update
  with game state; widely praised clarity. Model for the armed-value
  on-card render. Players also navigate hands by art before text —
  reason not to exile art (kills idea 2 alongside its false 50/50
  FREE/PAID equality).

## Design directions on the table

### Owner ideas, verdicts
1. **Flip on die-add** — weak as the at-drag surface (hides the free-vs-paid
   delta exactly when it's needed; fights the in-flight drag gesture /
   `useDragInterruptRecovery`). Good for the detail overlay (both sides
   side-by-side) and possibly post-commit drama. Rescue variant: flipped
   face keeps a ghosted one-line echo of the free value.
2. **Half/half, art on back** — rejected (owner + session agree): misprices
   FREE/PAID hierarchy as equals and spends the fastest triage channel
   (art) on a side nobody sees.
3. **Mechanics redesign for zero wording** — unsequenced, not wrong:
   inverts the mechanics-owns-rules hierarchy if done for rendering, and
   readLegend evidence says notation needs teaching. Becomes progressively
   feasible AFTER the redesign plan's R4 (grammar normalization) and R5
   (vocabulary reduction). A Phase-8-era option.
4. **FREE corner pip, PAID as the only text** — strongest; ~an increment on
   the shipped ◇ rail. Needs an explicit fallback rule: glyph·number only
   when the projection is lossless, keyword text otherwise (≈ existing
   freeKeyword/freeValue semantics). Corner pips survive fanned hands;
   glyph matches the enemy status chip.

### Option E — Armed crossfade *(Slay the Spire live numbers)*
No sides. Two face *states*: unarmed (FREE pip bright, PAID hero ghosted) ↔
armed (die staged → PAID hero ignites with exact armed values, FREE dims but
stays legible). Answers the delta question at the moment it's asked.
**Trade-off:** solves emphasis, not area — both zones budgeted permanently.
**Telltale failure:** cards feel "busy/flickery" during drag sweeps.

### Option F — Staging strip *(commit-preview pattern; converges with plan §11 payoff-preview + receipts)*
Face keeps identity only; a fixed preview strip above the hand renders the
complete play (FREE + PAID armed + riders + read triplet + legend) when a
die is staged. One learned layout instead of seventy.
**Trade-off:** truth leaves the object being touched; dead UI when idle.
**Telltale failure:** players commit dice without looking at the strip.
*(Demoted by the owner's "on the card itself" ruling, but the strip idea
remains live as the RIDER surface — see synthesis.)*

### Option G — Editing pass first *(discipline, not design)*
Drop face prose the hero keyword already implies (`verbLine`, possibly
`powerRail` — the 2026-07-12 wording audit already killed one duplicate
pill). Cheapest experiment; reveals the true minimum footprint and
de-risks everything else.
**Telltale failure (informative):** dense cards stay dense → problem is
structural, proceed to restructure with evidence.

### Option H — Progressive glyph literacy *(Inscryption onboarding)*
Glyphs render glyph+word for the first N sightings, decay to glyph·number
once `CombatTutorialCoach` records comprehension. Composes with 1/4/E/F.

## Decision / leaning
**Direction locked this session:** triage-first face + on-card armed
values. Concretely — the synthesis of idea 4 + Option E:
- Face: art + name + stance frame, hero PAID keyword+value, FREE as corner
  glyph·number pip (lossless-or-keyword fallback), type strip folded into
  frame treatment; `verbLine`/`powerRail` prose demoted to overlay
  (Option G runs first as its own cheap pass).
- Die staged: hero value crossfades to the exact armed value
  (statusAdv/statusDis) with ▲/▼ marker; FREE pip dims.
- Overlay: unchanged as the truth surface; add both-states view (the good
  half of idea 1).
- Option H literacy decay for the FREE pips and read markers.

## Open questions
- Where do rider lines (⬡⬢✕◆) live on a triage face? Tiny "has riders"
  glyph dots with truth in the overlay? Or the one legitimate use of a
  staging strip? (Riders are the densest remaining payload.)
- Restate the honesty-guard contract before building: face =
  lossless-or-labeled projection; face+legend+overlay = complete truth.
  The guard test (`card-face-honesty.guard.test.ts`) must encode that.
- Layout math unmeasured: card px height in the hand row / fan overlap on
  phone — sets the real information budget. Measure before styling.
- Which face zones do players actually read? Run the playtester-persona
  comprehension quiz (post-fight: "what did these three cards do?") before
  and after — this repo can turn the whole debate into evidence cheaply.
- Editor `CardFace.tsx` vs combat face: shared contract or accepted drift?
- Accessibility: FREE pip silhouettes must be distinguishable in
  monochrome at ~16px (colorblind + stance colors already semantic);
  critic-loop screenshots in both themes can gate this.
- Localization (if ever) silently strengthens glyph options — a maybe
  worth pricing in.
- KB wishlist (kb-sync broken in this sandbox — file when it works again):
  "card iconography / information-density reception — Race for the Galaxy,
  Inscryption sigils, MTG MDFC complaints — wanted for card-face redesign."

## Raw notes
- The FREE-line law (FREE deposits THEME currency) makes most FREE lines
  naturally glyphable — Premise +1, Soul +1, TICK 1 — the law and the pip
  design reinforce each other.
- "The overlay is the truth surface" is already documented in the presenter
  (`freePill` comment) — the reframe costs nothing; it's recognizing
  shipped reality.
- The read system is the densest notation AND the worst playtest offender;
  design the armed-state render around it first, not last.
- Flip animation + in-flight drag on RN/Expo web is a known jank pairing;
  if any flip survives (post-commit drama), prototype the gesture conflict
  early.
