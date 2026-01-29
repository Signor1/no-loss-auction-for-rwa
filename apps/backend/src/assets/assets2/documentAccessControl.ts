import { EventEmitter } from 'events';

// Enums
export enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  SHARE = 'share',
  ADMIN = 'admin'
}

export enum Role {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  COMMENTER = 'commenter',
  CUSTOM = 'custom'
}

export enum AccessLevel {
  PRIVATE = 'private',
  TEAM = 'team',
  ORGANIZATION = 'organization',
  PUBLIC = 'public'
}

export enum ResourceType {
  DOCUMENT = 'document',
  COLLECTION = 'collection',
  FOLDER = 'folder',
  VERSION = 'version'
}

// Interfaces
export interface AccessPolicy {
  id: string;
  resourceId: string;
  resourceType: ResourceType;
  permissions: Permission[];
  subjectId: string;
  subjectType: 'user' | 'role' | 'group';
  conditions?: AccessCondition[];
  expiresAt?: Date;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface AccessCondition {
  type: 'time' | 'location' | 'device' | 'ip' | 'custom';
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
  description?: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  members: string[];
  permissions: Permission[];
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface AccessRequest {
  id: string;
  resourceId: string;
  resourceType: ResourceType;
  requestedBy: string;
  requestedPermissions: Permission[];
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComment?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface AccessAudit {
  id: string;
  resourceId: string;
  resourceType: ResourceType;
  userId: string;
  action: 'access_granted' | 'access_denied' | 'permission_modified' | 'policy_created' | 'policy_deleted';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface AccessStats {
  totalPolicies: number;
  activePolicies: number;
  expiredPolicies: number;
  policiesByResourceType: Record<ResourceType, number>;
  policiesBySubjectType: Record<string, number>;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  recentActivity: AccessAudit[];
  topAccessedResources: {
    resourceId: string;
    accessCount: number;
  }[];
}

// Main Document Access Control Service
export class DocumentAccessControlService extends EventEmitter {
  private policies: Map<string, AccessPolicy> = new Map();
  private roles: Map<string, RoleDefinition> = new Map();
  private groups: Map<string, UserGroup> = new Map();
  private requests: Map<string, AccessRequest> = new Map();
  private auditLogs: AccessAudit[] = [];
  private resourceOwners: Map<string, string> = new Map(); // resourceId -> userId

  constructor() {
    super();
    this.initializeSystemRoles();
  }

  // Policy Management
  async createPolicy(policy: Omit<AccessPolicy, 'id' | 'createdAt' | 'isActive'>): Promise<AccessPolicy> {
    const newPolicy: AccessPolicy = {
      ...policy,
      id: this.generateId(),
      createdAt: new Date(),
      isActive: true
    };

    // Validate policy
    this.validatePolicy(newPolicy);

    // Store policy
    this.policies.set(newPolicy.id, newPolicy);

    // Log audit
    this.logAudit({
      resourceId: newPolicy.resourceId,
      resourceType: newPolicy.resourceType,
      userId: newPolicy.createdBy,
      action: 'policy_created',
      details: { policyId: newPolicy.id, permissions: newPolicy.permissions }
    });

    this.emit('policyCreated', newPolicy);
    return newPolicy;
  }

  async getPolicy(policyId: string): Promise<AccessPolicy | null> {
    return this.policies.get(policyId) || null;
  }

  async updatePolicy(
    policyId: string,
    updates: Partial<Pick<AccessPolicy, 'permissions' | 'conditions' | 'expiresAt' | 'isActive'>>,
    updatedBy: string
  ): Promise<boolean> {
    const policy = this.policies.get(policyId);
    if (!policy) return false;

    const oldPermissions = [...policy.permissions];
    Object.assign(policy, updates);

    // Log audit
    this.logAudit({
      resourceId: policy.resourceId,
      resourceType: policy.resourceType,
      userId: updatedBy,
      action: 'permission_modified',
      details: {
        policyId: policyId,
        oldPermissions,
        newPermissions: policy.permissions,
        updates
      }
    });

    this.emit('policyUpdated', { policyId, updates, updatedBy });
    return true;
  }

  async deletePolicy(policyId: string, deletedBy: string): Promise<boolean> {
    const policy = this.policies.get(policyId);
    if (!policy) return false;

    this.policies.delete(policyId);

    // Log audit
    this.logAudit({
      resourceId: policy.resourceId,
      resourceType: policy.resourceType,
      userId: deletedBy,
      action: 'policy_deleted',
      details: { policyId: policyId, permissions: policy.permissions }
    });

    this.emit('policyDeleted', { policyId, deletedBy });
    return true;
  }

  async getResourcePolicies(resourceId: string): Promise<AccessPolicy[]> {
    return Array.from(this.policies.values())
      .filter(policy => policy.resourceId === resourceId && policy.isActive);
  }

  async getUserPolicies(userId: string): Promise<AccessPolicy[]> {
    return Array.from(this.policies.values())
      .filter(policy => 
        policy.isActive && 
        (policy.subjectId === userId || 
         this.isUserInGroup(userId, policy.subjectId))
      );
  }

  // Access Control
  async checkAccess(
    resourceId: string,
    resourceType: ResourceType,
    userId: string,
    requiredPermission: Permission,
    context?: {
      ipAddress?: string;
      userAgent?: string;
      timestamp?: Date;
    }
  ): Promise<{ allowed: boolean; reason?: string }> {
    const policies = await this.getApplicablePolicies(resourceId, resourceType, userId);
    
    // Check owner access first
    if (this.resourceOwners.get(resourceId) === userId) {
      this.logAudit({
        resourceId,
        resourceType,
        userId,
        action: 'access_granted',
        details: { reason: 'owner', permission: requiredPermission },
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        timestamp: context?.timestamp || new Date()
      });
      return { allowed: true };
    }

    // Check policies
    for (const policy of policies) {
      if (policy.permissions.includes(requiredPermission)) {
        // Check conditions
        if (policy.conditions && policy.conditions.length > 0) {
          const conditionsMet = await this.evaluateConditions(policy.conditions, context);
          if (!conditionsMet) {
            continue;
          }
        }

        // Check expiration
        if (policy.expiresAt && policy.expiresAt < new Date()) {
          continue;
        }

        this.logAudit({
          resourceId,
          resourceType,
          userId,
          action: 'access_granted',
          details: { 
            reason: 'policy', 
            policyId: policy.id, 
            permission: requiredPermission 
          },
          ipAddress: context?.ipAddress,
          userAgent: context?.userAgent,
          timestamp: context?.timestamp || new Date()
        });
        return { allowed: true };
      }
    }

    // Access denied
    this.logAudit({
      resourceId,
      resourceType,
      userId,
      action: 'access_denied',
      details: { reason: 'no_permission', permission: requiredPermission },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      timestamp: context?.timestamp || new Date()
    });
    return { allowed: false, reason: 'Insufficient permissions' };
  }

  async hasPermission(
    userId: string,
    resourceId: string,
    resourceType: ResourceType,
    permission: Permission
  ): Promise<boolean> {
    const result = await this.checkAccess(resourceId, resourceType, userId, permission);
    return result.allowed;
  }

  private async getApplicablePolicies(
    resourceId: string,
    resourceType: ResourceType,
    userId: string
  ): Promise<AccessPolicy[]> {
    return Array.from(this.policies.values()).filter(policy =>
      policy.isActive &&
      policy.resourceId === resourceId &&
      policy.resourceType === resourceType &&
      (policy.subjectId === userId || 
       policy.subjectType === 'role' ||
       (policy.subjectType === 'group' && this.isUserInGroup(userId, policy.subjectId)))
    );
  }

  private async evaluateConditions(
    conditions: AccessCondition[],
    context?: {
      ipAddress?: string;
      userAgent?: string;
      timestamp?: Date;
    }
  ): Promise<boolean> {
    if (!context) return true;

    for (const condition of conditions) {
      let actualValue: any;

      switch (condition.type) {
        case 'ip':
          actualValue = context.ipAddress;
          break;
        case 'time':
          actualValue = context.timestamp || new Date();
          break;
        case 'device':
          actualValue = context.userAgent;
          break;
        default:
          actualValue = null;
      }

      if (!this.evaluateCondition(actualValue, condition.operator, condition.value)) {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'not_equals':
        return actual !== expected;
      case 'contains':
        return typeof actual === 'string' && actual.includes(expected);
      case 'not_contains':
        return typeof actual === 'string' && !actual.includes(expected);
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      case 'between':
        return Array.isArray(expected) && actual >= expected[0] && actual <= expected[1];
      default:
        return false;
    }
  }

  // Role Management
  async createRole(role: Omit<RoleDefinition, 'id' | 'createdAt' | 'isSystem'>): Promise<RoleDefinition> {
    const newRole: RoleDefinition = {
      ...role,
      id: this.generateId(),
      createdAt: new Date(),
      isSystem: false
    };

    this.roles.set(newRole.id, newRole);
    this.emit('roleCreated', newRole);
    return newRole;
  }

  async getRole(roleId: string): Promise<RoleDefinition | null> {
    return this.roles.get(roleId) || null;
  }

  async getRoles(): Promise<RoleDefinition[]> {
    return Array.from(this.roles.values());
  }

  async updateRole(
    roleId: string,
    updates: Partial<Pick<RoleDefinition, 'name' | 'description' | 'permissions'>>,
    updatedBy: string
  ): Promise<boolean> {
    const role = this.roles.get(roleId);
    if (!role || role.isSystem) return false;

    Object.assign(role, updates);
    this.emit('roleUpdated', { roleId, updates, updatedBy });
    return true;
  }

  async deleteRole(roleId: string, deletedBy: string): Promise<boolean> {
    const role = this.roles.get(roleId);
    if (!role || role.isSystem) return false;

    // Check if role is in use
    const policiesInUse = Array.from(this.policies.values())
      .filter(policy => policy.subjectId === roleId);
    
    if (policiesInUse.length > 0) {
      throw new Error('Cannot delete role that is in use');
    }

    this.roles.delete(roleId);
    this.emit('roleDeleted', { roleId, deletedBy });
    return true;
  }

  // Group Management
  async createGroup(group: Omit<UserGroup, 'id' | 'createdAt' | 'isActive'>): Promise<UserGroup> {
    const newGroup: UserGroup = {
      ...group,
      id: this.generateId(),
      createdAt: new Date(),
      isActive: true
    };

    this.groups.set(newGroup.id, newGroup);
    this.emit('groupCreated', newGroup);
    return newGroup;
  }

  async getGroup(groupId: string): Promise<UserGroup | null> {
    return this.groups.get(groupId) || null;
  }

  async getGroups(): Promise<UserGroup[]> {
    return Array.from(this.groups.values());
  }

  async addUserToGroup(groupId: string, userId: string): Promise<boolean> {
    const group = this.groups.get(groupId);
    if (!group) return false;

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      this.emit('userAddedToGroup', { groupId, userId });
    }
    return true;
  }

  async removeUserFromGroup(groupId: string, userId: string): Promise<boolean> {
    const group = this.groups.get(groupId);
    if (!group) return false;

    const index = group.members.indexOf(userId);
    if (index > -1) {
      group.members.splice(index, 1);
      this.emit('userRemovedFromGroup', { groupId, userId });
    }
    return true;
  }

  private isUserInGroup(userId: string, groupId: string): boolean {
    const group = this.groups.get(groupId);
    return group ? group.members.includes(userId) : false;
  }

  // Access Requests
  async createRequest(request: Omit<AccessRequest, 'id' | 'status' | 'createdAt'>): Promise<AccessRequest> {
    const newRequest: AccessRequest = {
      ...request,
      id: this.generateId(),
      status: 'pending',
      createdAt: new Date()
    };

    this.requests.set(newRequest.id, newRequest);
    this.emit('requestCreated', newRequest);
    return newRequest;
  }

  async getRequest(requestId: string): Promise<AccessRequest | null> {
    return this.requests.get(requestId) || null;
  }

  async getRequests(resourceId?: string, userId?: string): Promise<AccessRequest[]> {
    return Array.from(this.requests.values())
      .filter(request => 
        (!resourceId || request.resourceId === resourceId) &&
        (!userId || request.requestedBy === userId)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async approveRequest(
    requestId: string,
    approvedBy: string,
    comment?: string
  ): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'pending') return false;

    request.status = 'approved';
    request.reviewedBy = approvedBy;
    request.reviewedAt = new Date();
    request.reviewComment = comment;

    // Create policy for approved request
    await this.createPolicy({
      resourceId: request.resourceId,
      resourceType: request.resourceType,
      permissions: request.requestedPermissions,
      subjectId: request.requestedBy,
      subjectType: 'user',
      createdBy: approvedBy,
      expiresAt: request.expiresAt
    });

    this.emit('requestApproved', { requestId, approvedBy, comment });
    return true;
  }

  async rejectRequest(
    requestId: string,
    rejectedBy: string,
    comment?: string
  ): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'pending') return false;

    request.status = 'rejected';
    request.reviewedBy = rejectedBy;
    request.reviewedAt = new Date();
    request.reviewComment = comment;

    this.emit('requestRejected', { requestId, rejectedBy, comment });
    return true;
  }

  // Resource Ownership
  async setResourceOwner(resourceId: string, userId: string): Promise<void> {
    this.resourceOwners.set(resourceId, userId);
    this.emit('resourceOwnerSet', { resourceId, userId });
  }

  async getResourceOwner(resourceId: string): Promise<string | null> {
    return this.resourceOwners.get(resourceId) || null;
  }

  // Audit and Logging
  private logAudit(audit: Omit<AccessAudit, 'id' | 'timestamp'>): void {
    const auditEntry: AccessAudit = {
      ...audit,
      id: this.generateId(),
      timestamp: new Date()
    };

    this.auditLogs.push(auditEntry);

    // Keep only last 10000 audit entries
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }

    this.emit('auditLogged', auditEntry);
  }

  async getAuditLogs(
    filters?: {
      resourceId?: string;
      resourceType?: ResourceType;
      userId?: string;
      action?: string;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
    }
  ): Promise<AccessAudit[]> {
    let logs = [...this.auditLogs];

    if (filters) {
      if (filters.resourceId) {
        logs = logs.filter(log => log.resourceId === filters.resourceId);
      }
      if (filters.resourceType) {
        logs = logs.filter(log => log.resourceType === filters.resourceType);
      }
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.dateFrom) {
        logs = logs.filter(log => log.timestamp >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        logs = logs.filter(log => log.timestamp <= filters.dateTo!);
      }
    }

    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, filters?.limit || 1000);
  }

