import { useState } from 'react';

export const useGoatBid = () => {
  const [goatTrigger, setGoatTrigger] = useState(false);
  const [lastBidAmount, setLastBidAmount] = useState<number | null>(null);

  const triggerGoat = (amount: number) => {
    setLastBidAmount(amount);
    setGoatTrigger(true);
    setTimeout(() => setGoatTrigger(false), 2000);
  };

  return { goatTrigger, lastBidAmount, triggerGoat };
};