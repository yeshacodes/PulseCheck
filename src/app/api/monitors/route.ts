import { handle, json, parseBody, requireUser } from "@/lib/api";
import { badRequest, tooMany } from "@/lib/errors";
import { createMonitorSchema } from "@/lib/validation/schemas";
import { assertSafeUrl, UnsafeUrlError } from "@/lib/validation/url";
import { MAX_MONITORS_PER_USER } from "@/lib/constants";

export const runtime = "nodejs";

/** GET /api/monitors — the signed-in user's monitors. */
export function GET() {
  return handle("GET /api/monitors", async () => {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("monitors")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return json({ monitors: data });
  });
}

/** POST /api/monitors — create a monitor. */
export function POST(request: Request) {
  return handle("POST /api/monitors", async () => {
    const { supabase, user } = await requireUser();
    const input = await parseBody(request, createMonitorSchema);

    try {
      await assertSafeUrl(input.url);
    } catch (err) {
      if (err instanceof UnsafeUrlError) throw badRequest(err.message);
      throw err;
    }

    const { count, error: countError } = await supabase
      .from("monitors")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_MONITORS_PER_USER) {
      throw tooMany(`You can create at most ${MAX_MONITORS_PER_USER} monitors.`);
    }

    const { data, error } = await supabase
      .from("monitors")
      .insert({
        user_id: user.id,
        name: input.name,
        url: input.url,
        expected_status: input.expectedStatus,
        timeout_ms: Math.round(input.timeoutSeconds * 1000),
        current_status: "pending",
      })
      .select("*")
      .single();
    if (error) throw error;

    return json({ monitor: data }, { status: 201 });
  });
}
