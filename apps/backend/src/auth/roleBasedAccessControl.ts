import { EventEmitter } from 'events';

// Enums
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  VERIFIED_USER = 'verified_user',
  USER = 'user',
  GUEST = 'guest'
}

export enum Permission {
  // User management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_VERIFY = 'user:verify',
  
  // Auction management
  AUCTION_CREATE = 'auction:create',
  AUCTION_READ = 'auction:read',
  AUCTION_UPDATE = 'auction:update',
  AUCTION_DELETE = 'auction:delete',
  AUCTION_START = 'auction:start',
  AUCTION_END = 'auction:end',
  
  // Bidding management
  BID_CREATE = 'bid:create',
  BID_READ = 'bid:read',
  BID_UPDATE = 'bid:update',
  BID_DELETE = 'bid:delete',
  BID_APPROVE = 'bid:approve',
  
  // Payment management
  PAYMENT_PROCESS = 'payment:process',
  PAYMENT_REFUND = 'payment:refund',
  PAYMENT_READ = 'payment:read',
  
  // System management
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_MONITOR = 'system:monitor',
  SYSTEM_ANALYTICS = 'system:analytics',
  
  // Content management
  CONTENT_CREATE = 'content:create',
  CONTENT_UPDATE = 'content:update',
  CONTENT_DELETE = 'content:delete',
  CONTENT_MODERATE = 'content:moderate',
  
  // Analytics and reporting
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_EXPORT = 'analytics:export',
  REPORT_GENERATE = 'report:generate'
}

export enum ResourceType {
  USER = 'user',
  AUCTION = 'auction',
  BID = 'bid',
  PAYMENT = 'payment',
  SYSTEM = 'system',
  CONTENT = 'content',
  ANALYTICS = 'analytics'
}

export enum AccessLevel {
  NONE = 'none',
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
  OWNER = 'owner'
}

// Interfaces
export interface RoleDefinition {
  id: string;
  name: Role;
  displayName: string;
  description: string;
  level: number; // Higher number = higher privilege
  permissions: Permission[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  roleName: Role;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  metadata: Record<string, any>;
}

export interface PermissionPolicy {
  id: string;
  name: string;
  description: string;
  resourceType: ResourceType;
  permissions: Permission[];
  conditions: PolicyCondition[];
  effect: 'allow' | 'deny';
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'contains';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface AccessRequest {
  id: string;
  userId: string;
  resourceType: ResourceType;
  resourceId: string;
  permission: Permission;
  context: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
    timestamp: Date;
  };
  status: 'pending' | 'approved' | 'denied' | 'expired';
  reviewedBy?: string;
  reviewedAt?: Date;
  reason?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  policy?: PermissionPolicy;
  role?: RoleDefinition;
  conditions?: PolicyCondition[];
  evaluatedAt: Date;
  evaluationTime: number; // milliseconds
}

export interface RBACConfig {
  enableRoleHierarchy: boolean;
  enablePermissionInheritance: boolean;
  enablePolicyConditions: boolean;
  enableAccessRequests: boolean;
  enableAuditLogging: boolean;
  enableCaching: boolean;
  cacheExpiry: number; // minutes
  maxRolesPerUser: number;
  enableTemporaryRoles: boolean;
  maxTemporaryRoleDuration: number; // days
  enableResourceOwnership: boolean;
  ownerPermissions: Permission[];
}

export interface RBACAnalytics {
  period: { start: Date; end: Date };
  
  // Role metrics
  totalRoles: number;
  activeRoles: number;
  roleAssignments: number;
  assignmentsByRole: Record<Role, number>;
  
  // Permission metrics
  totalPermissions: number;
  permissionUsage: Record<Permission, number>;
  mostUsedPermissions: Array<{ permission: Permission; count: number }>;
  
  // Access metrics
  totalAccessRequests: number;
  approvedRequests: number;
  deniedRequests: number;
  approvalRate: number;
  
