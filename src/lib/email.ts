/**
 * Email sending utility using Resend API
 * For password reset, email verification, and notifications
 */

import type { Locale } from '@/lib/i18n';
import { logError } from '@/lib/log-error';

/**
 * Detect user locale from the Accept-Language header.
 * Falls back to 'ru' if no matching locale is found.
 */
export function getLocaleFromRequest(req: Request): Locale {
  const acceptLanguage = req.headers.get('accept-language') || '';
  const primary = acceptLanguage.split(',')[0]?.trim().toLowerCase() || '';
  if (primary.startsWith('en')) return 'en';
  return 'ru';
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.warn('[Email] RESEND_API_KEY not configured. Email not sent.');
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev', // Resend allows this default; configure EMAIL_FROM for production
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      }),
    });

    if (!res.ok) {
      let error: unknown;
      try {
        error = await res.json();
      } catch {
        error = { message: res.statusText || `HTTP ${res.status}` };
      }
      logError('email-send', error);
      return false;
    }

    return true;
  } catch (error) {
    logError('email-error', error);
    return false;
  }
}

const escapeHtml = (str: string) =>
  str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m] ?? m));

const escapeUrl = (url: string) => escapeHtml(url).replace(/ /g, '%20');

const emailTranslations = {
  ru: {
    siteName: 'Экономический тренажёр',
    siteDescription: 'Экономический тренажёр — интерактивная платформа для изучения экономики',
    greeting: 'Здравствуйте',
    resetPassword: {
      body: 'Вы запросили сброс пароля. Нажмите на кнопку ниже, чтобы установить новый пароль:',
      button: 'Сбросить пароль',
      ignore: 'Если вы не запрашивали сброс пароля, проигнорируйте это письмо.',
      expiry: 'Ссылка действительна в течение 1 часа.',
    },
    verifyEmail: {
      body: 'Спасибо за регистрацию. Нажмите на кнопку ниже, чтобы подтвердить email:',
      button: 'Подтвердить email',
      ignore: 'Если вы не создавали аккаунт, проигнорируйте это письмо.',
    },
  },
  en: {
    siteName: 'Economic Trainer',
    siteDescription: 'Economic Trainer — an interactive platform for learning economics',
    greeting: 'Hello',
    resetPassword: {
      body: 'You requested a password reset. Click the button below to set a new password:',
      button: 'Reset Password',
      ignore: 'If you did not request a password reset, please ignore this email.',
      expiry: 'This link is valid for 1 hour.',
    },
    verifyEmail: {
      body: 'Thank you for registering. Click the button below to verify your email:',
      button: 'Verify Email',
      ignore: 'If you did not create an account, please ignore this email.',
    },
  },
};

export function getPasswordResetEmailHtml(
  name: string,
  resetUrl: string,
  locale: 'ru' | 'en' = 'ru'
): string {
  const t = emailTranslations[locale];
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">${t.siteName}</h2>
      <p>${t.greeting}, ${escapeHtml(name)}!</p>
      <p>${t.resetPassword.body}</p>
      <a href="${escapeUrl(resetUrl)}"
         style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 6px; margin: 16px 0;">
        ${t.resetPassword.button}
      </a>
      <p style="color: #666; font-size: 14px;">
        ${t.resetPassword.ignore}
      </p>
      <p style="color: #666; font-size: 12px;">
        ${t.resetPassword.expiry}
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">
        ${t.siteDescription}
      </p>
    </div>
  `;
}

export function getEmailVerificationEmailHtml(
  name: string,
  verificationUrl: string,
  locale: 'ru' | 'en' = 'ru'
): string {
  const t = emailTranslations[locale];
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">${t.siteName}</h2>
      <p>${t.greeting}, ${escapeHtml(name)}!</p>
      <p>${t.verifyEmail.body}</p>
      <a href="${escapeUrl(verificationUrl)}"
         style="display: inline-block; background: #10b981; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 6px; margin: 16px 0;">
        ${t.verifyEmail.button}
      </a>
      <p style="color: #666; font-size: 14px;">
        ${t.verifyEmail.ignore}
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">
        ${t.siteDescription}
      </p>
    </div>
  `;
}
