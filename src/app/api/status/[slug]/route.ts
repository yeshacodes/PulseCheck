import { NextResponse } from "next/server";
import { getStatusPageData } from "@/lib/status";
import { toPublicError } from "@/lib/errors";

export const runtime = "nodejs";
export const revalidate = 60;

/** GET /api/status/[slug] — public, no auth. */
export async function GET(_request: Request, ctx: RouteContext<"/api/status/[slug]">) {
  try {
    const { slug } = await ctx.params;
    const data = await getStatusPageData(slug);
    if (!data) return NextResponse.json({ error: "Status page not found." }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    const { status, body } = toPublicError(err, "GET /api/status/[slug]");
    return NextResponse.json(body, { status });
  }
}
