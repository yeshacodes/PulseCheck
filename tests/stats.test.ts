import { describe, it, expect } from "vitest";
import { avgResponseMs, overallStatus, uptimePercent } from "@/lib/monitor/stats";

const check = (status: "up" | "down", response_ms: number | null = null) => ({ status, response_ms });

describe("uptimePercent", () => {
  it("is null with no checks", () => {
    expect(uptimePercent([])).toBeNull();
  });

  it("is the percentage of up checks", () => {
    const checks = [...Array(9).fill(check("up")), check("down")];
    expect(uptimePercent(checks)).toBe(90);
  });

  it("rounds to one decimal place", () => {
    const checks = [check("up"), check("up"), check("down")]; // 2/3
    expect(uptimePercent(checks)).toBe(66.7);
  });
});

describe("avgResponseMs", () => {
  it("averages only successful checks", () => {
    const checks = [check("up", 100), check("up", 200), check("down", 9999)];
    expect(avgResponseMs(checks)).toBe(150);
  });

  it("is null when there are no successful checks", () => {
    expect(avgResponseMs([check("down", 10)])).toBeNull();
  });
});

describe("overallStatus", () => {
  const m = (current_status: "up" | "down" | "pending") => ({ current_status });

  it("classifies the rollup", () => {
    expect(overallStatus([])).toBe("no_data");
    expect(overallStatus([m("up"), m("up")])).toBe("operational");
    expect(overallStatus([m("up"), m("down")])).toBe("partial_outage");
    expect(overallStatus([m("down"), m("down")])).toBe("major_outage");
  });
});
