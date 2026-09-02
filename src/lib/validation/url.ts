import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

/**
 * SSRF protection. Users give us URLs that our server will fetch, so before we
 * ever make a request we must prove the target is a real, public internet host.
 *
 * `assertSafeUrl` is called both when a monitor is created/updated and again
 * immediately before every health-check request (including each redirect hop),
 * so a hostname that starts resolving to a private address later is still caught.
 */

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

const BLOCKED_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".lan", ".home.arpa"];

/** Parse an IPv4 dotted-quad into a 32-bit number, or null if it isn't one. */
function ipv4ToLong(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let long = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    long = long * 256 + n;
  }
  return long >>> 0;
}

function ipv4InCidr(ipLong: number, baseIp: string, maskBits: number): boolean {
  const base = ipv4ToLong(baseIp);
  if (base === null) return false;
  const mask = maskBits === 0 ? 0 : (0xffffffff << (32 - maskBits)) >>> 0;
  return (ipLong & mask) === (base & mask);
}

function isBlockedIpv4(ip: string): boolean {
  const long = ipv4ToLong(ip);
  if (long === null) return false;
  return (
    ipv4InCidr(long, "0.0.0.0", 8) || // "this" network / unspecified
    ipv4InCidr(long, "10.0.0.0", 8) || // private
    ipv4InCidr(long, "100.64.0.0", 10) || // carrier-grade NAT
    ipv4InCidr(long, "127.0.0.0", 8) || // loopback
    ipv4InCidr(long, "169.254.0.0", 16) || // link-local (incl. cloud metadata 169.254.169.254)
    ipv4InCidr(long, "172.16.0.0", 12) || // private
    ipv4InCidr(long, "192.0.0.0", 24) || // IETF protocol assignments
    ipv4InCidr(long, "192.168.0.0", 16) || // private
    ipv4InCidr(long, "198.18.0.0", 15) || // benchmarking
    ipv4InCidr(long, "224.0.0.0", 4) || // multicast
    ipv4InCidr(long, "240.0.0.0", 4) // reserved / broadcast
  );
}

function isBlockedIpv6(ip: string): boolean {
  const addr = ip.toLowerCase().split("%")[0]; // strip zone id

  // IPv4-mapped / -compatible: ::ffff:a.b.c.d  or  ::a.b.c.d
  const mapped = addr.match(/(?:::ffff:|::)((?:\d{1,3}\.){3}\d{1,3})$/);
  if (mapped) return isBlockedIpv4(mapped[1]);

  if (addr === "::" || addr === "::1") return true; // unspecified, loopback
  if (addr.startsWith("fe80") || addr.startsWith("fe9") || addr.startsWith("fea") || addr.startsWith("feb"))
    return true; // link-local fe80::/10
  if (/^f[cd]/.test(addr)) return true; // unique local fc00::/7
  if (addr.startsWith("ff")) return true; // multicast
  return false;
}

/** True if an IP literal is loopback, private, link-local, or otherwise not a public host. */
export function isBlockedIp(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return isBlockedIpv4(ip);
  if (kind === 6) return isBlockedIpv6(ip);
  return false;
}

export interface AssertSafeUrlOptions {
  /** Override DNS resolution (tests). */
  resolve?: (host: string) => Promise<string[]>;
}

async function defaultResolve(host: string): Promise<string[]> {
  const records = await lookup(host, { all: true, verbatim: true });
  return records.map((r) => r.address);
}

/**
 * Validates `raw` and returns the parsed URL, or throws `UnsafeUrlError` with a
 * message that is safe to show the user.
 */
export async function assertSafeUrl(raw: string, options: AssertSafeUrlOptions = {}): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new UnsafeUrlError("Enter a valid URL, e.g. https://example.com");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only http:// and https:// URLs are supported.");
  }

  if (url.username || url.password) {
    throw new UnsafeUrlError("URLs with embedded credentials are not allowed.");
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (host === "localhost" || BLOCKED_HOST_SUFFIXES.some((s) => host.endsWith(s))) {
    throw new UnsafeUrlError("That address is not allowed.");
  }

  // IP literal — check directly, no DNS.
  if (isIP(host)) {
    if (isBlockedIp(host)) throw new UnsafeUrlError("That address is not allowed.");
    return url;
  }

  // Hostname — resolve and reject if ANY answer is a non-public address.
  let addresses: string[];
  try {
    addresses = await (options.resolve ?? defaultResolve)(host);
  } catch {
    throw new UnsafeUrlError("That hostname could not be resolved.");
  }

  if (addresses.length === 0) {
    throw new UnsafeUrlError("That hostname could not be resolved.");
  }
  if (addresses.some((addr) => isBlockedIp(addr))) {
    throw new UnsafeUrlError("That address is not allowed.");
  }

  return url;
}
