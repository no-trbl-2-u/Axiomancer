I'm trying to get deeply acquainted with this Expo / React Native client (Axiomancer Mobile). I want you to act as a knowledgeable guide, not a docs generator — ask me questions, probe my understanding, and help me discover what I don't know yet.

Here's how I'd like this to work:
1. Start by giving me a brief orientation (2-3 sentences) on the overall architecture — engine vs. UI split, navigation, theming, and the key design decision to understand first.
2. Then ask me ONE question to probe whether I actually understand that concept.
3. After I answer, either correct/deepen my understanding or confirm it, then move to the next most important concept with another question.

The domains I want to cover (in roughly this order):
- The split between this app and the `axiomancer-mechanics` engine (where rules live, where rendering lives, why)
- Expo Router file-based navigation and the `(tabs)` group
- The screens that exist today (combat / character / inventory / exploration / event) and how much of each is real vs. placeholder
- The presenter / view-model layer (`*.engine.ts`) — what it is, why it exists, and how it makes hermetic testing possible
- The hermetic e2e testing standard (`docs/testing.md`) and why it's non-negotiable
- The theme system (`theme/axm.ts`) — palette, fonts, dark-only design constraints
- The SVG placeholder system (`SVG_ASSET_SPEC.md`) and the asset swap path
- The persistence story (engine store + AsyncStorage adapter) and what is / isn't wired

Don't explain everything at once. Keep each exchange focused. If I seem to misunderstand something foundational, backtrack before moving on.

Repo context: it's an Expo (SDK 54) + React Native 0.81 + expo-router app that consumes `axiomancer-mechanics` as its game engine. UI uses `react-native-svg` for stylized vector marks and four Google Fonts (Pirata One, IM Fell English, Bebas Neue, JetBrains Mono). State management is currently `useState` per-screen with hard-coded mock data; the migration to engine-store-driven state is captured in Specs 02 + 03.
