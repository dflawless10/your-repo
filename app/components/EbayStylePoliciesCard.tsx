import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SellerPolicies {
  return_policy: 'no_returns' | '7_days' | '14_days' | '30_days';
  return_window_days: number;
  buyer_pays_return_shipping: boolean;
  restocking_fee_percent: number;
  authenticity_guarantee: boolean;
  shipping_policy: string;
}

interface EbayStylePoliciesCardProps {
  policies: SellerPolicies;
  deliveredAt?: string; // For calculating return window
}

export function EbayStylePoliciesCard({ policies, deliveredAt }: EbayStylePoliciesCardProps) {
  const [shippingExpanded, setShippingExpanded] = useState(false);
  const [returnsExpanded, setReturnsExpanded] = useState(false);

  // Calculate days remaining for return window
  const getDaysRemaining = () => {
    if (!deliveredAt || policies.return_policy === 'no_returns') return null;
    const delivered = new Date(deliveredAt);
    const deadline = new Date(delivered.getTime() + policies.return_window_days * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const daysLeft = Math.ceil(diff / (24 * 60 * 60 * 1000));
    return daysLeft > 0 ? daysLeft : 0;
  };

  const getReturnPolicyLabel = () => {
    switch (policies.return_policy) {
      case 'no_returns':
        return 'Seller doesn\'t accept returns';
      case '7_days':
        return '7 days returns';
      case '14_days':
        return '14 days returns';
      case '30_days':
        return '30 days returns';
      default:
        return 'Contact seller for return policy';
    }
  };

  const getReturnPolicyColor = () => {
    switch (policies.return_policy) {
      case 'no_returns':
        return '#DC2626';
      case '7_days':
        return '#F97316';
      case '14_days':
        return '#10B981';
      case '30_days':
        return '#0891B2';
      default:
        return '#6B7280';
    }
  };

  const daysRemaining = getDaysRemaining();

  return (
    <View style={styles.container}>
      {/* Shipping Policy */}
      <View style={styles.policySection}>
        <TouchableOpacity
          style={styles.policyHeader}
          onPress={() => setShippingExpanded(!shippingExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.policyHeaderLeft}>
            <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="cube-outline" size={20} color="#2563EB" />
            </View>
            <View style={styles.policyHeaderText}>
              <Text style={styles.policyLabel}>Shipping</Text>
              <Text style={styles.policyValue}>{policies.shipping_policy}</Text>
            </View>
          </View>
          <Ionicons
            name={shippingExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>

        {shippingExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.detailRow}>
              <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                Item will be shipped within the timeframe specified by the seller.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Returns Policy */}
      <View style={styles.policySection}>
        <TouchableOpacity
          style={styles.policyHeader}
          onPress={() => setReturnsExpanded(!returnsExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.policyHeaderLeft}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="return-up-back-outline" size={20} color="#F59E0B" />
            </View>
            <View style={styles.policyHeaderText}>
              <Text style={styles.policyLabel}>Returns</Text>
              <Text style={[styles.policyValue, { color: getReturnPolicyColor() }]}>
                {getReturnPolicyLabel()}
              </Text>
              {daysRemaining !== null && daysRemaining > 0 && (
                <Text style={styles.daysRemaining}>
                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left to return
                </Text>
              )}
            </View>
          </View>
          <Ionicons
            name={returnsExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>

        {returnsExpanded && policies.return_policy !== 'no_returns' && (
          <View style={styles.expandedContent}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                You have {policies.return_window_days} days from delivery to initiate a return
              </Text>
            </View>

            {policies.buyer_pays_return_shipping && (
              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={16} color="#6B7280" />
                <Text style={styles.detailText}>Buyer pays for return shipping</Text>
              </View>
            )}

            {policies.restocking_fee_percent > 0 && (
              <View style={styles.detailRow}>
                <Ionicons name="wallet-outline" size={16} color="#6B7280" />
                <Text style={styles.detailText}>
                  {policies.restocking_fee_percent}% restocking fee may apply
                </Text>
              </View>
            )}

            {!policies.buyer_pays_return_shipping && policies.restocking_fee_percent === 0 && (
              <View style={styles.detailRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                <Text style={[styles.detailText, { color: '#10B981' }]}>
                  Free returns with no restocking fee
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Authenticity Guarantee (if applicable) */}
      {policies.authenticity_guarantee && (
        <View style={styles.guaranteeBanner}>
          <View style={styles.guaranteeBadge}>
            <Ionicons name="shield-checkmark" size={18} color="#059669" />
            <Text style={styles.guaranteeText}>Authenticity Guaranteed</Text>
          </View>
          <Text style={styles.guaranteeSubtext}>
            This item is verified authentic by the seller
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  policySection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  policyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  policyHeaderText: {
    flex: 1,
  },
  policyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  policyValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  daysRemaining: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    marginTop: 2,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 68, // Align with text above icon
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  guaranteeBanner: {
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
  },
  guaranteeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  guaranteeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 6,
  },
  guaranteeSubtext: {
    fontSize: 12,
    color: '#047857',
    marginLeft: 24,
  },
});
