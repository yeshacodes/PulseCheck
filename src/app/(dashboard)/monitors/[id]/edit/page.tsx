import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser, createClient } from "@/lib/supabase/server";
import { MonitorForm } from "@/components/dashboard/monitor-form";

export const dynamic = "force-dynamic";

export default async function EditMonitorPage({ params }: PageProps<"/monitors/[id]/edit">) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const { data: monitor } = await supabase
    .from("monitors")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!monitor) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/monitors/${id}`} className="text-sm text-muted hover:text-foreground">
          ← Back to monitor
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">Edit monitor</h1>
      </div>
      <MonitorForm monitor={monitor} />
    </div>
  );
}
