import type { CheckStatus, MonitorCheckRow, MonitorRow } from "@/lib/supabase/types";

type CheckLike = Pick<MonitorCheckRow, "status" | "response_ms">;

/**
 * Uptime as a percentage of checks that passed, over whatever set of checks the
 * caller provides (Phase 1 uses the last `UPTIME_WINDOW_DAYS`). `null` when there
 * are no checks yet.
 */
export function uptimePercent(checks: CheckLike[]): number | null {
  if (checks.length === 0) return null;
  const up = checks.filter((c) => c.status === "up").length;
  return Math.round((up / checks.length) * 1000) / 10;
}

/** Mean response time of successful checks only. `null` when there are none. */
export function avgResponseMs(checks: CheckLike[]): number | null {
  const times = checks
    .filter((c) => c.status === "up" && typeof c.response_ms === "number")
    .map((c) => c.response_ms as number);
  if (times.length === 0) return null;
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
}

export type OverallStatus = "operational" | "partial_outage" | "major_outage" | "no_data";

/** Roll a set of public monitors up into a single headline status. */
export function overallStatus(monitors: Pick<MonitorRow, "current_status">[]): OverallStatus {
  if (monitors.length === 0) return "no_data";
  const down = monitors.filter((m) => m.current_status === "down").length;
  if (down === 0) return "operational";
  if (down === monitors.length) return "major_outage";
  return "partial_outage";
}

export const OVERALL_STATUS_LABEL: Record<OverallStatus, string> = {
  operational: "All systems operational",
  partial_outage: "Partial outage",
  major_outage: "Major outage",
  no_data: "No data yet",
};

/** Count of checks by status, for small summaries. */
export function countByStatus(checks: CheckLike[]): Record<CheckStatus, number> {
  return {
    up: checks.filter((c) => c.status === "up").length,
    down: checks.filter((c) => c.status === "down").length,
  };
}
