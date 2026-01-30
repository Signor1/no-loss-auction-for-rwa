import { EventEmitter } from 'events';
import crypto from 'crypto';
import { AuditLog, IAuditLog, AuditEventType, AuditSeverity } from '../models/AuditLog';

export { AuditEventType, AuditSeverity };

export class AuditLoggingService extends EventEmitter {

  constructor() {
    super();
  }

  private calculateHash(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  async log(data: Partial<IAuditLog>): Promise<IAuditLog> {
    const lastLog = await AuditLog.findOne().sort({ timestamp: -1 });
    const previousHash = lastLog?.hash;

    const logEntry = new AuditLog({
      ...data,
      timestamp: new Date(),
      status: data.status || 'success',
      previousHash
    });

    // Calculate hash for the new record (including previousHash link)
    logEntry.hash = this.calculateHash({
      timestamp: logEntry.timestamp,
      eventType: logEntry.eventType,
      severity: logEntry.severity,
      userId: logEntry.userId,
      resource: logEntry.resource,
      action: logEntry.action,
      details: logEntry.details,
      previousHash
    });

    await logEntry.save();
    this.emit('auditLogCreated', logEntry);

    if (logEntry.severity === AuditSeverity.CRITICAL) {
      this.emit('criticalEventDetected', logEntry);
    }

    return logEntry;
  }

  async verifyIntegrity(): Promise<{ valid: boolean; brokenAt?: string }> {
    const logs = await AuditLog.find().sort({ timestamp: 1 });
    let expectedPreviousHash: string | undefined = undefined;

    for (const log of logs) {
      if (log.previousHash !== expectedPreviousHash) {
        return { valid: false, brokenAt: log.id };
      }

      const actualHash = this.calculateHash({
        timestamp: log.timestamp,
        eventType: log.eventType,
        severity: log.severity,
        userId: log.userId,
        resource: log.resource,
        action: log.action,
        details: log.details,
        previousHash: log.previousHash
      });

      if (log.hash !== actualHash) {
        return { valid: false, brokenAt: log.id };
      }

      expectedPreviousHash = log.hash;
    }

    return { valid: true };
  }

  async generateCSV(query: any = {}): Promise<string> {
    const logs = await AuditLog.find(query).sort({ timestamp: -1 });
    const header = 'Timestamp,Event,Severity,User,Resource,Action,Status,Hash\n';
    const rows = logs.map(l =>
      `${l.timestamp.toISOString()},${l.eventType},${l.severity},${l.userId || 'system'},${l.resource},${l.action},${l.status},${l.hash}`
    ).join('\n');
    return header + rows;
  }

  async queryLogs(query: any = {}): Promise<IAuditLog[]> {
    const { limit = 100, skip = 0, ...filters } = query;
    return AuditLog.find(filters)
      .sort({ timestamp: -1 })
      .skip(Number(skip))
      .limit(Number(limit));
  }
}
