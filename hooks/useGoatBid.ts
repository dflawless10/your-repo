import { useState, useRef, useEffect } from 'react';

export const useGoatBid = () => {
  const [goatTrigger, setGoatTrigger] = useState(false);
  const [lastBidAmount, setLastBidAmount] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerGoat = (amount: number) => {
    setLastBidAmount(amount);
    setGoatTrigger(true);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setGoatTrigger(false);
      timerRef.current = null;
    }, 4000); // 4 seconds
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { goatTrigger, lastBidAmount, triggerGoat };
};
