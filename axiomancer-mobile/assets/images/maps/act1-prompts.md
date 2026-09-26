# Act 1 plates: generation prompts

The prompts behind `act1-*.webp` (provenance: `provenance.json`, last
entry). T ran them in ChatGPT on 2026-09-25. These are the prompts as the
agent handed them to T. T may have made small edits before submitting,
such as adding the reference-image lines.

Order of generation: mountains and underworld first, from the first-round
prompts. Coast and forest came next, from second-round prompts written
after reviewing those two plates, with both plates attached as style
references.

The plates are one 2×2 world:

```
┌──────────────┬──────────────┐
│ coast        │ forest       │
├──────────────┼──────────────┤
│ mountains    │ underworld   │
└──────────────┴──────────────┘
```

## Mountains (bottom-left), first round

```
Antique engraved map illustration in the style of a 19th-century steel engraving / woodcut plate by Gustave Doré: black ink crosshatching on warm aged parchment, no color, dramatic chiaroscuro. Extremely fine, crisp linework. Seen from a high bird's-eye oblique view, looking down at about 45 degrees, far side at the top. Light falls from the upper left.

RESOLUTION: square 1:1 composition, rendered at the highest resolution available (2048×2048 or larger if possible). Every line must stay sharp at full size — no blur, no soft or smudged areas.

CONTEXT: This image is ONE REGION of a larger world map — the BOTTOM-LEFT quarter of a 2×2 grid. It will be placed edge-to-edge beside three other images, so it must work as a complete, self-contained landscape on its own while its edges match the neighbouring regions described below. Do not show the other regions and do not draw any frame or margin.

REGION — A MOUNTAIN FASTNESS. Jagged peaks, crags and deep gorges. Landmarks (about 15, spread evenly across the whole image — top, bottom, left, right and centre, never stacked in one line):
a castle on a crag; switchback roads; a waterfall gorge; a cliffside monastery; mine entrances with spoil heaps; a rope bridge over a chasm; a shepherds' village on a high meadow; a toll gate in a narrow pass; an avalanche-ruined chapel; a hanging-valley lake; a dwarf-built stone gate; a watch-fire beacon on a summit; a quarry; a mountain inn; a frozen glacier shrine.

The landmarks are joined by a visible web of roads, trails, stairs and bridges that branch and loop in every direction like a spider's web, not one path climbing upward. Each landmark sits on a small open, lightly hatched clearing so it reads clearly at a glance. Keep the linework dense but with calm, lighter-toned open ground between landmarks. Few people: at most a handful of tiny travellers.

EDGES: A low rocky ridge runs the full width of the TOP edge. A sheer wall of rock runs the full height of the RIGHT edge, the roots of the mountains. One road crosses the ridge through a pass at the middle of the top edge. One mine tunnel enters the rock wall at the middle of the right edge. The top-right corner is quiet open ground.

No text, no labels, no lettering, no legend, no compass rose, no ornamental border or frame, no corner decorations, no sun or moon medallions. Edge-to-edge illustration.
```

## Underworld (bottom-right), first round

```
Antique engraved map illustration in the style of a 19th-century steel engraving / woodcut plate by Gustave Doré: black ink crosshatching on warm aged parchment, no color, dramatic chiaroscuro. Extremely fine, crisp linework. Seen from a high bird's-eye oblique view, looking down at about 45 degrees, far side at the top, as if the cavern roof has been cut away. Light falls from the upper left.

RESOLUTION: square 1:1 composition, rendered at the highest resolution available (2048×2048 or larger if possible). Every line must stay sharp at full size — no blur, no soft or smudged areas.

CONTEXT: This image is ONE REGION of a larger world map — the BOTTOM-RIGHT quarter of a 2×2 grid. It will be placed edge-to-edge beside three other images, so it must work as a complete, self-contained landscape on its own while its edges match the neighbouring regions described below. Do not show the other regions and do not draw any frame or margin.

REGION — A VAST UNDERWORLD OF CAVERNS. Enormous chambers, pillars of rock and bottomless drops. Landmarks (about 15, spread evenly across the whole image — top, bottom, left, right and centre, never stacked in one line):
a subterranean lake with a ferry; a candlelit cathedral carved into rock; aqueduct bridges over chasms; stairways descending into darkness; the throne of a sleeping giant; a mushroom forest; an underground market in a grotto; a bone ossuary; a forge by a lava channel; a dark fortress gate; a crystal grotto; a drowned temple half under water; an ancient ruined city; a lantern-lit ferry landing; a sealed vault door.

The landmarks are joined by a visible web of roads, trails, stairs and bridges that branch and loop in every direction like a spider's web, not one path climbing upward. Each landmark sits on a small open, lightly hatched clearing so it reads clearly at a glance. Keep the linework dense but with calm, lighter-toned open ground between landmarks. Few people: at most a handful of tiny travellers.

EDGES: The TOP edge is the underside of a great cliff, with pale cavern mouths letting in faint daylight from the surface. The LEFT edge is a sheer wall of rock, the roots of the mountains. One carved stairway comes down from a cavern mouth at the middle of the top edge. One mine tunnel emerges from the rock wall at the middle of the left edge. The top-left corner is quiet open ground.

No text, no labels, no lettering, no legend, no compass rose, no ornamental border or frame, no corner decorations, no sun or moon medallions. Edge-to-edge illustration.
```

## Coast (top-left), second round

