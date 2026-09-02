import { cn } from "@/lib/cn";
import { formatDateTime, incidentDurationLabel } from "@/lib/format";

export interface IncidentListItem {
  id: string;
  started_at: string;
  resolved_at: string | null;
  status: "active" | "resolved";
  failure_reason: string | null;
  monitorName?: string;
}

export function IncidentList({
  incidents,
  emptyText,
}: {
  incidents: IncidentListItem[];
  emptyText: string;
}) {
  if (incidents.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {incidents.map((i) => {
        const active = i.status === "active";
        return (
          <li key={i.id} className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold ring-1",
                    active
                      ? "bg-down/10 text-down ring-down/25"
                      : "bg-up/10 text-up ring-up/25",
                  )}
                >
                  {active ? "Ongoing" : "Resolved"}
                </span>
                {i.monitorName ? (
                  <span className="text-sm font-medium">{i.monitorName}</span>
                ) : null}
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {i.failure_reason ?? "Endpoint check failed"}
              </p>
            </div>
            <div className="shrink-0 text-right text-xs tabular-nums text-muted">
              <div>{formatDateTime(i.started_at)}</div>
              <div>{incidentDurationLabel(i.started_at, i.resolved_at)}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
