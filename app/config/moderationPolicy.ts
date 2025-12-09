/**
 * BidGoat Content Moderation Policy
 * Standard Operating System Rules for Platform Integrity
 *
 * This configuration defines all prohibited content categories,
 * moderation workflows, and trust scoring for the BidGoat platform.
 */

// ============================================================================
// MODERATION WORKFLOW CONFIGURATION
// ============================================================================

export const MODERATION_WORKFLOW = {
  // Real-time prevention (Layer 1)
  PRE_SUBMISSION: {
    enabled: true,
    debounceMs: 500,
    showWarnings: true,
    blockSubmission: true, // Prevent submission if violations found
  },

  // Post-submission review (Layer 2)
  POST_SUBMISSION: {
    enabled: true,
    reviewWindowHours: 24, // First 24 hours are critical
    autoFlagThreshold: 60, // Items with score < 60 get flagged
    autoRejectThreshold: 30, // Items with score < 30 auto-rejected
  },

  // Community reporting (Layer 3)
  COMMUNITY_REPORTING: {
    enabled: true,
    reportsToFlag: 3, // 3 reports triggers admin review
    reportsToAutoHide: 5, // 5 reports temporarily hides listing
    reportCooldownHours: 24, // Can't report same item twice in 24h
  },

  // Trust-based moderation
  REPUTATION_BASED: {
    enabled: true,
    verifiedSellerThreshold: 10, // 10+ successful sales = verified
    trustedSellerThreshold: 50, // 50+ successful sales = trusted
    skipModerationForTrusted: false, // Still moderate, but lower priority
    reduceScrutinyForVerified: true, // Less strict on verified sellers
  },
} as const;

// ============================================================================
// PROHIBITED CONTENT CATEGORIES
// ============================================================================

