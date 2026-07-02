# Hazard Card Library — Mobile Mirror

> **Mobile note:** This file is mirrored from the mechanics repo source of truth at
> `axiomancer-mechanics/docs/encounters/hazard-card-library.md`.
> Do not edit here — make changes upstream, then re-copy.
>
> Mobile context: the presenter exposes card data via `HazardCardVM` fields
> (`name`, `kind`, `rarity`, `effects`, `keywords`, `free`, `powered`, `salvageLabel`).
> UI keyword glossary entries come from the `keywords` array on each card VM;
> the 22 keyword IDs below map to the tap-to-read tooltip system in `CardDetailOverlay`.
>
> See also: `design/encounters/hazard.md` — Mobile UX source of truth for the Hazard screen.

---

# Hazard Card Library — Source of Truth

> Derived from `src/World/Hazard/hazard.content.ts` as of 2026-06-15.
>
> This is the canonical card-library reference for both mechanics and mobile.
> Mobile mirrors this doc at `design/encounters/hazard-card-library.md`.
>
> Related docs:
> - `docs/encounters/hazard.md` — encounter rules and engine API
> - `docs/hazard-card-expansion-2026-06-11-spec.md` — expansion spec (authored pre-implementation)
> - `docs/hazard-balance-recommendations.md` — balance evidence

---

## Keyword glossary

22 keywords in the current system. All player-facing; tap-to-read detail surfaces
on the card tooltip.

| ID | Display name | Rule summary |
|---|---|---|
| `surge` | SURGE | Drop a matching-colour die on this card for its stronger, lower effect. |
| `force` | FORCE | Fills the FORCE meter. |
| `escape` | ESCAPE | Fills the ESCAPE meter. |
| `convert` | CONVERT | Turn hostile ✕-dice into wild GOLD dice. Minor: one; Major: all. |
| `draw` | DRAW | Pull more cards into your hand. |
| `recast` | RE-CAST | Re-roll all unspent dice into fresh faces. |
| `gilded` | GILDED | Gold cards give a major effect for free; applying a gold die adds their numbers. |
| `salvage` | SALVAGE | Drag to the bin to scrap for a lesser benefit instead of playing. |
| `crack` | CRACK | Dead weight. Does nothing. Cannot be powered. Only clogs the hand. |
| `twotone` | TWO-TONE | Either of two colours of die can power this card. |
| `enchant` | ENCHANT | Lasting boon — adds to every matching card played for the rest of the hazard. |
| `burst` | BURST | One-round shove — its progress counts THIS round only, then is spent. |
| `rally` | RALLY | Each unspent mana die still held adds progress this round. |
| `sacrifice` | SACRIFICE | Pay VITAE now for a surge of progress this round. |
| `vow` | VOW | Primes a one-time boon onto the next wild GOLD die spent. |
| `choose` | CHOOSE | You pick which meter its powered value feeds when you apply it. |
| `purge` | PURGE | Cuts CRACK dead weight out of the deck. Minor: one; Major: scours hand, pile, and discard. |
| `transmute` | TRANSMUTE | Recolours unspent dice to this card's colour. Minor: one; Major: all. Hostile ✕ stays hostile. |
| `mend` | MEND | Restores VITAE when you claim a survived crossing. A failure forfeits the cure. |
| `bounty` | BOUNTY | Banks shillings paid out when you claim a survived crossing. A failure forfeits the purse. |
| `ward` | WARD | Blunts the route's VITAE penalty for lost rounds, down to nothing. |
| `anchor` | ANCHOR | Sets a momentum FLOOR — carry at least this much into the next round, even off a failed round. |

---

## Card anatomy

Each card has:

