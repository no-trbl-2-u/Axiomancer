# CROSS-AUDIT — EXPANDING THE MECHANIC SPACE (out-of-flow mechanics)

Auditor: mechanics-expert (SNOB lens), 2026-07-10. Inputs: `tuning-audit/dossier.md`,
`tuning-audit/baseline.md`, `plan/HANDOFF-2026-07-09-dice-law-rework.md`,
`axiomancer-mechanics/src/Combat/combat.engine.ts`, one fresh sim (below), and the
KnowledgeBase (`kb/KnowledgeBase`). One sim invocation used of the allotted six.

---

## 0. Why the floating die is the best mechanic in the game (and why that is an indictment)

Study the template before copying it. The floating die
(`forge_floating_die`, engine.ts:1702; `float_x_die`, engine.ts:1724) has five properties
no other player-facing object in this game has simultaneously:

1. **Persistent** — it crosses the turn boundary (materializes into every tray,
   engine.ts:443-448) *and* the encounter boundary (save write-back, engine.ts:3072-3078).
2. **Visible** — it sits in the tray with a stable id and a "✦ FLOATING" tag; the player
   sees their stored power every single round.
3. **Player-timed** — it is spent when the player chooses, bypassing both the draft and
   the 1-die rule (engine.ts:1122-1129, 2029-2032). The player owns the *when*.
4. **Color-lawed** — it obeys THE COLOR LAW, so holding one is holding a *specific*
   promise, not generic mana. A gold float is treasure precisely because most aren't.
5. **Irreversible** — consumed forever, never banks tokens. Spending it is a real
   decision because there is no refund and no consolation prize.

That is the anatomy of tension: a visible stored decision with an irreversible trigger.
Aeon's End built entire mage identities out of exactly this shape — "unique mage
abilities use charge tokens, creating delayed payoff and role identity"
(`kb/KnowledgeBase/BoardGames/games/aeons-end/rules/actions.okf.md:60`). Mage Knight
built its whole economy on the die/crystal split the float already mirrors: one die
from the Source per turn, but card effects that grant extra dice bypass that limit
(`kb/KnowledgeBase/BoardGames/games/mage-knight/rules/edge-cases-faq.okf.md:56-58`) —
which is, beat for beat, the drafted-die/floating-die distinction.

The indictment: this excellent object is currently **the only one of its kind**, it is
owned by one theme, and that theme loses. Fresh sim (the one invocation):

```
npm run combat-playtest -- --stage=mid --policy=blind --deck=preset:foundry --runs=30 --seed=1 --cards
→ mid win 5% (7 vic / 143 def), dotFrac 51% (doctrine witness: everywhere else 95-99%),
  ex-nihilo 521 plays, bootstrap-loop 524 plays, the-overtake 250 plays
```

