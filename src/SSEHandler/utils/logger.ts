/**
 * Simple console logger to replace Winston logger
 * This avoids packaging issues in production
 */

// Define log levels
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Simple timestamp formatter
const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
};

// Simple logger implementation using console methods
const logger = {
  error: (message: string, error?: any): void => {
    console.error(`${getTimestamp()} ERROR ${message}`, error || '');
  },

  warn: (message: string, data?: any): void => {
    console.warn(`${getTimestamp()} WARN ${message}`, data || '');
  },

  info: (message: string, data?: any): void => {
    console.info(`${getTimestamp()} INFO ${message}`, data || '');
  },

  debug: (message: string, data?: any): void => {
    console.debug(`${getTimestamp()} DEBUG ${message}`, data || '');
  }
};

export default logger;