- **`kind` (colour):** `red` | `blue` | `purple` | `gold` — the card's primary identity and salvage colour.
- **`colors`:** for two-tone cards, the list of colours that can power it.
- **`rarity`:** `common` | `uncommon` | `rare`.
- **`f` / `e` (FREE values):** FORCE and ESCAPE contributed the moment the card is staged.
- **`fp` / `ep` (SURGE values):** FORCE and ESCAPE added once a matching die is applied.
- **`effect`:** optional utility fired on apply (`draw | recast | convert | aura | burst | goldvow | purge | transmute | mend | bounty | ward | anchor`).
- **`majorEffect`:** gold cards give their effect at MAJOR tier even without a die.
- **`salvage`:** discard benefit — either `{ type: 'progress', key, amount }` or `{ type: 'mana' }`.
- **`dead`:** if true, does nothing and cannot be powered (CRACK card only).

---

## Color roles

| Color | Mana consumed | Primary contribution | Character |
|---|---|---|---|
| **Red** | Red die | FORCE | Physical endurance, brawn, confrontation |
| **Blue** | Blue die | ESCAPE | Speed, evasion, finesse |
| **Purple** | Purple die | Both FORCE + ESCAPE (dual, lower numbers) | Utility, conversion, tempo; die upgrades utility not numbers |
| **Gold** | Gold (wild) die | Both FORCE + ESCAPE (dual, higher numbers) | Premium utility-first; major effect free; die buys numbers |

A gold die is wild: it can power **any** card colour. Gold die appears on 2/6 faces
(more common than red/blue/purple, each 1/6).

---

## Starter deck (HAZARD_DECK)

11 cards; drawn each round from a weighted bag (weight = relative frequency).
All starter cards have the `surge` keyword (die upgrades the number action).

### Red — FORCE numbers

| ID | Name | Rarity | Weight | FREE (F) | SURGE (F) | Salvage | Keywords |
|---|---|---|---|---|---|---|---|
| `steps` | Stone Steps | Common | 3 | redBlue.common.free | redBlue.common.powered | +1 FORCE (round) | force, surge |
| `haul` | Dead-Man Haul | Common | 3 | redBlue.common.free | redBlue.common.powered | temp mana die | force, surge |
| `grip` | Iron Grip | Uncommon | 2 | redBlue.uncommon.free | redBlue.uncommon.powered | +1 FORCE (round) | force, surge |

### Blue — ESCAPE numbers

| ID | Name | Rarity | Weight | FREE (E) | SURGE (E) | Salvage | Keywords |
|---|---|---|---|---|---|---|---|
| `scram` | Scramble | Common | 3 | redBlue.common.free | redBlue.common.powered | +1 ESCAPE (round) | escape, surge |
| `runner` | Cliffrunner | Common | 3 | redBlue.common.free | redBlue.common.powered | temp mana die | escape, surge |
| `leap` | Faith Leap | Uncommon | 2 | redBlue.uncommon.free | redBlue.uncommon.powered | +1 ESCAPE (round) | escape, surge |

### Purple — dual numbers + minor utility

Die upgrades the **utility** (minor → major), not the number. Powered numbers = free numbers by design.

| ID | Name | Rarity | Weight | FREE (F/E) | SURGE (F/E) | Effect | Salvage | Keywords |
|---|---|---|---|---|---|---|---|---|
| `footing` | Sure Footing | Common | 3 | purple.free / purple.free | same | draw (minor/major) | +1 FORCE (round) | draw, surge |
| `windread` | Read The Wind | Common | 2 | purple.free / purple.free | same | convert (minor) | +1 ESCAPE (round) | convert, surge |
| `pole` | Balance Pole | Uncommon | 2 | purple.strong / purple.strong | same | recast | +1 FORCE (round) | recast, surge |

### Gold — utility-first, dual numbers on die

Free action fires at MAJOR tier. Die applies numbers.

| ID | Name | Rarity | Weight | FREE (F/E) | SURGE (F/E) | Effect | Salvage | Keywords |
|---|---|---|---|---|---|---|---|---|
| `oath` | Unbroken Oath | Rare | 1 | gold.free / gold.free | gold.powered / gold.powered | draw (MAJOR free) | temp mana die | gilded, draw, surge |
| `blessing` | Pilgrim's Blessing | Rare | 1 | gold.free / gold.free | gold.strongPowered / gold.strongPowered | recast (MAJOR free) | temp mana die | gilded, recast, surge |

