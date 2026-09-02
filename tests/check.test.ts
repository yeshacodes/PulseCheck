import { describe, it, expect } from "vitest";
import { performCheck } from "@/lib/monitor/check";

const resolvePublic = async () => ["93.184.216.34"];
const base = { url: "https://example.com", expectedStatus: 200, timeoutMs: 1000 };

describe("performCheck", () => {
  it("marks a matching status code as up and records response time", async () => {
    const result = await performCheck(base, {
      resolve: resolvePublic,
      fetchImpl: async () => new Response("ok", { status: 200 }),
    });
    expect(result.status).toBe("up");
    expect(result.statusCode).toBe(200);
    expect(result.errorMessage).toBeNull();
    expect(result.responseMs).toBeGreaterThanOrEqual(0);
  });

  it("marks an unexpected status code as down", async () => {
    const result = await performCheck(base, {
      resolve: resolvePublic,
      fetchImpl: async () => new Response("boom", { status: 500 }),
    });
    expect(result.status).toBe("down");
    expect(result.statusCode).toBe(500);
    expect(result.errorMessage).toMatch(/Unexpected status code: 500/);
  });

  it("marks a timed-out request as down", async () => {
    const result = await performCheck(
      { ...base, timeoutMs: 20 },
      {
        resolve: resolvePublic,
        fetchImpl: (_url, init) =>
          new Promise((_resolve, reject) => {
            (init as RequestInit).signal?.addEventListener("abort", () =>
              reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
            );
          }),
      },
    );
    expect(result.status).toBe("down");
    expect(result.errorMessage).toBe("Request timed out");
  });

  it("maps a DNS failure thrown by fetch to a friendly reason", async () => {
    const result = await performCheck(base, {
      resolve: resolvePublic,
      fetchImpl: async () => {
        throw Object.assign(new Error("fetch failed"), { cause: { code: "ENOTFOUND" } });
      },
    });
    expect(result.status).toBe("down");
    expect(result.errorMessage).toBe("DNS resolution failed");
  });

  it("re-validates redirect targets and rejects a redirect to a private address", async () => {
    let call = 0;
    const result = await performCheck(base, {
      resolve: resolvePublic,
      fetchImpl: async () => {
        call += 1;
        if (call === 1) {
          return new Response(null, { status: 302, headers: { location: "http://10.0.0.1/" } });
        }
        return new Response("ok", { status: 200 });
      },
    });
    expect(result.status).toBe("down");
    expect(result.errorMessage).toBe("Address not allowed");
  });

  it("gives up after too many redirects", async () => {
    const result = await performCheck(base, {
      resolve: resolvePublic,
      fetchImpl: async () =>
        new Response(null, { status: 302, headers: { location: "https://example.com/next" } }),
    });
    expect(result.status).toBe("down");
    expect(result.errorMessage).toMatch(/Too many redirects/);
  });
});
