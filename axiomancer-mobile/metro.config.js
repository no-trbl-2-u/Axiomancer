const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// Monorepo Metro config.
//
// `axiomancer-mechanics` is now a sibling workspace consumed as LOCAL SOURCE
// via the `@mechanics` / `@mechanics/*` tsconfig path aliases (Expo's Metro
// reads tsconfig `paths` natively). Those aliases resolve to
// ../axiomancer-mechanics/src, which lives OUTSIDE this project root — so Metro
// must watch the monorepo root and resolve modules from both node_modules trees
// (npm workspaces hoist most deps to the root).
// ─────────────────────────────────────────────────────────────────────────────
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo so edits to mechanics source trigger a rebuild.
config.watchFolders = [monorepoRoot];

// Resolve deps from the app's node_modules first, then the hoisted root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// watchFolders reaches the whole monorepo, which includes the retired-nexus
// `/archive` and staging `/carryforward` trees. They are docs-only and never
// imported, but block them from the resolver so Metro never crawls them.
const existingBlock = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : config.resolver.blockList
    ? [config.resolver.blockList]
    : [];
config.resolver.blockList = [
  ...existingBlock,
  /.*\/archive\/.*/,
  /.*\/carryforward\/.*/,
];

// `axiomancer-mechanics` ships a Node-only persistence adapter behind its
// `./node` export (`Game/persistence/node.adapter` → `require("fs")`). The
// RN-safe barrel we import (`@mechanics` → src/index.ts) does not pull it in,
// but keep the `fs` stub as a belt-and-braces guard in case Metro walks it.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  fs: path.resolve(projectRoot, 'metro-stubs/empty.js'),
};

module.exports = config;
