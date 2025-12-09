import { AuctionMetadata } from '@/types/auction';
import { OnlyStringFields } from '@/types/utils';

export const getSearchableMetadata = (
  auction: AuctionMetadata
): OnlyStringFields<AuctionMetadata> => ({
  title: auction.title,
  description: auction.description,
  DisplayItem: '',
  username: '',
  auction_ends_at: ""
});
