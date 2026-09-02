import { handle, json, parseBody, requireUser, type RouteSupabase } from "@/lib/api";
import { badRequest, notFound } from "@/lib/errors";
import { updateMonitorSchema } from "@/lib/validation/schemas";
import { assertSafeUrl, UnsafeUrlError } from "@/lib/validation/url";
import type { Database, MonitorRow } from "@/lib/supabase/types";

type MonitorUpdate = Database["public"]["Tables"]["monitors"]["Update"];

export const runtime = "nodejs";

async function loadOwnedMonitor(supabase: RouteSupabase, userId: string, id: string): Promise<MonitorRow> {
  const { data, error } = await supabase
    .from("monitors")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound("Monitor not found.");
  return data;
}

/** GET /api/monitors/[id] */
export function GET(_request: Request, ctx: RouteContext<"/api/monitors/[id]">) {
  return handle("GET /api/monitors/[id]", async () => {
    const { supabase, user } = await requireUser();
    const { id } = await ctx.params;
    const monitor = await loadOwnedMonitor(supabase, user.id, id);
    return json({ monitor });
  });
}

/** PATCH /api/monitors/[id] */
export function PATCH(request: Request, ctx: RouteContext<"/api/monitors/[id]">) {
  return handle("PATCH /api/monitors/[id]", async () => {
    const { supabase, user } = await requireUser();
    const { id } = await ctx.params;
    await loadOwnedMonitor(supabase, user.id, id);

    const input = await parseBody(request, updateMonitorSchema);

    const patch: MonitorUpdate = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.expectedStatus !== undefined) patch.expected_status = input.expectedStatus;
    if (input.timeoutSeconds !== undefined) patch.timeout_ms = Math.round(input.timeoutSeconds * 1000);
    if (input.isPublic !== undefined) patch.is_public = input.isPublic;
    if (input.url !== undefined) {
      try {
        await assertSafeUrl(input.url);
      } catch (err) {
        if (err instanceof UnsafeUrlError) throw badRequest(err.message);
        throw err;
      }
      patch.url = input.url;
    }

    if (Object.keys(patch).length === 0) throw badRequest("Nothing to update.");

    const { data, error } = await supabase
      .from("monitors")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error) throw error;
    return json({ monitor: data });
  });
}

/** DELETE /api/monitors/[id] — checks + incidents cascade via FK. */
export function DELETE(_request: Request, ctx: RouteContext<"/api/monitors/[id]">) {
  return handle("DELETE /api/monitors/[id]", async () => {
    const { supabase, user } = await requireUser();
    const { id } = await ctx.params;
    await loadOwnedMonitor(supabase, user.id, id);

    const { error } = await supabase.from("monitors").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return json({ ok: true });
  });
}
