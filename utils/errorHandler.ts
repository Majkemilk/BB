import { Alert } from 'react-native';

export enum ErrorType {
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  CONSTRAINT = 'CONSTRAINT',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export interface ErrorContext {
  operation: string;
  userId?: string;
  timestamp: number;
  retryCount?: number;
  additionalData?: any;
}

export class ErrorHandler {
  /**
   * Categorize error based on error properties
   */
  static categorizeError(error: any): ErrorType {
    if (!error) return ErrorType.UNKNOWN;

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';
    const errorDetails = error.details?.toLowerCase() || '';

    // Network errors
    if (this.isNetworkError(error, errorMessage, errorCode)) {
      return ErrorType.NETWORK;
    }

    // Database errors
    if (this.isDatabaseError(error, errorMessage, errorCode)) {
      return ErrorType.DATABASE;
    }

    // Authentication errors
    if (this.isAuthenticationError(error, errorMessage, errorCode)) {
      return ErrorType.AUTHENTICATION;
    }

    // Permission errors
    if (this.isPermissionError(error, errorMessage, errorCode)) {
      return ErrorType.PERMISSION;
    }

    // Constraint errors
    if (this.isConstraintError(error, errorMessage, errorCode)) {
      return ErrorType.CONSTRAINT;
    }

    // Timeout errors
    if (this.isTimeoutError(error, errorMessage, errorCode)) {
      return ErrorType.TIMEOUT;
    }

    // Validation errors
    if (this.isValidationError(error, errorMessage, errorCode)) {
      return ErrorType.VALIDATION;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Get user-friendly error message based on error type
   */
  static getErrorMessage(error: any, type: ErrorType, context?: ErrorContext): string {
    const baseMessages = {
      [ErrorType.NETWORK]: 'Connection problem. Please check your internet and try again.',
      [ErrorType.DATABASE]: 'Database error. Please try again or contact support.',
      [ErrorType.AUTHENTICATION]: 'Authentication failed. Please log in again.',
      [ErrorType.PERMISSION]: 'Permission denied. Please check your access rights.',
      [ErrorType.CONSTRAINT]: 'Data constraint violation. Please check your input.',
      [ErrorType.TIMEOUT]: 'Operation timed out. Please try again.',
      [ErrorType.VALIDATION]: 'Invalid data. Please check your input and try again.',
      [ErrorType.UNKNOWN]: 'Something went wrong. Please try again.'
    };

    let message = baseMessages[type];

    // Add context-specific information
    if (context) {
      if (context.retryCount && context.retryCount > 0) {
        message += ` (Attempt ${context.retryCount + 1})`;
      }
    }

    return message;
  }

  /**
   * Get recovery suggestions based on error type
   */
  static getRecoverySuggestions(type: ErrorType): string[] {
    const suggestions = {
      [ErrorType.NETWORK]: [
        'Check your internet connection',
        'Try switching between WiFi and mobile data',
        'Wait a moment and try again'
      ],
      [ErrorType.DATABASE]: [
        'Try again in a few moments',
        'Check if the data is valid',
        'Contact support if the problem persists'
      ],
      [ErrorType.AUTHENTICATION]: [
        'Log out and log in again',
        'Check your credentials',
        'Contact support if the problem persists'
      ],
      [ErrorType.PERMISSION]: [
        'Check your account permissions',
        'Contact your administrator',
        'Try logging in again'
      ],
      [ErrorType.CONSTRAINT]: [
        'Check your input data',
        'Ensure all required fields are filled',
        'Try with different values'
      ],
      [ErrorType.TIMEOUT]: [
        'Try again with a better connection',
        'Wait a moment and retry',
        'Check if the server is responding'
      ],
      [ErrorType.VALIDATION]: [
        'Check your input format',
        'Ensure all required fields are valid',
        'Try with different values'
      ],
      [ErrorType.UNKNOWN]: [
        'Try again in a few moments',
        'Restart the application',
        'Contact support if the problem persists'
      ]
    };

    return suggestions[type] || suggestions[ErrorType.UNKNOWN];
  }

  /**
   * Determine if error is retryable
   */
  static isRetryable(error: any, type: ErrorType): boolean {
    const retryableTypes = [
      ErrorType.NETWORK,
      ErrorType.DATABASE,
      ErrorType.TIMEOUT
    ];

    const nonRetryableTypes = [
      ErrorType.AUTHENTICATION,
      ErrorType.PERMISSION,
      ErrorType.CONSTRAINT,
      ErrorType.VALIDATION
    ];

    if (nonRetryableTypes.includes(type)) {
      return false;
    }

    if (retryableTypes.includes(type)) {
      return true;
    }

    // For unknown errors, check if it looks like a temporary issue
    const errorMessage = error.message?.toLowerCase() || '';
    const temporaryIndicators = [
      'timeout',
      'connection',
      'network',
      'temporary',
      'busy',
      'unavailable'
    ];

    return temporaryIndicators.some(indicator => 
      errorMessage.includes(indicator)
    );
  }

  /**
   * Log error with context
   */
  static logError(error: any, type: ErrorType, context?: ErrorContext): void {
    const logData = {
      type,
      message: error.message,
      code: error.code,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };

    console.error('[ErrorHandler] Error logged:', logData);

    // Here you could send to crash reporting service
    // CrashReporter.reportError(logData);
  }

  /**
   * Show error alert to user
   */
  static showErrorAlert(error: any, type: ErrorType, context?: ErrorContext): void {
    const message = this.getErrorMessage(error, type, context);
    const suggestions = this.getRecoverySuggestions(type);

    Alert.alert(
      'Error',
      message,
      [
        {
          text: 'OK',
          style: 'default'
        },
        ...(suggestions.length > 0 ? [{
          text: 'Get Help',
          style: 'default',
          onPress: () => {
            Alert.alert(
              'Recovery Suggestions',
              suggestions.join('\n\n'),
              [{ text: 'OK' }]
            );
          }
        }] : [])
      ]
    );
  }

  // Private helper methods for error categorization

  private static isNetworkError(error: any, message: string, code: string): boolean {
    const networkPatterns = [
      'network',
      'connection',
      'fetch',
      'timeout',
      'econnrefused',
      'enotfound',
      'etimedout',
      'network_error',
      'connection_error'
    ];

    return networkPatterns.some(pattern => 
      message.includes(pattern) || code.includes(pattern)
    );
  }

  private static isDatabaseError(error: any, message: string, code: string): boolean {
    const databasePatterns = [
      'database',
      'sql',
      'query',
      'pg_',
      'relation',
      'table',
      'column',
      'database_error'
    ];

    return databasePatterns.some(pattern => 
      message.includes(pattern) || code.includes(pattern)
    );
  }

  private static isAuthenticationError(error: any, message: string, code: string): boolean {
    const authPatterns = [
      'auth',
      'authentication',
      'unauthorized',
      'forbidden',
      'invalid_token',
      'token_expired',
      'login',
      'session'
    ];

    return authPatterns.some(pattern => 
      message.includes(pattern) || code.includes(pattern)
    );
  }

  private static isPermissionError(error: any, message: string, code: string): boolean {
    const permissionPatterns = [
      'permission',
      'access_denied',
      'insufficient_privileges',
      'forbidden',
      'unauthorized'
    ];

    return permissionPatterns.some(pattern => 
      message.includes(pattern) || code.includes(pattern)
    );
  }

  private static isConstraintError(error: any, message: string, code: string): boolean {
    const constraintPatterns = [
      'constraint',
      'unique',
      'foreign_key',
      'not_null',
      'check',
      'duplicate',
      'violation'
    ];

    return constraintPatterns.some(pattern => 
      message.includes(pattern) || code.includes(pattern)
    );
  }

  private static isTimeoutError(error: any, message: string, code: string): boolean {
    const timeoutPatterns = [
      'timeout',
      'timed_out',
      'deadline',
      'expired'
    ];

    return timeoutPatterns.some(pattern => 
      message.includes(pattern) || code.includes(pattern)
    );
  }

  private static isValidationError(error: any, message: string, code: string): boolean {
    const validationPatterns = [
      'validation',
      'invalid',
      'malformed',
      'format',
      'type',
      'required',
      'missing'
    ];

    return validationPatterns.some(pattern => 
      message.includes(pattern) || code.includes(pattern)
    );
  }
}
