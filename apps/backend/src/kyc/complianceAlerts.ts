import { EventEmitter } from 'events';
import { SecurityAlert, ISecurityAlert, AlertType, AlertStatus } from '../models/SecurityAlert';

export { AlertType, AlertStatus };

export class ComplianceAlertsService extends EventEmitter {

  constructor() {
    super();
  }

  async createAlert(data: Partial<ISecurityAlert>): Promise<ISecurityAlert> {
    const alert = new SecurityAlert({
      ...data,
      triggeredAt: new Date(),
      status: AlertStatus.OPEN
    });

    await alert.save();
    this.emit('alertCreated', alert);
    return alert;
  }

  async getAlerts(filters: any = {}): Promise<ISecurityAlert[]> {
    return SecurityAlert.find(filters).sort({ triggeredAt: -1 });
  }

  async resolveAlert(alertId: string, userId: string, resolution?: string): Promise<ISecurityAlert | null> {
    const alert = await SecurityAlert.findByIdAndUpdate(
      alertId,
      {
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedBy: userId,
        'metadata.resolution': resolution
      },
      { new: true }
    );

    if (alert) {
      this.emit('alertResolved', alert);
    }
    return alert;
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<ISecurityAlert | null> {
    return SecurityAlert.findByIdAndUpdate(
      alertId,
      {
        status: AlertStatus.ACKNOWLEDGED,
        metadata: { acknowledgedBy: userId, acknowledgedAt: new Date() }
      },
      { new: true }
    );
  }
}
