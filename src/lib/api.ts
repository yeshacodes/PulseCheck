import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { ZodType } from "zod";
import { createClient } from "@/lib/supabase/server";
import { badRequest, toPublicError, unauthorized } from "@/lib/errors";
import type { Database } from "@/lib/supabase/types";

export type RouteSupabase = SupabaseClient<Database>;

/** Resolve the signed-in user or throw a 401 `ApiError`. */
export async function requireUser(): Promise<{ supabase: RouteSupabase; user: User }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw unauthorized();
  return { supabase, user };
}

/** Parse + validate a JSON body against a Zod schema, or throw a 400 `ApiError`. */
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw badRequest("Request body must be valid JSON.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Invalid request.");
  }
  return parsed.data;
}

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/** Wrap a handler so any thrown `ApiError`/unknown becomes a safe JSON response. */
export function handle(
  context: string,
  fn: () => Promise<NextResponse | Response>,
): Promise<NextResponse | Response> {
  return fn().catch((err) => {
    const { status, body } = toPublicError(err, context);
    return NextResponse.json(body, { status });
  });
}
