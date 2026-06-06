const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const phoneRegex = /(\+1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}\b/;

const bannedKeywords = [
  "whatsapp", "telegram", "signal", "snapchat", "instagram", "ig:",
  "venmo", "cashapp", "cash app", "zelle", "facebook", "fb:",
  "phone number", "call me", "text me", "dm me", "direct message",
  "email me", "gmail", "yahoo", "outlook",
];

export const MAX_MESSAGE_LENGTH = 1000;

export function checkMessageForContactInfo(message: string): string | null {
  if (message.length > MAX_MESSAGE_LENGTH) {
    return `Message must be under ${MAX_MESSAGE_LENGTH} characters.`;
  }

  const lower = message.toLowerCase();

  if (emailRegex.test(message)) {
    return "Sharing email addresses is not allowed on this platform.";
  }

  if (phoneRegex.test(message)) {
    return "Sharing phone numbers is not allowed on this platform.";
  }

  if (bannedKeywords.some((kw) => lower.includes(kw))) {
    return "Sharing external contact or payment details is not allowed on this platform.";
  }

  return null;
}
