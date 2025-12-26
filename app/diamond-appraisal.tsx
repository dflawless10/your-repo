import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Animated, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DiamondListingCard from 'components/cards/DiamondListingCard';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import { appraiseDiamond, formatPrice } from '@/api/appraisal';
import GlobalFooter from "@/app/components/GlobalFooter";

type ColorGrade = 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N';
type ClarityGrade = 'FL' | 'IF' | 'VVS1' | 'VVS2' | 'VS1' | 'VS2' | 'SI1' | 'SI2' | 'I1' | 'I2';
type Shape =
  | 'Round' | 'Pear' | 'Oval' | 'Emerald' | 'Trilliant' | 'Marquise' | 'Princess' | 'Radiant'
  | 'Cushion' | 'Baguette' | 'Heart' | 'Modified Cushion' | 'Half Moon'
  | 'Trapezoid/Cadillac' | 'Shield' | 'Cut Cornered Princess' | 'Asscher';

const colorFactorByGrade: Record<ColorGrade, number> = {
  D: 1.05, E: 1.03, F: 1.00, G: 0.97, H: 0.95, I: 0.93, J: 0.90, K: 0.88, L: 0.85, M: 0.82, N: 0.80,
};

const clarityFactorByGrade: Record<ClarityGrade, number> = {
  FL: 1.05, IF: 1.02, VVS1: 1.00, VVS2: 0.98, VS1: 0.95, VS2: 0.92,
  SI1: 0.88, SI2: 0.84, I1: 0.80, I2: 0.75,
};

const shapeFactorByShape: Record<Shape, number> = {
  Round: 1.00, Pear: 0.95, Oval: 0.95, Emerald: 0.95, Trilliant: 0.90, Marquise: 0.90,
  Princess: 0.90, Radiant: 0.85, Cushion: 0.85, Baguette: 0.85, Heart: 0.80,
  'Modified Cushion': 0.80, 'Half Moon': 0.80, 'Trapezoid/Cadillac': 0.75,
  Shield: 0.75, 'Cut Cornered Princess': 0.75, Asscher: 0.75,
};

