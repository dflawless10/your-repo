import {JewelryItem} from "@/types/index";

export interface User {
  id: number;
  email: string;
  username: string;
  firstname?: string;
  lastname?: string;
  avatar_url?: string | null;
  is_premium_seller?: boolean;
  isPremium?: boolean;
  jewelryBox?: JewelryItem[];
}
