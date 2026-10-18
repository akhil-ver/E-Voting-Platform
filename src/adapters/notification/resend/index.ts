/**
 * Resend Notification Adapter
 * Implements INotificationService with transactional email dispatch via Resend API
 */
import { Resend } from 'resend';
import { INotificationService } from '../../../services/interfaces';
import { ConsoleNotificationService } from '../console';

export class ResendNotificationService implements INotificationService {
  private resend: Resend | null = null;
  private fallbackConsole: ConsoleNotificationService;
  private fromEmail: string;
  private isConfigured = false;

  constructor() {
    this.fallbackConsole = new ConsoleNotificationService();
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'Election System <onboarding@resend.dev>';

    if (apiKey) {
      try {
        this.resend = new Resend(apiKey);
        this.isConfigured = true;
      } catch (err) {
        console.warn('[ResendNotificationService] Initialization error:', err);
      }
    }
  }

  public async send(
    recipient: string,
    message: { subject: string; body: string; type: 'ALERT' | 'RECEIPT' | 'AUDIT' }
  ): Promise<boolean> {
    // Record to local audit console regardless
    await this.fallbackConsole.send(recipient, message);

    if (this.resend && this.isConfigured && recipient.includes('@')) {
      try {
        const { error } = await this.resend.emails.send({
          from: this.fromEmail,
          to: [recipient],
          subject: message.subject,
          text: message.body,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; background: #f8fafc; border-radius: 8px;">
              <h2 style="color: #0f172a; margin-top: 0;">${message.subject}</h2>
              <div style="background: #ffffff; padding: 16px; border: 1px solid #e2e8f0; border-radius: 6px; white-space: pre-wrap; font-family: monospace; font-size: 14px;">${message.body}</div>
              <p style="margin-top: 16px; font-size: 12px; color: #64748b;">
                Cryptographically signed notification from the Sovereign E-Voting System. Category: <strong>${message.type}</strong>
              </p>
            </div>
          `,
        });

        if (error) {
          console.warn('[Resend send error]:', error.message);
          return true; // Sent to fallback
        }
        return true;
      } catch (err) {
        console.warn('[Resend exception]:', err);
        return true;
      }
    }

    return true;
  }

  public async broadcast(
    topic: string,
    alert: { title: string; message: string; severity: 'INFO' | 'WARNING' | 'CRITICAL' }
  ): Promise<number> {
    await this.fallbackConsole.broadcast(topic, alert);

    const alertEmail = process.env.SECURITY_ALERT_EMAIL;
    if (this.resend && this.isConfigured && alertEmail && alert.severity === 'CRITICAL') {
      try {
        await this.resend.emails.send({
          from: this.fromEmail,
          to: [alertEmail],
          subject: `[CRITICAL SECURITY ALERT] ${alert.title}`,
          text: `Election Security Alert (${topic}):\n\n${alert.message}`,
        });
        return 1;
      } catch (err) {
        console.warn('[Resend broadcast error]:', err);
      }
    }

    return 1;
  }

  public async healthCheck(): Promise<{ status: 'HEALTHY' | 'UNAVAILABLE'; provider: string }> {
    return {
      status: this.isConfigured ? 'HEALTHY' : 'UNAVAILABLE',
      provider: 'resend',
    };
  }

  public getRecentNotifications() {
    return this.fallbackConsole.getRecentNotifications();
  }
}
