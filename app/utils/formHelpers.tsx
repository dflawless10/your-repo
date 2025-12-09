import { Alert } from 'react-native';
import { Router } from 'expo-router';

/**
 * Shows success alert and redirects to item detail page
 * @param itemId - The ID of the newly created item
 * @param router - Expo router instance
 * @param itemType - Type of item (auction, listing, etc.)
 */
export const handleListingSuccess = (
  itemId: number,
  router: Router,
  itemType: string = 'listing'
) => {
  Alert.alert(
    'Success! 🎉',
    `Your ${itemType} is now live!`,
    [
      {
        text: 'View My Listing',
        onPress: () => router.push(`/(tabs)/item/${itemId}` as any),
      },
    ],
    { cancelable: false }
  );
};

/**
 * Keyboard avoiding view configuration for forms
 */
export const FORM_KEYBOARD_CONFIG = {
  behavior: 'padding' as const,
  keyboardVerticalOffset: 100,
  contentPaddingBottom: 120,
};
