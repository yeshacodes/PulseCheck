import { handle, json, requireUser } from "@/lib/api";
import { notFound } from "@/lib/errors";
import { runCheckForMonitor } from "@/lib/monitor/run";

export const runtime = "nodejs";

/** POST /api/monitors/[id]/check — run a check right now. */
export function POST(_request: Request, ctx: RouteContext<"/api/monitors/[id]/check">) {
  return handle("POST /api/monitors/[id]/check", async () => {
    const { supabase, user } = await requireUser();
    const { id } = await ctx.params;

    const { data: monitor, error } = await supabase
      .from("monitors")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!monitor) throw notFound("Monitor not found.");

    const outcome = await runCheckForMonitor(supabase, monitor);

    const { data: fresh } = await supabase.from("monitors").select("*").eq("id", id).single();

    return json({
      monitor: fresh ?? monitor,
      result: outcome.result,
      incidentOpened: outcome.incidentOpened,
      incidentResolved: outcome.incidentResolved,
    });
  });
}
