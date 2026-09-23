type FishingVillageQuests =
    'starting-quest' |
    'get-to-forest';

type NorthernForestQuests =
    'gather-wood' |
    'get-to-cave';

type CavernsQuests =
    'gather-iron' |
    'get-to-northern-city';

type NorthernCityQuests =
    'find-blacksmith' |
    'build-boat' |
    'kill-some-time' |
    'get-to-connecting-river';

type ConnectingRiverQuests =
    'find-islanders' |
    'join-islanders-for-ritual' |
    'get-to-town-across-river';

type TownAcrossRiverQuests =
    'get-to-the-capital';

/**
 * QuestName is the union of all quest-LOG names in the game — the
 * objective-tracking quests consumed by `quest.engine.ts`, dialogue
 * gating (`DialogueChoice.requires.quest`), and reach objectives.
 *
 * Note (Phase 137, retired Phase 61): main-STORY beats used to play as
 * authored Quest Board minigames (`World/QuestBoard`, e.g.
 * `build-the-boat`); that module is gone. The quest log tracks
 * objectives only.
 *
 * @todo: Keep QuestName updated with new quest-log quests.
 */
export type QuestName =
    FishingVillageQuests |
    NorthernForestQuests |
    CavernsQuests |
    NorthernCityQuests |
    ConnectingRiverQuests |
    TownAcrossRiverQuests;