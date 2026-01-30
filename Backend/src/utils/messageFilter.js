// Message filtering utility to block phone numbers and emails
// Admin is exempt from these restrictions

const phonePatterns = [
  /\b\d{10,15}\b/g, // 10-15 digit numbers
  /\+?\d{1,4}[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}/g, // International formats
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // US format
  /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/g, // (123) 456-7890
];

const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Additional patterns for obfuscated contact info
const obfuscatedPatterns = [
  /\b\d+\s*at\s*\d+/gi, // "123 at 456"
  /\b\d+\s*dot\s*\d+/gi, // "123 dot 456"
  /\b\w+\s*at\s*\w+\s*dot\s*\w+/gi, // "name at domain dot com"
  /\b\w+@\w+/gi, // Simple @ mentions that might be emails
];

const containsContactInfo = (message) => {
  // Check for phone numbers
  for (const pattern of phonePatterns) {
    if (pattern.test(message)) {
      return { blocked: true, reason: 'Phone number detected' };
    }
  }

  // Check for email addresses
  if (emailPattern.test(message)) {
    return { blocked: true, reason: 'Email address detected' };
  }

  // Check for obfuscated contact info
  for (const pattern of obfuscatedPatterns) {
    if (pattern.test(message)) {
      return { blocked: true, reason: 'Potential contact information detected' };
    }
  }

  return { blocked: false };
};

const filterMessage = (message, senderRole) => {
  // Admin is exempt from filtering
  if (senderRole === 'admin') {
    return { allowed: true, filteredMessage: message };
  }

  const filterResult = containsContactInfo(message);
  
  if (filterResult.blocked) {
    return {
      allowed: false,
      reason: filterResult.reason,
      filteredMessage: '[Message blocked: Contact information sharing is not allowed]',
    };
  }

  return { allowed: true, filteredMessage: message };
};

const sanitizeMessage = (message) => {
  // Remove any HTML tags for security
  return message.replace(/<[^>]*>/g, '');
};

module.exports = { containsContactInfo, sanitizeMessage, filterMessage };
