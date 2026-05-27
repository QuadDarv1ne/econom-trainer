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
  const parts = acceptLanguage.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);

  // Parse each part with its quality factor and sort by quality descending
  const parsed = parts.map((part) => {
    const [locale, ...params] = part.split(';');
    let quality = 1;
    for (const param of params) {
      const match = param.trim().match(/^q=(\d(?:\.\d+)?)$/);
      if (match) quality = parseFloat(match[1]);
    }
    return { locale, quality };
  });

  parsed.sort((a, b) => b.quality - a.quality);

  for (const { locale } of parsed) {
    if (locale.startsWith('zh')) return 'zh';
    if (locale.startsWith('en')) return 'en';
    if (locale.startsWith('ru')) return 'ru';
  }
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
    logError('email-config', new Error('RESEND_API_KEY not configured. Email not sent.'));
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
  zh: {
    siteName: '经济训练师',
    siteDescription: '经济训练师 — 一个学习经济学的互动平台',
    greeting: '你好',
    resetPassword: {
      body: '您请求了密码重置。点击下面的按钮设置新密码：',
      button: '重置密码',
      ignore: '如果您没有请求密码重置，请忽略此邮件。',
      expiry: '此链接有效期为1小时。',
    },
    verifyEmail: {
      body: '感谢您的注册。点击下面的按钮验证您的邮箱：',
      button: '验证邮箱',
      ignore: '如果您没有创建账户，请忽略此邮件。',
    },
  },
};

export function getPasswordResetEmailHtml(
  name: string,
  resetUrl: string,
  locale: Locale = 'ru'
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
  locale: Locale = 'ru'
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
