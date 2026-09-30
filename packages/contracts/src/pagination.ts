// Pagination envelope shared by every list endpoint.

export type PaginationMeta = {
  total: number;
  limit: number;
  offset: number;
};

export type Paginated<T> = {
  data: T[];
  pagination: PaginationMeta;
};
