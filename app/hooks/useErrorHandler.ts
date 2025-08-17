'use client';

import { useCallback } from 'react';
import { useNotification } from './useNotification';

interface ErrorContext {
  action?: string;
  component?: string;
  userId?: string;
  timestamp?: string;
}

interface ApiErrorResponse {
  success: false;
  error: {
    type: string;
    message: string;
    timestamp: string;
    context?: Record<string, unknown>;
    requestId?: string;
  };
}

export function useErrorHandler() {
  const { showNotification } = useNotification();

  const handleError = useCallback((
    error: unknown,
    context: ErrorContext = {}
  ) => {
    let userMessage = 'An unexpected error occurred. Please try again.';
    let severity: 'error' | 'warning' | 'info' = 'error';

    // Parse different types of errors
    if (isApiErrorResponse(error)) {
      // Handle API error responses
      userMessage = getUserFriendlyMessage(error.error.type, error.error.message);
      severity = getSeverityFromErrorType(error.error.type);
      
      // Log detailed error for debugging
      console.error('API Error:', {
        ...error.error,
        context,
        userMessage,
      });
    } else if (error instanceof Error) {
      // Handle JavaScript errors
      userMessage = getUserFriendlyMessage('UNKNOWN', error.message);
      
      console.error('JavaScript Error:', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      });
    } else if (typeof error === 'string') {
      // Handle string errors
      userMessage = error;
      
      console.error('String Error:', {
        message: error,
        context,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Handle unknown error types
      console.error('Unknown Error:', {
        error,
        context,
        timestamp: new Date().toISOString(),
      });
    }

    // Show user notification
    showNotification(userMessage, severity);

    // Return processed error info for further handling if needed
    return {
      userMessage,
      severity,
      originalError: error,
      context,
    };
  }, [showNotification]);

  const handleAsyncError = useCallback(async (
    asyncOperation: () => Promise<any>,
    context: ErrorContext = {}
  ) => {
    try {
      return await asyncOperation();
    } catch (error) {
      handleError(error, context);
      throw error; // Re-throw so calling code can handle it appropriately
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
  };
}

// Type guard for API error responses
function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'success' in error &&
    'error' in error &&
    (error as any).success === false
  );
}

// Convert error types to user-friendly messages
function getUserFriendlyMessage(errorType: string, originalMessage: string): string {
  const friendlyMessages: Record<string, string> = {
    VALIDATION_ERROR: 'Please check your input and try again.',
    AUTHENTICATION_ERROR: 'Please sign in to continue.',
    AUTHORIZATION_ERROR: 'You don\'t have permission to perform this action.',
    NOT_FOUND: 'The requested item could not be found.',
    RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment and try again.',
    DATABASE_ERROR: 'We\'re experiencing technical difficulties. Please try again later.',
    EXTERNAL_API_ERROR: 'Unable to connect to external service. Please try again later.',
    INTERNAL_SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
    NETWORK_ERROR: 'Please check your internet connection and try again.',
    TIMEOUT_ERROR: 'The request took too long. Please try again.',
  };

  // Return specific message if available, otherwise use the original message or a default
  return friendlyMessages[errorType] || originalMessage || 'An unexpected error occurred.';
}

// Convert error types to notification severity
function getSeverityFromErrorType(errorType: string): 'error' | 'warning' | 'info' {
  const severityMap: Record<string, 'error' | 'warning' | 'info'> = {
    VALIDATION_ERROR: 'warning',
    AUTHENTICATION_ERROR: 'info',
    AUTHORIZATION_ERROR: 'warning',
    NOT_FOUND: 'info',
    RATE_LIMIT_ERROR: 'warning',
    DATABASE_ERROR: 'error',
    EXTERNAL_API_ERROR: 'error',
    INTERNAL_SERVER_ERROR: 'error',
    NETWORK_ERROR: 'warning',
    TIMEOUT_ERROR: 'warning',
  };

  return severityMap[errorType] || 'error';
}

// Utility function for common API error handling patterns
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorContext: ErrorContext = {}
): (...args: T) => Promise<R | undefined> {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      const { handleError } = useErrorHandler();
      handleError(error, errorContext);
      return undefined;
    }
  };
}