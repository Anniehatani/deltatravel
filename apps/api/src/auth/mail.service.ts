import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(private readonly config: ConfigService) {}

  private provider() {
    return (
      this.config.get<'DISABLED' | 'CONSOLE' | 'RESEND' | 'SENDGRID'>('MAIL_PROVIDER') || 'DISABLED'
    );
  }

  async sendPasswordReset(to: string, code: string, minutes = 10) {
    const provider = this.provider();
    const from = this.config.get<string>('MAIL_FROM') || 'no-reply@delta-travel.local';
    const subject = 'DELTA TRAVEL - Mã xác thực đặt lại mật khẩu';
    const body =
      'Mã OTP đặt lại mật khẩu của bạn là: ' +
      code +
      '. Mã có hiệu lực trong ' +
      minutes +
      ' phút. Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email.';

    if (provider === 'DISABLED') {
      throw new Error('Password reset email is not configured');
    }

    if (provider === 'CONSOLE') {
      if (this.config.get('NODE_ENV') === 'production') {
        throw new Error('Console mail provider is disabled in production');
      }
      console.info(
        JSON.stringify({
          level: 'info',
          event: 'password_reset_otp_dev',
          to,
          code,
          expiresInMinutes: minutes,
        }),
      );
      return;
    }

    if (provider === 'RESEND') {
      const key = this.config.get<string>('RESEND_API_KEY');
      if (!key) throw new Error('RESEND_API_KEY is not configured');
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: 'Bearer ' + key,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          text: body,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        throw new Error('Resend rejected password reset email');
      }
      return;
    }

    const key = this.config.get<string>('SENDGRID_API_KEY');
    if (!key) throw new Error('SENDGRID_API_KEY is not configured');
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + key,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from },
        subject,
        content: [{ type: 'text/plain', value: body }],
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      throw new Error('SendGrid rejected password reset email');
    }
  }
}
