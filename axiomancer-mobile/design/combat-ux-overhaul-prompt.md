# Combat UX Overhaul -- Design Prompt

> Paste this into the Claude Design project at:
> https://claude.ai/design/p/019e0f5a-a0f0-753b-be1e-8939e6011384

---

## What I need

A redesign of the combat modal in Axiomancer Mobile. A first-time playtester walked through the game and found combat unintuitive -- numbers and icons lack meaning, the flow between player choices and outcomes is opaque, and several surfaces show information that new players cannot decode. The game's literary voice and dark aesthetic are working beautifully (the death prose, victory text, and overall atmosphere are highlights), but combat's mechanical layer is failing to communicate.

I need design boards that solve six specific problems while preserving the existing aesthetic language (Pirata One headers, IM Fell English body, Bebas Neue labels, near-black palette with parchment/blood/sulfur/rust/bone accents).

---

## The game's combat flow

Combat happens inside a modal overlay on top of the exploration map. It runs in four phases per round:

1. **I -- STAND** (choose stance): Pick one of three stances -- HEART, BODY, or MIND. Rock-paper-scissors triangle (Heart beats Mind, Mind beats Body, Body beats Heart). Each stance shows ATK/SKL/DEF stats.
2. **II -- DO** (choose action): Pick ATTACK, DEFEND, SKILL, or ITEM. SKILL opens a sub-picker of equipped abilities with mana costs.
3. **III -- CLASH** (resolution): Engine resolves the round.
4. **IV -- LET** (outcome): Shows what happened -- damage dealt, effects applied, etc.

Above the phase picker sits an enemy panel (name, health bar, stance indicator, effects) and a scrollable battle log. Below is a player HUD (health, stance, effects).

---

## Problem 1: Stance cards clip and crowd

**Current state:** Three stance cards (HEART / BODY / MIND) sit side-by-side horizontally. Each shows a glyph, name, two-word gloss ("parley, mercy"), "BEATS X -- WEAK Y" text, a divider, and three stat rows (ATK/SKL/DEF). On narrower viewports, the rightmost card (Mind) clips -- its stats and "BEATS HEART -- WEAK BOD" text truncate at the screen edge.

**What I need:** A layout that fits all three cards legibly on a 375pt-wide viewport (iPhone SE / small Android). The cards need to be comparable at a glance -- the player is making a strategic choice and needs to see all three options equally. Consider whether the cards should be narrower, stacked differently, or use a different information hierarchy. The "BEATS X -- WEAK Y" relationship is critical -- that's how new players learn the triangle.

**Constraint:** Each card must show: stance name, the triangle relationship (beats/weak), and ATK/SKL/DEF values. The glyph and two-word gloss are nice-to-have.

---

## Problem 2: CRUCIBLE resource glyphs are cryptic

**Current state:** The DO phase shows a "CRUCIBLE" label with five glyphs in a horizontal row:

