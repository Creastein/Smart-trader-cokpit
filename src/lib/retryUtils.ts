/**
 * Retry utilities for handling API errors with exponential backoff
 */

import { logger } from './logger';

// Retry configuration
export const RETRY_CONFIG = {
    MAX_RETRIES: 3,
    INITIAL_DELAY_MS: 2000,  // 2 seconds
    MAX_DELAY_MS: 8000,       // 8 seconds
    BACKOFF_MULTIPLIER: 2,
} as const;

/**
 * Sleep utility for delays
 */
export const sleep = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 * Formula: min(INITIAL_DELAY * (MULTIPLIER ^ attempt), MAX_DELAY)
 */
export const getBackoffDelay = (attempt: number): number => {
    const delay = RETRY_CONFIG.INITIAL_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt);
    return Math.min(delay, RETRY_CONFIG.MAX_DELAY_MS);
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false;

    const errorObj = error as { status?: number; message?: string };

    // Retry on rate limit (429) or service unavailable (503)
    if (errorObj.status === 429 || errorObj.status === 503) {
        return true;
    }

    // Also retry if message contains quota-related keywords
    const message = errorObj.message?.toLowerCase() || '';
    if (message.includes('quota') ||
        message.includes('rate limit') ||
        message.includes('too many requests')) {
        return true;
    }

    return false;
};

/**
 * Get user-friendly error message based on error type
 */
export const getErrorMessage = (error: unknown): string => {
    if (!error || typeof error !== 'object') {
        return 'Unknown error occurred';
    }

    const errorObj = error as { status?: number; message?: string };
    const message = errorObj.message?.toLowerCase() || '';

    if (errorObj.status === 429) {
        if (message.includes('daily')) {
            return 'API quota exceeded for today. Please try again tomorrow or enable billing in Google AI Studio.';
        }
        return 'Rate limit exceeded. System is retrying automatically...';
    }

    if (errorObj.status === 503) {
        return 'Gemini service temporarily unavailable. Retrying automatically...';
    }

    return errorObj.message || 'Analysis request failed';
};

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'Operation'
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= RETRY_CONFIG.MAX_RETRIES; attempt++) {
        try {
            if (attempt > 0) {
                const delay = getBackoffDelay(attempt - 1);
                logger.info(`${operationName}: Retry ${attempt}/${RETRY_CONFIG.MAX_RETRIES} after ${delay}ms delay`);
                await sleep(delay);
            }

            const result = await operation();

            if (attempt > 0) {
                logger.info(`${operationName}: Succeeded after ${attempt} retries`);
            }

            return result;
        } catch (error) {
            lastError = error;

            // If not retryable or max retries reached, throw immediately
            if (!isRetryableError(error)) {
                logger.error(`${operationName}: Non-retryable error:`, error);
                throw error;
            }

            if (attempt === RETRY_CONFIG.MAX_RETRIES) {
                logger.error(`${operationName}: Max retries (${RETRY_CONFIG.MAX_RETRIES}) reached`);
                throw error;
            }

            logger.warn(`${operationName}: Retryable error on attempt ${attempt + 1}:`, getErrorMessage(error));
        }
    }

    throw lastError;
}
