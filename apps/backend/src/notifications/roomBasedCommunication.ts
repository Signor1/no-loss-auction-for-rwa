import { EventEmitter } from 'events';
import { WebSocketServer, ConnectionInfo, MessageType, WebSocketMessage } from './webSocketServer';
import { PresenceTrackingService, PresenceStatus } from './presenceTracking';

export enum RoomType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  INVITE_ONLY = 'invite_only',
  TEMPORARY = 'temporary',
  PERSISTENT = 'persistent'
}

export enum RoomPermission {
  READ_MESSAGES = 'read_messages',
  SEND_MESSAGES = 'send_messages',
  INVITE_USERS = 'invite_users',
  KICK_USERS = 'kick_users',
  BAN_USERS = 'ban_users',
  MODERATE_MESSAGES = 'moderate_messages',
  MANAGE_SETTINGS = 'manage_settings',
  DELETE_ROOM = 'delete_room'
}

export enum RoomStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  SUSPENDED = 'suspended'
}

export enum MessageVisibility {
  ALL = 'all',
  MODERATORS = 'moderators',
  ADMINS = 'admins',
  ROLES = 'roles'
}

export interface RoomInfo {
  id: string;
  name: string;
  description?: string;
  type: RoomType;
  status: RoomStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  maxMembers?: number;
  isTemporary: boolean;
  expiresAt?: Date;
  settings: RoomSettings;
  permissions: RoomPermissions;
  tags: string[];
  metadata: Record<string, any>;
}

export interface RoomSettings {
  allowAnonymous: boolean;
  requireInvitation: boolean;
  moderateMessages: boolean;
  messageRetention: number; // days
  maxMessageLength: number;
  fileSharing: boolean;
  voiceChat: boolean;
  screenSharing: boolean;
  recording: boolean;
  autoDelete: boolean;
  autoDeleteDelay: number; // hours
  rateLimitPerUser: {
    messages: number;
    timeWindow: number; // minutes
  };
  rateLimitGlobal: {
    messages: number;
    timeWindow: number; // minutes
  };
}

export interface RoomMember {
  userId: string;
  roomId: string;
  role: RoomRole;
  permissions: Set<RoomPermission>;
  joinedAt: Date;
  lastActivity: Date;
  isMuted: boolean;
  isBanned: boolean;
  banReason?: string;
  banExpiresAt?: Date;
  invitedBy?: string;
  metadata: Record<string, any>;
}

export enum RoomRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
  GUEST = 'guest'
}

export interface RoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderRole: RoomRole;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system';
  visibility: MessageVisibility;
  replyTo?: string;
  mentions: string[];
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface RoomPermissions {
  defaultPermissions: Set<RoomPermission>;
  rolePermissions: Map<RoomRole, Set<RoomPermission>>;
  userPermissions: Map<string, Set<RoomPermission>>;
}

export interface RoomMetrics {
  totalRooms: number;
  roomsByType: Record<RoomType, number>;
  roomsByStatus: Record<RoomStatus, number>;
  totalMembers: number;
  totalMessages: number;
  messagesByType: Record<RoomMessage['type'], number>;
  activeRooms: number;
  topRooms: Array<{
    roomId: string;
    roomName: string;
    memberCount: number;
    messageCount: number;
    activityLevel: number;
  }>;
  userDistribution: Array<{
    role: RoomRole;
    count: number;
    percentage: number;
  }>;
  messageFrequency: Array<{
    hour: number;
    messageCount: number;
  }>;
}

export interface RoomConfig {
  enablePersistence: boolean;
  storageLocation: string;
  maxRoomsPerUser: number;
  maxMembersPerRoom: number;
  maxMessageLength: number;
  enableFileSharing: boolean;
  enableVoiceChat: boolean;
  enableScreenSharing: boolean;
  enableRecording: boolean;
  fileUploadLimits: {
    maxFileSize: number;
    allowedTypes: string[];
    virusScanning: boolean;
  };
  enableModeration: boolean;
  autoModeration: {
    enabled: boolean;
    profanityFilter: boolean;
    spamFilter: boolean;
    linkFilter: boolean;
    aiModeration: boolean;
  };
  enableInvitationSystem: boolean;
  invitationTimeout: number;
  enableSearch: boolean;
  enableAnalytics: boolean;
  analyticsInterval: number;
  enablePrivacy: boolean;
  privacySettings: {
    anonymizeMessages: boolean;
    hideUserDetails: boolean;
    retentionPeriod: number;
  };
}

