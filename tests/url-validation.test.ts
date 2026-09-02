import { describe, it, expect } from "vitest";
import { assertSafeUrl, isBlockedIp, UnsafeUrlError } from "@/lib/validation/url";

/** Pretend every hostname resolves to a public address unless a test overrides it. */
const publicResolve = async () => ["93.184.216.34"];

describe("isBlockedIp", () => {
  it("blocks loopback, private, link-local and unspecified addresses", () => {
    for (const ip of ["127.0.0.1", "10.0.0.5", "192.168.1.1", "172.16.9.9", "169.254.169.254", "0.0.0.0", "::1"]) {
      expect(isBlockedIp(ip), ip).toBe(true);
    }
  });

  it("allows public addresses", () => {
    for (const ip of ["93.184.216.34", "1.1.1.1", "8.8.8.8", "2606:4700:4700::1111"]) {
      expect(isBlockedIp(ip), ip).toBe(false);
    }
  });

  it("blocks IPv4-mapped IPv6 forms of private addresses", () => {
    expect(isBlockedIp("::ffff:127.0.0.1")).toBe(true);
    expect(isBlockedIp("::ffff:10.0.0.1")).toBe(true);
  });
});

describe("assertSafeUrl", () => {
  it("rejects non-http(s) protocols", async () => {
    await expect(assertSafeUrl("ftp://example.com")).rejects.toBeInstanceOf(UnsafeUrlError);
    await expect(assertSafeUrl("javascript:alert(1)")).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("rejects unparseable input", async () => {
    await expect(assertSafeUrl("not a url")).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("rejects localhost and internal-suffixed hostnames", async () => {
    await expect(assertSafeUrl("http://localhost")).rejects.toBeInstanceOf(UnsafeUrlError);
    await expect(assertSafeUrl("http://db.internal/health")).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("rejects private / loopback IP literals without touching DNS", async () => {
    for (const url of [
      "http://127.0.0.1",
      "http://10.0.0.5",
      "http://192.168.1.1",
      "http://169.254.169.254/latest/meta-data",
      "http://0.0.0.0",
      "http://[::1]:8080",
    ]) {
      await expect(assertSafeUrl(url), url).rejects.toBeInstanceOf(UnsafeUrlError);
    }
  });

  it("rejects a hostname that resolves to a private address", async () => {
    await expect(
      assertSafeUrl("https://sneaky.example.com", { resolve: async () => ["10.1.2.3"] }),
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("rejects credentials embedded in the URL", async () => {
    await expect(
      assertSafeUrl("https://user:pass@example.com", { resolve: publicResolve }),
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("accepts a normal public https URL", async () => {
    const url = await assertSafeUrl("https://example.com/health", { resolve: publicResolve });
    expect(url.hostname).toBe("example.com");
  });
});
