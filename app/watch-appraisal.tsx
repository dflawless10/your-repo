import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import WatchListingCard from '@/components/WatchListingCard';
import AutocompleteInput from '@/components/AutocompleteInput';
import { Picker } from "@react-native-picker/picker";
import CheckBox, {Checkbox} from 'expo-checkbox';
import useColorScheme from 'hooks/useColorScheme';
import watchPricesData from '@/assets/data/watchPrices.json';
import watchBrandsData from '@/assets/data/watchBrands.json';
import { API_URL } from '@/constants/api';
import { validateContentQuick } from 'app/utils/contentModeration';

type Country = 'switzerland' | 'germany' | 'japan' | 'usa' | 'france' | 'italy';
type Warranty = 'none' | '1year' | '2years' | '3years' | '5years';
type ClaspType = 'deployable' | 'folding' | 'velcro';
type WatchSize = '20mm' | '28-34' | '35-38' | '39-42' | '43-46' | '47+';
type CaseShape = 'round' | 'square' | 'rectangle' | 'cushion' | 'tonneau' | 'oval';
type BezelMaterial = '' | 'ceramic' | 'stainlessSteel' | 'gold' | 'platinum' | 'aluminum' | 'titanium';
type DialHourMarkers = '' | 'arabic' | 'roman' | 'baton' | 'diamond' | 'mixed' | 'none';
type DialType = '' | 'analog' | 'digital' | 'analogDigital';
type Gender = '' | 'mens' | 'womens' | 'unisex';





type WatchBrandGroup = {
  label: string;
  options: string[];
buyItNowPrice: string;
};


type Condition = 'poor' | 'fair' | 'good' | 'excellent';
type CaseMaterial = '' | '23ktGold' | '22ktGold' | '18ktGold' | '14ktGold' | '10ktGold' | 'whiteGold' | 'yellowGold' | 'roseGold' | 'platinum' | 'silver' | 'titanium' | 'plastic';
type BandMaterial = '' | 'gold' | 'platinum' | 'metal' | 'rubber' | 'silver' | 'fabric' | 'leather';
type MovementType = '' | 'automatic' | 'winder' | 'battery' | 'solar' | 'tourbillon';
type Rarity = '' | 'common' | 'uncommon' | 'rare' | 'veryRare' | 'extremelyRare';
type WaterResistance = '' | 'none' | 'splashProof' | 'waterResistant' | 'diver';

