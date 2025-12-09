// types/search.ts
export interface SearchParams {
  q?: string;
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  page?: number;
  limit?: number;
}



// types/search.ts
export interface SearchResponse {
  status: 'success' | 'error';
  data?: {
    items: SearchResult[];
    pagination: PaginationInfo;
    facets?: Record<string, any>;
  };
  message?: string;
}


export interface SearchResult {
  id: string;
  title: string;
  description: string;
  auction_ends_at: string; // ✅ Canonical field
  price: number;
  tags: string[];
  // ... other fields
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}