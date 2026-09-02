import { Card, CardTitle } from "@/components/ui/card";
import { IconAlert, IconCheckCircle, IconGauge, IconList, IconPulse } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";
import type { DashboardData } from "@/lib/dashboard";

export function SummaryCards({ summary }: { summary: DashboardData["summary"] }) {
  const cards = [
    { label: "Total monitors", value: String(summary.total), Icon: IconList },
    {
      label: "Operational",
      value: String(summary.operational),
      tone: "text-up",
      Icon: IconCheckCircle,
    },
    {
      label: "Down",
      value: String(summary.down),
      tone: summary.down > 0 ? "text-down" : undefined,
      Icon: IconPulse,
    },
    { label: "Average uptime", value: formatPercent(summary.avgUptime), Icon: IconGauge },
    {
      label: "Active incidents",
      value: String(summary.activeIncidents),
      tone: summary.activeIncidents > 0 ? "text-down" : undefined,
      Icon: IconAlert,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.label} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle>{c.label}</CardTitle>
            <c.Icon className="size-4 text-muted/70" />
          </div>
          <p className={cn("font-display text-3xl font-bold tabular-nums", c.tone)}>{c.value}</p>
        </Card>
      ))}
    </div>
  );
}