The float template is *heavily exercised* — the bots forge constantly — and the deck
that owns it posts the worst doctrine numbers in the audit (dotFrac 51% means half its
kills aren't even status kills; mostly it just dies). Meanwhile the baseline's two
loudest findings — **greedy = blind (0pp gap at every stage)** and **chaos is the best
policy at mid** — say the *in-flow* loop has no decisions in it. The out-of-flow layer
is where the decisions have to come from, because the roll→draft→play loop, as
measured, contains approximately none.

Every candidate below is therefore filtered against four gates:

- **G1 Doctrine** — it must make *status plays* more exciting, not reintroduce damage.
- **G2 Dice law** — it must build on 3-dice/1-applied/COLOR-LAW/floats-bypass, never
  soften it.
- **G3 Mobile grammar** — the touch UI has exactly one rich verb: *drag a die-shaped
  token onto a target* (hard-won; see the RNGH drag saga in the 2026-07-09 handoff).
  New mechanics should reuse drag-token-onto-target or single-tap; nothing real-time,
  nothing hover, nothing right-click.
- **G4 Baseline pathology** — it should attack a measured failure (0pp read value,
  statusEngagement collapse 66→16%, Conviction income doubled + signature at 90-95% of
  all damage, 2-4 round fights, dead alt-wins), not add chrome.

---

## 1. The nine candidates

### C1. THE COVETED DIE — an enemy-side float the player can steal

**Design.** Some enemy phases *stake a die*: the telegraph banner shows a colored die
socketed into the enemy's next action ("Rawhead braces — a BODY die glows in its fist").
If the staked phase resolves, the enemy cashes it (that phase's damage/status is
empowered — the same +pips grammar Reserve already uses). But if the player **denies or
survives-and-answers** the phase on the game's own terms — STAGGER it to 0 rungs, hard-
control skip, fully block with Guard/Barrier (a Bulwark answer), or win the read by
having drafted the counter-color — the die pops loose and becomes a **floating die of
that color** in the player's pool (cap 3 still governs; at cap it burns for +1◆,
mirroring FORGE's overflow rule). The steal condition is printed on the telegraph, so
the player is always looking at a visible bounty with a visible price.

**Ownership.** Global rule (enemy-authored, in `combat.threat-sequences.ts` phases);
Control and Bulwark get hallmark amplifiers (e.g. a Control uncommon: "if BACKFIRE is
active when you steal, the stolen die arrives WILD"). Charm gets the pacifist route:
RAPPORT above a threshold makes the enemy simply *offer* the die.

**Decision created.** Finally, a reason the hidden-stance read matters: greedy-vs-blind
is 0pp today because knowing the enemy's stance changes nothing you'd do. A staked die
makes the telegraph a *lootable object* — do I spend this turn on my DoT engine, or
divert into STAGGER/Guard to mug the enemy for a mind die I need in two turns? It also
finally gives Bulwark a proactive payoff ("cannot kill non-attackers" wall, dossier §4).

**Cost/risk.** Engine: moderate — a `stakedDie?: {color, stealCondition}` field on
threat phases, resolution inside `resolveThreatPhase` (engine.ts:2208) where deny/block
outcomes are already computed; the award path is `forge_floating_die` verbatim. UI: low
drag surface — the die renders in the telegraph banner (display only), the steal is
automatic on condition; no new gesture. Tutorial: one sentence ("Deny a staked action
and its die is yours"). Risk: authoring burden across 61 threat sequences — start with
~15 mid/late phases; and steal-condition legibility must be iconic, not prose.

**Prior art.** Aeon's End nemesis *power cards* sit on the enemy side and players spend
resources out-of-flow to discard them before they fire — an enemy-side object the party
interacts with on its own timing (`kb/.../aeons-end/` scout-report; the charge-token
line at `rules/actions.okf.md:60` is the same delayed-payoff grammar from the player
side). Dune: Imperium's combat intrigues create the "visible stakes, contested at a
timing window" texture (`kb/.../dune-imperium/rules/edge-cases-faq.okf.md:73` — "timing
windows create most ambiguity: Plot vs Combat" — ambiguity for rules lawyers, *tension*
for players). Digital kin: Griftlands' arguments-as-targets, Wildfrost's frontline
objects, Inscryption's totem-item theft moments.

---

### C2. GLYPHS — charging battlefield seals the player cracks

**Design.** A GLYPH is a persistent battlefield object (third zone alongside
enchant tempZone and curse attachments — the `zoneHas` hook registry at engine.ts:732 is
the natural home) inscribed with a **status payload** and a charge counter. Each
`processBetweenPhases` it survives, it gains +1 charge (the exact ripening grammar
Reserve pips already use — engine.ts:477, `ripenReserve`). At any point during the
player's phase-play, the player **cracks** it — tap-and-confirm — releasing the payload
at current charge: e.g. *Glyph of Suppuration: crack → POISON (2 + 2×charges) i/d;
Glyph of the Bulwark: crack → BARRIER 3×charges; Glyph of Sway: crack → SWAY
2+charges.* Inscribing costs a die under the color law (PAID line); **FREE lines on
glyph cards add +1 charge to a glyph you already control** — which is precisely the
owner's parked design signal made flesh: the FREE line stops being a weak chip and
becomes *foundation-laying for the PAID payoff*.

**Ownership.** Global card class (a new `cardType: 'glyph'` slot in the preset recipe,
or replacing one uncommon slot per theme), payloads theme-flavored. Forge gets the
hallmark interaction: PIP verbs can pump glyph charges; Harvest's expiring glyphs feed
SOUL.

**Decision created.** The ripening dilemma, i.e. the only dilemma push-your-luck games
need: every round you don't crack it, it's worth more *and* the escalation clock
(×1.22/round past grace) makes waiting costlier. Fights are currently 2-4 rounds — too
short for POISON ramps to breathe (baseline: "a runway the length of a doormat"). A
glyph makes the *player* want a longer fight, which is the correct way to lengthen
fights: desire, not HP bloat. It also props up late-stage statusEngagement (66→16%
collapse) because cracking is by definition a status play.

**Cost/risk.** Engine: moderate — new zone array, charge tick in
`processBetweenPhases` (engine.ts:2495 region), a `crack_glyph` action mirroring
`playSignatureSkill`'s always-available surface. UI: low-moderate — glyphs need a
board slot (the battlefield between hand and enemy is currently underused); crack =
tap + confirm, no drag. Tutorial: one concept ("Glyphs grow. Crack them when ripe").
Risk: enemy counterplay must exist or gliphs are a free bank — give some enemies a
glyph-shatter phase (which itself creates a protect-the-glyph read, compounding C1).

**Prior art.** Slay the Spire's Defect orbs are the canonical digital form: persistent,
visible, channel-now-evoke-later, and beloved precisely for the *when do I evoke*
question. Aeon's End charge abilities (`kb/.../aeons-end/rules/actions.okf.md:60`).
Spirit Island's elemental thresholds reward building toward visible breakpoints
(`kb/.../spirit-island/rules/actions.okf.md:42-44`: "combinations... can grant free
bonus effects"). Dawncaster's **Momentum** keyword — "whenever you have 5 or more
Momentum, remove all stacks and draw a card"
(`kb/KnowledgeBase/DigitalCardGames/dawncaster/keywords.csv`, Momentum row) — is the
same accumulate-then-cash loop, though auto-fired; the glyph improves on it by making
the cash-out *player-timed*, per the float template.

---

### C3. THE STAKE — wager Conviction on the read

**Design.** After drafting, before playing cards, the player may optionally **stake
Conviction on a declaration about the coming threat phase**, made against the hidden
stance: tap the stake button, pick a stance icon (heart/body/mind), commit 2/4/6◆.
When the threat phase resolves and the hidden stance is revealed: correct → the pot
pays out as a **floating die of the declared color** (2◆ stake) or a **WILD float**
(6◆ stake), plus the read-advantage multiplier on that phase's incoming resolution;
wrong → the ◆ is gone and the enemy's escalation ticks +1 (you argued confidently and
were wrong — the audience noticed). `sig-read-opponent` (1◆ scout) becomes the
insider-trading enabler: scout first, then stake, netting a guaranteed-but-taxed float.

**Ownership.** Global signature-layer mechanic (it lives beside the signature row, not
in any deck). Oracle is the hallmark amplifier: OMEN cards can ride the stake
("if your Stake wins, this rider fires free"), and FORETELL's telegraph-glimpse is
literal card-advantage on the bet.

**Decision created.** This attacks the two ugliest baseline numbers at once. First,
Conviction income doubled under the 3-die law and `sig-conviction-strike` delivers
90-95% of all damage — ◆ currently has exactly one good use and it's an auto-button.
The Stake is a *competing* ◆ sink whose EV depends on information, not a script.
Second, greedy-vs-blind = 0pp: the moment ◆ can be wagered on the hidden stance,
knowing the hidden stance is worth actual currency, and the informed player finally
separates from the blind one — measurably, in the same sim harness that convicted the
current rules.

**Cost/risk.** Engine: low — a `stake?: {color, amount}` field on state, settled at
the top of `resolveThreatPhase` where the hidden stance is already in hand; payout
reuses `forge_floating_die`. UI: minimal — one button, three icons, three stake sizes;
zero drag. Tutorial: gambling is self-explanatory; one line. Risk: degenerate
scout-then-stake loop must be priced (scout 1◆ + stake 2◆ → colored float ≈ fair only
if a colored float is worth ~3-4◆; tune against `cards.pricing.ts` where float_x_die
≈ 6.6 pts); and losing stakes must sting but not spiral (escalation +1 is deliberately
the same currency the game already uses for "you wasted time").

**Prior art.** The Quacks of Quedlinburg is the reference for priced overconfidence —
and note its *restraint*: the flask (the out-of-flow undo) "cannot be used if the last
chip drawn causes the pot to explode"
(`kb/.../the-quacks-of-quedlinburg/rules/actions.okf.md:43-45`; the KB's own reading:
"a pressure valve, but its timing restriction preserves the punishment of overreach").
Heat's whole engagement loop is "choosing when to accept corner risk"
(`kb/.../heat-pedal-to-the-metal/rules/actions.okf.md:28`). Digital kin: Griftlands'
bet-on-yourself renown gambits; MTG's "pay life for knowledge" tradition. The Stake is
Quacks' push-your-luck married to the one hidden variable Axiomancer already has.

---

### C4. FATE-BRAID — bank a face into the next roll

**Design.** A hallmark verb (BRAID) that lets the player **lock a chosen die face into
next turn's roll**: one of next turn's 3 rolled dice arrives pre-set to the braided
color instead of random. Visible as a braided strand above the tray ("next roll:
⬢ MIND is woven"). The engine seam *already exists*: CLARITY's `forceWildOnNextDie`
payload (engine.ts:419-422) is a fate-braid hard-coded to wild — BRAID generalizes it
to a player-chosen color at authoring-controlled cost (typically RECOIL, a discard, or
consuming the drafted die early). Braided dice are rolled dice — they obey the draft,
the 1-die rule, the token accrual — so this is planning, not power.

**Ownership.** Oracle hallmark (FORETELL sees the future; BRAID edits it). Akrasia gets
the corrupt version (braid at RECOIL cost). Not global — prophecy is a fantasy, not a
utility.

**Decision created.** Converts this turn's spare capacity into next turn's certainty —
the setup-turn play the status doctrine wants (know your POISON payoff card is mind;
weave a mind die tonight, detonate tomorrow). Softens the "honest roll" whiff-turns
(all-X rolls) *without* touching the no-guarantee law, because the player paid for it.

**Cost/risk.** Engine: low (extend the existing forced-die branch in `startTurn` to
carry a color). UI: minimal — a strand indicator; choosing the color is a tap on a
stance icon. Tutorial: trivial. Risk: low ceiling — it's a good verb, not a system;
alone it will not move the greedy=blind needle because sim policies plan poorly.

**Prior art.** Sagrada/Dicey-Dungeons-style die manipulation; StS scry family;
Dawncaster's **Persistent** keyword — "cards with Persistent don't get discarded at
the end of the turn" (`kb/.../dawncaster/keywords.csv`) — the same "this survives the
boundary because a card said so" license, applied to dice.

---

### C5. THE OBJECTION — a threat-phase interrupt window

**Design.** When the enemy's telegraphed action begins to resolve, the game pauses at a
single **objection window**: if the player holds a floating or Reserve die matching the
*revealed* acting stance, they may drag it onto the incoming action to interrupt —
converting rungs into a status application (e.g. spend a body float: STAGGER 1 + apply
MARK 2) before damage math runs. Floats obey their laws (consumed forever, color law,
no tokens). If the player holds nothing legal, the window doesn't open at all — no
dead prompts.

**Ownership.** Global window; Bulwark and Control own the amplifier cards ("your
RIPOSTE also fires on objection", "objections STAGGER 2"). This is the argument
fantasy the theme names beg for — the game is literally about rhetoric and nobody can
say "Objection!".

**Decision created.** Hold-or-spend gets a second axis: floats are currently only
offense-timing; the objection makes them defense-timing too, and makes *banking* a
float against a boss's known big phase (FORETELL synergy) a plan.

**Cost/risk.** Engine: moderate-high — `resolveThreatPhase` (engine.ts:2208) is
currently atomic; it needs a pre-resolution yield point and a resume, which is a state-
machine change touching the sim, the autoplayer, and the CLI loop. UI: reuses the
drag-die grammar but adds a modal combat pause — the second interaction mode the
mobile app would ever have. Tutorial: moderate (a new timing concept). Risk: the
highest engineering cost on this list; sequence after C1/C2 prove the appetite.

**Prior art.** Dune: Imperium combat intrigues — cards held privately, played at the
combat timing window (`kb/.../dune-imperium/rules/edge-cases-faq.okf.md:67-73`). MTG
instants are the genre's foundational out-of-turn resource. StS pointedly *refused*
this (no player action on enemy turns) and pays for it with turtling monotony; Monster
Train's reform (plan, then watch resolution) is why its combat feels kinetic.

---

### C6. TALISMANS OF THE SPARED — alt-win trophies as consumables

**Design.** Alt-wins mint **talismans**: Befriend → *Token of Friendship*, CAPITULATE →
*Signed Concession*, CONCEDE → *The Printed Peroration*. Each is a one-use, cross-fight
consumable in a 2-slot satchel, playable during any phase-play with a tap, dieless and
outside the hand: Friendship → the enemy's next phase is skipped (it hesitates);
Concession → SWAY 6 now; Peroration → +2 Premises now. Kill-wins mint nothing.

**Ownership.** Global (reward-layer), flavored by which alt-path minted it.

**Decision created.** Baseline: mercy and concede have fired **zero times in ~1,290
fights** including from the policy built to want them — because they cost tempo and pay
nothing the poison tick doesn't. Griftlands made surrender-paths compete by *pricing
them into the reward structure*; this does exactly that. The satchel also creates a
when-to-burn decision (2 slots, boss coming).

**Cost/risk.** Engine: low-moderate — consumables persist on the character save (the
float write-back at engine.ts:3072 is the template); effects reuse existing verbs
(skipTurn, SWAY, PREMISE). UI: 2 satchel slots by the signature row, tap-confirm.
Tutorial: none (items are universal grammar). Risk: it's a reward-economy fix wearing
a mechanic's coat — it will not fix combat feel by itself; ship it *with* whatever
makes SWAY/Peroration lines playable in the first place (the theme-audit's problem).

**Prior art.** Inscryption's items (out-of-deck one-shots, used any time on your turn)
are the exact shape and among the most-liked parts of that game. Dawncaster's
wayfinder/charm meta-layer rewards non-combat resolutions with run-persistent boons.
Dominion Adventures' Reserve cards (tavern mat, called out-of-turn on triggers) are the
tabletop ancestor of "a resource parked outside the deck, cashed on your timing".

---

### C7. VIAL OF RESIDUE — carry one DoT across the fight boundary

**Design.** Harvest hallmark: at victory, if the enemy died with an active DoT you may
**bottle it** — one vial slot; the vial holds the DoT at half intensity. Next combat,
during any phase-play, uncork it (tap) to pre-apply that DoT to the fresh enemy,
dieless. SOUL interaction: bottling costs 2 Souls (Souls otherwise reset per fight —
this gives the end-of-fight surplus a use).

**Ownership.** Harvest hallmark card (`the-tithe` rework candidate or a new uncommon);
Affliction gets a lesser cousin via curse text.

**Decision created.** Which DoT to bottle (the ramping POISON at half strength vs the
front-loaded BLEED), and when to uncork (turn 1 for tempo vs post-MARK for
amplification). Makes short fights *mean* something for the next fight — run-texture
without a meta system.

**Cost/risk.** Engine: low (serialize one effect instance to the save; apply via
existing `applyEffect`). UI: one slot, tap. Tutorial: trivial. Risk: modest ceiling;
tuning must respect that a turn-0 DoT compresses already-short fights (gate uncorking
behind round 2, or accept it as an early-stage smoothing tool).

**Prior art.** Wildfrost's charms (consumed to permanently modify), Monster Train's
pyre-carryover feel; Quacks' bag-persistence between rounds
(`kb/.../the-quacks-of-quedlinburg/rules/setup.okf.md:39-41`) is the board-game
grammar of "your engine survives the boundary, curated by you".

---

### C8. THE POCKET PREMISE — a side-board slot

**Design.** One card slot outside the deck. Between fights (or once mid-fight at a
cost), stash any card from hand into the pocket; it stops cycling with the deck. In any
fight, once, play it from the pocket on your timing — still die-powered, still
color-lawed (the pocket guarantees *access*, not *power*). Peroration-flavored name;
mechanically global.

**Decision created.** Guaranteed-answer planning (pocket the RUPTURE finisher; pocket
the CLEANSE for the curse boss) plus incidental deck-thinning. Attacks the 69% dead-
card rate obliquely: a card too situational for the deck is exactly right for the
pocket.

**Cost/risk.** Engine: low-moderate (a held-card zone on the save; a play path that
skips the hand). UI: one slot; drag-card-to-pocket is a *new* drag payload type
(cards drag onto dice targets today, not zones) — real gesture work. Tutorial: light.
Risk: it's a deck-builder amenity, not a combat thrill; it competes with hand space
for attention on a small screen.

**Prior art.** MTG sideboard; Dominion's tavern mat; Inscryption's held items;
Balatro's consumable slots. Universally liked, nowhere the star.

---

### C9. THE RELIQUARY — sacrifice dice across fights

**Design.** A run-level altar: after any victory, feed it floating dice (the only
dice that survive fights — engine.ts:3072). At thresholds (3/6/9 dice by color
recipe, Spirit-Island-style), it grants permanent run boons: a 4th tray die of a
chosen color every fight, +1 float cap, a permanent glyph. The tension is direct:
floats are your best in-fight resource *and* the only sacrifice currency.

**Ownership.** Forge/Harvest shared shrine (map node, not a card).

**Decision created.** Spend-now-vs-invest across the whole run — the Mage Knight
crystal economy stretched over a campaign.

**Cost/risk.** Engine: touches the map/run layer, outside the combat engine's remit;
this audit can spec it but not ship it. UI: a shrine screen. Tutorial: moderate.
Risk: scope — this is a meta-progression feature wearing combat clothes; park it
until the run layer is on an audit's table.

**Prior art.** Mage Knight crystals (`kb/.../mage-knight/rules/edge-cases-faq.okf.md`),
Inscryption's sacrifice altar, Spirit Island element thresholds
(`kb/.../spirit-island/rules/actions.okf.md:42-44`).

---

## 2. Ranking

Scored against the four gates (G1 doctrine, G2 dice law, G3 mobile grammar, G4 attacks
a measured pathology) plus cost. The top three are the ones that convert baseline
convictions into mechanics; the middle tier is good sequencing; the tail is parked.

| rank | mechanic | pathology attacked | engine cost | UI cost | verdict |
|---|---|---|---|---|---|
| 1 | **C1 Coveted Die** | greedy=blind 0pp; telegraph has no decision value; Bulwark can't kill non-attackers | M | L | **Build.** The read finally pays in the game's best currency. |
| 2 | **C2 Glyphs** | 2-4 round fights; statusEng 66→16% collapse; FREE/PAID design signal | M | M | **Build.** Player-timed ripening = the float's soul, statusized. |
| 3 | **C3 The Stake** | doubled ◆ income; sig-conviction-strike at 90-95% of damage; 0pp read gap | L | L | **Build.** Cheapest real fix for the Conviction monoculture. |
| 4 | C4 Fate-braid | whiff-turns under honest roll; Oracle identity | L | L | Next batch; generalizes an existing seam (`forceWildOnNextDie`). |
| 5 | C5 Objection | no out-of-turn tension; Bulwark/Control identity | H | M-H | Right idea, priciest seam; after C1 proves threat-phase interaction. |
| 6 | C6 Talismans | mercy/concede at 0 in 1,290 fights | L-M | L | Ship alongside the alt-win tuning pass, not before it. |
| 7 | C7 Vial of Residue | short fights feel weightless; Harvest late walls | L | L | Cheap flavor win; batch with a Harvest theme pass. |
| 8 | C8 Pocket Premise | 69% dead cards (obliquely) | L-M | M | Amenity; new drag payload type makes it dearer than it looks. |
| 9 | C9 Reliquary | run-level texture | H (meta layer) | M | Park until the map/run layer is under audit. |

A note on interaction: C1+C2+C3 compound. The Stake pays out floats; the Coveted Die
awards floats; Glyphs give floats a third spend target beyond PAID lines (pump a
charge). Three mechanics, one currency, three timings — that is how Mage Knight's
crystal economy feels deep with four colors and a cap of 3.

---

## 3. Top three — full work-item detail

### WI-1: THE COVETED DIE (staked enemy dice, stealable)

**Spec.**
- `ThreatPhase` gains optional `stake?: { color: StanceColor | 'wild', steal: 'deny' | 'fullBlock' | 'readWin' }`
  in `src/Combat/combat.threat-sequences.ts` types.
- `resolveThreatPhase` (engine.ts:2208): if the phase has a stake —
  - phase resolves normally (not denied, not fully blocked, read not won): enemy cashes
    it → that phase's status riders +1 intensity or damage +stake-pips (reuse the
    Reserve pip empowerment constant, engine.ts:194 region);
  - steal condition met: emit `staked-die-stolen` event; award via the
    `forge_floating_die` path (cap 3, at-cap → +1◆, identical to engine.ts:1709-1721).
- `steal: 'readWin'` = the player's drafted color beats the phase's hidden stance —
  this makes the *draft itself* a steal attempt, giving blind-vs-informed a measurable
  gap with zero new player verbs.
- Authoring: stakes on ~15 phases first — every late boss's signature phase
  (fire-giant, rangda, tezcatlipoca, arch-demon, death, the-abortive) + rawhead-rex +
  a handful of mid phases. Late stage is where win% is 3% and statusEng is 22%; a
  lootable telegraph gives those scripted 3.0-round deaths a decision.
- Doctrine check: the stolen die is not damage; it powers status plays (G1). Color law
  fully applies (G2). No new gesture (G3).

**Acceptance criteria.**
1. Unit: steal via each of the three conditions; cash-in when unmet; cap overflow →
   +1◆; event stream carries `staked-die-stolen` / `staked-die-cashed`.
2. Sim witness: on staked-phase enemies, greedy (which peeks the hidden stance) must
   beat blind by ≥5pp — the first nonzero read-value measurement in the game. Add a
   `stakesStolen` counter to `combat.encounter.sim.ts` metrics.
3. Balance band: late-stage blind win% moves 3% → 10-20% band on staked enemies
   without touching HP numbers.
4. Mobile: telegraph banner renders the staked die (display-only VM field on the
   threat VM); steal moment gets a toast + the standard float arrival animation.

**Files.** `combat.threat-sequences.ts`, `combat.engine.ts` (resolveThreatPhase +
event types), `combat.encounter.sim.ts` (metrics), mobile
`CombatBoard.tsx`/`combat-encounter.engine.ts` presenter (banner VM), tutorial step.
Estimate: **M** (engine days, authoring the larger half).

### WI-2: GLYPHS (charging seals, player-cracked)

**Spec.**
- New zone `state.glyphs: GlyphInstance[]` — `{ id, cardId, payload, charges, cap }`,
  registered beside tempZone; `zoneHas`-style helper for hook sites.
- Charge tick in `processBetweenPhases` (engine.ts:2495 region), +1/round, per-glyph
  cap (authored, 3-5), following the `ripenReserve` pattern.
- New action `crackGlyph(state, glyphId)` legal during phase-play, dieless (the die was
  paid at inscription), releasing the payload scaled by charges. Payloads are existing
  status verbs only (POISON/BLEED/MARK/SWAY/BARRIER/PREMISE) — no new effect types.
- Card surface: convert one uncommon slot in 3 pilot presets (erosion, bastion, grace)
  to a glyph card. PAID line = inscribe. **FREE line = +1 charge to your glyph** —
  the direct answer to the owner's "FREE should lay foundation" signal; wire the same
  FREE verb onto 2-3 existing weak-chip FREE lines (e.g. `slippery-slope`'s `tickOne`
  → "+1 charge" when a glyph is out) as the pilot for the fork redesign.
- Enemy counterplay: 2-3 late enemies gain a shatter rider on one phase (destroy the
  lowest-charge glyph) — creating the protect read and a natural C1 stake pairing.

**Acceptance criteria.**
1. Unit: inscribe → tick → crack at N charges = printed scaling; shatter; FREE-line
   charge pump; expiry/consumption feeds SOUL (Harvest parity with other statuses).
2. Sim: `statusEngagement` at late stage rises ≥10pp on the pilot presets (cracks and
   charge-pumps both count as status plays — they are); mean rounds on early fights
   moves 2.0-2.2 → 3-4 *by player choice* (bots should learn a `crackAt` threshold in
   the status policy).
3. Doctrine: `dotHpFraction` stays ≥90% on erosion pilot (glyph output is DoT).
4. Mobile: glyph chip row on the battlefield with charge pips; tap → confirm sheet
   ("Crack now for POISON 8 — next round: 10"). The *foretold next value* on the
   confirm sheet is mandatory: the ripening decision must be legible, per Quacks'
   printed-odds honesty.

**Files.** `combat.engine.ts` (zone, tick, crack), `types.ts` + `cards.library.ts`
(glyph cards), `cards.pricing.ts` (charge-scaling price curve),
`combat.deck-presets.ts` (3 pilots), sim policies (`crackAt` heuristic),
mobile board + presenter + tutorial. Estimate: **M-L** (the biggest of the three;
pays twice by piloting the FREE/PAID redesign).

### WI-3: THE STAKE (Conviction wager on the hidden stance)

**Spec.**
- `state.stake?: { color: StanceColor, amount: 2 | 4 | 6 }`, settable once per round
  after draft (`placeStake` action; rejected if already placed or ◆ insufficient).
- Settlement at the top of `resolveThreatPhase`, where the hidden stance is revealed:
  - win at 2◆ → floating die of the staked color; 4◆ → staked-color float +1 pip
    (floats can carry pips — anvil-of-form already grants them, engine.ts:1716);
    6◆ → WILD float. All via the `forge_floating_die` path, cap rules intact.
  - loss → ◆ gone, escalation clock +1 round-equivalent.
- Interaction pins: `sig-read-opponent` (1◆) before staking is *legal and intended* —
  the combined 3◆ → guaranteed colored float is the priced information play; tune float
  value against `cards.pricing.ts` (float_x_die ≈ 6.6 pts) so the insider route is
  good-but-taxed, and the blind 2◆ gamble is EV-neutral at 1/3 hit rate (payout must
  therefore be worth ~6◆ — a colored float qualifies; verify, don't assume).
- Oracle amplifier card (1 new uncommon): "While your Stake is placed, OMEN riders
  fire at ×1.5" — reusing `the-oracles-eye`'s existing multiplier hook.

**Acceptance criteria.**
1. Unit: place/settle/win-tiers/loss/escalation; can't stake twice; can't stake floats
   into existence past cap without the +1◆ fallback.
2. Sim witness: add a `stake` heuristic to greedy (stake when stance known via scout)
   and blind (never stake, or random-stake variant): greedy-vs-blind win gap must go
   nonzero at mid/late. This is the direct falsification test for "the read is worth
   nothing".
3. Conviction economy: signature-cast rate (esp. `sig-conviction-strike`) drops
   measurably at mid/late as ◆ routes into stakes — target: dominant-damage share of
   `sig-conviction-strike` in transcripts under 60% (from 90-95%).
4. Mobile: stake chip near the Conviction counter; tap → 3 stance icons × 3 amounts;
   resolution toast at threat reveal. Zero drag surface.

**Files.** `combat.engine.ts` (placeStake + settlement), signature/`combat.signature.ts`
adjacency, `combat.encounter.sim.ts` + `combat.autoplay.ts` (stake heuristics),
`cards.library.ts` (1 Oracle uncommon), mobile presenter + one button cluster +
tutorial line. Estimate: **S-M** — the cheapest item on this list per point of
measured pathology addressed.

---

## 4. Closing judgment

The floating die is the one object in this game that would survive contact with a
design-literate table: Mage Knight's crystals, Aeon's End's charges, and Dominion's
tavern mat all testify that the persistent, visible, player-timed, irreversible token
is a load-bearing pattern, not a garnish. The baseline shows a combat loop whose
in-flow decisions measure at zero (greedy=blind, chaos optimal) — so the expansion
budget belongs out-of-flow, where the float already proved the grammar works on this
engine and this touch UI. Build the Coveted Die to make the enemy's telegraph worth
reading, Glyphs to make the status doctrine worth ripening, and the Stake to make the
doubled Conviction worth deciding about. Do not build nine mechanics; build three that
share one currency, and let the tray — not the hand — become where the game's tension
lives between turns.
