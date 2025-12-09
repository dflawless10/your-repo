/**
 * BidGoat Content Moderation System - Layer 1: Prevention
 * Client-side validation to prevent policy violations before submission
 *
 * Integrates with moderationPolicy.ts for comprehensive rule enforcement
 */

import { COMPREHENSIVE_PROFANITY_LIST } from './comprehensiveProfanityList';
import { containsProhibitedPhrase } from './prohibitedPhrases';
import { PROHIBITED_CONTENT } from 'app/config/moderationPolicy';

// Use a comprehensive profanity list (271+ words)
const PROFANITY_LIST = COMPREHENSIVE_PROFANITY_LIST;

// Import patterns from policy configuration
const CONTACT_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  url: /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi,
  emailVariants: /\b\w+\s*(at|AT|@)\s*\w+\s*(dot|DOT|\.)\s*\w+\b/gi,
  phoneVariants: /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  socialMedia: /\b(whatsapp|telegram|signal|facebook|instagram|twitter|snapchat)\b/gi,
};

// Spam patterns
const SPAM_PATTERNS = {
  repeatedChars: /(.)\1{4,}/g,
  allCaps: /^[A-Z\s!?.,]{20,}$/,
  excessivePunctuation: /[!?]{3,}/g,
};

// Additional violation patterns from policy
const ADDITIONAL_PATTERNS = {
  priceManipulation: /\b(dm|message|contact|text|email|call).*\b(me|for).*\b(price|discount|deal|offer)\b/gi,
  pressureTactics: /\b(buy now or|last chance|limited time|offer expires|act fast|hurry)\b/gi,
  medicalClaims: /\b(cure|heal|treatment|therapy|medical|health benefits).*\b(crystal|stone|gem|jewelry)\b/gi,
  counterfeitIndicators: /\b(replica|fake|counterfeit|knock-?off|inspired by|looks like|copy of|dupe)\b/gi,
};

export interface ModerationResult {
  isValid: boolean;
  violations: ModerationViolation[];
  score: number; // 0-100, lower is worse
  shouldBlockSubmission: boolean;
  requiresHumanReview: boolean;
}

export interface ModerationViolation {
  type: 'profanity' | 'contact_info' | 'spam' | 'suspicious' | 'price_manipulation' | 'counterfeit' | 'pressure_tactics' | 'medical_claims';
  severity: 'low' | 'medium' | 'high';
  message: string;
  matches?: string[];
  blockSubmission?: boolean;
}

/**
 * Main content moderation function - Enhanced with comprehensive policy checks
 */