| Glyph | Resource | Example value |
|-------|----------|---------------|
| Half-circle left (unicode &#x25D0;) | Body | 2 |
| Half-circle right (unicode &#x25D1;) | Heart | 2 |
| Half-circle top (unicode &#x25D2;) | Mind | 1 |
| Half-circle bottom (unicode &#x25D3;) | Fallacy | 1 |
| Full circle (unicode &#x25C9;) | Paradox | 1 |

No labels, no tooltips, no color coding beyond depleted (ash grey). A first-time player sees five cryptic symbols with numbers and has no idea what they represent.

**What I need:** A readable resource display that communicates what each pool is and what the numbers mean. Options: labels below each glyph, color-coded to their associated stat (body/blood, mind/sulfur, heart/rust), tap-tooltips, or a different layout entirely. The CRUCIBLE strip also needs to indicate when a skill costs resources from a specific pool (right now the cost is shown only as a flat roman numeral on the skill row).

**Constraint:** Must fit the same horizontal space. The five resources are a core combat mechanic -- they gate which skills the player can cast.

---

## Problem 3: Battle log disconnects choice from outcome

**Current state:** When a player picks HEART stance + ATTACK action, the battle log says:

> "You chose ATTACK (Heart stance)"
> "Applied: Fleeting Kindness."

This was recently improved from just "You apply Fleeting Kindness" (which was even more confusing). But the named effect ("Fleeting Kindness") still appears without context -- the player doesn't know what it does until they see damage numbers or stat changes later.

**What I need:** A battle log entry format that connects the player's choice to the mechanical effect. The two-line format is a step in the right direction. Consider whether the log entry should also show the effect's mechanical payload (e.g., "+1 physical attack, 2 rounds") or whether that belongs in a tooltip on the effect name. The log is 78px tall with 11px serif text -- space is tight.

**Constraint:** The log must remain compact (it's a scrollable window, not a full-screen view). Entries need color coding by severity (damage=blood, crit=sulfur, heal=green, effect=rust, info=bone). The lore-first voice ("Fleeting Kindness" not "Heart Attack Buff") must stay.

---

## Problem 4: LET phase numbers tell no story

**Current state:** The LET (outcome) phase shows:

> YOU -2 vs FOE 16
> "no blow lands"

Or:

> YOU 21 vs FOE 0
> "no blow lands"

The numbers are raw roll results from the engine. A negative number, a positive number, and a text verdict. The player has no idea what threshold determines a hit, what the numbers are derived from, or why both sides can show "no blow lands" with wildly different numbers.

**What I need:** A resolution display that helps the player understand what happened. This is the climactic moment of each round -- it should feel like a reveal, not a data dump. Consider: showing the comparison as a visual (bar vs bar, scale tipping, etc.), labeling what the numbers represent ("Your attack roll" vs "Foe's defense"), or showing the threshold ("needs 10+ to land"). The verdict text ("no blow lands" / "the blow lands true") is good -- it just needs context for the numbers above it.

**Constraint:** Keep the dramatic pacing. The LET phase should feel like opening an envelope, not reading a spreadsheet. The existing verdicts are well-written and should stay.

---

## Problem 5: Encounter modal jargon on FIGHT/FLEE

**Current state:** Before combat begins, the encounter modal shows two buttons:

- **FIGHT**: subtitle "ii -- lx vitae -- adv. unknown"
- **FLEE**: subtitle "forfeit the path -- -ii morale"

"ii" = enemy level 2. "lx vitae" = 60 health points. "adv. unknown" = advantage not yet scouted. "-ii morale" = costs 2 morale. This is the game's lore-first voice working against the player -- they need to make an informed fight-or-flee decision but can't decode the terms.

**What I need:** Keep the lore text but add a decode layer. The existing TapTooltip system (dark panel, accent-colored border, auto-dismiss) can handle this -- tapping "lx vitae" would show "60 health points", tapping "adv. unknown" would show "Advantage: not yet scouted." But the design question is: should the tooltips be enough, or should there be a secondary "plain language" line under the lore text? And should the morale cost be more prominent given that morale has no display surface anywhere else in the game?

**Constraint:** The lore text itself must not change. The decode layer sits on top. The encounter modal already has corner rivets, chain bars, and a seal glow -- it's visually dense, so any additions need to not overcrowd.

---

## Problem 6: Morale is invisible

**Current state:** Morale is referenced as a flee cost ("-ii morale") but has no display surface anywhere in the game. After fleeing, the modal closes silently -- no feedback, no confirmation, no indication that morale was spent. The player has no way to track their morale or understand what happens when it runs out.

**What I need:** Two things: (1) A morale indicator visible on the exploration screen (the WILDS tab) or the SELF tab, so the player can track the resource. (2) A brief narrative beat after fleeing, matching the death/victory prose style (e.g., "The pilgrim turned away. The path remembers."). The narrative beat is a code task, but the morale bar/indicator is a design question -- where does it live, how does it look, and how does it communicate "when this runs out, bad things happen"?

**Constraint:** Must fit the existing dark aesthetic. The exploration screen already has a player info strip (name, level, leagues) and a travel section. The SELF tab has base stats, derived stats, and an alignment cube. The morale bar needs to feel like it belongs in one of these surfaces.

---

## Design language reference

**Fonts:**
- Pirata One -- screen headers, phase labels, enemy names
- IM Fell English -- body text, descriptions, prose
- Bebas Neue -- stat labels, HUD values, small caps

**Color tokens:**
| Token | Hex | Usage |
|-------|-----|-------|
| parchment | #e8dfc8 | Primary text, UI chrome |
| blood | #c0152a | Damage, enemy accent, health bars |
| sulfur | #d4c026 | Active/selected state, player emphasis, crits |
| rust | #9e3a1a | Effects, fire, secondary accent |
| bone | #8a8273 | Muted text, info entries |
| ash | #3a3530 | Borders, dimmed/depleted state |
| panelBg | #100d0a | Panel backgrounds |
| deepBg | #06050a | Card/modal backgrounds |
| bg | #0a0a0a | Canvas black |

**Chrome elements:** Corner rivets (PtRivet), chain bars (diamond strand pattern), 1px borders, dashed-border log boxes, dotted hairlines as dividers.

**Existing delight to preserve:** Death prose, victory aftermath flavor text, XP chain metaphor, node description flavor text, philosophical alignment system, paperdoll inventory display. These are the game's strongest moments -- don't dilute them.

---

## Deliverables

For each of the six problems, I need:
1. A screen mockup showing the proposed solution in context (dark background, real content, mobile viewport ~375pt wide)
2. Annotation of which tokens/fonts/spacing values to use
3. Any new components called out (e.g., "MoraleBar", "ResolveScale", "CrucibleLabel")

The mockups should use real game content -- real stance names, real skill names, real enemy names -- not lorem ipsum. The game's world is a dark-fantasy TTRPG with philosophical themes; placeholder text breaks the mood.
