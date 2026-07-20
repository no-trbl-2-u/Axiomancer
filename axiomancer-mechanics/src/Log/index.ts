/** AXM Log barrel — see docs/logging.md for the contract. */

export {
    createAxmLogger, getLogger, configureLogging, isLoggingEnabled,
    resetLoggingForTests, forwardCombatEventsToLog,
} from './logger';
export type { AxmLogger } from './logger';
export type {
    AxmLogEntry, AxmLogLevel, AxmLogDomain, AxmLogSink, AxmLogFilter,
    AxmLoggerStats, AxmLoggerConfig,
} from './log.types';
export { AXM_LOG_LEVELS, AXM_LOG_DOMAINS, AXM_LOG_LEVEL_RANK } from './log.types';
