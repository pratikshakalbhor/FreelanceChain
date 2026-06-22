import { perfMonitor } from "./performanceMonitor";

/**
 * FreelanceChain — Enhanced Error Handler
 * 
 * Classifies errors, extracts user-friendly messages, and
 * tracks them in the performance monitor for observability.
 */

const ERROR_CLASSIFICATIONS = {
  RATE_LIMIT: {
    patterns: ['429', 'Too Many Requests', 'rate limit'],
    userMessage: 'Too many requests. Please wait a moment and try again.',
    severity: 'warning',
  },
  NETWORK: {
    patterns: ['NetworkError', 'fetch failed', 'ECONNREFUSED', 'timeout', 'Failed to fetch'],
    userMessage: 'Network connection issue. Please check your internet and try again.',
    severity: 'warning',
  },
  WALLET: {
    patterns: ['No wallet', 'signing cancelled', 'User declined', 'rejected'],
    userMessage: 'Wallet action was cancelled or declined.',
    severity: 'info',
  },
  TRUSTLINE: {
    patterns: ['trustline entry is missing', 'trustline'],
    userMessage: 'Missing trustline. Please add a trustline for this token first.',
    severity: 'error',
  },
  INSUFFICIENT_FUNDS: {
    patterns: ['insufficient', 'underfunded', 'op_underfunded'],
    userMessage: 'Insufficient funds for this transaction.',
    severity: 'error',
  },
  CONTRACT: {
    patterns: ['simulation error', 'simulation failed', 'assembly failed', 'failed on-chain'],
    userMessage: 'Smart contract error. The transaction could not be processed.',
    severity: 'error',
  },
  ACCOUNT: {
    patterns: ['Account not found', 'account does not exist', 'Not Found'],
    userMessage: 'Account not found on the Stellar network. Please fund your account first.',
    severity: 'error',
  },
};

/**
 * Classify and handle an error.
 * @param {Error|string} error
 * @param {string} source — Where the error originated (e.g., "postJob", "loadJobs")
 * @returns {string} User-friendly error message
 */
export const errorHandler = (error, source = 'unknown') => {
  const rawMessage = typeof error === 'string' 
    ? error 
    : error?.message || 'Something went wrong';

  // Classify the error
  let classification = null;
  for (const [key, config] of Object.entries(ERROR_CLASSIFICATIONS)) {
    if (config.patterns.some(p => rawMessage.toLowerCase().includes(p.toLowerCase()))) {
      classification = { type: key, ...config };
      break;
    }
  }

  // Track in performance monitor
  perfMonitor.trackError(rawMessage, source);

  // Log with classification
  if (classification) {
    console.error(`[${classification.severity.toUpperCase()}] [${source}] ${classification.type}: ${rawMessage}`);
    return classification.userMessage;
  }

  console.error(`[ERROR] [${source}] Unclassified: ${rawMessage}`);
  return rawMessage;
};

/**
 * Check if an error is retryable (for the request queue).
 */
export const isRetryableError = (error) => {
  const msg = error?.message || '';
  return ERROR_CLASSIFICATIONS.RATE_LIMIT.patterns.some(p => msg.toLowerCase().includes(p.toLowerCase()))
    || ERROR_CLASSIFICATIONS.NETWORK.patterns.some(p => msg.toLowerCase().includes(p.toLowerCase()));
};

export default errorHandler;