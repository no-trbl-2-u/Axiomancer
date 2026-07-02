# Playtest Report

> Date: 2026-05-25
> Commit: d560e8c
> Build: web (localhost)
> Paths walked: A, B, C, D

## Session Narrative

I loaded the game and was dropped directly into the WILDS map -- a dark, atmospheric node graph of a Fishing Village on a coastal continent. There was no title screen, no tutorial, and no introduction. As a first-time player, I had no idea what "PILGRIM" meant, what I was doing here, or what the icons on the map signified. Despite this, the atmosphere was immediate and compelling: Pirata One headers, evocative node names like "Hanged Wood" and "Drowned Shrine," and a map that felt like a worn parchment chart. The visual design communicated "dark TTRPG" before I read a single word.

Travel felt intuitive once I understood the "WHITHER, PILGRIM?" section was my action menu. I moved from the Hovel to the Dock (I league), then to the Tide Pool where an encounter triggered automatically. The encounter modal introduced a WET HOUND with FIGHT and FLEE options, but the subtext under each option was dense with unexplained jargon: "ii - lx vitae - adv. unknown" for FIGHT and "forfeit the path - -ii morale" for FLEE. I chose to fight. Combat presented a rock-paper-scissors stance system (Heart/Body/Mind) that was elegant in concept but poorly introduced. I chose Heart and attacked, but the battle log said "You apply Fleeting Kindness" rather than describing an attack. The LET phase showed cryptic numbers (-2 vs 16) that both resulted in "no blow lands." I was confused about what happened mechanically. In round two, the enemy dealt 13 damage, dropping me from 10 to 0 VITAE, and I died.

The death screen was one of the finest moments in the session. "The pilgrim sat down to rest, and did not stand up. The page closed without ceremony." This single sentence did more worldbuilding than any tutorial could. I began again, traveled back to Tide Pool, and this time chose FLEE. The encounter simply vanished -- no animation, no confirmation, no feedback about the morale cost. I had no idea where morale was tracked or what losing it meant. I then explored all four tabs: SELF showed a deep character sheet with a novel philosophical alignment system, MEMOIR was bare but atmospheric, and SATCHEL had a well-organized inventory with a charming paperdoll display. Finally, I fought and defeated a Sea-Mist Wisp at the Hanged Wood, earning 10 XP and experiencing the victory screen -- another narrative highlight with the text "it set the bell down, slow. the bell did not ring."

## Findings

### [x] [F01] No title screen or onboarding
- severity: high
- type: flow-gap
- location: app entry
- path: A
- observation: The game loads directly to the WILDS map with no title screen, tutorial, welcome, or explanation of what I am or what to do.
- expected: A first-time player expects some orientation -- even a single sentence like "You are a Pilgrim. Explore the Wilds."
- screenshot: The initial load showed the WILDS tab map with player info, node graph, and travel options, but no introductory content.
- impact: New players have no context for the game's vocabulary (PILGRIM, VITAE, LEAGUES, TRODDEN/OPEN/SHUT) or goals. The learning curve starts vertical.
- resolved: design-spec -- title card before map

### [x] [F02] Combat jargon on encounter modal is unexplained
- severity: high
- type: confusion
- location: encounter modal (FIGHT/FLEE buttons)
- path: A
- observation: The FIGHT button shows "ii - lx vitae - adv. unknown" and FLEE shows "forfeit the path - -ii morale." "lx vitae," "adv. unknown," and "morale" are not defined anywhere visible.
- expected: A first-time player needs to understand costs before committing. Something like "Enemy Level 2, 60 HP, Advantage: Unknown" would be clearer.
- screenshot: The encounter modal showed WET HOUND with two action buttons containing dense Roman numeral jargon.
- impact: Players cannot make informed FIGHT vs FLEE decisions when they do not understand the information presented.
- critique-xref: see CRITIQUE.md [HIGH] Combat UX unintuitive
- resolved: design-spec -- tooltip decode layer on encounter jargon

### [x] [F03] FLEE gives no visible feedback or morale indication
- severity: high
- type: feedback-missing
- location: encounter modal / exploration map
- path: B
- observation: After clicking FLEE, the encounter modal simply closes. No animation, no toast, no confirmation. The cost says "-ii morale" but morale is not displayed anywhere on any screen. There is no way to know if morale was deducted or what effect it has.
- expected: Some feedback after fleeing: a brief message ("You fled. Morale -2."), and morale visible on the character sheet or HUD.
- screenshot: After fleeing, the map looked identical to before except the ENCOUNTER label was gone from the node.
- impact: A core game mechanic (morale) appears to have no UI surface at all, making the flee cost invisible.
- resolved: both -- flee narrative (code) + morale bar on exploration/SELF (design)

