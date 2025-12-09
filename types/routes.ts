// types/routes.ts
export const ROUTES = {
  // Tab routes
  HOME: { pathname: '/(tabs)/' },
  JEWELRY_BOX: { pathname: '/(tabs)/jewelry-box' },
  WISHLIST: { pathname: '/(tabs)/wishlist' },
  PROFILE: { pathname: '/(tabs)/profile' },
  
  // Modal/stack routes
  BID: { pathname: '/bid/[id]' },
  AUCTION: { pathname: '/auction/[id]' },
  ITEM: { pathname: '/item/[id]' },
  SELLER_ITEM_EDIT: { pathname: '/seller/item/[itemId]/edit' },
  
  // Auth routes
  LOGIN: { pathname: '/login' },
  REGISTER: { pathname: '/register' },
  VERIFY: { pathname: '/verify-code' }
} as const;

export type AppRoutes = {
  "/bid/[id]": { id: string };
  "/auction/[id]": { id: string };
  "/item/[id]": { id: string };
  "/seller/item/[itemId]/edit": { itemId: string };
  // The rest of your existing routes
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppRoutes {}
  }
}