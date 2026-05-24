/** Standard backend wrapper: { success, message, data } */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string | null;
  data?: T | null;
}

export interface PaginatedData<T> {
  items?: T[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
}
