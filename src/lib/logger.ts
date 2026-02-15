/**
 * Centralized logging utility with configurable log levels
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *
 *   logger.info('Info message');
 *   logger.warn('Warning message');
 *   logger.error('Error message', error);
 *   logger.debug('Debug message');
 *
 * Configure log level via LOG_LEVEL environment variable:
 *   LOG_LEVEL=debug (shows all logs)
 *   LOG_LEVEL=info (shows info, warn, error)
 *   LOG_LEVEL=warn (shows warn, error)
 *   LOG_LEVEL=error (shows only error)
 *   LOG_LEVEL=silent (shows nothing)
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

class Logger {
  private level: LogLevel;

  constructor() {
    const defaultLevel =
      process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG;
    this.level = this.parseLogLevel(process.env.LOG_LEVEL) ?? defaultLevel;
  }

  private parseLogLevel(level?: string): LogLevel | null {
    if (!level) return null;

    const normalized = level.toUpperCase();
    switch (normalized) {
      case "DEBUG":
        return LogLevel.DEBUG;
      case "INFO":
        return LogLevel.INFO;
      case "WARN":
      case "WARNING":
        return LogLevel.WARN;
      case "ERROR":
        return LogLevel.ERROR;
      case "SILENT":
        return LogLevel.SILENT;
      default:
        return null;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;

    if (args.length > 0) {
      console.log(prefix, message, ...args);
    } else {
      console.log(prefix, message);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.formatMessage("DEBUG", message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.formatMessage("INFO", message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const prefix = `[${new Date().toISOString()}] [WARN]`;
      const formattedArgs = args.length > 0 ? args : [];
      console.warn(prefix, message, ...formattedArgs);
    }
  }

  error(message: string, error?: Error | unknown, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const prefix = `[${new Date().toISOString()}] [ERROR]`;

      if (error instanceof Error) {
        console.error(prefix, message, error.message, error.stack, ...args);
      } else if (error) {
        console.error(prefix, message, error, ...args);
      } else {
        console.error(prefix, message, ...args);
      }
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }
}

export const logger = new Logger();

export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
};