  // Security metrics
  deniedAccessAttempts: number;
  suspiciousAccessPatterns: number;
  privilegeEscalationAttempts: number;
  
  // Performance metrics
  averageEvaluationTime: number;
  cacheHitRate: number;
  
  // Trends
  roleAssignmentsOverTime: {
    date: Date;
    assignments: number;
  }[];
}

// Main Role-Based Access Control Service
export class RoleBasedAccessControlService extends EventEmitter {
  private roles: Map<string, RoleDefinition> = new Map();
  private userRoles: Map<string, UserRole[]> = new Map();
  private policies: Map<string, PermissionPolicy> = new Map();
  private accessRequests: Map<string, AccessRequest> = new Map();
  private resourceOwners: Map<string, { resourceType: ResourceType; resourceId: string; ownerId: string }> = new Map();
  private accessCache: Map<string, AccessDecision> = new Map();
  private config: RBACConfig;

  constructor(config?: Partial<RBACConfig>) {
    super();
    this.config = {
      enableRoleHierarchy: true,
      enablePermissionInheritance: true,
      enablePolicyConditions: true,
      enableAccessRequests: true,
      enableAuditLogging: true,
      enableCaching: true,
      cacheExpiry: 15,
      maxRolesPerUser: 5,
      enableTemporaryRoles: true,
      maxTemporaryRoleDuration: 30,
      enableResourceOwnership: true,
      ownerPermissions: [
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.AUCTION_CREATE,
        Permission.AUCTION_READ,
        Permission.AUCTION_UPDATE,
        Permission.BID_CREATE,
        Permission.BID_READ
      ],
      ...config
    };

    this.initializeDefaultRoles();
  }

  // Role Management
  async createRole(
    name: Role,
    displayName: string,
    description: string,
    permissions: Permission[],
    level = 0
  ): Promise<RoleDefinition> {
    const roleId = this.generateId();
    
    const role: RoleDefinition = {
      id: roleId,
      name,
      displayName,
      description,
      level,
      permissions,
      isSystem: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.roles.set(roleId, role);
    this.emit('roleCreated', role);
    return role;
  }

  async updateRole(
    roleId: string,
    updates: {
      displayName?: string;
      description?: string;
      permissions?: Permission[];
      level?: number;
      isActive?: boolean;
    }
  ): Promise<RoleDefinition> {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSystem) {
      throw new Error('Cannot modify system role');
    }

    Object.assign(role, updates);
    role.updatedAt = new Date();

    // Clear cache
    this.clearAccessCache();

    this.emit('roleUpdated', role);
    return role;
  }

  async deleteRole(roleId: string): Promise<boolean> {
    const role = this.roles.get(roleId);
    if (!role) {
      return false;
    }

    if (role.isSystem) {
      throw new Error('Cannot delete system role');
    }

    // Check if role is assigned to users
    for (const [userId, userRoleList] of this.userRoles.entries()) {
      if (userRoleList.some(ur => ur.roleId === roleId)) {
        throw new Error('Cannot delete role that is assigned to users');
      }
    }

    this.roles.delete(roleId);
    this.emit('roleDeleted', { roleId, role });
    return true;
  }

  async getRole(roleId: string): Promise<RoleDefinition | null> {
    return this.roles.get(roleId) || null;
  }

  async getRoles(includeInactive = false): Promise<RoleDefinition[]> {
    const roles = Array.from(this.roles.values());
    return includeInactive ? roles : roles.filter(r => r.isActive);
  }

