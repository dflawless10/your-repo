// utils/searchUtils.ts
import { API_BASE_URL } from '@/config';




export type SearchParams = {
  query?: string;
  filters: {
    categories?: string[];
    priceRange?: { min: number; max: number };
    condition?: string[];
    materials?: string[];
    dateRange?: { start: string; end: string };
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  facets?: string[];
  page?: number;
  limit?: number;
};

export type xFacetResult = {
  [key: string]: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
};

export type SearchResponse = {
  items: any;
  hits: any[];
  total: number;
  facets: xFacetResult;
  suggestions: string[];
};



// First, define the types for Elasticsearch query components
type ESFilter = {
  terms?: { [key: string]: string[] };
  range?: {
    [key: string]: {
      gte?: number;
      lte?: number;
    };
  };
};

export async function performSearch(params: SearchParams): Promise<SearchResponse> {
  try {
    const queryParams = new URLSearchParams();


const esQuery: { bool: { filter: ESFilter[]; must?: any[] } } = {
  bool: {
    filter: [
      ...(params.filters.categories?.length
        ? [{ terms: { category: params.filters.categories } }]
        : []),
      ...(params.filters.priceRange
        ? [
            {
              range: {
                price: {
                  gte: params.filters.priceRange.min,
                  lte: params.filters.priceRange.max
                }
              }
            }
          ]
        : [])
    ],
    ...(params.query
      ? {
          must: [
            {
              query_string: {
                query: expandQueryWithSynonyms(params.query),
                default_field: 'title'
              }
            }
          ]
        }
      : {})
  }
};





    // Add facets request
    const aggs = {
      categories: { terms: { field: 'category' } },
      price_ranges: {
        range: {
          field: 'price',
          ranges: [
            { to: 100 },
            { from: 100, to: 500 },
            { from: 500, to: 1000 },
            { from: 1000, to: 5000 },
            { from: 5000 }
          ]
        }
      },
      materials: { terms: { field: 'materials' } },
      conditions: { terms: { field: 'condition' } }
    };

    const response = await fetch(`${API_BASE_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: esQuery,
        aggs,
        size: params.limit || 20,
        from: ((params.page || 1) - 1) * (params.limit || 20),
        sort: params.sort ? [{ [params.sort.field]: params.sort.direction }] : undefined
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

export function buildSynonymMap(): { [key: string]: string[] } {
  return {
    'ring': ['band', 'loop', 'hoop'],
    'necklace': ['chain', 'pendant', 'choker'],
    'bracelet': ['bangle', 'cuff', 'armlet'],
    'earring': ['stud', 'hoop', 'drop'],
    'watch': ['timepiece', 'chronometer'],
    'gold': ['yellow gold', 'white gold', 'rose gold'],
    'diamond': ['brilliant', 'gem', 'stone'],
    // Add more synonyms as needed
  };
}

export function expandQueryWithSynonyms(query: string): string {
  const synonymMap = buildSynonymMap();
  const words = query.toLowerCase().split(' ');
  
  return words.map(word => {
    const synonyms = synonymMap[word];
    return synonyms ? `(${[word, ...synonyms].join(' OR ')})` : word;
  }).join(' ');
}