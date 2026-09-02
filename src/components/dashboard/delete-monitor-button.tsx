"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function DeleteMonitorButton({ monitorId, monitorName }: { monitorId: string; monitorName: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function confirmDelete() {
    setPending(true);
    const res = await fetch(`/api/monitors/${monitorId}`, { method: "DELETE" });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast("error", body.error ?? "Could not delete the monitor.");
      return;
    }
    toast("success", "Monitor deleted.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Delete
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5">
            <h2 className="font-medium">Delete “{monitorName}”?</h2>
            <p className="mt-2 text-sm text-muted">
              This permanently removes the monitor and all of its check history and incidents. This
              cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={confirmDelete} disabled={pending}>
                {pending ? "Deleting…" : "Delete monitor"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