---

## Dead card (consequence)

| ID | Name | Kind | Dead | Keywords |
|---|---|---|---|---|
| `crack` | CRACK | purple | true | crack |

Shuffled into the persistent deck by the `deadcard` consequence. Contributes
nothing, cannot be powered, only clogs the hand.

---

## Reward card pool (HAZARD_REWARD_CARDS)

Offered after a clearing (pick-1-of-3); picked cards join the persistent deck.
All reward cards omit `weight` (not in the starter bag).

### Original reward pool (8 cards)

| ID | Name | Kind | Rarity | Free (F/E) | Surge (F/E) | Effect | Salvage | Keywords |
|---|---|---|---|---|---|---|---|---|
| `r_grip` | Greatgrip | red | Common | reward.free / 0 | reward.powered / 0 | — | +1 FORCE (round) | force, surge |
| `r_wind` | Tailwind | blue | Common | 0 / reward.free | 0 / reward.powered | — | +1 ESCAPE (round) | escape, surge |
| `r_even` | Evenkeel | purple | Uncommon | strong / strong | strong / strong | draw (minor/major) | temp mana | draw, surge |
| `r_conv` | Hex-Breaker | purple | Uncommon | free / free | free / free | convert | temp mana | convert, surge |
| `r_seer` | Far-Seer | red | Rare | uncommon.free / 0 | uncommon.powered / 0 | draw (minor) | +1 FORCE (round) | force, draw, surge |
| `r_gale` | Gale-Reader | blue | Rare | 0 / uncommon.free | 0 / uncommon.powered | draw (minor) | +1 ESCAPE (round) | escape, draw, surge |
| `r_oath` | Unbroken Oath | gold | Rare | gold.free / gold.free | gold.powered / gold.powered | draw (MAJOR free) | temp mana | gilded, draw, surge |
| `r_crown` | Crown Relic | gold | Rare | gold.free / gold.free | gold.strongPowered / gold.strongPowered | recast (MAJOR free) | temp mana | gilded, recast, surge |

---

### Expansion roster (2026-06-11 — 22 cards, all reward-pool)

#### Two-tone pivots (3)
Free action fills one meter; surge (either red or blue die) fills the OTHER meter.

| ID | Name | Colors | Rarity | Effect |
|---|---|---|---|---|
| `r_pivot` | Storm Pivot | red+blue | Uncommon | FREE: FORCE; SURGE (red or blue): ESCAPE |
| `r_drop` | Deadweight Drop | red+blue | Uncommon | FREE: ESCAPE; SURGE (red or blue): FORCE |
| `r_last` | Last Resort | red+blue | Rare | FREE: FORCE (rare bands); SURGE: ESCAPE (rare bands) |

#### Lopsided purple duals (2)
Both meters contributed but weighted differently.

| ID | Name | Rarity | Effect |
|---|---|---|---|
| `r_heave` | Heave-To | Uncommon | Mostly FORCE, little ESCAPE; surge upgrades both |
| `r_skitter` | Skitter | Uncommon | Mostly ESCAPE, little FORCE; surge upgrades both |

#### Number + utility hybrids (4)

| ID | Name | Kind | Rarity | Effect |
|---|---|---|---|---|
| `r_path` | Pathfinder | red | Rare | FORCE flat + recast on surge |
| `r_windcall` | Windcaller | blue | Rare | ESCAPE flat + convert on surge |
| `r_stone` | Stonereader | red | Uncommon | FORCE + draw (minor on surge) |
| `r_tide` | Tidereader | blue | Uncommon | ESCAPE + draw (minor on surge) |

#### Enchantments / Auras (5)
Persist for the rest of the hazard after being applied.

| ID | Name | Kind | Rarity | Aura effect |
|---|---|---|---|---|
| `r_aggr` | Aggression | red | Rare | +auraForce to every subsequent FORCE-contributing card |
| `r_swift` | Swiftness | blue | Rare | +auraEscape to every subsequent ESCAPE-contributing card |
| `r_zeal` | Zeal | purple | Rare | +auraForce + auraEscape (minor free; major surged) |
| `r_martyr` | Martyr's Resolve | gold | Rare | +auraForce + auraEscape at MAJOR (gold: free) |
| `r_relic` | Relic of Fury | gold | Rare | +surgeForce + surgeEscape (boosts POWERED contributions) |

