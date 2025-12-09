import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';

const TERMS_OF_SERVICE = `# Terms of Service

**Last Updated: November 4, 2025**

## 1. Agreement to Terms

By accessing or using BidGoat ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.

## 2. Description of Service

BidGoat is an online auction platform that allows users to buy and sell jewelry and luxury items. We facilitate transactions between buyers and sellers but are not a party to the actual sale.

## 3. User Accounts

### 3.1 Account Creation
• You must be at least 18 years old to use BidGoat
• You must provide accurate and complete information
• You are responsible for maintaining the security of your account
• You are responsible for all activities under your account

### 3.2 Account Termination
• We reserve the right to suspend or terminate accounts that violate these terms
• You may close your account at any time

## 4. Buying on BidGoat

### 4.1 Bidding
• All bids are binding contracts to purchase
• Bids cannot be retracted once placed
• The highest bidder at auction end wins the item
• You agree to pay the final bid amount plus any applicable fees

### 4.2 Payment
• Payment must be made within 48 hours of winning an auction
• Accepted payment methods are displayed at checkout
• Failure to pay may result in account suspension

### 4.3 Shipping
• Shipping costs are the buyer's responsibility unless stated otherwise
• Buyers are responsible for providing accurate shipping addresses
• Risk of loss transfers upon delivery

## 5. Selling on BidGoat

### 5.1 Listing Items
• You must own or have authorization to sell listed items
• Item descriptions must be accurate and complete
• You may not list prohibited items
• You agree to honor the final auction price

### 5.2 Fees
• BidGoat charges a commission on successful sales
• Fee structure is available in the app settings
• Fees are automatically deducted from sale proceeds

### 5.3 Seller Obligations
• Ship items within 3 business days of payment
• Provide tracking information to buyers
• Package items securely to prevent damage
• Respond to buyer inquiries promptly

## 6. Prohibited Activities

You may not:
• List counterfeit or stolen items
• Manipulate auctions through shill bidding
• Harass or abuse other users
• Share account credentials
• Use automated tools or bots
• Attempt to circumvent platform fees
• Post offensive or inappropriate content

## 7. Prohibited Items

The following items cannot be sold on BidGoat:
• Counterfeit goods
• Stolen property
• Items that infringe intellectual property rights
• Recalled items
• Weapons or illegal substances

## 8. Disclaimers

BidGoat is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service. We are not responsible for user-generated content.

## 9. Limitation of Liability

BidGoat's liability is limited to the fees paid in the transaction. We are not liable for indirect, incidental, or consequential damages.

## 10. Contact Information

For questions about these Terms of Service:
• Email: legal@bidgoat.com

---

By using BidGoat, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.`;

const PRIVACY_POLICY = `# Privacy Policy

**Last Updated: November 4, 2025**

## 1. Introduction

BidGoat respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.

## 2. Information We Collect

### 2.1 Information You Provide
• Account Information: Name, email, phone number, username, password
• Profile Information: Profile photo, bio, location
• Payment Information: Credit card details, billing address
• Listing Information: Item descriptions, photos, pricing
• Communications: Messages with other users, support inquiries

### 2.2 Automatically Collected Information
• Device Information: Device type, operating system, identifiers
• Usage Data: Features used, pages viewed, time spent
• Location Data: Approximate location based on IP address
• Log Data: Error logs, crash reports, performance data

## 3. How We Use Your Information

We use your information to:
• Provide Services: Create accounts, process transactions, facilitate auctions
• Improve Experience: Personalize content, recommend items
• Communication: Send notifications, updates, promotional messages
• Security: Detect fraud, prevent abuse, enforce terms
• Legal Compliance: Comply with laws and regulations

## 4. How We Share Your Information

### 4.1 With Other Users
• Your public profile is visible to all users
• Winners and sellers can see each other's shipping information
• Your reviews and ratings are publicly visible

### 4.2 With Service Providers
We share information with third-party providers:
• Payment processors (Stripe, PayPal)
• Cloud hosting services
• Analytics services
• Email service providers

### 4.3 For Legal Reasons
We may disclose information when required by law or to:
• Comply with legal processes
• Enforce our Terms of Service
• Protect rights, property, and safety
• Prevent fraud or security threats

## 5. Data Security

### 5.1 Security Measures
• Encryption of data in transit (HTTPS/TLS)
• Encryption of sensitive data at rest
• Secure payment processing (PCI-DSS compliant)
• Regular security audits
• Access controls and authentication

### 5.2 Limitations
No method of transmission or storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.

## 6. Your Privacy Rights

You have the right to:
• Access: Request a copy of your personal information
• Correct: Update inaccurate or incomplete information
• Delete: Request deletion of your account and data
• Export: Receive your data in a portable format
• Opt-Out: Unsubscribe from marketing communications

To exercise these rights, email privacy@bidgoat.com

## 7. Children's Privacy

BidGoat is not intended for users under 18. We do not knowingly collect information from children.

## 8. Cookies and Tracking

We use cookies and similar technologies for:
• Essential functionality
• Analytics and usage patterns
• Preferences and settings
• Marketing effectiveness

You can control cookies through app and device settings.

## 9. Data Retention

### 9.1 Active Accounts
We retain your information while your account is active.

### 9.2 Deleted Accounts
• Most personal data deleted within 90 days
• Transaction records retained for legal/tax purposes (7 years)
• Anonymized data may be retained for analytics

## 10. Push Notifications

We may send push notifications for:
• Bid updates and auction endings
• Messages from other users
• Payment confirmations
• Account security alerts

You can disable notifications in your device settings.

## 11. California Privacy Rights (CCPA)

California residents have additional rights:
• Right to Know what personal information we collect
• Right to Delete personal information
• Right to Opt-Out of sale of personal information (we do not sell data)
• Non-Discrimination regardless of privacy choices

## 12. European Privacy Rights (GDPR)

EU/UK residents have additional rights under GDPR. Contact dpo@bidgoat.com for inquiries.

## 13. Changes to This Policy

We may update this Privacy Policy periodically. Material changes will be communicated via email or in-app notification.

## 14. Contact Us

For privacy questions or concerns:
• Email: privacy@bidgoat.com
• Response Time: Within 30 days

---

By using BidGoat, you consent to this Privacy Policy and agree to its terms.`;

export default function LegalDocumentScreen() {
  const { document } = useLocalSearchParams<{ document: string }>();

  const isTerms = document === 'terms';
  const title = isTerms ? 'Terms of Service' : 'Privacy Policy';
  const content = isTerms ? TERMS_OF_SERVICE : PRIVACY_POLICY;

  // Parse markdown-style content into sections
  const sections = content.split('\n## ').map((section, index) => {
    if (index === 0) {
      // First section contains the title and intro
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: title,
          headerShown: true,
        }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            {index === 0 ? (
              <ThemedText type="title" style={styles.mainTitle}>
                {section.title}
              </ThemedText>
            ) : (
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                {section.title}
              </ThemedText>
            )}
            <ThemedText style={styles.sectionContent}>
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
    backgroundColor: '#fff',
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
    color: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
    color: '#333',
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555',
  },
});
