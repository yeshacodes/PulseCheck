import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MonitorRow } from "@/lib/supabase/types";
import type { CheckResult } from "./check";

type Db = SupabaseClient<Database>;
type MonitorForPersist = Pick<MonitorRow, "id" | "expected_status">;

export interface RecordOutcome {
  result: CheckResult;
  incidentOpened: boolean;
  incidentResolved: boolean;
}

/**
 * Persists one check result and advances the monitor + incident state.
 *
 * Incident rules (Phase 1):
 *  - two consecutive `down` checks open an incident (started_at = the first of
 *    the two failures), so a single blip does not page anyone
 *  - one `up` check resolves the active incident
 *
 * Works with either the RLS-scoped server client or the service-role client.
 */
export async function recordCheckResult(
  supabase: Db,
  monitor: MonitorForPersist,
  result: CheckResult,
  now: Date = new Date(),
): Promise<RecordOutcome> {
  const checkedAt = now.toISOString();

  // Most recent check BEFORE this one — needed to detect two-in-a-row failures.
  const { data: prevChecks } = await supabase
    .from("monitor_checks")
    .select("status, checked_at")
    .eq("monitor_id", monitor.id)
    .order("checked_at", { ascending: false })
    .limit(1);
  const previousCheck = prevChecks?.[0] ?? null;

  // 1. Record this check.
  const { error: insertError } = await supabase.from("monitor_checks").insert({
    monitor_id: monitor.id,
    status: result.status,
    status_code: result.statusCode,
    response_ms: result.responseMs,
    error_message: result.errorMessage,
    checked_at: checkedAt,
  });
  if (insertError) throw insertError;

  // 2. Update the monitor's live status.
  const { error: updateError } = await supabase
    .from("monitors")
    .update({
      current_status: result.status,
      last_response_ms: result.responseMs,
      last_checked_at: checkedAt,
    })
    .eq("id", monitor.id);
  if (updateError) throw updateError;

  // 3. Incident state machine.
  const { data: activeIncidents } = await supabase
    .from("incidents")
    .select("id")
    .eq("monitor_id", monitor.id)
    .eq("status", "active")
    .limit(1);
  const activeIncident = activeIncidents?.[0] ?? null;

  let incidentOpened = false;
  let incidentResolved = false;

  if (result.status === "down") {
    if (!activeIncident && previousCheck?.status === "down") {
      const { error } = await supabase.from("incidents").insert({
        monitor_id: monitor.id,
        started_at: previousCheck.checked_at,
        status: "active",
        failure_reason: result.errorMessage,
      });
      // A concurrent check may have opened it first; the partial unique index
      // rejects the duplicate and that's fine.
      if (error && error.code !== "23505") throw error;
      incidentOpened = !error;
    }
  } else if (activeIncident) {
    const { error } = await supabase
      .from("incidents")
      .update({ status: "resolved", resolved_at: checkedAt })
      .eq("id", activeIncident.id);
    if (error) throw error;
    incidentResolved = true;
  }

  return { result, incidentOpened, incidentResolved };
}
