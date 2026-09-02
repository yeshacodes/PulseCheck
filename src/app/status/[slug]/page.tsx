import { notFound } from "next/navigation";
import { getStatusPageData } from "@/lib/status";
import { OVERALL_STATUS_LABEL } from "@/lib/monitor/stats";
import { StatusBadge } from "@/components/ui/status-badge";
import { IncidentList } from "@/components/dashboard/incident-list";
import { Logo, LogoMark } from "@/components/ui/logo";
import { formatDateTime, formatPercent, formatRelativeTime } from "@/lib/format";

export const revalidate = 60;

const bannerTone: Record<string, string> = {
  operational: "border-up/40 bg-up/10 text-up",
  partial_outage: "border-pending/40 bg-pending/10 text-pending",
  major_outage: "border-down/40 bg-down/10 text-down",
  no_data: "border-border bg-surface text-muted",
};

const bannerDot: Record<string, string> = {
  operational: "bg-up",
  partial_outage: "bg-pending",
  major_outage: "bg-down",
  no_data: "bg-muted",
};

export async function generateMetadata({ params }: PageProps<"/status/[slug]">) {
  const { slug } = await params;
  const data = await getStatusPageData(slug);
  return { title: data ? `${data.workspaceName} — Status` : "Status" };
}

export default async function StatusPage({ params }: PageProps<"/status/[slug]">) {
  const { slug } = await params;
  const data = await getStatusPageData(slug);
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">{data.workspaceName}</h1>
        <Logo markClassName="size-6" />
      </div>

      <div
        className={`mt-6 flex items-center gap-2.5 rounded-2xl border px-5 py-4 text-sm font-semibold ${bannerTone[data.overall]}`}
      >
        <span className={`size-2 rounded-full ${bannerDot[data.overall]}`} aria-hidden />
        {OVERALL_STATUS_LABEL[data.overall]}
      </div>

      <p className="mt-2 text-xs text-muted">
        Last updated {data.lastUpdated ? formatRelativeTime(data.lastUpdated) : "—"}
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Monitors</h2>
        {data.monitors.length === 0 ? (
          <p className="text-sm text-muted">No public monitors yet.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {data.monitors.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <p className="font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted">{m.url}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="tabular-nums">{formatPercent(m.uptimePercent)} uptime</span>
                  <StatusBadge status={m.currentStatus} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Recent incidents
        </h2>
        <IncidentList incidents={data.incidents} emptyText="No incidents in the last 7 days." />
      </section>

      <footer className="mt-12 flex items-center gap-2 text-xs text-muted">
        <LogoMark className="size-5" />
        <span>
          Powered by PulseCheck · Generated {formatDateTime(new Date().toISOString())}
        </span>
      </footer>
    </main>
  );
}