export function moderateContent(text: string, fieldName: string = 'text'): ModerationResult {
  const violations: ModerationViolation[] = [];
  let score = 100;
  let shouldBlockSubmission = false;
  let requiresHumanReview = false;

  // 1. Check for profanity (LANGUAGE_VIOLATIONS)
  const profanityCheck = checkProfanity(text);
  if (profanityCheck.found) {
    violations.push({
      type: 'profanity',
      severity: 'high',
      message: `${fieldName} contains inappropriate language`,
      matches: profanityCheck.matches,
      blockSubmission: true,
    });
    score -= PROHIBITED_CONTENT.LANGUAGE_VIOLATIONS.profanity.scoreImpact;
    shouldBlockSubmission = true;
  }

  // 2. Check for contact information (LISTING_VIOLATIONS)
  const contactCheck = checkContactInfo(text);
  if (contactCheck.found) {
    violations.push({
      type: 'contact_info',
      severity: 'high',
      message: `${fieldName} contains contact information (email, phone, URLs, or social media). Please remove all contact details - buyers can message you through BidGoat.`,
      matches: contactCheck.matches,
      blockSubmission: true,
    });
    score -= PROHIBITED_CONTENT.LISTING_VIOLATIONS.contactInfo.scoreImpact;
    shouldBlockSubmission = true;
  }

  // 3. Check for spam patterns (LANGUAGE_VIOLATIONS)
  const spamCheck = checkSpamPatterns(text);
  if (spamCheck.found) {
    violations.push({
      type: 'spam',
      severity: 'medium',
      message: `${fieldName} appears to be spam or low-quality content`,
      matches: spamCheck.matches,
      blockSubmission: false,
    });
    score -= PROHIBITED_CONTENT.LANGUAGE_VIOLATIONS.spam.scoreImpact;
  }

  // 4. Check for price manipulation (ADDITIONAL_VIOLATIONS)
  const priceManipCheck = checkPriceManipulation(text);
  if (priceManipCheck.found) {
    violations.push({
      type: 'price_manipulation',
      severity: 'high',
      message: `${fieldName} contains price manipulation language. All transactions must go through BidGoat.`,
      matches: priceManipCheck.matches,
      blockSubmission: true,
    });
    score -= PROHIBITED_CONTENT.ADDITIONAL_VIOLATIONS.priceManipulation.scoreImpact;
    shouldBlockSubmission = true;
  }

  // 5. Check for counterfeit indicators (ADDITIONAL_VIOLATIONS)
  const counterfeitCheck = checkCounterfeitIndicators(text);
  if (counterfeitCheck.found) {
    violations.push({
      type: 'counterfeit',
      severity: 'high',
      message: `${fieldName} contains language indicating counterfeit or replica items. BidGoat prohibits counterfeit goods.`,
      matches: counterfeitCheck.matches,
      blockSubmission: true,
    });
    score -= PROHIBITED_CONTENT.ADDITIONAL_VIOLATIONS.counterfeitIndicators.scoreImpact;
    shouldBlockSubmission = true;
    requiresHumanReview = true;
  }

  // 6. Check for pressure tactics (ADDITIONAL_VIOLATIONS)
  const pressureCheck = checkPressureTactics(text);
  if (pressureCheck.found) {
    violations.push({
      type: 'pressure_tactics',
      severity: 'medium',
      message: `${fieldName} contains high-pressure sales language`,
      matches: pressureCheck.matches,
      blockSubmission: false,
    });
    score -= PROHIBITED_CONTENT.ADDITIONAL_VIOLATIONS.pressureTactics.scoreImpact;
  }

  // 7. Check for medical claims (ADDITIONAL_VIOLATIONS)
  const medicalCheck = checkMedicalClaims(text);
  if (medicalCheck.found) {
    violations.push({
      type: 'medical_claims',
      severity: 'medium',
      message: `${fieldName} contains unverified medical or health claims`,
      matches: medicalCheck.matches,
      blockSubmission: false,
    });
    score -= PROHIBITED_CONTENT.ADDITIONAL_VIOLATIONS.medicalClaims.scoreImpact;
    requiresHumanReview = true;
  }

  // 8. Check for prohibited phrases
  const phraseCheck = containsProhibitedPhrase(text);
  if (phraseCheck.found) {
    violations.push({
      type: 'suspicious',
      severity: 'high',
      message: `${fieldName} contains prohibited phrases that violate our content policy`,
      matches: phraseCheck.matches,
      blockSubmission: false,
    });
    score -= 40;
    requiresHumanReview = true;
  }

  return {
    isValid: violations.length === 0,
    violations,
    score: Math.max(0, score),
    shouldBlockSubmission,
    requiresHumanReview,
  };
}

/**
 * Check for profanity
 */