  // User Role Assignment
  async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    options: {
      expiresAt?: Date;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<UserRole> {
    const role = this.roles.get(roleId);
    if (!role || !role.isActive) {
      throw new Error('Role not found or inactive');
    }

    // Check max roles per user
    const userRoleList = this.userRoles.get(userId) || [];
    const activeRoles = userRoleList.filter(ur => ur.isActive && (!ur.expiresAt || ur.expiresAt > new Date()));
    
    if (activeRoles.length >= this.config.maxRolesPerUser) {
      throw new Error(`Maximum roles per user (${this.config.maxRolesPerUser}) exceeded`);
    }

    // Check for duplicate role
    if (activeRoles.some(ur => ur.roleId === roleId)) {
      throw new Error('User already has this role');
    }

    const userRole: UserRole = {
      id: this.generateId(),
      userId,
      roleId,
      roleName: role.name,
      assignedBy,
      assignedAt: new Date(),
      expiresAt: options.expiresAt,
      isActive: true,
      metadata: options.metadata || {}
    };

    this.userRoles.set(userId, [...userRoleList, userRole]);
    this.clearAccessCache();

    this.emit('roleAssigned', { userId, roleId, userRole });
    return userRole;
  }

  async revokeRole(
    userId: string,
    roleId: string,
    revokedBy: string,
    reason?: string
  ): Promise<boolean> {
    const userRoleList = this.userRoles.get(userId) || [];
    const roleIndex = userRoleList.findIndex(ur => ur.roleId === roleId && ur.isActive);
    
    if (roleIndex === -1) {
      return false;
    }

    const userRole = userRoleList[roleIndex];
    userRole.isActive = false;
    userRole.metadata.revokedBy = revokedBy;
    userRole.metadata.revocationReason = reason;
    userRole.metadata.revokedAt = new Date();

    this.userRoles.set(userId, userRoleList);
    this.clearAccessCache();

    this.emit('roleRevoked', { userId, roleId, revokedBy, reason });
    return true;
  }

  async getUserRoles(userId: string, includeInactive = false): Promise<UserRole[]> {
    const userRoleList = this.userRoles.get(userId) || [];
    
    let filteredRoles = userRoleList;
    if (!includeInactive) {
      filteredRoles = userRoleList.filter(ur => 
        ur.isActive && (!ur.expiresAt || ur.expiresAt > new Date())
      );
    }

    return filteredRoles.sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime());
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRoles = await this.getUserRoles(userId);
    const permissions = new Set<Permission>();

    for (const userRole of userRoles) {
      const role = this.roles.get(userRole.roleId);
      if (role && role.isActive) {
        // Add role permissions
        role.permissions.forEach(p => permissions.add(p));

        // Add inherited permissions if enabled
        if (this.config.enablePermissionInheritance) {
          const inheritedPermissions = await this.getInheritedPermissions(role);
          inheritedPermissions.forEach(p => permissions.add(p));
        }
      }
    }

    return Array.from(permissions);
  }

  // Access Control
  async checkPermission(
    userId: string,
    permission: Permission,
    resourceType?: ResourceType,
    resourceId?: string,
    context?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
      timestamp?: Date;
    }
  ): Promise<AccessDecision> {
    const startTime = Date.now();

    // Check cache first
    if (this.config.enableCaching) {
      const cacheKey = this.generateCacheKey(userId, permission, resourceType, resourceId);
      const cachedDecision = this.accessCache.get(cacheKey);
      if (cachedDecision && this.isCacheValid(cachedDecision)) {
        return cachedDecision;
      }
    }

    const decision = await this.evaluatePermission(
      userId,
      permission,
      resourceType,
      resourceId,
      context
    );

    decision.evaluationTime = Date.now() - startTime;

    // Cache decision
    if (this.config.enableCaching) {
      const cacheKey = this.generateCacheKey(userId, permission, resourceType, resourceId);
      this.accessCache.set(cacheKey, decision);
    }

    // Log access attempt
    if (this.config.enableAuditLogging) {
      this.emit('accessChecked', {
        userId,
        permission,
        resourceType,
        resourceId,
        allowed: decision.allowed,
        reason: decision.reason,
        context,
        evaluationTime: decision.evaluationTime
      });
    }

    return decision;
  }

  async requirePermission(
    userId: string,
    permission: Permission,
    resourceType?: ResourceType,
    resourceId?: string,
    context?: any
  ): Promise<void> {
    const decision = await this.checkPermission(userId, permission, resourceType, resourceId, context);
    
    if (!decision.allowed) {
      this.emit('accessDenied', {
        userId,
        permission,
        resourceType,
        resourceId,
        reason: decision.reason
      });
      throw new Error(`Access denied: ${decision.reason}`);
    }
  }

