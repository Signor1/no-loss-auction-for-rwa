import { EventEmitter } from 'events';
import {
  ComplianceRule,
  IComplianceRule,
  RuleType,
  TriggerType,
  OperatorType,
  ActionType
} from '../models/ComplianceRule';

export { RuleType, TriggerType, OperatorType, ActionType };

export class ComplianceRuleEngine extends EventEmitter {

  constructor() {
    super();
  }

  async createRule(data: Partial<IComplianceRule>): Promise<IComplianceRule> {
    const rule = new ComplianceRule({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      successCount: 0,
      errorCount: 0
    });
    await rule.save();
    this.emit('ruleCreated', rule);
    return rule;
  }

  async updateRule(ruleId: string, updates: Partial<IComplianceRule>): Promise<IComplianceRule | null> {
    const updated = await ComplianceRule.findByIdAndUpdate(ruleId, updates, { new: true });
    if (updated) {
      this.emit('ruleUpdated', updated);
    }
    return updated;
  }

  async getRules(filters: any = {}): Promise<IComplianceRule[]> {
    return ComplianceRule.find(filters).sort({ priority: 1 });
  }

  async executeRule(ruleId: string, context: any): Promise<any> {
    const rule = await ComplianceRule.findById(ruleId);
    if (!rule || rule.status !== 'active') return { success: false, reason: 'Rule not found or inactive' };

    let conditionsMet = true;
    for (const condition of rule.conditions) {
      const val = this.getNestedValue(context, condition.field);
      if (!this.evaluateCondition(val, condition.operator, condition.value)) {
        conditionsMet = false;
        break;
      }
    }

    if (!conditionsMet) {
      return { success: true, conditionsMet: false };
    }

    // Execute actions
    const actionResults = [];
    for (const action of rule.actions) {
      // Mock execution - in real app would trigger notifications, updates etc
      actionResults.push({ type: action.type, status: 'simulated_success' });
    }

    rule.lastExecuted = new Date();
    rule.executionCount++;
    rule.successCount++;
    await rule.save();

    this.emit('ruleExecuted', { ruleId, context, actionResults });
    return { success: true, conditionsMet: true, actionResults };
  }

  private evaluateCondition(actual: any, operator: OperatorType, expected: any): boolean {
    switch (operator) {
      case OperatorType.EQUALS: return actual === expected;
      case OperatorType.NOT_EQUALS: return actual !== expected;
      case OperatorType.GREATER_THAN: return actual > expected;
      case OperatorType.LESS_THAN: return actual < expected;
      case OperatorType.CONTAINS: return String(actual).includes(String(expected));
      case OperatorType.IN: return Array.isArray(expected) && expected.includes(actual);
      default: return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }
}
