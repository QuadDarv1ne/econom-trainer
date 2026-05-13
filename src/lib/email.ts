/**
 * Email sending utility using Resend API
 * For password reset, email verification, and notifications
 */

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
    console.warn('[Email] Would have sent to:', to, 'Subject:', subject);
    console.warn('[Email] HTML:', html);
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
        from: process.env.EMAIL_FROM || 'noreply@econom-trainer.com',
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('[Email] Failed to send:', error);
      return false;
    }

    console.log('[Email] Sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
}

export function getPasswordResetEmailHtml(
  name: string,
  resetUrl: string
): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Экономический тренажёр</h2>
      <p>Здравствуйте, ${name}!</p>
      <p>Вы запросили сброс пароля. Нажмите на кнопку ниже, чтобы установить новый пароль:</p>
      <a href="${resetUrl}"
         style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Сбросить пароль
      </a>
      <p style="color: #666; font-size: 14px;">
        Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
      </p>
      <p style="color: #666; font-size: 12px;">
        Ссылка действительна в течение 1 часа.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">
        Экономический тренажёр — интерактивная платформа для изучения экономики
      </p>
    </div>
  `;
}

export function getEmailVerificationEmailHtml(
  name: string,
  verificationUrl: string
): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Экономический тренажёр</h2>
      <p>Здравствуйте, ${name}!</p>
      <p>Спасибо за регистрацию. Нажмите на кнопку ниже, чтобы подтвердить email:</p>
      <a href="${verificationUrl}"
         style="display: inline-block; background: #10b981; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Подтвердить email
      </a>
      <p style="color: #666; font-size: 14px;">
        Если вы не создавали аккаунт, проигнорируйте это письмо.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">
        Экономический тренажёр — интерактивная платформа для изучения экономики
      </p>
    </div>
  `;
}
