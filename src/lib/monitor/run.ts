import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MonitorRow } from "@/lib/supabase/types";
import { performCheck } from "./check";
import { recordCheckResult, type RecordOutcome } from "./persist";

type Db = SupabaseClient<Database>;
type RunnableMonitor = Pick<MonitorRow, "id" | "url" | "expected_status" | "timeout_ms">;

/** Check one monitor and persist the outcome. Shared by the manual and cron paths. */
export async function runCheckForMonitor(supabase: Db, monitor: RunnableMonitor): Promise<RecordOutcome> {
  const result = await performCheck({
    url: monitor.url,
    expectedStatus: monitor.expected_status,
    timeoutMs: monitor.timeout_ms,
  });
  return recordCheckResult(supabase, monitor, result);
}
