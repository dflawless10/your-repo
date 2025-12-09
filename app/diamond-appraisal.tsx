import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Animated } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import DiamondListingCard from 'components/cards/DiamondListingCard';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';

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

function getFactor<T extends string>(map: Record<T, number>, key: string, fallback = 1.0): number {
  return (map as Record<string, number>)[key] ?? fallback;
}

export default function DiamondAppraisalScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [caratWeight, setCaratWeight] = useState('');
  const [colorGrade, setColorGrade] = useState<ColorGrade>('D');
  const [clarityGrade, setClarityGrade] = useState<ClarityGrade>('FL');
  const [shape, setShape] = useState<Shape>('Round');
  const [certified, setCertified] = useState('Yes');
  const [price, setPrice] = useState<string>('');

  useEffect(() => {
    calculateDiamondPrice();
  }, [caratWeight, colorGrade, clarityGrade, shape, certified]);

  const calculateDiamondPrice = () => {
    const weight = parseFloat(caratWeight);
    if (isNaN(weight)) {
      setPrice('');
      return;
    }

    let base =
      weight < 0.5 ? (certified === 'Yes' ? 3333 : 3000)
        : weight < 1.0 ? (certified === 'Yes' ? 6333 : 6000)
          : (certified === 'Yes' ? 9333 : 9000);

    const colorFactor = getFactor(colorFactorByGrade, colorGrade);
    const clarityFactor = getFactor(clarityFactorByGrade, clarityGrade);
    const shapeFactor = getFactor(shapeFactorByShape, shape);

    const total = weight * base * colorFactor * clarityFactor * shapeFactor;
    setPrice(total.toFixed(2));
  };

  return (
    <View style={{ flex: 1 }}>
      <EnhancedHeader scrollY={scrollY} />

      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitleText}>💎 Diamond Price Calculator</Text>
        <Text style={styles.headerSubtitle}>Calculate your diamond's market value</Text>
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
          placeholder="Carat Weight (e.g., 1.25)"
          keyboardType="decimal-pad"
          value={caratWeight}
          onChangeText={setCaratWeight}
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
          <Picker.Item label="Yes" value="Yes" />
          <Picker.Item label="No" value="No" />
        </Picker>

        <DiamondListingCard
          imageUrl="https://example.com/diamond.jpg"
          shape={shape}
          carat={caratWeight}
          color={colorGrade}
          clarity={clarityGrade}
          certified={certified}
          price={price}
        />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingTop: 200,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerTitleContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 10,
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
  priceText: { fontSize: 18, marginVertical: 10 },
});
