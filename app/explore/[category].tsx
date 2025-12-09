import React, { JSX, Suspense, lazy } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';

// 🐐 Lazy-loaded category screens
const WelcomeScreen = lazy(() => import('@/components/categories/WelcomeScreen'));
const SellerExploreScreen = lazy(() => import('@/components/categories/SellerExploreScreen'));
const HelpScreen = lazy(() => import('@/components/categories/HelpScreen'));
const RewardsScreen = lazy(() => import('@/components/categories/RewardsScreen'));
const AuctionsModule = lazy(() => import('@/components/categories/AuctionsModule'));
const ShopGrid = lazy(() => import('@/components/categories/ShopGrid'));
const ContactForm = lazy(() => import('@/components/categories/ContactForm'));
const SearchScreen = lazy(() => import('@/components/categories/SearchScreen'));
const DiamondAppraisalScreen = lazy(() => import('@/components/categories/DiamondAppraisalScreen'));
const TrendingScreen = lazy(() => import('@/components/categories/TrendingScreen'));
const ReviewsScreen = lazy(() => import('@/components/categories/ReviewsScreen'));

const categoryComponents: Record<string, React.LazyExoticComponent<() => JSX.Element>> = {
  auctions: AuctionsModule,
  shop: ShopGrid,
  contact: ContactForm,
  search: SearchScreen,
  welcome: WelcomeScreen,
  sell: SellerExploreScreen,
  help: HelpScreen,
  rewards: RewardsScreen,
  trending: TrendingScreen,
  reviews: ReviewsScreen,
  'diamond-appraisal': DiamondAppraisalScreen, // 🐐 Add this line
};


// 🐐 Optional: mascot overlay
import MascotOverlay from 'app/components/MascotOverlay';

function CategoryScreen() {
  const { category } = useLocalSearchParams();

  // ✅ Safely extract string from query param
  const categoryKey = Array.isArray(category) ? category[0] : category;

  // ✅ Validate category key
  const isValidCategory = (key: unknown): key is keyof typeof categoryComponents =>
    typeof key === 'string' && key in categoryComponents;

  // ✅ Get component from map
  const Component = isValidCategory(categoryKey) ? categoryComponents[categoryKey] : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Category: {categoryKey}</Text>
      <Suspense fallback={<Text style={styles.loading}>Loading goat magic...</Text>}>
        {Component ? (
          <Component />
        ) : (
          <Text style={styles.fallback}>No goat magic found for this category.</Text>
        )}
      </Suspense>
      {categoryKey && (
        <MascotOverlay mood="Shimmer" message={`Goat Oracle sees: ${categoryKey}`} />
      )}
      <MascotOverlay mood="Shimmer" message="" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  loading: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
  },
  fallback: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
  },
});

export default CategoryScreen;
