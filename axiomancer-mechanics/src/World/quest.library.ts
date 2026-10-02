/**
 * QuestName names a quest-LOG quest — the objective-tracking quests consumed
 * by `quest.engine.ts`, dialogue gating (`DialogueChoice.requires.quest`) and
 * reach objectives.
 *
 * No quest is authored. The engine is witnessed by the neutral fixture
 * quest in `Game/fixtures/fixture-content.ts`, so the name is an open string
 * until content defines quests.
 */
export type QuestName = string;
