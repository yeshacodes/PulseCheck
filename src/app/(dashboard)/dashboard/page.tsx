import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/dashboard";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { MonitorTable } from "@/components/dashboard/monitor-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Dashboard — PulseCheck" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");

  const { monitors, summary } = await getDashboardData(user.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <Link href="/monitors/new">
          <Button size="sm">Add monitor</Button>
        </Link>
      </div>

      <SummaryCards summary={summary} />

      {monitors.length === 0 ? (
        <EmptyState
          title="No monitors yet"
          body="Add a website or API endpoint and PulseCheck will start tracking its uptime and response time."
          action={
            <Link href="/monitors/new">
              <Button>Add your first monitor</Button>
            </Link>
          }
        />
      ) : (
        <MonitorTable monitors={monitors} />
      )}
    </div>
  );
}
