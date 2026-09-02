import { z } from "zod";
import { DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS, MIN_TIMEOUT_MS } from "@/lib/constants";

const MIN_TIMEOUT_S = MIN_TIMEOUT_MS / 1000;
const MAX_TIMEOUT_S = MAX_TIMEOUT_MS / 1000;

/**
 * Shape of the add / edit monitor form. The SSRF check on `url` is async and
 * lives in `assertSafeUrl` — here we only do cheap structural validation.
 */
export const createMonitorSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80, "Name is too long."),
  url: z
    .string()
    .trim()
    .min(1, "URL is required.")
    .max(2048, "URL is too long.")
    .refine((v) => /^https?:\/\//i.test(v), "URL must start with http:// or https://"),
  expectedStatus: z.coerce
    .number()
    .int("Status code must be a whole number.")
    .min(100, "Status code must be between 100 and 599.")
    .max(599, "Status code must be between 100 and 599.")
    .default(200),
  timeoutSeconds: z.coerce
    .number()
    .min(MIN_TIMEOUT_S, `Timeout must be at least ${MIN_TIMEOUT_S}s.`)
    .max(MAX_TIMEOUT_S, `Timeout must be at most ${MAX_TIMEOUT_S}s.`)
    .default(DEFAULT_TIMEOUT_MS / 1000),
});

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;

/** Edit: every field optional, plus the public toggle. */
export const updateMonitorSchema = createMonitorSchema.partial().extend({
  isPublic: z.boolean().optional(),
});

export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;

/** Auth forms. */
export const credentialsSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(1, "Name is required.").max(80, "Name is too long."),
});