#### Gold vow (1)

| ID | Name | Kind | Rarity | Effect |
|---|---|---|---|---|
| `r_vow` | Gilded Vow | gold | Rare | Primes a one-shot bonus onto the next gold die spent to power any card |

#### Bursts (5)
One-round-only progress shoves. Ride `progressBase`; do not carry as momentum.

| ID | Name | Kind | Rarity | Effect |
|---|---|---|---|---|
| `r_serk` | Berserk | red | Uncommon | Burst FORCE (base / surge) |
| `r_bolt` | Bolt | blue | Uncommon | Burst ESCAPE (base / surge) |
| `r_warcry` | War-Cry | red | Rare | +force per unspent non-hex die (RALLY) |
| `r_blood` | Bloodprice | red | Rare | Burst FORCE; costs VITAE (SACRIFICE) |
| `r_pwrath` | Pilgrim's Wrath | gold | Rare | Burst FORCE+ESCAPE dual (MAJOR free) |

#### Choose (1)

| ID | Name | Kind | Rarity | Effect |
|---|---|---|---|---|
| `r_twin` | Twin Paths | gold | Rare | Surge value feeds ONE meter of player's choice on apply |

#### Tempo snowball (1)

| ID | Name | Kind | Rarity | Effect |
|---|---|---|---|---|
| `r_saint` | Saint's Patience | purple | Rare | Draw + FORCE+ESCAPE + raises the session momentum cap |

---

### Codex expansion (2026-06-13 — 108 cards, all reward-pool)

Six new mechanics introduced: PURGE / TRANSMUTE / MEND / BOUNTY / WARD / ANCHOR.
Engine support added in `hazard.engine.ts`. Starter bag (and therefore the balance
sim) is untouched.

Numbers are drawn from `HAZARD_TUNING.cards.codex` (`CX` in content).

#### RED — FORCE ladder (12)

Pure FORCE number cards. Common / Uncommon / Rare tiers.

| ID | Name | Rarity | Salvage |
|---|---|---|---|
| `x_shoulder` | Set the Shoulder | Common | +1 FORCE (round) |
| `x_oxback` | Ox-Back Carry | Common | temp mana |
| `x_splitter` | Knuckle Splitter | Common | +1 FORCE (round) |
| `x_haft` | Broken Haft | Common | temp mana |
| `x_pitonwork` | Piton-Work | Uncommon | +1 FORCE (round) |
| `x_mulekick` | Mule Kick | Uncommon | temp mana |
| `x_quarryman` | Quarryman's Oath | Uncommon | +1 FORCE (round) |
| `x_grindstone` | Grindstone Heart | Uncommon | temp mana |
| `x_gatebreak` | Gatebreaker | Rare | +1 FORCE (round) |
| `x_titanrib` | Titan-Rib Lever | Rare | temp mana |
| `x_avalanche` | Meet the Avalanche | Rare | +1 FORCE (round) |
| `x_lastnail` | The Last Nail | Rare | temp mana |

#### BLUE — ESCAPE ladder (12)

| ID | Name | Rarity | Salvage |
|---|---|---|---|
| `x_eelstep` | Eel-Step | Common | +1 ESCAPE (round) |
| `x_gutterrun` | Gutter Run | Common | temp mana |
| `x_catfall` | Cat-Fall | Common | +1 ESCAPE (round) |
| `x_ratline` | Ratline | Common | temp mana |
| `x_mistwalk` | Mist-Walk | Uncommon | +1 ESCAPE (round) |
| `x_swiftcurrent` | Swift Current | Uncommon | temp mana |
| `x_rooftoppath` | Rooftop Liturgy | Uncommon | +1 ESCAPE (round) |
| `x_longstride` | Seven-League Habit | Uncommon | temp mana |
| `x_ghostgait` | Ghost-Gait | Rare | +1 ESCAPE (round) |
| `x_stormswift` | Outrun the Thunder | Rare | temp mana |
| `x_falconstoop` | Falcon's Stoop | Rare | +1 ESCAPE (round) |
| `x_threshold` | Over the Threshold | Rare | temp mana |

