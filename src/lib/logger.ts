/**
 * Production-safe Logger Utility
 *
 * Wraps console.* methods to control output by environment:
 * - logger.error()  → always logs (production needs real errors in Vercel runtime logs)
 * - logger.warn()   → development only
 * - logger.info()   → development only
 * - logger.debug()  → development only
 *
 * process.env.NODE_ENV is statically analysed by Next.js / webpack,
 * so dev-only branches are dead-code-eliminated in production client bundles.
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  /** Always logs — use for genuine errors that need visibility in production. */
  error: (...args: unknown[]) => {
    console.error(...args);
  },

  /** Development only — operational warnings, non-critical issues. */
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },

  /** Development only — informational / success messages. */
  info: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },

  /** Development only — verbose debugging output. */
  debug: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
};
