import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { getMonitorDetail } from "@/lib/monitor-detail";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { CheckNowButton } from "@/components/dashboard/check-now-button";
import { DeleteMonitorButton } from "@/components/dashboard/delete-monitor-button";
import { ResponseTimeChart } from "@/components/dashboard/response-time-chart";
import { IncidentList } from "@/components/dashboard/incident-list";
import { formatDateTime, formatMs, formatPercent, formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MonitorDetailPage({ params }: PageProps<"/monitors/[id]">) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const detail = await getMonitorDetail(user.id, id);
  if (!detail) notFound();

  const { monitor, recentChecks, windowChecks, incidents, stats } = detail;

  const facts = [
    { label: "Uptime (30d)", value: formatPercent(stats.uptimePercent) },
    { label: "Last response", value: formatMs(monitor.last_response_ms) },
    { label: "Avg response (30d)", value: formatMs(stats.avgResponseMs) },
    { label: "Last checked", value: formatRelativeTime(monitor.last_checked_at) },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
            ← Dashboard
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold">{monitor.name}</h1>
            <StatusBadge status={monitor.current_status} />
            {monitor.is_public ? (
              <span className="rounded-full bg-accent/12 px-2 py-0.5 text-xs font-medium text-accent-strong ring-1 ring-accent/25">
                Public
              </span>
            ) : null}
          </div>
          <a
            href={monitor.url}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-1 block max-w-lg truncate text-sm text-accent-strong hover:underline"
          >
            {monitor.url}
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          <CheckNowButton monitorId={monitor.id} variant="primary" />
          <Link href={`/monitors/${monitor.id}/edit`}>
            <Button variant="secondary" size="sm">
              Edit
            </Button>
          </Link>
          <DeleteMonitorButton monitorId={monitor.id} monitorName={monitor.name} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {facts.map((f) => (
          <Card key={f.label} className="flex flex-col gap-2">
            <CardTitle>{f.label}</CardTitle>
            <p className="font-display text-2xl font-bold tabular-nums">{f.value}</p>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Response time (30d)
        </h2>
        <ResponseTimeChart data={windowChecks} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Incident history
        </h2>
        <IncidentList incidents={incidents} emptyText="No incidents recorded for this monitor." />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Recent checks</h2>
        {recentChecks.length === 0 ? (
          <p className="text-sm text-muted">No checks yet. Use “Check now” to run one.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-2 text-left text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Result</th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Response</th>
                  <th className="px-4 py-3 font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentChecks.map((c) => (
                  <tr key={c.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted">
                      {formatDateTime(c.checked_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1",
                          c.status === "up"
                            ? "bg-up/10 text-up ring-up/25"
                            : "bg-down/10 text-down ring-down/25",
                        )}
                      >
                        {c.status === "up" ? "Up" : "Down"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{c.status_code ?? "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums">{formatMs(c.response_ms)}</td>
                    <td className="px-4 py-2.5 text-muted">{c.error_message ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
