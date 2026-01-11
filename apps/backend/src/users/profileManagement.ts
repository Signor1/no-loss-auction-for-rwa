import { EventEmitter } from 'events';

// Enums
export enum ProfileVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  FRIENDS_ONLY = 'friends_only'
}

export enum ProfileStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  UNDER_REVIEW = 'under_review'
}

export enum VerificationLevel {
  NONE = 'none',
  EMAIL = 'email',
  PHONE = 'phone',
  IDENTITY = 'identity',
  BUSINESS = 'business'
}

// Interfaces
export interface UserProfile {
  id: string;
  userId: string;
  
  // Basic Information
  displayName: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  headline?: string;
  
  // Visuals
  avatar?: string;
  banner?: string;
  avatarHash?: string;
  bannerHash?: string;
  
  // Contact Information
  email?: string;
  phone?: string;
  website?: string;
  socialLinks: SocialLink[];
  
  // Location
  location?: UserLocation;
  
  // Professional Information
  company?: string;
  jobTitle?: string;
  industry?: string;
  experience?: string;
  skills?: string[];
  education?: Education[];
  certifications?: Certification[];
  
  // Verification
  verificationLevel: VerificationLevel;
  isVerified: boolean;
  verificationBadges: VerificationBadge[];
  
  // Privacy and Visibility
  visibility: ProfileVisibility;
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  showActivity: boolean;
  showBiddingHistory: boolean;
  allowDirectMessages: boolean;
  allowTagging: boolean;
  
  // Reputation and Stats
  reputationScore: number;
  trustScore: number;
  completionRate: number;
  responseRate: number;
  averageResponseTime: number;
  
  // Activity Stats
  totalAuctions: number;
  totalBids: number;
  winningAuctions: number;
  totalSpent: number;
  totalEarned: number;
  
  // Preferences
  preferredCategories: string[];
  preferredPaymentMethods: string[];
  
  // Status and Metadata
  status: ProfileStatus;
  lastActiveAt?: Date;
  featured: boolean;
  tags: string[];
  metadata: Record<string, any>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy?: string;
}

export interface SocialLink {
  platform: 'twitter' | 'linkedin' | 'github' | 'discord' | 'telegram' | 'instagram' | 'facebook';
  url: string;
  username?: string;
  verified: boolean;
  addedAt: Date;
}

export interface UserLocation {
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
  timezone: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  gpa?: number;
  description?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  verified: boolean;
}

