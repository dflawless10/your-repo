import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Animated, Image, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import EnhancedHeader, { HEADER_MAX_HEIGHT } from '@/app/components/EnhancedHeader';
import WatchListingCard from '@/components/WatchListingCard';
import AutocompleteInput from '@/components/AutocompleteInput';
import { Picker } from "@react-native-picker/picker";
import CheckBox, {Checkbox} from 'expo-checkbox';
import watchPricesData from '@/assets/data/watchPrices.json';
import watchBrandsData from '@/assets/data/watchBrands.json';
import { API_URL } from '@/constants/api';
import { validateContentQuick } from 'app/utils/contentModeration';
import GlobalFooter from "@/app/components/GlobalFooter";
import { useTheme } from '@/app/theme/ThemeContext';

type Country = 'switzerland' | 'germany' | 'japan' | 'usa' | 'france' | 'italy' | 'uk' | 'china' | 'russia' | 'spain' | 'sweden' | 'netherlands' | 'belgium' | 'denmark' | 'austria' | 'czech' | 'poland' | 'canada' | 'mexico' | 'brazil' | 'argentina' | 'australia' | 'southkorea' | 'singapore' | 'hongkong' | 'taiwan' | 'india' | 'uae' | 'southafrica';
type Warranty = 'none' | 'factory' | 'aftermarket';
type ClaspType = 'deployable' | 'folding' | 'velcro';
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
type CaseMetal = '' | 'gold' | 'platinum' | 'silver' | 'stainlessSteel' | 'titanium' | 'metal';
type CaseGoldKarat = '' | '22kt' | '20kt' | '18kt' | '14kt' | '10kt' | '8kt';
type CaseMaterial = '' | 'yellowGold' | 'whiteGold' | 'roseGold' | 'plastic' | 'rubber' | 'carbonFiber' | 'ceramic';
type BandMetal = '' | 'platinum' | 'gold' | 'silver' | 'stainlessSteel' | 'stainlessGold' | 'goldPlatinum' | 'titanium' | 'ceramic' | 'metal' | 'plastic' | 'rubber' | 'leather' | 'fabric' | 'nylon' | 'carbonFiber';
type BandGoldColor = '' | 'yellow' | 'rose' | 'white' | 'pink' | 'blackHills' | 'mixed';
type BandGoldKarat = '' | '22kt' | '20kt' | '18kt' | '14kt' | '10kt' | '8kt' | '5kt';
type BandLeatherType = '' | 'alligator' | 'buffalo' | 'cow' | 'goat' | 'ostrich' | 'sheep' | 'stingray';
type BandStyle = '' | 'oyster' | 'hLink' | 'jubilee' | 'milanese' | 'beadsOfRice' | 'president' | 'integrated' | 'expansion' | 'butterflyClasp' | 'nato' | 'perlon' | 'bund';
type BandMaterial = '' | 'gold' | 'platinum' | 'metal' | 'rubber' | 'silver' | 'fabric' | 'leather';
type MovementType = '' | 'automatic' | 'winder' | 'battery' | 'solar' | 'tourbillon' | 'subSeconds';
type Rarity = '' | 'common' | 'uncommon' | 'rare' | 'veryRare' | 'extremelyRare';
type WaterResistance = '' | 'none' | 'splashProof' | 'waterResistant' | 'diver';
type CaseBackMaterial = '' | 'stainlessSteel' | 'titanium' | 'ceramic' | 'sapphire' | 'mineral' | 'plastic';

