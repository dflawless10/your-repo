import { API_URL } from '@/config';

export interface WatchSpecifications {
  brand: string;
  model: string;
  modelNumber?: string;
  yearOfManufacture?: string;
  condition: string;
  caseMaterial: string;
  bandMaterial: string;
  movementType: string;
  hasOriginalPackaging: boolean;
  hasDiamonds: boolean;
  countryOfOrigin: string;
  warranty: string;
  waterResistance: string;
  rarity: string;
  isNew: boolean;
  bezelMaterial?: string;
  bezelWeight?: string;
  dialMaterial?: string;
  bandLink?: string;
  caseShape?: string;
  originalBezel?: boolean;
  originalDial?: boolean;
  aftermarketBezel?: boolean;
  aftermarketDial?: boolean;
}

export interface PricingResult {
  price: number;
  source: string;
  priceHistory?: { year: string; price: number }[];
  confidence?: string;
  priceRange?: { min: number; max: number };
  sourcesUsed?: string[];
}

const PREMIUM_BRANDS = ['rolex', 'patekphilippe', 'audemarspiguet', 'vacheronconstantin'];

const RARITY_MULTIPLIERS: Record<string, number> = {
  '': 1.0,
  'common': 1.0,
  'uncommon': 1.15,
  'rare': 1.30,
  'veryRare': 1.50,
  'extremelyRare': 2.00
};

