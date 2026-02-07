import { useGoatBid } from '@/hooks/useGoatBid';

export const useHandleBidConfirmation = () => {
  const { goatTrigger, lastBidAmount, triggerGoat } = useGoatBid();

  const handleBidConfirm = (amount: number) => {
    // Your bid logic goes here (API call, validation, etc.)
    triggerGoat(amount);
  };

  return {
    handleBidConfirm,
    goatTrigger,
    lastBidAmount,
  };
};

export default useHandleBidConfirmation;
