import { createClient } from "@/lib/supabase/server";
import { avgResponseMs, uptimePercent } from "@/lib/monitor/stats";
import { UPTIME_WINDOW_DAYS } from "@/lib/constants";
import type { IncidentRow, MonitorCheckRow, MonitorRow } from "@/lib/supabase/types";

export interface MonitorDetail {
  monitor: MonitorRow;
  recentChecks: MonitorCheckRow[];
  windowChecks: Pick<MonitorCheckRow, "status" | "response_ms" | "checked_at">[];
  incidents: IncidentRow[];
  stats: {
    uptimePercent: number | null;
    avgResponseMs: number | null;
  };
}

/** Full detail payload for one monitor the user owns, or null. */
export async function getMonitorDetail(userId: string, monitorId: string): Promise<MonitorDetail | null> {
  const supabase = await createClient();

  const { data: monitor } = await supabase
    .from("monitors")
    .select("*")
    .eq("id", monitorId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!monitor) return null;

  const windowStart = new Date(Date.now() - UPTIME_WINDOW_DAYS * 86_400_000).toISOString();

  const [{ data: recentChecks }, { data: windowChecks }, { data: incidents }] = await Promise.all([
    supabase
      .from("monitor_checks")
      .select("*")
      .eq("monitor_id", monitorId)
      .order("checked_at", { ascending: false })
      .limit(50),
    supabase
      .from("monitor_checks")
      .select("status, response_ms, checked_at")
      .eq("monitor_id", monitorId)
      .gte("checked_at", windowStart)
      .order("checked_at", { ascending: true })
      .limit(2000),
    supabase
      .from("incidents")
      .select("*")
      .eq("monitor_id", monitorId)
      .order("started_at", { ascending: false })
      .limit(50),
  ]);

  return {
    monitor,
    recentChecks: recentChecks ?? [],
    windowChecks: windowChecks ?? [],
    incidents: incidents ?? [],
    stats: {
      uptimePercent: uptimePercent(windowChecks ?? []),
      avgResponseMs: avgResponseMs(windowChecks ?? []),
    },
  };
}
