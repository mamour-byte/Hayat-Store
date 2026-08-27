export interface ApiMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: ApiMeta;
}

export interface ApiErrorResponse {
  statusCode?: number;
  message: string | string[];
  error?: string;
}
