import { createAnonClient } from "@/lib/supabase/anon";
import { overallStatus, uptimePercent, type OverallStatus } from "@/lib/monitor/stats";
import { UPTIME_WINDOW_DAYS } from "@/lib/constants";
import type { IncidentRow } from "@/lib/supabase/types";

export interface PublicMonitorSummary {
  id: string;
  name: string;
  url: string;
  currentStatus: "pending" | "up" | "down";
  uptimePercent: number | null;
  lastCheckedAt: string | null;
}

export interface StatusPageData {
  workspaceName: string;
  slug: string;
  overall: OverallStatus;
  monitors: PublicMonitorSummary[];
  incidents: (Pick<IncidentRow, "id" | "started_at" | "resolved_at" | "status" | "failure_reason"> & {
    monitorName: string;
  })[];
  lastUpdated: string | null;
}

/**
 * Everything the public status page needs, for one slug. Uses the anon client, so
 * it only ever sees rows the "public read" RLS policies expose. Returns null when
 * the slug doesn't exist.
 */
export async function getStatusPageData(slug: string): Promise<StatusPageData | null> {
  const supabase = createAnonClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, status_page_slug")
    .eq("status_page_slug", slug)
    .maybeSingle();
  if (!profile) return null;

  const { data: monitors } = await supabase
    .from("monitors")
    .select("id, name, url, current_status, last_checked_at")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .order("name", { ascending: true });

  const monitorList = monitors ?? [];
  const windowStart = new Date(Date.now() - UPTIME_WINDOW_DAYS * 86_400_000).toISOString();

  const summaries: PublicMonitorSummary[] = await Promise.all(
    monitorList.map(async (m) => {
      const { data: checks } = await supabase
        .from("monitor_checks")
        .select("status, response_ms")
        .eq("monitor_id", m.id)
        .gte("checked_at", windowStart);
      return {
        id: m.id,
        name: m.name,
        url: m.url,
        currentStatus: m.current_status,
        uptimePercent: uptimePercent(checks ?? []),
        lastCheckedAt: m.last_checked_at,
      };
    }),
  );

  let incidents: StatusPageData["incidents"] = [];
  if (monitorList.length > 0) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const nameById = new Map(monitorList.map((m) => [m.id, m.name]));
    const { data: incidentRows } = await supabase
      .from("incidents")
      .select("id, monitor_id, started_at, resolved_at, status, failure_reason")
      .in(
        "monitor_id",
        monitorList.map((m) => m.id),
      )
      .or(`status.eq.active,started_at.gte.${sevenDaysAgo}`)
      .order("started_at", { ascending: false })
      .limit(20);
    incidents = (incidentRows ?? []).map((row) => ({
      id: row.id,
      started_at: row.started_at,
      resolved_at: row.resolved_at,
      status: row.status,
      failure_reason: row.failure_reason,
      monitorName: nameById.get(row.monitor_id) ?? "Monitor",
    }));
  }

  const lastUpdated = monitorList
    .map((m) => m.last_checked_at)
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1) ?? null;

  return {
    workspaceName: profile.full_name?.trim() || `${slug}'s status`,
    slug,
    overall: overallStatus(monitorList),
    monitors: summaries,
    incidents,
    lastUpdated,
  };
}
