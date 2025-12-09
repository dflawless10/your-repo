// utils/toast.ts
import Toast from 'react-native-toast-message';

export const showToast = (
  type: 'success' | 'error' | 'auctionTip',
  title: string,
  subtitle?: string
) => {
  Toast.show({
    type,        // 'auctionTip' is for your custom stylized tip
    text1: title,
    text2: subtitle,
    position: 'bottom',
    visibilityTime: 3000,
    autoHide: true,
  });
};

showToast('auctionTip', '✨ Preview Unlocked!', 'Swipe through this week’s top auctions!');
