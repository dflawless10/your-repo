import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/theme/ThemeContext';

export interface SellerPolicies {
  return_policy: 'no_returns' | '7_days' | '14_days' | '30_days';
  return_window_days: number;
  buyer_pays_return_shipping: boolean;
  restocking_fee_percent: number;
  authenticity_guarantee: boolean;
  shipping_policy: string;
}

interface SellerPoliciesCardProps {
  policies: SellerPolicies;
  compact?: boolean; // Compact mode for item listings
}

const POLICY_CONFIG = {
  no_returns: {
    label: 'Final Sale (No Returns)',
    icon: 'close-circle' as const,
    color: '#F44336',
  },
  '7_days': {
    label: '7-Day Returns',
    icon: 'time' as const,
    color: '#FF9800',
  },
  '14_days': {
    label: '14-Day Returns',
    icon: 'calendar' as const,
    color: '#4CAF50',
  },
  '30_days': {
    label: '30-Day Returns',
    icon: 'calendar-outline' as const,
    color: '#2196F3',
  },
};

export const SellerPoliciesCard: React.FC<SellerPoliciesCardProps> = ({
  policies,
  compact = false,
}) => {
  const { theme, colors } = useTheme();
  const policyInfo = POLICY_CONFIG[policies.return_policy];

  if (compact) {
    // Compact mode for item listings - just icons/badges
    return (
      <View style={styles.compactContainer}>
        {policies.return_policy !== 'no_returns' && (
          <View style={[styles.badge, { backgroundColor: policyInfo.color + '20' }]}>
            <Ionicons name={policyInfo.icon} size={14} color={policyInfo.color} />
            <Text style={[styles.badgeText, { color: policyInfo.color }]}>
              {policies.return_window_days}d returns
            </Text>
          </View>
        )}
        {policies.authenticity_guarantee && (
          <View style={[styles.badge, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
            <Text style={[styles.badgeText, { color: '#10B981' }]}>Authentic</Text>
          </View>
        )}
      </View>
    );
  }

  // Full mode for detail pages
  return (
    <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Seller Policies</Text>

      {/* Return Policy */}
      <View style={styles.policySection}>
        <View style={styles.policyHeader}>
          <Ionicons name="refresh" size={20} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          <Text style={[styles.sectionLabel, { color: theme === 'dark' ? '#9CA3AF' : '#4A5568' }]}>Returns</Text>
        </View>

        <View style={styles.policyRow}>
          <Ionicons name={policyInfo.icon} size={18} color={policyInfo.color} />
          <Text style={[styles.policyText, { color: policyInfo.color }]}>
            {policyInfo.label}
          </Text>
        </View>

        {policies.return_policy !== 'no_returns' && (
          <>
            <Text style={[styles.policyDetail, { color: theme === 'dark' ? '#9CA3AF' : '#718096' }]}>
              • Return shipping: {policies.buyer_pays_return_shipping ? 'Buyer pays' : 'Seller pays'}
            </Text>
            {policies.restocking_fee_percent > 0 && (
              <Text style={[styles.policyDetail, { color: theme === 'dark' ? '#9CA3AF' : '#718096' }]}>
                • {policies.restocking_fee_percent}% restocking fee may apply
              </Text>
            )}
          </>
        )}
      </View>

      {/* Shipping Policy */}
      <View style={styles.policySection}>
        <View style={styles.policyHeader}>
          <Ionicons name="cube-outline" size={20} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          <Text style={[styles.sectionLabel, { color: theme === 'dark' ? '#9CA3AF' : '#4A5568' }]}>Shipping</Text>
        </View>
        <View style={styles.policyRow}>
          <Ionicons name="time-outline" size={18} color="#673AB7" />
          <Text style={[styles.policyText, { color: colors.textPrimary }]}>{policies.shipping_policy}</Text>
        </View>
      </View>

      {/* Authenticity Guarantee */}
      {policies.authenticity_guarantee && (
        <View style={[styles.policySection, styles.authenticitySection, { backgroundColor: theme === 'dark' ? '#1C3D2E' : '#F0FDF4', borderColor: theme === 'dark' ? '#2C5F4A' : '#86EFAC' }]}>
          <View style={styles.policyRow}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={[styles.policyText, styles.authenticityText]}>
              Authenticity Guaranteed
            </Text>
          </View>
          <Text style={[styles.authenticitySubtext, { color: theme === 'dark' ? '#6EE7B7' : '#15803D' }]}>
            This seller guarantees all items are 100% authentic
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Compact mode styles
  compactContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Full mode styles
  card: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  policySection: {
    marginBottom: 16,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  policyText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  policyDetail: {
    fontSize: 14,
    marginLeft: 28,
    marginTop: 4,
    lineHeight: 20,
  },
  authenticitySection: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  authenticityText: {
    color: '#10B981',
    fontWeight: '700',
  },
  authenticitySubtext: {
    fontSize: 13,
    marginLeft: 30,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default SellerPoliciesCard;
