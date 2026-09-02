import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runCheckForMonitor } from "@/lib/monitor/run";
import { CHECK_INTERVAL_MINUTES, CRON_BATCH_SIZE } from "@/lib/constants";
import { toPublicError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const provided = header.replace(/^Bearer\s+/i, "");
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * POST /api/cron/check-monitors
 * Called by the scheduled GitHub Actions workflow. Checks every monitor whose
 * last check is older than the fixed interval (or has never been checked).
 */
export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const cutoff = new Date(Date.now() - CHECK_INTERVAL_MINUTES * 60_000).toISOString();

    const { data: allMonitors, error } = await supabase
      .from("monitors")
      .select("id, url, expected_status, timeout_ms, last_checked_at")
      .order("last_checked_at", { ascending: true, nullsFirst: true })
      .limit(500);
    if (error) throw error;

    // Only check monitors that are due (never checked, or older than the interval).
    const monitors = (allMonitors ?? [])
      .filter((m) => !m.last_checked_at || m.last_checked_at < cutoff)
      .slice(0, 200);

    let up = 0;
    let down = 0;
    let incidentsOpened = 0;
    let incidentsResolved = 0;

    for (let i = 0; i < monitors.length; i += CRON_BATCH_SIZE) {
      const batch = monitors.slice(i, i + CRON_BATCH_SIZE);
      const outcomes = await Promise.allSettled(batch.map((m) => runCheckForMonitor(supabase, m)));
      for (const o of outcomes) {
        if (o.status !== "fulfilled") {
          console.error("[cron] check failed:", o.reason);
          continue;
        }
        if (o.value.result.status === "up") up++;
        else down++;
        if (o.value.incidentOpened) incidentsOpened++;
        if (o.value.incidentResolved) incidentsResolved++;
      }
    }

    return NextResponse.json({
      checked: monitors.length,
      up,
      down,
      incidentsOpened,
      incidentsResolved,
    });
  } catch (err) {
    const { status, body } = toPublicError(err, "POST /api/cron/check-monitors");
    return NextResponse.json(body, { status });
  }
}