export const PROHIBITED_CONTENT = {

  // ------------------------------------------------------------------------
  // 1. LANGUAGE VIOLATIONS
  // ------------------------------------------------------------------------
  LANGUAGE_VIOLATIONS: {
    profanity: {
      severity: 'high' as const,
      scoreImpact: -50,
      description: 'Profanity, obscenities, or vulgar language',
      examples: ['f*ck', 'sh*t', 'damn', 'hell'],
      blockSubmission: true,
    },
    hateSpeech: {
      severity: 'high' as const,
      scoreImpact: -100,
      description: 'Hate speech, slurs, or discriminatory language',
      examples: ['racial slurs', 'religious attacks', 'homophobic terms'],
      blockSubmission: true,
      autoReject: true,
    },
    sexualContent: {
      severity: 'high' as const,
      scoreImpact: -80,
      description: 'Sexual content, innuendo, or explicit language',
      examples: ['sexual references', 'adult content'],
      blockSubmission: true,
    },
    threats: {
      severity: 'high' as const,
      scoreImpact: -100,
      description: 'Threats, harassment, or intimidation',
      examples: ['threatening buyers', 'harassment'],
      blockSubmission: true,
      autoReject: true,
      reportToAuthorities: true,
    },
    spam: {
      severity: 'medium' as const,
      scoreImpact: -30,
      description: 'Spam, excessive capitalization, or repeated characters',
      examples: ['LOOK AT THIS!!!!', 'BUY NOW!!!!!!', 'aaaaamazing'],
      blockSubmission: false,
      showWarning: true,
    },
  },

  // ------------------------------------------------------------------------
  // 2. LISTING VIOLATIONS
  // ------------------------------------------------------------------------
  LISTING_VIOLATIONS: {
    misleadingDescription: {
      severity: 'high' as const,
      scoreImpact: -60,
      description: 'Misleading, false, or deceptive descriptions',
      examples: ['claiming 24k when it\'s plated', 'fake brand claims'],
      blockSubmission: false,
      requiresHumanReview: true,
    },
    falseClaims: {
      severity: 'high' as const,
      scoreImpact: -70,
      description: 'False material claims or wrong brand attribution',
      examples: ['fake Rolex', 'claiming diamond when it\'s CZ'],
      blockSubmission: false,
      requiresHumanReview: true,
    },
    offTopicContent: {
      severity: 'low' as const,
      scoreImpact: -20,
      description: 'Content not related to jewelry, watches, or diamonds',
      examples: ['electronics', 'clothing', 'furniture'],
      blockSubmission: false,
    },
    contactInfo: {
      severity: 'high' as const,
      scoreImpact: -80,
      description: 'Contact information to take sales off-platform',
      examples: ['email addresses', 'phone numbers', 'social media handles', 'WhatsApp'],
      blockSubmission: true,
      patterns: [
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, // Email
        /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // Phone
        /\b\w+\s*(at|AT|@)\s*\w+\s*(dot|DOT|\.)\s*\w+\b/gi, // Email variants
        /\b(whatsapp|telegram|signal|facebook|instagram|twitter|snapchat)\b/gi, // Social media
      ],
    },
    externalLinks: {
      severity: 'high' as const,
      scoreImpact: -70,
      description: 'External links (except authorized domains)',
      examples: ['personal websites', 'competitor links', 'phishing links'],
      blockSubmission: true,
      authorizedDomains: ['gia.edu', 'agta.org'], // Certification sites OK
      patterns: [
        /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi,
      ],
    },
  },

  // ------------------------------------------------------------------------
  // 3. PHOTO VIOLATIONS
  // ------------------------------------------------------------------------
  PHOTO_VIOLATIONS: {
    stockPhotos: {
      severity: 'high' as const,
      scoreImpact: -60,
      description: 'Stock photos or images not of actual item',
      examples: ['catalog images', 'promotional photos'],
      blockSubmission: false,
      requiresHumanReview: true,
      requireActualPhotos: true,
    },
    watermarkedImages: {
      severity: 'medium' as const,
      scoreImpact: -40,
      description: 'Watermarked images from other websites',
      examples: ['images with other site logos', 'copyrighted photos'],
      blockSubmission: false,
      requiresHumanReview: true,
    },
    inappropriateImagery: {
      severity: 'high' as const,
      scoreImpact: -100,
      description: 'Inappropriate, offensive, or explicit imagery',
      examples: ['nudity', 'violence', 'offensive symbols'],
      blockSubmission: true,
      autoReject: true,
    },
    poorQuality: {
      severity: 'low' as const,
      scoreImpact: -15,
      description: 'Blurry, unclear, or low-quality photos',
      examples: ['out of focus', 'too dark', 'pixelated'],
      blockSubmission: false,
      showWarning: true,
    },
    mismatchedPhotos: {
      severity: 'high' as const,
      scoreImpact: -70,
      description: 'Photos that don\'t match item description',
      examples: ['showing different item', 'wrong color/style'],
      blockSubmission: false,
      requiresHumanReview: true,
    },
  },

  // ------------------------------------------------------------------------
  // 4. ADDITIONAL VIOLATIONS
  // ------------------------------------------------------------------------
  ADDITIONAL_VIOLATIONS: {
    priceManipulation: {
      severity: 'high' as const,
      scoreImpact: -60,
      description: 'Price manipulation or off-platform payment solicitation',
      examples: ['DM for discount', 'contact me for better price', 'PayPal me directly'],
      blockSubmission: true,
      patterns: [
        /\b(dm|message|contact|text|email|call).*\b(me|for).*\b(price|discount|deal|offer)\b/gi,
        /\b(paypal|venmo|cashapp|zelle).*\b(me|directly)\b/gi,
      ],
    },
    pressureTactics: {
      severity: 'medium' as const,
      scoreImpact: -40,
      description: 'Pressuring buyers with urgency or threats',
      examples: ['buy now or I\'ll delete', 'last chance', 'offer expires in 1 hour'],
      blockSubmission: false,
      showWarning: true,
      patterns: [
        /\b(buy now or|last chance|limited time|offer expires|act fast|hurry)\b/gi,
      ],
    },
    medicalClaims: {
      severity: 'medium' as const,
      scoreImpact: -50,
      description: 'Unverified medical or health claims',
      examples: ['healing crystals cure cancer', 'magnetic therapy', 'energy healing'],
      blockSubmission: false,
      requiresHumanReview: true,
      patterns: [
        /\b(cure|heal|treatment|therapy|medical|health benefits).*\b(crystal|stone|gem|jewelry)\b/gi,
      ],
    },
    counterfeitIndicators: {
      severity: 'high' as const,
      scoreImpact: -90,
      description: 'Language indicating counterfeit or replica items',
      examples: ['AAA replica', 'looks like authentic', 'designer inspired', '1:1 copy'],
      blockSubmission: true,
      autoReject: true,
      patterns: [
        /\b(replica|fake|counterfeit|knock-?off|inspired by|looks like|copy of|dupe)\b/gi,
        /\b(AAA|1:1)\b.*\b(replica|copy|version)\b/gi,
      ],
    },
  },
} as const;

// ============================================================================
// REPUTATION & TRUST SCORING
// ============================================================================

export interface UserTrustProfile {
  userId: number;
  totalSales: number;
  successfulSales: number;
  rating: number; // 0-5 stars
  accountAgeMonths: number;
  verificationStatus: 'unverified' | 'email_verified' | 'phone_verified' | 'identity_verified';
  moderationHistory: {
    totalFlags: number;
    totalRejections: number;
    cleanListings: number;
  };
}

