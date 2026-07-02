# Design Spec -- Playtest Findings

> Generated: 2026-05-25
> Source: plan/PLAYTEST_REPORT.md (2026-05-25)
> For: Claude Design handoff
> Project: https://claude.ai/design/p/019e0f5a-a0f0-753b-be1e-8939e6011384

## Context

Axiomancer Mobile is a dark-fantasy TTRPG game (React Native / Expo). A first-time playtester walked through the game and identified UX issues that need design attention. The game has a dark, arcane aesthetic using Pirata One, IM Fell English, and Bebas Neue fonts with a near-black color palette.

The game has four tab screens: WILDS (exploration map), SELF (character stats), SATCHEL (inventory/equipment), MEMOIR (journal). Combat happens in modal overlays with four phases: STAND (pick stance), DO (pick action), CLASH (resolution), LET (outcome).

All game copy must live on presenters (view-model layer), not as display literals in the view layer.

## Preserve (Delight Points)

These elements are working well and must be preserved in any redesign.

### Death narrative prose [D01]
- What works: "The pilgrim sat down to rest, and did not stand up. The page closed without ceremony." Death text transforms a game-over screen into quiet narrative beauty. The "page closes" framing fits the book/manuscript metaphor.
- Why it works: Elevates the death screen from failure to an experience worth having.
- Constraint: preserve this prose style and emotional tone in any redesign of the death/defeat screen.

### Victory aftermath flavor text [D02]
- What works: "it set the bell down, slow. the bell did not ring. the wet ground took the rest." Evocative, strange, beautiful prose on combat victory.
- Why it works: Rewards players with literary moments that make combat feel meaningful.
- Constraint: preserve victory prose. Any combat UX overhaul must keep the narrative flavor intact.

### XP chain visual metaphor [D03]
- What works: XP progress bar rendered as a chain of links that fill. "XP CHAIN TO LVL 2: 0/1000."
- Why it works: Thematically perfect for dark-fantasy progression.
- Constraint: preserve the chain metaphor for XP display.

### Node description flavor text [D04]
- What works: Each travel destination has a one-line uppercase description: "FISHING BOATS BOB AGAINST THE ROTTING PIER."
- Why it works: Turns the travel menu from utilitarian list into narrative moment.
- Constraint: preserve these descriptions in any map/travel redesign.

### Philosophical alignment system [D05]
- What works: Alignment uses philosophical axes (EPISTEMOLOGY, OUTLOOK, SCOPE) instead of Good/Evil.
- Why it works: Distinctive identity that separates this game from peers.
- Constraint: preserve in any character sheet redesign.

### SATCHEL paperdoll display [D06]
- What works: Line-art character silhouette with equipment slots. Clean and immediately legible.
- Why it works: Makes equipment management tactile and visual.
- Constraint: preserve the paperdoll layout in any inventory redesign.

## Fix (Design Issues)

### Issue 1: Title card before map [from F01]
- Problem: The game loads directly to the WILDS map with no title screen, welcome, or orientation. New players have zero context for vocabulary (PILGRIM, VITAE, LEAGUES) or goals. The learning curve starts vertical.
- Current behavior: App boots straight to the WILDS exploration map at the Hovel.
- Desired outcome: A brief title card shown once before the first WILDS load. Sets the tone and provides minimal vocabulary. Something like "You are a Pilgrim. The Wilds await." -- atmospheric, not tutorializing. Shown only on first launch or after BEGIN AGAIN.
- Affected screens: New screen (title card overlay before WILDS tab)
- Constraints: Must match the dark, arcane aesthetic (Pirata One for headers, IM Fell English for body). No tutorial -- just tone-setting. Copy lives on the presenter, not the view.
- Priority: high

### Issue 2: Tooltip decode layer on encounter modal [from F02]
- Problem: FIGHT shows "ii - lx vitae - adv. unknown" and FLEE shows "forfeit the path - -ii morale." The Roman numeral and lore-first language is the intended voice, but players cannot make informed FIGHT vs FLEE decisions when they cannot decode the terms.
- Current behavior: Dense jargon on encounter action buttons with no explanation.
- Desired outcome: Keep the lore-first text but add tap-tooltips on key terms. Tapping "lx vitae" should show a tooltip like "60 health points." Tapping "adv. unknown" should show "Advantage: not yet scouted." Preserves voice while adding a decode layer for new players.
- Affected screens: Encounter modal (FIGHT/FLEE buttons and their subtitles)
- Constraints: Tooltips should use the existing TapTooltip visual system (dark panel, accent-colored border). The lore text itself must not change -- the decode layer sits on top.
- Priority: high

### Issue 3: Flee narrative + morale bar [from F03]
- Problem: After fleeing an encounter, the modal closes silently. No confirmation, no animation, no indication that morale was spent. Morale is referenced as a cost ("-ii morale") but has no display surface anywhere in the game.
- Current behavior: FLEE closes the encounter modal with no feedback. Morale is invisible.
- Desired outcome: Two pieces: (1) A short narrative beat after fleeing, matching the death/victory prose style (e.g. "The pilgrim turned away. The path remembers."). (2) A morale indicator visible on the exploration card or SELF tab, so the player can track the cost.
- Affected screens: Encounter modal (post-flee feedback), WILDS tab (morale display), SELF tab (morale in character stats)
- Constraints: Morale bar must fit the existing dark aesthetic. The flee narrative should be as tonally strong as the death/victory prose -- preserve the literary voice.
- Priority: high

### Issue 4: Tap-tooltips on CRUCIBLE glyphs [from F06]
- Problem: The DO phase in combat shows "CRUCIBLE" with five half-circle/circle glyphs, each with a numeric value. No labels or tooltips explain what these symbols represent (they map to the five resource pools used in combat).
- Current behavior: Five cryptic symbols with numbers, no explanation.
- Desired outcome: Each crucible glyph gets a tap-tooltip showing its resource name and what the number means (e.g. "Physical Attack: 2"). Uses the existing TapTooltip system with stance-colored accents.
- Affected screens: Combat modal, II - DO phase, CRUCIBLE section
- Constraints: Use the existing TapTooltip visual system. Accent colors should match the resource's associated stat (body/rust, mind/sulfur, heart/blood).
- Priority: medium

## Summary for Designer

Axiomancer Mobile needs four design interventions based on a first-time playtest: (1) a title card that sets tone without tutorializing, (2) a tooltip decode layer over the encounter modal's lore-first jargon, (3) a flee feedback narrative + visible morale bar, and (4) tap-tooltips on the CRUCIBLE combat resource glyphs. The game's strongest assets -- death prose, victory flavor text, XP chain metaphor, node descriptions, philosophical alignment, and paperdoll inventory -- must be preserved. The overall goal is to make the game's depth accessible to new players without diluting its literary voice.
