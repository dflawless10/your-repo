// app/legal/security-account-integrity.tsx

import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/app/theme/ThemeContext';

const SECURITY_ACCOUNT_INTEGRITY = `# Security & Account Integrity

## 1. One-Identity Policy

To maintain a fair and trustworthy marketplace, each person may maintain only one BidGoat account.
Creating, using, or controlling multiple accounts is strictly prohibited and may result in:

- Account warnings  
- Temporary suspension  
- Permanent ban  

This rule protects buyers and sellers from auction manipulation, shill bidding, and fraudulent activity.

## 2. Device & Login Monitoring

To protect the community, BidGoat uses automated systems to detect suspicious activity.
During login, we collect:

- IP address  
- Device fingerprint  
- User agent  
- Login timestamp  

This information helps us identify:

- Multiple accounts using the same device  
- Rapid switching between accounts  
- Unusual login patterns  
- Potential fraud or abuse  

We do not sell or share this information with advertisers.

## 3. Suspicious Activity Detection

BidGoat automatically evaluates login behavior and assigns a risk score based on:

- Device sharing  
- IP address overlap  
- Rapid account switching  
- Repeated violations  

Accounts that exceed certain thresholds may be:

- Flagged for review  
- Issued a warning  
- Temporarily suspended  
- Permanently banned  

These actions help protect honest users and maintain marketplace integrity.

## 4. Account Violations

BidGoat maintains an internal record of violations, including:

- Multiple account abuse  
- Shill bidding  
- Fraudulent disputes  
- Misrepresentation  
- Repeated policy violations  

Violation severity levels include:

- Warning  
- Suspension  
- Ban  

Users may contact support to request clarification or appeal enforcement actions.

## 5. Fraud Prevention & Platform Protection

BidGoat may take action when evidence indicates:

- Auction manipulation  
- Counterfeit or stolen goods  
- Payment fraud  
- Chargeback abuse  
- Attempts to bypass platform fees  
- Coordinated activity between multiple accounts  

We reserve the right to override seller policies or cancel transactions when fraud is suspected.

## 6. Your Responsibilities

By using BidGoat, you agree to:

- Maintain only one account  
- Provide accurate information  
- Not share your account or device with others  
- Not attempt to manipulate auctions  
- Not engage in fraudulent or deceptive behavior  

Violations may result in enforcement actions without prior notice.

## 7. Appeals & Review

If your account is flagged or suspended, you may request a review by contacting:

- Email: security@bidgoat.com  

Provide:

- Your account email  
- A description of the issue  
- Any relevant evidence  

Our team will review your case and respond as quickly as possible.
`;

export default function SecurityAccountIntegrityScreen() {
  const { theme, colors } = useTheme();

  // Simple markdown-style section splitting, same pattern as LegalDocumentScreen
  const sections = SECURITY_ACCOUNT_INTEGRITY.split('\n## ').map((section, index) => {
    if (index === 0) {
      const lines = section.split('\n');
      return {
        title: lines[0].replace('# ', ''),
        content: lines.slice(1).join('\n'),
      };
    }
    const [sectionTitle, ...contentLines] = section.split('\n');
    return {
      title: sectionTitle,
      content: contentLines.join('\n'),
    };
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Security & Account Integrity',
          headerShown: true,
        }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            {index === 0 ? (
              <ThemedText type="title" style={[styles.mainTitle, { color: colors.textPrimary }]}>
                {section.title}
              </ThemedText>
            ) : (
              <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {section.title}
              </ThemedText>
            )}
            <ThemedText style={[styles.sectionContent, { color: colors.textSecondary }]}>
              {section.content.trim()}
            </ThemedText>
          </View>

        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 24,
  },
});
