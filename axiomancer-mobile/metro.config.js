const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// `axiomancer-mechanics` re-exports a Node-only persistence adapter
// (`dist/Game/persistence/node.adapter.js`) that `require("fs")`. The
// adapter is never invoked at runtime on React Native, but Metro still
// walks its dependency graph and fails to resolve `fs`. Alias `fs` to an
// empty stub so bundling succeeds. Add more Node built-ins here if other
// adapters show up.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  fs: path.resolve(__dirname, 'metro-stubs/empty.js'),
};

module.exports = config;
