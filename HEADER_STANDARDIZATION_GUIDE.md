# Header Standardization Guide

## Summary

All screen headers have been analyzed and a standardized `PageHeader` component has been created at `app/components/PageHeader.tsx`.

## Standard Header Pattern

### 1. Import the Required Components

```tsx
import { useTheme } from '@/app/theme/ThemeContext';
import PageHeader from '../components/PageHeader'; // Or '@/app/components/PageHeader'
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '../components/EnhancedHeader';
```

### 2. Use Theme Hook

```tsx
export default function YourScreen() {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  // ... rest of your component
}
```

### 3. Standard Header Structure

```tsx
return (
  <View style={[styles.container, { backgroundColor: colors.background }]}>
    <EnhancedHeader scrollY={scrollY} />

    <Animated.ScrollView style={styles.content} contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 20 }}>
      {/* Use PageHeader component */}
      <PageHeader title="Your Screen Title" />

      {/* Your content here */}
    </Animated.ScrollView>

    <GlobalFooter />
  </View>
);
```

### 4. Optional: Animated Header

```tsx
const headerOpacity = useRef(new Animated.Value(0)).current;
const headerScale = useRef(new Animated.Value(1)).current;

// In your animation effect
useEffect(() => {
  setTimeout(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, 500);
}, []);

// Use with PageHeader
<PageHeader
  title="Your Title"
  animated={true}
  opacity={headerOpacity}
  scale={headerScale}
/>
```

## Standard Style Names

Use these consistent style names across all screens:

- **Container**: `container` - Main view container
- **Page Header**: `pageHeader` - Header bar with back button and title
- **Back Button**: `backButton` - Back arrow button
- **Page Title**: `pageTitle` - Main screen title text
- **Section Title**: `sectionTitle` - Section headers within content
- **Content**: `content` - Scrollable content area

## Theme Color Usage

Always use theme colors for consistency:

```tsx
// Backgrounds
backgroundColor: colors.background  // Main screen background
backgroundColor: colors.surface     // Cards, headers

// Text
color: colors.textPrimary    // Main text
color: colors.textSecondary  // Secondary text, subtitles

// Purple/Brand Color
color: isDark ? '#B794F4' : '#6A0DAD'  // Links, buttons, back arrows

// Icons
color: isDark ? '#666' : '#999'  // Chevrons, secondary icons
```

## Standard StyleSheet Structure

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  // Card styles with dynamic colors applied inline
  // Text styles with dynamic colors applied inline
});
```

## Screens Updated

### ✅ Already Standardized (with dark mode)
- `admin-on-duty.tsx` - Uses custom animated header
- `admin/moderate-content.tsx` - Uses pageHeader pattern
- `admin/reports-analytics.tsx` - Uses pageHeader pattern
- `admin/users-list.tsx` - **Updated to use PageHeader component**
- `account/settings.tsx` - Uses pageHeader pattern
- `seller/dashboard.tsx` - Uses pageHeader pattern

### ⚠️ Needs Update
- `admin/items-list.tsx` - Missing dark mode support
- Any other screens without theme support

## PageHeader Component Props

```tsx
interface PageHeaderProps {
  title: string;              // Required - The page title
  showBackButton?: boolean;   // Default: true
  onBack?: () => void;        // Custom back handler (default: router.back())
  animated?: boolean;         // Default: true
  opacity?: Animated.Value;   // For fade-in animation
  scale?: Animated.Value;     // For scale animation
  rightComponent?: ReactNode; // Optional component on the right side
}
```

## Migration Checklist

For each screen that needs standardization:

1. [ ] Import `useTheme` and add theme hooks
2. [ ] Import `PageHeader` component
3. [ ] Replace custom header with `<PageHeader title="..." />`
4. [ ] Update container styles to use `colors.background`
5. [ ] Update all text styles to use `colors.textPrimary` or `colors.textSecondary`
6. [ ] Update card backgrounds to use `colors.surface`
7. [ ] Update icon colors to adapt to dark mode
8. [ ] Test in both light and dark modes

## Example: Before & After

### Before
```tsx
<View style={styles.headerContainer}>
  <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
    <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
  </TouchableOpacity>
  <Text style={styles.headerTitle}>My Screen</Text>
</View>
```

### After
```tsx
<PageHeader title="My Screen" />
```

## Notes

- The `PageHeader` component automatically handles dark mode
- Back button color automatically adapts (purple for light, lighter purple for dark)
- Always test screens in both light and dark mode
- Animations are optional but recommended for polish
