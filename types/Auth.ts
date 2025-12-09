// types/Auth.ts
import { JewelryItem } from "@/types/index";

export interface User {
  id: number;
  email: string;
  username: string;
  firstname: string;
  lastname: string;
  avatar_url?: string;
  jewelryBox?: JewelryItem[];
}

export interface LoginRecord {
  ip_address: string;
  login_time: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  username: string;
  firstname: string;
  lastname: string;
}