#### PURPLE — dual numbers (10)

Both FORCE and ESCAPE contributed equally per tier (common/uncommon/rare).

| ID | Name | Rarity | Salvage |
|---|---|---|---|
| `x_evenbreath` | Even Breath | Common | +1 FORCE (round) |
| `x_pilgrimpace` | Pilgrim's Pace | Common | +1 ESCAPE (round) |
| `x_doublegrip` | Double Grip | Common | temp mana |
| `x_walkingmeditation` | Walking Rite | Uncommon | +1 FORCE (round) |
| `x_keelbalance` | Keel-Balance | Uncommon | +1 ESCAPE (round) |
| `x_ironlung` | Iron Lung | Uncommon | temp mana |
| `x_wardenswalk` | Warden's Walk | Uncommon | temp mana |
| `x_twinoath` | Twin Oath | Rare | +1 FORCE (round) |
| `x_compassrose` | Compass Rose | Rare | +1 ESCAPE (round) |
| `x_centerline` | The Center Line | Rare | temp mana |

#### GOLD — gilded utility leads (8)

All Rare. Each fires a MAJOR effect for free; die applies numbers.

| ID | Name | Effect | Keywords |
|---|---|---|---|
| `x_dawnpsalm` | Dawn Psalm | draw MAJOR | gilded, draw, surge |
| `x_secondsun` | Second Sun | recast MAJOR | gilded, recast, surge |
| `x_alchemistgrace` | Alchemist's Grace | convert MAJOR | gilded, convert, surge |
| `x_tithefinder` | Tithe-Finder | bounty MAJOR | gilded, bounty, surge |
| `x_goldensalve` | Golden Salve | mend MAJOR | gilded, mend, surge |
| `x_aegisleaf` | Aegis-Leaf | ward MAJOR | gilded, ward, surge |
| `x_keelstone` | Keelstone | anchor MAJOR | gilded, anchor, surge |
| `x_lastrelic` | The Unspent Relic | purge MAJOR (scours all) | gilded, purge, surge |

#### Two-tone pivots (10)

Free action fills one meter; a die of either listed colour powers the OTHER meter.

| ID | Name | Colors | Rarity |
|---|---|---|---|
| `x_hammerdash` | Hammer-and-Dash | red+blue | Uncommon |
| `x_slipanchor` | Slip the Anchor | red+blue | Uncommon |
| `x_brawlerfeint` | Brawler's Feint | red+purple | Uncommon |
| `x_mysticheave` | Mystic Heave | red+purple | Uncommon |
| `x_veilsprint` | Veil Sprint | blue+purple | Uncommon |
| `x_quietstep` | The Quiet Step | blue+purple | Uncommon |
| `x_stormpivot` | Storm-Split | red+blue | Rare |
| `x_tidalturn` | Tidal Turn | red+blue | Rare |
| `x_redmonk` | Red Monk Mantra | red+purple | Rare |
| `x_bluemonk` | Blue Monk Mantra | blue+purple | Rare |

#### Draw engines (5)

| ID | Name | Kind | Rarity | Effect |
|---|---|---|---|---|
| `x_scoutreport` | Scout's Report | red | Uncommon | FORCE + draw |
| `x_birdseye` | Bird's-Eye | blue | Uncommon | ESCAPE + draw |
| `x_mapfragment` | Map Fragment | purple | Common | dual + draw |
| `x_lanternbearer` | Lantern-Bearer | purple | Rare | dual + draw (surges to major) |
| `x_inkfinch` | The Ink Finch | purple | Uncommon | dual + draw |

#### RECAST / CONVERT (5)

