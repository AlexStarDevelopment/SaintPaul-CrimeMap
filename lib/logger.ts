interface LogContext {
  userId?: string;
  email?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  timestamp?: string;
}

interface ErrorDetails {
  message: string;
  code?: string;
  stack?: string;
  context?: LogContext;
}

class SecureLogger {
  private sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'session',
    'cookie',
    'authorization',
    'stripeCustomerId',
    'stripeSubscriptionId',
    '_id'
  ];

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if this field contains sensitive data
      const isSensitive = this.sensitiveFields.some(field => 
        lowerKey.includes(field) || (typeof value === 'string' && value.length > 50)
      );

      if (isSensitive) {
        (sanitized as any)[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        (sanitized as any)[key] = this.sanitizeObject(value);
      } else {
        (sanitized as any)[key] = value;
      }
    }

    return sanitized;
  }

  private createLogEntry(level: string, message: string, data?: any): string {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data && { data: this.sanitizeObject(data) })
    };

    return JSON.stringify(entry);
  }

  info(message: string, context?: LogContext): void {
    console.log(this.createLogEntry('INFO', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.createLogEntry('WARN', message, context));
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    const errorDetails: ErrorDetails = {
      message,
      context
    };

    if (error instanceof Error) {
      errorDetails.code = error.name;
      errorDetails.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined;
    } else if (error) {
      errorDetails.code = error.code || error.name || 'UNKNOWN_ERROR';
    }

    console.error(this.createLogEntry('ERROR', message, errorDetails));
  }

  security(message: string, context?: LogContext): void {
    const securityEntry = {
      ...context,
      securityEvent: true,
      severity: 'HIGH'
    };
    
    console.error(this.createLogEntry('SECURITY', message, securityEntry));
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.createLogEntry('DEBUG', message, data));
    }
  }
}

export const logger = new SecureLogger();

// Helper function to extract request context
export function getRequestContext(request?: Request): LogContext {
  if (!request) return {};

  const url = new URL(request.url);
  return {
    endpoint: url.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 
        request.headers.get('x-real-ip') || 
        undefined,
    timestamp: new Date().toISOString()
  };
}

// Helper to sanitize user data for logging
export function sanitizeUserForLogging(user: any): any {
  if (!user) return null;
  
  return {
    email: user.email,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
    hasStripeId: !!user.stripeCustomerId
  };
}