# BidGoat Mobile v2.1.2 Release Notes

**Release Date:** March 22, 2026
**Build:** Android & iOS
**Priority:** High - Critical UX & Build Fixes

---

## 🎯 Overview
This release focuses on critical layout fixes, keyboard behavior improvements, landscape mode optimizations, and Android build configuration updates. Major improvements to user experience across all screen orientations.

---

## ✨ New Features & Improvements

### 📱 Layout & Alignment Fixes
- **Home/Index Screen Layout** - Fixed center gap between item cards that caused uneven spacing
  - Changed column justification from `space-between` to `flex-start`
  - Carousel now properly aligns with `width: '100%'`
  - Item cards flow naturally with consistent 12px gaps

- **Explore Screen Layout** - Resolved split-screen column layout issue
  - Cards no longer split to extreme left and right edges
  - Proper grid alignment with consistent spacing

- **My Auctions Screen** - Fixed two-column layout split
  - Listing cards now align properly instead of pushing to screen edges
  - Consistent gap spacing between columns

- **Search Results (Elasticsearch Cards)** - Fixed alignment issue
  - Cards no longer pushed all the way to the left
  - Changed from fixed width + margins to `width: '100%'`
  - Proper horizontal spacing maintained

### ⌨️ Keyboard & Header Behavior
- **Enhanced Header Positioning** - Major keyboard interaction improvement
  - Changed from `position: 'absolute'` to `position: 'relative'`
  - Header no longer "jumps" to top of screen when keyboard opens
  - Natural scroll behavior in both portrait and landscape modes
  - Fixed duplicate search bar visual glitch
  - Search text persists correctly when typing

- **Back Button Positioning** - Fixed half-buried back button issue
  - Removed absolute positioning that caused overlap with header
  - Moved into ScrollView natural flow
  - Always visible below header in all orientations
  - Proper alignment in landscape mode

- **Overflow Handling** - Fixed visual glitches
  - Header container now uses `overflow: 'hidden'`
  - Prevents overlapping elements when keyboard appears
  - Cleaner visual presentation

### 🔄 Landscape Mode Optimizations
- **Modals in Landscape** - Fixed title/close button cutoff issues
  - **Cost Breakdown Modal:** Responsive height (60% of screen in landscape vs 500px in portrait)
  - **Shipping & Delivery Modal:** Same responsive height improvements
  - Title and close button (X) now fully visible in horizontal orientation
  - Scrollable content properly sized for available screen space

- **Footer Auto-Hide (From Previous Session)** - Enhanced landscape UX
  - Seller dashboard footer automatically hides when scrolling
  - Reappears after 1 second of no scrolling
  - Provides more vertical space for content

---

## 🐛 Bug Fixes

### Android Build Issues
- **Fixed Gradle Build Failure** - Resolved manifest merger errors
  - Removed `react-native-paypal` package (v4.1.0) causing conflicts
  - Package was installed but unused in codebase
  - PayPal functionality now uses REST API with WebView (better approach)

- **New Architecture Compatibility** - Fixed Reanimated dependency requirement
  - Re-enabled `newArchEnabled=true` in `gradle.properties`
  - Required by `react-native-reanimated` library
  - Build now succeeds with new architecture enabled

- **Stripe Plugin Configuration** - Fixed EAS build error
  - Added missing `merchantIdentifier` configuration
  - Set to `"merchant.com.dflawless.BidGoatMobile"`
  - Added `enableGooglePay: false` (can be enabled later)

### UI/UX Issues
- **Search Bar Text Persistence** - Fixed text disappearing issue
  - Confirmed search text stays visible after typing
  - No automatic clearing on navigation
  - Same search bar in portrait/landscape (not duplicate)

- **Modal Scroll Height** - Fixed content cutoff in landscape
  - Dynamic `maxHeight` based on orientation
  - Portrait: 500px (original)
  - Landscape: 60% of screen height

---

## 🔧 Technical Changes

### Configuration Updates
- **`app.json`**
  - Added Stripe plugin configuration with `merchantIdentifier`
  - `newArchEnabled: true` (already configured)

- **`android/gradle.properties`**
  - Maintained `newArchEnabled=true` for Reanimated compatibility
  - Kept all other optimizations (Hermes, edge-to-edge, etc.)

- **`package.json`**
  - Removed `react-native-paypal: ^4.1.0` (causing build failures)

### Component Changes
- **`EnhancedHeader.tsx`**
  - Changed container position from `absolute` to `relative`
  - Updated `overflow` from `visible` to `hidden`
  - Better keyboard handling and scroll behavior

- **`item/[itemId].tsx`**
  - Updated `modalScrollView` to be orientation-aware
  - Removed absolute positioning from back button
  - Back button now flows naturally in ScrollView

- **Layout Screens** (index.tsx, explore.tsx, MyAuctionScreen.tsx)
  - Changed `columnWrapper` justification to `flex-start`
  - Updated padding from `padding: 16` to `paddingHorizontal: 16`

- **`ElasticsearchResultCard.tsx`**
  - Changed card width from fixed + margin to `width: '100%'`
  - Removed `marginHorizontal: 16` causing alignment issues

- **`seller/dashboard.tsx`**
  - Added `scrollY` prop to GlobalFooter for auto-hide functionality

---

## 📊 Impact Summary

### User Experience
- ✅ **Layout:** Clean, consistent card alignment across all screens
- ✅ **Keyboard:** Natural, predictable behavior when typing
- ✅ **Landscape:** Modals fully visible with proper title/close button placement
- ✅ **Navigation:** Back button always accessible and properly positioned

### Developer Experience
- ✅ **Build:** Android builds succeed without manifest conflicts
- ✅ **Dependencies:** Clean dependency tree (removed unused react-native-paypal)
- ✅ **Architecture:** New architecture enabled for modern React Native features

### Performance
- No performance degradation
- Cleaner component hierarchy with relative positioning
- Reduced complexity in modal sizing logic

---

## 🚀 Deployment Instructions

### For Developers
1. Pull latest changes from repository
2. Run `npm install` (or `yarn install`) to update dependencies
3. Clean build: `cd android && ./gradlew clean && cd ..`
4. Build: `eas build --platform android` (or iOS)

### Testing Checklist
- [ ] Test all screens in portrait mode (layout alignment)
- [ ] Test all screens in landscape mode (header, footer, modals)
- [ ] Test keyboard behavior on search screens
- [ ] Test Cost Breakdown modal in landscape
- [ ] Test Shipping & Delivery modal in landscape
- [ ] Test back button visibility in item detail screen
- [ ] Verify Android build completes successfully

---

## 🔮 Future Improvements
- Consider adding sticky header option (user preference)
- Add animation transitions for landscape/portrait changes
- Implement keyboard-aware scroll for other form screens
- Add landscape-specific layouts for tablets

---

## 📝 Notes
- **Breaking Changes:** None
- **Migration Required:** No
- **Database Changes:** None
- **API Changes:** None

---

## 👥 Contributors
- Layout fixes and keyboard behavior improvements
- Android build configuration updates
- Landscape mode optimizations

---

## 📞 Support
For issues or questions about this release:
- Check GitHub Issues: https://github.com/dflawless/BidGoatMobile/issues
- Contact: support@bidgoat.com

---

**Full Changelog:** v2.1.1...v2.1.2