export class RoomBasedCommunicationService extends EventEmitter {
  private webSocketServer: WebSocketServer;
  private presenceService: PresenceTrackingService;
  private rooms: Map<string, RoomInfo> = new Map();
  private roomMembers: Map<string, Map<string, RoomMember>> = new Map();
  private roomMessages: Map<string, RoomMessage[]> = new Map();
  private permissions: Map<string, RoomPermissions> = new Map();
  private config: RoomConfig;
  private metrics: RoomMetrics;
  private cleanupInterval?: NodeJS.Timeout;
  private analyticsInterval?: NodeJS.Timeout;

  constructor(webSocketServer: WebSocketServer, presenceService: PresenceTrackingService, config: RoomConfig) {
    super();
    this.webSocketServer = webSocketServer;
    this.presenceService = presenceService;
    this.config = this.validateConfig(config);
    this.metrics = this.initializeMetrics();
    this.setupEventListeners();
    this.startCleanup();
    this.startAnalyticsCollection();
  }

  private validateConfig(config: RoomConfig): RoomConfig {
    return {
      enablePersistence: config.enablePersistence !== false,
      storageLocation: config.storageLocation || './room_data',
      maxRoomsPerUser: config.maxRoomsPerUser || 10,
      maxMembersPerRoom: config.maxMembersPerRoom || 100,
      maxMessageLength: config.maxMessageLength || 2000,
      enableFileSharing: config.enableFileSharing !== false,
      enableVoiceChat: config.enableVoiceChat !== false,
      enableScreenSharing: config.enableScreenSharing !== false,
      enableRecording: config.enableRecording !== false,
      fileUploadLimits: {
        maxFileSize: config.fileUploadLimits?.maxFileSize || 10485760, // 10MB
        allowedTypes: config.fileUploadLimits?.allowedTypes || ['jpg', 'png', 'gif', 'pdf', 'doc', 'txt'],
        virusScanning: config.fileUploadLimits?.virusScanning || false
      },
      enableModeration: config.enableModeration !== false,
      autoModeration: {
        enabled: config.autoModeration?.enabled || false,
        profanityFilter: config.autoModeration?.profanityFilter || false,
        spamFilter: config.autoModeration?.spamFilter || false,
        linkFilter: config.autoModeration?.linkFilter || false,
        aiModeration: config.autoModeration?.aiModeration || false
      },
      enableInvitationSystem: config.enableInvitationSystem !== false,
      invitationTimeout: config.invitationTimeout || 86400000, // 24 hours
      enableSearch: config.enableSearch !== false,
      enableAnalytics: config.enableAnalytics !== false,
      analyticsInterval: config.analyticsInterval || 60000,
      enablePrivacy: config.enablePrivacy !== false,
      privacySettings: {
        anonymizeMessages: config.privacySettings?.anonymizeMessages || false,
        hideUserDetails: config.privacySettings?.hideUserDetails || false,
        retentionPeriod: config.privacySettings?.retentionPeriod || 90
      }
    };
  }

