
// components/FilterBar.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { performSearch, SearchParams, xFacetResult } from '@/utils/searchUtils';
import { debounce } from 'lodash';

export type FacetResult = {
  categories?: string[];
  price_ranges?: string[];
  materials?: string[];
  conditions?: string[];
};

export type FilterOption = {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export type PriceRange = {
  min: number;
  max: number;
  label: string;
};

export type FilterState = {
  categories: string[];
  priceRange: string | null;
  sortBy: string | null;
  condition: string[];
};

interface FilterBarProps {
  onFiltersChange: (filters: FilterState, facets: FacetResult) => void;
  initialQuery?: string;
}
const transformFilters = (raw: any): FilterState => ({
  categories: raw.categories || [],
  priceRange: raw.priceRange?.label || null,
  sortBy: raw.sortBy || null,
  condition: raw.condition || [],
});


const categories: FilterOption[] = [
  { id: 'rings', label: 'Rings', icon: 'finger-print' },
  { id: 'necklaces', label: 'Necklaces', icon: 'diamond' },
  { id: 'watches', label: 'Watches', icon: 'time' },
  { id: 'earrings', label: 'Earrings', icon: 'star' },
  { id: 'bracelets', label: 'Bracelets', icon: 'leaf' },
];

const priceRanges: PriceRange[] = [
  { min: 0, max: 100, label: 'Under $100' },
  { min: 100, max: 500, label: '$100-$500' },
  { min: 500, max: 1000, label: '$500-$1000' },
  { min: 1000, max: 5000, label: '$1000-$5000' },
  { min: 5000, max: Infinity, label: '$5000+' },
];

const sortOptions: FilterOption[] = [
  { id: 'newest', label: 'Newest First', icon: 'time-outline' },
  { id: 'price-asc', label: 'Price: Low to High', icon: 'arrow-up' },
  { id: 'price-desc', label: 'Price: High to Low', icon: 'arrow-down' },
  { id: 'popular', label: 'Most Popular', icon: 'flame' },
];

const conditions: FilterOption[] = [
  { id: 'new', label: 'New', icon: 'sparkles' },
  { id: 'like-new', label: 'Like New', icon: 'star' },
  { id: 'good', label: 'Good', icon: 'checkmark-circle' },
  { id: 'fair', label: 'Fair', icon: 'alert-circle' },
];

export default function FilterBar({ onFiltersChange, initialQuery }: FilterBarProps) {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    filters: {},
    facets: ['categories', 'price_ranges', 'materials', 'conditions'],
    limit: 20
  });

  const [facets, setFacets] = useState<FacetResult>({});

  const debouncedSearch = useCallback(
    debounce(async (params: SearchParams) => {
      try {
        const response = await performSearch(params);
        setFacets(response.facets);
        onFiltersChange(transformFilters(params.filters), response.facets);

      } catch (error) {
        console.error('Search failed:', error);
      }
    }, 300),
    [onFiltersChange]
  );

  useEffect(() => {
    if (initialQuery) {
      setSearchParams(prev => ({
        ...prev,
        query: initialQuery
      }));
    }
  }, [initialQuery]);

  useEffect(() => {
    debouncedSearch(searchParams);
  }, [searchParams, debouncedSearch]);

  const updateFilters = useCallback((type: string, value: any) => {
    Haptics.selectionAsync();
    setSearchParams(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [type]: value
      }
    }));
  }, []);

  // ... (rest of the component implementation)
}