/**
 * Security-related constants.
 */

/**
 * Bcrypt salt rounds for password hashing.
 * 12 rounds provides a good balance between security and performance (~250ms per hash).
 */
export const BCRYPT_SALT_ROUNDS = 12;

/**
 * Bcrypt salt rounds for less sensitive data (e.g., backup codes).
 * Using same rounds as passwords for consistency.
 */
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
 * Falls back to localhost in development.
 */
export const BASE_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

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
 * Maximum number of module interaction records to keep in localStorage.
 */
export const MAX_MODULE_INTERACTIONS = 500;

/**
 * Maximum number of daily challenge records to keep in localStorage.
 */
export const MAX_DAILY_CHALLENGES = 30;
