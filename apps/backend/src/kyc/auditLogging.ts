import { EventEmitter } from 'events';
import { AuditLog, IAuditLog, AuditEventType, AuditSeverity } from '../models/AuditLog';

export { AuditEventType, AuditSeverity };

export class AuditLoggingService extends EventEmitter {

  constructor() {
    super();
  }

  async log(data: Partial<IAuditLog>): Promise<IAuditLog> {
    const logEntry = new AuditLog({
      ...data,
      timestamp: new Date(),
      status: data.status || 'success'
    });

    await logEntry.save();
    this.emit('auditLogCreated', logEntry);

    // Auto-trigger alerts for critical events
    if (logEntry.severity === AuditSeverity.CRITICAL) {
      this.emit('criticalEventDetected', logEntry);
    }

    return logEntry;
  }

  async queryLogs(query: any = {}): Promise<IAuditLog[]> {
    const { limit = 100, skip = 0, ...filters } = query;
    return AuditLog.find(filters)
      .sort({ timestamp: -1 })
      .skip(Number(skip))
      .limit(Number(limit));
  }

  async getMetrics(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logsToday = await AuditLog.countDocuments({ timestamp: { $gte: today } });
    const totalLogs = await AuditLog.countDocuments();
    const criticalEvents = await AuditLog.countDocuments({ severity: AuditSeverity.CRITICAL });

    return {
      totalLogs,
      logsToday,
      criticalEvents,
      securityIncidents: await AuditLog.countDocuments({ eventType: AuditEventType.SECURITY_INCIDENT })
    };
  }
}
