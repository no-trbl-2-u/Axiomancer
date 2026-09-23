# Repository Setup Guide

This guide provides comprehensive setup instructions for the `axiomancer-mobile` package inside the Axiomancer monorepo, including environment configuration, development tools, and troubleshooting. For a quick start that covers the minimum steps to run the app, see the README.md quick start section first.

Complete these comprehensive steps when you need full development environment setup, or if you encounter issues with the quick start process.

## Prerequisites

- **Node.js 22+** (`engines` in `package.json`) — required by the React Native toolchain
- **Git** — for version control and repository management
- **Code editor** — VS Code recommended for TypeScript support

## Initial Repository Setup

### 1. Clone and Install Dependencies

The mobile app lives at `axiomancer-mobile/` inside the Axiomancer
monorepo (npm workspaces). Clone the monorepo and install from its root:

```bash
# Clone the monorepo
git clone https://github.com/no-trbl-2-u/Axiomancer.git
cd Axiomancer

# Install all workspace dependencies (root lockfile owns deps)
npm install
```

### 2. Environment Configuration

Copy the environment template and configure local settings:

```bash
cp .env.example .env
```

Edit `.env` and configure these variables:

| Variable | Purpose | Required | Where to get it |
|----------|---------|----------|-----------------|
| `GH_TOKEN` | GitHub API access for issue management | Development only | `gh auth token` (scopes: repo, read:org, gist, workflow) |
| `GH_REPO` | GitHub repository identifier | Development only | Usually `no-trbl-2-u/Axiomancer` |
| `EXPO_TOKEN` | EAS Build API access | Deployment only | https://expo.dev/settings/access-tokens |
| `EAS_PROJECT_ID` | Expo project identifier | Deployment only | Auto-detected from app.json |

**For development-only setup:** Only `GH_TOKEN` and `GH_REPO` are needed. The deployment variables can be left empty until you need to build for devices.

### 3. Install Development Tools

#### Expo CLI
```bash
npm install -g @expo/cli
```

#### GitHub CLI (for issue management)
```bash
# macOS
brew install gh

# Ubuntu/Debian  
sudo apt install gh

# Or download from https://github.com/cli/cli/releases
```

Authenticate with GitHub:
```bash
gh auth login
```

### 4. Verify Setup

Run the verification suite to ensure everything is configured correctly.
From the monorepo root:

```bash
npm run verify --workspace axiomancer-mobile
```

(Equivalently, run `npm run verify` from inside `axiomancer-mobile/`.)

This runs:
- `npm run lint` — ESLint with Expo's configuration
- `npm run typecheck` — TypeScript strict type checking  
- `npm test` — Jest test suite with React Native Testing Library
- `npm run assets:check`, `npm run art:test`, `npm run critique-drive:test` — asset provenance and script guards

All steps should pass. If any fail, see the troubleshooting section below.

## Development Workflow

### Start Development Server

```bash
npm start
```

This opens the Metro bundler with QR code and platform options.

### Choose Your Platform

Pick one based on your development setup:

```bash
# Web browser (fastest, works everywhere)
npm run web

# iOS Simulator (requires Xcode on macOS)  
npm run ios

# Android Emulator (requires Android Studio)
npm run android
```

### Before Committing Changes

Always run the verification gate:

```bash
npm run verify
```

Only commit when all checks pass. The project uses trunk-based development with direct commits to `main`.

## Project Structure Overview

Understanding where things live:

```
axiomancer-mobile/
├── app/                     # Expo Router file-based routes  
│   └── (tabs)/             # Main app tabs: exploration, character, memoir, inventory, deck
├── components/             # Reusable UI components
├── state/                  # Game state management and presenters
├── theme/                  # Design tokens and typography
├── assets/                 # Fonts and placeholder images
├── test-utils/             # Testing helpers and utilities
├── docs/                   # Development documentation 
├── specs/                  # Product specification documents
└── setup/                  # This setup documentation
```

### Key Files

- **README.md** — Project overview and quick start
- **VISION.md** — Game vision and UX doctrine  
- **package.json** — Dependencies and npm scripts
- **app.json** — Expo configuration
- **eas.json** — EAS Build profiles

## Development Guidelines

### Engine Integration

- **Never reimplement game logic** — all rules live in the `axiomancer-mechanics` sibling workspace (local source via the `@mechanics` alias)
- **Presenters are pure functions** — `(state) => ViewModel`, no side effects
- **UI components consume view models** — never read engine state directly

### Code Standards

- **TypeScript strict mode** — all code must type-check
- **ESLint** — follow Expo's linting rules
- **Hermetic tests** — every change ships with presenter/store tests  
- **No hardcoded copy** — strings live in presenters or `.copy.ts` modules

### Commit Workflow

- Commit and push as a single atomic act
- No `--no-verify`, force-push, or destructive resets
- Verify gate must pass before committing
- Use conventional commit prefixes: `feat:`, `fix:`, `refactor:`, etc.

## Troubleshooting

### Node.js Version Issues

**Problem:** Package installation or Metro bundler fails
**Solution:** Verify Node.js 22+ is installed:
```bash
node --version  # Should show 22.x or higher
```

If using an older version, install Node.js 22+ from https://nodejs.org or use a version manager like nvm.

### Metro Bundler Problems

**Problem:** "Cannot resolve module" or bundler crashes
**Solution:** Clear caches and reinstall:
```bash
rm -rf node_modules/.expo node_modules/.cache
npm install
npm start -- --clear
```

### TypeScript Errors

**Problem:** `npm run typecheck` fails with import errors
**Solution:** Ensure all dependencies are installed and up-to-date:
```bash
npm install
npm update
```

Check that `tsconfig.json` includes the correct paths for your TypeScript version.

### Test Failures

**Problem:** `npm test` fails with import or configuration errors  
**Solution:** Verify Jest configuration and test-utils:
```bash
npm run test -- --verbose
```

Most test issues stem from missing test-utils imports or incorrect React Native Testing Library setup.

### GitHub CLI Authentication

**Problem:** `GH_TOKEN` environment variable not working
**Solution:** Use GitHub CLI's built-in token management:
```bash
gh auth token  # Copy this value to .env as GH_TOKEN
```

### Permission Issues

**Problem:** Metro can't write to cache directories
**Solution:** Fix filesystem permissions:
```bash
sudo chown -R $(whoami) node_modules/.cache .expo
```

## Next Steps

Once repository setup is complete:

1. **For EAS Build setup:** See [`setup/02_eas.md`](./02_eas.md)
2. **For store deployment:** See [`setup/03_store_setup.md`](./03_store_setup.md)
3. **For AI testing workflow:** See [`setup/04_claude_playtest.md`](./04_claude_playtest.md)

## Getting Help

- **Project documentation:** [`docs/`](../docs/) directory
- **Architecture decisions:** [`docs/adr/`](../docs/adr/) directory  
- **Game mechanics:** [`axiomancer-mechanics`](../../axiomancer-mechanics/) sibling workspace
- **Expo documentation:** https://docs.expo.dev
- **React Native guides:** https://reactnative.dev/docs/getting-started