import axios from 'axios';

export const searchListings = async (query: string) => {
  try {
    const res = await axios.post('https://your-elasticsearch-endpoint.com/listings/_search', {
      query: {
        multi_match: {
          query,
          fields: ['title^2', 'description', 'tags'],
          fuzziness: 'AUTO',
        },
      },
    });
    return res.data.hits.hits.map((hit: any) => hit._source);
  } catch (err) {
    console.error('Search error:', err);
    return [];
  }
};