export interface VerificationBadge {
  id: string;
  type: 'email' | 'phone' | 'identity' | 'business' | 'premium' | 'verified_trader';
  name: string;
  description: string;
  icon?: string;
  verifiedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface ProfileUpdate {
  id: string;
  userId: string;
  field: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

export interface ProfileConfig {
  allowCustomDisplayNames: boolean;
  requireRealNames: boolean;
  minBioLength: number;
  maxBioLength: number;
  allowExternalLinks: boolean;
  requireVerificationForLinks: boolean;
  allowCustomAvatars: boolean;
  avatarSizeLimit: number; // in bytes
  bannerSizeLimit: number; // in bytes;
  supportedImageFormats: string[];
  requireModeration: boolean;
  autoApproveEdits: boolean;
  editCooldown: number; // minutes
  maxEditsPerDay: number;
  enableReputationSystem: boolean;
  enableVerificationBadges: boolean;
}

export interface ProfileAnalytics {
  period: { start: Date; end: Date };
  
  // Profile metrics
  totalProfiles: number;
  activeProfiles: number;
  verifiedProfiles: number;
  profilesByVisibility: Record<ProfileVisibility, number>;
  profilesByVerificationLevel: Record<VerificationLevel, number>;
  
  // Update metrics
  totalUpdates: number;
  updatesByField: Record<string, number>;
  averageProfileCompleteness: number;
  
  // Activity metrics
  profileViews: number;
  profileViewsByDay: {
    date: Date;
    views: number;
  }[];
  
  // Verification metrics
  verificationRequests: number;
  verificationApprovals: number;
  verificationRejections: number;
  averageVerificationTime: number;
  
  // Quality metrics
  incompleteProfiles: number;
  suspiciousProfiles: number;
  reportedProfiles: number;
}

// Main Profile Management Service
export class ProfileManagementService extends EventEmitter {
  private profiles: Map<string, UserProfile> = new Map();
  private profileUpdates: Map<string, ProfileUpdate> = new Map();
  private userIdToProfileId: Map<string, string> = new Map();
  private config: ProfileConfig;
  private editHistory: Map<string, ProfileUpdate[]> = new Map();
  private dailyEditCounts: Map<string, { count: number; date: string }> = new Map();

  constructor(config?: Partial<ProfileConfig>) {
    super();
    this.config = {
      allowCustomDisplayNames: true,
      requireRealNames: false,
      minBioLength: 0,
      maxBioLength: 500,
      allowExternalLinks: true,
      requireVerificationForLinks: false,
      allowCustomAvatars: true,
      avatarSizeLimit: 5 * 1024 * 1024, // 5MB
      bannerSizeLimit: 10 * 1024 * 1024, // 10MB
      supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      requireModeration: false,
      autoApproveEdits: true,
      editCooldown: 5,
      maxEditsPerDay: 10,
      enableReputationSystem: true,
      enableVerificationBadges: true,
      ...config
    };
  }

  // Profile Creation and Management
  async createProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const profileId = this.generateId();
    const now = new Date();

    // Check if user already has a profile
    if (this.userIdToProfileId.has(userId)) {
      throw new Error('User already has a profile');
    }

    const profile: UserProfile = {
      id: profileId,
      userId,
      displayName: profileData.displayName || `User${userId.substring(0, 8)}`,
      socialLinks: [],
      verificationLevel: VerificationLevel.NONE,
      isVerified: false,
      verificationBadges: [],
      visibility: ProfileVisibility.PUBLIC,
      showEmail: false,
      showPhone: false,
      showLocation: true,
      showActivity: true,
      showBiddingHistory: true,
      allowDirectMessages: true,
      allowTagging: true,
      reputationScore: 0,
      trustScore: 0,
      completionRate: 0,
      responseRate: 0,
      averageResponseTime: 0,
      totalAuctions: 0,
      totalBids: 0,
      winningAuctions: 0,
      totalSpent: 0,
      totalEarned: 0,
      preferredCategories: [],
      preferredPaymentMethods: [],
      status: ProfileStatus.ACTIVE,
      featured: false,
      tags: [],
      metadata: {},
      createdAt: now,
      updatedAt: now
    };

    // Apply provided data
    Object.assign(profile, profileData);

    // Validate profile
    await this.validateProfile(profile);

    // Store profile
    this.profiles.set(profileId, profile);
    this.userIdToProfileId.set(userId, profileId);

    this.emit('profileCreated', profile);
    return profile;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const profileId = this.userIdToProfileId.get(userId);
    return profileId ? this.profiles.get(profileId) || null : null;
  }

  async getProfileById(profileId: string): Promise<UserProfile | null> {
    return this.profiles.get(profileId) || null;
  }

  async updateProfile(
    userId: string,
    updates: Partial<UserProfile>,
    reason?: string
  ): Promise<UserProfile> {
    const profileId = this.userIdToProfileId.get(userId);
    if (!profileId) {
      throw new Error('Profile not found');
    }

    const profile = this.profiles.get(profileId)!;
    const oldProfile = { ...profile };

    // Check edit cooldown
    await this.checkEditCooldown(userId);

    // Check daily edit limit
    await this.checkDailyEditLimit(userId);

    // Validate updates
    await this.validateProfileUpdates(profile, updates);

    // Create update record if moderation is required
    if (this.config.requireModeration && !this.config.autoApproveEdits) {
      return await this.createProfileUpdate(profile, updates, reason);
    }

    // Apply updates
    Object.assign(profile, updates);
    profile.updatedAt = new Date();
    profile.lastModifiedBy = userId;

    // Update completion score
    profile.reputationScore = this.calculateProfileCompleteness(profile);

    // Store edit history
    await this.recordEdit(userId, profile, oldProfile, reason);

    this.emit('profileUpdated', { profile, updates, oldProfile });
    return profile;
  }

  async deleteProfile(userId: string, reason?: string): Promise<boolean> {
    const profileId = this.userIdToProfileId.get(userId);
    if (!profileId) {
      return false;
    }

    const profile = this.profiles.get(profileId)!;
    
    // Soft delete
    profile.status = ProfileStatus.INACTIVE;
    profile.visibility = ProfileVisibility.PRIVATE;
    profile.updatedAt = new Date();
    profile.metadata.deletedAt = new Date();
    profile.metadata.deleteReason = reason;

    this.emit('profileDeleted', { profile, reason });
    return true;
  }

  // Profile Verification
  async addVerificationBadge(
    userId: string,
    badgeType: VerificationBadge['type'],
    badgeData: Partial<VerificationBadge>
  ): Promise<VerificationBadge> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const badge: VerificationBadge = {
      id: this.generateId(),
      type: badgeType,
      name: this.getBadgeName(badgeType),
      description: this.getBadgeDescription(badgeType),
      verifiedAt: new Date(),
      ...badgeData
    };

    profile.verificationBadges.push(badge);
    profile.isVerified = true;
    profile.verificationLevel = this.calculateVerificationLevel(profile.verificationBadges);
    profile.updatedAt = new Date();

    this.emit('verificationBadgeAdded', { profile, badge });
    return badge;
  }

