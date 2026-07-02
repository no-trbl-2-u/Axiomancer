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

/**
 * QuestName is the union of all quest-LOG names in the game — the
 * objective-tracking quests consumed by `quest.engine.ts`, dialogue
 * gating (`DialogueChoice.requires.quest`), and reach objectives.
 *
 * Note (Phase 137): main-STORY beats are a different surface — they
 * play as authored Quest Board minigames (`World/QuestBoard`, e.g.
 * `build-the-boat`). A quest-log quest may accompany a board (the
 * log tracks objectives; the board plays the beat), but the two
 * registries are intentionally separate.
 *
 * @todo: Keep QuestName updated with new quest-log quests.
 */
export type QuestName =
    FishingVillageQuests |
    NorthernForestQuests |
    CavernsQuests |
    NorthernCityQuests |
    ConnectingRiverQuests;