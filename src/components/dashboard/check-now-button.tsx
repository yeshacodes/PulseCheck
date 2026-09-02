"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function CheckNowButton({
  monitorId,
  size = "sm",
  variant = "secondary",
}: {
  monitorId: string;
  size?: "sm" | "md";
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function run() {
    setLoading(true);
    try {
      const res = await fetch(`/api/monitors/${monitorId}/check`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        toast("error", body.error ?? "Check failed.");
        return;
      }
      const status = body.result?.status;
      if (status === "up") toast("success", `Up · ${body.result.responseMs} ms`);
      else toast("error", `Down · ${body.result?.errorMessage ?? "check failed"}`);
      if (body.incidentOpened) toast("error", "Incident opened.");
      if (body.incidentResolved) toast("success", "Incident resolved.");
      startTransition(() => router.refresh());
    } catch {
      toast("error", "Check failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size={size} variant={variant} onClick={run} disabled={loading || isPending}>
      {loading ? "Checking…" : "Check now"}
    </Button>
  );
}
