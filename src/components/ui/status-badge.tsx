import { cn } from "@/lib/cn";
import type { MonitorStatus } from "@/lib/supabase/types";

const config: Record<MonitorStatus, { label: string; dot: string; text: string; ring: string }> = {
  up: { label: "Operational", dot: "bg-up", text: "text-up", ring: "bg-up/10 ring-up/25" },
  down: { label: "Down", dot: "bg-down", text: "text-down", ring: "bg-down/10 ring-down/25" },
  pending: {
    label: "Pending",
    dot: "bg-pending",
    text: "text-pending",
    ring: "bg-pending/10 ring-pending/25",
  },
};

export function StatusBadge({ status, className }: { status: MonitorStatus; className?: string }) {
  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        c.ring,
        c.text,
        className,
      )}
    >
      <span className="relative flex size-1.5">
        {status === "up" ? (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-up opacity-60" />
        ) : null}
        <span className={cn("relative inline-flex size-1.5 rounded-full", c.dot)} aria-hidden />
      </span>
      {c.label}
    </span>
  );
}
