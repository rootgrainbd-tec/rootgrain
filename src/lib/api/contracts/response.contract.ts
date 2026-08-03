export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}
