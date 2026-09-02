import { describe, it, expect } from "vitest";
import { createMonitorSchema } from "@/lib/validation/schemas";

describe("createMonitorSchema", () => {
  it("applies defaults for expected status and timeout", () => {
    const parsed = createMonitorSchema.parse({ name: "Site", url: "https://example.com" });
    expect(parsed.expectedStatus).toBe(200);
    expect(parsed.timeoutSeconds).toBe(10);
  });

  it("rejects a URL without an http(s) scheme", () => {
    expect(createMonitorSchema.safeParse({ name: "x", url: "example.com" }).success).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(createMonitorSchema.safeParse({ name: "  ", url: "https://example.com" }).success).toBe(false);
  });

  it("rejects out-of-range timeouts", () => {
    expect(
      createMonitorSchema.safeParse({ name: "x", url: "https://example.com", timeoutSeconds: 0 }).success,
    ).toBe(false);
    expect(
      createMonitorSchema.safeParse({ name: "x", url: "https://example.com", timeoutSeconds: 40 }).success,
    ).toBe(false);
  });

  it("rejects an impossible status code", () => {
    expect(
      createMonitorSchema.safeParse({ name: "x", url: "https://example.com", expectedStatus: 999 }).success,
    ).toBe(false);
  });

  it("coerces string form values", () => {
    const parsed = createMonitorSchema.parse({
      name: "Site",
      url: "https://example.com",
      expectedStatus: "204",
      timeoutSeconds: "5",
    });
    expect(parsed.expectedStatus).toBe(204);
    expect(parsed.timeoutSeconds).toBe(5);
  });
});
