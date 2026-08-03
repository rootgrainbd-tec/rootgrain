import { PaginationQuery, PaginatedResponse } from '../contracts/pagination.contract';
import { API_CONSTANTS } from '../constants/api.constants';

export class PaginationValidator {
  static validateQuery(query: any): PaginationQuery {
    const page = Math.max(1, parseInt(query?.page) || 1);
    let pageSize = parseInt(query?.pageSize) || API_CONSTANTS.DEFAULT_PAGE_SIZE;
    
    if (pageSize <= 0) pageSize = API_CONSTANTS.DEFAULT_PAGE_SIZE;
    if (pageSize > API_CONSTANTS.MAX_PAGE_SIZE) pageSize = API_CONSTANTS.MAX_PAGE_SIZE;

    return Object.freeze({ page, pageSize });
  }

  static wrapPaginated<T>(items: T[], total: number, query: PaginationQuery): PaginatedResponse<T> {
    const total_pages = Math.ceil(total / query.pageSize) || 1;
    
    const response: PaginatedResponse<T> = {
      page: query.page,
      page_size: query.pageSize,
      total,
      total_pages,
      items: Object.freeze([...items]) as unknown as T[]
    };
    
    return Object.freeze(response);
  }
}
