// types/filters.ts
import {PaginationInfo, SearchResult} from "@/types/search";

export interface PriceRange {
  min: number;
  max: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  categories?: string[];
  priceRange?: PriceRange;
  condition?: string[];
  materials?: string[];
  dateRange?: DateRange;
  sortBy: SortOptions; // Required field
}

// utils/searchUtils.ts
export type SearchParams = {
  query?: string;
  filters: FilterState;
  facets?: string[];
  page?: number;
  limit?: number;
};

export interface SearchResponse {
  status: 'success' | 'error';
  data?: {
    items: SearchResult[];
    pagination: PaginationInfo;
  };
  message?: string;
}