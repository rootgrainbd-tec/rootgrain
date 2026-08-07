import { z } from "zod";

export const PermissionSchema = z.object({
  id: z.string().optional(),
  action: z.string().min(1, "Action is required"),
  resource: z.string().min(1, "Resource is required"),
  description: z.string().optional(),
});

export type PermissionFormData = z.infer<typeof PermissionSchema>;

export class PermissionValidator {
  static validate(data: unknown) {
    return PermissionSchema.safeParse(data);
  }
}
