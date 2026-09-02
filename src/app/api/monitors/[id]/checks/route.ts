import { handle, json, requireUser } from "@/lib/api";
import { notFound } from "@/lib/errors";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/** GET /api/monitors/[id]/checks?limit=50 — recent check history, newest first. */
export function GET(request: Request, ctx: RouteContext<"/api/monitors/[id]/checks">) {
  return handle("GET /api/monitors/[id]/checks", async () => {
    const { supabase, user } = await requireUser();
    const { id } = await ctx.params;

    const { data: monitor } = await supabase
      .from("monitors")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!monitor) throw notFound("Monitor not found.");

    const limitParam = Number(new URL(request.url).searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;

    const { data, error } = await supabase
      .from("monitor_checks")
      .select("*")
      .eq("monitor_id", id)
      .order("checked_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    return json({ checks: data });
  });
}
