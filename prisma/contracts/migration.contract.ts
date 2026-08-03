export interface MigrationContract {
  id: string;
  name: string;
  dependencies: string[];
  up(): Promise<void>;
  down(): Promise<void>;
}

export interface MigrationState {
  applied: string[];
  pending: string[];
  failed: string[];
}
