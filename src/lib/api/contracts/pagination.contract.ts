export interface PaginationQuery {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  items: T[];
}
