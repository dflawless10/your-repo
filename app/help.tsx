import React, { useRef, useEffect, useState } from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform, Linking} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from './components/EnhancedHeader';
import GlobalFooter from "@/app/components/GlobalFooter";
import { useTheme } from '@/app/theme/ThemeContext';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  emailLink?: string;
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
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) =>
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

  const faqData: FAQItem[] = [
    // Bidding Questions
    { category: "Bidding", question: "Why can't I bid exactly $2,501?", answer: "BidGoat uses industry-standard tiered bid increments to prevent penny-bidding wars:\n\n• Under $100: $5 minimum\n• $100-$499: $25 minimum\n• $500-$999: $50 minimum\n• $1,000-$4,999: $100 minimum\n• $5,000-$9,999: $250 minimum\n• $10,000-$24,999: $500 minimum\n• $25,000+: $1,000 minimum\n\nExample: If the current bid is $2,500, the next bid must be at least $2,600." },
    { category: "Bidding", question: "What is Auto-Bid?", answer: "Auto-Bid automatically places bids for you up to your maximum amount. When someone outbids you, the system bids the minimum increment on your behalf until your max is reached. You won't pay more than necessary - just one increment above the second-highest bidder." },
    { category: "Bidding", question: "How does proxy bidding work?", answer: "Proxy bidding is BidGoat's core competitive resolution system. When two or more bidders have Auto-Bid enabled, BidGoat instantly determines the winner — no manual back-and-forth required.\n\nHow it works:\n1. Each bidder sets their max bid\n2. The highest max bid wins\n3. The winner pays only one bid increment above the second-highest max — not their full maximum\n\nExample: You set a max of $500. Another bidder maxes at $400. You win — and you only pay $450, not $500.\n\nBidGoat enhances proxy bidding with three Auto-Bid modes that control WHEN your bids are placed:\n\n🔥 Active Mode — bids consistently throughout the auction to stay competitive\n⏳ Late Mode — conservative early, aggressive near the end\n🎯 Snipe Mode — places bids in the final moments to avoid early price escalation\n\nThis is BidGoat's own three-tier Auto-Bid strategy — designed to give you the edge." },
    { category: "Bidding", question: "What happens if I'm outbid?", answer: "You'll receive a notification immediately. If you have Auto-Bid enabled with remaining budget, it will automatically place a counter-bid. Otherwise, you can manually place a new bid before the auction ends." },
    { category: "Bidding", question: "Can I retract a bid?", answer: "Bids are binding commitments. Bid retractions are only allowed in exceptional circumstances (e.g., you entered the wrong amount). Contact support@bidgoat.com with your request." },
    { category: "Bidding", question: "What are the Auto-Bid modes?", answer: "BidGoat offers three Auto-Bid modes:\n\n🔥 Active Mode:\nBids consistently throughout the auction to keep you competitive.\n\n⏳ Late Mode:\nConservative early, aggressive near the end.\n\n🎯 Snipe Mode:\nPlaces strong bids in the final moments to win without driving up the price early."},
    { category: "Bidding", question: "How does Snipe Mode work?", answer: "Snipe Mode waits until the final moments of the auction and then places bids up to your max. This reduces early bidding wars and increases your chance of winning at a lower price."},
    { category: "Bidding", question: "Does Auto-Bid ever exceed my max?", answer: "Never. Auto-Bid only bids the minimum amount needed to stay ahead, and it will not exceed the maximum you set." },

    // Auction Rules
    { category: "Auction Rules", question: "What is auction extension time?", answer: "If a bid is placed in the final minutes of an auction, the end time extends by 5 minutes. This prevents 'sniping' and gives all bidders a fair chance to respond." },
    { category: "Auction Rules", question: "What is a Reserve Price?", answer: "A reserve price is the minimum amount a seller will accept. If bidding doesn't reach the reserve, the item won't sell (even if there are bids). Reserve prices are hidden from bidders — only the seller knows the threshold." },
    { category: "Auction Rules", question: "What's the difference between Must Sell and regular auctions?", answer: "Must Sell auctions have NO reserve price - the highest bidder wins regardless of the amount. Regular auctions may have hidden reserves that must be met for the item to sell." },
    { category: "Auction Rules", question: "What is Must Sell?", answer: "Must Sell is a high-energy auction mode where the highest bidder wins—no reserve, no exceptions. Sellers choose 24h, 48h, or 72h durations. Must Sell creates urgency and attracts aggressive bidding."},
    { category: "Auction Rules", question: "Why choose Must Sell?", answer: "Must Sell is ideal when you want:\n• Fast sales\n• High bidder engagement\n• Guaranteed sale\n• Competitive bidding energy\n\nBuyers love Must Sell because every auction WILL end with a winner."},
    { category: "Auction Rules", question: "Can I cancel a Must Sell auction?", answer: "No. Once a Must Sell auction has a bid, it cannot be canceled. This ensures fairness and trust for bidders."},

    // Payment & Fees
    { category: "Payment & Fees", question: "When do I pay for a won item?", answer: "Payment is due within 48 hours of winning an auction. You'll receive an email with payment instructions. Items unpaid after 48 hours may be relisted." },
    { category: "Payment & Fees", question: "What payment methods are accepted?", answer: "BidGoat accepts all major Credit/Debit Cards, Cash App, Amazon, Google Pay, Klarna, Crypto, Apple Pay, Bank (ACH), Pay With Link through Stripe. We do not accept cash or checks at this time." },
    { category: "Payment & Fees", question: "What are the seller fees?", answer: "Standard sellers pay 8% commission + 3% payment processing. Premium sellers ($19.99/month) pay only 5% commission + 3% processing. Buyers pay shipping separately." },
    { category: "Payment & Fees", question: "Who pays for shipping?", answer: "Buyers pay shipping costs based on item weight:\n• Small (<1 lb): $7.99\n• Medium (1-5 lbs): $12.99\n• Large (5-10 lbs): $18.99\n• Oversized (10+ lbs): $29.99\n\nOptional shipping insurance is available." },
    { category: "Payment & Fees", question: "What happens if my credit card was declined at checkout?", answer: "If your card is declined, no payment is processed and your order is not completed. Common reasons include insufficient funds, expired card, incorrect billing info, or bank security blocks. Try another card or contact your bank to approve the transaction." },
    { category: "Payment & Fees", question: "Can I delete an item from my cart?", answer: "Yes! Open your cart and tap the trash icon next to the item you want to remove. This instantly clears it from your cart without affecting the seller or the listing." },

    // Buyer Protection
    {category: "Buyer Protection", question: "What does BidGoat Buyer Protection cover?", answer: "Buyer Protection covers you if:\n• The item never arrives\n• The item is counterfeit or fake\n• The item is not as described\n• The seller ships the wrong item\n• The item arrives damaged\n\nIf any of these occur, you can open a dispute and BidGoat will step in to help resolve the issue."},
    {category: "Buyer Protection", question: "How do I open a dispute?", answer: "1. Tap the hamburger menu (☰)\n2. Go to Buying section\n3. Open 'My Purchases & Rewards'\n4. Select your order\n5. Tap 'Get Help' → 'Open Dispute'\n6. Choose a reason and upload photos\n\nSellers have 48 hours to respond. If they don’t, BidGoat reviews your evidence and makes a decision."},
    {category: "Buyer Protection", question: "How long does dispute resolution take?", answer: "Most disputes are resolved within 3–5 business days after both sides submit evidence. Complex cases may take longer, but you’ll receive updates throughout the process."},
    {category: "Buyer Protection", question: "Do I need to return the item?", answer: "If your dispute is approved, you may be required to return the item. A prepaid return label will be provided when applicable. Items that are counterfeit or dangerous may not need to be returned."},

    // Disputes
    {category: "Disputes", question: "What happens after I open a dispute?", answer: "Timeline:\n1. You submit evidence\n2. Seller has 48 hours to respond\n3. BidGoat reviews both sides (3–5 business days)\n4. A final decision is made\n\nPossible outcomes:\n• Full refund\n• Partial refund\n• Return required\n• No refund (if item matches description)"},
    {category: "Disputes", question: "What if the seller doesn't respond?", answer: "If the seller does not respond within 48 hours, BidGoat reviews your evidence alone and may approve your claim automatically." },
    {category: "Disputes", question: "Can a dispute be reopened?", answer: "Yes. If new evidence becomes available within 7 days of the decision, you can request a review. After 7 days, the case is permanently closed." },

    // Payouts
    {category: "Payouts", question: "Why is my payout pending?", answer: "Payouts may be pending due to:\n• Delivery not yet confirmed\n• Tracking not updated\n• Stripe verification required\n• Recent account changes\n\nYou’ll receive a notification if action is needed."},
    {category: "Payouts", question: "Do I need to verify my identity to get paid?", answer: "Yes. Stripe requires identity verification for all sellers. You may be asked to upload a photo ID or confirm personal details. This protects the marketplace from fraud."},

    // Authentication
    {category: "Authentication", question: "How does BidGoat verify luxury items?", answer: "BidGoat uses a combination of seller history, documentation checks, and buyer protection policies. Sellers offering authenticity guarantees must stand behind their items or face penalties."},
    {category: "Authentication", question: "What happens if I receive a counterfeit item?", answer: "Open a dispute immediately. Counterfeit items are fully covered by Buyer Protection. You will receive a full refund and may not need to return the item."},
    {category: "Authentication", question: "Can I sell replicas or inspired pieces?", answer: "No. Counterfeit, replica, or trademark-infringing items are strictly prohibited. Listings violating this rule are removed and accounts may be suspended."},

    // Fees & Taxes
    {category: "Fees & Taxes", question: "Are there any listing fees?", answer: "No. BidGoat does not charge listing fees. You can list unlimited items for free."},
    {category: "Fees & Taxes", question: "Do buyers pay sales tax?", answer: "Yes. Sales tax is calculated automatically at checkout based on the buyer’s location. BidGoat handles tax collection and remittance."},
    {category: "Fees & Taxes", question: "Are shipping costs taxed?", answer: "In most states, yes. Shipping is considered part of the taxable order total. BidGoat calculates this automatically."},

    // Offers
    {category: "Offers", question: "How do offers work?", answer: "Buyers can send offers on eligible listings. Sellers can accept, reject, or counter. Once accepted, the buyer has 48 hours to complete payment."},
    {category: "Offers", question: "Can I negotiate offers?", answer: "Yes! Sellers can counter-offer with a new price. Buyers can accept or counter again. Once both sides agree, the offer becomes a binding order."},
    {category: "Offers", question: "What happens if a buyer doesn’t pay after an accepted offer?", answer: "If the buyer doesn’t pay within 48 hours, the order is canceled and the seller can relist the item. Repeated non-payment may result in account restrictions."},

    // Jewelry Box / Wishlist
    {category: "Wishlist", question: "What is my Wishlist?", answer: "The Collection is your personal wishlist. Save items you love, track price changes, and get notified when items are relisted or discounted."},
    {category: "Wishlist", question: "Do sellers know when I add their item to my Wishlist?", answer: "No! Sellers do not know when any of their items have been added to the WishList", },
    {category: "Wishlist", question: "Will I be notified if an item in my Wishlist is relisted?", answer: "Yes! If an item you saved is relisted or discounted, you’ll receive a notification so you never miss a deal."},

    // Selling
    { category: "Selling", question: "How do I set my shop's return policy?", answer: "Set your seller policies once and they apply to all your listings:\n\n1. Tap hamburger menu (☰)\n2. Go to 'Account Settings'\n3. Tap 'Seller Policies'\n4. Choose return policy:\n   • No Returns (Final Sale)\n   • 7-Day Returns\n   • 14-Day Returns ⭐ Recommended\n   • 30-Day Returns\n5. Set who pays return shipping\n6. Choose restocking fee (0-20%)\n7. Enable authenticity guarantee (optional)\n8. Set shipping handling time\n9. Tap 'Save Policies'\n\nYour policies appear on every listing automatically! Buyers can review them before bidding." },
    { category: "Selling", question: "Should I offer returns as a seller?", answer: "Yes! Data shows listings with returns get 40% more bids:\n\n✅ 14-Day Returns (Recommended):\n• Sweet spot for most sellers\n• Builds buyer confidence\n• Reduces disputes\n• Competitive with eBay/Etsy\n\n⚠️ No Returns (Final Sale):\n• Lower buyer trust\n• Fewer bids\n• More disputes\n• Platform baseline still applies (counterfeits, misrepresented items)\n\nNote: Even with 'No Returns', you MUST accept returns if item is counterfeit, fake, or not as described. BidGoat enforces platform protections." },
    { category: "Selling", question: "What is an authenticity guarantee?", answer: "Authenticity Guarantee is a seller badge showing you stand behind your items:\n\n✓ Displays on all your listings\n✓ Builds buyer confidence on luxury items\n✓ Reduces authenticity disputes\n✓ Free to enable in Seller Policies\n\nIf you offer authenticity guarantee but sell counterfeit items:\n• Account suspension\n• Full refund to buyer\n• Seller pays all return costs\n• Possible ban from platform\n\nOnly enable if you're 100% certain your items are authentic!" },
    { category: "Selling", question: "Can I set different policies for individual items?", answer: "Yes! You can override your default policy for specific items:\n\n🎯 How to Override:\n1. When listing an item (List Buy It Now, etc.)\n2. Scroll down to '📋 Use My Default Return Policy'\n3. Tap to expand override options\n4. Choose different policy:\n   • No Returns (Final Sale)\n   • 7-Day Returns\n   • 14-Day Returns\n   • 30-Day Returns\n5. List the item\n\n💡 Example Use Cases:\n• Set shop default to '14-Day Returns'\n• Override specific custom jewelry to 'No Returns'\n• Your other 50 listings still have 14-day returns!\n\nPerfect for custom orders, personalized items, or clearance sales." },
    { category: "Selling", question: "How long do listings last?", answer: "Duration depends on your selling strategy:\n\n🔥 Must Sell (Fast Auction):\n• 24 hours, 48 hours, or 72 hours\n• For urgent sales and quick cash\n• Creates urgency for bidders\n\n🛒 Buy It Now (Fixed Price):\n• 7 days, 14 days, or 30 days\n• Buyers purchase instantly at your price\n• Great for items with known value\n\n⚡ Create Auction (Classic Bidding):\n• 24-720 hours (1-30 days)\n• Choose presets: 24h, 48h, 7 days, 14 days, 30 days\n• Or enter custom duration\n• Longer durations = more bidder discovery\n\nWhen relisting, you get the same duration options as the original strategy!" },
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

    // Shipping
    {category: "Shipping", question: "How long do sellers have to ship?", answer: "Sellers must ship within the handling time they selected in their Seller Policies (typically 1–3 business days). If they miss the deadline, they receive an overdue shipment warning." },
    {category: "Shipping", question: "How do I track my order?", answer: "Once the seller ships your item, tracking updates appear automatically in your order page under 'My Purchases & Rewards'. You’ll also receive notifications for each tracking update."},
    {category: "Shipping", question: "What happens if my package is lost?", answer: "If tracking shows no movement for several days or the carrier marks it lost, open a dispute. Buyer Protection covers lost packages and you will receive a refund."},
    {category: "Shipping", question: "Do sellers need to provide tracking?", answer: "Yes. All shipments must include valid tracking. Orders without tracking are automatically eligible for Buyer Protection claims."},

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
    { category: "Account", question: "What is BidGoat Premium?", answer: "Premium sellers pay $19.99/month or $199/year and receive:\n• Reduced commission (5% instead of 8%)\n• Priority customer support\n• Premium badge on listings\n• Access via: Menu → '⭐ Unlock Premium' or '✨ Get Premium & Save'"},
    { category: "Account", question: "How do I upgrade to Premium?", answer: "To upgrade to Premium:\n1. Tap the hamburger menu (☰) in the top navigation\n2. Find '⭐ Unlock Premium - Save 3%' at the top of the Selling section\n3. Or tap '✨ Get Premium & Save' in the Account section\n4. Review the benefits and pricing\n5. Tap 'Subscribe for $19.99/month or $199.00/yearly'\n\nYou'll start saving 3% on every sale immediately!" },
    { category: "Account", question: "How do I check my Premium status?", answer: "Premium members see 'Verified Seller Badge' at the top of the Selling section and '✨ Premium Active' in the Account section of the menu. These badges remind you of your active status and savings on every sale." },
    { category: "Account", question: "How do I become a verified seller?", answer: "Complete 5 successful sales with 93% positive feedback to unlock verified seller status. Verified sellers get a badge and appear higher in search results." },
    { category: "Account", question: "Can I delete my account?", answer: "Yes, you can delete your account in Settings > Account > Delete Account. Note: You cannot delete your account if you have active auctions, pending payments, or open disputes." },
    { category: "Account", question: "Can I shop as a Guest?", answer: "Yes! BidGoat welcomes guest browsing:\n\n✅ Guests CAN:\n• Browse items in Discover\n• View item details, photos, and descriptions\n• See current bids and prices\n• Search and filter by category\n• View seller profiles and ratings\n\n❌ Guests CANNOT:\n• Place bids on auctions\n• Buy It Now purchases\n• Add items to Jewelry Box/Wishlist\n• Make offers on items\n• View 'My Auctions' feed\n• Create listings\n• Check out or make purchases\n\n🐐 When does BidGoat ask you to register?\nWhen you tap 'Place Bid', 'Buy It Now', or try to add items to your Jewelry Box, you'll see a friendly prompt: 'Login Required - Please sign in to [action]'\n\nCreating an account is free and protects your purchases, order history, and seller reputation!" },
    { category: "Account", question: "Where can I get help with my order?", answer: "\n1. Tap the hamburger menu (☰) in the top navigation.\n2. Go to the Buying Section. \n3. Open up My Purchases & Rewards. \n4. Select your item.\n5. Tap 'Get Help'. You can report issues, request returns, upload photos, or contact support directly from your order page." },
    { category: "Account", question: "What is Import Reputation and how do I get 8% lifetime fee?", answer: "Import Reputation lets you bring your seller ratings from eBay, Etsy, Amazon, or other platforms to BidGoat and lock in an 8% lifetime fee (vs 12-15% standard)!\n\n🎁 How to Import:\n1. Tap hamburger menu (☰)\n2. Go to Account section\n3. Tap 'Import Reputation'\n4. Select your platform (eBay, Etsy, Amazon, etc.)\n5. Enter your username and stats (reviews, rating)\n6. Upload screenshot of your seller profile\n7. Submit for verification\n\n💰 Your Special Fee:\n• Standard sellers: 12-15% total\n• Imported sellers: 8% total (5% platform + 3% processing)\n• Fee locked in FOR LIFE once approved!\n\nWe'll verify your import within 24-48 hours and notify you when approved. Your existing reputation helps you sell faster on BidGoat!" },
    { category: "Account", question: "How do I enable Dark Mode?", answer: "BidGoat supports both light and dark themes!\n\nTo enable Dark Mode:\n1. Tap hamburger menu (☰)\n2. Look for the theme toggle (sun/moon icon) in the header\n3. Tap to switch between light and dark mode\n\nYour theme preference is saved automatically and applies across the entire app including:\n• All screens and modals\n• Item cards and listings\n• Photo upload previews\n• Advanced options\n• Watch appraisal form\n\nDark mode is easier on your eyes at night and saves battery on OLED screens!" },
    { category: "Account", question: "How do notifications work?", answer: "BidGoat keeps you updated on all your activity with smart notifications!\n\n🔔 To View Notifications:\n1. Tap the bell icon (🔔) in the top navigation\n2. See your notification feed\n3. Tap any notification to go directly to that item/order\n\n📱 Notification Types:\n• Outbid alerts - someone outbid you on an auction\n• Bid received - someone bid on your item\n• Item sold - your auction ended with winner\n• Order shipped - seller shipped your item\n• Delivery confirmed - buyer confirmed delivery\n• Payment received - buyer paid for your item\n• Ship reminder - time to ship an order\n• Overdue shipment - you missed shipping deadline\n• Return requested/approved/rejected\n• Order cancelled\n• New offer received\n• Offer accepted/rejected\n\n🎨 Priority Colors:\n• 🔴 Critical (red) - Overdue shipments, urgent actions\n• 🟠 High (orange) - Ship reminders, payment due\n• 🟣 Normal (purple) - General updates\n\nAll notifications are tappable and route you directly to the relevant page!" },
    { category: "Account", question: "How do I update my email or phone number?", answer: "Go to Settings → Account → Personal Info. Update your email or phone number and confirm via verification code. Keeping your info updated ensures you receive order updates and security alerts."},
    { category: "Account", question: "How do I change my password?", answer: "Go to Settings → Account → Security → Change Password. Enter your current password, then create a new one. If you forgot your password, use 'Forgot Password' on the login screen to reset it." },
    { category: "Account", question: "What happens if my Premium subscription fails to renew?",  answer: "If your payment method fails, you'll receive:\n• An email alert\n• An in-app notification\n• A 3-day grace period\n\nIf not resolved, Premium benefits pause until you update your payment method."},
    { category: "Account", question: "How do I update my payment method for Premium?", answer: "Go to Menu → Account → Premium Settings → Manage Subscription. Update your card on file through Stripe's secure billing portal."},
    { category: "Account", question: "Do I lose my Verified Seller badge if I cancel Premium?",  answer: "No. Verified Seller status is based on performance (successful sales + feedback), not Premium membership. Premium only affects your commission rate and support priority."},
    { category: "Account", question: "Why do I need to verify my identity?", answer: "Identity verification protects the marketplace from fraud and ensures secure payouts. You may be asked to verify your identity when:\n• You reach certain sales thresholds\n• You update payout information\n• Stripe requires additional verification"},
    { category: "Account", question: "How do I change my payout bank account?", answer: "Go to Menu → Account → Payout Settings. You'll be redirected to Stripe's secure portal to update your bank account. Changes take effect immediately for future payouts."},

    // Watches
    { category: "Watches", question: "How do I list my watch for sale?", answer: "BidGoat has a powerful watch appraisal and listing system!\n\n📍 To List Your Watch:\n1. Tap hamburger menu (☰)\n2. Go to Selling section\n3. Tap 'List My Watch'\n4. Enter brand and model (e.g., Rolex Daytona)\n5. Tap 'Get Appraisal'\n6. System calculates market value from multiple sources\n7. Upload up to 5 photos\n8. Choose your selling strategy:\n   • Classic Auction (7-30 days)\n   • Buy It Now (instant sale)\n   • Must Sell (24-72 hours, no reserve)\n9. Add advanced options (Reserve Price, Buy It Now)\n10. List your watch!\n\n⌚ Watch Details Supported:\n• Brand, model, model number, serial number\n• Condition (poor/fair/good/excellent)\n• Case material, band material, movement type\n• Year of manufacture, country of origin\n• Water resistance, rarity, features\n• Original packaging, diamonds, warranty\n\nThe more details you provide, the more accurate the appraisal!" },
    { category: "Watches", question: "How does watch appraisal work?", answer: "BidGoat's watch appraisal system pulls real-time pricing from multiple trusted sources:\n\n🔍 Pricing Sources:\n• Chrono24 (largest watch marketplace)\n• eBay Sold Listings (real transaction data)\n• Gray & Sons (authorized dealer)\n• Watchbox (pre-owned specialist)\n• Local watch database\n\n📊 You Get:\n• Estimated market value\n• Confidence level (high/medium/low)\n• Price range (min-max)\n• Source breakdown showing where data came from\n• Number of data points analyzed\n\n⏱️ The Process:\n1. Enter brand, model, and condition\n2. System queries multiple sources\n3. Weighted average calculated (Chrono24: 30%, eBay: 25%, etc.)\n4. Adjustments for condition, age, features, materials\n5. Final appraisal with confidence score\n\nIf one source times out (e.g., eBay), appraisal still completes using other sources!" },
    { category: "Watches", question: "What are Advanced Auction Options for watches?", answer: "When listing a watch, you can choose advanced auction options:\n\n🔒 Reserve Price:\n• Set minimum price you'll accept\n• Hidden from bidders\n• If bidding doesn't reach reserve, item doesn't sell\n• Quick-select buttons: 70%, 80%, 90%, 95% of appraisal\n\n⚡ Buy It Now Price:\n• Let buyers purchase instantly at your price\n• Auction continues but buyer can end it immediately\n• Great for impatient buyers willing to pay premium\n\n🔥 Must Sell Mode:\n• NO reserve price - highest bidder wins\n• Shorter duration: 24, 48, or 72 hours only\n• Creates urgency for bidders\n• When enabled, Reserve and Buy It Now are disabled\n\nChoose the strategy that fits your timeline and price goals!" },

    // Extra Essential Sections
    { category:  "Safety",    question: "How does BidGoat prevent scams?", answer: "BidGoat uses:\n• Identity verification\n• Fraud detection systems\n• Buyer Protection\n• Seller performance monitoring\n• Secure Stripe payments\n\nSuspicious accounts are automatically flagged and reviewed."},
    { category:  "Safety",    question: "Is my payment information secure?", answer: "Yes. All payments are processed through Stripe, a PCI-certified payment processor. BidGoat never stores your credit card information."},

    { category: "Listings", question: "Why was my listing removed?", answer: "Listings may be removed for:\n• Prohibited items (weapons, drugs, hazmat, wildlife products)\n• Counterfeit, replica, or trademark-infringing goods\n• Misleading or fraudulent descriptions\n• Inappropriate, explicit, or offensive content\n• Stock photos or watermarked images\n• Sharing contact information in listings\n• Repeated policy violations\n\nYou will receive an in-app notification and email explaining the reason. First violations result in a warning. Repeated violations may lead to account suspension." },
    { category: "Listings", question: "Can I appeal a removed listing?", answer: "Yes. If you believe your listing was removed in error, contact support@bidgoat.com with your item name, item ID, and the reason you believe the removal was incorrect. Our moderation team reviews appeals within 2 business days." },

    // Reporting & Moderation
    { category: "Reporting & Moderation", question: "How do I report a listing?", answer: "To report a suspicious or policy-violating listing:\n\n1. Open the item detail page\n2. Tap the ⋯ menu or ‘Report’ button\n3. Select the reason:\n   • Misleading or False Description\n   • Suspected Counterfeit Item\n   • Suspected Stolen Item\n   • Prohibited Item (weapons, drugs, etc.)\n   • Illegal Wildlife Product\n   • Inappropriate or Explicit Photo\n   • Offensive or Hateful Content\n   • Contains Contact Information\n   • Price Manipulation\n   • Spam or Irrelevant Content\n   • Item Not Allowed on BidGoat\n   • Wrong Category\n   • Other\n4. Add optional details (up to 500 characters)\n5. Tap ‘Submit Report’\n\nYou can only report a listing once per 24 hours. False reports may result in account penalties." },
    { category: "Reporting & Moderation", question: "What happens after I submit a report?", answer: "After you report a listing:\n\n1. Your report is logged and reviewed by BidGoat’s moderation team\n2. If 3 or more users report the same listing, it is automatically flagged for priority review\n3. If 5 or more reports accumulate, the listing is temporarily hidden from public view while under review\n4. Admins review the item and either:\n   • Approve it — item is restored and seller is notified\n   • Remove it — item is permanently deleted, seller receives a violation on their account\n\nAll reports are confidential. The seller is never told who reported them." },
    { category: "Reporting & Moderation", question: "How does BidGoat moderate content automatically?", answer: "BidGoat uses multiple automated layers to protect the marketplace:\n\n🖼️ Image Moderation (every upload):\n• AI vision analysis detects adult/explicit content, weapons, drugs, and hate symbols\n• EXIF metadata scans detect stock photos from Getty, Shutterstock, Alamy, etc.\n• Brand logo detection flags potential counterfeit items\n• Reverse-image web search matches images against known stock photo sites\n• OCR text detection catches watermarks and prohibited text in photos\n\n📝 Text Moderation (every listing):\n• Profanity and offensive language filter\n• Contact information detection (phone numbers, emails, social handles)\n• External link detection\n• Prohibited phrase scanner (275+ patterns: fraud, scam, pressure tactics)\n• AI content analysis for misleading descriptions\n\n⭐ New Seller Review:\n• The first 5 listings from every new seller are manually reviewed by admins before going live\n• This ensures marketplace quality from the start\n\n🚨 Community Reporting:\n• Users can flag listings directly\n• Auto-escalation at 3+ reports; auto-hide at 5+ reports" },
    { category: "Reporting & Moderation", question: "What are the consequences of policy violations?", answer: "BidGoat uses a graduated consequence system:\n\n1st Violation: Warning + listing removed\n2nd Violation: Temporary suspension + listing removed\n3rd+ Violations: Permanent ban consideration\n\nSevere violations (counterfeit, weapons, child safety) may result in immediate permanent ban regardless of history.\n\nAll violations are logged to your account record. Sellers with violations may have listings reviewed more closely." },
    { category: "Reporting & Moderation", question: "Can sellers see who reported them?", answer: "No. All reports are completely anonymous. Sellers are only notified that their listing was reviewed and the outcome (approved or removed). Reporter identities are never disclosed." },

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
        {/* Page Header */}
        <Animated.View style={[styles.pageHeader, {
          opacity: headerOpacity,
          transform: [{ scale: headerScale }],
          backgroundColor: colors.background,
        }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={theme === 'dark' ? '#B794F4' : '#6A0DAD'} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerMascot}>🐐</Text>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Help Center</Text>
            <Text style={[styles.headerTagline, { color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
              Got questions? The Goat's got answers.
            </Text>
          </View>
        </Animated.View>

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
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Upgrade to Premium for $19.99/month or $199.00/yearly (save 3% on every sale!)</Text>

              <Text style={[styles.textBold, { marginTop: 12, color: colors.textPrimary }]}>🚚 Buyer-Paid Shipping:</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Small (&lt;1 lb): $7.99</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Medium (1-5 lbs): $12.99</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Large (5-10 lbs): $18.99</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• Oversized (10+ lbs): $29.99</Text>

              <Text style={[styles.textBold, { marginTop: 12, color: colors.textPrimary }]}>🌟 Premium Features: 🚀 Shipping Speed:</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• +$14.99: 48-High Priority</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• +$24.99: 1 Business Day Guaranteed</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• +$4.99 Optional Shipping Insurance (🛡️ up to $500 additional coverage</Text>


              <Text style={[styles.textBold, { marginTop: 12, color: colors.textPrimary }]}>🛡️ Optional Insurance:</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• $0-$100: Free</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• $101-$500: $2.99</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• $501-$1,000: $4.99</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• $1,001-$5,000: $9.99</Text>
              <Text style={[styles.text, { color: colors.textPrimary }]}>• $5,000+: 1% of item value</Text>
            </View>
          )}
        </View>


        {/* FAQ Section */}
        <View style={styles.faqContainer}>
          <Text style={[styles.faqTitle, { color: colors.textPrimary }]}>❓ Frequently Asked Questions</Text>

          {["Bidding", "Auction Rules", "Payment & Fees", "Buyer Protection", "Disputes", "Payouts", "Authentication", "Fees & Taxes", "Offers", "Wishlist", "Selling", "Shipping", "Returns", "Account", "Watches", "Safety", "Listings", "Reporting & Moderation"].map((category) => {
            const isCatOpen = !!expandedCategories[category];
            return (
              <View key={category} style={[styles.faqCategory, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF' }]}>
                <TouchableOpacity
                  style={[styles.faqCategoryHeader, { backgroundColor: theme === 'dark' ? '#3A1C5A' : '#6A0DAD' }]}
                  onPress={() => toggleCategory(category)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.faqCategoryTitle}>{category}</Text>
                  <Ionicons
                    name={isCatOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#FFF"
                  />
                </TouchableOpacity>

                {isCatOpen && faqData
                  .filter((faq) => faq.category === category)
                  .map((faq) => {
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
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
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
            );
          })}
        </View>

        <Text style={[styles.bodyText, { color: theme === 'dark' ? '#999' : '#374151' }]}>
  Contact us at{'1-243-243-4628 or (bid-bid-goat'}
  <Text
    style={[styles.emailLink, { color: theme === 'dark' ? '#B794F4' : '#6A0DAD' }]}
    onPress={() => Linking.openURL(
  'mailto:support@bidgoat.com?subject=BidGoat Support Request&body=Hello%20BidGoat%20Team,'
)}

  >
    support@bidgoat.com
  </Text>
  .
</Text>
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
  emailLink: {
  fontSize: 16,
  fontWeight: '600',
  textDecorationLine: 'underline',
},
bodyText: {
  fontSize: 15,
  color: '#374151',
  lineHeight: 24,
  marginBottom: 12,
},

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    padding: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginRight: 36,
  },
  headerMascot: {
    fontSize: 44,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
  },
  headerTagline: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 3,
    fontStyle: 'italic',
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
  faqCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6A0DAD',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  faqCategoryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
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