export function useAutocompleteField<T extends string>(initialOptions: { label: string; value: T }[], initialValue: T) {
  const [options, setOptions] = useState(initialOptions);
  const [value, setValue] = useState<T>(initialValue);

   const addCustomOption = async (field: string, newValue: T, label: string) => {
    const newOption = { label, value: newValue };
    setOptions(prev => [...prev, newOption]);
    setValue(newValue); // auto-select new option

    try {
      await fetch(`${API_URL}/api/watch-options/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value: newValue, label })
      });
    } catch (error) {
      console.error(`Error adding custom option for ${field}:`, error);
    }
  };

  return { options, value, setValue, addCustomOption };
}


export default function WatchAppraisalScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

   const scheme = useColorScheme();   // ✅ always called
  const styles = themedStyles(scheme);


  // State
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<string[]>([]);
  const [filteredModels, setFilteredModels] = useState<string[]>([]);
  const [selectedBrandIndex, setSelectedBrandIndex] = useState(0);
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  const [brandName, setBrandName] = useState('');
  const [modelName, setModelName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [condition, setCondition] = useState<Condition>('good');
  const [isNew, setIsNew] = useState(true);
  const [caseMaterial, setCaseMaterial] = useState<CaseMaterial>('');
  const [bandMaterial, setBandMaterial] = useState<BandMaterial>('');
  const [movementType, setMovementType] = useState<MovementType>('');
  const [rarity, setRarity] = useState<Rarity>('');
  const [waterResistance, setWaterResistance] = useState<WaterResistance>('');
  const [hasOriginalPackaging, setHasOriginalPackaging] = useState(false);
  const [hasDiamonds, setHasDiamonds] = useState(false);
  const [yearOfManufacture, setYearOfManufacture] = useState('');
  const [price, setPrice] = useState<string>('');
  const [countryOfOrigin, setCountryOfOrigin] = useState<Country | ''>('');
  const [warranty, setWarranty] = useState<Warranty | ''>('');
  const [claspType, setClaspType] = useState<ClaspType | ''>('');
  const [watchSize, setWatchSize] = useState<WatchSize | ''>('');
  const [skeletalBack, setSkeletalBack] = useState(false);
  const [flipSkeletalBack, setFlipSkeletalBack] = useState(false);
  const [fullSkeletalWatch, setFullSkeletalWatch] = useState(false);
  const [buyItNowPrice, setBuyItNowPrice] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [priceHistory, setPriceHistory] = useState<{year: string, price: number}[]>([]);
  const [priceSource, setPriceSource] = useState('');
// Country
  const countryField = useAutocompleteField<Country>(
  [
    { label: 'Select country of origin', value: '' as Country },
    { label: 'Switzerland', value: 'switzerland' as Country },
    { label: 'Germany', value: 'germany' as Country },
    { label: 'Japan', value: 'japan' as Country },
    { label: 'USA', value: 'usa' as Country },
    { label: 'France', value: 'france' as Country },
    { label: 'Italy', value: 'italy' as Country },
  ],
  '' as Country
);

  // Warranty field using the shared hook
const warrantyField = useAutocompleteField<Warranty>(
  [
    { label: 'Select warranty', value: '' as Warranty },
    { label: 'None', value: 'none' as Warranty },
    { label: '1 Year', value: '1year' as Warranty },
    { label: '2 Years', value: '2years' as Warranty },
    { label: '3 Years', value: '3years' as Warranty },
    { label: '5 Years', value: '5years' as Warranty },
  ],
  '' as Warranty
);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // New state variables for comprehensive watch specifications
  const [bandSize, setBandSize] = useState('');
  const [bandLength, setBandLength] = useState('');
  const [bandLink, setBandLink] = useState('');
  const [bandStyle, setBandStyle] = useState('');
  const [bandSizeInches, setBandSizeInches] = useState('');
  const [lugWidth, setLugWidth] = useState('');
  const [buckleWidth, setBuckleWidth] = useState('');
  const [lugToLugLength, setLugToLugLength] = useState('');
  const [caseShape, setCaseShape] = useState<CaseShape | ''>('');
  const [caseThickness, setCaseThickness] = useState('');
  const [bezelType, setBezelType] = useState('');
  const [bezelStyle, setBezelStyle] = useState('');
  const [bezelWeight, setBezelWeight] = useState('');
  const [bezelMaterial, setBezelMaterial] = useState<BezelMaterial>('');
  const [aftermarketBezel, setAftermarketBezel] = useState(false);
  const [originalBezel, setOriginalBezel] = useState(false);
  const [dialStyle, setDialStyle] = useState('');
  const [dialColor, setDialColor] = useState('');
  const [dialMaterial, setDialMaterial] = useState('');
  const [dialHourMarkers, setDialHourMarkers] = useState<DialHourMarkers>('');
  const [dialType, setDialType] = useState<DialType>('');
  const [aftermarketDial, setAftermarketDial] = useState(false);
  const [originalDial, setOriginalDial] = useState(false);
  const [gender, setGender] = useState<Gender>('');




  // Fetch brands on mount
  useEffect(() => {
    fetchBrands();
  }, []);

  // Fetch models when brand changes
  useEffect(() => {
    if (brandName) {
      fetchModels(brandName);
    }
  }, [brandName]);

  const fetchBrands = async () => {
    try {
      // First try backend API
      const response = await fetch(`${API_URL}/api/brands`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      // Fallback to local JSON
      console.log('📦 Using local brand data');
      const localBrands = Object.keys(watchBrandsData).sort();
      setBrands(localBrands);
    }
  };

  const fetchModels = async (brand: string) => {
    try {
      // First try backend API
      const response = await fetch(`${API_URL}/api/models?brand=${encodeURIComponent(brand)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setModels(data);
      setFilteredModels(data);
      setSelectedModelIndex(0);
    } catch (error) {
      // Fallback to local JSON
      console.log('📦 Using local model data for', brand);
      const localModels = (watchBrandsData as any)[brand] || [];
      setModels(localModels);
      setFilteredModels(localModels);
      setSelectedModelIndex(0);
    }
  };

  const handleBrandChange = (text: string) => {
    setBrandName(text);
    const filtered = brands.filter((b: string) =>
      b.toLowerCase().startsWith(text.toLowerCase())
    );
    setFilteredBrands(filtered);
    setSelectedBrandIndex(0);
  };

  const handleModelChange = (text: string) => {
    setModelName(text);
    const filtered = models.filter((m: string) =>
      m.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredModels(filtered);
    setSelectedModelIndex(0);
  };

  const handleAppraiseAndList = async () => {
    // Content Moderation with error handling
    try {
      const brandModeration = validateContentQuick(brandName, 'Brand name');
      if (!brandModeration.isValid) {
        alert(brandModeration.errorMessage!);
        return;
      }

      const modelModeration = validateContentQuick(modelName, 'Model name');
      if (!modelModeration.isValid) {
        alert(modelModeration.errorMessage!);
        return;
      }
    } catch (error) {
      console.error('Content moderation error:', error);
      // Continue with appraisal if moderation fails
    }

    // Step 1: Try local JSON pricing first
    const brandKey = brandName.toLowerCase().replace(/\s+/g, '');
    const modelKey = modelName.toLowerCase().replace(/\s+/g, '');

    let estimatedPrice: number | null = null;
    let priceSource = '';

    // Check if brand and model exist in JSON
    const brandData = (watchPricesData as any)[brandKey];
    const modelData = brandData?.[modelKey];

    if (modelData) {
      console.log('📊 Found watch in pricing database');

      // Priority 1: Specific model number price
      if (modelNumber && modelData.modelNumbers?.[modelNumber]) {
        estimatedPrice = modelData.modelNumbers[modelNumber];
        priceSource = `Model ${modelNumber} base price`;
      }
      // Priority 2: Year-specific price
      else if (yearOfManufacture && modelData.yearPrices?.[yearOfManufacture]) {
        estimatedPrice = modelData.yearPrices[yearOfManufacture];
        priceSource = `${yearOfManufacture} market price`;
      }
      // Priority 3: Base price
      else {
        estimatedPrice = modelData.basePrice;
        priceSource = 'Base model price';
      }

      // Ensure we have a valid price before proceeding
      if (!estimatedPrice || estimatedPrice === 0) {
        alert('⚠️ Could not determine base price for this watch.');
        return;
      }

      // Now TypeScript knows estimatedPrice is a valid number
      let finalPrice: number = estimatedPrice;

      // Step 2: Apply condition multipliers (brand-aware + age-aware)
      const brandKey = brandName.toLowerCase();
      const isPremiumBrand = ['rolex', 'patekphilippe', 'audemarspiguet', 'vacheronconstantin'].includes(brandKey.replace(/\s+/g, ''));
      const watchAge = yearOfManufacture ? new Date().getFullYear() - parseInt(yearOfManufacture) : 0;

      // Base condition multipliers - IMPROVED for accuracy
      let conditionMultiplier = 1.0;

      if (condition === 'poor') {
        // Poor: Heavy wear, servicing needed, scratches/dents
        conditionMultiplier = isPremiumBrand ? 0.65 : 0.50;  // Premium brands hold value better
      } else if (condition === 'fair') {
        // Fair: Visible wear, may need minor servicing
        conditionMultiplier = isPremiumBrand ? 0.80 : 0.70;
      } else if (condition === 'good') {
        // Good: Some wear, fully functional
        conditionMultiplier = isPremiumBrand ? 0.92 : 0.85;
      } else if (condition === 'excellent') {
        // Excellent: Minimal wear, like new - should be near full value
        conditionMultiplier = isPremiumBrand ? 1.00 : 0.98;  // ✅ Fixed: no penalty for excellent condition
      }

      // Age depreciation (only for non-vintage, < 25 years) - REDUCED depreciation rates
      if (watchAge > 0 && watchAge < 25 && !isNew) {
        // Depreciation curve: 0-5 years = moderate, 5-15 years = slow, 15-25 years = minimal
        if (watchAge <= 5) {
          conditionMultiplier *= (1 - (watchAge * 0.02));  // ✅ Reduced from 3% to 2% per year
        } else if (watchAge <= 15) {
          conditionMultiplier *= (1 - (5 * 0.02)) * (1 - ((watchAge - 5) * 0.015));  // ✅ Reduced from 2% to 1.5%
        } else {
          conditionMultiplier *= (1 - (5 * 0.02)) * (1 - (10 * 0.015)) * (1 - ((watchAge - 15) * 0.005));  // ✅ Reduced from 1% to 0.5%
        }
      }

      // Vintage appreciation (25+ years for premium brands)
      if (watchAge >= 25 && isPremiumBrand) {
        conditionMultiplier *= 1.15;  // ✅ Increased from 10% to 15% vintage premium
      }

      finalPrice *= conditionMultiplier;

      // Step 3: Material adjustments - INCREASED multipliers for precious metals
      if (caseMaterial.includes('platinum')) {
        finalPrice *= 1.50;  // ✅ Increased from 1.35 to 1.50
      } else if (caseMaterial.includes('23kt') || caseMaterial.includes('22kt')) {
        finalPrice *= 1.40;  // ✅ Increased from 1.30 to 1.40
      } else if (caseMaterial.includes('18kt') || caseMaterial === 'yellowGold' || caseMaterial === 'roseGold') {
        finalPrice *= 1.35;  // ✅ Increased from 1.25 to 1.35
      } else if (caseMaterial.includes('14kt') || caseMaterial.includes('10kt')) {
        finalPrice *= 1.20;  // ✅ Increased from 1.15 to 1.20
      }

      // Step 4: New vs. Used adjustment - REMOVED harsh penalty
      // ✅ FIXED: Removed blanket 0.75x penalty - condition + age already handle this

      // Step 5: Additional features
      if (hasOriginalPackaging) finalPrice *= 1.10;
      if (hasDiamonds) finalPrice *= 1.20;
      if (movementType === 'tourbillon') finalPrice *= 1.50;

      // Step 6: Watch Detail Bonuses (Bezel, Dial, Band) - NEW!

      // Bezel Material Bonuses (10-25% increase for premium materials)
      const bezelMat = bezelMaterial?.toLowerCase() || '';
      if (bezelMat.includes('ceramic')) {
        finalPrice *= 1.15;
      } else if (bezelMat.includes('platinum')) {
        finalPrice *= 1.25;
      } else if (bezelMat.includes('gold')) {
        finalPrice *= 1.20;
      }

      // Bezel Weight (diamond/gemstone bezels) - $2000-3000 per carat
      if (bezelWeight) {
        try {
          const carats = parseFloat(bezelWeight);
          if (carats > 0) {
            finalPrice += carats * 2500; // $2500 per carat average
          }
        } catch (e) {
          // Skip invalid bezel weight
        }
      }

      // Dial Material Bonuses (10-20% increase for exotic materials)
      const dialMat = dialMaterial?.toLowerCase() || '';
      if (dialMat.includes('mother of pearl')) {
        finalPrice *= 1.10;
      } else if (dialMat.includes('enamel')) {
        finalPrice *= 1.15;
      } else if (dialMat.includes('meteorite')) {
        finalPrice *= 1.20;
      } else if (dialMat.includes('diamond')) {
        finalPrice *= 1.25;
      } else if (dialMat.includes('ceramic')) {
        finalPrice *= 1.12;
      }

      // Band Link Type Bonuses (President, Jubilee, Oyster)
      const bandLnk = bandLink?.toLowerCase() || '';
      if (bandLnk.includes('president')) {
        finalPrice *= 1.15; // President bracelet premium
      } else if (bandLnk.includes('jubilee')) {
        finalPrice *= 1.08;
      } else if (bandLnk.includes('oyster')) {
        finalPrice *= 1.05;
      }

      // Case Shape Bonuses (unique shapes command premium)
      const caseShp = caseShape?.toLowerCase() || '';
      if (caseShp.includes('tonneau') || caseShp.includes('cushion')) {
        finalPrice *= 1.08;
      } else if (caseShp.includes('rectangular') || caseShp.includes('square')) {
        finalPrice *= 1.05;
      }

      // Original vs Aftermarket (authenticity matters)
      if (originalBezel && originalDial) {
        finalPrice *= 1.10; // +10% for all-original parts
      } else if (aftermarketBezel || aftermarketDial) {
        finalPrice *= 0.85; // -15% penalty for aftermarket parts
      }

      // Step 7: Rarity adjustments
      const rarityMultipliers = {
        '': 1.0,
        'common': 1.0,
        'uncommon': 1.15,
        'rare': 1.30,
        'veryRare': 1.50,
        'extremelyRare': 2.00
      };
      finalPrice *= rarityMultipliers[rarity];

      // Step 8: Country of origin premium
      if (countryOfOrigin === 'switzerland') finalPrice *= 1.10;

      setPrice(Math.round(finalPrice).toString());
      setPriceSource(priceSource);

      // Step 9: Extract price history from JSON
      if (modelData.yearPrices) {
        const history = Object.entries(modelData.yearPrices)
          .map(([year, price]) => ({ year, price: price as number }))
          .sort((a, b) => parseInt(a.year) - parseInt(b.year));
        setPriceHistory(history);
      }

      alert(`💰 Watch appraised at $${Math.round(finalPrice).toLocaleString()}\n\n📍 Source: ${priceSource}\n🔧 Condition: ${condition}\n${isNew ? '✨ New' : '📦 Pre-owned'}`);

      console.log(`✅ Appraisal complete: $${Math.round(finalPrice)}`);
      return;
    }

    // Step 8: Fallback to backend API if no JSON match
    console.log('🌐 No local pricing found, using backend API');

    const payload = {
      countryOfOrigin,
      warranty: warrantyField.value,
      brand: brandName,
      model: modelName,
      modelNumber,
      condition,
      isNew,
      caseMaterial,
      bandMaterial,
      movementType,
      rarity,
      waterResistance,
      hasOriginalPackaging,
      hasDiamonds,
      yearOfManufacture,
    };

    try {
      const valueRes = await fetch(`${API_URL}/api/appraise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!valueRes.ok) {
        throw new Error(`HTTP error! status: ${valueRes.status}`);
      }

      const valueResult = await valueRes.json();

      if (valueResult.success) {
        setPrice(valueResult.estimatedValue.toString());
        alert(`Watch appraised at $${valueResult.estimatedValue}`);
      } else {
        alert('⚠️ Could not find pricing data for this watch.\n\nTry entering brand/model exactly as shown (e.g., "Rolex" / "Daytona")');
      }
    } catch (error) {
      console.error('Error appraising watch:', error);
      alert('⚠️ Could not find pricing data for this watch.\n\nPlease check brand and model spelling.');
    }
  };


const toggleFeature = (feature: string) => {
  setSelectedFeatures((prev) =>
    prev.includes(feature)
      ? prev.filter((f) => f !== feature)
      : [...prev, feature]
  );
};
  return (
    <View style={{ flex: 1 }}>
      <EnhancedHeader scrollY={scrollY} />

      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitleText}>⌚ Watch Price Calculator</Text>
        <Text style={styles.headerSubtitle}>Calculate your watch's market value</Text>
      </View>

      <Animated.ScrollView
        style={[styles.container, { backgroundColor: '#fff' }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <AutocompleteInput
  label="Country of Origin"
  value={countryField.value}
  onValueChange={(v: string) => countryField.setValue(v as Country)} // ✅ cast string to Country
  options={countryField.options}
  allowCustom={true}
  onAddCustom={(value, label) =>
    countryField.addCustomOption('country', value as Country, label)
  }
/>


        <AutocompleteInput
  label="Warranty"
  value={warrantyField.value}
  onValueChange={(v: string) => warrantyField.setValue(v as Warranty)} // ✅ cast
  options={warrantyField.options}
  allowCustom={true}
  onAddCustom={(value, label) =>
    warrantyField.addCustomOption('warranty', value as Warranty, label)
  }
/>


        {/* Brand Name */}
        <Text style={styles.label}>Brand Name</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="e.g., Rolex"
            value={brandName}
            onChangeText={handleBrandChange}
          />
          <View style={styles.arrowButtons}>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => {
                const newIndex = Math.max(selectedBrandIndex - 1, 0);
                setSelectedBrandIndex(newIndex);
                if (filteredBrands.length > 0) {
                  setBrandName(filteredBrands[newIndex]);
                  setFilteredBrands([]);
                }
              }}
            >
              <Ionicons name="chevron-up" size={20} color="#4A5568" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => {
                const newIndex = Math.min(selectedBrandIndex + 1, filteredBrands.length - 1);
                setSelectedBrandIndex(newIndex);
                if (filteredBrands.length > 0) {
                  setBrandName(filteredBrands[newIndex]);
                  setFilteredBrands([]);
                }
              }}
            >
              <Ionicons name="chevron-down" size={20} color="#4A5568" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dropdown for brands */}
        {filteredBrands.length > 0 && (
          <View style={styles.dropdown}>
            {filteredBrands.slice(0, 5).map((brand, index) => (
              <TouchableOpacity
                key={brand}
                onPress={() => {
                  setBrandName(brand);
                  setFilteredBrands([]);
                }}
                onPressIn={() => {
                  setBrandName(brand);
                  setFilteredBrands([]);
                }}
                style={[styles.dropdownItem, index === selectedBrandIndex && styles.highlightedItem]}
                activeOpacity={0.7}
              >
                <Text>{brand}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Model Name */}
        <Text style={styles.label}>Model Name</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="e.g., Daytona"
            value={modelName}
            onChangeText={handleModelChange}
          />
          <View style={styles.arrowButtons}>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => {
                const newIndex = Math.max(selectedModelIndex - 1, 0);
                setSelectedModelIndex(newIndex);
                if (filteredModels.length > 0) {
                  setModelName(filteredModels[newIndex]);
                  setFilteredModels([]);
                }
              }}
            >
              <Ionicons name="chevron-up" size={20} color="#4A5568" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => {
                const newIndex = Math.min(selectedModelIndex + 1, filteredModels.length - 1);
                setSelectedModelIndex(newIndex);
                if (filteredModels.length > 0) {
                  setModelName(filteredModels[newIndex]);
                  setFilteredModels([]);
                }
              }}
            >
              <Ionicons name="chevron-down" size={20} color="#4A5568" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dropdown for models */}
        {filteredModels.length > 0 && (
          <View style={styles.dropdown}>
            {filteredModels.slice(0, 5).map((model, index) => (
              <TouchableOpacity
                key={model}
                onPress={() => {
                  setModelName(model);
                  setFilteredModels([]);
                }}
                onPressIn={() => {
                  setModelName(model);
                  setFilteredModels([]);
                }}
                style={[styles.dropdownItem, index === selectedModelIndex && styles.highlightedItem]}
                activeOpacity={0.7}
              >
                <Text>{model}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Model Number */}
        <Text style={styles.label}>Model Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 116500LN"
          value={modelNumber}
          onChangeText={setModelNumber}
        />

        {/* Year */}
        <Text style={styles.label}>Year of Manufacture</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 2020"
          keyboardType="number-pad"
          value={yearOfManufacture}
          onChangeText={setYearOfManufacture}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Condition & Status</Text>

        <AutocompleteInput
          label="Condition"
          value={condition}
          onValueChange={(v) => setCondition(v as Condition)}
          options={[
            {label: 'Poor', value: 'poor'},
            {label: 'Fair', value: 'fair'},
            {label: 'Good', value: 'good'},
            {label: 'Excellent', value: 'excellent'},
          ]}
        />

        <View style={styles.toggleRow}>
          <Text style={styles.label}>New/Used</Text>
          <View style={styles.toggleButtons}>
            <TouchableOpacity
              style={[styles.toggleButton, isNew && styles.toggleButtonActive]}
              onPress={() => setIsNew(true)}
            >
              <Text style={[styles.toggleText, isNew && styles.toggleTextActive]}>New</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !isNew && styles.toggleButtonActive]}
              onPress={() => setIsNew(false)}
            >
              <Text style={[styles.toggleText, !isNew && styles.toggleTextActive]}>Used</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Materials</Text>





          <AutocompleteInput
            label="Case Material"
            value={caseMaterial}
            onValueChange={(v) => setCaseMaterial(v as CaseMaterial)}
            options={[
              {label: 'Select case material', value: ''},
              {label: 'Platinum', value: 'platinum'},
              {label: 'Yellow Gold', value: 'yellowGold'},
               {label: 'Rose Gold', value: 'roseGold'},
               {label: 'White Gold', value: 'whiteGold'},
               {label: 'Silver', value: 'silver'},
              {label: 'Titanium', value: 'titanium'},
               {label: 'Stainless steel', value: 'Stainless Steel'},
              {label: '23 kt Gold', value: '23ktGold'},
              {label: '22 kt Gold', value: '22ktGold'},
              {label: '18 kt Gold', value: '18ktGold'},
              {label: '14 kt Gold', value: '14ktGold'},
              {label: '10 kt Gold', value: '10ktGold'},
            ]}
          />

         <AutocompleteInput
  label="Band Material"
  value={bandMaterial}
  onValueChange={(v) => setBandMaterial(v as BandMaterial)}
  options={[
    { label: 'Select band material', value: '' },
    { label: 'Platinum', value: 'platinum' },
    { label: 'Gold', value: 'gold' },
    { label: '23 kt Gold', value: '23ktGold' },
    { label: '22 kt Gold', value: '22ktGold' },
    { label: '18 kt Gold', value: '18ktGold' },
    { label: '14 kt Gold', value: '14ktGold' },
    { label: '10 kt Gold', value: '10ktGold' },
    { label: 'Silver', value: 'silver' },
    { label: 'Stainless Steel', value: 'stainlessSteel' },
    { label: 'Metal', value: 'metal' },
    { label: 'Aluminum', value: 'aluminum' },
    { label: 'Titanium', value: 'titanium' },
    { label: 'Ceramic', value: 'ceramic' },
    { label: 'Copper', value: 'copper' },
    { label: 'Rubber', value: 'rubber' },
    { label: 'Fabric', value: 'fabric' },
    { label: 'Leather', value: 'leather' },
  ]}
/>

  <Text style={styles.sectionTitle}>Band Details</Text>

  <Text style={styles.label}>Band Length</Text>
  <TextInput
    style={styles.input}
    placeholder="e.g., Standard, Long"
    value={bandLength}
    onChangeText={setBandLength}
  />

  <Text style={styles.label}>Band Link</Text>
  <TextInput
    style={styles.input}
    placeholder="e.g., Oyster, Jubilee, President"
    value={bandLink}
    onChangeText={setBandLink}
  />

  <Text style={styles.label}>Band Size (mm)</Text>
  <TextInput
    style={styles.input}
    placeholder="e.g., 20"
    keyboardType="decimal-pad"
    value={bandSize}
    onChangeText={setBandSize}
  />

  <Text style={styles.label}>Band Size (inches)</Text>
  <TextInput
    style={styles.input}
    placeholder="e.g., 8"
    keyboardType="decimal-pad"
    value={bandSizeInches}
    onChangeText={setBandSizeInches}
  />

  <Text style={styles.label}>Band Style</Text>
  <TextInput
    style={styles.input}
    placeholder="e.g., Three-piece link, Mesh"
    value={bandStyle}
    onChangeText={setBandStyle}
  />

  <Text style={styles.label}>Lug Width (mm)</Text>
  <TextInput
    style={styles.input}
    placeholder="e.g., 20"
    keyboardType="decimal-pad"
    value={lugWidth}
    onChangeText={setLugWidth}
  />

  <Text style={styles.label}>Buckle Width (mm)</Text>
  <TextInput
    style={styles.input}
    placeholder="e.g., 18"
    keyboardType="decimal-pad"
    value={buckleWidth}
    onChangeText={setBuckleWidth}
  />

  <Text style={styles.label}>Lug to Lug Length (mm)</Text>
  <TextInput
    style={styles.input}
    placeholder="e.g., 48"
    keyboardType="decimal-pad"
    value={lugToLugLength}
    onChangeText={setLugToLugLength}
  />
</View>

<View style={styles.section}>
  <Text style={styles.sectionTitle}>Technical Specifications</Text>

  <AutocompleteInput
    label="Movement Type"
    value={movementType}
    onValueChange={(v) => setMovementType(v as MovementType)}
    options={[
      { label: 'Select movement type', value: '' },
      { label: 'Automatic', value: 'automatic' },
      { label: 'Winder', value: 'winder' },
      { label: 'Battery', value: 'battery' },
      { label: 'Solar', value: 'solar' },
      { label: 'Tourbillon', value: 'tourbillon' },
      { label: 'Power Reserve', value: 'powerReserve' },
      { label: 'Quartz', value: 'quartz' },
      { label: 'Digital', value: 'digital' },
      { label: 'Minute Repeater', value: 'minuteRepeater' },
      { label: 'Perpetual Calendar', value: 'perpetualCalendar' },
    ]}
  />

  <Text style={styles.fieldLabel}>🧠 Watch Features</Text>
  {[
    'Power Reserve',
    'Quartz',
    'Digital',
    'Minute Repeater',
    'Perpetual Calendar',
    'Date Chronograph',
  ].map((feature) => (
    <View key={feature} style={styles.checkboxRow}>
      <CheckBox
        value={selectedFeatures.includes(feature)}
        onValueChange={() => toggleFeature(feature)}
      />
      <Text>{feature}</Text>
    </View>
  ))}

  <Text style={styles.fieldLabel}>🔗 Clasp Type</Text>
  <Picker
    selectedValue={claspType}
    onValueChange={setClaspType}
    style={styles.picker}
  >
    <Picker.Item label="Select clasp type" value="" />
    <Picker.Item label="Deployable Clasp" value="deployable" />
    <Picker.Item label="Folding Clasp" value="folding" />
    <Picker.Item label="Velcro" value="velcro" />
  </Picker>

  <Text style={styles.fieldLabel}>📏 Watch Size (mm)</Text>
  <Picker
    selectedValue={watchSize}
    onValueChange={setWatchSize}
    style={styles.picker}
  >
    <Picker.Item label="Select watch size" value="" />
    <Picker.Item label="20mm" value="20mm" />
    <Picker.Item label="28-34mm (Extra Small)" value="28-34" />
    <Picker.Item label="35-38mm (Small)" value="35-38" />
    <Picker.Item label="39-42mm (Medium)" value="39-42" />
    <Picker.Item label="43-46mm (Large)" value="43-46" />
    <Picker.Item label="47mm+ (Extra Large)" value="47+" />
  </Picker>

  <Text style={styles.fieldLabel}>⬛ Case Shape</Text>
  <Picker
    selectedValue={caseShape}
    onValueChange={setCaseShape}
    style={styles.picker}
  >
    <Picker.Item label="Select case shape" value="" />
    <Picker.Item label="Round" value="round" />
    <Picker.Item label="Square" value="square" />
    <Picker.Item label="Rectangle" value="rectangle" />
    <Picker.Item label="Cushion" value="cushion" />
    <Picker.Item label="Tonneau" value="tonneau" />
    <Picker.Item label="Oval" value="oval" />
  </Picker>

  <Text style={styles.fieldLabel}>📐 Case Thickness (mm)</Text>
  <TextInput
    style={styles.input}
    placeholder="e.g., 12"
    keyboardType="decimal-pad"
    value={caseThickness}
    onChangeText={setCaseThickness}
  />

  <Text style={styles.fieldLabel}>👤 Gender</Text>
  <Picker
    selectedValue={gender}
    onValueChange={setGender}
    style={styles.picker}
  >
    <Picker.Item label="Select gender" value="" />
    <Picker.Item label="Men's" value="mens" />
    <Picker.Item label="Women's" value="womens" />
    <Picker.Item label="Unisex" value="unisex" />
  </Picker>

  <View style={styles.skeletalGroup}>
  {[
    { label: 'Skeletal Back', value: skeletalBack, setter: setSkeletalBack },
    { label: 'Flip Skeletal Back', value: flipSkeletalBack, setter: setFlipSkeletalBack },
    { label: 'Full Skeletal Watch', value: fullSkeletalWatch, setter: setFullSkeletalWatch },
  ].map(({ label, value, setter }) => (
    <View key={label} style={styles.checkboxRow}>
      <Checkbox
  value={value}
  onValueChange={setter}
  color={value ? '#FF6B35' : undefined}
/>

      <Text style={styles.checkboxLabel}>{label}</Text>
    </View>
  ))}
</View>


  <AutocompleteInput
    label="Water Resistance"
    value={waterResistance}
    onValueChange={(v) => setWaterResistance(v as WaterResistance)}
    options={[
      { label: 'Select water resistance', value: '' },
      { label: 'None', value: 'none' },
      { label: 'Splash Proof', value: 'splashProof' },
      { label: 'Water Resistant', value: 'waterResistant' },
      { label: 'Diver', value: 'diver' },
    ]}
  />

  <AutocompleteInput
    label="Rarity"
    value={rarity}
    onValueChange={(v) => setRarity(v as Rarity)}
    options={[
      { label: 'Select rarity', value: '' },
      { label: 'Common', value: 'common' },
      { label: 'Uncommon', value: 'uncommon' },
      { label: 'Rare', value: 'rare' },
      { label: 'Very Rare', value: 'veryRare' },
      { label: 'Extremely Rare', value: 'extremelyRare' },
    ]}
  />
</View>

<View style={styles.section}>
  <Text style={styles.sectionTitle}>Bezel Details</Text>

  <Text style={styles.label}>Bezel Type</Text>
  <TextInput
    style={styles.input}
    placeholder="e.g., Fixed, Rotating, Unidirectional"
    value={bezelType}
    onChangeText={setBezelType}
  />

  <Text style={styles.label}>Bezel Style</Text>
  <TextInput
    style={styles.input}
    placeholder="e.g., Fluted, Smooth, Diamond-Set"
    value={bezelStyle}
    onChangeText={setBezelStyle}
  />

  <Text style={styles.fieldLabel}>💎 Bezel Material</Text>
  <Picker
    selectedValue={bezelMaterial}
    onValueChange={setBezelMaterial}
    style={styles.picker}
  >
    <Picker.Item label="Select bezel material" value="" />
    <Picker.Item label="Ceramic" value="ceramic" />
    <Picker.Item label="Stainless Steel" value="stainlessSteel" />
    <Picker.Item label="Gold" value="gold" />
    <Picker.Item label="Platinum" value="platinum" />
    <Picker.Item label="Aluminum" value="aluminum" />
    <Picker.Item label="Titanium" value="titanium" />
  </Picker>

  <Text style={styles.label}>Bezel Weight (carats)</Text>
  <TextInput
    style={styles.input}
    placeholder="e.g., 2.5 (for diamond/gemstone bezels)"
    keyboardType="decimal-pad"
    value={bezelWeight}
    onChangeText={setBezelWeight}
  />

  <View style={styles.checkboxRow}>
    <Checkbox
      value={aftermarketBezel}
      onValueChange={setAftermarketBezel}
      color={aftermarketBezel ? '#FF6B35' : undefined}
    />
    <Text style={styles.checkboxLabel}>Aftermarket Bezel</Text>
  </View>

  <View style={styles.checkboxRow}>
    <Checkbox
      value={originalBezel}
      onValueChange={setOriginalBezel}
      color={originalBezel ? '#FF6B35' : undefined}
    />
    <Text style={styles.checkboxLabel}>Original Bezel</Text>
  </View>
</View>

<View style={styles.section}>
  <Text style={styles.sectionTitle}>Dial Details</Text>

  <Text style={styles.label}>Dial Style</Text>
  <TextInput
    style={styles.input}
    placeholder="e.g., Sunburst, Textured, Guilloche"
    value={dialStyle}
    onChangeText={setDialStyle}
  />

  <Text style={styles.label}>Dial Color</Text>
  <TextInput
    style={styles.input}
    placeholder="e.g., Black, White, Blue, Champagne"
    value={dialColor}
    onChangeText={setDialColor}
  />

  <Text style={styles.label}>Dial Material</Text>
  <TextInput
    style={styles.input}
    placeholder="e.g., Metal, Mother of Pearl, Carbon Fiber"
    value={dialMaterial}
    onChangeText={setDialMaterial}
  />

  <Text style={styles.fieldLabel}>⏰ Dial Hour Markers</Text>
  <Picker
    selectedValue={dialHourMarkers}
    onValueChange={setDialHourMarkers}
    style={styles.picker}
  >
    <Picker.Item label="Select hour markers" value="" />
    <Picker.Item label="Arabic Numerals" value="arabic" />
    <Picker.Item label="Roman Numerals" value="roman" />
    <Picker.Item label="Baton/Stick" value="baton" />
    <Picker.Item label="Diamond" value="diamond" />
    <Picker.Item label="Mixed" value="mixed" />
    <Picker.Item label="None" value="none" />
  </Picker>

  <Text style={styles.fieldLabel}>📟 Dial/Face Type</Text>
  <Picker
    selectedValue={dialType}
    onValueChange={setDialType}
    style={styles.picker}
  >
    <Picker.Item label="Select dial type" value="" />
    <Picker.Item label="Analog" value="analog" />
    <Picker.Item label="Digital" value="digital" />
    <Picker.Item label="Analog-Digital" value="analogDigital" />
  </Picker>

  <View style={styles.checkboxRow}>
    <Checkbox
      value={aftermarketDial}
      onValueChange={setAftermarketDial}
      color={aftermarketDial ? '#FF6B35' : undefined}
    />
    <Text style={styles.checkboxLabel}>Aftermarket Dial</Text>
  </View>

  <View style={styles.checkboxRow}>
    <Checkbox
      value={originalDial}
      onValueChange={setOriginalDial}
      color={originalDial ? '#FF6B35' : undefined}
    />
    <Text style={styles.checkboxLabel}>Original Dial</Text>
  </View>
</View>




<View style={styles.section}>
  <Text style={styles.sectionTitle}>Additional Features</Text>

  <TouchableOpacity
    style={styles.checkboxRow}
    onPress={() => setHasOriginalPackaging(!hasOriginalPackaging)}
  >
    <Ionicons
      name={hasOriginalPackaging ? 'checkbox' : 'square-outline'}
      size={24}
      color="#FF6B35"
    />
    <Text style={styles.checkboxLabel}>Original Packaging</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.checkboxRow}
    onPress={() => setHasDiamonds(!hasDiamonds)}
  >
    <Ionicons
      name={hasDiamonds ? 'checkbox' : 'square-outline'}
      size={24}
      color="#FF6B35"
    />
    <Text style={styles.checkboxLabel}>Diamonds / Gemstones</Text>
  </TouchableOpacity>
</View>

<TouchableOpacity
  style={styles.appraiseButton}
  onPress={handleAppraiseAndList}
>
  <Text style={styles.appraiseButtonText}>Get Appraisal</Text>
</TouchableOpacity>

{!!(price) && (
  <View style={styles.priceContainer}>
    <Text style={styles.priceLabel}>💰 Estimated Value</Text>
    <Text style={styles.priceValue}>${price}</Text>
    {priceSource && (
      <Text style={styles.priceSource}>📍 {priceSource}</Text>
    )}
    <Text style={styles.disclaimer}>
      *Estimated based on materials, condition, and features. Actual market value may vary.
    </Text>

    {/* Price History Chart */}
    {priceHistory.length > 0 && (
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>📈 Historical Market Prices</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
          {priceHistory.map(({ year, price: histPrice }) => (
            <View key={year} style={styles.historyItem}>
              <Text style={styles.historyPrice}>${histPrice.toLocaleString()}</Text>
              <Text style={styles.historyYear}>{year}</Text>
            </View>
          ))}
        </ScrollView>
        <Text style={styles.historyNote}>
          💡 Prices shown are base market values before condition/material adjustments
        </Text>
      </View>
    )}

    <View style={styles.buyItNowSection}>
      <Text style={styles.buyItNowLabel}>🏷️ Buy It Now Price (Optional)</Text>
      <TextInput
        style={styles.buyItNowInput}
        placeholder="Enter Buy It Now price"
        keyboardType="decimal-pad"
        value={buyItNowPrice}
        onChangeText={setBuyItNowPrice}
      />
      <Text style={styles.buyItNowHint}>
        Set a Buy It Now price to allow instant purchases
      </Text>
    </View>
  </View>

)}

{!!(price) && (
  <WatchListingCard
    imageUrl={'https://example.com/watch.jpg'}
    brand={brandName}
    model={modelName}
    price={price}
    year={yearOfManufacture}
    isNew={isNew}
    watchSpecs={{
      caseMaterial,
      bandMaterial,
      movementType,
      rarity,
      waterResistance,
      condition,
      countryOfOrigin: countryField.value,
      warranty: warrantyField.value,
      claspType,
      watchSize,
      gender,
      bandSize,
      bandLength,
      bandLink,
      bandStyle,
      bandSizeInches,
      lugWidth,
      buckleWidth,
      lugToLugLength,
      caseShape,
      caseThickness,
      bezelType,
      bezelStyle,
      bezelWeight,
      bezelMaterial,
      aftermarketBezel,
      originalBezel,
      dialStyle,
      dialColor,
      dialMaterial,
      dialHourMarkers,
      dialType,
      aftermarketDial,
      originalDial,
      hasOriginalPackaging,
      hasDiamonds,
      skeletalBack,
      flipSkeletalBack,
      fullSkeletalWatch,
      selectedFeatures,
    }}
  />
)}


      </Animated.ScrollView>
    </View>
  );
}

export const themedStyles = (scheme: 'light' | 'dark') => {
  const isDark = scheme === 'dark';

  // Define palette once
  const palette = {
    background: isDark ? '#000' : '#F7FAFC',
    cardBackground: isDark ? '#111' : '#fff',
    border: isDark ? '#333' : '#E2E8F0',
    dropdownBorder: isDark ? '#555' : '#ccc',
    dropdownBackground: isDark ? '#222' : '#fff',
    textPrimary: isDark ? '#f0f0f0' : '#1A202C',
    textSecondary: isDark ? '#ddd' : '#4A5568',
    textMuted: isDark ? '#aaa' : '#718096',
    inputBorder: isDark ? '#555' : '#ccc',
    inputBackground: isDark ? '#222' : '#fff',
    inputText: isDark ? '#f0f0f0' : '#333',
    highlight: isDark ? '#333' : '#d0ebff',
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    contentContainer: {
      paddingTop: 140,
      paddingBottom: 40,
    },
    headerTitleContainer: {
      position: 'absolute',
      top: HEADER_MAX_HEIGHT,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: palette.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
      zIndex: 10,
    },
    headerTitleText: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.textPrimary,
      marginBottom: 2,
    },
    headerSubtitle: {
      fontSize: 14,
      color: palette.textSecondary,
    },
    section: {
      backgroundColor: palette.cardBackground,
      padding: 16,
      marginTop: 12,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    dropdown: {
      borderWidth: 1,
      borderColor: palette.dropdownBorder,
      borderRadius: 6,
      marginTop: 4,
      backgroundColor: palette.dropdownBackground,
      maxHeight: 150,
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: '600',
      marginTop: 12,
      marginBottom: 4,
      color: palette.textPrimary,
    },
    picker: {
      borderWidth: 1,
      borderColor: palette.dropdownBorder,
      borderRadius: 6,
      padding: 8,
      backgroundColor: palette.dropdownBackground,
      marginBottom: 12,
    },
    skeletalGroup: {
      marginTop: 12,
      marginBottom: 12,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    checkboxLabel: {
      fontSize: 14,
      color: palette.textPrimary,
      marginLeft: 12,
    },
    dropdownItem: {
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#444' : '#eee',
    },
    highlightedItem: {
      backgroundColor: palette.highlight,
    },
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#4A5568',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginTop: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    arrowButtons: {
      position: 'absolute',
      right: 1,
      top: 1,
      bottom: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      borderLeftWidth: 1,
      borderLeftColor: palette.border,
      backgroundColor: palette.cardBackground,
      borderTopRightRadius: 6,
      borderBottomRightRadius: 6,
      width: 32,
    },
    arrowButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 2,
    },
    inputWrapper: {
      position: 'relative',
    },
    input: {
      borderWidth: 1,
      borderColor: palette.inputBorder,
      padding: 10,
      paddingRight: 40,
      borderRadius: 6,
      backgroundColor: palette.inputBackground,
      fontSize: 16,
      color: palette.inputText,
    },
    appraiseButton: {
      flexDirection: 'row',
      backgroundColor: '#FF6B35',
      marginHorizontal: 16,
      marginTop: 20,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#FF6B35',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    appraiseButtonText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#fff',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: palette.textPrimary,
      marginBottom: 12,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.textSecondary,
      marginTop: 12,
      marginBottom: 6,
    },
    toggleRow: {
      marginTop: 12,
    },
    toggleButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: isDark ? '#444' : '#E2E8F0',
      backgroundColor: palette.dropdownBackground,
      alignItems: 'center',
    },
    toggleButtonActive: {
      borderColor: '#FF6B35',
      backgroundColor: isDark ? '#332019' : '#FFF5F2',
    },
    toggleText: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.textMuted,
    },
    toggleTextActive: {
      color: '#FF6B35',
    },
    priceContainer: {
      backgroundColor: palette.cardBackground,
      marginTop: 20,
      marginHorizontal: 16,
      padding: 20,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#FF6B35',
      alignItems: 'center',
    },
    priceLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.textSecondary,
      marginBottom: 8,
    },
    priceValue: {
      fontSize: 36,
      fontWeight: '700',
      color: '#FF6B35',
      marginBottom: 12,
    },
    disclaimer: {
      fontSize: 11,
      color: palette.textMuted,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    priceSource: {
      fontSize: 12,
      color: palette.textSecondary,
      marginTop: 4,
      marginBottom: 8,
      fontStyle: 'italic',
    },
    historySection: {
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: palette.border,
      width: '100%',
    },
    historyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.textPrimary,
      marginBottom: 12,
      textAlign: 'center',
    },
    historyScroll: {
      marginVertical: 12,
    },
    historyItem: {
      alignItems: 'center',
      marginHorizontal: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: isDark ? '#1a1a1a' : '#F7FAFC',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: palette.border,
      minWidth: 100,
    },
    historyPrice: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FF6B35',
      marginBottom: 4,
    },
    historyYear: {
      fontSize: 12,
      color: palette.textSecondary,
      fontWeight: '600',
    },
    historyNote: {
      fontSize: 11,
      color: palette.textMuted,
      textAlign: 'center',
      fontStyle: 'italic',
      marginTop: 8,
    },
    listButton: {
      flexDirection: 'row',
      backgroundColor: '#FF6B35',
      marginHorizontal: 16,
      marginTop: 20,
      paddingVertical: 0,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#FF6B35',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    listButtonText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#fff',
    },
    buyItNowSection: {
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: palette.border,
      width: '100%',
    },
    buyItNowLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.textPrimary,
      marginBottom: 8,
    },
    buyItNowInput: {
      borderWidth: 1,
      borderColor: palette.inputBorder,
      padding: 12,
      borderRadius: 8,
      backgroundColor: palette.inputBackground,
      fontSize: 18,
      fontWeight: '600',
      color: palette.inputText,
      textAlign: 'center',
    },
    buyItNowHint: {
      fontSize: 12,
      color: palette.textMuted,
      textAlign: 'center',
      marginTop: 6,
      fontStyle: 'italic',
    },
  });
};