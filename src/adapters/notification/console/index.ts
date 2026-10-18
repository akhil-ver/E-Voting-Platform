/**
 * Notification Adapter
 * Implements INotificationService with console & in-app telemetry logging
 */
import { INotificationService } from '../../../services/interfaces';

export interface InAppNotification {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  type: 'ALERT' | 'RECEIPT' | 'AUDIT';
  timestamp: string;
}

export class ConsoleNotificationService implements INotificationService {
  private notifications: InAppNotification[] = [];

  public async send(
    recipient: string,
    message: { subject: string; body: string; type: 'ALERT' | 'RECEIPT' | 'AUDIT' }
  ): Promise<boolean> {
    const item: InAppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipient,
      subject: message.subject,
      body: message.body,
      type: message.type,
      timestamp: new Date().toISOString(),
    };
    this.notifications.unshift(item);
    return true;
  }

  public async broadcast(
    topic: string,
    alert: { title: string; message: string; severity: 'INFO' | 'WARNING' | 'CRITICAL' }
  ): Promise<number> {
    const item: InAppNotification = {
      id: `broadcast-${Date.now()}`,
      recipient: `topic:${topic}`,
      subject: `[${alert.severity}] ${alert.title}`,
      body: alert.message,
      type: 'ALERT',
      timestamp: new Date().toISOString(),
    };
    this.notifications.unshift(item);
    return 1;
  }

  public async healthCheck(): Promise<{ status: 'HEALTHY' | 'UNAVAILABLE'; provider: string }> {
    return {
      status: 'HEALTHY',
      provider: 'in-app-console',
    };
  }

  public getRecentNotifications(): InAppNotification[] {
    return this.notifications.slice(0, 50);
  }
}