  // Statistics
  async getStats(): Promise<AccessStats> {
    const policies = Array.from(this.policies.values());
    const requests = Array.from(this.requests.values());
    const recentLogs = this.auditLogs.slice(-100);

    const policiesByResourceType: Record<ResourceType, number> = {
      [ResourceType.DOCUMENT]: 0,
      [ResourceType.COLLECTION]: 0,
      [ResourceType.FOLDER]: 0,
      [ResourceType.VERSION]: 0
    };

    const policiesBySubjectType: Record<string, number> = {};

    for (const policy of policies) {
      policiesByResourceType[policy.resourceType]++;
      policiesBySubjectType[policy.subjectType] = 
        (policiesBySubjectType[policy.subjectType] || 0) + 1;
    }

    // Calculate top accessed resources
    const accessCounts = new Map<string, number>();
    for (const log of this.auditLogs) {
      if (log.action === 'access_granted') {
        accessCounts.set(
          log.resourceId,
          (accessCounts.get(log.resourceId) || 0) + 1
        );
      }
    }

    const topAccessedResources = Array.from(accessCounts.entries())
      .map(([resourceId, accessCount]) => ({ resourceId, accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    return {
      totalPolicies: policies.length,
      activePolicies: policies.filter(p => p.isActive).length,
      expiredPolicies: policies.filter(p => p.expiresAt && p.expiresAt < new Date()).length,
      policiesByResourceType,
      policiesBySubjectType,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      approvedRequests: requests.filter(r => r.status === 'approved').length,
      rejectedRequests: requests.filter(r => r.status === 'rejected').length,
      recentActivity: recentLogs,
      topAccessedResources
    };
  }

  // Utility Methods
  private validatePolicy(policy: AccessPolicy): void {
    if (!policy.resourceId || !policy.resourceType) {
      throw new Error('Resource ID and type are required');
    }
    if (!policy.subjectId || !policy.subjectType) {
      throw new Error('Subject ID and type are required');
    }
    if (!policy.permissions || policy.permissions.length === 0) {
      throw new Error('At least one permission is required');
    }
  }

  private initializeSystemRoles(): void {
    const systemRoles: Omit<RoleDefinition, 'id' | 'createdAt' | 'isSystem'>[] = [
      {
        name: 'Owner',
        description: 'Full control over resources',
        permissions: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.SHARE, Permission.ADMIN],
        createdBy: 'system'
      },
      {
        name: 'Editor',
        description: 'Can read, write, and share resources',
        permissions: [Permission.READ, Permission.WRITE, Permission.SHARE],
        createdBy: 'system'
      },
      {
        name: 'Viewer',
        description: 'Can only read resources',
        permissions: [Permission.READ],
        createdBy: 'system'
      },
      {
        name: 'Commenter',
        description: 'Can read and comment on resources',
        permissions: [Permission.READ],
        createdBy: 'system'
      }
    ];

    for (const role of systemRoles) {
      const roleDefinition: RoleDefinition = {
        ...role,
        id: `role_${role.name.toLowerCase()}`,
        createdAt: new Date(),
        isSystem: true
      };
      this.roles.set(roleDefinition.id, roleDefinition);
    }
  }

  private generateId(): string {
    return `acl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Lifecycle Management
  async start(): Promise<void> {
    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    this.emit('serviceStopped');
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const stats = await this.getStats();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (stats.totalPolicies === 0) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalPolicies: stats.totalPolicies,
        activePolicies: stats.activePolicies,
        pendingRequests: stats.pendingRequests,
        totalRoles: this.roles.size,
        totalGroups: this.groups.size,
        auditLogsSize: this.auditLogs.length
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        policies: Array.from(this.policies.values()),
        roles: Array.from(this.roles.values()),
        groups: Array.from(this.groups.values()),
        requests: Array.from(this.requests.values()),
        auditLogs: this.auditLogs.slice(-1000) // Last 1000 entries
      }, null, 2);
    } else {
      // CSV export for policies
      const headers = [
        'ID', 'Resource ID', 'Resource Type', 'Subject ID', 'Subject Type',
        'Permissions', 'Created By', 'Created At', 'Expires At', 'Is Active'
      ];
      
      const rows = Array.from(this.policies.values()).map(p => [
        p.id,
        p.resourceId,
        p.resourceType,
        p.subjectId,
        p.subjectType,
        p.permissions.join(';'),
        p.createdBy,
        p.createdAt.toISOString(),
        p.expiresAt?.toISOString() || '',
        p.isActive.toString()
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
