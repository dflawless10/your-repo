import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Avatar } from './Avatar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

interface BidGoatMenuModalProps {
  visible: boolean;
  onClose: () => void;
  username: string | null;
  avatarUrl: string | null;
  onGiftFinderPress: () => void;
}

interface UserStats {
  activeBids: number;
  watching: number;
  sales: number;
  purchases: number;
}

interface UserProfile {
  isAdmin?: boolean;
  isPremium?: boolean;
}

interface MenuSection {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  customIcon?: any; // For custom image icons
  iconColor: string;
  iconBg: string;
  route?: string;
  onPress?: () => void;
  badge?: number;
  isNew?: boolean;
}

export const BidGoatMenuModal: React.FC<BidGoatMenuModalProps> = ({
  visible,
  onClose,
  username,
  avatarUrl,
  onGiftFinderPress,
}) => {
  const router = useRouter();
  const [slideAnim] = useState(new Animated.Value(400));
  const [userStats, setUserStats] = useState<UserStats>({
    activeBids: 0,
    watching: 0,
    sales: 0,
    purchases: 0,
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    isAdmin: false,
    isPremium: false,
  });
  const [buyingExpanded, setBuyingExpanded] = useState(true);
  const [sellingExpanded, setSellingExpanded] = useState(true);
  const [accountExpanded, setAccountExpanded] = useState(true);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      loadUserStats();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadUserStats = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        setUserStats({ activeBids: 0, watching: 0, sales: 0, purchases: 0 });
        return;
      }

      // Fetch active bids count
      let activeBidsCount = 0;
      try {
        const bidsResponse = await fetch('http://10.0.0.170:5000/api/my-bids', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (bidsResponse.ok) {
          const bidsData = await bidsResponse.json();
          const bids = bidsData.bids || bidsData.results || [];
          activeBidsCount = bids.length;
        }
      } catch (e) {
        console.warn('Failed to fetch bids:', e);
      }

      // Fetch favorites/watching count
      let watchingCount = 0;
      try {
        const favoritesResponse = await fetch('http://10.0.0.170:5000/api/favorites', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (favoritesResponse.ok) {
          const favoritesData = await favoritesResponse.json();
          const favorites = favoritesData.favorites || favoritesData.items || [];
          watchingCount = favorites.length;
        }
      } catch (e) {
        console.warn('Failed to fetch favorites:', e);
      }

      // TODO: Fetch real sales and purchases data when endpoints are available
      setUserStats({
        activeBids: activeBidsCount,
        watching: watchingCount,
        sales: 0,
        purchases: 0,
      });

      // Check if user is admin
      const profile = await AsyncStorage.getItem('profile');
      if (profile) {
        try {
          const profileData = JSON.parse(profile);
          setUserProfile({
            isAdmin: profileData.is_admin || false,
            isPremium: profileData.is_premium_seller || false,
          });
        } catch (e) {
          console.error('Failed to parse profile:', e);
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      setUserStats({ activeBids: 0, watching: 0, sales: 0, purchases: 0 });
    }
  };

  const handleNavigation = async (route: string) => {
    // Handle "My Reviews" - route to user's seller profile
    if (route === '/reviews') {
      let userId = await AsyncStorage.getItem('userId');
      console.log('🐐 My Reviews clicked - userId from storage:', userId);

      // Fallback: If the userId not in storage, try to get it from API
      if (!userId) {
        const token = await AsyncStorage.getItem('jwtToken');
        if (token) {
          try {
            const response = await fetch('http://10.0.0.170:5000/api/user-profile', {
              headers: { Authorization: `Bearer ${token}` }
            });
            const userProfile = await response.json();
            if (userProfile?.id) {
              const fetchedUserId = userProfile.id.toString();
              userId = fetchedUserId;
              await AsyncStorage.setItem('userId', fetchedUserId);
              console.log('🐐 UserId fetched and saved:', fetchedUserId);
            }
          } catch (error) {
            console.error('🐐 Error fetching userId:', error);
          }
        }
      }

      if (userId) {
        onClose();
        setTimeout(() => {
          console.log('🐐 Routing to seller profile:', `/seller/${userId}`);
          router.push(`/seller/${userId}` as any);
        }, 300);
        return;
      } else {
        console.warn('🐐 No userId found - user may need to log in again');
      }
    }

    onClose();
    setTimeout(() => router.push(route as any), 300);
  };

  const handleSignOut = async () => {
    await AsyncStorage.multiRemove(['username', 'jwtToken', 'avatar_url']);
    onClose();
    router.push('/sign-in');
  };

  const quickActions: MenuSection[] = [
    {
      title: 'Explore',
      icon: 'search',
      iconColor: '#FF6B35',
      iconBg: '#FFF5F2',
      route: '/(tabs)/explore',
    },
    {
      title: 'Discover',
      icon: 'compass',
      iconColor: '#00BCD4',
      iconBg: '#E0F7FA',
      route: '/discover',
    },
    {
      title: 'My Bids',
      icon: 'time',
      iconColor: '#6A0DAD',
      iconBg: '#F5F0FF',
      route: '/(tabs)/MyBidsScreen',
      badge: userStats.activeBids,
    },
    {
      title: 'Favorites',
      icon: 'heart',
      iconColor: '#E91E63',
      iconBg: '#FCE4EC',
      route: '/(tabs)/JewelryBoxScreen',
      badge: userStats.watching,
    },

  ];

  const buyingMenu: MenuSection[] = [
    {
      title: 'My Purchases & Rewards',
      icon: 'receipt-outline',
      iconColor: '#2196F3',
      iconBg: '#E3F2FD',
      route: '/orders',
    },
    {
      title: 'Relisted Deals',
      icon: 'pricetag-outline',
      iconColor: '#F44336',
      iconBg: '#FFEBEE',
      route: '/relisted-discounts',
      isNew: true,
    },
    {
      title: 'Sent Offers',
      icon: 'paper-plane-outline',
      iconColor: '#FF6B35',
      iconBg: '#FFF4E6',
      route: '/buyer/sent-offers',
    },
  ];

  const sellingMenu: MenuSection[] = [
    {
      title: 'List Buy It Now',
      icon: 'flash-outline',
      iconColor: '#FF6B35',
      iconBg: '#FFF5F2',
      route: '/(tabs)/list-item',
    },
    {
      title: 'List Create Auction',
      icon: 'hammer-outline',
      iconColor: '#673AB7',
      iconBg: '#EDE7F6',
      route: '/CreateAuctionScreen',
    },
    {
      title: 'List My Diamond',
      icon: 'diamond-outline',
      iconColor: '#00BCD4',
      iconBg: '#E0F7FA',
      route: '/diamond-appraisal',
    },
    {
      title: 'List My Watch',
      icon: 'watch-outline',
      iconColor: '#795548',
      iconBg: '#EFEBE9',
      route: '/watch-appraisal',
    },
    {
      title: 'List Must Sell',
      icon: 'flame-outline',
      iconColor: '#FF4500',
      iconBg: '#FFF0E6',
      route: '/MustSellScreen',
    },
    {
      title: 'Orders to Ship',
      icon: 'cube-outline',
      iconColor: '#FF5722',
      iconBg: '#FBE9E7',
      route: '/seller/orders',
    },
    {
      title: 'Revenue',
      icon: 'cash-outline',
      iconColor: '#4CAF50',
      iconBg: '#E8F5E9',
      route: '/seller/revenue',
    },
    {
      title: 'Selling Dashboard',
      icon: 'analytics-outline',
      iconColor: '#00BCD4',
      iconBg: '#E0F7FA',
      route: '/seller/dashboard',
    },
  ];

  const accountMenu: MenuSection[] = [
    {
      title: 'Account Settings',
      icon: 'settings-outline',
      iconColor: '#607D8B',
      iconBg: '#ECEFF1',
      route: '/account/settings',
    },
    {
      title: 'Admin On Duty',
      customIcon: require('@/assets/images/admin-badge.png'),
      iconColor: '#4CAF50',
      iconBg: '#E8F5E9',
      route: '/admin-on-duty',
    },
    {
      title: 'My Analytics',
      icon: 'stats-chart-outline',
      iconColor: '#2196F3',
      iconBg: '#E3F2FD',
      route: '/seller/analytics',
    },
    {
      title: 'My Reviews',
      icon: 'star-outline',
      iconColor: '#FFC107',
      iconBg: '#FFF8E1',
      route: '/reviews',
    },
  ];

  const renderMenuItem = (item: MenuSection) => (
    <TouchableOpacity
      key={item.title}
      style={styles.menuCard}
      onPress={() => item.route && void handleNavigation(item.route)}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: item.iconBg }]}>
        {item.customIcon ? (
          <Image source={item.customIcon} style={{ width: 40, height: 40 }} resizeMode="contain" />
        ) : (
          <Ionicons name={item.icon} size={22} color={item.iconColor} />
        )}
      </View>
      <Text style={styles.menuCardText}>{item.title}</Text>
      {item.badge !== undefined && item.badge > 0 && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{item.badge}</Text>
        </View>
      )}
      {item.isNew && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color="#CCC" style={styles.chevron} />
    </TouchableOpacity>
  );

  const renderQuickAction = (item: MenuSection) => (
    <TouchableOpacity
      key={item.title}
      style={styles.quickActionCard}
      onPress={() => item.route && handleNavigation(item.route)}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: item.iconBg }]}>
        {item.customIcon ? (
          <Image source={item.customIcon} style={{ width: 28, height: 28 }} resizeMode="contain" />
        ) : (
          <Ionicons name={item.icon!} size={24} color={item.iconColor} />
        )}
        {item.badge !== undefined && item.badge > 0 && (
          <View style={styles.quickActionBadge}>
            <Text style={styles.quickActionBadgeText}>{item.badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickActionText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <Animated.View
          style={[
            styles.menuContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <LinearGradient
            colors={['#6A0DAD', '#8B5CF6', '#A78BFA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Avatar
                uri={avatarUrl ?? undefined}
                size={64}
                variant="gradient"
                fallbackSource={require('../../assets/goat-icon.png')}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{username || 'Guest'}</Text>
                <TouchableOpacity
                  onPress={() => handleNavigation('/(tabs)/profile')}
                  style={styles.viewProfileButton}
                >
                  <Text style={styles.viewProfileText}>My Profile</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* User Stats */}
            {username && (
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.activeBids}</Text>
                  <Text style={styles.statLabel}>Active Bids</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.watching}</Text>
                  <Text style={styles.statLabel}>Watching</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.sales}</Text>
                  <Text style={styles.statLabel}>Sales</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.purchases}</Text>
                  <Text style={styles.statLabel}>Collected</Text>
                </View>
              </View>
            )}
          </LinearGradient>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                {quickActions.map(renderQuickAction)}
              </View>
            </View>

             {/* Custom Cart Block */}
  <TouchableOpacity
  onPress={() => router.push('/cart')}
  style={{
    alignItems: 'center',
    marginTop: 16,
  }}
>
  <Image
    source={require('@/assets/images/goat-cart.png')}
    style={{ width: 60, height: 60, resizeMode: 'contain' }}
  />

  <Text style={[styles.cartFinderSubtitle, { marginTop: 6 }]}>
    Your Shopping Cart
  </Text>
</TouchableOpacity>


            {/* Gift Finder Special Card */}
            <TouchableOpacity
              style={styles.giftFinderCard}
              onPress={() => {
                onClose();
                onGiftFinderPress();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6B35', '#FF8C61']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.giftFinderGradient}
              >
                <View style={styles.giftFinderContent}>
                  <Ionicons name="gift" size={32} color="#FFF" />
                  <View style={styles.giftFinderText}>
                    <Text style={styles.giftFinderTitle}>🎁 Gift Finder</Text>
                    <Text style={styles.giftFinderSubtitle}>
                      Find the perfect jewelry gift
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={24} color="#FFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Buying Section */}
{username && (
  <View style={styles.section}>
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={() => setBuyingExpanded(!buyingExpanded)}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
        <Image
          source={require('@/assets/images/goat-cart.png')}
          style={{ width: 48, height: 48, resizeMode: 'contain' }}
        />

        <Text style={styles.sectionTitle}>Buying</Text>

        <Ionicons
          name={buyingExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666"
          style={{ marginLeft: 'auto' }}
        />
      </View>
    </TouchableOpacity>

    {buyingExpanded && (
      <View style={styles.menuList}>
        {buyingMenu.map(renderMenuItem)}
      </View>
    )}
  </View>
)}


            {/* Selling Section */}
            {username && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => setSellingExpanded(!sellingExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sectionTitle}>💰 Selling</Text>
                  <Ionicons
                    name={sellingExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
                {sellingExpanded && (
                  <View style={styles.menuList}>{sellingMenu.map(renderMenuItem)}</View>
                )}
              </View>
            )}

            {/* Account Section */}
            {username && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => setAccountExpanded(!accountExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sectionTitle}>⚙️ Account</Text>
                  <Ionicons
                    name={accountExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
                {accountExpanded && (
                  <View style={styles.menuList}>{accountMenu.map(renderMenuItem)}</View>
                )}
              </View>
            )}

            {/* Help & Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>More</Text>
              <View style={styles.menuList}>
                <TouchableOpacity
                  style={styles.menuCard}
                  onPress={() => handleNavigation('/(tabs)/community-guidelines')}
                >
                  <View style={[styles.menuIconContainer, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="shield-checkmark-outline" size={22} color="#F59E0B" />
                  </View>
                  <Text style={styles.menuCardText}>Community Guidelines</Text>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" style={styles.chevron} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuCard}
                  onPress={() => handleNavigation('/help')}
                >
                  <View style={[styles.menuIconContainer, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="help-circle-outline" size={22} color="#2196F3" />
                  </View>
                  <Text style={styles.menuCardText}>Help Center</Text>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" style={styles.chevron} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuCard}
                  onPress={() => handleNavigation('/about')}
                >
                  <View style={[styles.menuIconContainer, { backgroundColor: '#F3E5F5' }]}>
                    <Ionicons name="information-circle-outline" size={22} color="#9C27B0" />
                  </View>
                  <Text style={styles.menuCardText}>About BidGoat</Text>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" style={styles.chevron} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In/Out */}
            <View style={styles.section}>
              {username ? (
                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                  <Ionicons name="log-out-outline" size={20} color="#F44336" />
                  <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.authButtons}>
                  <TouchableOpacity
                    style={styles.signInButton}
                    onPress={() => handleNavigation('/sign-in')}
                  >
                    <Text style={styles.signInButtonText}>Sign In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => handleNavigation('/register')}
                  >
                    <Text style={styles.registerButtonText}>Register</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Bottom Padding */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '85%',
    maxWidth: 380,
    backgroundColor: '#F8F9FA',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    padding: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewProfileText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#FFF',
    opacity: 0.9,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '22%',
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  quickActionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  quickActionBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  giftFinderCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  giftFinderGradient: {
    padding: 20,
  },
  giftFinderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  giftFinderText: {
    flex: 1,
  },
  giftFinderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  giftFinderSubtitle: {
    fontSize: 13,
    color: '#FFF',
    opacity: 0.9,
  },
  cartFinderCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cartFinderGradient: {
    padding: 20,
  },
  cartFinderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cartFinderText: {
    flex: 1,
  },
  cartFinderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  cartFinderSubtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 22,
    textAlign: 'left',
    opacity: 0.9,
  },
  menuList: {
    gap: 8,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCardText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  menuBadge: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  menuBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  newBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 'auto',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F44336',
  },
  authButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  signInButton: {
    flex: 1,
    backgroundColor: '#6A0DAD',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  signInButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  registerButton: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6A0DAD',
  },
  registerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6A0DAD',
  },
});

export default BidGoatMenuModal;