  // Resource Ownership
  async setResourceOwner(
    resourceType: ResourceType,
    resourceId: string,
    ownerId: string
  ): Promise<void> {
    const key = `${resourceType}:${resourceId}`;
    this.resourceOwners.set(key, { resourceType, resourceId, ownerId });
    this.clearAccessCache();
    this.emit('resourceOwnerSet', { resourceType, resourceId, ownerId });
  }

  async getResourceOwner(
    resourceType: ResourceType,
    resourceId: string
  ): Promise<string | null> {
    const key = `${resourceType}:${resourceId}`;
    const ownership = this.resourceOwners.get(key);
    return ownership ? ownership.ownerId : null;
  }

  async isResourceOwner(
    userId: string,
    resourceType: ResourceType,
    resourceId: string
  ): Promise<boolean> {
    if (!this.config.enableResourceOwnership) {
      return false;
    }

    const ownerId = await this.getResourceOwner(resourceType, resourceId);
    return ownerId === userId;
  }

  // Policy Management
  async createPolicy(
    name: string,
    description: string,
    resourceType: ResourceType,
    permissions: Permission[],
    conditions: PolicyCondition[],
    effect: 'allow' | 'deny',
    priority = 0
  ): Promise<PermissionPolicy> {
    const policyId = this.generateId();
    
    const policy: PermissionPolicy = {
      id: policyId,
      name,
      description,
      resourceType,
      permissions,
      conditions,
      effect,
      priority,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.policies.set(policyId, policy);
    this.clearAccessCache();
    this.emit('policyCreated', policy);
    return policy;
  }

  async updatePolicy(
    policyId: string,
    updates: Partial<PermissionPolicy>
  ): Promise<PermissionPolicy> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error('Policy not found');
    }

