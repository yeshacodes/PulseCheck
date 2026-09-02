import { createClient } from "@/lib/supabase/server";
import { UPTIME_WINDOW_DAYS } from "@/lib/constants";
import type { MonitorRow } from "@/lib/supabase/types";

export interface DashboardMonitor extends MonitorRow {
  uptimePercent: number | null;
}

export interface DashboardData {
  monitors: DashboardMonitor[];
  summary: {
    total: number;
    operational: number;
    down: number;
    avgUptime: number | null;
    activeIncidents: number;
  };
}

/**
 * Dashboard payload for the signed-in user: their monitors, each monitor's
 * uptime over the rolling window, and the summary-card totals.
 *
 * Checks are aggregated from a single capped query — fine at Phase 1 data
 * volumes. A materialised view would be the Phase 2 move.
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createClient();

  const { data: monitorRows } = await supabase
    .from("monitors")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  const monitors = monitorRows ?? [];

  const windowStart = new Date(Date.now() - UPTIME_WINDOW_DAYS * 86_400_000).toISOString();

  const uptimeByMonitor = new Map<string, { up: number; total: number }>();
  if (monitors.length > 0) {
    const { data: checks } = await supabase
      .from("monitor_checks")
      .select("monitor_id, status")
      .in(
        "monitor_id",
        monitors.map((m) => m.id),
      )
      .gte("checked_at", windowStart)
      .order("checked_at", { ascending: false })
      .limit(10_000);

    for (const c of checks ?? []) {
      const agg = uptimeByMonitor.get(c.monitor_id) ?? { up: 0, total: 0 };
      agg.total += 1;
      if (c.status === "up") agg.up += 1;
      uptimeByMonitor.set(c.monitor_id, agg);
    }
  }

  const decorated: DashboardMonitor[] = monitors.map((m) => {
    const agg = uptimeByMonitor.get(m.id);
    return {
      ...m,
      uptimePercent: agg && agg.total > 0 ? Math.round((agg.up / agg.total) * 1000) / 10 : null,
    };
  });

  let activeIncidents = 0;
  if (monitors.length > 0) {
    const { count } = await supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .in(
        "monitor_id",
        monitors.map((m) => m.id),
      )
      .eq("status", "active");
    activeIncidents = count ?? 0;
  }

  const withUptime = decorated.filter((m) => m.uptimePercent != null);
  const avgUptime =
    withUptime.length > 0
      ? Math.round(
          (withUptime.reduce((s, m) => s + (m.uptimePercent as number), 0) / withUptime.length) * 10,
        ) / 10
      : null;

  return {
    monitors: decorated,
    summary: {
      total: monitors.length,
      operational: decorated.filter((m) => m.current_status === "up").length,
      down: decorated.filter((m) => m.current_status === "down").length,
      avgUptime,
      activeIncidents,
    },
  };
}
