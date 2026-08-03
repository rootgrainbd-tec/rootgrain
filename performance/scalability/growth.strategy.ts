export interface GrowthStrategy {
  readonly strategy_id: string;
  readonly triggers: ReadonlyArray<string>;
}