### [x] [F04] Battle log action does not match player's choice
- severity: high
- type: confusion
- location: combat modal, battle log
- path: A
- observation: I chose HEART stance and ATTACK action. The battle log reported "You apply Fleeting Kindness" -- a named ability rather than a description of attacking. In a later round with BODY stance, it said "You apply Ad Baculum." There is no explanation of what these named effects are or how they relate to my chosen action.
- expected: If I choose ATTACK, I expect the log to say something like "You attack" or at minimum explain that "Fleeting Kindness" is the Heart-stance attack effect.
- screenshot: The battle log showed "You apply Fleeting Kindness. Foe apply Fleeting Kindness. Foe strikes -- you take 0 damage." after I chose Heart/Attack.
- impact: Players cannot learn the combat system when the feedback uses unexplained terminology that does not map to their inputs.
- critique-xref: see CRITIQUE.md [HIGH] Combat UX unintuitive
- resolved: phase-candidate -- two-line battle log (action line + effect line)

### [x] [F05] LET phase numbers are opaque
- severity: medium
- type: confusion
- location: combat modal, IV - LET phase
- path: A
- observation: The LET phase shows "YOU -2" vs "FOE 16" with both resulting in "no blow lands." In another round, "YOU 21" vs "FOE 0" also showed "no blow lands" for both sides. The relationship between these numbers and actual damage is unclear.
- expected: A first-time player expects the numbers to clearly indicate damage dealt, hit/miss outcomes, or some comprehensible comparison.
- screenshot: The LET phase showed large numbers (-2 vs 16) side by side with flavor text but no explanation of what the numbers mean.
- impact: The climactic moment of each combat round is presented with numbers that tell no story to uninstructed players.
- critique-xref: see CRITIQUE.md [HIGH] Combat UX unintuitive
- resolved: intended

### [x] [F06] CRUCIBLE symbols are unexplained
- severity: medium
- type: confusion
- location: combat modal, II - DO phase
- path: A
- observation: The DO phase shows "CRUCIBLE" with five half-circle/circle glyphs (half-left, half-right, half-top, half-bottom, full circle) each with numeric values (2, 1, 2, 1, 1). No labels or tooltips explain what these represent.
- expected: Some indication of what these values mean -- stats, resources, dice pools, or similar.
- screenshot: Five cryptic circle-variant symbols with numbers appeared above the action buttons in the DO phase.
- impact: A potentially interesting resource mechanic is invisible to players who cannot decode the symbols.
- critique-xref: see CRITIQUE.md [HIGH] Combat UX unintuitive
- resolved: design-spec -- tap-tooltips on each crucible glyph

### [x] [F07] Mind stance card clipped at right edge
- severity: medium
- type: visual
- location: combat modal, I - STAND phase
- path: A
- observation: When the three stance cards (Heart, Body, Mind) are displayed horizontally, the Mind card on the right is partially cut off. Its ATTACK, SKILL, and DEFENSE values are not fully visible. The text "BEATS HEART - WEAK BOD" truncates.
- expected: All three stance cards should be fully visible without horizontal clipping.
- screenshot: The stance selection showed three cards side by side, with the rightmost (Mind) having its stats and text cut off at the screen edge.
- impact: Players cannot compare all three stance options equally when one is partially hidden.
- critique-xref: see CRITIQUE.md [MED] Space heart/body/mind buttons evenly
- resolved: phase-candidate -- shrink stance cards to fit viewport

### [x] [F08] "Explain" buttons on SELF tab produce no visible output
- severity: medium
- type: feedback-missing
- location: SELF tab (character screen)
- path: C
- observation: The SELF tab has many "Explain" buttons (Explain HEART stat, Explain PHYSICAL attack, Explain Body Save, etc.). Clicking "Explain HEART stat" produced no visible tooltip, popover, or change to the screen.
- expected: Tapping an "Explain" button should show a tooltip or overlay explaining the stat.
- screenshot: The SELF tab looked identical before and after tapping the HEART stat explain button.
- impact: The character sheet is dense with unexplained stats; the explain mechanism that would help new players appears non-functional.
- critique-xref: see CRITIQUE.md [MED] Verify all tooltip content is 100% accurate
- resolved: phase-candidate -- wire Explain buttons to existing TapTooltip system

### [x] [F09] "encounters survived: i" on death screen when the player died in the encounter
- severity: medium
- type: inconsistency
- location: death/defeat screen, LEDGER section
- path: A
- observation: After dying to the Wet Hound in the only encounter I entered, the LEDGER showed "encounters survived: i" (1). I did not survive the encounter -- I died in it.
- expected: Either "encounters survived: 0" or a different metric like "encounters entered: 1."
- screenshot: The death screen LEDGER showed "rounds endured: iii, encounters survived: i, deepest node: fv-14."
- impact: Minor confusion but undermines trust in the game's internal accounting.
- resolved: phase-candidate -- fix encounter counter logic + resolve node ID to name

