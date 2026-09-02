import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  IconArrowRight,
  IconBell,
  IconChart,
  IconPulse,
  IconShare,
} from "@/components/ui/icons";

const FEATURES = [
  {
    icon: IconPulse,
    title: "Real health checks",
    body: "PulseCheck fetches your endpoint, measures response time, and compares the status code against what you expect — no synthetic guesswork.",
  },
  {
    icon: IconChart,
    title: "Uptime history & incidents",
    body: "Every check is stored. See uptime percentage, a response-time chart, and a full incident log for each monitor.",
  },
  {
    icon: IconBell,
    title: "Automatic monitoring",
    body: "A scheduled worker re-checks every monitor on a fixed interval. Two failures open an incident; a recovery closes it.",
  },
  {
    icon: IconShare,
    title: "Public status page",
    body: "Flip a monitor to public and share a clean status page on your own slug — no login required for viewers.",
  },
];

const STEPS = [
  { n: "01", title: "Add an endpoint", body: "Drop in a URL, the status code you expect, and a timeout." },
  { n: "02", title: "PulseCheck watches it", body: "Manual checks on demand, plus automatic checks around the clock." },
  { n: "03", title: "Share the status", body: "Publish a status page and let everyone see uptime at a glance." },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <header className="flex items-center justify-between py-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Register</Button>
          </Link>
        </nav>
      </header>

      <section className="pt-14 sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          Uptime &amp; health monitoring
        </span>

        <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
          Know the moment your site or API <span className="text-gradient">goes down</span>.
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted">
          PulseCheck watches your websites and endpoints, records response times and uptime, raises
          incidents on failure, and gives you a shareable public status page.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/register">
            <Button size="lg">
              Start monitoring
              <IconArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/status/demo">
            <Button variant="secondary" size="lg">
              View a sample status page
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-sm text-muted">Free to self-host on Vercel + Supabase.</p>
      </section>

      <section className="mt-16">
        <MockPanel />
      </section>

      <section className="mt-24 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="group rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent/40 hover:bg-surface-2"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-accent/12 text-accent-strong ring-1 ring-accent/25">
              <f.icon className="size-5" />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-muted">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-24">
        <h2 className="font-display text-2xl font-bold">How it works</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n}>
              <p className="font-display text-2xl font-bold text-accent-strong">{s.n}</p>
              <p className="mt-2 font-medium">{s.title}</p>
              <p className="mt-1 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-24 rounded-2xl border border-border bg-surface p-8 text-center sm:p-12">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">
          Start monitoring in under a minute.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          Create an account, add your first endpoint, and run a real check right away.
        </p>
        <Link href="/register" className="mt-6 inline-block">
          <Button size="lg">
            Create your account
            <IconArrowRight className="size-4" />
          </Button>
        </Link>
      </section>

      <footer className="mt-20 flex flex-col items-center justify-between gap-3 border-t border-border py-8 text-sm text-muted sm:flex-row">
        <Logo markClassName="size-6" />
        <p>Built by Yesha Bhavsar · Next.js · Supabase · Tailwind CSS</p>
      </footer>
    </div>
  );
}

/** Static illustrative preview of the product — not wired to data. */
function MockPanel() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-2 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.5)]">
      <div className="rounded-xl border border-border bg-background p-5">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="ml-3 text-xs text-muted">pulsecheck · dashboard</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Operational", value: "4", tone: "text-up" },
            { label: "Down", value: "1", tone: "text-down" },
            { label: "Avg uptime", value: "99.94%", tone: "" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-surface p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {s.label}
              </p>
              <p className={`mt-1 font-display text-xl font-bold ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <MockRow name="Marketing site" meta="142 ms · 99.98%" status="up" />
          <MockRow name="API · /health" meta="88 ms · 100%" status="up" />
          <MockRow name="Checkout" meta="timed out · 97.1%" status="down" />
        </div>
      </div>
    </div>
  );
}

function MockRow({
  name,
  meta,
  status,
}: {
  name: string;
  meta: string;
  status: "up" | "down";
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted">{meta}</p>
      </div>
      <span
        className={
          status === "up"
            ? "inline-flex items-center gap-1.5 rounded-full bg-up/10 px-2.5 py-1 text-xs font-semibold text-up ring-1 ring-up/25"
            : "inline-flex items-center gap-1.5 rounded-full bg-down/10 px-2.5 py-1 text-xs font-semibold text-down ring-1 ring-down/25"
        }
      >
        <span
          className={`size-1.5 rounded-full ${status === "up" ? "bg-up" : "bg-down"}`}
          aria-hidden
        />
        {status === "up" ? "Operational" : "Down"}
      </span>
    </div>
  );
}
