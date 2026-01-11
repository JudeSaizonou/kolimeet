import DOMPurify from 'dompurify';

/**
 * Sanitizes message content by hiding phone numbers and email addresses
 * and removing any malicious HTML/scripts
 */
export const sanitizeMessage = (content: string): string => {
  if (!content) return '';
  
  // First, strip all HTML tags to prevent XSS
  let sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  
  // Hide phone numbers (various formats)
  sanitized = sanitized.replace(
    /(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g,
    "[caché pour votre sécurité]"
  );

  // Hide email addresses
  sanitized = sanitized.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "[caché pour votre sécurité]"
  );

  return sanitized;
};