export function useAutocompleteField<T extends string>(initialOptions: { label: string; value: T }[], initialValue: T) {
  const [options, setOptions] = useState(initialOptions);
  const [value, setValue] = useState<T>(initialValue);

   const addCustomOption = async (field: string, newValue: T, label: string) => {
    const newOption = { label, value: newValue };
    setOptions(prev => [...prev, newOption]);
    setValue(newValue); // auto-select a new option

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
  const { theme, colors } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const styles = themedStyles(theme);


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
  const [caseMetal, setCaseMetal] = useState<CaseMetal>('');
  const [caseGoldKarat, setCaseGoldKarat] = useState<CaseGoldKarat>('');
  const [caseMaterial, setCaseMaterial] = useState<CaseMaterial>('');
  const [bandMetal, setBandMetal] = useState<BandMetal>('');
  const [bandGoldColor, setBandGoldColor] = useState<BandGoldColor>('');
  const [bandGoldKarat, setBandGoldKarat] = useState<BandGoldKarat>('');
  const [bandLeatherType, setBandLeatherType] = useState<BandLeatherType>('');
  const [bandStyle, setBandStyle] = useState<string>(''); // Changed to string for free-text input
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
  const [watchSize, setWatchSize] = useState(''); // Changed to string for text input
  const [skeletalBack, setSkeletalBack] = useState(false);
  const [flipSkeletalBack, setFlipSkeletalBack] = useState(false);
  const [fullSkeletalWatch, setFullSkeletalWatch] = useState(false);
  const [buyItNowPrice, setBuyItNowPrice] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [priceHistory, setPriceHistory] = useState<{year: string, price: number}[]>([]);
  const [priceSource, setPriceSource] = useState('');
  const [bandColor, setBandColor] = useState('');
  const [caseBackMaterial, setCaseBackMaterial] = useState<CaseBackMaterial>('');
  const [serialNumber, setSerialNumber] = useState('');
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
    { label: 'United Kingdom', value: 'uk' as Country },
    { label: 'China', value: 'china' as Country },
    { label: 'Russia', value: 'russia' as Country },
    { label: 'Spain', value: 'spain' as Country },
    { label: 'Sweden', value: 'sweden' as Country },
    { label: 'Netherlands', value: 'netherlands' as Country },
    { label: 'Belgium', value: 'belgium' as Country },
    { label: 'Denmark', value: 'denmark' as Country },
    { label: 'Austria', value: 'austria' as Country },
    { label: 'Czech Republic', value: 'czech' as Country },
    { label: 'Poland', value: 'poland' as Country },
    { label: 'Canada', value: 'canada' as Country },
    { label: 'Mexico', value: 'mexico' as Country },
    { label: 'Brazil', value: 'brazil' as Country },
    { label: 'Argentina', value: 'argentina' as Country },
    { label: 'Australia', value: 'australia' as Country },
    { label: 'South Korea', value: 'southkorea' as Country },
    { label: 'Singapore', value: 'singapore' as Country },
    { label: 'Hong Kong', value: 'hongkong' as Country },
    { label: 'Taiwan', value: 'taiwan' as Country },
    { label: 'India', value: 'india' as Country },
    { label: 'UAE', value: 'uae' as Country },
    { label: 'South Africa', value: 'southafrica' as Country },
  ],
  '' as Country
);

  // Warranty field using the shared hook