export async function fetchAggregatedPricing(specs: WatchSpecifications): Promise<PricingResult | null> {
  try {
    const response = await fetch(`${API_URL}/api/appraise-aggregated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(specs),
    });

    if (!response.ok) return null;

    const result = await response.json();

    if (result.success && result.estimated_price) {
      let sourceDetails = `📊 ${result.confidence.toUpperCase()} confidence\n`;
      sourceDetails += `📈 Price range: $${result.price_range.min.toLocaleString()} - $${result.price_range.max.toLocaleString()}\n`;
      sourceDetails += `🔍 Sources: ${result.sources_used.join(', ')}\n`;
      sourceDetails += `📦 Data points: ${result.data_points}\n\n`;

      if (result.source_prices) {
        sourceDetails += 'Source Breakdown:\n';
        Object.entries(result.source_prices).forEach(([source, price]) => {
          sourceDetails += `  • ${source}: $${(price as number).toLocaleString()}\n`;
        });
      }

      return {
        price: Math.round(result.estimated_price),
        source: sourceDetails,
        confidence: result.confidence,
        priceRange: result.price_range,
        sourcesUsed: result.sources_used
      };
    }

    return null;
  } catch (error) {
    console.error('Aggregated pricing error:', error);
    return null;
  }
}

export function calculateLocalPricing(
  basePrice: number,
  specs: WatchSpecifications
): number {
  const brandKey = specs.brand.toLowerCase().replace(/\s+/g, '');
  const isPremiumBrand = PREMIUM_BRANDS.includes(brandKey);
  const watchAge = specs.yearOfManufacture ? new Date().getFullYear() - parseInt(specs.yearOfManufacture) : 0;

  let finalPrice = basePrice;

  // Apply condition multiplier
  finalPrice *= getConditionMultiplier(specs.condition, isPremiumBrand, watchAge, specs.isNew);

  // Material adjustments
  finalPrice *= getMaterialMultiplier(specs.caseMaterial);

  // Feature bonuses
  if (specs.hasOriginalPackaging) finalPrice *= 1.10;
  if (specs.hasDiamonds) finalPrice *= 1.20;
  if (specs.movementType === 'tourbillon') finalPrice *= 1.50;

  // Bezel bonuses
  finalPrice *= getBezelMultiplier(specs.bezelMaterial, specs.bezelWeight);

  // Dial bonuses
  finalPrice *= getDialMultiplier(specs.dialMaterial);

  // Band bonuses
  finalPrice *= getBandMultiplier(specs.bandLink);

  // Case shape bonus
  finalPrice *= getCaseShapeMultiplier(specs.caseShape);

  // Originality bonus/penalty
  if (specs.originalBezel && specs.originalDial) {
    finalPrice *= 1.10;
  } else if (specs.aftermarketBezel || specs.aftermarketDial) {
    finalPrice *= 0.85;
  }

  // Rarity adjustment
  finalPrice *= RARITY_MULTIPLIERS[specs.rarity] || 1.0;

  // Country of origin premium
  if (specs.countryOfOrigin === 'switzerland') finalPrice *= 1.10;

  return Math.round(finalPrice);
}

function getConditionMultiplier(condition: string, isPremiumBrand: boolean, watchAge: number, isNew: boolean): number {
  let multiplier = 1.0;

  // Base condition multipliers
  if (condition === 'poor') {
    multiplier = isPremiumBrand ? 0.65 : 0.50;
  } else if (condition === 'fair') {
    multiplier = isPremiumBrand ? 0.80 : 0.70;
  } else if (condition === 'good') {
    multiplier = isPremiumBrand ? 0.92 : 0.85;
  } else if (condition === 'excellent') {
    multiplier = isPremiumBrand ? 1.00 : 0.98;
  }

  // Age depreciation (only for non-vintage, < 25 years)
  if (watchAge > 0 && watchAge < 25 && !isNew) {
    if (watchAge <= 5) {
      multiplier *= (1 - (watchAge * 0.02));
    } else if (watchAge <= 15) {
      multiplier *= (1 - (5 * 0.02)) * (1 - ((watchAge - 5) * 0.015));
    } else {
      multiplier *= (1 - (5 * 0.02)) * (1 - (10 * 0.015)) * (1 - ((watchAge - 15) * 0.005));
    }
  }

  // Vintage appreciation (25+ years for premium brands)
  if (watchAge >= 25 && isPremiumBrand) {
    multiplier *= 1.15;
  }

  return multiplier;
}

function getMaterialMultiplier(caseMaterial: string): number {
  if (caseMaterial.includes('platinum')) return 1.50;
  if (caseMaterial.includes('23kt') || caseMaterial.includes('22kt')) return 1.40;
  if (caseMaterial.includes('18kt') || caseMaterial === 'yellowGold' || caseMaterial === 'roseGold') return 1.35;
  if (caseMaterial.includes('14kt') || caseMaterial.includes('10kt')) return 1.20;
  return 1.0;
}

function getBezelMultiplier(bezelMaterial?: string, bezelWeight?: string): number {
  let multiplier = 1.0;

  const bezelMat = bezelMaterial?.toLowerCase() || '';
  if (bezelMat.includes('ceramic')) multiplier *= 1.15;
  else if (bezelMat.includes('platinum')) multiplier *= 1.25;
  else if (bezelMat.includes('gold')) multiplier *= 1.20;

  // Note: bezelWeight is additive, not multiplicative
  // This would need to be handled separately in the calling function
  return multiplier;
}

function getDialMultiplier(dialMaterial?: string): number {
  const dialMat = dialMaterial?.toLowerCase() || '';
  if (dialMat.includes('diamond')) return 1.25;
  if (dialMat.includes('meteorite')) return 1.20;
  if (dialMat.includes('enamel')) return 1.15;
  if (dialMat.includes('ceramic')) return 1.12;
  if (dialMat.includes('mother of pearl')) return 1.10;
  return 1.0;
}

function getBandMultiplier(bandLink?: string): number {
  const bandLnk = bandLink?.toLowerCase() || '';
  if (bandLnk.includes('president')) return 1.15;
  if (bandLnk.includes('jubilee')) return 1.08;
  if (bandLnk.includes('oyster')) return 1.05;
  return 1.0;
}

function getCaseShapeMultiplier(caseShape?: string): number {
  const caseShp = caseShape?.toLowerCase() || '';
  if (caseShp.includes('tonneau') || caseShp.includes('cushion')) return 1.08;
  if (caseShp.includes('rectangular') || caseShp.includes('square')) return 1.05;
  return 1.0;
}

export async function fetchBackendPricing(specs: WatchSpecifications): Promise<PricingResult | null> {
  try {
    const response = await fetch(`${API_URL}/api/appraise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(specs)
    });

    if (!response.ok) return null;

    const result = await response.json();

    if (result.success) {
      return {
        price: result.estimatedValue,
        source: 'Backend API'
      };
    }

    return null;
  } catch (error) {
    console.error('Backend pricing error:', error);
    return null;
  }
}
