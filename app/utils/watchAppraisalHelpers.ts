import { WatchSpecifications, PricingResult, fetchAggregatedPricing, calculateLocalPricing, fetchBackendPricing } from '../hooks/useWatchPricing';
import { validateContentQuick } from './contentModeration';

export interface LocalPricingData {
  [brand: string]: {
    [model: string]: {
      basePrice: number;
      modelNumbers?: { [modelNumber: string]: number };
      yearPrices?: { [year: string]: number };
    };
  };
}

export function validateWatchInputs(brandName: string, modelName: string): { isValid: boolean; errorMessage?: string } {
  try {
    const brandModeration = validateContentQuick(brandName, 'Brand name');
    if (!brandModeration.isValid) {
      return { isValid: false, errorMessage: brandModeration.errorMessage };
    }

    const modelModeration = validateContentQuick(modelName, 'Model name');
    if (!modelModeration.isValid) {
      return { isValid: false, errorMessage: modelModeration.errorMessage };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Content moderation error:', error);
    return { isValid: true }; // Continue if moderation fails
  }
}

export function findLocalPricing(
  watchPricesData: LocalPricingData,
  brandName: string,
  modelName: string,
  modelNumber?: string,
  yearOfManufacture?: string
): { basePrice: number; source: string; yearPrices?: { [year: string]: number } } | null {
  const brandKey = brandName.toLowerCase().replace(/\s+/g, '');
  const modelKey = modelName.toLowerCase().replace(/\s+/g, '');

  const brandData = watchPricesData[brandKey];
  const modelData = brandData?.[modelKey];

  if (!modelData) return null;

  let basePrice: number;
  let source: string;

  // Priority 1: Specific model number price
  if (modelNumber && modelData.modelNumbers?.[modelNumber]) {
    basePrice = modelData.modelNumbers[modelNumber];
    source = `Model ${modelNumber} base price`;
  }
  // Priority 2: Year-specific price
  else if (yearOfManufacture && modelData.yearPrices?.[yearOfManufacture]) {
    basePrice = modelData.yearPrices[yearOfManufacture];
    source = `${yearOfManufacture} market price`;
  }
  // Priority 3: Base price
  else {
    basePrice = modelData.basePrice;
    source = 'Base model price';
  }

  if (!basePrice || basePrice === 0) return null;

  return {
    basePrice,
    source,
    yearPrices: modelData.yearPrices
  };
}

export function formatPricingAlert(result: PricingResult, condition: string, isNew: boolean): string {
  let message = `💰 Watch appraised at $${result.price.toLocaleString()}\n\n`;

  if (result.confidence) {
    message += `📊 Confidence: ${result.confidence.toUpperCase()}\n`;
  }

  if (result.priceRange) {
    message += `📈 Range: $${result.priceRange.min.toLocaleString()} - $${result.priceRange.max.toLocaleString()}\n`;
  }

  if (result.sourcesUsed) {
    message += `🔍 Sources: ${result.sourcesUsed.join(', ')}\n`;
  }

  message += `🔧 Condition: ${condition}\n`;
  message += isNew ? '✨ New' : '📦 Pre-owned';

  return message;
}

export function extractPriceHistory(yearPrices?: { [year: string]: number }): { year: string; price: number }[] {
  if (!yearPrices) return [];

  return Object.entries(yearPrices)
    .map(([year, price]) => ({ year, price: price as number }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));
}
