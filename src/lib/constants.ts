/**
 * Phase 1 uses a single fixed automatic-check interval and hard limits everywhere
 * a user can influence what the server does. These are intentionally centralised.
 */

/** Maximum monitors a single user may create. */
export const MAX_MONITORS_PER_USER = 20;

/** How often the scheduled worker re-checks each monitor. */
export const CHECK_INTERVAL_MINUTES = 10;

/** Default request timeout for a new monitor. */
export const DEFAULT_TIMEOUT_MS = 10_000;

/** Lowest / highest request timeout a user may configure. */
export const MIN_TIMEOUT_MS = 1_000;
export const MAX_TIMEOUT_MS = 30_000;

/** Redirects are followed manually so each hop can be re-validated; this caps the chain. */
export const MAX_REDIRECTS = 3;

/** Consecutive failed checks required to open an incident. One success resolves it. */
export const FAILURE_THRESHOLD = 2;

/** Rolling window used for uptime percentage and the response-time chart. */
export const UPTIME_WINDOW_DAYS = 30;

/** Number of monitors checked in parallel by the scheduled worker. */
export const CRON_BATCH_SIZE = 5;

/** User-Agent sent with every health-check request. */
export const CHECK_USER_AGENT = "PulseCheck/1.0 (+https://github.com/) uptime-monitor";
