import winston from 'winston';
import colors from 'colors';

// Custom format for console output with colors
const consoleFormat = winston.format.printf(({ level, message, timestamp }) => {
  const colorize = (level: string, text: string): string => {
    switch (level) {
      case 'error':
        return colors.red(text);
      case 'warn':
        return colors.yellow(text);
      case 'info':
        return colors.green(text);
      case 'debug':
        return colors.blue(text);
      default:
        return text;
    }
  };

  return `${colors.gray(timestamp as string)} ${colorize(level, level.toUpperCase())} ${message}`;
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'sse-client' },
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),
    // File transport for errors
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error',
      dirname: './logs' 
    }),
    // File transport for all logs
    new winston.transports.File({ 
      filename: 'combined.log',
      dirname: './logs' 
    }),
  ],
});

// Create logs directory if it doesn't exist
import fs from 'fs';
import path from 'path';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export default logger;
