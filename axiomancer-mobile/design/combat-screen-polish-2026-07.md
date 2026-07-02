# Combat Screen Polish — 2026-07 (reference-driven)

> Roadmap for the combat-screen UI/UX overhaul driven by three reference
> screenshots (a best-in-class mobile deckbuilder: combat screen, status-effect
> detail, card detail). Produced from a 5-lens multi-agent audit (layout,
> hierarchy, style, cards, modals — 53 findings) synthesized into one spec.
> Before/after screenshots live on the PR.

## What the references do that we didn't

1. **The battlefield is the screen.** Full-bleed scene art with a LARGE enemy;
   all HUD chrome floats over it. Ours stacked six bordered strips on flat black
   with a 64pt enemy portrait and a huge empty dashed "PLAY AREA" box.
2. **Icons + numbers, not labels.** The reference has almost no text chrome —
   no panel headers, no inline instructions. Ours said PLAY AREA / SIGNATURE
   SKILLS / DRAG A DIE ONTO YOUR CARD / DECK 4 · DISCARD 0, and named the enemy
   twice.
3. **Shaped, glowing chrome.** Circular medallions (portrait, end-turn), an
   emblem-anchored HP bar, square glowing status tiles with counts, hexagonal
   type badges, radial glows. Ours was 1px boxes.
4. **Detail views are theatre.** Dimmed backdrop, keyword explainer panels with
   gold titles + right-aligned type tags, one huge glowing centrepiece, a
   category badge pinned to the bottom edge.

## Region map (new layout, top → bottom)

- **Layer 0 — battlefield**: `CreatureScene` (moonlit scene + per-archetype
  figure, now with `preserveAspectRatio: slice` + `figureScale`) fills the band
  from the top edge to ~60% screen height; scrim gradients keep HUD legible;
  bottom 200pt gradient shelves the hand. Enemy lunge/floats ride the scene.
- **Top HUD**: enemy name (gothic, sulfur, shadowed) + `R·T` micro-meta; a
  full-width SVG HP bar with a central **crest** carrying the big HP number;
  intent as a compact colored badge (`⚔ 7`); enemy status tiles right.
- **Enemy stage**: hidden-stance hex badge floats at the figure's feet.
- **Play region**: invisible drop target over the battlefield; a dashed sulfur
  affordance appears **only while dragging a card**. Staged cards float as a
  centered row — bigger than hand cards, die-socket top-right, APPLY ribbon
  fused to the card's bottom edge.
- **Signature column**: left edge — conviction `◆ n` chip + 46pt circular rune
  chips (icon + cost badge). No names on the HUD (a11y labels keep everything).
- **Dice row**: free-floating gem dice (radial glow, gradient face, rim
  highlight) above the hand. No tray box, no instruction label.
- **Hand fan**: 112×168 art-forward cards, edge-to-edge arc, bottoms cropped
  below the screen edge; single keyword line under the name (the FREE/POWER
  fork lives on the APPLY ribbon + detail modal); stance orb top-left; sulfur
  shelf glow behind the fan.
- **Corner medallions**: player portrait in an 84pt circle with an HP arc ring
  (player hit FX + floats land here), bottom-left. 80pt END PHASE medallion
  (⧗, double rim, pulse glow) + 44pt ↻ NEW TURN disc, bottom-right. SCRAP
  becomes a blood medallion that appears only mid-drag.
- **Bottom rail**: 26pt strip — ♥ player HP · phase ledger pips · deck/discard
  mini-glyphs with counts.

## Modals

- **Card detail**: un-boxed stack on a deep-dimmed backdrop; keyword panels
  (sulfur 16pt titles, colored right-aligned type tags); the card at
  `min(300, screenW−72)` wide over a stance-colored radial halo; NO DIE / +DIE
  pills in the same panel language; close ✕ moved to the backdrop bottom-right
  (fixes the CONTROL→CONTR clip); color-match legend demoted to a 9pt footer.
- **Status tooltip**: rebuilt as a plaque — radial burst + ringed 96pt circle
  around a 40pt glyph, colored 26pt name, serif gloss, `intensity · turns`
  meta, hexagonal category badge straddling the bottom border.

## Invariants

- Every mechanic survives: stage-drag, die-drag, per-card APPLY (free/power),
  END PHASE, NEW TURN, signatures, SCRAP, inspect, status tooltips, intent
  telegraph, hidden stance, ledger, deck/discard counts, mercy, tutorial.
- Every `combat-*` testID and accessibility label/role survives.
- No new binary assets; everything is RN styles + react-native-svg.

## Build order

1. Battlefield layer + strip panel chrome (CombatBoard root, CreatureScene).
2. Top HUD merge: SVG HP bar + crest, intent badge, status tiles
   (CombatCombatantPane, IntentIcon).
3. Play-area dissolve + floating staged row with fused APPLY + die socket.
4. Hand fan + card face rework (size, footer → one line, stance orb, frame).
5. Corner medallions + bottom rail; player FX migrate to the medallion.
6. Signature rune column + conviction chip + dice gem treatment (CombatDie).
7. Card-detail modal theatre + close-button fix (CombatEncounterPanel).
8. Status-tooltip plaque + category badge.