const warrantyField = useAutocompleteField<Warranty>(
  [
    { label: 'Select warranty', value: '' as Warranty },
    { label: 'None', value: 'none' as Warranty },
    { label: 'Factory Warranty', value: 'factory' as Warranty },
    { label: 'After-market Warranty', value: 'aftermarket' as Warranty },
  ],
  '' as Warranty
);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // New state variables for comprehensive watch specifications
  const [bandSize, setBandSize] = useState('');
  const [bandLength, setBandLength] = useState('');
  const [bandLink, setBandLink] = useState('');
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




  // Fade in header title and arrow
  useEffect(() => {
    setTimeout(() => {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        // After fade-in completes, start pulsing animation
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
      console.log('📦 Using local brand data due to error:', error);
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
      console.log('📦 Using local model data for', brand, 'due to error:', error);
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

    // Auto-scroll when brand is selected
    if (text.length > 2) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 300, animated: true });
      }, 300);
    }
  };

  const handleModelChange = (text: string) => {
    setModelName(text);
    const filtered = models.filter((m: string) =>
      m.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredModels(filtered);
    setSelectedModelIndex(0);

    // Auto-scroll when model is selected
    if (text.length > 2) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 500, animated: true });
      }, 300);
    }
  };

  const handleAppraiseAndList = async () => {
    // Content Moderation with error handling
    try {
      const brandModeration = validateContentQuick(brandName, 'Brand name');
      if (!brandModeration.isValid) {
        alert(brandModeration.errorMessage);
        return;
      }

      const modelModeration = validateContentQuick(modelName, 'Model name');
      if (!modelModeration.isValid) {
        alert(modelModeration.errorMessage);
        return;
      }
    } catch (error) {
      console.error('Content moderation error:', error);
      // Continue with appraisal if moderation fails
    }

    // Step 1: Try aggregated pricing from multiple sources
    try {
      console.log('🔍 Fetching aggregated pricing from multiple sources...');

      const aggregatedResponse = await fetch(`${API_URL}/api/appraise-aggregated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: brandName,
          model: modelName,
          modelNumber,
          yearOfManufacture,
          condition,
          caseMaterial,
          bandMaterial,
          movementType,
          hasOriginalPackaging,
          hasDiamonds,
          countryOfOrigin,
          warranty,
          waterResistance,
          rarity,
        }),
      });

      if (aggregatedResponse.ok) {
        const aggregatedResult = await aggregatedResponse.json();

        if (aggregatedResult.success && aggregatedResult.estimated_price) {
          console.log('✅ Aggregated pricing successful:', aggregatedResult);

          setPrice(Math.round(aggregatedResult.estimated_price).toString());

          // Build detailed source information
          let sourceDetails = `📊 ${aggregatedResult.confidence.toUpperCase()} confidence\n`;
          sourceDetails += `📈 Price range: $${aggregatedResult.price_range.min.toLocaleString()} - $${aggregatedResult.price_range.max.toLocaleString()}\n`;
          sourceDetails += `🔍 Sources: ${aggregatedResult.sources_used.join(', ')}\n`;
          sourceDetails += `📦 Data points: ${aggregatedResult.data_points}\n\n`;

          if (aggregatedResult.source_prices) {
            sourceDetails += 'Source Breakdown:\n';
            Object.entries(aggregatedResult.source_prices).forEach(([source, price]) => {
              sourceDetails += `  • ${source}: $${(price as number).toLocaleString()}\n`;
            });
          }

          setPriceSource(sourceDetails);

          alert(
            `💰 Watch appraised at $${Math.round(aggregatedResult.estimated_price).toLocaleString()}\n\n` +
            `📊 Confidence: ${aggregatedResult.confidence.toUpperCase()}\n` +
            `📈 Range: $${aggregatedResult.price_range.min.toLocaleString()} - $${aggregatedResult.price_range.max.toLocaleString()}\n` +
            `🔍 Sources: ${aggregatedResult.sources_used.join(', ')}\n` +
            `🔧 Condition: ${condition}\n` +
            `${isNew ? '✨ New' : '📦 Pre-owned'}`
          );

          console.log('✅ Aggregated appraisal complete');
          return;
        }
      }

      console.log('⚠️ Aggregated pricing not available, falling back to local JSON...');
    } catch (error) {
      console.error('Aggregated pricing error:', error);
      console.log('⚠️ Falling back to local JSON pricing...');
    }

    // Step 2: Fallback to local JSON pricing
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

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photos to upload watch images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets?.length) {
      const uris = result.assets.map(asset => asset.uri);
      setImageUris(prev => [...prev, ...uris]);
    }
  };

  const removeImage = (index: number) => {
    setImageUris(prev => prev.filter((_, i) => i !== index));
  };
  return (
    <View style={{ flex: 1 }}>
      <EnhancedHeader scrollY={scrollY} />

      <Animated.View style={[styles.headerTitleContainer, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
        <View style={styles.titleWithArrow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
            <Ionicons name="arrow-back" size={28} color="#6A0DAD" />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitleText, { color: colors.textPrimary }]}>Watch Price Calculator</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Calculate your watch&apos;s market value</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollViewRef}
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => Keyboard.dismiss()}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Basic Information</Text>

        <AutocompleteInput
  label="Country of Origin"
  value={countryField.value}
  onValueChange={(v: string) => countryField.setValue(v as Country)}
  options={countryField.options}
  allowCustom={false}
  editable={false}
  fieldName="country"
/>


        <AutocompleteInput
  label="Warranty"
  value={warrantyField.value}
  onValueChange={(v: string) => warrantyField.setValue(v as Warranty)}
  options={warrantyField.options}
  allowCustom={true}
  editable={false}
  fieldName="warranty"
  onAddCustom={(value, label) =>
    warrantyField.addCustomOption('warranty', value as Warranty, label)
  }
/>


        {/* Brand Name */}
        <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Brand Name</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
            placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
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
          <ScrollView style={[styles.dropdown, { maxHeight: 200 }]} nestedScrollEnabled>
            {filteredBrands.slice(0, 8).map((brand, index) => (
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
                <Text style={styles.dropdownText} numberOfLines={1} ellipsizeMode="tail">{brand}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Model Name */}
        <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Model Name</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
            placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
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
          <ScrollView style={[styles.dropdown, { maxHeight: 200 }]} nestedScrollEnabled>
            {filteredModels.slice(0, 8).map((model, index) => (
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
                <Text style={styles.dropdownText} numberOfLines={1} ellipsizeMode="tail">{model}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Model Number */}
        <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Model Number</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
          placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
          placeholder="e.g., 116500LN"
          value={modelNumber}
          onChangeText={setModelNumber}
        />

        {/* Year */}
        <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Year of Manufacture</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
          placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
          placeholder="e.g., 2020"
          keyboardType="number-pad"
          value={yearOfManufacture}
          onChangeText={setYearOfManufacture}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Condition & Status</Text>

        <AutocompleteInput
          label="Condition"
          value={condition}
          onValueChange={(v) => setCondition(v as Condition)}
          fieldName="condition"
          editable={false}
          options={[
            {label: 'Poor', value: 'poor'},
            {label: 'Fair', value: 'fair'},
            {label: 'Good', value: 'good'},
            {label: 'Excellent', value: 'excellent'},
          ]}
        />

        <View style={styles.toggleRow}>
          <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>New/Used</Text>
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
        <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Materials</Text>





          <AutocompleteInput
            label="Case Metal"
            value={caseMetal}
            onValueChange={(v) => setCaseMetal(v as CaseMetal)}
            editable={false}
            fieldName="caseMetal"
            options={[
              {label: 'Select case metal', value: ''},
              {label: 'Gold', value: 'gold'},
              {label: 'Platinum', value: 'platinum'},
              {label: 'Silver', value: 'silver'},
              {label: 'Stainless Steel', value: 'stainlessSteel'},
              {label: 'Titanium', value: 'titanium'},
              {label: 'Metal (Other)', value: 'metal'},
            ]}
          />

          {caseMetal === 'gold' && (
            <AutocompleteInput
              label="Gold Karat"
              value={caseGoldKarat}
              onValueChange={(v) => setCaseGoldKarat(v as CaseGoldKarat)}
              editable={false}
              fieldName="caseGoldKarat"
              options={[
                {label: 'Select karat', value: ''},
                {label: '22 Karat', value: '22kt'},
                {label: '20 Karat', value: '20kt'},
                {label: '18 Karat', value: '18kt'},
                {label: '14 Karat', value: '14kt'},
                {label: '10 Karat', value: '10kt'},
                {label: '8 Karat', value: '8kt'},
              ]}
            />
          )}

          <AutocompleteInput
            label="Case Material Finish"
            value={caseMaterial}
            onValueChange={(v) => setCaseMaterial(v as CaseMaterial)}
            editable={false}
            fieldName="caseMaterial"
            options={[
              {label: 'Select finish/material', value: ''},
              {label: 'Yellow Gold', value: 'yellowGold'},
              {label: 'White Gold', value: 'whiteGold'},
              {label: 'Rose Gold', value: 'roseGold'},
              {label: 'Ceramic', value: 'ceramic'},
              {label: 'Carbon Fiber', value: 'carbonFiber'},
              {label: 'Plastic', value: 'plastic'},
              {label: 'Rubber', value: 'rubber'},
            ]}
          />

         <AutocompleteInput
  label="Band Material"
  value={bandMetal}
  onValueChange={(v) => {
    setBandMetal(v as BandMetal);
    // Reset sub-selections when material changes
    if (v !== 'gold') {
      setBandGoldColor('');
      setBandGoldKarat('');
    }
    if (v !== 'leather') {
      setBandLeatherType('');
    }
  }}
  editable={false}
  fieldName="bandMetal"
  options={[
    { label: 'Select band material', value: '' },
    { label: 'Carbon Fiber', value: 'carbonFiber' },
    { label: 'Ceramic', value: 'ceramic' },
    { label: 'Fabric', value: 'fabric' },
    { label: 'Gold', value: 'gold' },
    { label: 'Gold & Platinum', value: 'goldPlatinum' },
    { label: 'Leather', value: 'leather' },
    { label: 'Metal', value: 'metal' },
    { label: 'Nylon', value: 'nylon' },
    { label: 'Plastic', value: 'plastic' },
    { label: 'Platinum', value: 'platinum' },
    { label: 'Rubber', value: 'rubber' },
    { label: 'Silver', value: 'silver' },
    { label: 'Stainless & Gold', value: 'stainlessGold' },
    { label: 'Stainless Steel', value: 'stainlessSteel' },
    { label: 'Titanium', value: 'titanium' },
  ]}
/>

{bandMetal === 'gold' && (
  <>
    <AutocompleteInput
      label="Gold Color"
      value={bandGoldColor}
      onValueChange={(v) => {
        setBandGoldColor(v as BandGoldColor);
        // Reset karat when color changes
        if (!v) setBandGoldKarat('');
      }}
      editable={false}
      fieldName="bandGoldColor"
      options={[
        { label: 'Select gold color', value: '' },
        { label: 'Black Hills', value: 'blackHills' },
        { label: 'Mixed', value: 'mixed' },
        { label: 'Pink', value: 'pink' },
        { label: 'Rose', value: 'rose' },
        { label: 'White', value: 'white' },
        { label: 'Yellow', value: 'yellow' },
      ]}
    />

    {bandGoldColor && (
      <AutocompleteInput
        label="Gold Karat"
        value={bandGoldKarat}
        onValueChange={(v) => setBandGoldKarat(v as BandGoldKarat)}
        editable={false}
        fieldName="bandGoldKarat"
        options={[
          { label: 'Select karat', value: '' },
          { label: '5 Karat', value: '5kt' },
          { label: '8 Karat', value: '8kt' },
          { label: '10 Karat', value: '10kt' },
          { label: '14 Karat', value: '14kt' },
          { label: '18 Karat', value: '18kt' },
          { label: '20 Karat', value: '20kt' },
          { label: '22 Karat', value: '22kt' },
        ]}
      />
    )}
  </>
)}

{bandMetal === 'leather' && (
  <AutocompleteInput
    label="Leather Type"
    value={bandLeatherType}
    onValueChange={(v) => setBandLeatherType(v as BandLeatherType)}
    editable={false}
    fieldName="bandLeatherType"
    options={[
      { label: 'Select leather type', value: '' },
      { label: 'Alligator', value: 'alligator' },
      { label: 'Buffalo', value: 'buffalo' },
      { label: 'Cow', value: 'cow' },
      { label: 'Goat', value: 'goat' },
      { label: 'Ostrich', value: 'ostrich' },
      { label: 'Sheep', value: 'sheep' },
      { label: 'Stingray', value: 'stingray' },
    ]}
  />
)}

  <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Band Details</Text>

  <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Band Length</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="e.g., Standard, Long"
    value={bandLength}
    onChangeText={setBandLength}
  />

  <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Band Link</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="e.g., Oyster, Jubilee, President"
    value={bandLink}
    onChangeText={setBandLink}
  />

  <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Band Size (mm)</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="e.g., 20"
    keyboardType="decimal-pad"
    value={bandSize}
    onChangeText={setBandSize}
  />

  <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Band Size (inches)</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="e.g., 8"
    keyboardType="decimal-pad"
    value={bandSizeInches}
    onChangeText={setBandSizeInches}
  />

  <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Band Style</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="e.g., Three-piece link, Mesh"
    value={bandStyle}
    onChangeText={setBandStyle}
  />

  <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Lug Width (mm)</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="e.g., 20"
    keyboardType="decimal-pad"
    value={lugWidth}
    onChangeText={setLugWidth}
  />

  <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Buckle Width (mm)</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="e.g., 18"
    keyboardType="decimal-pad"
    value={buckleWidth}
    onChangeText={setBuckleWidth}
  />

  <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Lug to Lug Length (mm)</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="e.g., 48"
    keyboardType="decimal-pad"
    value={lugToLugLength}
    onChangeText={setLugToLugLength}
  />

  <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Band Color</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="e.g., Black, Silver, Blue"
    value={bandColor}
    onChangeText={setBandColor}
  />
</View>

<View style={styles.section}>
  <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Case Details</Text>

  <AutocompleteInput
    label="Case Back Material"
    value={caseBackMaterial}
    onValueChange={(v) => setCaseBackMaterial(v as CaseBackMaterial)}
    editable={false}
  fieldName="caseBackMaterial"
    options={[
      { label: 'Select case back material', value: '' },
      { label: 'Stainless Steel', value: 'stainlessSteel' },
      { label: 'Titanium', value: 'titanium' },
      { label: 'Ceramic', value: 'ceramic' },
      { label: 'Sapphire Crystal', value: 'sapphire' },
      { label: 'Mineral Glass', value: 'mineral' },
      { label: 'Plastic', value: 'plastic' },
    ]}
  />

  <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Serial Number</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="Enter serial number"
    value={serialNumber}
    onChangeText={(text) => {
      // Mask last 7-8 digits for display
      setSerialNumber(text);
    }}
    secureTextEntry={serialNumber.length > 8}
  />
  {serialNumber.length > 8 && (
    <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>
      Serial (masked): {serialNumber.substring(0, serialNumber.length - 8)}{'*'.repeat(8)}
    </Text>
  )}
</View>

<View style={styles.section}>
  <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Technical Specifications</Text>

  <AutocompleteInput
    label="Movement Type"
    value={movementType}
    onValueChange={(v) => setMovementType(v as MovementType)}
    editable={false}
  fieldName="movementType"
    options={[
      { label: 'Select movement type', value: '' },
      { label: 'Automatic', value: 'automatic' },
      { label: 'Winder', value: 'winder' },
      { label: 'Battery', value: 'battery' },
      { label: 'Solar', value: 'solar' },
      { label: 'Tourbillon', value: 'tourbillon' },
      { label: 'Sub-Seconds', value: 'subSeconds' },
      { label: 'Power Reserve', value: 'powerReserve' },
      { label: 'Quartz', value: 'quartz' },
      { label: 'Digital', value: 'digital' },
      { label: 'Minute Repeater', value: 'minuteRepeater' },
      { label: 'Perpetual Calendar', value: 'perpetualCalendar' },
    ]}
  />

  <Text style={[styles.fieldLabel, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>🧠 Watch Features</Text>
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
      <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>{feature}</Text>
    </View>
  ))}

  <Text style={[styles.fieldLabel, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>🔗 Clasp Type</Text>
  <Picker
    selectedValue={claspType}
    onValueChange={setClaspType}
    style={[styles.picker, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
  >
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Select clasp type" value="" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Deployable Clasp" value="deployable" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Folding Clasp" value="folding" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Velcro" value="velcro" />
  </Picker>

  <Text style={[styles.fieldLabel, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>📏 Watch Size (mm)</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="e.g., 40, 42, 44"
    keyboardType="decimal-pad"
    value={watchSize}
    onChangeText={setWatchSize}
  />

  <Text style={[styles.fieldLabel, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>⬛ Case Shape</Text>
  <Picker
    selectedValue={caseShape}
    onValueChange={setCaseShape}
    style={[styles.picker, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
  >
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Select case shape" value="" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Round" value="round" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Square" value="square" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Rectangle" value="rectangle" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Cushion" value="cushion" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Tonneau" value="tonneau" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Oval" value="oval" />
  </Picker>

  <Text style={[styles.fieldLabel, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>📐 Case Thickness (mm)</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="e.g., 12"
    keyboardType="decimal-pad"
    value={caseThickness}
    onChangeText={setCaseThickness}
  />

  <Text style={[styles.fieldLabel, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>👤 Gender</Text>
  <Picker
    selectedValue={gender}
    onValueChange={setGender}
    style={[styles.picker, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
  >
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Select gender" value="" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Men's" value="mens" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Women's" value="womens" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Unisex" value="unisex" />
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

      <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>{label}</Text>
    </View>
  ))}
</View>


  <AutocompleteInput
    label="Water Resistance"
    value={waterResistance}
    onValueChange={(v) => setWaterResistance(v as WaterResistance)}
    editable={false}
  fieldName="waterResistance"
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
    editable={false}
  fieldName="rarity"
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
  <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Bezel Details</Text>

  <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Bezel Type</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="e.g., Fixed, Rotating, Unidirectional"
    value={bezelType}
    onChangeText={setBezelType}
  />

  <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Bezel Style</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="e.g., Fluted, Smooth, Diamond-Set"
    value={bezelStyle}
    onChangeText={setBezelStyle}
  />

  <Text style={[styles.fieldLabel, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>💎 Bezel Material</Text>
  <Picker
    selectedValue={bezelMaterial}
    onValueChange={setBezelMaterial}
    style={[styles.picker, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
  >
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Select bezel material" value="" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Ceramic" value="ceramic" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Stainless Steel" value="stainlessSteel" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Gold" value="gold" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Platinum" value="platinum" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Aluminum" value="aluminum" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Titanium" value="titanium" />
  </Picker>

  <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Bezel Weight (carats)</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
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
    <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>Aftermarket Bezel</Text>
  </View>

  <View style={styles.checkboxRow}>
    <Checkbox
      value={originalBezel}
      onValueChange={setOriginalBezel}
      color={originalBezel ? '#FF6B35' : undefined}
    />
    <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>Original Bezel</Text>
  </View>
</View>

<View style={styles.section}>
  <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Dial Details</Text>

  <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Dial Style</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="e.g., Sunburst, Textured, Guilloche"
    value={dialStyle}
    onChangeText={setDialStyle}
  />

  <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Dial Color</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="e.g., Black, White, Blue, Champagne"
    value={dialColor}
    onChangeText={setDialColor}
  />

  <Text style={[styles.label, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Dial Material</Text>
  <TextInput
    style={[styles.input, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
    placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
    placeholder="e.g., Metal, Mother of Pearl, Carbon Fiber"
    value={dialMaterial}
    onChangeText={setDialMaterial}
  />

  <Text style={[styles.fieldLabel, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>⏰ Dial Hour Markers</Text>
  <Picker
    selectedValue={dialHourMarkers}
    onValueChange={setDialHourMarkers}
    style={[styles.picker, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
  >
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Select hour markers" value="" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Arabic Numerals" value="arabic" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Roman Numerals" value="roman" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Baton/Stick" value="baton" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Diamond" value="diamond" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Mixed" value="mixed" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="None" value="none" />
  </Picker>

  <Text style={[styles.fieldLabel, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>📟 Dial/Face Type</Text>
  <Picker
    selectedValue={dialType}
    onValueChange={setDialType}
    style={[styles.picker, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFF', color: theme === 'dark' ? '#ddd' : '#1A202C', borderColor: theme === 'dark' ? '#3C3C3E' : '#E2E8F0' }]}
  >
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Select dial type" value="" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Analog" value="analog" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Digital" value="digital" />
    <Picker.Item color={theme === 'dark' ? '#f0f0f0' : '#000'} label="Analog-Digital" value="analogDigital" />
  </Picker>

  <View style={styles.checkboxRow}>
    <Checkbox
      value={aftermarketDial}
      onValueChange={setAftermarketDial}
      color={aftermarketDial ? '#FF6B35' : undefined}
    />
    <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>Aftermarket Dial</Text>
  </View>

  <View style={styles.checkboxRow}>
    <Checkbox
      value={originalDial}
      onValueChange={setOriginalDial}
      color={originalDial ? '#FF6B35' : undefined}
    />
    <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>Original Dial</Text>
  </View>
</View>




<View style={styles.section}>
  <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#BB86FC' : '#6A0DAD' }]}>Additional Features</Text>

  <TouchableOpacity
    style={styles.checkboxRow}
    onPress={() => setHasOriginalPackaging(!hasOriginalPackaging)}
  >
    <Ionicons
      name={hasOriginalPackaging ? 'checkbox' : 'square-outline'}
      size={24}
      color="#FF6B35"
    />
    <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>Original Packaging</Text>
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
    <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>Diamonds / Gemstones</Text>
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
      modelNumber,
      yearOfManufacture,
      isNew,
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
       <GlobalFooter />
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
      paddingTop: 240,
      paddingBottom: 40,
    },
    headerTitleContainer: {
      position: 'absolute',
      top: HEADER_MAX_HEIGHT + 48,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: palette.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
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
    dropdownText: {
      fontSize: 15,
      color: palette.textPrimary,
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
      color: '#6A0DAD',
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