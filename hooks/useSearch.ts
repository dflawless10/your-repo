import { useState } from "react";
import { searchBidGoat, SearchResult, HelpResult } from "@/api/search";

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [help, setHelp] = useState<HelpResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function runSearch(query: string, filters = {}) {
    setLoading(true);
    const res = await searchBidGoat(query, filters);
    setResults(res.hits || []);
    setHelp(res.help || []);
    setLoading(false);
  }

  return { results, help, loading, runSearch };
}

