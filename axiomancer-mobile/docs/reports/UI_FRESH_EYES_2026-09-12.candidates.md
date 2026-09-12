# UI fresh-eyes 2026-09-12 — full candidate set

Every row the Observe fleet returned, sorted by severity. These are
CANDIDATES: they carry the reporting agent's confidence and suspected
source, and they have NOT been through an adversarial verify pass. Twenty-one
of them were verified individually and fixed — see the main report's section 3.
Treat the rest as leads, not as confirmed defects.

| # | sev | kind | screen | finding | conf | suspected source |
|---|---|---|---|---|---|---|
| C-001 | major | misunderstanding | 11-combat-preview / 12-combat-board / 21-hazard-deck | SURGE means three unrelated things | 85 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:653 and axiomancer-mobile/state/presenters/hazar |
| C-002 | major | misunderstanding | 11-combat-preview → 12-combat-board | threat preview says 'resolve', board says PLEA | 95 | axiomancer-mechanics/src/Combat/combat.threat.ts:342 |
| C-003 | major | misunderstanding | 05-character-fresh / 06-character-midgame | GRACE shown twice with two numbers on one screen | 100 | axiomancer-mobile/app/(tabs)/character/index.tsx:268 (pool, derived 0-10 from vm.morale) vs :385-388 (raw vm.m |
| C-004 | major | issue | 04-exploration-midgame / 05-character-fresh | GRACE is never defined and is the only pool with no tap-to-explain | 90 | axiomancer-mobile/app/(tabs)/character/index.tsx:262-285 |
| C-005 | major | misunderstanding | 12-combat-board | combat's core currency is a bare ◆ with no name | 95 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:183-185 |
| C-006 | major | misunderstanding | 12-combat-board | PLEA is a 0/42 bar on the enemy with no stated win condition | 85 | axiomancer-mobile/state/presenters/combat-encounter.engine.ts:1343 (alt-win meter) / CombatBoard sway meter |
| C-007 | major | misunderstanding | 16-rest / 18-cache / 21-hazard-deck | 'the deck' is ambiguous — the run has two | 90 | axiomancer-mobile/state/presenters/cache.copy.ts:20 ('One card, straight into the deck.') and axiomancer-mobil |
| C-008 | major | issue | 07-inventory-fresh → 12-combat-board | 'GRANTS THE STILLING' is never cashable in combat | 85 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:158-205 (SignatureColumn) |
| C-009 | major | issue | 05-character-fresh / 06-character-midgame → 24-dev | player-facing SELF tab links to the DEV TOOLS route | 100 | axiomancer-mobile/components/dev/DevToolsLink.tsx:38, mounted from app/(tabs)/character/index.tsx |
| C-010 | major | misunderstanding | 12-combat-board | ◆ means two different things on the combat board | 95 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:185 (`◆ {conviction}`) vs axiomancer-mobile/comp |
| C-011 | major | misunderstanding | 12-combat-board | my main combat resource is never named, only drawn as ◆ | 95 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:183-185 — "conviction" is in accessibilityLabel  |
| C-012 | major | misunderstanding | 11-combat-preview + 12-combat-board | PLEA and "resolve" are the same meter, one encounter | 95 | axiomancer-mechanics/src/Combat/combat.threat.ts:342 (`steadies ${swayCleanse} resolve`) vs axiomancer-mobile/ |
| C-013 | major | misunderstanding | 05-character-fresh / 06-character-midgame | GRACE printed twice with different numbers on one screen | 100 | axiomancer-mobile/app/(tabs)/character/index.tsx:268 (pool GRACE, `Math.round((morale + 100) / 20)`) vs axioma |
| C-014 | major | issue | 04-exploration-midgame / 05-character-fresh | GRACE is the second bar I ever see and is never defined there | 90 | axiomancer-mobile/components/StatusCard.tsx:70-71 (bar + gloss); axiomancer-mobile/app/(tabs)/character/index. |
| C-015 | major | issue | 04-exploration-midgame vs 06-character-midgame | GRACE reads 6/10 on the map and 5/10 on the sheet | 85 | axiomancer-mobile/components/StatusCard.tsx:47 vs axiomancer-mobile/app/(tabs)/character/index.tsx:268 — same  |
| C-016 | major | misunderstanding | 05-character-fresh / 09-memoir-fresh / 04-exploration-midgame | three vocabularies for one moral standing | 85 | axiomancer-mobile/app/(tabs)/character/index.tsx:152 (`vm.alignment.cellName`, rendered with no axis key); axi |
| C-017 | major | misunderstanding | 14-village / 05-character-fresh / 11-combat-preview | debuffs have three names, so Clarity Serum's target is unguessable | 90 | axiomancer-mechanics/src/Items/consumable.library.ts:48 vs axiomancer-mechanics/src/Combat/combat.threat.ts:34 |
| C-018 | major | misunderstanding | 16-rest / 18-cache / 21-hazard-deck | "THE DECK" when I carry two decks | 85 | axiomancer-mobile/app/hazard-deck/index.tsx:157-172 vs the rest/cache choice copy |
| C-019 | major | misunderstanding | 21-hazard-deck | DISTINCT / ACQUIRED / SCARS are undefined and untappable | 90 | axiomancer-mobile/app/hazard-deck/index.tsx:79-82 — plain `<Stat>` displays inside a non-pressable View |
| C-020 | major | issue | 21-hazard-deck | fourteen hazard keywords, zero definitions | 95 | axiomancer-mobile/app/hazard-deck/index.tsx:115-128 — keyword chips render as a plain `<View>`, no Pressable,  |
| C-021 | major | misunderstanding | 12-combat-board | heart glyph prints the damage about to hit me | 95 | axiomancer-mobile/components/combat/encounter/IntentIcon.tsx:70 |
| C-022 | major | issue | 12-combat-board | my vitae has no maximum, the enemy's does | 95 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:1521 |
| C-023 | major | misunderstanding | 12-combat-board | ◆ means four different things | 90 | axiomancer-mobile/app/blacksmith/index.tsx:66 and components/combat/encounter/CombatBoard.tsx:185 |
| C-024 | major | issue | 04-exploration-midgame | the map's only key is covered by a hint plate | 95 |  |
| C-025 | major | issue | 05-character-fresh | DERIVED has three column headers and two columns of numbers | 100 | axiomancer-mobile/app/(tabs)/character/index.tsx:336 |
| C-026 | major | misunderstanding | 17-rest-broke | a nearly-dead vitae bar reads as a calm grey bar | 95 | axiomancer-mobile/components/StatBar.tsx:92 |
| C-027 | major | misunderstanding | 12-combat-board | the dice show no value, and the WILD die is black, not gold | 85 | axiomancer-mobile/components/combat/encounter/CombatDie.tsx:152 |
| C-028 | major | issue | 12-combat-board | the damage multipliers print over the enemy and run off the edge | 95 | axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx |
| C-029 | major | issue | 12-combat-board | the card in my hand shows "×4 " — a three-character slice of its real text | 90 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:1599 |
| C-030 | major | misunderstanding | 12-combat-board | five unlabelled emoji runes are my equipped relic powers | 95 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:206; icons from state/presenters/combat-encounte |
| C-031 | major | misunderstanding | 12-combat-board | ◆ is the board's whole economy and is never named | 92 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:185 |
| C-032 | major | misunderstanding | 12-combat-board | ♥11 on the intent badge means damage TO me | 95 | axiomancer-mobile/components/combat/encounter/IntentIcon.tsx:71 |
| C-033 | major | issue | 12-combat-board | my vitae is a bare ♥ 160 with no maximum | 95 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:1518-1521 |
| C-034 | major | misunderstanding | 12-combat-board | ⛨4 and ☾ read as buttons, not enemy traits | 88 | axiomancer-mobile/state/presenters/combat-encounter.engine.ts:98-107 |
| C-035 | major | misunderstanding | 12-combat-board | dice and card cubes are colour-coded with no key | 82 | axiomancer-mobile/components/combat/encounter/CombatDie.tsx:20 (face vocabulary); CombatBoard.tsx dice row |
| C-036 | major | misunderstanding | 06-character-midgame | phantom SKL column in the DERIVED table | 95 | axiomancer-mobile/app/(tabs)/character/index.tsx:335 |
| C-037 | major | misunderstanding | 04-exploration-midgame | map legend explains states, never node contents | 92 | axiomancer-mobile/state/presenters/exploration.engine.ts:340 and :146-162 |
| C-038 | major | misunderstanding | 08-inventory-midgame | currency is shown four different ways | 92 | axiomancer-mobile/app/(tabs)/inventory/index.tsx (purse chip) and app/village/index.tsx (ware price tags) |
| C-039 | major | misunderstanding | 21-hazard-deck | hazard cards carry two unlabelled micro-glyphs | 88 | axiomancer-mobile/components/hazard/HazardCard.tsx:92-104 |
| C-040 | major | misunderstanding | 13-dialogue (also 19-blacksmith) | invisible exit: TIP YOUR CAP AND GO renders with no border | 95 | axiomancer-mobile/components/LeaveRow.tsx:62 (borderStyle: 'dashed', borderColor: AXM.ash — not rendering); mo |
| C-041 | major | misunderstanding | 04-exploration-midgame | the brightest node on the map is the one tap that does nothing | 95 | axiomancer-mobile/app/(tabs)/exploration/index.tsx:185 (`if (node.kind !== 'available') return;` — no toast fo |
| C-042 | major | misunderstanding | 12-combat-board | NO STANCE chip is inert; its identical twin above it is tappable | 90 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:693-709 (StanceChip = View) vs :634-688 (Momentu |
| C-043 | major | misunderstanding | 12-combat-board | five signature abilities read as background scenery | 85 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:157-213 (SignatureColumn); styles at :1860-1876 |
| C-044 | major | misunderstanding | 21-hazard-deck | 22 filter-shaped chips on the deck screen do nothing | 90 | axiomancer-mobile/app/hazard-deck/index.tsx:91, :107, :122 (all three are `<View ... testID=...>`); styles at  |
| C-045 | major | issue | 12-combat-board | 4 of 5 hand cards show only a 58px sliver; medallions sit on top of the end cards | 95 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:1148-1152 (step/overlap) and :1802 (HAND_CARD_W  |
| C-046 | major | issue | 12-combat-board | the line that tells me which stance to play is at 1.28:1 contrast | 100 | axiomancer-mobile/components/combat/encounter/IntentIcon.tsx:143-146 — scPunish/scYield are 10px mono with a h |
| C-047 | major | misunderstanding | 04-exploration-midgame | the only glowing node is the one I'm standing on | 85 | axiomancer-mobile/components/NodeMark.tsx:37-46 (current) vs :48-55 (available); components/exploration/Explor |
| C-048 | major | misunderstanding | 21-hazard-deck | 21 filter-shaped chips in the deck view do nothing | 95 | axiomancer-mobile/app/hazard-deck/index.tsx:91, :107, :122 |
| C-049 | major | misunderstanding | 12-combat-board | combat rune column: the counter looks pressable, the buttons look dead | 85 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:176-211; styles :1862-1876 |
| C-050 | major | issue | 14-village | a shop purchase is one tap, and looks like the exit | 90 | axiomancer-mobile/app/village/index.tsx:112-124 and styles :238, :268 |
| C-051 | major | issue | 04-exploration-midgame / 08-inventory-midgame / 12-combat-board | every explanation is hidden behind a long-press, on a build with no hover | 85 | axiomancer-mobile/components/inventory/EquipmentSlot.tsx:38-42; components/exploration/ExplorationNode.tsx:94; |
| C-052 | major | issue | combat-board | combat board scrolls sideways into a white strip | 95 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx (root/overlay layer — exact producer not isolate |
| C-053 | major | issue | combat-board | phase-ledger mark wraps and is sliced off the screen bottom | 95 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:1939 (rail padding) and :1947 (railLedger flexWr |
| C-054 | major | issue | combat-board | four of five cards in hand have names cut mid-word | 95 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:1149-1152 (fan step math) and :1807 (HAND_CARD_W |
| C-055 | major | issue | inventory-fresh / inventory-midgame | equipment dock holds a 50/50 split at phone width and truncates the grant | 95 | axiomancer-mobile/components/inventory/EquipmentDock.tsx:104-116 and axiomancer-mobile/components/inventory/Eq |
| C-056 | major | issue | 12-combat-board | fanned hand clips 4 of 5 card footers | 95 | components/combat/encounter/CombatBoard.tsx:1485 |
| C-057 | major | issue | 05-character-fresh / 06-character-midgame / 07-inventory-fresh / 08-inventory-midgame | tab bar bisects the last section; 20px of scroll pad under a ~65px bar | 95 | components/ScreenBg.tsx:83 |
| C-058 | major | issue | 04-exploration-midgame / 17-rest-broke | map graph cut on all four sides, 8 of 25 nodes on screen | 90 | components/exploration/MapCanvas.tsx:195 |
| C-059 | major | issue | 04-exploration-midgame / 07-inventory-fresh / 14-village / 16-rest | desktop stretches rows so the label and its number are 1200px apart | 90 |  |
| C-060 | major | issue | 12-combat-board | player and END medallions cover the end cards of the hand (mobile) | 90 | components/combat/encounter/CombatBoard.tsx:1930 |
| C-061 | major | issue | 16-rest | REST never says how much it heals | 95 | state/presenters/rest.engine.ts:25 (RestChoiceOfferVM carries label/desc/price but no heal preview; the number |
| C-062 | major | issue | 16-rest | one-way node warning is dropped whenever the node has flavour text | 90 | app/rest/index.tsx:133 and app/cache/index.tsx:98 (authored MapEvent description replaces, rather than sits ab |
| C-063 | major | issue | 11-combat-preview | combat reveal prices the fight in damage but never shows my VITAE | 92 | components/combat/encounter/CombatEncounterPanel.tsx:773 (revealHp renders vm.enemy.hp/maxHp only; the panel's |
| C-064 | major | issue | 12-combat-board | five rune buttons fire on one tap with no name on screen | 85 | components/combat/encounter/CombatBoard.tsx:193-215 (onPress → onCast when affordable; s.name/s.description on |
| C-065 | major | issue | 12-combat-board | END disc and portrait sit on top of the end cards of my hand | 80 | components/combat/encounter/CombatCombatantPane.tsx:360 (playerDock bottom inset) and components/combat/encoun |
| C-066 | major | issue | 14-village | shop wares have a price and no effect | 90 | app/village/index.tsx:124-132 (ware row renders name + item.description + price only) |
| C-067 | major | issue | 19-blacksmith | the smith takes payment before naming a price | 90 | app/blacksmith/index.tsx:153-171 (intro phase renders body + begin button only) |
| C-068 | major | enhancement | 16-rest | REST never says how much VITAE it restores | 97 | axiomancer-mobile/state/presenters/rest.copy.ts:21 (REST_CHOICE_OFFER_DESC.rest) / state/presenters/rest.engin |
| C-069 | major | enhancement | 18-cache | Cache: none of the three options states its outcome | 95 | axiomancer-mobile/state/presenters/cache.copy.ts:19-23 |
| C-070 | major | issue | 16-rest / 18-cache | "no walking back out" warning is suppressed on every authored node | 92 | axiomancer-mobile/app/rest/index.tsx:133 and app/cache/index.tsx:98 |
| C-071 | major | enhancement | 19-blacksmith | Blacksmith commit gate shows no price and no purse | 90 | axiomancer-mobile/app/blacksmith/index.tsx:148-172 |
| C-072 | major | misunderstanding | 19-blacksmith (vs 12-combat-board) | ◆ means shillings at the forge and Conviction in combat | 88 | axiomancer-mobile/app/blacksmith/index.tsx:67 |
| C-073 | major | issue | 12-combat-board | hand fan clips the right-hand value off every card but the last | 93 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:1153-1158 (and HAND_CARD_W at :1813) |
| C-074 | major | enhancement | 11-combat-preview | combat commit gate shows the foe's numbers and none of mine | 88 | axiomancer-mobile/components/combat/encounter/CombatEncounterPanel.tsx:758-773 |
| C-075 | major | misunderstanding | 07-inventory-fresh | "WORN VS. UNWORN AT A GLANCE" shows no comparison | 90 | axiomancer-mobile/state/presenters/inventory.engine.ts:288 |
| C-076 | major | enhancement | 14-village | shop wares priced but never say what they do | 92 | axiomancer-mobile/app/village/index.tsx:125-127 |
| C-077 | minor | issue | 05-character-fresh | unlabeled red tick on the GRACE bar | 85 | axiomancer-mobile/app/(tabs)/character/index.tsx:268,283 |
| C-078 | minor | issue | 12-combat-board | MOMENTUM appears only as grey lowercase '○ no momentum' | 85 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:656 |
| C-079 | minor | issue | 04-exploration-midgame | map legend says SHUT, counter on the same row says sealed | 100 | axiomancer-mobile/state/presenters/exploration.engine.ts:465-466 (legend.left uses SHUT, legend.right uses `se |
| C-080 | minor | misunderstanding | 07-inventory-fresh / 04-exploration-midgame | SEALED names three unrelated things | 80 | axiomancer-mobile/state/presenters/inventory.engine.ts:255 (quest: 'SEALED') vs exploration.engine.ts:466 vs e |
| C-081 | minor | issue | 07-inventory-fresh | inventory tabs PHIALS / STUFF / SEALED name no category | 95 | axiomancer-mobile/state/presenters/inventory.engine.ts:249-256 (TAB_LABELS: consumable 'PHIALS', material 'STU |
| C-082 | minor | issue | 07-inventory-fresh / 08-inventory-midgame | same slot is TRINKET above and ACCESSORY below | 100 | axiomancer-mobile/state/presenters/inventory.engine.ts:260-263 (SLOT_LABELS accessory: 'Accessory') vs the doc |
| C-083 | minor | issue | 07-inventory-fresh / 14-village / 16-rest | currency has four names across four screens | 95 | axiomancer-mobile/state/presenters/rest.copy.ts:24 (REST_CHOICE_PURSE_LABEL = 'PURSE') vs inventory.engine.ts: |
| C-084 | minor | issue | 09-memoir-fresh / 10-memoir-midgame | nav tab THE LEDGER opens THE BOOK OF DEEDS | 100 | axiomancer-mobile/state/presenters/tabs.engine.ts:55 (memoir: 'THE LEDGER') vs axiomancer-mobile/state/present |
| C-085 | minor | issue | 09-memoir-fresh / 10-memoir-midgame | MEASURE means alignment and stat-size in one section | 90 | axiomancer-mobile/state/presenters/memoir.engine.ts (measure section + philosophical chip copy) |
| C-086 | minor | issue | 21-hazard-deck | hazard deck's four headline stats are bare words | 95 | axiomancer-mobile/app/hazard-deck/index.tsx:80-82 (<Stat label="DISTINCT"/>, "ACQUIRED", "SCARS" with no gloss |
| C-087 | minor | issue | 21-hazard-deck | hazard keyword chips are undefined and two are universal | 90 | axiomancer-mobile/app/hazard-deck/index.tsx (keyword chip row) |
| C-088 | minor | issue | 21-hazard-deck / 12-combat-board | ◆ is conviction in combat and a die face in hazard | 75 | axiomancer-mobile/state/presenters/hazard.engine.ts:265 |
| C-089 | minor | misunderstanding | 01-title → 04-exploration-midgame | LEAGUES reads as a place on the title, a unit on the map | 85 | title screen copy (axiomancer-mobile/app/index.tsx or its copy module) |
| C-090 | minor | misunderstanding | 05-character-fresh / 06-character-midgame | 'XP · LVL 2' next to a big 1 | 95 | axiomancer-mobile/app/(tabs)/character/index.tsx:154 — <Text style={styles.xpLabel}>XP · LVL {vm.level + 1}</T |
| C-091 | minor | issue | 19-blacksmith | blacksmith sells dice work in words nothing has taught | 75 | axiomancer-mobile/app/blacksmith/index.tsx:175 area (intro copy + PURSE label) |
| C-092 | minor | issue | 13-dialogue | 'A RECKONING' header over choices tagged with a bare dash | 70 | axiomancer-mobile/app/dialogue/index.tsx:74 (replyMark '—') with the unfilled consequenceRow at :41; eyebrow f |
| C-093 | minor | issue | 05-character-fresh / 20-hazard | HAZARD DECK on the sheet, "DANGER" on the hazard | 90 | axiomancer-mobile/app/(tabs)/character/index.tsx:256-257; the hazard intro overlay eyebrow (testId hazard-intr |
| C-094 | minor | issue | 11-combat-preview / 21-hazard-deck | SURGE is a hazard keyword and an enemy intent | 85 | axiomancer-mobile/state/presenters/combat-encounter.engine.ts:277 (`combo: { icon: '⚡', label: 'SURGES' }`) vs |
| C-095 | minor | issue | 12-combat-board | "momentum" appears only as an empty state | 90 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:656 |
| C-096 | minor | issue | 09-memoir-fresh / 25-devaftermath | nav says THE LEDGER, the screen says THE BOOK OF DEEDS | 95 | axiomancer-mobile/state/presenters/tabs.engine.ts:55 (`memoir: 'THE LEDGER'`) vs axiomancer-mobile/state/prese |
| C-097 | minor | misunderstanding | 13-dialogue | "A RECKONING" labels an ordinary dialogue choice list | 85 | axiomancer-mobile/state/presenters/event.engine.ts:165 (`reckoningEyebrow: '✠ A RECKONING'`) |
| C-098 | minor | issue | 07-inventory-fresh / 14-village / 16-rest / 13-dialogue | one currency, four names across four screens | 90 | axiomancer-mobile/state/presenters/inventory.engine.ts:242 (`SATCHEL · WALLET · BURDEN`) and the rest screen's |
| C-099 | minor | issue | 07-inventory-fresh / 08-inventory-midgame | TRINKET and ACCESSORY on the same inventory screen | 95 | axiomancer-mobile/state/presenters/inventory.engine.ts:276 (`accessory: 'TRINKET'`) against the list-row slot  |
| C-100 | minor | issue | 07-inventory-fresh / 08-inventory-midgame | inventory tabs PHIALS / STUFF / SEALED (and "SOPS") | 85 | axiomancer-mobile/state/presenters/inventory.engine.ts:245-247 and :253-255 |
| C-101 | minor | issue | 07-inventory-fresh | BURDEN · STONE 8/50 with no unit on screen | 80 | axiomancer-mobile/app/(tabs)/inventory/index.tsx:130 |
| C-102 | minor | issue | 01-title / 04-exploration-midgame | LEAGUES is a place on the title screen and a unit on the map | 90 | axiomancer-mobile/components/TitleScreen.tsx:58 vs axiomancer-mobile/components/exploration/MapOverlays.tsx:18 |
| C-103 | minor | enhancement | cross-screen (05-character, 12-combat-board, 21-hazard-deck) | the glossary defines the genre's words, not this game's | 80 | axiomancer-mobile/state/presenters/tooltip.engine.ts:60-320 |
| C-104 | minor | issue | 12-combat-board | the left rail is five unnamed glyph buttons | 90 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:207 |
| C-105 | minor | misunderstanding | 12-combat-board | the stance badge is a crown, and the crown is the SELF tab | 85 | axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx:704 |
| C-106 | minor | issue | 11-combat-preview | crossed swords render as a plain ✕, which already means SHUT | 90 | axiomancer-mobile/components/combat/encounter/CombatEncounterPanel.tsx:762 |
| C-107 | minor | issue | 11-combat-preview | damage numerals render as tally marks | 85 |  |
| C-108 | minor | issue | 21-hazard-deck | "NUMBER 11" prints as "NUMBER ]]" | 90 |  |
| C-109 | minor | issue | 21-hazard-deck | hazard cards show two numbers and two unexplained pips | 90 |  |
| C-110 | minor | issue | 06-character-midgame | the XP readout wraps into three broken lines | 90 | axiomancer-mobile/app/(tabs)/character/index.tsx:156 |
| C-111 | minor | issue | 04-exploration-midgame | GRACE reads 6/10 on the map and 5/10 on the sheet | 70 | axiomancer-mobile/components/StatusCard.tsx:47 vs app/(tabs)/character/index.tsx:268 |
| C-112 | minor | issue | 08-inventory-midgame | shillings are written four different ways | 95 | axiomancer-mobile/app/(tabs)/inventory/index.tsx:115 |
| C-113 | minor | issue | 08-inventory-midgame | the PHIALS count badge breaks "10" over two lines | 100 | axiomancer-mobile/app/(tabs)/inventory/index.tsx |
| C-114 | minor | issue | 08-inventory-midgame | three different trinkets wear one identical icon | 90 |  |
| C-115 | minor | issue | 12-combat-board | the enemy's permanent traits are unlabelled runes in one colour | 90 | axiomancer-mobile/state/presenters/combat-encounter.engine.ts:98 |
| C-116 | minor | issue | 33-combat-after-end-phase | my status tray is a red X among empty dotted rings | 85 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:1508 |
| C-117 | minor | issue | 33-combat-after-end-phase | PLEA and CHARGE are meters with no unit and no goal | 90 | axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx:668 |
| C-118 | minor | issue | 13-dialogue | every spoken line opens with a closing quote mark | 100 | axiomancer-mechanics/src/World/Continents/Coastal-Village/maps.ts:46 (outside the mobile package) |
| C-119 | minor | issue | 16-rest | the rest screen shows 20/175 vitae with no bar and no alarm | 90 |  |
| C-120 | minor | issue | 33-combat-after-end-phase | a status tile shows "1t" and "2" and no name | 90 | axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx:199 |
| C-121 | minor | misunderstanding | 31-combat-primer-p1 | the primer names a "Surge meter" the board never shows | 80 | axiomancer-mobile/components/combat/encounter/CombatTutorialPrimer.tsx:33 |
| C-122 | minor | issue | 12-combat-board | the stance-unknown mark is an unnamed alchemical rune | 85 | axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx:704 |
| C-123 | minor | issue | 12-combat-board | two dots under the intent badge with no key | 80 | axiomancer-mobile/components/combat/encounter/IntentIcon.tsx:83-88 |
| C-124 | minor | issue | 12-combat-board | hand fan clips the card stat footers | 90 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx (combat-hand fan layout) |
| C-125 | minor | misunderstanding | 12-combat-board | enemy health lives inside a shield crest | 65 | axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx:64,94-111 |
| C-126 | minor | misunderstanding | 04-exploration-midgame | unlabelled red tick inside the GRACE bar | 90 | axiomancer-mobile/components/StatusCard.tsx:79 |
| C-127 | minor | issue | 05-character-fresh | XP chain breaks into 16 floating rings on desktop | 85 | axiomancer-mobile/components/XpChain.tsx:17-24,36-38 |
| C-128 | minor | misunderstanding | 05-character-fresh | MIND is iconified with a skull | 75 | axiomancer-mobile/app/(tabs)/character/index.tsx:181 (StanceGlyph kind='mind') |
| C-129 | minor | issue | 04-exploration-midgame | node pictograms are too small to identify | 80 | axiomancer-mobile/components/exploration/ExplorationNode.tsx:108 |
| C-130 | minor | misunderstanding | 04-exploration-midgame | tab-rail icons reused as map node marks | 78 | axiomancer-mobile/app/(tabs)/_layout.tsx:34-38; state/presenters/exploration.engine.ts:151,158 |
| C-131 | minor | issue | 04-exploration-midgame | compass rose overlaps the node tally | 88 | axiomancer-mobile/app/(tabs)/exploration/index.tsx (map-overlays-fixed / map-compass placement) |
| C-132 | minor | issue | 08-inventory-midgame | three trinkets wear one identical glyph | 88 | axiomancer-mobile/components/inventory/EquipmentSlot.tsx:52 |
| C-133 | minor | misunderstanding | 21-hazard-deck | 0 SCARS is printed in alarm red | 90 | axiomancer-mobile/app/hazard-deck/index.tsx:82 |
| C-134 | minor | issue | 21-hazard-deck | COLOUR legend dots don't match the card medallions | 80 | axiomancer-mobile/app/hazard-deck/index.tsx:93 |
| C-135 | minor | issue | 13-dialogue | dialogue speech opens with a closing quote mark | 95 | axiomancer-mechanics/src/World/Continents/Coastal-Village/maps.ts:46 (straight quotes in the dialogue text) |
| C-136 | minor | issue | 17-rest-broke | near-death vitae gets no danger state | 85 | axiomancer-mobile/components/StatusCard.tsx:66 (StatBar value={hp} color={AXM.blood}) — no low-threshold state |
| C-137 | minor | misunderstanding | 11-combat-preview | five ash-bordered threat cards look like five greyed-out choices | 75 | axiomancer-mobile/components/combat/encounter/CombatEncounterPanel.tsx:1495 (revealPhase, borderColor AXM.ash) |
| C-138 | minor | issue | 11-combat-preview | ENTER COMBAT is a full screen below the fold with no sticky footer | 100 | axiomancer-mobile/components/combat/encounter/CombatEncounterPanel.tsx:761-807 — the Pressable is the last chi |
| C-139 | minor | misunderstanding | 12-combat-board | "🜲 ?" reads as the help button and is inert | 85 | axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx:697-705 (plain Text) and styles at :782- |
| C-140 | minor | issue | 04-exploration-midgame | travel hint covers the legend that says which marks are tappable | 100 | axiomancer-mobile/components/exploration/MapOverlays.tsx:85 (hint bottom: 26) vs :101 (legend bottom: 8) — the |
| C-141 | minor | issue | 08-inventory-midgame | PHIALS tab count wraps to two lines and breaks out of the tab | 100 | axiomancer-mobile/components/inventory/InventoryTabs.tsx — tab {flex:1, paddingHorizontal:8} and tabCount {min |
| C-142 | minor | issue | 12-combat-board | combat phase ledger wraps and the last pip is cut off the screen bottom | 95 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:1940 (railLedger flexWrap:'wrap') and :1934-1938 |
| C-143 | minor | issue | 15-cutscene / 02-onboarding | cutscene SKIP is 8px-tall text in a 24px tap target | 100 | axiomancer-mobile/app/cutscene/index.tsx:126-127 (skip: {position:'absolute', top:14, right:14, padding:8}; sk |
| C-144 | minor | misunderstanding | 16-rest | THE CUT looks unaffordable when the real block is the deck floor | 80 | axiomancer-mobile/app/rest/index.tsx:64-74 (price stays in the head, reason renders as a sibling below) and st |
| C-145 | minor | misunderstanding | 14-village | the named merchant card is styled like a locked option and is inert | 75 | axiomancer-mobile/app/village/index.tsx:70 (plain View, not a Pressable) and styles :214-222 vs the wareRow at |
| C-146 | minor | misunderstanding | 07-inventory-fresh / 08-inventory-midgame | tapping an equipped item filters a list I cannot see | 70 | axiomancer-mobile/components/inventory/EquipmentSlot.tsx:41 (onPress → onSelectSlot) and app/(tabs)/inventory/ |
| C-147 | minor | enhancement | 04-exploration-midgame | 25 nodes advertised, 6 visible, no cue the chart drags | 70 | axiomancer-mobile/components/exploration/MapCanvas.tsx:30-36 (canvas spread to 936x1040 with pan/pinch gesture |
| C-148 | minor | misunderstanding | 02-onboarding / 15-cutscene | cutscene SKIP is a caption, not a control | 95 | axiomancer-mobile/app/cutscene/index.tsx:88-96, styles at :126-127 |
| C-149 | minor | issue | 21-hazard-deck | THIN THE DECK looks disabled and isn't | 90 | axiomancer-mobile/app/hazard-deck/index.tsx:157-172 |
| C-150 | minor | misunderstanding | 11-combat-preview | read-only threat rows wear the same border as the real button | 85 | axiomancer-mobile/components/combat/encounter/CombatEncounterPanel.tsx:1495 vs :1507 |
| C-151 | minor | misunderstanding | 12-combat-board | a boxed '?' on the combat board that is not a help button | 80 | axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx:697-705 |
| C-152 | minor | issue | 16-rest | the rest screen has no way out | 85 | axiomancer-mobile/app/rest/index.tsx:118-152 |
| C-153 | minor | misunderstanding | 08-inventory-midgame | equipment dock rows read as items, act as filters | 75 | axiomancer-mobile/components/inventory/EquipmentSlot.tsx:33-45 |
| C-154 | minor | enhancement | 12-combat-board | combat: nowhere to put a card until you're already dragging | 75 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:1100-1116, :1555-1568 |
| C-155 | minor | issue | 05-character-fresh / 06-character-midgame | player-facing SELF tab links to the /dev route | 60 | axiomancer-mobile/components/dev/DevToolsLink.tsx:22-42 |
| C-156 | minor | issue | exploration-midgame | map's engraved plate leaves a 145px black band with a hard edge | 90 | axiomancer-mobile/components/exploration/MapCanvas.tsx:312-318 (canvas) and :340 (backdropPlate) |
| C-157 | minor | issue | character-fresh / character-midgame | my alignment is cut to "Agnostic-Neutral-..." with nowhere else to read it | 95 | axiomancer-mobile/app/(tabs)/character/index.tsx:162 (numberOfLines) and :522 (fixed 180pt portraitFrame) |
| C-158 | minor | issue | memoir-fresh / memoir-midgame | THE LEDGER is 43% empty on phone and ~86% empty on desktop | 90 | axiomancer-mobile/app/(tabs)/memoir/index.tsx |
| C-159 | minor | issue | blacksmith / rest / cache / dialogue | narrative choice screens squeeze everything into a thin middle band | 85 | axiomancer-mobile/components/event (shared choice-screen shell) |
| C-160 | minor | issue | event | /event is 82% background art and clips its own caption | 90 | axiomancer-mobile/app/event/index.tsx (empty state) + the shared ScreenBg plate |
| C-161 | minor | issue | rest | disabled REST option is transparent, so the etching reads through its text | 90 | axiomancer-mobile/components/event (rest choice card, disabled state) |
| C-162 | minor | issue | combat-preview | pre-combat screen's only button is two screens below the fold | 90 | axiomancer-mobile/components/combat/encounter/CombatEncounterPanel.tsx |
| C-163 | minor | issue | combat-board | player medallion and END disc sit on top of the outer two cards | 85 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:1143-1152, PlayerMedallion / end-phase chrome |
| C-164 | minor | misunderstanding | exploration-midgame | map counts 25 nodes, draws nine, and only ever says "tap" | 75 | axiomancer-mobile/components/exploration/MapCanvas.tsx:165-183 |
| C-165 | minor | misunderstanding | combat-board | signature runes read as scenery painted on the arena | 70 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx (SignatureColumn, sigRune / sigCostBadge styles  |
| C-166 | minor | issue | 05-character-fresh / 07-inventory-fresh | no scroll indicator on screens that are cut off | 90 | components/ScreenBg.tsx:44 |
| C-167 | minor | issue | 04-exploration-midgame vs 17-rest-broke | map plate letterboxed off-centre; its own chrome doesn't follow it | 85 | components/exploration/MapCanvas.tsx:312 |
| C-168 | minor | issue | 17-rest-broke | vitae bar at 1 HP is a 7px nub on a 1240px track | 85 |  |
| C-169 | minor | issue | 19-blacksmith / 13-dialogue | body prose runs the full 1280 — 165 characters on one line | 90 |  |
| C-170 | minor | issue | 09-memoir-fresh / 10-memoir-midgame | THE LEDGER doesn't reflow — 85% of the desktop screen is empty | 95 |  |
| C-171 | minor | issue | 07-inventory-fresh / 08-inventory-midgame | equipment dock eats half the desktop screen to show one small doll | 85 |  |
| C-172 | minor | issue | 05-character-fresh / 06-character-midgame | XP chain spreads into 16 lone rings 58px apart | 90 | components/XpChain.tsx:34 |
| C-173 | minor | issue | 12-combat-board | combat board is the only screen wider than the viewport (white strip) | 80 |  |
| C-174 | minor | issue | 12-combat-board | pip row wraps and the wrapped pip is cut by the bottom edge (mobile) | 75 |  |
| C-175 | minor | issue | 12-combat-board | signature discs flush to the left edge, badges colliding | 80 |  |
| C-176 | minor | issue | 05-character-fresh / 06-character-midgame | alignment triple truncated to 'Agnostic-Neutral-…' (mobile) | 95 | app/(tabs)/character/index.tsx:162 |
| C-177 | minor | issue | 07-inventory-fresh / 08-inventory-midgame | equipment grant truncated mid-word: 'GRANTS READ THE ENTRA…' | 95 | components/inventory/EquipmentSlot.tsx:66 |
| C-178 | minor | issue | 02-onboarding / 15-cutscene | cutscene copy crammed into the top 100px, tap hint adrift in the art | 85 |  |
| C-179 | minor | issue | 23-labyrinth | DESCEND is an 8pt caption inside a 1240x100 row | 80 |  |
| C-180 | minor | issue | 18-cache / 16-rest / 22-event | choice rows stretch full width with all content hugging the left | 85 |  |
| C-181 | minor | misunderstanding | 01-title | EMBARK's own sub-label points at a map that isn't here | 90 | components/TitleScreen.tsx:71 |
| C-182 | minor | misunderstanding | 12-combat-board | 'NO STANCE' states a state, never how to leave it | 80 | state/presenters/combat-encounter.engine.ts:2894 |
| C-183 | minor | misunderstanding | 19-blacksmith | the smith prices shillings in the combat conviction glyph | 70 | state/presenters/blacksmith.engine.ts:107 |
| C-184 | minor | issue | 20-hazard | 'FACE IT' does not say it leads to a choice | 85 | components/hazard/HazardIntroOverlay.tsx:44-48 |
| C-185 | minor | misunderstanding | 07-inventory-fresh | tab reads WORN 8 while 5 things are worn | 90 | state/presenters/inventory.engine.ts:252 |
| C-186 | minor | misunderstanding | 07-inventory-fresh | 'WORN VS. UNWORN AT A GLANCE' shows only worn | 85 | state/presenters/inventory.engine.ts:288 |
| C-187 | minor | issue | 05-character-fresh | the grace rulebook is collapsed behind 'THE ACCOUNT' | 85 | app/(tabs)/character/index.tsx:304-338 (ledgerHeader Pressable; SectionLabel 'THE ACCOUNT' with no gloss, cont |
| C-188 | minor | issue | 18-cache | cache options hide the one real reward | 85 | state/presenters/cache.copy.ts:19-23 (CACHE_CHOICE_OFFER_DESC) |
| C-189 | minor | issue | 21-hazard-deck | 14 hazard keywords, no definitions, chips that do nothing | 85 | app/hazard-deck/index.tsx:122 |
| C-190 | minor | enhancement | 04-exploration-midgame | map icons are kind-coded with no key | 80 | components/exploration/MapOverlays.tsx (legend carries left/right path-state strings only) |
| C-191 | minor | misunderstanding | 23-labyrinth | 'Three acts. One descent.' over three open doors | 70 | app/labyrinth/index.tsx:160-171 (act cards render title + riddle + enter/done label; no lock or order state) |
| C-192 | minor | enhancement | 07-inventory-fresh / 08-inventory-midgame | gear "grants The Stilling" — and nothing says what that is | 85 | axiomancer-mobile/components/inventory/EquipmentSlot.tsx:65-69 |
| C-193 | minor | enhancement | 05-character-fresh | GRACE's rules hide behind a collapsed 9pt row called THE ACCOUNT | 85 | axiomancer-mobile/app/(tabs)/character/index.tsx:303-315 |
| C-194 | minor | enhancement | 04-exploration-midgame / 17-rest-broke | map node icons have no key — the legend only explains state | 78 | axiomancer-mobile/state/presenters/exploration.engine.ts:340 |
| C-195 | minor | misunderstanding | 20-hazard | hazard says "Unless…" and offers only FACE IT | 80 | axiomancer-mobile/components/hazard/HazardIntroOverlay.tsx:70-79 |
| C-196 | minor | misunderstanding | 13-dialogue | two adjacent exits in dialogue, no stated difference | 75 | axiomancer-mobile/app/dialogue/index.tsx:202-209 |
| C-197 | minor | enhancement | 23-labyrinth | three Aporia acts, no order, cost or stakes | 80 | axiomancer-mobile/app/labyrinth/index.tsx:160-172 |
| C-198 | minor | enhancement | 09-memoir-fresh / 10-memoir-midgame | THE LEDGER is empty at LVL 15 and never says what fills it | 72 | axiomancer-mobile/state/presenters/memoir.engine.ts:495-510 |
| C-199 | minor | enhancement | 12-combat-board | signature runes show a price and never a name | 80 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:209-215 |
| C-200 | minor | misunderstanding | 01-title → 02-onboarding | EMBARK promises a map and delivers an omen | 75 |  |
| C-201 | polish | issue | 09-memoir-fresh | "UNTESTED / untested." says nothing twice | 90 | axiomancer-mobile/state/presenters/memoir.engine.ts:234 (`label: 'UNTESTED'`) with `emptyPhilosophical` = 'unt |
| C-202 | polish | issue | 12-combat-board | "PHASE 1/5 · R1 · T1" stacks three unexplained clocks | 80 | axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx (enemy header row) |
| C-203 | polish | issue | 06-character-midgame | a red tick sits on the GRACE bar with no key | 90 | axiomancer-mobile/app/(tabs)/character/index.tsx:281 |
| C-204 | polish | issue | 20-hazard | the DANGER skull is an unreadable smudge | 90 | axiomancer-mobile/components/hazard/HazardIntroOverlay.tsx:35 |
| C-205 | polish | issue | 07-inventory-fresh | the burden bar is warning-orange at every load | 90 | axiomancer-mobile/app/(tabs)/inventory/index.tsx |
| C-206 | polish | issue | 12-combat-board | the deck and discard counters are two plain blocks | 85 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:1532 |
| C-207 | polish | issue | 12-combat-board | ▮3 ▯0 pile glyphs are indistinguishable at 8px | 88 | axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:1530-1534 |
| C-208 | polish | issue | 11-combat-preview | ⚔ eyebrow renders as a plain ✕ | 78 | axiomancer-mobile/components/combat/encounter/CombatEncounterPanel.tsx (reveal eyebrow copy) |
| C-209 | polish | issue | 07-inventory-fresh | inventory tab counts vanish at zero | 80 | axiomancer-mobile/app/(tabs)/inventory/index.tsx (tab count badge) |
| C-210 | polish | issue | 10-memoir-midgame | REMAINS section mark reads as a ghost | 70 | axiomancer-mobile/app/(tabs)/memoir/index.tsx:274 |
| C-211 | polish | issue | 04-exploration-midgame | Map i of ii runs together in tight italic | 75 | axiomancer-mobile/app/(tabs)/exploration/index.tsx (map subtitle) |
| C-212 | polish | enhancement | 05-character-fresh / 06-character-midgame | portrait cycles art with no hint it is pressable | 90 | axiomancer-mobile/app/(tabs)/character/index.tsx:139-148 — Pressable wrapping PlayerPortraitImage, accessibili |
| C-213 | polish | issue | 05-character-fresh / 06-character-midgame | SELF tab carries a DEV TOOLS row styled like a player feature | 85 | axiomancer-mobile/components/dev/DevToolsLink.tsx:35 — the link IS gated by isDevToolsEnabled() so production  |
| C-214 | polish | issue | 23-labyrinth | labyrinth act rows: the pressable is 1240px, the cue is 58px | 80 | axiomancer-mobile/app/labyrinth/index.tsx:161-172 |
| C-215 | polish | issue | 06-character-midgame | portrait frame is a button with no sign of it | 85 | axiomancer-mobile/app/(tabs)/character/index.tsx:138-148 |
| C-216 | polish | issue | hazard-deck | hazard-deck count badge overlaps the card corner | 85 | axiomancer-mobile/components/hazard (deck card copies badge) |
| C-217 | polish | issue | combat-board | combat top scrim is a fixed 300px, leaving a vertical seam on phone | 80 | axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx (top HUD scrim) |
| C-218 | polish | issue | title | title art ends in a razor-straight cut across the figures | 90 | axiomancer-mobile/app/index.tsx (title hero image) |
| C-219 | polish | issue | character-fresh | character sheet starts 4px from the top; sibling tabs start at 15-16px | 85 | axiomancer-mobile/app/(tabs)/character/index.tsx:520 |
| C-220 | polish | issue | 04-exploration-midgame | NODE GRAPH title printed on top of the blood splatter | 85 | components/exploration/MapCanvas.tsx:322 |
| C-221 | polish | issue | 02-onboarding / 15-cutscene | engraving's printed caption half-cut at the bottom edge (mobile) | 80 |  |
| C-222 | polish | issue | 01-title | title art letterboxed with a 160px black gap above the copy (mobile) | 85 |  |
| C-223 | polish | issue | 21-hazard-deck | card rule text sits flush against the card border | 80 |  |
| C-224 | polish | issue | 11-combat-preview / 12-combat-board | stance glyph 🜲 renders as an unreadable box at 10-12px | 60 | components/combat/encounter/CombatEncounterPanel.tsx:802 |
| C-225 | polish | issue | 11-combat-preview | 'stance hidden' tell renders at ~8px, below reading size | 75 | components/combat/encounter/CombatEncounterPanel.tsx:1499 |
| C-226 | polish | issue | 05-character-fresh | SELF tab links to the dev route in the built export | 75 | components/dev/DevToolsLink.tsx:38 |
| C-227 | polish | issue | 05-character-fresh / 04-exploration-midgame | unlabelled break tick on the GRACE bar | 80 | axiomancer-mobile/app/(tabs)/character/index.tsx:284 and :296-298 |
| C-228 | polish | enhancement | 02-onboarding / 15-cutscene | cutscene gives a desktop player nothing to click | 70 |  |
| C-229 | polish | issue | 05-character-fresh / 06-character-midgame | SELF tab carries a DEV TOOLS door | 55 | axiomancer-mobile/components/dev/DevToolsLink.tsx:27 |
