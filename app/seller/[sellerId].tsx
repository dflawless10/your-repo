import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  Animated, Share, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ReviewSkeleton from 'app/ReviewSkeleton';
import StarRating from "app/seller/StarRating";
import TextReview from "app/seller/TextReview";
import ImageReview from "app/seller/ImageReview";
import BuyerReviewForm from "@/app/BuyerReviewForm";
import ReviewFilterPanel from 'app/components/ReviewFilterPanel';
import CheckboxGroup from 'app/components/CheckBoxGroup';
import DateRangePicker from 'app/components/DataRangePicker';
import Dropdown from 'app/components/DropDown';
import {ReviewFilter} from 'types/ReviewFilter';


type Review = {
  reviewer_name: string;
  rating: number;
  comment: string;
  feedback_level: string;
  mascot_mood?: string;
  avatar_url?: string | null;
  image_urls?: string[];
  created_at: string;
  updated_at: string;
};

type Seller = {
  id: number;
  username: string;
  avatar_url?: string | null;
  pricing_star?: number;
  email: string;
  items_sold: number;
  joined: string;
  badge?: string;
  review_stats: {
    total_reviews: number;
    avg_rating: number;
    positive_percent: number;
    communication: number;
    accuracy: number;
    image_quality: number;
    shipping_cost: number;
    shipping_speed: number;
  };
  recent_reviews: Review[];
};

export default function SellerProfileScreen() {
  const { sellerId, from, itemId } = useLocalSearchParams();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [ctsStats, setCtsStats] = useState({ watchers: 0, ctsRate: 0, rewardPoints: 0 });
  const skeletonOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const [filter, setFilter] = useState<ReviewFilter>({
  keyword: '',
  minRating: 1,
  maxRating: 5,
  sentiments: [],
  mediaTypes: [],
  location: '',
  integrity: [], // ['verified', 'flagged']
  deliveryStart: '', // ISO date string
  deliveryEnd: '',
  variant: '', // 'Red', 'Blue', etc.
  sortBy: '', // 'newest', 'highest', etc.
  sellerResponse: '', // 'responded', 'unanswered'
});

  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);

  const avgShippingScore = useMemo(() => {
    const cost = seller?.review_stats?.shipping_cost ?? 0;
    const speed = seller?.review_stats?.shipping_speed ?? 0;
    return (cost + speed) / 2;
  }, [seller]);

  useEffect(() => {
    let isMounted = true;

    const fetchSeller = async (id: string) => {
      try {
        const response = await fetch(`http://10.0.0.170:5000/seller/${id}`);
        if (!response.ok) throw new Error(`Failed to fetch seller: ${response.status}`);
        const data = await response.json();
        if (isMounted) setSeller(data);
      } catch (error) {
        console.error('🐐 Seller fetch error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const fetchCTSStats = async (id: string) => {
      try {
        const response = await fetch(`http://10.0.0.170:5000/api/seller/${id}/cts-stats`);
        if (response.ok) {
          const data = await response.json();
          if (isMounted) setCtsStats(data);
        }
      } catch (error) {
        console.warn('🐐 CTS stats fetch error:', error);
      }
    };

    const idStr = Array.isArray(sellerId) ? sellerId[0] : sellerId;
    if (idStr && idStr.length > 0) {
      setLoading(true);
      fetchSeller(idStr);
      fetchCTSStats(idStr);
    } else {
      console.warn('🐐 Missing sellerId in route params');
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [sellerId]);

  useEffect(() => {
    if (seller?.id) {
      const fetchFilteredReviews = async () => {
        try {
          const res = await fetch(`http://10.0.0.170:5000/api/reviews/filter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...filter, seller_id: seller.id }),
          });
          const data = await res.json();
          setFilteredReviews(data.reviews ?? []);
        } catch (err) {
          console.error('🐐 Filter fetch error:', err);
        }
      };
      fetchFilteredReviews();
    }
  }, [filter, seller?.id]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(skeletonOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();

      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const shareFilteredView = async () => {
    const query = encodeURIComponent(JSON.stringify(filter));
    const shareUrl = `https://bidgoat.app/seller/${seller?.id}?filters=${query}`;
    await Share.share({ message: `Check out these reviews 🐐: ${shareUrl}` });
  };

  const renderReviews = () => {
    const reviewsToRender =
      filteredReviews.length > 0 || filter.keyword || filter.sentiments?.length
        ? filteredReviews
        : seller?.recent_reviews ?? [];

    if (reviewsToRender.length === 0) {
      return <Text style={styles.placeholder}>No reviews match your filters 🐐</Text>;
    }

    return reviewsToRender.map((r, index) => (
      <View key={`${r.reviewer_name}-${index}`} style={styles.reviewBlock}>
        <Text style={styles.label}>{r.reviewer_name} ({r.feedback_level})</Text>
        <Text style={styles.subLabel}>Rating: {r.rating} ⭐</Text>
        <Text style={styles.subLabel}>Mood: {r.mascot_mood || '🐐'}</Text>
        <Text style={styles.comment}>{r.comment}</Text>
      </View>
    ));
  };

  if (loading) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subLabel}>Loading seller profile…</Text>
        <ReviewSkeleton count={3} />


      </ScrollView>
    );
  }

  if (!seller) {
    return <Text style={styles.error}>Seller not found.</Text>;
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: 28 }]}>
      {/* Header */}
      <View style={[styles.header, { marginBottom: 16 }]}>
        <Image
          source={
            seller?.avatar_url
              ? { uri: seller.avatar_url }
              : require('app/components/assets/GoatGenieBadge.png')
          }
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>👤 {seller?.username}</Text>
          {seller?.badge ? <Text style={styles.badge}>{seller.badge}</Text> : null}
          <StarRating
            rating={seller?.review_stats?.avg_rating ?? 0}
            count={seller?.review_stats?.total_reviews ?? 0}
          />
          <View style={styles.row}>
            <Text style={styles.star}>{'⭐'.repeat(seller?.pricing_star ?? 0)}</Text>
            <Text style={styles.subLabel}>Pricing Power</Text>
          </View>
          <View style={styles.quickRow}>
            <Text style={styles.chip}>Sold: {seller?.items_sold}</Text>
            <Text style={styles.chip}>Joined: {seller?.joined}</Text>
            <Text style={styles.chip}>
              Positive: {seller?.review_stats?.positive_percent}%
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.subtleId}>Seller ID: {sellerId}</Text>

      {/* CTS Reward Stats */}
      {from === 'carousel' && (
        <View style={styles.ctsContainer}>
          <Text style={styles.ctsTitle}>🎯 Engagement Rewards</Text>
          <View style={styles.ctsRow}>
            <View style={styles.ctsCard}>
              <Text style={styles.ctsLabel}>Watchers</Text>
              <Text style={styles.ctsValue}>{ctsStats.watchers} 👀</Text>
            </View>
            <View style={styles.ctsCard}>
              <Text style={styles.ctsLabel}>CTS Rate</Text>
              <Text style={styles.ctsValue}>{ctsStats.ctsRate.toFixed(1)}%</Text>
            </View>
            <View style={styles.ctsCard}>
              <Text style={styles.ctsLabel}>Reward Pts</Text>
              <Text style={styles.ctsValue}>{ctsStats.rewardPoints} 🐐</Text>
            </View>
          </View>
        </View>
      )}

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Comm</Text>
          <Text style={styles.kpiValue}>
            {seller?.review_stats?.communication ?? 'N/A'} ⭐
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Accuracy</Text>
          <Text style={styles.kpiValue}>
            {seller?.review_stats?.accuracy ?? 'N/A'} ⭐
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Image</Text>
          <Text style={styles.kpiValue}>
            {seller?.review_stats?.image_quality ?? 'N/A'} ⭐
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Shipping</Text>
          <Text style={styles.kpiValue}>{avgShippingScore.toFixed(1)} ⭐</Text>
        </View>
      </View>
      {/* Filters (Collapsible) */}
      <ReviewFilterPanel filter={filter} setFilter={setFilter} />
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.shareButton} onPress={shareFilteredView}>
          <Text style={styles.shareText}>🔗 Share</Text>
        </TouchableOpacity>
      </View>
      {/* Optional advanced filter controls inline if needed */}



      <Dropdown
        label="Sort By"
        options={['newest', 'oldest', 'highest rating', 'lowest rating']}
        selected={filter.sortBy}
        onSelect={(val) => setFilter({ ...filter, sortBy: val })}
      />
      <Dropdown
        label="Item Variant"
        options={['Red', 'Blue', 'XL', 'Used', 'New']}
        selected={filter.variant}
        onSelect={(variant) => setFilter({ ...filter, variant })}
      />
      {/* Reviews */}
      <View style={styles.divider} />
       <Text style={[styles.title, styles.reviewsTitle]}>📝 Reviews</Text>
      <Animated.View style={{ opacity: skeletonOpacity }}>
        <ReviewSkeleton count={3} />
      </Animated.View>
      <Animated.View style={{ opacity: contentOpacity }}>{renderReviews()}</Animated.View>
      {/* Add Review */}
      <BuyerReviewForm seller={seller} />
    </ScrollView>
  );
}



