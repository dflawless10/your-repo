import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { cleanupExpiredItems, CleanupResult } from '@/api/admin';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";
import { useTheme } from '@/app/theme/ThemeContext';

export default function CleanupExpiredScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);

  useEffect(() => {
    // Fade in header title and arrow
    setTimeout(() => {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(headerScale, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(headerScale, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 500);
  }, []);

  const handleCleanup = async () => {
    Alert.alert(
      'Cleanup Expired Items',
      'This will permanently delete all your expired auction items (no bids or reserve not met) and their images. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Expired',
          style: 'destructive',
          onPress: () => {
            (async () => {
              try {
                setLoading(true);
                const cleanupResult = await cleanupExpiredItems();
                setResult(cleanupResult);

                if (cleanupResult.deleted_items > 0) {
                  Alert.alert(
                    'Cleanup Complete',
                    `Successfully deleted ${cleanupResult.deleted_items} expired item${cleanupResult.deleted_items === 1 ? '' : 's'}.`
                  );
                } else {
                  Alert.alert(
                    'No Items to Clean',
                    'You have no expired auction items to delete.'
                  );
                }
              } catch (error) {
                console.error('Cleanup error:', error);
                Alert.alert(
                  'Cleanup Failed',
                  'Could not delete expired items. Please try again.'
                );
              } finally {
                setLoading(false);
              }
            })();
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EnhancedHeader scrollY={scrollY} />

        <ScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {/* Page Header */}
          <Animated.View style={[styles.pageHeader, { backgroundColor: colors.surface, opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={isDark ? '#B794F4' : '#6A0DAD'} />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Cleanup Expired</Text>
          </Animated.View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? '#331111' : '#FFEBEE' }]}>
            <Ionicons name="trash-outline" size={32} color="#F44336" />
          </View>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Clean Up Your Listings</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Remove expired auction items that didn&#39;t sell. This helps keep your seller profile clean and organized.
          </Text>

          <View style={styles.infoSection}>
            <Text style={[styles.infoSectionTitle, { color: colors.textPrimary }]}>What gets deleted:</Text>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={[styles.bulletText, { color: colors.textSecondary }]}>Expired auctions with no bids</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={[styles.bulletText, { color: colors.textSecondary }]}>Auctions that didn&#39;t meet reserve price</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={[styles.bulletText, { color: colors.textSecondary }]}>Associated images and files</Text>
            </View>
          </View>

          <View style={[styles.warningBox, { backgroundColor: isDark ? '#2d2410' : '#FFF3E0' }]}>
            <Ionicons name="warning" size={20} color="#FF9800" />
            <Text style={[styles.warningText, { color: isDark ? '#FFB74D' : '#E65100' }]}>
              This action cannot be undone. Active auctions and sold items will not be affected.
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.cleanupButton, loading && styles.cleanupButtonDisabled]}
          onPress={handleCleanup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="trash" size={20} color="#FFF" />
              <Text style={styles.cleanupButtonText}>Delete Expired Items</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Results Display */}
        {result && (
          <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: isDark ? '#333' : '#E2E8F0' }]}>
            <View style={[styles.resultHeader, { borderBottomColor: isDark ? '#333' : '#E2E8F0' }]}>
              <Ionicons
                name={result.deleted_items > 0 ? 'checkmark-circle' : 'information-circle'}
                size={28}
                color={result.deleted_items > 0 ? '#4CAF50' : '#2196F3'}
              />
              <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>Cleanup Results</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Items Deleted:</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{result.deleted_items}</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Files Removed:</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{result.deleted_files.length}</Text>
            </View>

            {result.failed_files.length > 0 && (
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Failed Files:</Text>
                <Text style={[styles.statValue, styles.statValueError]}>
                  {result.failed_files.length}
                </Text>
              </View>
            )}

            <Text style={[styles.resultTimestamp, { color: colors.textSecondary }]}>
              Last cleanup: {new Date().toLocaleString()}
            </Text>
          </View>
        )}

        {/* Tips Section */}
        <View style={[styles.tipsCard, { backgroundColor: isDark ? '#0d1f2d' : '#E6F7FF' }]}>
          <Text style={[styles.tipsTitle, { color: colors.textPrimary }]}>💡 Pro Tips</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Run cleanup regularly to keep your listings organized
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Consider relisting items with price adjustments instead of deleting
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Review your expired auctions in &#34;My Auctions&#34; before cleanup
          </Text>
        </View>
        </ScrollView>
         <GlobalFooter />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  scrollContent: {
    paddingTop: HEADER_MAX_HEIGHT + 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: '#F7FAFC',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  infoSection: {
    width: '100%',
    marginBottom: 20,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingLeft: 8,
  },
  bulletText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 12,
    flex: 1,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    width: '100%',
  },
  warningText: {
    fontSize: 13,
    color: '#E65100',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  cleanupButton: {
    flexDirection: 'row',
    backgroundColor: '#F44336',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cleanupButtonDisabled: {
    backgroundColor: '#BDBDBD',
    shadowOpacity: 0,
  },
  cleanupButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  resultCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginLeft: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statLabel: {
    fontSize: 15,
    color: '#718096',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
  },
  statValueError: {
    color: '#F44336',
  },
  resultTimestamp: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 12,
    fontStyle: 'italic',
  },
  tipsCard: {
    backgroundColor: '#E6F7FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8,
    lineHeight: 20,
  },
});
