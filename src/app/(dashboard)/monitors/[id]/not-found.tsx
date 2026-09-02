import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";

export default function MonitorNotFound() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
      <LogoMark className="mx-auto size-12" />
      <h1 className="mt-4 font-display text-lg font-semibold">Monitor not found</h1>
      <p className="mt-1.5 text-sm text-muted">
        It may have been deleted, or it belongs to another account.
      </p>
      <Link href="/dashboard" className="mt-5 inline-block">
        <Button size="sm">Back to dashboard</Button>
      </Link>
    </div>
  );
}
