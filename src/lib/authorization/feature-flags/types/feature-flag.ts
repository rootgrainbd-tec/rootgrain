export type FeatureFlagMode = "BOOLEAN" | "PERCENTAGE" | "RULE_BASED";

export interface FeatureFlagRule {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "starts_with" | "ends_with";
  value: string;
}

export interface FeatureFlag {
  key: string;
  mode: FeatureFlagMode;
  enabled: boolean;
  percentage?: number; // 0-100
  rules?: FeatureFlagRule[];
}
