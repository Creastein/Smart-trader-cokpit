/**
 * Conditional logger utility for Smart Trader Cockpit
 * Only logs in development mode to keep production clean
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
    private log(level: LogLevel, ...args: unknown[]): void {
        if (!isDevelopment) return;

        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        switch (level) {
            case 'error':
                console.error(prefix, ...args);
                break;
            case 'warn':
                console.warn(prefix, ...args);
                break;
            case 'debug':
                console.debug(prefix, ...args);
                break;
            default:
                console.log(prefix, ...args);
        }
    }

    info(...args: unknown[]): void {
        this.log('info', ...args);
    }

    warn(...args: unknown[]): void {
        this.log('warn', ...args);
    }

    error(...args: unknown[]): void {
        this.log('error', ...args);
    }

    debug(...args: unknown[]): void {
        this.log('debug', ...args);
    }
}

export const logger = new Logger();
