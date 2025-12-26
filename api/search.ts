// api/search.ts
import { API_URL } from '@/constants/api';

export interface SearchFilters {
  category?: string;
  min_price?: number;
  max_price?: number;
}

export interface SearchResult {
  id?: string | number;
  item_id?: string | number;
  name?: string;
  title?: string;
  description?: string;
  photo_url?: string;
  price?: number;
  [key: string]: any;
}

export interface HelpResult {
  label: string;
  value: string;
  type: string;
  extra: {
    description: string;
  };
}

export interface SearchResponse {
  hits: SearchResult[];
  help: HelpResult[];
  error?: string;
}

export async function searchBidGoat(
  query: string,
  filters: SearchFilters = {}
): Promise<SearchResponse> {
  try {
    const response = await fetch(`${API_URL}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        ...filters,
      }),
    });

    if (!response.ok) {
      throw new Error("Search request failed");
    }

    return await response.json();
  } catch (err) {
    console.error("Search error:", err);
    return { hits: [], help: [], error: "Search failed" };
  }
}
