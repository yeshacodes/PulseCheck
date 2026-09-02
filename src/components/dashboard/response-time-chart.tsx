"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point {
  status: "up" | "down";
  response_ms: number | null;
  checked_at: string;
}

export function ResponseTimeChart({ data }: { data: Point[] }) {
  const points = data
    .filter((d) => typeof d.response_ms === "number")
    .map((d) => ({
      t: new Date(d.checked_at).getTime(),
      ms: d.response_ms as number,
      status: d.status,
    }));

  if (points.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted">
        Not enough checks yet to chart response time.
      </div>
    );
  }

  return (
    <div className="h-64 w-full rounded-2xl border border-border bg-surface p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="rt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent-strong)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-accent-strong)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeOpacity={0.6} vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            scale="time"
            tickFormatter={(v) =>
              new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
            }
            stroke="var(--color-muted)"
            fontSize={12}
            tickMargin={8}
          />
          <YAxis
            width={48}
            stroke="var(--color-muted)"
            fontSize={12}
            tickFormatter={(v) => `${v}ms`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--color-foreground)",
              boxShadow: "0 16px 40px -24px rgba(0,0,0,0.5)",
            }}
            labelFormatter={(v) => new Date(Number(v)).toLocaleString()}
            formatter={(value) => [`${Number(value)} ms`, "Response"]}
          />
          <Area
            type="monotone"
            dataKey="ms"
            stroke="var(--color-accent-strong)"
            strokeWidth={2.5}
            fill="url(#rt)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--color-accent-strong)", stroke: "var(--color-surface)" }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
