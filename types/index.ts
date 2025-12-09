export interface JewelryItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  tags: string;
  created_at: string;
  auction_ends_at: string; // ✅ Canonical field
  photo_url: string;
  listed_at: string;
  end_time?: string; // or start_time + duration logic
  bid_count: number;
}

export interface User {
  id: number;
  email: string;
  username: string;
  firstname: string;
  lastname: string;
  avatar_url?: string;
  jewelryBox?: JewelryItem[]; // Add this to your User interface
}

