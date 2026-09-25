/**
 * State fixtures barrel — declarative test states compiled through the
 * engine (`docs/state-fixtures.md` at the monorepo root is the guide).
 */
export type { StateFixture } from './state-fixture.types';
export { buildStateFromFixture } from './state-fixture.builder';
export {
    StateFixtureError, problemsFor, validateStateFixture, parseStateFixture,
} from './state-fixture.validate';
export {
    STATE_FIXTURES, getStateFixtureById, listStateFixtureIds,
} from './state-fixture.registry';
