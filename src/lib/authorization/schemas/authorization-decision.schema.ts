import { z } from "zod";

export const AuthorizationDecisionSchema = z.object({
  allowed: z.boolean(),
  effect: z.enum(["ALLOW", "DENY", "OBFUSCATE", "MASK"]),
  reason: z.string().nullable().optional(),
  resource: z.string(),
  action: z.string(),
  ownerVerified: z.boolean().default(false),
  auditRequired: z.boolean().default(true),
});
