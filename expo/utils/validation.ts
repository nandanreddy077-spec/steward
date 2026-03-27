/**
 * Input validation utilities
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const MIN_COMMAND_LENGTH = 3;
const MAX_COMMAND_LENGTH = 500;

/**
 * Validates a command string
 */
export function validateCommand(command: string): ValidationResult {
  const trimmed = command.trim();

  // Empty check
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Please enter a command',
    };
  }

  // Minimum length check
  if (trimmed.length < MIN_COMMAND_LENGTH) {
    return {
      isValid: false,
      error: `Command must be at least ${MIN_COMMAND_LENGTH} characters`,
    };
  }

  // Maximum length check
  if (trimmed.length > MAX_COMMAND_LENGTH) {
    return {
      isValid: false,
      error: `Command must be less than ${MAX_COMMAND_LENGTH} characters`,
    };
  }

  // Check for only whitespace
  if (!trimmed.replace(/\s+/g, '').length) {
    return {
      isValid: false,
      error: 'Command cannot be only spaces',
    };
  }

  // Check for suspicious patterns (basic security)
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        error: 'Invalid characters detected in command',
      };
    }
  }

  return { isValid: true };
}

/**
 * Sanitizes a command string
 */
export function sanitizeCommand(command: string): string {
  // Remove leading/trailing whitespace
  let sanitized = command.trim();

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Limit to max length
  if (sanitized.length > MAX_COMMAND_LENGTH) {
    sanitized = sanitized.substring(0, MAX_COMMAND_LENGTH);
  }

  return sanitized;
}

/**
 * Validates email address format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || !email.trim()) {
    return {
      isValid: false,
      error: 'Email address is required',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    };
  }

  return { isValid: true };
}

/**
 * Validates date/time string
 */
export function validateDateTime(dateTime: string): ValidationResult {
  if (!dateTime || !dateTime.trim()) {
    return {
      isValid: false,
      error: 'Date and time are required',
    };
  }

  const date = new Date(dateTime);
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: 'Please enter a valid date and time',
    };
  }

  return { isValid: true };
}




