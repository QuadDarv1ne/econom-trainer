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