  async removeVerificationBadge(
    userId: string,
    badgeId: string,
    reason?: string
  ): Promise<boolean> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      return false;
    }

    const badgeIndex = profile.verificationBadges.findIndex(b => b.id === badgeId);
    if (badgeIndex === -1) {
      return false;
    }

    const removedBadge = profile.verificationBadges.splice(badgeIndex, 1)[0];
    profile.verificationLevel = this.calculateVerificationLevel(profile.verificationBadges);
    profile.isVerified = profile.verificationBadges.length > 0;
    profile.updatedAt = new Date();

    this.emit('verificationBadgeRemoved', { profile, badge: removedBadge, reason });
    return true;
  }

  // Social Links Management
  async addSocialLink(
    userId: string,
    platform: SocialLink['platform'],
    url: string,
    username?: string
  ): Promise<SocialLink> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Validate URL
    if (!this.isValidUrl(url)) {
      throw new Error('Invalid URL format');
    }

    // Check if platform already exists
    const existingLink = profile.socialLinks.find(link => link.platform === platform);
    if (existingLink) {
      throw new Error(`${platform} link already exists`);
    }

    const socialLink: SocialLink = {
      platform,
      url,
      username,
      verified: false,
      addedAt: new Date()
    };

    profile.socialLinks.push(socialLink);
    profile.updatedAt = new Date();

    this.emit('socialLinkAdded', { profile, socialLink });
    return socialLink;
  }

  async removeSocialLink(
    userId: string,
    platform: SocialLink['platform']
  ): Promise<boolean> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      return false;
    }

    const linkIndex = profile.socialLinks.findIndex(link => link.platform === platform);
    if (linkIndex === -1) {
      return false;
    }

    const removedLink = profile.socialLinks.splice(linkIndex, 1)[0];
    profile.updatedAt = new Date();

    this.emit('socialLinkRemoved', { profile, socialLink: removedLink });
    return true;
  }

  // Education and Certifications
  async addEducation(
    userId: string,
    educationData: Omit<Education, 'id'>
  ): Promise<Education> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const education: Education = {
      id: this.generateId(),
      ...educationData
    };

    if (!profile.education) {
      profile.education = [];
    }
    profile.education.push(education);
    profile.updatedAt = new Date();

    this.emit('educationAdded', { profile, education });
    return education;
  }

  async removeEducation(userId: string, educationId: string): Promise<boolean> {
    const profile = await this.getProfile(userId);
    if (!profile || !profile.education) {
      return false;
    }

    const educationIndex = profile.education.findIndex(e => e.id === educationId);
    if (educationIndex === -1) {
      return false;
    }

    const removedEducation = profile.education.splice(educationIndex, 1)[0];
    profile.updatedAt = new Date();

    this.emit('educationRemoved', { profile, education: removedEducation });
    return true;
  }

  async addCertification(
    userId: string,
    certificationData: Omit<Certification, 'id'>
  ): Promise<Certification> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const certification: Certification = {
      id: this.generateId(),
      ...certificationData
    };

    if (!profile.certifications) {
      profile.certifications = [];
    }
    profile.certifications.push(certification);
    profile.updatedAt = new Date();

    this.emit('certificationAdded', { profile, certification });
    return certification;
  }

  async removeCertification(userId: string, certificationId: string): Promise<boolean> {
    const profile = await this.getProfile(userId);
    if (!profile || !profile.certifications) {
      return false;
    }

    const certificationIndex = profile.certifications.findIndex(c => c.id === certificationId);
    if (certificationIndex === -1) {
      return false;
    }

    const removedCertification = profile.certifications.splice(certificationIndex, 1)[0];
    profile.updatedAt = new Date();

    this.emit('certificationRemoved', { profile, certification: removedCertification });
    return true;
  }

  // Profile Updates Management
  async getProfileUpdates(userId: string): Promise<ProfileUpdate[]> {
    return Array.from(this.profileUpdates.values())
      .filter(update => update.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async approveProfileUpdate(
    updateId: string,
    approvedBy: string,
    notes?: string
  ): Promise<boolean> {
    const update = this.profileUpdates.get(updateId);
    if (!update || update.status !== 'pending') {
      return false;
    }

    // Apply the update
    const profile = await this.getProfile(update.userId);
    if (profile) {
      (profile as any)[update.field] = update.newValue;
      profile.updatedAt = new Date();
      profile.lastModifiedBy = approvedBy;
    }

    update.status = 'approved';
    update.reviewedBy = approvedBy;
    update.reviewedAt = new Date();
    update.metadata.approvalNotes = notes;

    this.emit('profileUpdateApproved', { update, approvedBy });
    return true;
  }

  async rejectProfileUpdate(
    updateId: string,
    rejectionReason: string,
    rejectedBy: string
  ): Promise<boolean> {
    const update = this.profileUpdates.get(updateId);
    if (!update || update.status !== 'pending') {
      return false;
    }

    update.status = 'rejected';
    update.reviewedBy = rejectedBy;
    update.reviewedAt = new Date();
    update.rejectionReason = rejectionReason;

    this.emit('profileUpdateRejected', { update, rejectionReason, rejectedBy });
    return true;
  }

  // Search and Discovery
  async searchProfiles(query: {
    keyword?: string;
    location?: string;
    skills?: string[];
    verificationLevel?: VerificationLevel;
    minReputation?: number;
    limit?: number;
    offset?: number;
  }): Promise<UserProfile[]> {
    let profiles = Array.from(this.profiles.values());

    // Filter by keyword
    if (query.keyword) {
      const keyword = query.keyword.toLowerCase();
      profiles = profiles.filter(profile => 
        profile.displayName.toLowerCase().includes(keyword) ||
        profile.bio?.toLowerCase().includes(keyword) ||
        profile.headline?.toLowerCase().includes(keyword)
      );
    }

    // Filter by location
    if (query.location) {
      const location = query.location.toLowerCase();
      profiles = profiles.filter(profile => 
        profile.location?.country.toLowerCase().includes(location) ||
        profile.location?.city?.toLowerCase().includes(location) ||
        profile.location?.state?.toLowerCase().includes(location)
      );
    }

    // Filter by skills
    if (query.skills && query.skills.length > 0) {
      profiles = profiles.filter(profile => 
        query.skills!.some(skill => 
          profile.skills?.includes(skill)
        )
      );
    }

    // Filter by verification level
    if (query.verificationLevel) {
      profiles = profiles.filter(profile => 
        profile.verificationLevel === query.verificationLevel
      );
    }

    // Filter by minimum reputation
    if (query.minReputation !== undefined) {
      profiles = profiles.filter(profile => 
        profile.reputationScore >= query.minReputation!
      );
    }

    // Sort by reputation score (descending)
    profiles.sort((a, b) => b.reputationScore - a.reputationScore);

    // Pagination
    const offset = query.offset || 0;
    const limit = query.limit || 20;
    return profiles.slice(offset, offset + limit);
  }

  // Private Methods
  private async validateProfile(profile: UserProfile): Promise<void> {
    if (!profile.displayName || profile.displayName.trim().length === 0) {
      throw new Error('Display name is required');
    }

    if (this.config.requireRealNames && !profile.firstName && !profile.lastName) {
      throw new Error('Real name is required');
    }

    if (profile.bio && profile.bio.length > this.config.maxBioLength) {
      throw new Error(`Bio cannot exceed ${this.config.maxBioLength} characters`);
    }

    if (profile.socialLinks && !this.config.allowExternalLinks) {
      throw new Error('External links are not allowed');
    }
  }

  private async validateProfileUpdates(
    profile: UserProfile,
    updates: Partial<UserProfile>
  ): Promise<void> {
    // Validate display name
    if (updates.displayName !== undefined) {
      if (!updates.displayName || updates.displayName.trim().length === 0) {
        throw new Error('Display name is required');
      }
    }

    // Validate bio
    if (updates.bio !== undefined && updates.bio && updates.bio.length > this.config.maxBioLength) {
      throw new Error(`Bio cannot exceed ${this.config.maxBioLength} characters`);
    }

    // Validate social links
    if (updates.socialLinks) {
      for (const link of updates.socialLinks) {
        if (!this.isValidUrl(link.url)) {
          throw new Error(`Invalid URL for ${link.platform}`);
        }
      }
    }
  }

  private async checkEditCooldown(userId: string): Promise<void> {
    const editHistory = this.editHistory.get(userId) || [];
    const lastEdit = editHistory[0];
    
    if (lastEdit) {
      const timeSinceLastEdit = Date.now() - lastEdit.createdAt.getTime();
      const cooldownMs = this.config.editCooldown * 60 * 1000;
      
      if (timeSinceLastEdit < cooldownMs) {
        const remainingTime = Math.ceil((cooldownMs - timeSinceLastEdit) / 60000);
        throw new Error(`Please wait ${remainingTime} minutes before making another edit`);
      }
    }
  }

  private async checkDailyEditLimit(userId: string): Promise<void> {
    const today = new Date().toISOString().substring(0, 10);
    const dailyCount = this.dailyEditCounts.get(userId) || { count: 0, date: today };
    
    if (dailyCount.date !== today) {
      dailyCount.count = 0;
      dailyCount.date = today;
    }

    if (dailyCount.count >= this.config.maxEditsPerDay) {
      throw new Error(`Daily edit limit of ${this.config.maxEditsPerDay} exceeded`);
    }

    dailyCount.count++;
    this.dailyEditCounts.set(userId, dailyCount);
  }

  private async createProfileUpdate(
    profile: UserProfile,
    updates: Partial<UserProfile>,
    reason?: string
  ): Promise<UserProfile> {
    const updateRecords: ProfileUpdate[] = [];

    for (const [field, newValue] of Object.entries(updates)) {
      const oldValue = (profile as any)[field];
      
      if (oldValue !== newValue) {
        const update: ProfileUpdate = {
          id: this.generateId(),
          userId: profile.userId,
          field,
          oldValue,
          newValue,
          reason,
          status: 'pending',
          createdAt: new Date()
        };

        updateRecords.push(update);
        this.profileUpdates.set(update.id, update);
      }
    }

    this.emit('profileUpdateRequested', { profile, updates, updateRecords });
    return profile;
  }

  private async recordEdit(
    userId: string,
    newProfile: UserProfile,
    oldProfile: UserProfile,
    reason?: string
  ): Promise<void> {
    const edit: ProfileUpdate = {
      id: this.generateId(),
      userId,
      field: 'profile',
      oldValue: oldProfile,
      newValue: newProfile,
      reason,
      status: 'approved',
      createdAt: new Date()
    };

    const editHistory = this.editHistory.get(userId) || [];
    editHistory.unshift(edit);
    this.editHistory.set(userId, editHistory.slice(0, 100)); // Keep last 100 edits
  }

  private calculateProfileCompleteness(profile: UserProfile): number {
    let score = 0;
    const maxScore = 100;

    // Basic info (30 points)
    if (profile.displayName) score += 10;
    if (profile.firstName && profile.lastName) score += 10;
    if (profile.bio && profile.bio.length > 50) score += 10;

    // Visuals (20 points)
    if (profile.avatar) score += 10;
    if (profile.banner) score += 10;

    // Contact (15 points)
    if (profile.email) score += 5;
    if (profile.phone) score += 5;
    if (profile.website) score += 5;

    // Location (10 points)
    if (profile.location) score += 10;

    // Professional (15 points)
    if (profile.company) score += 5;
    if (profile.jobTitle) score += 5;
    if (profile.skills && profile.skills.length > 0) score += 5;

    // Social (10 points)
    if (profile.socialLinks.length > 0) score += 10;

    return Math.min(score, maxScore);
  }

  private calculateVerificationLevel(badges: VerificationBadge[]): VerificationLevel {
    if (badges.length === 0) return VerificationLevel.NONE;
    
    const hasEmail = badges.some(b => b.type === 'email');
    const hasPhone = badges.some(b => b.type === 'phone');
    const hasIdentity = badges.some(b => b.type === 'identity');
    const hasBusiness = badges.some(b => b.type === 'business');

    if (hasBusiness) return VerificationLevel.BUSINESS;
    if (hasIdentity) return VerificationLevel.IDENTITY;
    if (hasPhone) return VerificationLevel.PHONE;
    if (hasEmail) return VerificationLevel.EMAIL;
    
    return VerificationLevel.NONE;
  }

  private getBadgeName(type: VerificationBadge['type']): string {
    const names = {
      email: 'Email Verified',
      phone: 'Phone Verified',
      identity: 'Identity Verified',
      business: 'Business Verified',
      premium: 'Premium Member',
      verified_trader: 'Verified Trader'
    };
    return names[type] || 'Verified';
  }

  private getBadgeDescription(type: VerificationBadge['type']): string {
    const descriptions = {
      email: 'Email address has been verified',
      phone: 'Phone number has been verified',
      identity: 'Identity has been verified through KYC',
      business: 'Business entity has been verified',
      premium: 'Premium subscription member',
      verified_trader: 'Verified trader with good reputation'
    };
    return descriptions[type] || 'Verified user';
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private generateId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Analytics
  async getProfileAnalytics(
    period: { start: Date; end: Date }
  ): Promise<ProfileAnalytics> {
    const profiles = Array.from(this.profiles.values())
      .filter(p => p.createdAt >= period.start && p.createdAt <= period.end);

    // Basic metrics
    const totalProfiles = profiles.length;
    const activeProfiles = profiles.filter(p => p.status === ProfileStatus.ACTIVE).length;
    const verifiedProfiles = profiles.filter(p => p.isVerified).length;

    // By visibility
    const profilesByVisibility: Record<ProfileVisibility, number> = {
      [ProfileVisibility.PUBLIC]: 0,
      [ProfileVisibility.PRIVATE]: 0,
      [ProfileVisibility.FRIENDS_ONLY]: 0
    };

    for (const profile of profiles) {
      profilesByVisibility[profile.visibility]++;
    }

    // By verification level
    const profilesByVerificationLevel: Record<VerificationLevel, number> = {
      [VerificationLevel.NONE]: 0,
      [VerificationLevel.EMAIL]: 0,
      [VerificationLevel.PHONE]: 0,
      [VerificationLevel.IDENTITY]: 0,
      [VerificationLevel.BUSINESS]: 0
    };

    for (const profile of profiles) {
      profilesByVerificationLevel[profile.verificationLevel]++;
    }

    // Update metrics
    const updates = Array.from(this.profileUpdates.values())
      .filter(u => u.createdAt >= period.start && u.createdAt <= period.end);
    
    const updatesByField: Record<string, number> = {};
    for (const update of updates) {
      updatesByField[update.field] = (updatesByField[update.field] || 0) + 1;
    }

    const averageProfileCompleteness = profiles.length > 0
      ? profiles.reduce((sum, p) => sum + this.calculateProfileCompleteness(p), 0) / profiles.length
      : 0;

    return {
      period,
      totalProfiles,
      activeProfiles,
      verifiedProfiles,
      profilesByVisibility,
      profilesByVerificationLevel,
      totalUpdates: updates.length,
      updatesByField,
      averageProfileCompleteness,
      profileViews: 0, // Would track from view events
      profileViewsByDay: [],
      verificationRequests: 0, // Would track from verification requests
      verificationApprovals: 0,
      verificationRejections: 0,
      averageVerificationTime: 0,
      incompleteProfiles: profiles.filter(p => this.calculateProfileCompleteness(p) < 50).length,
      suspiciousProfiles: 0, // Would detect from patterns
      reportedProfiles: 0 // Would track from reports
    };
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
    const totalProfiles = this.profiles.size;
    const pendingUpdates = Array.from(this.profileUpdates.values())
      .filter(u => u.status === 'pending').length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (pendingUpdates > 1000) {
      status = 'unhealthy';
    } else if (pendingUpdates > 500) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalProfiles,
        pendingUpdates,
        moderationEnabled: this.config.requireModeration,
        autoApproveEnabled: this.config.autoApproveEdits
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        profiles: Array.from(this.profiles.values()),
        profileUpdates: Array.from(this.profileUpdates.values()),
        config: this.config
      }, null, 2);
    } else {
      // CSV export for profiles
      const headers = [
        'ID', 'User ID', 'Display Name', 'Email', 'Status', 'Verification Level',
        'Reputation Score', 'Visibility', 'Created At', 'Updated At'
      ];
      
      const rows = Array.from(this.profiles.values()).map(p => [
        p.id,
        p.userId,
        p.displayName,
        p.email || '',
        p.status,
        p.verificationLevel,
        p.reputationScore,
        p.visibility,
        p.createdAt.toISOString(),
        p.updatedAt.toISOString()
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
