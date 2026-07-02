import { PersistenceAdapter } from './types';

/**
 * nullAdapter
 *
 * A no-op persistence adapter for CLIs, combat simulators, and unit tests.
 * State is held in memory only — nothing is ever read from or written to disk.
 */
export const nullAdapter: PersistenceAdapter = {
    load: () => null,
    save: () => {},
};
