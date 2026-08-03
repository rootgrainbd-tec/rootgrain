export interface EnvironmentConfig {
  readonly environment: string;
  readonly variables: Readonly<Record<string, string>>;
}
