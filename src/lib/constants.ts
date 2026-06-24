/**
 * Security-related constants.
 */

export const REMEMBER_ME_SESSION_SECONDS = 30 * 24 * 60 * 60;
export const DEFAULT_SESSION_SECONDS = 8 * 60 * 60;

export const BCRYPT_SALT_ROUNDS = 12;
export const BCRYPT_SALT_ROUNDS_BACKUP = 12;

/**
 * Email verification token expiry duration (24 hours in ms).
 */

export const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Password reset token expiry duration (1 hour in ms).
 */

export const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Base URL for the application.
 * Falls back to localhost in development, Vercel auto-detection in production.
 */

const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
export const BASE_URL = process.env.NEXT_PUBLIC_URL
  || (vercelUrl ? `https://${vercelUrl}` : undefined)
  || "http://localhost:3000";

/**
 * Maximum avatar image size in bytes (5 MB).
 */

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Auto-dismiss timeout for alert messages in ms (5 seconds).
 */

export const ALERT_AUTO_DISMISS_MS = 5000;

/**
 * Registration success redirect delay in ms (3 seconds).
 */

export const REDIRECT_DELAY_MS = 3000;

/**
 * Resend verification email cooldown in seconds (60 seconds).
 */

export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Timing delay to prevent email enumeration via response time (1.5 seconds).
 */

export const ENUMERATION_DELAY_MS = 1500;

/**
 * Copy-to-clipboard feedback toast duration in ms (2 seconds).
 */

export const COPY_FEEDBACK_MS = 2000;

/**
 * Maximum number of quiz results to keep in localStorage (per category).
 */

export const MAX_QUIZ_RESULTS = 50;

/**
 * Maximum number of GDP simulation results to keep in localStorage.
 */

export const MAX_GDP_RESULTS = 50;

/**
 * Maximum number of finance quiz results to keep in localStorage.
 */

export const MAX_FINANCE_RESULTS = 50;

/**
 * Maximum number of elasticity simulation results to keep in localStorage.
 */

export const MAX_ELASTICITY_RESULTS = 50;

/**
 * Maximum number of module interaction records to keep in localStorage.
 */

export const MAX_MODULE_INTERACTIONS = 500;

/**
 * Maximum number of daily challenge records to keep in localStorage.
 */

export const MAX_DAILY_CHALLENGES = 30;

/**
 * Auto-sync debounce delay in ms (3 seconds after coming online).
 */
export const SYNC_DEBOUNCE_MS = 3000;

/**
 * XP discrepancy threshold for detecting sync conflicts (100 XP).
 */
export const XP_CONFLICT_THRESHOLD = 100;

/**
 * Mobile breakpoint in px.
 */
export const MOBILE_BREAKPOINT = 768;

/**
 * Maximum number of concurrent toasts displayed.
 */
export const TOAST_LIMIT = 1;

/**
 * Toast auto-dismiss delay in ms (5 seconds).
 */
export const TOAST_REMOVE_DELAY_MS = 5000;

/**
 * Interval for cleaning up stale rate-limit entries in ms (5 minutes).
 */
export const RATE_LIMIT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
