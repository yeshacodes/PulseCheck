"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createMonitorSchema } from "@/lib/validation/schemas";
import type { MonitorRow } from "@/lib/supabase/types";

const clientSchema = createMonitorSchema;
type FormErrors = Partial<Record<"name" | "url" | "expectedStatus" | "timeoutSeconds" | "form", string>>;

export function MonitorForm({ monitor }: { monitor?: MonitorRow }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(monitor);

  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = new FormData(e.currentTarget);
    const values = {
      name: String(form.get("name") ?? ""),
      url: String(form.get("url") ?? ""),
      expectedStatus: String(form.get("expectedStatus") ?? "200"),
      timeoutSeconds: String(form.get("timeoutSeconds") ?? "10"),
    };

    const parsed = clientSchema.safeParse(values);
    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of (parsed.error as z.ZodError).issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    const body: Record<string, unknown> = { ...parsed.data };
    if (isEdit) body.isPublic = form.get("isPublic") === "on";

    setPending(true);
    const res = await fetch(isEdit ? `/api/monitors/${monitor!.id}` : "/api/monitors", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setPending(false);

    if (!res.ok) {
      setErrors({ form: json.error ?? "Could not save the monitor." });
      return;
    }

    toast("success", isEdit ? "Monitor updated." : "Monitor created.");
    router.push(isEdit ? `/monitors/${monitor!.id}` : `/monitors/${json.monitor.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg" noValidate>
      <Card className="space-y-5 p-6">
        <Field label="Monitor name" error={errors.name}>
          {(id) => (
            <Input
              id={id}
              name="name"
              defaultValue={monitor?.name}
              placeholder="Marketing site"
              required
            />
          )}
        </Field>

        <Field
          label="Website or API URL"
          error={errors.url}
          hint="Must be a public http:// or https:// address."
        >
          {(id) => (
            <Input
              id={id}
              name="url"
              type="url"
              defaultValue={monitor?.url}
              placeholder="https://example.com/health"
              required
            />
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Expected status code" error={errors.expectedStatus}>
            {(id) => (
              <Input
                id={id}
                name="expectedStatus"
                type="number"
                min={100}
                max={599}
                defaultValue={monitor?.expected_status ?? 200}
              />
            )}
          </Field>
          <Field label="Timeout (seconds)" error={errors.timeoutSeconds}>
            {(id) => (
              <Input
                id={id}
                name="timeoutSeconds"
                type="number"
                min={1}
                max={30}
                defaultValue={monitor ? monitor.timeout_ms / 1000 : 10}
              />
            )}
          </Field>
        </div>

        {isEdit ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isPublic"
              defaultChecked={monitor?.is_public}
              className="size-4 rounded border-border accent-[var(--color-accent)]"
            />
            Show this monitor on the public status page
          </label>
        ) : null}

        {errors.form ? <p className="text-sm text-down">{errors.form}</p> : null}
      </Card>

      <div className="mt-5 flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create monitor"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
