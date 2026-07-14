/**
 * Side-effect module — register the mobile package's TS path aliases so the
 * mechanics-side catalog export can import the game's own card-face presenter
 * (`axiomancer-mobile/state/presenters/combat-encounter.engine`). That file
 * reaches for `@/…` (mobile root) and `@mechanics` (this package's barrel)
 * internally; the mechanics `tsconfig.json` maps neither, so we teach the
 * ts-node/tsconfig-paths resolver about them here.
 *
 * MUST be imported FIRST (before any aliased import resolves). With ts-node's
 * CommonJS emit, `require('./catalog-paths')` runs — and registers the matcher —
 * before the next `require('…/combat-encounter.engine')` is resolved.
 *
 * The whole presenter import chain is Node-safe (no react-native/expo): it pulls
 * only `@mechanics`, the pure `statusGlyphs`, and the dependency-free `keywords`.
 */
import { register } from 'tsconfig-paths';
import { join } from 'node:path';

const MECH = join(__dirname, '..');

register({
    baseUrl: MECH,
    paths: {
        '@mechanics': ['src/index.ts'],
        '@mechanics/*': ['src/*'],
        '@/*': ['../axiomancer-mobile/*'],
    },
});
