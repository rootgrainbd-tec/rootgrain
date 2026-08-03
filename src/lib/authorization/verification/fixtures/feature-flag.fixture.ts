import { FeatureFlag } from "../../feature-flags/types/feature-flag";

export class FeatureFlagFixture {
  static readonly boolEnabled: FeatureFlag = {
    key: "test_bool",
    mode: "BOOLEAN",
    enabled: true,
  };

  static readonly percent50: FeatureFlag = {
    key: "test_percent",
    mode: "PERCENTAGE",
    enabled: true,
    percentage: 50,
  };

  static readonly ruleBased: FeatureFlag = {
    key: "test_rule",
    mode: "RULE_BASED",
    enabled: true,
    rules: [
      { field: "tier", operator: "equals", value: "premium" }
    ]
  };
}
