import { MAX_REDIRECTS, CHECK_USER_AGENT } from "@/lib/constants";
import { assertSafeUrl, UnsafeUrlError, type AssertSafeUrlOptions } from "@/lib/validation/url";

export interface CheckResult {
  status: "up" | "down";
  statusCode: number | null;
  responseMs: number;
  errorMessage: string | null;
}

export interface PerformCheckParams {
  url: string;
  expectedStatus: number;
  timeoutMs: number;
}

interface PerformCheckDeps {
  /** Injected in tests. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Injected in tests — passed through to `assertSafeUrl`. */
  resolve?: AssertSafeUrlOptions["resolve"];
}

function errnoOf(err: unknown): string | undefined {
  const cause = (err as { cause?: unknown })?.cause;
  return (
    (err as { code?: string })?.code ??
    (cause as { code?: string })?.code
  );
}

/** Map a thrown fetch/DNS error to a short, safe reason string. */
function describeError(err: unknown): string {
  if (err instanceof UnsafeUrlError) return "Address not allowed";
  if (err instanceof Error && err.name === "AbortError") return "Request timed out";

  const code = errnoOf(err);
  switch (code) {
    case "ENOTFOUND":
    case "EAI_AGAIN":
      return "DNS resolution failed";
    case "ECONNREFUSED":
      return "Connection refused";
    case "ECONNRESET":
      return "Connection reset";
    case "ETIMEDOUT":
    case "UND_ERR_CONNECT_TIMEOUT":
    case "UND_ERR_HEADERS_TIMEOUT":
    case "UND_ERR_BODY_TIMEOUT":
      return "Request timed out";
    case "CERT_HAS_EXPIRED":
    case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
    case "DEPTH_ZERO_SELF_SIGNED_CERT":
    case "ERR_TLS_CERT_ALTNAME_INVALID":
      return "TLS certificate error";
    default:
      return "Network error";
  }
}

/**
 * Runs one health check:
 *  - re-validates the URL (and every redirect target) against the SSRF rules
 *  - aborts if the whole exchange exceeds `timeoutMs`
 *  - follows at most `MAX_REDIRECTS` redirects manually
 *  - `up` iff a response arrives in time AND its status === `expectedStatus`
 */
export async function performCheck(
  { url, expectedStatus, timeoutMs }: PerformCheckParams,
  deps: PerformCheckDeps = {},
): Promise<CheckResult> {
  const doFetch = deps.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();

  const elapsed = () => Math.round(performance.now() - startedAt);

  try {
    let currentUrl = (await assertSafeUrl(url, { resolve: deps.resolve })).toString();
    let statusCode: number | null = null;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const response = await doFetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": CHECK_USER_AGENT, accept: "*/*" },
        cache: "no-store",
      });
      statusCode = response.status;

      const isRedirect = response.status >= 300 && response.status < 400 && response.headers.has("location");
      if (!isRedirect) {
        const responseMs = elapsed();
        if (response.status === expectedStatus) {
          return { status: "up", statusCode, responseMs, errorMessage: null };
        }
        return {
          status: "down",
          statusCode,
          responseMs,
          errorMessage: `Unexpected status code: ${response.status} (expected ${expectedStatus})`,
        };
      }

      if (hop === MAX_REDIRECTS) {
        return {
          status: "down",
          statusCode,
          responseMs: elapsed(),
          errorMessage: `Too many redirects (more than ${MAX_REDIRECTS})`,
        };
      }

      const location = response.headers.get("location")!;
      const next = new URL(location, currentUrl);
      currentUrl = (await assertSafeUrl(next.toString(), { resolve: deps.resolve })).toString();
    }

    // Unreachable, but keeps the type checker happy.
    return { status: "down", statusCode, responseMs: elapsed(), errorMessage: "Network error" };
  } catch (err) {
    return {
      status: "down",
      statusCode: null,
      responseMs: elapsed(),
      errorMessage: describeError(err),
    };
  } finally {
    clearTimeout(timer);
  }
}
