import { z } from "zod";

const RuleSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(["equals", "not_equals", "contains", "starts_with", "ends_with"]),
  value: z.string()
});

export const FeatureFlagValidator = z.object({
  key: z.string().regex(/^[a-zA-Z0-9_.-]+$/),
  mode: z.enum(["BOOLEAN", "PERCENTAGE", "RULE_BASED"]),
  enabled: z.boolean(),
  percentage: z.number().min(0).max(100).optional(),
  rules: z.array(RuleSchema).optional()
}).refine(data => {
  if (data.mode === "PERCENTAGE" && typeof data.percentage !== "number") return false;
  if (data.mode === "RULE_BASED" && (!data.rules || data.rules.length === 0)) return false;
  return true;
}, { message: "Invalid flag configuration for mode" });

export class FeatureFlagValidation {
  static assertValid(data: unknown): void {
    FeatureFlagValidator.parse(data);
  }

  static isValid(data: unknown): boolean {
    return FeatureFlagValidator.safeParse(data).success;
  }
}
