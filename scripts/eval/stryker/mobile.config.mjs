// scripts/eval/stryker/mobile.config.mjs
//
// Stryker on the two combat presenters (phase EV1c, brief A5): the encounter
// engine and the card-face program lines. Run by `scripts/eval/mutation.mjs`
// with `axiomancer-mobile/` as the working directory; never part of
// `verify`. Only the tests jest relates to a mutated file run.

export default {
  testRunner: 'jest',
  plugins: ['@stryker-mutator/jest-runner'],
  jest: { projectType: 'custom', configFile: 'jest.config.js', enableFindRelatedTests: true },
  mutate: [
    'state/presenters/combat-encounter.engine.ts',
    'state/presenters/card-program.engine.ts',
  ],
  coverageAnalysis: 'perTest',
  ignoreStatic: true,
  reporters: ['json', 'progress'],
  jsonReporter: { fileName: process.env.EVAL_STRYKER_JSON ?? 'reports/mutation/mutation.json' },
  concurrency: Number(process.env.EVAL_STRYKER_CONCURRENCY ?? 2),
  timeoutMS: 15000,
  tempDirName: '.stryker-tmp',
  cleanTempDir: 'always',
}
