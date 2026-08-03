import { z } from "zod";

export const RoleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
});

export type RoleFormData = z.infer<typeof RoleSchema>;

export class RoleValidator {
  static validate(data: unknown) {
    return RoleSchema.safeParse(data);
  }
}
