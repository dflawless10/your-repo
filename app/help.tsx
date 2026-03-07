import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from './components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";
import { useTheme } from '@/app/theme/ThemeContext';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function HelpScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const scrollY = new Animated.Value(0);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    gettingStarted: false,
    buying: false,
    selling: false,
    revenue: false,
  });

  const faqData: FAQItem[] = [
    // Bidding Questions
    { category: "Bidding", question: "Why can't I bid exactly $2,501?", answer: "BidGoat uses industry-standard tiered bid increments to prevent penny-bidding wars:\n\n• Under $100: $5 minimum\n• $100-$499: $25 minimum\n• $500-$999: $50 minimum\n• $1,000-$4,999: $100 minimum\n• $5,000-$9,999: $250 minimum\n• $10,000-$24,999: $500 minimum\n• $25,000+: $1,000 minimum\n\nExample: If the current bid is $2,500, the next bid must be at least $2,600." },
    { category: "Bidding", question: "What is Auto-Bid?", answer: "Auto-Bid automatically places bids for you up to your maximum amount. When someone outbids you, the system bids the minimum increment on your behalf until your max is reached. You won't pay more than necessary - just one increment above the second-highest bidder." },
    { category: "Bidding", question: "How does proxy bidding work?", answer: "When multiple auto-bidders compete, BidGoat instantly resolves the winner using eBay-style proxy bidding. The winner pays just one increment above the second-highest max bid, not their full maximum. This saves time and prevents unnecessary bid wars." },
    { category: "Bidding", question: "What happens if I'm outbid?", answer: "You'll receive a notification immediately. If you have Auto-Bid enabled with remaining budget, it will automatically place a counter-bid. Otherwise, you can manually place a new bid before the auction ends." },
    { category: "Bidding", question: "Can I retract a bid?", answer: "Bids are binding commitments. Bid retractions are only allowed in exceptional circumstances (e.g., you entered the wrong amount). Contact support@bidgoat.com with your request." },

    // Auction Rules
    { category: "Auction Rules", question: "What is auction extension time?", answer: "If a bid is placed in the final minutes of an auction, the end time extends by 5 minutes. This prevents 'sniping' and gives all bidders a fair chance to respond." },
    { category: "Auction Rules", question: "What is a Reserve Price?", answer: "A reserve price is the minimum amount a seller will accept. If bidding doesn't reach the reserve, the item won't sell (even if there are bids). Reserve prices cost $3 to add and aren't visible to bidders." },
    { category: "Auction Rules", question: "What's the difference between Must Sell and regular auctions?", answer: "Must Sell auctions have NO reserve price - the highest bidder wins regardless of the amount. Regular auctions may have hidden reserves that must be met for the item to sell." },

    // Payment & Fees
    { category: "Payment & Fees", question: "When do I pay for a won item?", answer: "Payment is due within 48 hours of winning an auction. You'll receive an email with payment instructions. Items unpaid after 48 hours may be relisted." },
    { category: "Payment & Fees", question: "What payment methods are accepted?", answer: "BidGoat accepts all major credit/debit cards through Stripe. We do not accept cash, checks, or cryptocurrency at this time." },
    { category: "Payment & Fees", question: "What are the seller fees?", answer: "Standard sellers pay 8% commission + 3% payment processing. Premium sellers ($19.99/month) pay only 5% commission + 3% processing. Buyers pay shipping separately." },
    { category: "Payment & Fees", question: "Who pays for shipping?", answer: "Buyers pay shipping costs based on item weight:\n• Small (<1 lb): $7.99\n• Medium (1-5 lbs): $12.99\n• Large (5-10 lbs): $18.99\n• Oversized (10+ lbs): $29.99\n\nOptional shipping insurance is available." },
    { category: "Payment & Fees", question: "What happens if my credit card was declined at checkout?", answer: "If your card is declined, no payment is processed and your order is not completed. Common reasons include insufficient funds, expired card, incorrect billing info, or bank security blocks. Try another card or contact your bank to approve the transaction." },
    { category: "Payment & Fees", question: "Can I delete an item from my cart?", answer: "Yes! Open your cart and tap the trash icon next to the item you want to remove. This instantly clears it from your cart without affecting the seller or the listing." },

    // Selling
    { category: "Selling", question: "How do I set my shop's return policy?", answer: "Set your seller policies once and they apply to all your listings:\n\n1. Tap hamburger menu (☰)\n2. Go to 'Account Settings'\n3. Tap 'Seller Policies'\n4. Choose return policy:\n   • No Returns (Final Sale)\n   • 7-Day Returns\n   • 14-Day Returns ⭐ Recommended\n   • 30-Day Returns\n5. Set who pays return shipping\n6. Choose restocking fee (0-20%)\n7. Enable authenticity guarantee (optional)\n8. Set shipping handling time\n9. Tap 'Save Policies'\n\nYour policies appear on every listing automatically! Buyers can review them before bidding." },
    { category: "Selling", question: "Should I offer returns as a seller?", answer: "Yes! Data shows listings with returns get 40% more bids:\n\n✅ 14-Day Returns (Recommended):\n• Sweet spot for most sellers\n• Builds buyer confidence\n• Reduces disputes\n• Competitive with eBay/Etsy\n\n⚠️ No Returns (Final Sale):\n• Lower buyer trust\n• Fewer bids\n• More disputes\n• Platform baseline still applies (counterfeits, misrepresented items)\n\nNote: Even with 'No Returns', you MUST accept returns if item is counterfeit, fake, or not as described. BidGoat enforces platform protections." },
    { category: "Selling", question: "What is an authenticity guarantee?", answer: "Authenticity Guarantee is a seller badge showing you stand behind your items:\n\n✓ Displays on all your listings\n✓ Builds buyer confidence on luxury items\n✓ Reduces authenticity disputes\n✓ Free to enable in Seller Policies\n\nIf you offer authenticity guarantee but sell counterfeit items:\n• Account suspension\n• Full refund to buyer\n• Seller pays all return costs\n• Possible ban from platform\n\nOnly enable if you're 100% certain your items are authentic!" },
    { category: "Selling", question: "Can I set different policies for individual items?", answer: "Yes! You can override your default policy for specific items:\n\n🎯 How to Override:\n1. When listing an item (List Buy It Now, etc.)\n2. Scroll down to '📋 Use My Default Return Policy'\n3. Tap to expand override options\n4. Choose different policy:\n   • No Returns (Final Sale)\n   • 7-Day Returns\n   • 14-Day Returns\n   • 30-Day Returns\n5. List the item\n\n💡 Example Use Cases:\n• Set shop default to '14-Day Returns'\n• Override specific custom jewelry to 'No Returns'\n• Your other 50 listings still have 14-day returns!\n\nPerfect for custom orders, personalized items, or clearance sales." },
    { category: "Selling", question: "How long do listings last?", answer: "Duration depends on your selling strategy:\n\n🔥 Must Sell (Fast Auction):\n• 24 hours, 48 hours, or 72 hours\n• For urgent sales and quick cash\n• Creates urgency for bidders\n\n🛒 Buy It Now (Fixed Price):\n• 7 days, 14 days, or 30 days\n• Buyers purchase instantly at your price\n• Great for items with known value\n\n⚡ Create Auction (Classic Bidding):\n• 24-720 hours (1-30 days)\n• Choose presets: 24h, 48h, 7 days, 14 days, 30 days\n• Or enter custom duration\n• Longer durations = more bidder discovery\n\nWhen relisting, you get the same duration options as the original strategy!" },
    { category: "Selling", question: "What is a Featured Listing?", answer: "Featured Listings appear on the homepage for 7 days, giving your item maximum visibility. Featured listings cost $10 and typically attract 3-5x more bidders." },
    { category: "Selling", question: "Can I relist an expired item?", answer: "Yes! If your item didn't sell or the reserve wasn't met, you can relist it with one tap.\n\nWhen relisting, you can:\n• Keep the same selling strategy OR switch strategies\n• Change Must Sell to Buy It Now if you got no bids (BidGoat's smart recommendation)\n• Adjust the starting price or reserve\n• Choose auction duration (same options as original listing)\n\nBidGoat's selling strategy algorithm helps optimize your approach based on how the first listing performed!" },
    { category: "Selling", question: "When do I get paid as a seller?", answer: "Funds are released after the buyer confirms delivery or 7 days after shipment tracking shows delivered (whichever comes first). This protects both buyers and sellers." },
    { category: "Selling", question: "How difficult is it to List My Diamond?", answer: "Enter your diamonds carat weight, color, clarity, and cut. Enter your diamonds certification number if certified. Enter yes or no if it was ethically sourced. Tap upload photo. Upload up to 5 photos, preview and tap List Diamond. Choose your selling strategy and tap List Diamond." },
    { category: "Selling", question: "What happens if I made a mistake after I listed my item?", answer: "No problem! You have up to 1 hour to correct any mistakes or delete the item." },
    { category: "Selling", question: "Where can I find items I listed for sale?", answer:"\n1. Tap hamburger menu (☰)\n2. Go to Selling section\n3. Tap Selling Dashboard.\n4. Open up My Listings." },

    // Shipping & Delivery
    { category: "Shipping", question: "How long do I have to ship an item?", answer: "Sellers must ship within 3 business days of receiving payment. Premium Rush items (marked with ⚡) must ship within 24 hours or face penalties." },
    { category: "Shipping", question: "Do I need to provide tracking?", answer: "Yes, tracking is required for all shipments. Upload tracking numbers to 'Orders to Ship' within 3 business days of payment. This protects both you and the buyer." },
    { category: "Shipping", question: "What if my item arrives damaged?", answer: "Buyers have 3 days after delivery to report damage. If you purchased shipping insurance, file a claim through your seller dashboard. Always photograph items before shipping." },
    { category: "Shipping", question: "Where do I enter the shipping weight?", answer: "You can enter the shipping weight in your listing form." },

    // Returns & Disputes
    { category: "Returns", question: "What is BidGoat's return policy?", answer: "BidGoat uses a two-tier return system:\n\n🛡️ PLATFORM BASELINE (Always Protected):\nReturns are ALWAYS accepted if:\n• Item is counterfeit, fake, or replica\n• Item is significantly not as described\n• Item arrives damaged due to inadequate packaging\n• Item has undisclosed defects\n• Wrong item/size/color received\n\nSellers CANNOT override these protections.\n\n👔 SELLER POLICIES (Your Choice):\nEach seller chooses:\n• No Returns (Final Sale) - only baseline applies\n• 7-Day Returns - fast-moving inventory\n• 14-Day Returns - standard window (recommended)\n• 30-Day Returns - extended buyer confidence\n\nReturn policies are displayed on every listing page before you bid!" },
    { category: "Returns", question: "What is the inspection period for high-value items?", answer: "BidGoat automatically adds inspection periods for high-value purchases:\n\n• Items $1,000-$4,999: 48-hour inspection period\n• Items $5,000+: 7-day inspection period\n\nDuring this time, you can:\n• Request professional authentication\n• Thoroughly inspect the item\n• Return if authenticity cannot be verified\n\nSeller pays return shipping during inspection periods. This protects buyers on luxury purchases!" },
    { category: "Returns", question: "How do I view a seller's return policy?", answer: "Every item page shows the seller's policies in an eBay-style section below the item details:\n\n📦 Shipping Policy - handling time and method\n↩️ Returns Policy - window (0/7/14/30 days)\n💰 Restocking Fees - if any (0-20%)\n✓ Authenticity Guarantee - if offered\n\nTap each section to expand and see full details. Always review before bidding!" },
    { category: "Returns", question: "Who pays return shipping?", answer: "It depends on the reason:\n\n✅ Buyer pays return shipping IF:\n• Buyer's remorse / changed mind\n• Within seller's voluntary return window\n• Item exactly as described\n\n✅ Seller pays return shipping IF:\n• Item is counterfeit or not as described\n• Item damaged due to poor packaging\n• Undisclosed defects\n• During high-value inspection period ($1000+)\n\nPlatform baseline protections always favor the buyer!" },
    { category: "Returns", question: "What are restocking fees?", answer: "Sellers may charge up to 20% restocking fee for:\n• Buyer's remorse returns (changed your mind)\n• Items returned in sellable condition\n\nRestocking fees CANNOT be charged if:\n• Item is counterfeit or fake\n• Item not as described\n• Item has defects\n• Platform baseline protection applies\n\nRestocking fees are disclosed on the listing page before you bid." },
    { category: "Returns", question: "How do I request a return or open a dispute?", answer: "To open a dispute:\n1. Tap hamburger menu (☰)\n2. Go to Buying section\n3. Tap 'My Purchases & Rewards'\n4. Find the item you want to dispute\n5. Tap 'Open Dispute' or 'Request Return'\n6. Choose reason (counterfeit, not as described, damaged, etc.)\n7. Write detailed description\n8. Upload evidence photos\n9. Submit dispute\n\nSeller has 48 hours to respond. If baseline-protected reason (counterfeit, misrepresented, etc.), BidGoat will override seller policy and approve your return." },
    { category: "Returns", question: "What happens after I open a dispute?", answer: "Dispute Resolution Timeline:\n\n1️⃣ You open dispute (with photos/evidence)\n2️⃣ Seller has 48 hours to respond\n3️⃣ Seller provides their evidence/explanation\n4️⃣ BidGoat reviews both sides (3-5 business days)\n5️⃣ BidGoat makes final binding decision\n\nPossible outcomes:\n• Full refund + return shipping label\n• Partial refund (for minor issues)\n• No refund (if item matches description)\n• Seller account suspension (repeat violations)\n\nBidGoat has override authority for fraud cases!" },
    { category: "Returns", question: "What if the seller doesn't respond to my dispute?", answer: "If seller doesn't respond within 48 hours:\n• BidGoat automatically reviews your evidence\n• Decision made based on your photos/description\n• Refund may be issued without seller input\n• Unresponsive sellers face account penalties\n\nYou're protected - sellers must participate in dispute resolution or face consequences." },

    // Account & Premium
    { category: "Account", question: "Can I change my username?", answer: "No, usernames are permanent and cannot be changed. This policy:\n\n• Prevents seller reputation manipulation\n• Stops scammers from hiding bad reviews\n• Builds trust with transparent seller history\n• Maintains accountability\n\nChoose your username carefully during registration - it's your permanent identity on BidGoat!" },
    { category: "Account", question: "Why is there a 20-character username limit?", answer: "The 20-character limit ensures:\n\n• Usernames display properly on all devices\n• Seller info (avatar, name, ratings) fits on item cards\n• Clean, readable UI across the platform\n• Consistency with industry standards (eBay: 20, Instagram: 30)\n\nMost usernames are 8-15 characters, so 20 gives plenty of room for creativity while maintaining good UX." },
    { category: "Account", question: "What is BidGoat Premium?", answer: "Premium sellers pay $19.99/month and receive:\n• Reduced commission (5% instead of 8%)\n• Priority customer support\n• Advanced analytics dashboard\n• Bulk listing tools\n• Early access to new features\n\nAccess Premium from the menu: Tap the hamburger menu → Look for '⭐ Unlock Premium' at the top of the Selling section, or '✨ Get Premium & Save' in the Account section." },
    { category: "Account", question: "How do I upgrade to Premium?", answer: "To upgrade to Premium:\n1. Tap the hamburger menu (☰) in the top navigation\n2. Find '⭐ Unlock Premium - Save 3%' at the top of the Selling section\n3. Or tap '✨ Get Premium & Save' in the Account section\n4. Review the benefits and pricing\n5. Tap 'Subscribe for $19.99/month'\n\nYou'll start saving 3% on every sale immediately!" },
    { category: "Account", question: "How do I check my Premium status?", answer: "Premium members see '⭐ Premium Member' at the top of the Selling section and '✨ Premium Active' in the Account section of the menu. These badges remind you of your active status and savings on every sale." },
    { category: "Account", question: "How do I become a verified seller?", answer: "Complete 10 successful sales with 100% positive feedback to unlock verified seller status. Verified sellers get a badge and appear higher in search results." },
    { category: "Account", question: "Can I delete my account?", answer: "Yes, you can delete your account in Settings > Account > Delete Account. Note: You cannot delete your account if you have active auctions, pending payments, or open disputes." },
    { category: "Account", question: "Can I shop as a Guest?", answer: "Yes! BidGoat welcomes guest browsing:\n\n✅ Guests CAN:\n• Browse items in Discover\n• View item details, photos, and descriptions\n• See current bids and prices\n• Search and filter by category\n• View seller profiles and ratings\n\n❌ Guests CANNOT:\n• Place bids on auctions\n• Buy It Now purchases\n• Add items to Jewelry Box/Wishlist\n• Make offers on items\n• View 'My Auctions' feed\n• Create listings\n• Check out or make purchases\n\n🐐 When does BidGoat ask you to register?\nWhen you tap 'Place Bid', 'Buy It Now', or try to add items to your Jewelry Box, you'll see a friendly prompt: 'Login Required - Please sign in to [action]'\n\nCreating an account is free and protects your purchases, order history, and seller reputation!" },
    { category: "Account", question: "Where can I get help with my order?", answer: "\n1. Tap the hamburger menu (☰) in the top navigation.\n2. Go to the Buying Section. \n3. Open up My Purchases & Rewards. \n4. Select your item.\n5. Tap 'Get Help'. You can report issues, request returns, upload photos, or contact support directly from your order page." },
    { category: "Account", question: "What is Import Reputation and how do I get 8% lifetime fee?", answer: "Import Reputation lets you bring your seller ratings from eBay, Etsy, Amazon, or other platforms to BidGoat and lock in an 8% lifetime fee (vs 12-15% standard)!\n\n🎁 How to Import:\n1. Tap hamburger menu (☰)\n2. Go to Account section\n3. Tap 'Import Reputation'\n4. Select your platform (eBay, Etsy, Amazon, etc.)\n5. Enter your username and stats (reviews, rating)\n6. Upload screenshot of your seller profile\n7. Submit for verification\n\n💰 Your Special Fee:\n• Standard sellers: 12-15% total\n• Imported sellers: 8% total (5% platform + 3% processing)\n• Fee locked in FOR LIFE once approved!\n\nWe'll verify your import within 24-48 hours and notify you when approved. Your existing reputation helps you sell faster on BidGoat!" },
    { category: "Account", question: "How do I enable Dark Mode?", answer: "BidGoat supports both light and dark themes!\n\nTo enable Dark Mode:\n1. Tap hamburger menu (☰)\n2. Look for the theme toggle (sun/moon icon) in the header\n3. Tap to switch between light and dark mode\n\nYour theme preference is saved automatically and applies across the entire app including:\n• All screens and modals\n• Item cards and listings\n• Photo upload previews\n• Advanced options\n• Watch appraisal form\n\nDark mode is easier on your eyes at night and saves battery on OLED screens!" },
    { category: "Account", question: "How do notifications work?", answer: "BidGoat keeps you updated on all your activity with smart notifications!\n\n🔔 To View Notifications:\n1. Tap the bell icon (🔔) in the top navigation\n2. See your notification feed\n3. Tap any notification to go directly to that item/order\n\n📱 Notification Types:\n• Outbid alerts - someone outbid you on an auction\n• Bid received - someone bid on your item\n• Item sold - your auction ended with winner\n• Order shipped - seller shipped your item\n• Delivery confirmed - buyer confirmed delivery\n• Payment received - buyer paid for your item\n• Ship reminder - time to ship an order\n• Overdue shipment - you missed shipping deadline\n• Return requested/approved/rejected\n• Order cancelled\n• New offer received\n• Offer accepted/rejected\n\n🎨 Priority Colors:\n• 🔴 Critical (red) - Overdue shipments, urgent actions\n• 🟠 High (orange) - Ship reminders, payment due\n• 🟣 Normal (purple) - General updates\n\nAll notifications are tappable and route you directly to the relevant page!" },

    // Watches
    { category: "Watches", question: "How do I list my watch for sale?", answer: "BidGoat has a powerful watch appraisal and listing system!\n\n📍 To List Your Watch:\n1. Tap hamburger menu (☰)\n2. Go to Selling section\n3. Tap 'List My Watch'\n4. Enter brand and model (e.g., Rolex Daytona)\n5. Tap 'Get Appraisal'\n6. System calculates market value from multiple sources\n7. Upload up to 5 photos\n8. Choose your selling strategy:\n   • Classic Auction (7-30 days)\n   • Buy It Now (instant sale)\n   • Must Sell (24-72 hours, no reserve)\n9. Add advanced options (Reserve Price, Buy It Now)\n10. List your watch!\n\n⌚ Watch Details Supported:\n• Brand, model, model number, serial number\n• Condition (poor/fair/good/excellent)\n• Case material, band material, movement type\n• Year of manufacture, country of origin\n• Water resistance, rarity, features\n• Original packaging, diamonds, warranty\n\nThe more details you provide, the more accurate the appraisal!" },
    { category: "Watches", question: "How does watch appraisal work?", answer: "BidGoat's watch appraisal system pulls real-time pricing from multiple trusted sources:\n\n🔍 Pricing Sources:\n• Chrono24 (largest watch marketplace)\n• eBay Sold Listings (real transaction data)\n• Gray & Sons (authorized dealer)\n• Watchbox (pre-owned specialist)\n• Local watch database\n\n📊 You Get:\n• Estimated market value\n• Confidence level (high/medium/low)\n• Price range (min-max)\n• Source breakdown showing where data came from\n• Number of data points analyzed\n\n⏱️ The Process:\n1. Enter brand, model, and condition\n2. System queries multiple sources\n3. Weighted average calculated (Chrono24: 30%, eBay: 25%, etc.)\n4. Adjustments for condition, age, features, materials\n5. Final appraisal with confidence score\n\nIf one source times out (e.g., eBay), appraisal still completes using other sources!" },
    { category: "Watches", question: "What are Advanced Auction Options for watches?", answer: "When listing a watch, you can choose advanced auction options:\n\n🔒 Reserve Price ($3 fee):\n• Set minimum price you'll accept\n• Hidden from bidders\n• If bidding doesn't reach reserve, item doesn't sell\n• Quick-select buttons: 70%, 80%, 90%, 95% of appraisal\n\n⚡ Buy It Now Price:\n• Let buyers purchase instantly at your price\n• Auction continues but buyer can end it immediately\n• Great for impatient buyers willing to pay premium\n\n🔥 Must Sell Mode:\n• NO reserve price - highest bidder wins\n• Shorter duration: 24, 48, or 72 hours only\n• Creates urgency for bidders\n• When enabled, Reserve and Buy It Now are disabled\n\nChoose the strategy that fits your timeline and price goals!" },

  ];

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <EnhancedHeader scrollY={scrollY} onSearch={() => {}} />

      <Animated.ScrollView
        style={[styles.content, { backgroundColor: colors.background }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20 }}
      >
        {/* Page Header with Back Arrow */}
        <Animated.View style={[styles.pageHeader, {
          opacity: headerOpacity,
          transform: [{ scale: headerScale }],
          backgroundColor: colors.background,
          borderBottomColor: theme === 'dark' ? '#333' : '#E5E5E5'
        }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Help Center</Text>
        </Animated.View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>🐐 Welcome to BidGoat Help!</Text>

        {/* Quick Start Guide - Collapsible Sections */}
        <View style={styles.quickGuideContainer}>
          {/* Getting Started */}
          <TouchableOpacity
            style={[styles.collapsibleHeader, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
            onPress={() => setExpandedSections(prev => ({ ...prev, gettingStarted: !prev.gettingStarted }))}
            activeOpacity={0.7}
          >
            <Text style={[styles.collapsibleTitle, { color: colors.textPrimary }]}>🚀 Getting Started</Text>
            <Ionicons
              name={expandedSections.gettingStarted ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
            />
          </TouchableOpacity>
          {expandedSections.gettingStarted && (
            <View style={[styles.collapsibleContent, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F9FAFB' }]}>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Create your account (username is permanent!)</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Choose a username wisely (3-20 characters, can&#39;t change later)</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Browse items in the Discover section</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Add items to favorites with the heart icon</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Check out the Gift Finder for personalized recommendations</Text>
            </View>
          )}

          {/* Buying Items */}
          <TouchableOpacity
            style={[styles.collapsibleHeader, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
            onPress={() => setExpandedSections(prev => ({ ...prev, buying: !prev.buying }))}
            activeOpacity={0.7}
          >
            <Text style={[styles.collapsibleTitle, { color: colors.textPrimary }]}>🛍️ Buying Items</Text>
            <Ionicons
              name={expandedSections.buying ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
            />
          </TouchableOpacity>
          {expandedSections.buying && (
            <View style={[styles.collapsibleContent, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F9FAFB' }]}>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Place manual bids on auction items</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Enable Auto-Bid to bid automatically up to your max</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Proxy bidding resolves multi-bidder battles instantly</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Use &#34;Buy It Now&#34; for instant purchase</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Track orders in &#34;My Purchases & Rewards&#34;</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Manage sent offers in the Buying section</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Bids use tiered increments ($5 to $1,000)</Text>
            </View>
          )}

          {/* Selling Items */}
          <TouchableOpacity
            style={[styles.collapsibleHeader, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
            onPress={() => setExpandedSections(prev => ({ ...prev, selling: !prev.selling }))}
            activeOpacity={0.7}
          >
            <Text style={[styles.collapsibleTitle, { color: colors.textPrimary }]}>💰 Selling Items</Text>
            <Ionicons
              name={expandedSections.selling ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
            />
          </TouchableOpacity>
          {expandedSections.selling && (
            <View style={[styles.collapsibleContent, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F9FAFB' }]}>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• List auctions for 7, 10, 14, or 30 days</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Create Buy It Now listings for instant sales</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Use Must Sell for no-reserve auctions</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Upgrade to Premium to save 3% on every sale</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Featured Listings ($10) get 7 days homepage placement</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Add Reserve Price ($3) to protect your minimum</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Manage orders in &#34;Orders to Ship&#34;</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Track revenue in your Selling Dashboard</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Relist expired items with one tap</Text>
            </View>
          )}

          {/* Revenue & Fees */}
          <TouchableOpacity
            style={[styles.collapsibleHeader, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
            onPress={() => setExpandedSections(prev => ({ ...prev, revenue: !prev.revenue }))}
            activeOpacity={0.7}
          >
            <Text style={[styles.collapsibleTitle, { color: colors.textPrimary }]}>💸 Revenue & Fees</Text>
            <Ionicons
              name={expandedSections.revenue ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
            />
          </TouchableOpacity>
          {expandedSections.revenue && (
            <View style={[styles.collapsibleContent, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#F9FAFB' }]}>
              <Text style={[styles.textBold, { color: colors.textPrimary }]}>📊 Commission & Processing:</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Regular Sellers: 8% commission + 3% processing = 11% total</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Premium Sellers: 5% commission + 3% processing = 8% total</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Upgrade to Premium for $19.99/month (save 3% on every sale!)</Text>

              <Text style={[styles.textBold, { marginTop: 12, color: colors.textPrimary }]}>🚚 Buyer-Paid Shipping:</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Small (&lt;1 lb): $7.99</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Medium (1-5 lbs): $12.99</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Large (5-10 lbs): $18.99</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Oversized (10+ lbs): $29.99</Text>

              <Text style={[styles.textBold, { marginTop: 12, color: colors.textPrimary }]}>🛡️ Optional Insurance:</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• $0-$100: Free</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• $101-$500: $2.99</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• $501-$1,000: $4.99</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• $1,001-$5,000: $9.99</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• $5,000+: 1% of item value</Text>

              <Text style={[styles.textBold, { marginTop: 12, color: colors.textPrimary }]}>🌟 Premium Features:</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Featured Listing: $10 (7 days homepage placement)</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Reserve Price: $3 (set minimum bid)</Text>
            </View>
          )}
        </View>


        {/* FAQ Section */}
        <View style={styles.faqContainer}>
          <Text style={[styles.faqTitle, { color: colors.textPrimary }]}>❓ Frequently Asked Questions</Text>

          {["Bidding", "Auction Rules", "Payment & Fees", "Selling", "Shipping", "Returns", "Account", "Watches"].map((category) => (
            <View key={category} style={styles.faqCategory}>
              <Text style={[styles.faqCategoryTitle, { color: theme === 'dark' ? '#B794F4' : '#6A0DAD' }]}>{category}</Text>

              {faqData
                .filter((faq) => faq.category === category)
                .map((faq, index) => {
                  const globalIndex = faqData.indexOf(faq);
                  const isExpanded = expandedFAQ === globalIndex;

                  return (
                    <TouchableOpacity
                      key={globalIndex}
                      style={[styles.faqItem, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}
                      onPress={() => setExpandedFAQ(isExpanded ? null : globalIndex)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.faqQuestionRow}>
                        <Text style={[styles.faqQuestion, { color: colors.textPrimary }]}>{faq.question}</Text>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={20}
                          color={theme === 'dark' ? '#B794F4' : '#6A0DAD'}
                        />
                      </View>

                      {isExpanded && (
                        <Text style={[styles.faqAnswer, { color: theme === 'dark' ? '#9CA3AF' : '#555' }]}>{faq.answer}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Need More Help?</Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>Contact us at support@bidgoat.com</Text>
        </View>
        <View style={{ height: 40 }} />
      </Animated.ScrollView>
      <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: '#4a5568',
    lineHeight: 24,
    marginBottom: 8,
  },
  textBold: {
    fontSize: 15,
    color: '#1A202C',
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 8,
  },
  quickGuideContainer: {
    marginBottom: 24,
    marginHorizontal: 16,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  collapsibleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A202C',
  },
  collapsibleContent: {
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: -8,
  },
  faqContainer: {
    marginBottom: 16,
  },
  faqTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  faqCategory: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  faqCategoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#6A0DAD',
    padding: 12,
    paddingLeft: 16,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 16,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A202C',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
});
