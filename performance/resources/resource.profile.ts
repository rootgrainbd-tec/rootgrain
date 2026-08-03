export interface ResourceProfile {
  readonly profile_id: string;
  readonly allocations: Readonly<Record<string, number>>;
}