    Object.assign(policy, updates);
    policy.updatedAt = new Date();
    this.clearAccessCache();
    this.emit('policyUpdated', policy);
    return policy;
  }

  async deletePolicy(policyId: string): Promise<boolean> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return false;
    }

    this.policies.delete(policyId);
    this.clearAccessCache();
    this.emit('policyDeleted', { policyId, policy });
    return true;
  }

  // Access Requests
  async createAccessRequest(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    permission: Permission,
    context?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
    },
    expiresIn = 24 // hours
  ): Promise<AccessRequest> {
    const requestId = this.generateId();
    const now = new Date();

    const request: AccessRequest = {
      id: requestId,
      userId,
      resourceType,
      resourceId,
      permission,
      context: {
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        deviceId: context?.deviceId,
        timestamp: now
      },
      status: 'pending',
      expiresAt: new Date(now.getTime() + expiresIn * 60 * 60 * 1000),
      createdAt: now
    };

    this.accessRequests.set(requestId, request);
    this.emit('accessRequestCreated', request);
    return request;
  }

  async reviewAccessRequest(
    requestId: string,
    reviewedBy: string,
    approved: boolean,
    reason?: string
  ): Promise<AccessRequest> {
    const request = this.accessRequests.get(requestId);
    if (!request) {
      throw new Error('Access request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request already reviewed');
    }

    request.status = approved ? 'approved' : 'denied';
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date();
    request.reason = reason;

    this.emit('accessRequestReviewed', { request, reviewedBy, approved, reason });
    return request;
  }

  // Private Methods
  private async evaluatePermission(
    userId: string,
    permission: Permission,
    resourceType?: ResourceType,
    resourceId?: string,
    context?: any
  ): Promise<AccessDecision> {
    // Check resource ownership first
    if (resourceType && resourceId && this.config.enableResourceOwnership) {
      const isOwner = await this.isResourceOwner(userId, resourceType, resourceId);
      if (isOwner && this.config.ownerPermissions.includes(permission)) {
        return {
          allowed: true,
          reason: 'Resource owner access',
          evaluatedAt: new Date(),
          evaluationTime: 0
        };
      }
    }

    // Get user permissions
    const userPermissions = await this.getUserPermissions(userId);
    
    // Check direct permission
    if (userPermissions.includes(permission)) {
      return {
        allowed: true,
        reason: 'Direct permission granted',
        evaluatedAt: new Date(),
        evaluationTime: 0
      };
    }

    // Check policies
    if (resourceType && this.config.enablePolicyConditions) {
      const applicablePolicies = Array.from(this.policies.values())
        .filter(p => p.isActive && p.resourceType === resourceType && p.permissions.includes(permission))
        .sort((a, b) => b.priority - a.priority);

      for (const policy of applicablePolicies) {
        const conditionsMet = await this.evaluateConditions(policy.conditions, userId, resourceType, resourceId, context);
        
        if (conditionsMet) {
          return {
            allowed: policy.effect === 'allow',
            reason: `Policy "${policy.name}" ${policy.effect}`,
            policy,
            conditions: policy.conditions,
            evaluatedAt: new Date(),
            evaluationTime: 0
          };
        }
      }
    }

    return {
      allowed: false,
      reason: 'Permission not granted',
      evaluatedAt: new Date(),
      evaluationTime: 0
    };
  }

  private async evaluateConditions(
    conditions: PolicyCondition[],
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    context?: any
  ): Promise<boolean> {
    if (conditions.length === 0) {
      return true;
    }

    // This is a simplified condition evaluation
    // In a real implementation, you would evaluate each condition based on:
    // - User attributes (role, level, metadata)
    // - Resource attributes (type, owner, metadata)
    // - Context (IP, time, device)
    // - External data (time of day, geographic location, etc.)

    for (const condition of conditions) {
      let result = false;

      switch (condition.field) {
        case 'user.role':
          const userRoles = await this.getUserRoles(userId);
          result = this.evaluateOperator(
            userRoles.map(ur => ur.roleName),
            condition.operator,
            condition.value
          );
          break;
        
        case 'resource.type':
          result = this.evaluateOperator(
            resourceType,
            condition.operator,
            condition.value
          );
          break;
        
        case 'context.time':
          const hour = new Date().getHours();
          result = this.evaluateOperator(
            hour,
            condition.operator,
            condition.value
          );
          break;
        
        // Add more condition evaluations as needed
      }

      if (!result && condition.logicalOperator !== 'or') {
        return false;
      }
      if (result && condition.logicalOperator === 'or') {
        return true;
      }
    }

    return true;
  }

  private evaluateOperator(
    actual: any,
    operator: PolicyCondition['operator'],
    expected: any
  ): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'not_equals':
        return actual !== expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'not_in':
        return Array.isArray(expected) && !expected.includes(actual);
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      case 'contains':
        return String(actual).includes(String(expected));
      default:
        return false;
    }
  }

  private async getInheritedPermissions(role: RoleDefinition): Promise<Permission[]> {
    if (!this.config.enableRoleHierarchy) {
      return [];
    }

    const inheritedPermissions = new Set<Permission>();
    
    // Get all roles with lower level (higher privilege)
    const higherRoles = Array.from(this.roles.values())
      .filter(r => r.isActive && r.level > role.level)
      .sort((a, b) => b.level - a.level);

    for (const higherRole of higherRoles) {
      higherRole.permissions.forEach(p => inheritedPermissions.add(p));
    }

    return Array.from(inheritedPermissions);
  }

  private initializeDefaultRoles(): void {
    // Super Admin
    this.roles.set('super_admin', {
      id: 'super_admin',
      name: Role.SUPER_ADMIN,
      displayName: 'Super Administrator',
      description: 'Full system access with all permissions',
      level: 100,
      permissions: Object.values(Permission),
      isSystem: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Admin
    this.roles.set('admin', {
      id: 'admin',
      name: Role.ADMIN,
      displayName: 'Administrator',
      description: 'Administrative access to most system functions',
      level: 80,
      permissions: [
        Permission.USER_CREATE,
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.AUCTION_CREATE,
        Permission.AUCTION_READ,
        Permission.AUCTION_UPDATE,
        Permission.AUCTION_DELETE,
        Permission.BID_CREATE,
        Permission.BID_READ,
        Permission.BID_UPDATE,
        Permission.PAYMENT_PROCESS,
        Permission.PAYMENT_READ,
        Permission.SYSTEM_MONITOR,
        Permission.CONTENT_MODERATE,
        Permission.ANALYTICS_READ,
        Permission.REPORT_GENERATE
      ],
      isSystem: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Moderator
    this.roles.set('moderator', {
      id: 'moderator',
      name: Role.MODERATOR,
      displayName: 'Moderator',
      description: 'Content moderation and user management',
      level: 60,
      permissions: [
        Permission.USER_READ,
        Permission.USER_VERIFY,
        Permission.AUCTION_READ,
        Permission.BID_READ,
        Permission.CONTENT_MODERATE,
        Permission.ANALYTICS_READ
      ],
      isSystem: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Verified User
    this.roles.set('verified_user', {
      id: 'verified_user',
      name: Role.VERIFIED_USER,
      displayName: 'Verified User',
      description: 'Verified user with enhanced permissions',
      level: 40,
      permissions: [
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.AUCTION_CREATE,
        Permission.AUCTION_READ,
        Permission.AUCTION_UPDATE,
        Permission.BID_CREATE,
        Permission.BID_READ,
        Permission.PAYMENT_PROCESS
      ],
      isSystem: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // User
    this.roles.set('user', {
      id: 'user',
      name: Role.USER,
      displayName: 'User',
      description: 'Standard user permissions',
      level: 20,
      permissions: [
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.AUCTION_READ,
        Permission.BID_CREATE,
        Permission.BID_READ,
        Permission.PAYMENT_PROCESS
      ],
      isSystem: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Guest
    this.roles.set('guest', {
      id: 'guest',
      name: Role.GUEST,
      displayName: 'Guest',
      description: 'Limited guest access',
      level: 10,
      permissions: [
        Permission.AUCTION_READ,
        Permission.BID_READ
      ],
      isSystem: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  private generateCacheKey(
    userId: string,
    permission: Permission,
    resourceType?: ResourceType,
    resourceId?: string
  ): string {
    return `${userId}:${permission}:${resourceType || ''}:${resourceId || ''}`;
  }

  private isCacheValid(decision: AccessDecision): boolean {
    if (!this.config.enableCaching) return false;
    
    const cacheAge = Date.now() - decision.evaluatedAt.getTime();
    const maxAge = this.config.cacheExpiry * 60 * 1000;
    return cacheAge < maxAge;
  }

  private clearAccessCache(): void {
    this.accessCache.clear();
  }

  private generateId(): string {
    return `rbac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Analytics
  async getRBACAnalytics(
    period: { start: Date; end: Date }
  ): Promise<RBACAnalytics> {
    const roles = Array.from(this.roles.values());
    const userRoleList = Array.from(this.userRoles.values()).flat();
    const requests = Array.from(this.accessRequests.values())
      .filter(r => r.createdAt >= period.start && r.createdAt <= period.end);

    // Role metrics
    const totalRoles = roles.length;
    const activeRoles = roles.filter(r => r.isActive).length;
    const roleAssignments = userRoleList.filter(ur => ur.isActive).length;
    
    const assignmentsByRole: Record<Role, number> = {
      [Role.SUPER_ADMIN]: 0,
      [Role.ADMIN]: 0,
      [Role.MODERATOR]: 0,
      [Role.VERIFIED_USER]: 0,
      [Role.USER]: 0,
      [Role.GUEST]: 0
    };

    for (const userRole of userRoleList) {
      if (userRole.isActive) {
        assignmentsByRole[userRole.roleName]++;
      }
    }

    // Permission metrics
    const allPermissions = Object.values(Permission);
    const permissionUsage: Record<Permission, number> = {} as Record<Permission, number>;
    
    for (const permission of allPermissions) {
      permissionUsage[permission] = 0;
    }

    // Access metrics
    const totalAccessRequests = requests.length;
    const approvedRequests = requests.filter(r => r.status === 'approved').length;
    const deniedRequests = requests.filter(r => r.status === 'denied').length;
    const approvalRate = totalAccessRequests > 0 ? approvedRequests / totalAccessRequests : 0;

    // Performance metrics
    const cacheDecisions = Array.from(this.accessCache.values());
    const averageEvaluationTime = cacheDecisions.length > 0
      ? cacheDecisions.reduce((sum, d) => sum + d.evaluationTime, 0) / cacheDecisions.length
      : 0;

    return {
      period,
      totalRoles,
      activeRoles,
      roleAssignments,
      assignmentsByRole,
      totalPermissions: allPermissions.length,
      permissionUsage,
      mostUsedPermissions: [], // Would track from actual usage
      totalAccessRequests,
      approvedRequests,
      deniedRequests,
      approvalRate,
      deniedAccessAttempts: 0, // Would track from access checks
      suspiciousAccessPatterns: 0, // Would track from security monitoring
      privilegeEscalationAttempts: 0, // Would track from security monitoring
      averageEvaluationTime,
      cacheHitRate: 0, // Would track from cache metrics
      roleAssignmentsOverTime: [] // Would track over time
    };
  }

  // Lifecycle Management
  async start(): Promise<void> {
    // Start cleanup interval for expired roles and cache
    setInterval(() => this.cleanupExpiredData(), 60 * 60 * 1000); // Every hour
    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    this.emit('serviceStopped');
  }

  private async cleanupExpiredData(): Promise<void> {
    const now = new Date();
    let cleanedCount = 0;

    // Clean up expired user roles
    for (const [userId, userRoleList] of this.userRoles.entries()) {
      const activeRoles = userRoleList.filter(ur => 
        ur.isActive && (!ur.expiresAt || ur.expiresAt > now)
      );
      
      if (activeRoles.length !== userRoleList.length) {
        this.userRoles.set(userId, activeRoles);
        cleanedCount++;
      }
    }

    // Clean up expired access requests
    for (const [requestId, request] of this.accessRequests.entries()) {
      if (now > request.expiresAt && request.status === 'pending') {
        request.status = 'expired';
        cleanedCount++;
      }
    }

    // Clean up expired cache entries
    if (this.config.enableCaching) {
      for (const [key, decision] of this.accessCache.entries()) {
        if (!this.isCacheValid(decision)) {
          this.accessCache.delete(key);
        }
      }
    }

    this.emit('dataCleanedUp', { count: cleanedCount });
  }

  async getHealthStatus() {
    return {
      status: 'healthy' as const,
      details: {
        totalRoles: this.roles.size,
        totalUserRoles: Array.from(this.userRoles.values()).flat().length,
        totalPolicies: this.policies.size,
        cacheSize: this.accessCache.size,
        roleHierarchyEnabled: this.config.enableRoleHierarchy,
        policyConditionsEnabled: this.config.enablePolicyConditions,
        resourceOwnershipEnabled: this.config.enableResourceOwnership
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        roles: Array.from(this.roles.values()),
        userRoles: Array.from(this.userRoles.entries()).map(([userId, roles]) => ({
          userId,
          roles
        })),
        policies: Array.from(this.policies.values()),
        config: this.config
      }, null, 2);
    } else {
      const headers = [
        'User ID', 'Role ID', 'Role Name', 'Assigned At', 'Expires At', 'Is Active'
      ];
      const rows = Array.from(this.userRoles.entries()).flatMap(([userId, roles]) =>
        roles.map(r => [
          userId,
          r.roleId,
          r.roleName,
          r.assignedAt.toISOString(),
          r.expiresAt?.toISOString() || '',
          r.isActive
        ])
      );
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
