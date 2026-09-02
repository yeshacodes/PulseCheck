import { cn } from "@/lib/cn";

/** The PulseCheck glyph: a heartbeat trace in a tinted rounded square. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/30",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[66%]" aria-hidden>
        <path
          d="M2.5 12.5h3.6l2-6a1 1 0 0 1 1.92.06l3 11.2 2.05-7a1 1 0 0 1 1.9-.1l1 2.34h2.53"
          stroke="var(--color-accent-strong)"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={cn("size-7", markClassName)} />
      <span className="font-display text-[17px] font-bold tracking-tight">
        Pulse<span className="text-accent-strong">Check</span>
      </span>
    </span>
  );
}