### [x] [F10] Deepest node shows internal ID instead of human-readable name
- severity: low
- type: confusion
- location: death/defeat screen, LEDGER section
- path: A
- observation: The LEDGER shows "deepest node: fv-14" -- this is a system identifier, not a location name. The node's name is "Tide Pool."
- expected: "deepest node: Tide Pool" or similar human-readable label.
- screenshot: The death screen showed "deepest node: fv-14" in the LEDGER section.
- impact: Breaks immersion on the death screen by exposing internal data.
- resolved: phase-candidate -- bundled with F09 presenter fix

### [x] [F11] Tapping sealed map nodes gives no feedback
- severity: low
- type: feedback-missing
- location: WILDS tab, node graph
- path: D
- observation: Sealed nodes on the map are rendered as buttons with cursor:pointer and are clickable, but tapping one (Black Cairn, sealed) produces no visual response -- no tooltip, no "this path is sealed" message, nothing.
- expected: Either nodes should not look tappable when sealed, or tapping should show a brief message like "This path is sealed. Reach it from an adjacent open node."
- screenshot: The map was unchanged after tapping the sealed Black Cairn node.
- impact: Players who try to tap sealed nodes get no guidance on how to reach them.
- resolved: phase-candidate -- tap shows "path sealed" toast

### [x] [F12] ITEM action in combat is always disabled with no explanation
- severity: low
- type: confusion
- location: combat modal, II - DO phase
- path: A
- observation: The ITEM action button ("USE A CONSUMABLE") is consistently greyed out and disabled during combat, even though I have a Healing Potion in my inventory.
- expected: Either the Healing Potion should be usable in combat, or there should be a reason shown for why ITEM is unavailable (e.g., "No combat items" or "Items unlocked at level 2").
- screenshot: The DO phase showed ATTACK, DEFEND, SKILL as clickable but ITEM was greyed out and unresponsive.
- impact: Players with healing items may feel frustrated that they cannot use them when most needed.
- resolved: phase-candidate -- tooltip on disabled ITEM button explaining unavailability

### [x] [F13] Nested button HTML violation in inventory item cards
- severity: low
- type: bug
- location: SATCHEL tab, item detail view
- path: C
- observation: The console logged two errors about `<button>` elements nested inside other `<button>` elements. This occurs in the Healing Potion item card where the USE and DISCARD action buttons are rendered inside the item's parent button element.
- expected: Valid HTML structure where interactive action buttons are not nested inside another button.
- screenshot: No visual manifestation, but the console showed the nested button error with full component stack trace pointing to ItemCard containing USE/DISCARD buttons.
- impact: Screen readers and assistive technology may not function correctly. May cause hydration mismatches.
- critique-xref: see CRITIQUE.md [MED] Satchel equipment tap should open modal directly
- resolved: phase-candidate -- bundled with Satchel equipment tap redesign (CRITIQUE row)

## Delight Log

### [D01] Death narrative prose
- severity: n/a
- type: delight
- location: death/defeat screen
- path: A
- observation: "Not a great wound; a steady one. The pilgrim sat down to rest, and did not stand up. The page closed without ceremony." This death text is outstanding -- it transforms a game-over screen into a moment of quiet narrative beauty. The framing of death as "the page closes" fits the book/manuscript metaphor perfectly.
- impact: Elevates the death screen from a failure state to an experience worth having.

### [D02] Victory aftermath flavor text
- severity: n/a
- type: delight
- location: combat victory screen
- path: A
- observation: After defeating the Sea-Mist Wisp, the final blow text read: "it set the bell down, slow. the bell did not ring. the wet ground took the rest." This prose is evocative, strange, and beautiful. It makes even a trivial encounter feel like a moment in a story.
- impact: Rewards players with literary moments that make combat feel meaningful beyond mechanical progression.

### [D03] XP chain visual metaphor
- severity: n/a
- type: delight
- location: SELF tab
- path: C
- observation: The XP progress bar is rendered as a chain of links that fill as experience accumulates. "XP CHAIN TO LVL 2: 0/1000" with a row of empty chain links below. This is a thematically perfect metaphor for progression in a dark-fantasy world -- you are chained to your advancement.
- impact: A small detail that shows strong design coherence between mechanics and aesthetic.