export function calculateTrustScore(profile: UserTrustProfile): number {
  let trustScore = 0;

  // Sales history (40 points max)
  trustScore += Math.min(profile.successfulSales * 0.8, 40);

  // Rating (20 points max)
  trustScore += (profile.rating / 5) * 20;

  // Account age (15 points max)
  trustScore += Math.min(profile.accountAgeMonths * 0.5, 15);

  // Verification status (15 points max)
  const verificationPoints = {
    unverified: 0,
    email_verified: 5,
    phone_verified: 10,
    identity_verified: 15,
  };
  trustScore += verificationPoints[profile.verificationStatus];

  // Moderation history (10 points max, can be negative)
  const moderationScore = profile.moderationHistory.cleanListings * 0.5
    - profile.moderationHistory.totalFlags * 2
    - profile.moderationHistory.totalRejections * 5;
  trustScore += Math.max(Math.min(moderationScore, 10), -20);

  return Math.max(0, Math.min(100, trustScore));
}

export function getUserTrustLevel(trustScore: number): 'untrusted' | 'new' | 'verified' | 'trusted' | 'elite' {
  if (trustScore < 20) return 'untrusted';
  if (trustScore < 40) return 'new';
  if (trustScore < 60) return 'verified';
  if (trustScore < 80) return 'trusted';
  return 'elite';
}

export function getModerationSeverityForUser(trustLevel: ReturnType<typeof getUserTrustLevel>): number {
  // Returns multiplier for moderation scrutiny (higher = more strict)
  const severityMultipliers = {
    untrusted: 1.5,  // 50% more strict
    new: 1.2,        // 20% more strict
    verified: 1.0,   // Standard moderation
    trusted: 0.8,    // 20% less strict
    elite: 0.6,      // 40% less strict
  };
  return severityMultipliers[trustLevel];
}

// ============================================================================
// COMMUNITY REPORTING REASONS
// ============================================================================

export const REPORT_REASONS = [
  { value: 'misleading', label: 'Misleading or False Description', severity: 'high' },
  { value: 'counterfeit', label: 'Suspected Counterfeit Item', severity: 'high' },
  { value: 'inappropriate_photo', label: 'Inappropriate Photo', severity: 'high' },
  { value: 'wrong_category', label: 'Wrong Category', severity: 'low' },
  { value: 'spam', label: 'Spam or Irrelevant Content', severity: 'medium' },
  { value: 'offensive', label: 'Offensive Content', severity: 'high' },
  { value: 'contact_info', label: 'Contains Contact Information', severity: 'high' },
  { value: 'price_manipulation', label: 'Price Manipulation', severity: 'medium' },
  { value: 'stolen', label: 'Suspected Stolen Item', severity: 'high' },
  { value: 'other', label: 'Other (Specify)', severity: 'medium' },
] as const;

// ============================================================================
// AUTO-MODERATION ACTIONS
// ============================================================================

export interface ModerationAction {
  action: 'allow' | 'warn' | 'flag' | 'reject';
  reason: string;
  requiresHumanReview: boolean;
  notifyUser: boolean;
  blockSubmission: boolean;
}

export function determineModerationAction(
  score: number,
  violations: any[],
  trustLevel: ReturnType<typeof getUserTrustLevel>
): ModerationAction {
  const severityMultiplier = getModerationSeverityForUser(trustLevel);
  const adjustedScore = score * severityMultiplier;

  // Check for auto-reject violations
  const hasAutoReject = violations.some(v => v.autoReject);
  if (hasAutoReject) {
    return {
      action: 'reject',
      reason: 'Content contains prohibited material that violates community guidelines',
      requiresHumanReview: false,
      notifyUser: true,
      blockSubmission: true,
    };
  }

  // Score-based actions
  if (adjustedScore < 30) {
    return {
      action: 'reject',
      reason: 'Content quality does not meet platform standards',
      requiresHumanReview: true,
      notifyUser: true,
      blockSubmission: true,
    };
  }

  if (adjustedScore < 60) {
    return {
      action: 'flag',
      reason: 'Content flagged for admin review due to policy concerns',
      requiresHumanReview: true,
      notifyUser: false,
      blockSubmission: false,
    };
  }

  if (adjustedScore < 80) {
    return {
      action: 'warn',
      reason: 'Content has minor issues that should be corrected',
      requiresHumanReview: false,
      notifyUser: true,
      blockSubmission: false,
    };
  }

  return {
    action: 'allow',
    reason: 'Content meets platform standards',
    requiresHumanReview: false,
    notifyUser: false,
    blockSubmission: false,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type ProhibitedContentCategory = keyof typeof PROHIBITED_CONTENT;
export type ViolationType = 'language' | 'listing' | 'photo' | 'additional';
export type Severity = 'low' | 'medium' | 'high';
