import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Animated } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import DiamondListingCard from '../cards/DiamondListingCard';
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
  const [certificationLab, setCertificationLab] = useState('GIA');
  const [certificationNumber, setCertificationNumber] = useState('');
  const [ethicallySourced, setEthicallySourced] = useState('Yes');
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

    let base: number;

    if (weight < 0.5) {
      base = certified === 'Yes' ? 3333 : 3000;
    } else if (weight < 1.0) {
      base = certified === 'Yes' ? 6333 : 6000;
    } else {
      base = certified === 'Yes' ? 9333 : 9000;
    }

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
        <Picker
          selectedValue={colorGrade}
          onValueChange={(v) => setColorGrade(v as ColorGrade)}
          style={styles.picker}
        >
          {Object.keys(colorFactorByGrade).map((grade) => (
            <Picker.Item key={grade} label={grade} value={grade} />
          ))}
        </Picker>

        <Text style={styles.label}>Clarity Grade</Text>
        <Picker
          selectedValue={clarityGrade}
          onValueChange={(v) => setClarityGrade(v as ClarityGrade)}
          style={styles.picker}
        >
          {Object.keys(clarityFactorByGrade).map((grade) => (
            <Picker.Item key={grade} label={grade} value={grade} />
          ))}
        </Picker>

        <Text style={styles.label}>Shape</Text>
        <Picker
          selectedValue={shape}
          onValueChange={(v) => setShape(v as Shape)}
          style={styles.picker}
        >
          {Object.keys(shapeFactorByShape).map((s) => (
            <Picker.Item key={s} label={s} value={s} />
          ))}
        </Picker>

        <Text style={styles.label}>Certified</Text>
        <Picker
          selectedValue={certified}
          onValueChange={(v) => {
            console.log('🐐 Certification changed to:', v);
            setCertified(v);
          }}
          style={styles.picker}
        >
          <Picker.Item label="Yes - GIA/IGI Certified" value="Yes" />
          <Picker.Item label="No - Not Certified" value="No" />
        </Picker>

        {certified === 'Yes' ? (
          <>
            <Text style={[styles.label, { color: '#6A0DAD', fontSize: 16 }]}>
              📜 Certification Lab *
            </Text>
            <Picker
              selectedValue={certificationLab}
              onValueChange={(v) => {
                console.log('🐐 Cert Lab changed to:', v);
                setCertificationLab(v);
              }}
              style={styles.picker}
            >
              <Picker.Item label="Select Lab..." value="" />
              <Picker.Item label="GIA - Gemological Institute of America" value="GIA" />
              <Picker.Item label="IGI - International Gemological Institute" value="IGI" />
              <Picker.Item label="AGS - American Gem Society" value="AGS" />
              <Picker.Item label="EGL - European Gemological Laboratories" value="EGL" />
              <Picker.Item label="HRD - Hoge Raad Voor Diamant" value="HRD" />
              <Picker.Item label="GCAL - Gem Certification & Assurance Lab" value="GCAL" />
              <Picker.Item label="GSI - Gemological Science International" value="GSI" />
              <Picker.Item label="DGLA - Diamond & Gem Laboratories" value="DGLA" />
              <Picker.Item label="PGGL - Precision Gem Grading Laboratory" value="PGGL" />
              <Picker.Item label="Other" value="Other" />
            </Picker>

            <Text style={[styles.label, { color: '#6A0DAD', fontSize: 16 }]}>
              🔢 Certification Number (Optional)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2141438171"
              value={certificationNumber}
              onChangeText={(text) => {
                console.log('🐐 Cert Number changed to:', text);
                setCertificationNumber(text);
              }}
            />
            <Text style={styles.helpText}>
              💡 Buyers can verify this certificate number on the lab's official website
            </Text>
          </>
        ) : (
          <Text style={[styles.helpText, { color: '#999' }]}>
            Select "Yes - GIA/IGI Certified" above to add certification details
          </Text>
        )}

        <Text style={styles.label}>Ethically Sourced</Text>
        <Picker
          selectedValue={ethicallySourced}
          onValueChange={(v) => setEthicallySourced(v)}
          style={styles.picker}
        >
          <Picker.Item label="Yes - Conflict-Free Diamond" value="Yes" />
          <Picker.Item label="No / Unknown" value="No" />
        </Picker>

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
    paddingTop: 140,
    padding: 20,
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
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: 'white',
    height: 50,
  },
  helpText: {
    fontSize: 12,
    color: '#6A0DAD',
    marginTop: -8,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  priceText: { fontSize: 18, marginVertical: 10 },
});
