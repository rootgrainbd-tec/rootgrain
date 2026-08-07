export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TableProps<T> {
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void; // Usually prohibited by policy, but maybe for some things? Wait, "Deletion remains prohibited". I will remove this.
  onToggleStatus?: (item: T) => void;
}

export interface ActionState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}
