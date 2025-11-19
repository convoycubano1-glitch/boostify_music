type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface Logger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

const isDevelopment = import.meta.env.DEV;

const createLogger = (): Logger => {
  const shouldLog = (level: LogLevel): boolean => {
    if (level === 'error') return true;
    return isDevelopment;
  };

  const formatTimestamp = (): string => {
    const now = new Date();
    return `${now.toLocaleTimeString()}.${now.getMilliseconds()}`;
  };

  const formatMessage = (level: LogLevel, ...args: any[]): any[] => {
    const timestamp = formatTimestamp();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return [prefix, ...args];
  };

  return {
    log: (...args: any[]) => {
      if (shouldLog('log')) console.log(...formatMessage('log', ...args));
    },
    
    warn: (...args: any[]) => {
      if (shouldLog('warn')) console.warn(...formatMessage('warn', ...args));
    },
    
    error: (...args: any[]) => {
      if (shouldLog('error')) {
        console.error(...formatMessage('error', ...args));
        if (args[0] instanceof Error) {
          console.error('Stack trace:', args[0].stack);
        }
      }
    },
    
    info: (...args: any[]) => {
      if (shouldLog('info')) console.info(...formatMessage('info', ...args));
    },
    
    debug: (...args: any[]) => {
      if (shouldLog('debug')) console.debug(...formatMessage('debug', ...args));
    },
  };
};

export const logger = createLogger();
