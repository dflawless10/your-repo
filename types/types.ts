import {JewelryItem} from "@/types/index";


export type Listing = {
  id: string;
  title: string;
  auction_ends_at: string;
  // Extend as needed
};



export interface User {
  id: number;
  email: string;
  username: string;
  firstname: string;
  lastname: string;
  avatar_url?: string | null;
  jewelryBox?: JewelryItem[];
  isPremium?: boolean;
  is_premium_seller?: boolean;
}

interface LoginRecord {
  ip_address: string;
  login_time: string;
}

