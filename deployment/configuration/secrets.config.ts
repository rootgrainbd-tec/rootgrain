export interface SecretsConfig {
  readonly secret_store: string;
  readonly keys: ReadonlyArray<string>;
}
