import { describe, it, expect, beforeEach } from "vitest";
import { recordCheckResult } from "@/lib/monitor/persist";
import type { CheckResult } from "@/lib/monitor/check";
import { makeFakeSupabase, type FakeStore } from "./helpers/fake-supabase";

const monitor = { id: "m1", expected_status: 200 };
const downResult: CheckResult = {
  status: "down",
  statusCode: 500,
  responseMs: 12,
  errorMessage: "Unexpected status code: 500 (expected 200)",
};
const upResult: CheckResult = { status: "up", statusCode: 200, responseMs: 34, errorMessage: null };

let store: FakeStore;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

beforeEach(() => {
  store = { monitors: [{ ...monitor }], monitor_checks: [], incidents: [] };
  db = makeFakeSupabase(store);
});

const at = (min: number) => new Date(Date.UTC(2026, 0, 1, 0, min, 0));

describe("incident state machine", () => {
  it("does not open an incident on a single failure", async () => {
    const out = await recordCheckResult(db, monitor, downResult, at(0));
    expect(out.incidentOpened).toBe(false);
    expect(store.incidents).toHaveLength(0);
    expect(store.monitors[0].current_status).toBe("down");
  });

  it("opens exactly one incident after two consecutive failures", async () => {
    await recordCheckResult(db, monitor, downResult, at(0));
    const second = await recordCheckResult(db, monitor, downResult, at(10));
    const third = await recordCheckResult(db, monitor, downResult, at(20));

    expect(second.incidentOpened).toBe(true);
    expect(third.incidentOpened).toBe(false);
    expect(store.incidents).toHaveLength(1);
    expect(store.incidents[0].status).toBe("active");
    // started_at is the first of the two failures
    expect(store.incidents[0].started_at).toBe(at(0).toISOString());
  });

  it("resolves the active incident on the next successful check", async () => {
    await recordCheckResult(db, monitor, downResult, at(0));
    await recordCheckResult(db, monitor, downResult, at(10));

    const recovery = await recordCheckResult(db, monitor, upResult, at(20));

    expect(recovery.incidentResolved).toBe(true);
    expect(store.incidents).toHaveLength(1);
    expect(store.incidents[0].status).toBe("resolved");
    expect(store.incidents[0].resolved_at).toBe(at(20).toISOString());
    expect(store.monitors[0].current_status).toBe("up");
  });

  it("does not resolve anything when there is no active incident", async () => {
    const out = await recordCheckResult(db, monitor, upResult, at(0));
    expect(out.incidentResolved).toBe(false);
    expect(store.incidents).toHaveLength(0);
  });
});
