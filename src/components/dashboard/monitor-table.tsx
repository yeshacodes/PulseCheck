import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { CheckNowButton } from "@/components/dashboard/check-now-button";
import { IconArrowRight } from "@/components/ui/icons";
import { formatMs, formatPercent, formatRelativeTime } from "@/lib/format";
import type { DashboardMonitor } from "@/lib/dashboard";

export function MonitorTable({ monitors }: { monitors: DashboardMonitor[] }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface sm:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-2 text-left text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Monitor</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Response</th>
              <th className="px-4 py-3 font-semibold">Uptime</th>
              <th className="px-4 py-3 font-semibold">Last checked</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {monitors.map((m) => (
              <tr key={m.id} className="transition-colors hover:bg-surface-2">
                <td className="px-4 py-3">
                  <Link
                    href={`/monitors/${m.id}`}
                    className="group inline-flex items-center gap-1 font-medium hover:text-accent-strong"
                  >
                    {m.name}
                    <IconArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                  <div className="max-w-xs truncate text-xs text-muted">{m.url}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={m.current_status} />
                </td>
                <td className="px-4 py-3 tabular-nums">{formatMs(m.last_response_ms)}</td>
                <td className="px-4 py-3 tabular-nums">{formatPercent(m.uptimePercent)}</td>
                <td className="px-4 py-3 text-muted">{formatRelativeTime(m.last_checked_at)}</td>
                <td className="px-4 py-3 text-right">
                  <CheckNowButton monitorId={m.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 sm:hidden">
        {monitors.map((m) => (
          <li key={m.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/monitors/${m.id}`} className="font-medium hover:text-accent-strong">
                  {m.name}
                </Link>
                <div className="truncate text-xs text-muted">{m.url}</div>
              </div>
              <StatusBadge status={m.current_status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span className="tabular-nums">{formatMs(m.last_response_ms)}</span>
              <span className="tabular-nums">{formatPercent(m.uptimePercent)} uptime</span>
              <span>{formatRelativeTime(m.last_checked_at)}</span>
            </div>
            <div className="mt-3">
              <CheckNowButton monitorId={m.id} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
