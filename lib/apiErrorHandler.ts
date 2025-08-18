import { NextResponse } from 'next/server';
import { z } from 'zod';

// Error types for better categorization
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  INTERNAL = 'INTERNAL_SERVER_ERROR',
}

// Custom error class
export class ApiError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Predefined error creators
export const createValidationError = (message: string, details?: unknown) =>
  new ApiError(message, ErrorType.VALIDATION, 400, true, { details });

export const createAuthenticationError = (message: string = 'Authentication required') =>
  new ApiError(message, ErrorType.AUTHENTICATION, 401, true);

export const createAuthorizationError = (message: string = 'Insufficient permissions') =>
  new ApiError(message, ErrorType.AUTHORIZATION, 403, true);

export const createNotFoundError = (resource: string = 'Resource') =>
  new ApiError(`${resource} not found`, ErrorType.NOT_FOUND, 404, true);

export const createRateLimitError = (message: string = 'Rate limit exceeded') =>
  new ApiError(message, ErrorType.RATE_LIMIT, 429, true);

export const createDatabaseError = (message: string, originalError?: Error) =>
  new ApiError(message, ErrorType.DATABASE, 500, true, { originalError: originalError?.message });

export const createExternalApiError = (message: string, service?: string) =>
  new ApiError(message, ErrorType.EXTERNAL_API, 502, true, { service });

// Error response formatter
interface ErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    message: string;
    timestamp: string;
    context?: Record<string, unknown>;
    requestId?: string;
  };
}

export function formatErrorResponse(error: ApiError | Error, requestId?: string): ErrorResponse {
  const isApiError = error instanceof ApiError;

  const response: ErrorResponse = {
    success: false,
    error: {
      type: isApiError ? error.type : ErrorType.INTERNAL,
      message: isApiError ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      ...(isApiError && error.context && { context: error.context }),
      ...(requestId && { requestId }),
    },
  };

  // In development, include more detailed error information
  if (process.env.NODE_ENV === 'development' && !isApiError) {
    response.error.context = {
      originalMessage: error.message,
      stack: error.stack,
    };
  }

  return response;
}

// Central error handler
export function handleApiError(error: unknown, context?: Record<string, unknown>): NextResponse {
  // Generate a request ID for tracking
  const requestId = Math.random().toString(36).substring(2, 15);

  let apiError: ApiError;

  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof z.ZodError) {
    // Handle Zod validation errors
    apiError = createValidationError(
      'Invalid request data',
      error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }))
    );
  } else if (error instanceof Error) {
    // Handle generic errors
    if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      apiError = createAuthenticationError();
    } else if (error.message.includes('not found')) {
      apiError = createNotFoundError();
    } else {
      apiError = new ApiError('An unexpected error occurred', ErrorType.INTERNAL, 500, false, {
        originalMessage: error.message,
        ...context,
      });
    }
  } else {
    // Handle unknown error types
    apiError = new ApiError('An unexpected error occurred', ErrorType.INTERNAL, 500, false, {
      error: String(error),
      ...context,
    });
  }

  // Log error for monitoring
  console.error('API Error:', {
    requestId,
    type: apiError.type,
    message: apiError.message,
    statusCode: apiError.statusCode,
    context: { ...apiError.context, ...context },
    stack: apiError.stack,
    timestamp: new Date().toISOString(),
  });

  // Return formatted error response
  const errorResponse = formatErrorResponse(apiError, requestId);
  return NextResponse.json(errorResponse, { status: apiError.statusCode });
}

// Async wrapper for API route handlers
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, {
        endpoint: 'unknown',
        method: 'unknown',
      });
    }
  };
}