| ID | Name | Kind | Rarity | Effect |
|---|---|---|---|---|
| `x_secondwind` | Second Wind | purple | Uncommon | dual + recast |
| `x_diceofashes` | Dice of Ashes | purple | Rare | dual + recast |
| `x_hexwright` | Hexwright | purple | Uncommon | dual + convert |
| `x_blackmillstone` | Black Millstone | red | Rare | FORCE + convert |
| `x_sailmender` | Sail-Mender | blue | Rare | ESCAPE + recast |

#### Auras (6)

| ID | Name | Kind | Rarity | Aura |
|---|---|---|---|---|
| `x_warpaint` | War-Paint | red | Rare | +auraForce per FORCE card played |
| `x_tailfeather` | Tailfeather Charm | blue | Rare | +auraEscape per ESCAPE card |
| `x_communion` | Quiet Communion | purple | Rare | +auraForce + auraEscape dual |
| `x_chorus` | Chorus of Footsteps | gold | Rare | +auraForce + auraEscape MAJOR |
| `x_whetstonechant` | Whetstone Chant | red | Rare | +surgeForce (boosts POWERED FORCE) |
| `x_slipstream` | Slipstream Hymn | blue | Rare | +surgeEscape (boosts POWERED ESCAPE) |

#### Bursts (6)

| ID | Name | Kind | Rarity | Effect |
|---|---|---|---|---|
| `x_furysingle` | One Good Swing | red | Uncommon | Burst FORCE |
| `x_panicgrace` | Panic, Gracefully | blue | Uncommon | Burst ESCAPE |
| `x_bothhands` | Both Hands Now | purple | Rare | Burst FORCE+ESCAPE dual |
| `x_warhorn` | Cracked War-Horn | red | Rare | RALLY — +force per unspent die |
| `x_veinprice` | The Vein-Price | red | Rare | Burst FORCE; SACRIFICE (costs VITAE) |
| `x_redledger` | The Red Ledger | blue | Rare | Burst ESCAPE; SACRIFICE (costs VITAE) |

#### Vow / Choose (4)

| ID | Name | Kind | Rarity | Effect |
|---|---|---|---|---|
| `x_goldoath` | Oath on Gold | gold | Rare | Primes GILDED VOW onto next gold die |
| `x_pendulum` | The Pendulum | gold | Rare | CHOOSE: surge value feeds chosen meter |
| `x_eithergate` | Either Gate | gold | Rare | CHOOSE: surge value feeds chosen meter |
| `x_brightpromise` | Bright Promise | gold | Rare | Primes GILDED VOW (FORCE-weighted) |

#### PURGE (4)
Cuts CRACK dead-weight from the deck for the rest of the crossing.

| ID | Name | Kind | Rarity | Effect |
|---|---|---|---|---|
| `x_menderknife` | Mender's Knife | purple | Uncommon | dual + purge minor (one CRACK) |
| `x_winnower` | The Winnower | red | Uncommon | FORCE + purge minor |
| `x_confessor` | The Confessor | purple | Rare | dual + purge MAJOR (scours hand/pile/discard) |
| `x_cleanhands` | Clean Hands | blue | Uncommon | ESCAPE + purge minor |

#### TRANSMUTE (5)
Recolours unspent dice to the card's colour; hostile ✕ stays hostile.

| ID | Name | Kind | Rarity | Effect |
|---|---|---|---|---|
| `x_redsmith` | The Red Smith | red | Uncommon | FORCE + transmute one (rare: all) |
| `x_bluedyer` | The Blue Dyer | blue | Uncommon | ESCAPE + transmute one (rare: all) |
| `x_violetloom` | The Violet Loom | purple | Uncommon | dual + transmute |
| `x_furnaceheart` | Furnace-Heart | red | Rare | FORCE + transmute one |
| `x_rivermouth` | River-Mouth | blue | Rare | ESCAPE + transmute one |

#### MEND (6)
Restores VITAE at claim on a survived crossing. A failure forfeits the cure.

