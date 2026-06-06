/**
 * Comprehensive Prohibited Phrases List
 * Multi-word patterns that indicate policy violations
 * Total: 175+ phrases
 */

// Sexual/solicitation phrases
const SEXUAL_PHRASES = [
  'get laid', 'getting laid', 'got laid',
  'hook up', 'hooking up', 'hooked up',
  'one night stand', 'one-night stand',
  'booty call', 'booty calls',
  'friends with benefits', 'fwb',
  'looking for sex', 'want sex', 'need sex',
  'down to fuck', 'dtf',
  'netflix and chill',
  'send nudes', 'sending nudes', 'nude pics',
  'dick pic', 'dick pics', 'cock pic',
  'sugar daddy', 'sugar momma', 'sugar baby',
  'escort service', 'escort services',
  'massage with extras', 'happy ending',
  'adult entertainment', 'adult services',
  'webcam show', 'cam show',
];

// Scam/fraud phrases
const SCAM_PHRASES = [
  'wire transfer only', 'wire money',
  'send money to', 'send cash to',
  'western union only',
  'moneygram only',
  'gift card payment', 'pay with gift card',
  'bitcoin only', 'crypto only',
  'send payment first',
  'no refunds', 'all sales final',
  'as is no returns',
  'email me at', 'contact me at',
  'text me at', 'call me at',
  'whatsapp me', 'telegram me',
  'message me on', 'dm me on',
  'outside the platform',
  'off platform', 'off-platform',
  'avoid fees', 'skip fees',
  'guaranteed winner', 'guaranteed profit',
  'get rich quick', 'make money fast',
  'work from home', 'earn from home',
  'no experience needed',
  'limited time only', 'act now',
  'this is not a scam',
  'trust me', 'i promise',
];

// Contact info bypass attempts
const CONTACT_BYPASS_PHRASES = [
  'my email is', 'email is', 'e-mail is',
  'my phone', 'phone number is', 'call at',
  'text at', 'reach me at',
  'my instagram', 'my facebook', 'my twitter',
  'follow me on', 'add me on',
  'my snap', 'snapchat is', 'snap is',
  'my whatsapp', 'whatsapp number',
  'my kik', 'kik me', 'kik is',
  'at gmail', 'at yahoo', 'at hotmail', 'at outlook',
  'dot com', 'dot net', 'dot org',
  ' at ', ' @ ',
];

// Prohibited item keywords
const PROHIBITED_ITEM_PHRASES = [
  'replica watch', 'fake watch', 'knockoff watch',
  'replica bag', 'fake bag', 'knockoff bag',
  'counterfeit', 'knock off',
  'stolen goods', 'stolen item',
  'hot item', 'fell off truck',
  'no papers', 'no receipt', 'no box',
  'drugs', 'prescription drugs', 'pills',
  'weed', 'marijuana', 'cannabis',
  'vape pen', 'thc',
  'weapons', 'gun', 'firearm',
  'ammunition', 'ammo',
  'switchblade', 'brass knuckles',
  'drug paraphernalia', 'bong', 'pipe',
  'human body parts', 'body parts',
  'ivory', 'endangered species',
];

// Harassment/threat phrases
const HARASSMENT_PHRASES = [
  'i will kill', 'im going to kill', 'gonna kill',
  'i will hurt', 'im going to hurt',
  'kill yourself', 'kys',
  'die bitch', 'die whore',
  'rape you', 'gonna rape',
  'beat you up', 'kick your ass',
  'come to your house', 'find where you live',
  'track you down',
];

// Spam/manipulation phrases
const SPAM_PHRASES = [
  'click here', 'click link',
  'visit my website', 'check my website',
  'follow the link', 'go to link',
  'dm for price', 'dm for details',
  'serious buyers only', 'serious inquiries',
  'no lowballers', 'no low balls',
  'i know what i have',
  'firm price', 'price is firm',
  'cash only', 'cash in hand',
  'first come first serve',
];

// All prohibited phrases combined
export const ALL_PROHIBITED_PHRASES = [
  ...SEXUAL_PHRASES,
  ...SCAM_PHRASES,
  ...CONTACT_BYPASS_PHRASES,
  ...PROHIBITED_ITEM_PHRASES,
  ...HARASSMENT_PHRASES,
  ...SPAM_PHRASES,
];

export function containsProhibitedPhrase(text: string): { found: boolean; matches: string[] } {
  const textLower = text.toLowerCase();
  const matches: string[] = [];

  for (const phrase of ALL_PROHIBITED_PHRASES) {
    if (textLower.includes(phrase.toLowerCase())) {
      matches.push(phrase);
    }
  }

  return {
    found: matches.length > 0,
    matches,
  };
}
