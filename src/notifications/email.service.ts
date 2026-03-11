import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async sendContractEmail(
    email: string,
    candidateName: string,
    contractUrl: string,
  ) {
    const maxRetries = 3;
    let attempt = 0;

    const send = async () => {
      try {
        await this.resend.emails.send({
          from: 'Acme <onboarding@resend.dev>',
          to: [email],
          subject: 'Your Job Contract is Ready!',
          html: `<p>Hi ${candidateName},</p><p>Your contract is ready for review: <a href="${contractUrl}">${contractUrl}</a></p>`,
        });
        this.logger.log(`Email sent successfully to ${email}`);
      } catch (error) {
        this.logger.error(`Failed to send email to ${email}`, error);
        throw error;
      }
    };

    while (attempt < maxRetries) {
      try {
        await send();
        return;
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) throw error;
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}