### [D04] Node description flavor text in travel options
- severity: n/a
- type: delight
- location: WILDS tab, WHITHER PILGRIM travel options
- path: A
- observation: Each travel destination has a one-line description in uppercase: "FISHING BOATS BOB AGAINST THE ROTTING PIER." for the Dock, "A COPSE WHERE THE FISHERS HANG THEIR DROWNED DEAD." for the Hanged Wood. These are consistently atmospheric and establish each location's character before arrival.
- impact: Turns the travel menu from a utilitarian list into a narrative moment that builds world-feel with every choice.

### [D05] Philosophical alignment system
- severity: n/a
- type: delight
- location: SELF tab, ALIGNMENT section
- path: C
- observation: The alignment system uses philosophical axes -- EPISTEMOLOGY, OUTLOOK, SCOPE -- resulting in labels like "Agnostic-Neutral-Relational." This is a bold and original departure from the typical Good/Evil, Lawful/Chaotic grid. It suggests the game will ask questions about knowledge, perspective, and connection rather than simple morality.
- impact: Signals intellectual ambition and gives the character sheet a distinctive identity that separates this game from its peers.

### [D06] SATCHEL paperdoll equipment display
- severity: n/a
- type: delight
- location: SATCHEL tab, WORN UPON THE BODY section
- path: C
- observation: The inventory shows a simple line-art character silhouette flanked by equipment slots. Equipped items (Leather Cap, Cloth Wrap, Iron Blade) show icons while empty slots display the null symbol. The layout is clean and immediately legible.
- impact: Makes equipment management feel tactile and visual rather than purely list-based.

## Paths Walked

### Path A: Golden Path
1. **Title/Entry**: No title screen. App loaded directly to the WILDS map at the Hovel. No tutorial or onboarding.
2. **Exploration**: Traveled from Hovel to Dock (I league). Map updated, new nodes opened. Traveled from Dock to Tide Pool (I league) where an encounter triggered.
3. **Encounter**: WET HOUND, level 2, 60 hp. FIGHT and FLEE options with jargon-heavy subtext. Chose FIGHT.
4. **Combat**: Selected HEART stance, chose ATTACK. Round resolved with "Fleeting Kindness" effect. LET phase showed -2 vs 16, both "no blow lands." Selected MIND (ADV) stance for round 2, attacked again. Took 13 damage (from 10 HP to 0).
5. **Resolution**: Died. Death screen with narrative text and LEDGER.
6. **Aftermath**: "BEGIN AGAIN" button reset the game to Hovel with fresh state.

### Path B: Failure Path
1. **FLEE**: After beginning again, traveled to Tide Pool again. Encountered TIDEPOOL CRAB (level 1, 20 hp). Chose FLEE. The encounter modal closed silently. No feedback about morale cost. The node's ENCOUNTER label was removed.
2. **Losing**: Already covered in Path A -- died to WET HOUND in 3 rounds. Death screen was well-crafted narratively but showed inconsistent "encounters survived: i" despite dying in the encounter.

### Path C: Tab Exploration
1. **SELF**: Dense character sheet with BASE stats (Heart/Body/Mind all 1), DERIVED table (ATK/SKL/DEF across Physical/Mental/Emotional), SAVES & TESTS, ALIGNMENT (Agnostic-Neutral-Relational), AFFLICTIONS & BLESSINGS (none), and WORN & WIELDED equipment. Explain buttons did not produce visible output.
2. **SATCHEL**: Well-organized inventory. Header showed SHILLING (0 gold), BURDEN 4/50. Paperdoll equipment display. Filter tabs (ALL, WORN, PHIALS, STUFF, SEALED). Items showed details on tap -- Healing Potion had USE and DISCARD buttons. Console errors from nested buttons.
3. **MEMOIR**: Sparse but atmospheric. THE BOOK OF DEEDS, A CHRONICLE ("the page is bare"), ERRANDS ("no errands written here"), MEASURE with UNDECLARED and UNTESTED cards.
4. **WILDS**: Returned and noted map state persistence, node labels, and legend clarity.

### Path D: Edge Cases
- **Sealed nodes**: Tapped Black Cairn (sealed) on the map. No response -- no tooltip, no message, no visual change despite the node being rendered as a clickable button.
- **NODE GRAPH label**: Tapped the "NODE GRAPH" text in the map header. No response.
- **Tab switching**: Navigated between all four tabs rapidly. Transitions were smooth with no visual glitches or loading states.

## Console and Network

- Errors: 3 total
  - 1 x 404 from manual navigation to `/self` (not a real route; tabs use `/character`)
  - 2 x nested `<button>` HTML violation in Healing Potion item card (USE/DISCARD buttons nested inside item button)
- Warnings: 3 (React-related, non-novel)
- Slow requests: none observed
