/**
 * Seeds a public demo account so the landing page's "sample status page" link
 * (/status/demo) has something to show.
 *
 *   npm run seed
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (and the NEXT_PUBLIC_SUPABASE_* vars) in
 * .env.local. Safe to run repeatedly — it resets the demo user's monitors.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/types";
import { runCheckForMonitor } from "../src/lib/monitor/run";

const DEMO_EMAIL = "demo@pulsecheck.local";
const DEMO_PASSWORD = "pulsecheck-demo-1234";
const DEMO_SLUG = "demo";

const MONITORS = [
  { name: "Example.com", url: "https://example.com", expected_status: 200, timeout_ms: 10_000 },
  { name: "Wikipedia", url: "https://www.wikipedia.org", expected_status: 200, timeout_ms: 10_000 },
  { name: "Broken endpoint (demo)", url: "https://httpstat.us/500", expected_status: 200, timeout_ms: 10_000 },
  { name: "Slow endpoint (demo)", url: "https://httpstat.us/200?sleep=250", expected_status: 200, timeout_ms: 10_000 },
];

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name} (add it to .env.local)`);
  return v;
}

async function main() {
  const admin = createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // 1. Find or create the demo auth user.
  let userId: string | undefined;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "PulseCheck Demo" },
  });

  if (created?.user) {
    userId = created.user.id;
    console.log("Created demo user:", DEMO_EMAIL);
  } else {
    // Already exists — page through users to find it.
    for (let page = 1; page <= 20 && !userId; page++) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      userId = data.users.find((u) => u.email === DEMO_EMAIL)?.id;
      if (data.users.length < 200) break;
    }
    if (!userId) throw createErr ?? new Error("Could not find or create the demo user");
    console.log("Reusing existing demo user:", DEMO_EMAIL);
  }

  // 2. Point the profile at /status/demo.
  const { error: profileErr } = await admin
    .from("profiles")
    .update({ status_page_slug: DEMO_SLUG, full_name: "PulseCheck Demo" })
    .eq("id", userId);
  if (profileErr) throw profileErr;

  // 3. Reset monitors.
  await admin.from("monitors").delete().eq("user_id", userId);
  const { data: inserted, error: insertErr } = await admin
    .from("monitors")
    .insert(MONITORS.map((m) => ({ ...m, user_id: userId!, is_public: true, current_status: "pending" as const })))
    .select("*");
  if (insertErr) throw insertErr;
  console.log(`Inserted ${inserted!.length} public monitors`);

  // 4. Run one real check per monitor.
  for (const monitor of inserted!) {
    const outcome = await runCheckForMonitor(admin, monitor);
    console.log(`  ${monitor.name}: ${outcome.result.status} (${outcome.result.responseMs} ms)`);
  }

  console.log(`\nDone. Sign in as ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Public status page: /status/${DEMO_SLUG}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
