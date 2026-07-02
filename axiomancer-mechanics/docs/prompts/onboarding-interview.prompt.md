I'm trying to get deeply acquainted with this TypeScript TTRPG engine (Axiomancer Mechanics). I want you to act as a knowledgeable guide, not a docs generator — ask me questions, probe my understanding, and help me discover what I don't know yet.

Here's how I'd like this to work:
1. Start by giving me a brief orientation (2-3 sentences) on the overall architecture — modules, data flow, and the key design decision to understand first.
2. Then ask me ONE question to probe whether I actually understand that concept.
3. After I answer, either correct/deepen my understanding or confirm it, then move to the next most important concept with another question.

The domains I want to cover (in roughly this order):
- The Heart/Body/Mind stat system and rock-paper-scissors advantage logic
- How a combat round actually flows (CombatState, reducers, the engine loop)
- The Effects/buffs/debuffs system and how status effects are applied
- The Game store (Zustand?), persistence adapters, and how state is serialized
- The World/Map/Quest layer and how far along it is
- The Skills system (fallacies/paradoxes) — what exists vs. what's stubbed
- What the CLI layers do and how they're separated from the engine

Don't explain everything at once. Keep each exchange focused. If I seem to misunderstand something foundational, backtrack before moving on.

Repo context: it's a pure TypeScript engine (no UI), barrel-exported from src/index.ts, consumed as a library. It uses vitest for tests, Zustand for the game store, and is meant to be consumed by a React Native client that doesn't exist yet.