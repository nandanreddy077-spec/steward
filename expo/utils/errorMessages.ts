/**
 * Converts technical error messages to user-friendly messages
 */

export function getUserFriendlyError(error: string | Error | unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerError = errorMessage.toLowerCase();

  // Network errors
  if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('connection')) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }

  // Authentication errors
  if (lowerError.includes('401') || lowerError.includes('unauthorized') || lowerError.includes('authentication')) {
    return 'Please log in with Google to continue.';
  }

  if (lowerError.includes('oauth') || lowerError.includes('token') || lowerError.includes('expired')) {
    return 'Your Google account connection has expired. Please reconnect in Settings.';
  }

  // Google API errors
  if (lowerError.includes('google') && lowerError.includes('calendar')) {
    if (lowerError.includes('not found') || lowerError.includes('404')) {
      return 'Calendar event not found. It may have been deleted.';
    }
    if (lowerError.includes('permission') || lowerError.includes('403')) {
      return 'Permission denied. Please reconnect your Google Calendar in Settings.';
    }
    return 'Unable to access Google Calendar. Please check your connection.';
  }

  if (lowerError.includes('gmail') || lowerError.includes('email')) {
    if (lowerError.includes('permission') || lowerError.includes('403')) {
      return 'Permission denied. Please reconnect your Gmail in Settings.';
    }
    return 'Unable to access Gmail. Please check your connection.';
  }

  // Task errors
  if (lowerError.includes('task not found') || lowerError.includes('404')) {
    return 'Task not found. It may have been deleted.';
  }

  if (lowerError.includes('user not found')) {
    return 'User account not found. Please log in again.';
  }

  // Validation errors
  if (lowerError.includes('required') || lowerError.includes('missing')) {
    return 'Please provide all required information.';
  }

  if (lowerError.includes('invalid')) {
    return 'Invalid input. Please check and try again.';
  }

  // Rate limiting
  if (lowerError.includes('rate limit') || lowerError.includes('too many')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Server errors
  if (lowerError.includes('500') || lowerError.includes('internal server')) {
    return 'Something went wrong on our end. Please try again in a moment.';
  }

  // Timeout errors
  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return 'Request timed out. Please try again.';
  }

  // Default: return original message if it's already user-friendly, otherwise generic message
  if (errorMessage.length < 100 && !errorMessage.includes('Error:') && !errorMessage.includes('at ')) {
    return errorMessage;
  }

  return 'Something went wrong. Please try again.';
}

/**
 * Determines if an error is retryable
 */
export function isRetryableError(error: string | Error | unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerError = errorMessage.toLowerCase();

  // Retryable errors
  const retryablePatterns = [
    'network',
    'connection',
    'timeout',
    'fetch',
    '500',
    '503',
    '502',
    'rate limit',
  ];

  // Non-retryable errors
  const nonRetryablePatterns = [
    '401',
    '403',
    '404',
    '400',
    'invalid',
    'not found',
    'permission denied',
  ];

  if (nonRetryablePatterns.some(pattern => lowerError.includes(pattern))) {
    return false;
  }

  return retryablePatterns.some(pattern => lowerError.includes(pattern));
}