```
REFERENCE: Two finished plates from this same map are attached — the mountain plate (bottom-left quarter) and the underworld plate (bottom-right quarter). Match their exact engraving style, parchment tone, line weight, hatching technique and viewing angle, so all the plates look like one continuous engraving by the same hand.

STYLE: Antique engraved map illustration in the style of a 19th-century steel engraving / woodcut plate by Gustave Doré: black ink crosshatching on warm aged parchment, dramatic chiaroscuro. Extremely fine, crisp linework. Seen from a high bird's-eye oblique view, looking down at about 45 degrees, far side at the top. Light falls from the upper left. Strictly monochrome ink on parchment — NO color anywhere, including fire, lamps, lighthouse beams and sunlight; show light purely with white parchment and hatching.

RESOLUTION: square 1:1 composition, rendered at the highest resolution available (2048×2048 or larger if possible). Every line must stay sharp at full size — no blur, no soft or smudged areas.

CONTEXT: This image is ONE REGION of a larger world map — the TOP-LEFT quarter of a 2×2 grid. It will be placed edge-to-edge beside three other images, so it must work as a complete, self-contained landscape on its own while its edges match the neighbouring regions described below. Do not show the other regions and do not draw any frame or margin.

REGION — A STORM-BATTERED COAST. The open sea fills the left and top-left, with waves breaking against the cliffs. This is the most open, airy region of the map: leave noticeably MORE pale, lightly hatched open ground (sea, beaches, meadows, moorland) than the attached plates. Landmarks (about 15, spread evenly across the whole image — top, bottom, left, right and centre, never stacked in one line):
a lighthouse on a sea cliff; a crowded harbour town; stone piers with cranes; moored sailing ships; a shipwreck on the rocks; sea caves at the cliff foot; a clifftop chapel; a fishermen's hamlet; a customs house; a watchtower on a headland; a gallows hill; a windmill; a smugglers' cove; a walled manor; a ruined sea fort on a tidal island.

The landmarks are joined by a visible web of roads, trails, stairs and bridges that branch and loop in every direction like a spider's web, not one path climbing upward. Each landmark sits on a small open, lightly hatched clearing so it reads clearly at a glance. Keep the linework fine but calm between landmarks. Few people: at most a handful of tiny travellers.

EDGES:
- RIGHT edge: a wide river runs the full height of the edge, with the land on its far bank only just visible. One road meets the river at the middle of the right edge and crosses it on a stone bridge.
- BOTTOM edge: the land rises into rocky foothills and the first low crags of the mountains, in the same rock style as the mountain plate. One road climbs into those foothills slightly right of the middle of the bottom edge.
- The bottom-right corner is quiet, pale open ground.

No text, no labels, no lettering, no legend, no compass rose, no ornamental border or frame, no corner decorations, no sun or moon medallions. Edge-to-edge illustration.
```

## Forest (top-right), second round

```
REFERENCE: Two finished plates from this same map are attached — the mountain plate (bottom-left quarter) and the underworld plate (bottom-right quarter). Match their exact engraving style, parchment tone, line weight, hatching technique and viewing angle, so all the plates look like one continuous engraving by the same hand. This image sits directly ABOVE the underworld plate.

STYLE: Antique engraved map illustration in the style of a 19th-century steel engraving / woodcut plate by Gustave Doré: black ink crosshatching on warm aged parchment, dramatic chiaroscuro. Extremely fine, crisp linework. Seen from a high bird's-eye oblique view, looking down at about 45 degrees, far side at the top. Light falls from the upper left. Strictly monochrome ink on parchment — NO color anywhere, including fire, lanterns, candles and sunlight; show light purely with white parchment and hatching.

RESOLUTION: square 1:1 composition, rendered at the highest resolution available (2048×2048 or larger if possible). Every line must stay sharp at full size — no blur, no soft or smudged areas.

CONTEXT: This image is ONE REGION of a larger world map — the TOP-RIGHT quarter of a 2×2 grid. It will be placed edge-to-edge beside three other images, so it must work as a complete, self-contained landscape on its own while its edges match the neighbouring regions described below. Do not show the other regions and do not draw any frame or margin.

REGION — AN ANCIENT DARK FOREST. Old-growth woodland with a river winding through it. The forest is dark, but break it up with many pale glades, meadows, streams and clearings: leave noticeably MORE pale, lightly hatched open ground than the attached plates, so the landmarks and roads read clearly. Landmarks (about 15, spread evenly across the whole image — top, bottom, left, right and centre, never stacked in one line):
a colossal gnarled tree at the heart of the wood; a ruined shrine with toppled statues; a graveyard among great roots; a stone bridge over the river; a hermit's hut; a woodcutters' camp; a standing-stone circle; a charcoal burners' clearing; an abandoned hunting lodge; a hollow-tree chapel; a mossy well; a ruined watch-tower strangled by ivy; a woodland mill on a stream; a crossroads gibbet; a witch's cottage on stilts over a bog.

The landmarks are joined by a visible web of roads, trails, stairs and bridges that branch and loop in every direction like a spider's web, not one path climbing upward. Each landmark sits on a small open, lightly hatched clearing so it reads clearly at a glance. Keep the linework fine but calm between landmarks. Few people: at most a handful of tiny travellers.

EDGES:
- LEFT edge: a wide river runs the full height of the edge, with the forest coming down to its bank. One road meets the river at the middle of the left edge, reaching the end of a stone bridge.
- BOTTOM edge: the forest ends at the lip of sheer cliffs dropping into darkness — the roof of the underworld below. Three dark cavern mouths open in the cliff: one near the left, one at the centre, one near the right. One road reaches the centre cavern mouth and descends into it as a carved stone stairway.
- The bottom-left corner is quiet, pale open ground.

No text, no labels, no lettering, no legend, no compass rose, no ornamental border or frame, no corner decorations, no sun or moon medallions. Edge-to-edge illustration.
```
