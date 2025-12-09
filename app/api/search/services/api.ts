// services/api.ts
import axios from 'axios';
import { SearchParams, SearchResponse } from '@/types/search';

const API_BASE_URL = '/api/v1';

export const searchService = {
  async search(params: SearchParams): Promise<SearchResponse> {
    try {
      const queryParams = {
        ...params,
        tags: params.tags?.join(',')
      };
      
      const response = await axios.get<SearchResponse>(`${API_BASE_URL}/search`, {
        params: queryParams
      });
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }
};

export default searchService;