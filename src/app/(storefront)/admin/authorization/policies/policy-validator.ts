import { z } from "zod";

export const PolicySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  effect: z.enum(["ALLOW", "DENY"]),
  action: z.string().optional(),
  resource: z.string().optional(),
  condition: z.string().optional(),
  enabled: z.boolean().default(true),
});

export type PolicyFormData = z.infer<typeof PolicySchema>;

export class PolicyValidator {
  static validate(data: unknown) {
    return PolicySchema.safeParse(data);
  }
}