| ID | Name | Kind | Rarity | Mend base / powered |
|---|---|---|---|---|
| `x_fieldstitch` | Field Stitch | purple | Common | minor / major |
| `x_bittertea` | Bitter Tea | purple | Uncommon | minor / major |
| `x_marrowbroth` | Marrow Broth | red | Uncommon | minor / major |
| `x_coldspring` | Cold Spring | blue | Uncommon | minor / major |
| `x_lazaret` | The Walking Lazaret | purple | Rare | major / rareMajor |
| `x_saintsthumb` | Saint's Thumb | purple | Rare | major / rareMajor |

#### BOUNTY (6)
Banks shillings at claim on a survived crossing. A failure forfeits the purse.

| ID | Name | Kind | Rarity | Bounty base / powered |
|---|---|---|---|---|
| `x_tollkeeper` | Toll-Keeper's Cut | red | Common | minor / major |
| `x_gleambeak` | Gleam-Beak | blue | Common | minor / major |
| `x_relicpouch` | Relic Pouch | purple | Uncommon | minor / major |
| `x_salvagewright` | Salvage-Wright | purple | Uncommon | minor / major |
| `x_dragonsplinter` | Dragon-Splinter | red | Rare | major / rareMajor |
| `x_smugglersmile` | Smuggler's Smile | blue | Rare | major / rareMajor |

#### WARD (5)
Reduces the route's total VITAE penalty at outcome (floored at 0).

| ID | Name | Kind | Rarity | Ward base / powered |
|---|---|---|---|---|
| `x_oilskin` | Oilskin Blessing | blue | Uncommon | minor / major |
| `x_bonefence` | Bone Fence | red | Uncommon | minor / major |
| `x_pilgrimshell` | Pilgrim's Shell | purple | Uncommon | minor / major |
| `x_greywarden` | The Grey Warden | purple | Rare | major / major |
| `x_thornproof` | Thorn-Proof | red | Rare | minor / major |

#### ANCHOR (4)
Sets a momentum FLOOR — the minimum carry banked into the next round, even on a
failed round. Respects the momentum cap.

| ID | Name | Kind | Rarity | Anchor base / powered |
|---|---|---|---|---|
| `x_ballaststone` | Ballast Stone | purple | Uncommon | minor / major |
| `x_mooringline` | Mooring Line | blue | Uncommon | minor / major |
| `x_rootedstance` | Rooted Stance | red | Uncommon | minor / major |
| `x_oldcapstan` | The Old Capstan | purple | Rare | major / major |

---

## Card counts summary

| Pool | Count |
|---|---|
| Starter deck (HAZARD_DECK) | 11 |
| Dead consequence card (CRACK) | 1 |
| Original reward pool | 8 |
| Expansion reward pool (2026-06-11) | 22 |
| Codex expansion (2026-06-13) | 108 |
| **Total card IDs** | **150** |

---

## Balancing notes

- **Red and blue numbers** scale across three tiers (common/uncommon/rare reward). Exact
  values in `HAZARD_TUNING.cards.redBlue`.
- **Purple free = powered** (the die buys the utility, not extra numbers). Keeps purple's
  decision distinct from red/blue.
- **Gold free = 0** (no numbers without a die; the die applies `gold.powered` or
  `gold.strongPowered`). Makes gold die feel like a payoff moment.
- **Reward numbers** (`redBlue.reward`) sit between common and uncommon bands — slightly
  better than starter commons, justifying deck inclusion without dominating.
- **Burst cards** only affect `progressBase` (round-only), so they never carry as momentum;
  they spike one round without snowballing.
- **MEND / BOUNTY / WARD / ANCHOR** (codex mechanics) accrue across the hazard and
  resolve at the claim. A failure forfeits MEND and BOUNTY (incentivises surviving).
  WARD and ANCHOR always take effect (defensive cards not penalised by failure).
- **PURGE / TRANSMUTE** change the pool composition mid-run. PURGE is specifically
  anti-CRACK; TRANSMUTE is general colour fixing.
- Starter bag is untouched by the 2026-06-11 expansion and the 2026-06-13 codex —
  all new cards are reward-pool only. Balance sim evidence: `hazard.balance.sim.test.ts`.
