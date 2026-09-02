import { MonitorForm } from "@/components/dashboard/monitor-form";

export const metadata = { title: "Add monitor — PulseCheck" };

export default function NewMonitorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Add a monitor</h1>
        <p className="mt-1 text-sm text-muted">
          PulseCheck will check this endpoint now and then automatically every few minutes.
        </p>
      </div>
      <MonitorForm />
    </div>
  );
}