export default function DiamondAppraisalScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [caratWeight, setCaratWeight] = useState('');
  const [colorGrade, setColorGrade] = useState<ColorGrade>('F');
  const [clarityGrade, setClarityGrade] = useState<ClarityGrade>('VS1');
  const [shape, setShape] = useState<Shape>('Round');
  const [certified, setCertified] = useState('Yes');
  const [certificationLab, setCertificationLab] = useState('GIA');
  const [certificationNumber, setCertificationNumber] = useState('');
  const [ethicallySourced, setEthicallySourced] = useState('Yes');
  const [rarity, setRarity] = useState('rare');
  const [price, setPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Debounce timer to avoid excessive API calls
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer to call API after 500ms of no changes
    debounceTimer.current = setTimeout(() => {
      calculateDiamondPrice();
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [caratWeight, colorGrade, clarityGrade, shape, certified]);

  const handleCaratWeightChange = (text: string) => {
    // Allow only numbers and one decimal point
    const filtered = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = filtered.split('.');
    if (parts.length > 2) {
      return; // Don't allow multiple decimal points
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    // Parse the value
    const numValue = parseFloat(filtered);
    
    // If there's a valid number, check the range
    if (!isNaN(numValue)) {
      if (numValue > 10) {
        Alert.alert('Invalid Carat Weight', 'Carat weight must be between 0.1 and 10.00');
        return;
      }
    }
    
    // Update the state
    setCaratWeight(filtered);
  };

  const calculateDiamondPrice = async () => {
    const weight = parseFloat(caratWeight);
    if (isNaN(weight) || weight < 0.1 || weight > 10) {
      setPrice('');
      if (weight < 0.1 && caratWeight !== '') {
        Alert.alert('Invalid Carat Weight', 'Carat weight must be at least 0.1');
      }
      return;
    }

    setLoading(true);

    try {
      const result = await appraiseDiamond({
        carat: weight,
        color: colorGrade,
        clarity: clarityGrade,
        shape: shape,
        certified: certified,
      });

      if (result) {
        setPrice(result.suggested_price.toFixed(2));
      } else {
        Alert.alert('Error', 'Failed to calculate diamond price. Please try again.');
        setPrice('');
      }
    } catch (error) {
      console.error('Diamond appraisal error:', error);
      Alert.alert('Error', 'An error occurred while calculating the price.');
      setPrice('');
    } finally {
      setLoading(false);

    }
  };

  return (
    <View style={{ flex: 1 }}>
      <EnhancedHeader scrollY={scrollY} />

      <View style={styles.headerTitleContainer}>
        <View style={styles.titleWithArrow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
            <Ionicons name="arrow-back" size={24} color="#6A0DAD" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitleText}>Diamond Price Calculator</Text>
            <Text style={styles.headerSubtitle}>Calculate your diamond&#39;s market value</Text>
          </View>
        </View>
      </View>

      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.input}
          placeholder="Carat Weight (0.1 - 10.00)"
          keyboardType="decimal-pad"
          value={caratWeight}
          onChangeText={handleCaratWeightChange}
        />
        <Text style={styles.label}>Color Grade</Text>
        <Picker selectedValue={colorGrade} onValueChange={(v) => setColorGrade(v as ColorGrade)}>
          {Object.keys(colorFactorByGrade).map((grade) => (
            <Picker.Item key={grade} label={grade} value={grade} />
          ))}
        </Picker>

        <Text style={styles.label}>Clarity Grade</Text>
        <Picker selectedValue={clarityGrade} onValueChange={(v) => setClarityGrade(v as ClarityGrade)}>
          {Object.keys(clarityFactorByGrade).map((grade) => (
            <Picker.Item key={grade} label={grade} value={grade} />
          ))}
        </Picker>

        <Text style={styles.label}>Shape</Text>
        <Picker selectedValue={shape} onValueChange={(v) => setShape(v as Shape)}>
          {Object.keys(shapeFactorByShape).map((s) => (
            <Picker.Item key={s} label={s} value={s} />
          ))}
        </Picker>

        <Text style={styles.label}>Certified</Text>
        <Picker selectedValue={certified} onValueChange={(v) => setCertified(v)}>
          <Picker.Item label="Yes - GIA/IGI Certified" value="Yes" />
          <Picker.Item label="No - Not Certified" value="No" />
        </Picker>

        {certified === 'Yes' && (
          <>
            <Text style={[styles.label, { color: '#6A0DAD', fontSize: 16, marginTop: 16 }]}>
              📜 Certification Lab *
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={certificationLab}
                onValueChange={(v) => setCertificationLab(v)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Select Lab..." value="" style={styles.pickerItem} />
                <Picker.Item label="GIA - Gemological Institute of America" value="GIA" style={styles.pickerItem} />
                <Picker.Item label="IGI - International Gemological Institute" value="IGI" style={styles.pickerItem} />
                <Picker.Item label="AGS - American Gem Society" value="AGS" style={styles.pickerItem} />
                <Picker.Item label="EGL - European Gemological Laboratories" value="EGL" style={styles.pickerItem} />
                <Picker.Item label="HRD - Hoge Raad Voor Diamant" value="HRD" style={styles.pickerItem} />
                <Picker.Item label="GCAL - Gem Certification & Assurance Lab" value="GCAL" style={styles.pickerItem} />
                <Picker.Item label="GSI - Gemological Science International" value="GSI" style={styles.pickerItem} />
                <Picker.Item label="DGLA - Diamond & Gem Laboratories" value="DGLA" style={styles.pickerItem} />
                <Picker.Item label="PGGL - Precision Gem Grading Laboratory" value="PGGL" style={styles.pickerItem} />
                <Picker.Item label="Other" value="Other" style={styles.pickerItem} />
              </Picker>
            </View>

            <Text style={[styles.label, { color: '#6A0DAD', fontSize: 16, marginTop: 16 }]}>
              🔢 Certification Number (Optional)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2141438171"
              value={certificationNumber}
              onChangeText={setCertificationNumber}
            />
            <Text style={styles.helpText}>
              💡 Buyers can verify this certificate number on the lab&#39;s official website
            </Text>
          </>
        )}

        <Text style={styles.label}>Ethically Sourced</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={ethicallySourced}
            onValueChange={(v) => setEthicallySourced(v)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Yes - Conflict-Free Diamond" value="Yes" style={styles.pickerItem} />
            <Picker.Item label="No / Unknown" value="No" style={styles.pickerItem} />
          </Picker>
        </View>

        <Text style={styles.label}>Rarity</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={rarity}
            onValueChange={(v) => setRarity(v)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Common" value="common" style={styles.pickerItem} />
            <Picker.Item label="Rare" value="rare" style={styles.pickerItem} />
            <Picker.Item label="Very Rare" value="very_rare" style={styles.pickerItem} />
            <Picker.Item label="Extremely Rare" value="extremely_rare" style={styles.pickerItem} />
            <Picker.Item label="Collectible" value="collectible" style={styles.pickerItem} />
          </Picker>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6A0DAD" />
            <Text style={styles.loadingText}>Calculating diamond value...</Text>
          </View>
        )}

        <DiamondListingCard
          imageUrl="https://example.com/diamond.jpg"
          shape={shape}
          carat={caratWeight}
          color={colorGrade}
          clarity={clarityGrade}
          certified={certified}
          certificationLab={certificationLab}
          certificationNumber={certificationNumber}
          ethicallySourced={ethicallySourced}
          rarity={rarity}
          price={price}
        />

        {price && !loading && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Estimated Market Value</Text>
            <Text style={styles.priceValue}>{formatPrice(parseFloat(price))}</Text>
            <Text style={styles.priceNote}>
              💎 Suggested price based on our algorithm and current market prices
            </Text>
            <Text style={styles.priceDisclaimer}>
              Pricing factors: Rapaport benchmarks, carat weight, color grade, clarity grade, shape, and certification status
            </Text>
          </View>
        )}
      </Animated.ScrollView>
       <GlobalFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingTop: 260,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerTitleContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT + 48,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 100,
  },
  titleWithArrow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    marginRight: 12,
    padding: 4,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  label: { marginTop: 10, fontWeight: 'bold' },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 56,
    marginBottom: 12,
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 56,
    width: '100%',
    fontSize: 16,
    color: '#1A1A1A',
  },
  pickerItem: {
    fontSize: 16,
    color: '#1A1A1A',
    height: Platform.OS === 'ios' ? 180 : 56,
  },
  helpText: {
    fontSize: 12,
    color: '#6A0DAD',
    marginTop: -8,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  priceText: { fontSize: 18, marginVertical: 10 },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6A0DAD',
    fontWeight: '600',
  },
  priceContainer: {
    backgroundColor: '#f0f4ff',
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#6A0DAD',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6A0DAD',
    marginBottom: 8,
  },
  priceNote: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  priceDisclaimer: {
    fontSize: 11,
    color: '#A0AEC0',
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
    paddingHorizontal: 8,
  },
});