function checkProfanity(text: string): { found: boolean; matches: string[] } {
  const lowerText = text.toLowerCase();
  const matches: string[] = [];

  for (const word of PROFANITY_LIST) {
    try {
      // Skip words with special regex characters that might cause issues
      if (/[*+?^${}()|[\]\\@#%&]/.test(word)) {
        // For words with special chars, just do simple string matching
        if (lowerText.includes(word.toLowerCase())) {
          matches.push(word);
        }
        continue;
      }

      // Escape special regex characters in the word
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Check for exact word match (with word boundaries)
      // Use simple test to avoid complex regex issues
      const wordPattern = `\\b${escapedWord}\\b`;
      const regex = new RegExp(wordPattern, 'i');

      if (regex.test(lowerText)) {
        matches.push(word);
      }
    } catch (error) {
      // Skip words that cause regex errors - fail silently
      console.warn(`Skipping profanity check for word: ${word}`);
    }
  }

  return {
    found: matches.length > 0,
    matches: [...new Set(matches)], // Remove duplicates
  };
}

/**
 * Check for contact information
 */
function checkContactInfo(text: string): { found: boolean; matches: string[] } {
  const matches: string[] = [];

  // Check email
  const emailMatches = text.match(CONTACT_PATTERNS.email);
  if (emailMatches) {
    matches.push(...emailMatches);
  }

  // Check email variants (e.g., "email at gmail dot com")
  const emailVariantMatches = text.match(CONTACT_PATTERNS.emailVariants);
  if (emailVariantMatches) {
    matches.push(...emailVariantMatches);
  }

  // Check phone numbers
  const phoneMatches = text.match(CONTACT_PATTERNS.phone);
  if (phoneMatches) {
    matches.push(...phoneMatches);
  }

  // Check URLs
  const urlMatches = text.match(CONTACT_PATTERNS.url);
  if (urlMatches) {
    matches.push(...urlMatches);
  }

  // Check social media
  const socialMediaMatches = text.match(CONTACT_PATTERNS.socialMedia);
  if (socialMediaMatches) {
    matches.push(...socialMediaMatches);
  }

  return {
    found: matches.length > 0,
    matches,
  };
}

/**
 * Check for price manipulation language
 */
function checkPriceManipulation(text: string): { found: boolean; matches: string[] } {
  const matches: string[] = [];
  const priceManipMatches = text.match(ADDITIONAL_PATTERNS.priceManipulation);

  if (priceManipMatches) {
    matches.push(...priceManipMatches);
  }

  return {
    found: matches.length > 0,
    matches,
  };
}

/**
 * Check for counterfeit indicators
 */
function checkCounterfeitIndicators(text: string): { found: boolean; matches: string[] } {
  const matches: string[] = [];
  const counterfeitMatches = text.match(ADDITIONAL_PATTERNS.counterfeitIndicators);

  if (counterfeitMatches) {
    matches.push(...counterfeitMatches);
  }

  return {
    found: matches.length > 0,
    matches,
  };
}

/**
 * Check for pressure tactics
 */
function checkPressureTactics(text: string): { found: boolean; matches: string[] } {
  const matches: string[] = [];
  const pressureMatches = text.match(ADDITIONAL_PATTERNS.pressureTactics);

  if (pressureMatches) {
    matches.push(...pressureMatches);
  }

  return {
    found: matches.length > 0,
    matches,
  };
}

/**
 * Check for medical claims
 */
function checkMedicalClaims(text: string): { found: boolean; matches: string[] } {
  const matches: string[] = [];
  const medicalMatches = text.match(ADDITIONAL_PATTERNS.medicalClaims);

  if (medicalMatches) {
    matches.push(...medicalMatches);
  }

  return {
    found: matches.length > 0,
    matches,
  };
}

/**
 * Check for spam patterns
 */
function checkSpamPatterns(text: string): { found: boolean; matches: string[] } {
  const matches: string[] = [];

  // Check for repeated characters
  if (SPAM_PATTERNS.repeatedChars.test(text)) {
    matches.push('Excessive repeated characters');
  }

  // Check for all caps (if text is long enough)
  if (text.length > 20 && SPAM_PATTERNS.allCaps.test(text)) {
    matches.push('Excessive capitalization');
  }

  // Check for excessive punctuation
  if (SPAM_PATTERNS.excessivePunctuation.test(text)) {
    matches.push('Excessive punctuation');
  }

  return {
    found: matches.length > 0,
    matches,
  };
}

/**
 * Quick validation for forms (returns user-friendly message)
 */
export function validateContentQuick(text: string, fieldName: string = 'Content'): {
  isValid: boolean;
  errorMessage?: string;
  shouldBlockSubmission?: boolean;
} {
  try {
    // Skip empty or undefined text
    if (!text || text.trim().length === 0) {
      return { isValid: true, shouldBlockSubmission: false };
    }

    console.log(`🔍 Moderating ${fieldName}:`, text.substring(0, 50));
    const result = moderateContent(text, fieldName);

    if (!result.isValid) {
      console.log(`❌ Moderation failed for ${fieldName}:`, result.violations);
    }

  if (!result.isValid) {
    const highSeverityViolations = result.violations.filter(v => v.severity === 'high');

    if (highSeverityViolations.length > 0) {
      const violation = highSeverityViolations[0];

      // Build policy reminder based on violation type
      let policyReminder = '\n\nBidGoat Policy:\n';
      if (violation.type === 'profanity') {
        policyReminder += '• No profanity or offensive language\n• Keep descriptions professional';
      } else if (violation.type === 'contact_info') {
        policyReminder += '• No contact information (email, phone, URLs, social media)\n• Buyers can message you through BidGoat';
      } else if (violation.type === 'price_manipulation') {
        policyReminder += '• All transactions must go through BidGoat\n• No off-platform payment solicitation';
      } else if (violation.type === 'counterfeit') {
        policyReminder += '• Counterfeit and replica items are strictly prohibited\n• Only authentic items are allowed';
      }

      return {
        isValid: false,
        errorMessage: `❌ ${violation.message}${policyReminder}\n\nPlease revise and try again.`,
        shouldBlockSubmission: result.shouldBlockSubmission,
      };
    }

    // Medium severity
    const mediumViolation = result.violations[0];
    return {
      isValid: false,
      errorMessage: `⚠️ ${mediumViolation.message}\n\nPlease improve your content quality.`,
      shouldBlockSubmission: false,
    };
  }

  return { isValid: true, shouldBlockSubmission: false };
  } catch (error) {
    // If moderation fails, log error and allow content through
    console.error('Content moderation error:', error);
    return { isValid: true, shouldBlockSubmission: false };
  }
}

/**
 * Clean text by removing/replacing violations (optional - use carefully)
 */
export function sanitizeContent(text: string): string {
  let cleaned = text;

  // Remove URLs
  cleaned = cleaned.replace(CONTACT_PATTERNS.url, '[URL removed]');

  // Remove emails
  cleaned = cleaned.replace(CONTACT_PATTERNS.email, '[email removed]');

  // Remove phone numbers
  cleaned = cleaned.replace(CONTACT_PATTERNS.phone, '[phone removed]');

  return cleaned;
}

/**
 * Get moderation score for analytics/admin dashboard
 */
export function getModerationScore(text: string): number {
  return moderateContent(text).score;
}
