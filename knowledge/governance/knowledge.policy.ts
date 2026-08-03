export interface KnowledgePolicy {
  readonly policy_id: string;
  readonly rules: ReadonlyArray<string>;
}