  private initializeMetrics(): RoomMetrics {
    return {
      totalRooms: 0,
      roomsByType: {
        public: 0,
        private: 0,
        invite_only: 0,
        temporary: 0,
        persistent: 0
      },
      roomsByStatus: {
        active: 0,
        inactive: 0,
        archived: 0,
        suspended: 0
      },
      totalMembers: 0,
      totalMessages: 0,
      messagesByType: {
        text: 0,
        image: 0,
        file: 0,
        audio: 0,
        video: 0,
        system: 0
      },
      activeRooms: 0,
      topRooms: [],
      userDistribution: [],
      messageFrequency: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        messageCount: 0
      }))
    };
  }

  private setupEventListeners(): void {
    this.webSocketServer.on('connectionEstablished', (connection: ConnectionInfo) => {
      this.handleConnectionEstablished(connection);
    });

    this.webSocketServer.on('connectionClosed', (connection: ConnectionInfo) => {
      this.handleConnectionClosed(connection);
    });

    this.webSocketServer.on('userAuthenticated', (connection: ConnectionInfo, userId: string) => {
      this.handleUserAuthenticated(connection, userId);
    });
  }

  private handleConnectionEstablished(connection: ConnectionInfo): void {
    if (!connection.userId) return;

    // Add user to any default rooms they should be in
    this.addUserToDefaultRooms(connection.userId);
  }

  private handleConnectionClosed(connection: ConnectionInfo): void {
    if (!connection.userId) return;

    // Remove user from all rooms
    this.removeUserFromAllRooms(connection.userId);
  }

  private handleUserAuthenticated(connection: ConnectionInfo, userId: string): void {
    // Add user to any default rooms they should be in
    this.addUserToDefaultRooms(userId);
  }

  async createRoom(data: {
    name: string;
    description?: string;
    type: RoomType;
    maxMembers?: number;
    isTemporary?: boolean;
    expiresAt?: Date;
    settings?: Partial<RoomSettings>;
    tags?: string[];
    createdBy: string;
  }): Promise<RoomInfo> {
    const room: RoomInfo = {
      id: this.generateRoomId(),
      name: data.name,
      description: data.description,
      type: data.type,
      status: RoomStatus.ACTIVE,
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      memberCount: 0,
      maxMembers: data.maxMembers,
      isTemporary: data.isTemporary || false,
      expiresAt: data.expiresAt,
      settings: {
        allowAnonymous: true,
        requireInvitation: false,
        moderateMessages: false,
        messageRetention: 30,
        maxMessageLength: this.config.maxMessageLength,
        fileSharing: this.config.enableFileSharing,
        voiceChat: this.config.enableVoiceChat,
        screenSharing: this.config.enableScreenSharing,
        recording: this.config.enableRecording,
        autoDelete: false,
        autoDeleteDelay: 24,
        rateLimitPerUser: {
          messages: 10,
          timeWindow: 1
        },
        rateLimitGlobal: {
          messages: 100,
          timeWindow: 1
        },
        ...data.settings
      },
      permissions: this.createDefaultPermissions(),
      tags: data.tags || []
    };

    this.rooms.set(room.id, room);
    this.roomMembers.set(room.id, new Map());
    this.roomMessages.set(room.id, []);
    this.permissions.set(room.id, room.permissions);

    this.updateMetrics();
    this.emit('roomCreated', room);

    return room;
  }

  private createDefaultPermissions(): RoomPermissions {
    const defaultPermissions = new Set([
      RoomPermission.READ_MESSAGES,
      RoomPermission.SEND_MESSAGES
    ]);

    const rolePermissions = new Map<RoomRole, Set<RoomPermission>>();
    rolePermissions.set(RoomRole.OWNER, new Set(Object.values(RoomPermission)));
    rolePermissions.set(RoomRole.ADMIN, new Set([
      RoomPermission.READ_MESSAGES,
      RoomPermission.SEND_MESSAGES,
      RoomPermission.INVITE_USERS,
      RoomPermission.KICK_USERS,
      RoomPermission.BAN_USERS,
      RoomPermission.MODERATE_MESSAGES,
      RoomPermission.MANAGE_SETTINGS
    ]));
    rolePermissions.set(RoomRole.MODERATOR, new Set([
      RoomPermission.READ_MESSAGES,
      RoomPermission.SEND_MESSAGES,
      RoomPermission.INVITE_USERS,
      RoomPermission.KICK_USERS,
      RoomPermission.MODERATE_MESSAGES
    ]));
    rolePermissions.set(RoomRole.MEMBER, defaultPermissions);

    return {
      defaultPermissions,
      rolePermissions,
      userPermissions: new Map()
    };
  }

  async joinRoom(roomId: string, userId: string, invitedBy?: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Check if room is full
    if (room.maxMembers && room.memberCount >= room.maxMembers) {
      return false;
    }

    // Check if user is banned
    const roomMemberMap = this.roomMembers.get(roomId);
    if (roomMemberMap) {
      const member = roomMemberMap.get(userId);
      if (member && member.isBanned) {
        return false;
      }
    }

    // Check invitation requirement
    if (room.settings.requireInvitation && !invitedBy) {
      return false;
    }

    // Add user to room
    const member: RoomMember = {
      userId,
      roomId,
      role: RoomRole.MEMBER,
      permissions: this.getUserPermissions(userId, roomId),
      joinedAt: new Date(),
      lastActivity: new Date(),
      isMuted: false,
      isBanned: false
    };

    const memberMap = this.roomMembers.get(roomId);
    memberMap.set(userId, member);
    this.roomMembers.set(roomId, memberMap);

    room.memberCount = memberMap.size;
    room.updatedAt = new Date();

    // Update presence
    await this.presenceService.updatePresence(userId, {
      currentRoom: roomId
    });

    // Notify room members
    await this.broadcastToRoom(roomId, {
      type: 'user_joined',
      data: {
        userId,
        timestamp: new Date()
      }
    });

    this.updateMetrics();
    this.emit('userJoinedRoom', userId, room);

    return true;
  }

  async leaveRoom(roomId: string, userId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    const memberMap = this.roomMembers.get(roomId);
    if (!memberMap) {
      return false;
    }

    const member = memberMap.get(userId);
    if (!member) {
      return false;
    }

    // Remove user from room
    memberMap.delete(userId);
    this.roomMembers.set(roomId, memberMap);

    room.memberCount = memberMap.size;
    room.updatedAt = new Date();

    // Update presence
    await this.presenceService.updatePresence(userId, {
      currentRoom: undefined
    });

    // Notify room members
    await this.broadcastToRoom(roomId, {
      type: 'user_left',
      data: {
        userId,
        timestamp: new Date()
      }
    });

    this.updateMetrics();
    this.emit('userLeftRoom', userId, room);

    return true;
  }

  async sendMessage(roomId: string, userId: string, content: string, type: RoomMessage['type'] = 'text', visibility: MessageVisibility = MessageVisibility.ALL, attachments?: Omit<MessageAttachment, 'id'>[]): Promise<RoomMessage> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Check permissions
    const memberMap = this.roomMembers.get(roomId);
    const member = memberMap?.get(userId);
    if (!member || !member.permissions.has(RoomPermission.SEND_MESSAGES)) {
      throw new Error('No permission to send messages');
    }

    // Check rate limits
    if (!this.checkRateLimit(userId, roomId)) {
      throw new Error('Rate limit exceeded');
    }

    // Check message length
    if (content.length > room.settings.maxMessageLength) {
      throw new Error('Message too long');
    }

    const message: RoomMessage = {
      id: this.generateMessageId(),
      roomId,
      senderId: userId,
      senderRole: member.role,
      content,
      type,
      visibility,
      attachments: attachments?.map((att, index) => ({
        ...att,
        id: att.id || `att_${Date.now()}_${index}`
      })) || [],
      reactions: [],
      isEdited: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const messageMap = this.roomMessages.get(roomId);
    messageMap.push(message);
    this.roomMessages.set(roomId, messageMap);

    // Update member activity
    if (member) {
      member.lastActivity = new Date();
    }

    // Broadcast to room
    await this.broadcastToRoom(roomId, {
      type: 'message',
      data: {
        messageId: message.id,
        senderId: userId,
        content,
        type,
        visibility,
        timestamp: message.createdAt,
        sender: this.sanitizeUserForBroadcast(member)
      }
    });

    this.updateMetrics();
    this.emit('messageSent', message);

    return message;
  }

  private sanitizeUserForBroadcast(member: RoomMember): any {
    if (this.config.enablePrivacy) {
      return {
        userId: member.userId,
        role: member.role
      };
    }

    return member;
  }

  private async broadcastToRoom(roomId: string, data: any): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const memberMap = this.roomMembers.get(roomId);
    if (!memberMap) return;

    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: MessageType.ROOM_MESSAGE,
      data,
      timestamp: new Date()
    };

    // Send to all room members
    for (const [userId, member] of memberMap.entries()) {
      if (member.isBanned) continue;

      const connection = await this.webSocketServer.getConnections()
        .find(conn => conn.userId === userId && conn.isAuthenticated);

      if (connection) {
        this.webSocketServer.sendMessage(connection, message);
      }
    }
  }

  private checkRateLimit(userId: string, roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return true;

    const now = Date.now();
    const timeWindow = room.settings.rateLimitPerUser.timeWindow * 60 * 1000;
    const messageMap = this.roomMessages.get(roomId);

    const userMessages = Array.from(messageMap.values())
      .filter(msg => msg.senderId === userId && msg.createdAt >= now - timeWindow);

    return userMessages.length < room.settings.rateLimitPerUser.messages;
  }

  private getUserPermissions(userId: string, roomId: string): Set<RoomPermission> {
    const room = this.rooms.get(roomId);
    if (!room) return new Set();

    const memberMap = this.roomMembers.get(roomId);
    const member = memberMap?.get(userId);

    if (!member) return new Set();

    // Check user-specific permissions
    const userPerms = room.permissions.userPermissions.get(userId) || new Set();

    // Check role-based permissions
    const rolePerms = room.permissions.rolePermissions.get(member.role) || new Set();

    // Combine permissions
    return new Set([...userPerms, ...rolePerms, ...room.permissions.defaultPermissions]);
  }

  private addUserToDefaultRooms(userId: string): void {
    // Add user to public rooms by default
    const publicRooms = Array.from(this.rooms.values())
      .filter(room => room.type === RoomType.PUBLIC);

    for (const room of publicRooms) {
      this.joinRoom(room.id, userId);
    }
  }

  private removeUserFromAllRooms(userId: string): void {
    // Remove user from all rooms
    const allRoomIds = Array.from(this.rooms.keys());

    for (const roomId of allRoomIds) {
      this.leaveRoom(roomId, userId);
    }
  }

  async inviteUser(roomId: string, inviterId: string, userId: string, message?: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Check permissions
    const inviterMap = this.roomMembers.get(roomId);
    const inviter = inviterMap?.get(inviterId);
    if (!inviter || !inviter.permissions.has(RoomPermission.INVITE_USERS)) {
      throw new Error('No permission to invite users');
    }

    // Create invitation
    const invitationData = {
      type: 'room_invitation',
      data: {
        roomId,
        inviterId,
        userId,
        message,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + this.config.invitationTimeout)
      }
    };

    // Send notification to invited user
    const targetConnection = await this.webSocketServer.getConnections()
      .find(conn => conn.userId === userId && conn.isAuthenticated);

    if (targetConnection) {
      this.webSocketServer.sendMessage(targetConnection, invitationData as any);
    }

    this.emit('userInvited', inviterId, userId, room, invitationData);
    return true;
  }

  async kickUser(roomId: string, moderatorId: string, userId: string, reason?: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Check permissions
    const moderatorMap = this.roomMembers.get(roomId);
    const moderator = moderatorMap?.get(moderatorId);
    if (!moderator || !moderator.permissions.has(RoomPermission.KICK_USERS)) {
      throw new Error('No permission to kick users');
    }

    const memberMap = this.roomMembers.get(roomId);
    const member = memberMap?.get(userId);
    if (!member) {
      return false;
    }

    // Check if trying to kick moderator or owner
    if (member.role === RoomRole.MODERATOR || member.role === RoomRole.OWNER) {
      return false;
    }

    // Remove user from room
    memberMap.delete(userId);
    this.roomMembers.set(roomId, memberMap);

    room.memberCount = memberMap.size;
    room.updatedAt = new Date();

    // Update presence
    await this.presenceService.updatePresence(userId, {
      currentRoom: undefined
    });

    // Notify room members
    await this.broadcastToRoom(roomId, {
      type: 'user_kicked',
      data: {
        userId,
        moderatorId,
        reason,
        timestamp: new Date()
      }
    });

    this.updateMetrics();
    this.emit('userKicked', moderatorId, userId, room, reason);

    return true;
  }

  async banUser(roomId: string, moderatorId: string, userId: string, reason?: string, duration?: number): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Check permissions
    const moderatorMap = this.roomMembers.get(roomId);
    const moderator = moderatorMap?.get(moderatorId);
    if (!moderator || !moderator.permissions.has(RoomPermission.BAN_USERS)) {
      throw new Error('No permission to ban users');
    }

    const memberMap = this.roomMembers.get(roomId);
    const member = memberMap?.get(userId);
    if (!member) {
      return false;
    }

    // Check if trying to ban moderator or owner
    if (member.role === RoomRole.MODERATOR || member.role === RoomRole.OWNER) {
      return false;
    }

    // Ban user
    member.isBanned = true;
    member.banReason = reason;
    member.banExpiresAt = duration ? new Date(Date.now() + duration) : undefined;

    memberMap.set(userId, member);
    this.roomMembers.set(roomId, memberMap);

    // Remove user from room
    await this.leaveRoom(roomId, userId);

    // Notify room members
    await this.broadcastToRoom(roomId, {
      type: 'user_banned',
      data: {
        userId,
        moderatorId,
        reason,
        duration,
        timestamp: new Date()
      }
    });

    this.updateMetrics();
    this.emit('userBanned', moderatorId, userId, room, reason, duration);

    return true;
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredRooms();
      this.cleanupOldMessages();
    }, 3600000); // Clean every hour
  }

  private cleanupExpiredRooms(): void {
    const now = Date.now();
    const expiredRooms: string[] = [];

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.isTemporary && room.expiresAt && room.expiresAt.getTime() < now) {
        expiredRooms.push(roomId);
      }
    }

    expiredRooms.forEach(roomId => {
      this.deleteRoom(roomId);
    });

    if (expiredRooms.length > 0) {
      this.log('info', `Cleaned up ${expiredRooms.length} expired rooms`);
    }
  }

  private cleanupOldMessages(): void {
    if (!this.config.enablePersistence) return;

    const cutoffDate = new Date(now.getTime() - this.config.privacySettings.retentionPeriod * 24 * 60 * 60 * 1000);
    
    let totalCleaned = 0;
    for (const [roomId, messages] of this.roomMessages.entries()) {
      const initialLength = messages.length;
      const filteredMessages = messages.filter(msg => msg.createdAt >= cutoffDate);
      this.roomMessages.set(roomId, filteredMessages);
      totalCleaned += initialLength - filteredMessages.length;
    }

    if (totalCleaned > 0) {
      this.log('info', `Cleaned up ${totalCleaned} old room messages`);
    }
  }

  private startAnalyticsCollection(): void {
    this.analyticsInterval = setInterval(() => {
      this.updateMetrics();
    }, this.config.analyticsInterval);
  }

  private updateMetrics(): void {
    this.metrics.totalRooms = this.rooms.size;

    // Count rooms by type
    this.metrics.roomsByType = {
      public: Array.from(this.rooms.values()).filter(r => r.type === RoomType.PUBLIC).length,
      private: Array.from(this.rooms.values()).filter(r => r.type === RoomType.PRIVATE).length,
      invite_only: Array.from(this.rooms.values()).filter(r => r.type === RoomType.INVITE_ONLY).length,
      temporary: Array.from(this.rooms.values()).filter(r => r.type === RoomType.TEMPORARY).length,
      persistent: Array.from(this.rooms.values()).filter(r => r.type === RoomType.PERSISTENT).length
    };

    // Count rooms by status
    this.metrics.roomsByStatus = {
      active: Array.from(this.rooms.values()).filter(r => r.status === RoomStatus.ACTIVE).length,
      inactive: Array.from(this.rooms.values()).filter(r => r.status === RoomStatus.INACTIVE).length,
      archived: Array.from(this.rooms.values()).filter(r => r.status === RoomStatus.ARCHIVED).length,
      suspended: Array.from(this.rooms.values()).filter(r => r.status === RoomStatus.SUSPENDED).length
    };

    // Count total members and messages
    this.metrics.totalMembers = Array.from(this.roomMembers.values())
      .reduce((sum, memberMap) => sum + memberMap.size, 0);

    this.metrics.totalMessages = Array.from(this.roomMessages.values())
      .reduce((sum, messageMap) => sum + messageMap.length, 0);

    // Count messages by type
    this.metrics.messagesByType = {
      text: Array.from(this.roomMessages.values()).flat().filter(m => m.type === 'text').length,
      image: Array.from(this.roomMessages.values()).flat().filter(m => m.type === 'image').length,
      file: Array.from(this.roomMessages.values()).flat().filter(m => m.type === 'file').length,
      audio: Array.from(this.roomMessages.values()).flat().filter(m => m.type === 'audio').length,
      message: Array.from(this.roomMessages.values()).flat().filter(m => m.type === 'video').length,
      system: Array.from(this.roomMessages.values()).flat().filter(m => m.type === 'system').length
    };

    // Update active rooms count
    this.metrics.activeRooms = Array.from(this.rooms.values())
      .filter(room => room.status === RoomStatus.ACTIVE).length;

    // Update top rooms
    this.metrics.topRooms = Array.from(this.rooms.values())
      .map(room => ({
        roomId: room.id,
        roomName: room.name,
        memberCount: room.memberCount,
        messageCount: (this.roomMessages.get(room.id) || []).length,
        activityLevel: this.calculateRoomActivityLevel(room)
      }))
      .sort((a, b) => b.activityLevel - a.activityLevel)
      .slice(0, 10);

    // Update user distribution
    const roleCounts = new Map<RoomRole, number>();
    for (const memberMap of this.roomMembers.values()) {
      for (const member of memberMap.values()) {
        roleCounts.set(member.role, (roleCounts.get(member.role) || 0) + 1);
      }
    }

    this.metrics.userDistribution = Array.from(roleCounts.entries())
      .map(([role, count]) => ({
        role,
        count,
        percentage: this.metrics.totalMembers > 0 ? (count / this.metrics.totalMembers) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Update message frequency
    const hourlyCounts = new Array(24).fill(0);
    for (const messageMap of this.roomMessages.values()) {
      for (const message of messageMap) {
        const hour = message.createdAt.getHours();
        hourlyCounts[hour]++;
      }
    }

    this.metrics.messageFrequency = hourlyCounts.map((count, hour) => ({
      hour,
      messageCount: count
    }));
  }

  private calculateRoomActivityLevel(room: RoomInfo): number {
    const messages = this.roomMessages.get(room.id) || [];
    const now = Date.now();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentMessages = messages.filter(msg => msg.createdAt >= oneHourAgo);
    return recentMessages.length;
  }

  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
    this.roomMembers.delete(roomId);
    this.roomMessages.delete(roomId);
    this.permissions.delete(roomId);
    this.emit('roomDeleted', roomId);
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.config.enableAnalytics) return;
    
    const logMessage = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  // Public API methods
  async getRoom(roomId: string): Promise<RoomInfo | null> {
    return this.rooms.get(roomId) || null;
  }

  async getRooms(filters?: {
    type?: RoomType;
    status?: RoomStatus;
    createdBy?: string;
    tags?: string[];
    isActive?: boolean;
  }): Promise<RoomInfo[]> {
    let rooms = Array.from(this.rooms.values());

    if (filters) {
      if (filters.type) {
        rooms = rooms.filter(r => r.type === filters.type);
      }
      if (filters.status) {
        rooms = rooms.filter(r => r.status === filters.status);
      }
      if (filters.createdBy) {
        rooms = rooms.filter(r => r.createdBy === filters.createdBy);
      }
      if (filters.tags && filters.tags.length > 0) {
        rooms = rooms.filter(r => 
          filters.tags!.some(tag => r.tags?.includes(tag))
        );
      }
      if (filters.isActive !== undefined) {
        rooms = rooms.filter(r => r.status === RoomStatus.ACTIVE);
      }
    }

    return rooms.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    const memberMap = this.roomMembers.get(roomId);
    return memberMap ? Array.from(memberMap.values()) : [];
  }

  async getRoomMessages(roomId: string, filters?: {
    userId?: string;
    type?: RoomMessage['type'];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<RoomMessage[]> {
    let messages = this.roomMessages.get(roomId) || [];

    if (filters) {
      if (filters.userId) {
        messages = messages.filter(m => m.senderId === filters.userId);
      }
      if (filters.type) {
        messages = messages.filter(m => m.type === filters.type);
      }
      if (filters.startDate) {
        messages = messages.filter(m => m.createdAt >= filters.startDate!);
      }
      if (filters.endDate) {
        messages = messages.filter(m => m.createdAt <= filters.endDate!);
      }
    }

    return messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, filters?.limit || 100);
  }

  async getMetrics(): Promise<RoomMetrics> {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async updateConfig(updates: Partial<RoomConfig>): Promise<RoomConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<RoomConfig> {
    return { ...this.config };
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down room-based communication service...');

    // Clear intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
    }

    // Clean up all data
    this.rooms.clear();
    this.roomMembers.clear();
    this.roomMessages.clear();
    this.permissions.clear();

    this.log('info', 'Room-based communication service shutdown complete');
    this.emit('serviceShutdown');
  }
}
