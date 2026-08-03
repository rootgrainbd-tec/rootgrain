import { z } from "zod";

const RuleSchema = z.object({
  field: z.string().min(1, "Field is required"),
  operator: z.enum(["equals", "not_equals", "contains", "starts_with", "ends_with"]),
  value: z.string().min(1, "Value is required")
});

export const FeatureFlagSchema = z.object({
  key: z.string().regex(/^[a-zA-Z0-9_.-]+$/, "Invalid key format"),
  mode: z.enum(["BOOLEAN", "PERCENTAGE", "RULE_BASED"]),
  enabled: z.boolean().default(true),
  percentage: z.number().min(0).max(100).optional(),
  rules: z.array(RuleSchema).optional()
}).refine(data => {
  if (data.mode === "PERCENTAGE" && typeof data.percentage !== "number") return false;
  if (data.mode === "RULE_BASED" && (!data.rules || data.rules.length === 0)) return false;
  return true;
}, { message: "Invalid flag configuration for selected mode" });

export type FeatureFlagFormData = z.infer<typeof FeatureFlagSchema>;

export class FeatureFlagValidator {
  static validate(data: unknown) {
    return FeatureFlagSchema.safeParse(data);
  }
}
