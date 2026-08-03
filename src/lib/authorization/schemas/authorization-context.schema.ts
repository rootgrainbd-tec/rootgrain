import { z } from "zod";

export const AuthorizationContextSchema = z.object({
  userId: z.string().uuid().nullable(),
  principal: z.enum(["GUEST", "CUSTOMER", "STAFF", "ADMIN", "SUPER_ADMIN"]),
  permissions: z.array(z.string()),
  roles: z.array(z.string()),
  sessionId: z.string().nullable(),
  requestId: z.string().uuid().optional(),
  ipAddress: z.string().nullable().optional(),
  resource: z.string(),
  action: z.string(),
  ownerId: z.string().uuid().nullable().optional(),
  guestTokenHash: z.string().nullable().optional(),
  timestamp: z.date().default(() => new Date()),
});
