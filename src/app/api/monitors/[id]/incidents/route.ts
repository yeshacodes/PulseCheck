import { handle, json, requireUser } from "@/lib/api";
import { notFound } from "@/lib/errors";

export const runtime = "nodejs";

/** GET /api/monitors/[id]/incidents — incident history, newest first. */
export function GET(_request: Request, ctx: RouteContext<"/api/monitors/[id]/incidents">) {
  return handle("GET /api/monitors/[id]/incidents", async () => {
    const { supabase, user } = await requireUser();
    const { id } = await ctx.params;

    const { data: monitor } = await supabase
      .from("monitors")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!monitor) throw notFound("Monitor not found.");

    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("monitor_id", id)
      .order("started_at", { ascending: false });
    if (error) throw error;

    return json({ incidents: data });
  });
}
