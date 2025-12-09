export type ReviewFilter = {
  keyword: string;
  minRating: number;
  maxRating: number;
  sentiments: string[];
  mediaTypes: string[];
  location: string;
  integrity: string[]; // trust filters
  deliveryStart: string;
  deliveryEnd: string;
  variant: string;
  sortBy: string;
  sellerResponse: string;
};

