/**
 * Never leak internal error details (stack traces, DB messages, driver errors) to
 * clients. Handlers catch everything and pass it through `toPublicError`, which
 * logs the real thing server-side and returns a safe, generic shape.
 */

export class ApiError extends Error {
  status: number;
  /** Safe to show the user. */
  publicMessage: string;

  constructor(status: number, publicMessage: string) {
    super(publicMessage);
    this.name = "ApiError";
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

export function badRequest(message: string) {
  return new ApiError(400, message);
}
export function unauthorized(message = "You must be signed in.") {
  return new ApiError(401, message);
}
export function notFound(message = "Not found.") {
  return new ApiError(404, message);
}
export function tooMany(message: string) {
  return new ApiError(429, message);
}

type PublicError = { status: number; body: { error: string } };

export function toPublicError(err: unknown, context: string): PublicError {
  if (err instanceof ApiError) {
    // Expected, already-sanitised errors: log lightly, return as-is.
    if (err.status >= 500) console.error(`[${context}]`, err);
    return { status: err.status, body: { error: err.publicMessage } };
  }

  // Anything else is unexpected. Log the full detail, return nothing useful.
  console.error(`[${context}] unhandled error:`, err);
  return { status: 500, body: { error: "Something went wrong. Please try again." } };
}