const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 16,
  },
  reviewsTitle: {
    marginTop: 0,
    marginBottom: 8, // was 16; closer to reviews
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 6,
  },
  value: {
    fontWeight: '400',
    color: '#2b6cb0',
  },
  subLabel: {
    fontSize: 14,
    color: '#2d3748',
    marginBottom: 4,
  },
  shareButton: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  shareText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  badge: {
    fontSize: 14,
    fontWeight: '500',
    color: '#38a169',
    backgroundColor: '#e6fffa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 20,
  },
  reviewBlock: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#edf2f7',
    borderRadius: 8,
  },
  comment: {
    fontStyle: 'italic',
    color: '#4a5568',
  },
  placeholder: {
    fontSize: 14,
    color: '#a0aec0',
    fontStyle: 'italic',
  },
  error: {
    marginTop: 20,
    fontSize: 16,
    color: '#c53030',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
  },
  star: {
    fontSize: 20,
    color: '#f6ad55',
    marginBottom: 8,
  },
  header: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  quickRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  chip: {
    backgroundColor: '#e2e8f0',
    color: '#2d3748',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
  subtleId: { fontSize: 12, color: '#718096', marginBottom: 8 },
  kpiRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  kpiCard: {
    flex: 1,
    backgroundColor: '#edf2f7',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  kpiLabel: { fontSize: 12, color: '#4a5568' },
  kpiValue: { fontSize: 14, fontWeight: '600', color: '#2d3748' },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  ctsContainer: {
    backgroundColor: '#f0e6ff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#d6bcfa',
  },
  ctsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6A0DAD',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ctsCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ctsLabel: {
    fontSize: 11,
    color: '#4a5568',
    marginBottom: 4,
  },
  ctsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6A0DAD',
  },
});

