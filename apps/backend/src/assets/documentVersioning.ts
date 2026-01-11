import { EventEmitter } from 'events';
import { IPFSIntegrationService } from './ipfsIntegration';

// Enums
export enum VersionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DEPRECATED = 'deprecated'
}

export enum VersionAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  RESTORE = 'restore',
  MERGE = 'merge'
}

export enum ComparisonType {
  CONTENT = 'content',
  METADATA = 'metadata',
  FULL = 'full'
}

// Interfaces
export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  status: VersionStatus;
  hash: string;
  size: number;
  contentType: string;
  createdAt: Date;
  createdBy: string;
  changes: string;
  tags: string[];
  metadata: Record<string, any>;
  ipfsHash: string;
  parentVersionId?: string;
  childVersionIds: string[];
  isLatest: boolean;
}

export interface VersionDiff {
  versionId1: string;
  versionId2: string;
  comparisonType: ComparisonType;
  contentChanges: {
    added: string[];
    removed: string[];
    modified: { old: string; new: string }[];
  };
  metadataChanges: {
    added: Record<string, any>;
    removed: string[];
    modified: { old: any; new: any; key: string }[];
  };
  summary: {
    totalChanges: number;
    additions: number;
    deletions: number;
    modifications: number;
  };
  comparedAt: Date;
}

export interface VersionBranch {
  id: string;
  name: string;
  documentId: string;
  headVersionId: string;
  versions: string[];
  createdAt: Date;
  createdBy: string;
  description?: string;
  isActive: boolean;
  mergedInto?: string;
}

export interface VersionMerge {
  id: string;
  sourceBranchId: string;
  targetBranchId: string;
  sourceVersionId: string;
  targetVersionId: string;
  mergedVersionId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'conflicted';
  conflicts: {
    path: string;
    type: 'content' | 'metadata';
    description: string;
    resolution?: 'source' | 'target' | 'manual';
  }[];
  createdAt: Date;
  createdBy: string;
  completedAt?: Date;
}

export interface VersionHistory {
  documentId: string;
  versions: DocumentVersion[];
  branches: VersionBranch[];
  merges: VersionMerge[];
  totalVersions: number;
  totalBranches: number;
  totalMerges: number;
}

export interface VersionStats {
  totalVersions: number;
  activeVersions: number;
  archivedVersions: number;
  deprecatedVersions: number;
  averageVersionsPerDocument: number;
  totalSize: number;
  averageVersionSize: number;
  versionsByStatus: Record<VersionStatus, number>;
  versionsByUser: Record<string, number>;
  recentActivity: {
    date: Date;
    action: VersionAction;
    versionId: string;
    userId: string;
  }[];
}

// Main Document Versioning Service
export class DocumentVersioningService extends EventEmitter {
  private ipfsService: IPFSIntegrationService;
  private versions: Map<string, DocumentVersion> = new Map();
  private branches: Map<string, VersionBranch> = new Map();
  private merges: Map<string, VersionMerge> = new Map();
  private documentVersions: Map<string, string[]> = new Map(); // documentId -> versionIds

  constructor(ipfsService: IPFSIntegrationService) {
    super();
    this.ipfsService = ipfsService;
  }

  // Version Creation and Management
  async createVersion(
    documentId: string,
    content: Buffer,
    metadata: {
      contentType: string;
      changes: string;
      tags?: string[];
      customMetadata?: Record<string, any>;
      createdBy: string;
      parentVersionId?: string;
      branchId?: string;
    }
  ): Promise<DocumentVersion> {
    try {
      // Get document's current versions
      const documentVersionIds = this.documentVersions.get(documentId) || [];
      const latestVersionNumber = documentVersionIds.length > 0 
        ? Math.max(...documentVersionIds.map(id => {
            const version = this.versions.get(id);
            return version?.versionNumber || 0;
          }))
        : 0;

      // Store content on IPFS
      const ipfsResult = await this.ipfsService.uploadFile(content, `v${latestVersionNumber + 1}_${documentId}`);
      if (!ipfsResult.success) {
        throw new Error('Failed to store version content on IPFS');
      }

      // Create new version
      const versionId = this.generateId();
      const version: DocumentVersion = {
        id: versionId,
        documentId,
        versionNumber: latestVersionNumber + 1,
        status: VersionStatus.DRAFT,
        hash: this.calculateHash(content),
        size: content.length,
        contentType: metadata.contentType,
        createdAt: new Date(),
        createdBy: metadata.createdBy,
        changes: metadata.changes,
        tags: metadata.tags || [],
        metadata: metadata.customMetadata || {},
        ipfsHash: ipfsResult.hash,
        parentVersionId: metadata.parentVersionId,
        childVersionIds: [],
        isLatest: true
      };

      // Update parent version if exists
      if (metadata.parentVersionId) {
        const parentVersion = this.versions.get(metadata.parentVersionId);
        if (parentVersion) {
          parentVersion.childVersionIds.push(versionId);
          parentVersion.isLatest = false;
        }
      }

      // Store version
      this.versions.set(versionId, version);
      documentVersionIds.push(versionId);
      this.documentVersions.set(documentId, documentVersionIds);

      // Update branch if specified
      if (metadata.branchId) {
        const branch = this.branches.get(metadata.branchId);
        if (branch) {
          branch.headVersionId = versionId;
          branch.versions.push(versionId);
        }
      }

      this.emit('versionCreated', version);
      return version;
    } catch (error) {
      throw new Error(`Failed to create version: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getVersion(versionId: string): Promise<DocumentVersion | null> {
    return this.versions.get(versionId) || null;
  }

  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    const versionIds = this.documentVersions.get(documentId) || [];
    return versionIds
      .map(id => this.versions.get(id))
      .filter((v): v is DocumentVersion => v !== undefined)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async getLatestVersion(documentId: string): Promise<DocumentVersion | null> {
    const versions = await this.getDocumentVersions(documentId);
    return versions.find(v => v.isLatest) || null;
  }

  async updateVersionStatus(
    versionId: string,
    status: VersionStatus,
    updatedBy: string
  ): Promise<boolean> {
    const version = this.versions.get(versionId);
    if (!version) return false;

    const oldStatus = version.status;
    version.status = status;

    // If setting to active, deactivate other active versions
    if (status === VersionStatus.ACTIVE) {
      const documentVersions = await this.getDocumentVersions(version.documentId);
      for (const otherVersion of documentVersions) {
        if (otherVersion.id !== versionId && otherVersion.status === VersionStatus.ACTIVE) {
          otherVersion.status = VersionStatus.DEPRECATED;
        }
      }
    }

    this.emit('versionStatusUpdated', {
      versionId,
      oldStatus,
      newStatus: status,
      updatedBy
    });

    return true;
  }

  async deleteVersion(versionId: string, deletedBy: string): Promise<boolean> {
    const version = this.versions.get(versionId);
    if (!version) return false;

    // Don't allow deletion of active versions
    if (version.status === VersionStatus.ACTIVE) {
      throw new Error('Cannot delete active version');
    }

    // Remove from IPFS
    try {
      await this.ipfsService.unpinFile(version.ipfsHash);
    } catch (error) {
      // Continue even if unpin fails
    }

    // Update parent and child relationships
    if (version.parentVersionId) {
      const parentVersion = this.versions.get(version.parentVersionId);
      if (parentVersion) {
        parentVersion.childVersionIds = parentVersion.childVersionIds.filter(id => id !== versionId);
      }
    }

    for (const childId of version.childVersionIds) {
      const childVersion = this.versions.get(childId);
      if (childVersion) {
        childVersion.parentVersionId = undefined;
      }
    }

    // Remove from document versions
    const documentVersionIds = this.documentVersions.get(version.documentId) || [];
    const updatedVersionIds = documentVersionIds.filter(id => id !== versionId);
    this.documentVersions.set(version.documentId, updatedVersionIds);

    // Remove from branches
    for (const branch of this.branches.values()) {
      if (branch.documentId === version.documentId) {
        branch.versions = branch.versions.filter(id => id !== versionId);
        if (branch.headVersionId === versionId) {
          // Set head to latest version in branch
          const branchVersions = branch.versions
            .map(id => this.versions.get(id))
            .filter((v): v is DocumentVersion => v !== undefined)
            .sort((a, b) => b.versionNumber - a.versionNumber);
          branch.headVersionId = branchVersions[0]?.id || '';
        }
      }
    }

    // Remove version
    this.versions.delete(versionId);

    this.emit('versionDeleted', { versionId, deletedBy });
    return true;
  }

  // Version Comparison
  async compareVersions(
    versionId1: string,
    versionId2: string,
    comparisonType: ComparisonType = ComparisonType.FULL
  ): Promise<VersionDiff> {
    const version1 = this.versions.get(versionId1);
    const version2 = this.versions.get(versionId2);

    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }

    // Download content from IPFS
    const content1Result = await this.ipfsService.downloadFile(version1.ipfsHash);
    const content2Result = await this.ipfsService.downloadFile(version2.ipfsHash);

    if (!content1Result.success || !content2Result.success) {
      throw new Error('Failed to download version content');
    }

    const content1 = content1Result.data.toString();
    const content2 = content2Result.data.toString();

    // Perform comparison
    const diff: VersionDiff = {
      versionId1,
      versionId2,
      comparisonType,
      contentChanges: this.compareContent(content1, content2),
      metadataChanges: this.compareMetadata(version1.metadata, version2.metadata),
      summary: {
        totalChanges: 0,
        additions: 0,
        deletions: 0,
        modifications: 0
      },
      comparedAt: new Date()
    };

    // Calculate summary
    diff.summary.additions = diff.contentChanges.added.length + 
      Object.keys(diff.metadataChanges.added).length;
    diff.summary.deletions = diff.contentChanges.removed.length + 
      diff.metadataChanges.removed.length;
    diff.summary.modifications = diff.contentChanges.modified.length + 
      diff.metadataChanges.modified.length;
    diff.summary.totalChanges = diff.summary.additions + diff.summary.deletions + diff.summary.modifications;

    this.emit('versionsCompared', diff);
    return diff;
  }

  private compareContent(content1: string, content2: string) {
    // Simple line-by-line comparison (placeholder for more sophisticated diff algorithm)
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');

    const added: string[] = [];
    const removed: string[] = [];
    const modified: { old: string; new: string }[] = [];

    // This is a very basic implementation
    // In a real implementation, you'd use a proper diff algorithm
    for (let i = 0; i < Math.max(lines1.length, lines2.length); i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';

      if (line1 && !line2) {
        removed.push(line1);
      } else if (!line1 && line2) {
        added.push(line2);
      } else if (line1 !== line2) {
        modified.push({ old: line1, new: line2 });
      }
    }

    return { added, removed, modified };
  }

  private compareMetadata(metadata1: Record<string, any>, metadata2: Record<string, any>) {
    const added: Record<string, any> = {};
    const removed: string[] = [];
    const modified: { old: any; new: any; key: string }[] = [];

    const allKeys = new Set([...Object.keys(metadata1), ...Object.keys(metadata2)]);

    for (const key of allKeys) {
      const value1 = metadata1[key];
      const value2 = metadata2[key];

      if (value1 === undefined && value2 !== undefined) {
        added[key] = value2;
      } else if (value1 !== undefined && value2 === undefined) {
        removed.push(key);
      } else if (value1 !== value2) {
        modified.push({ old: value1, new: value2, key });
      }
    }

    return { added, removed, modified };
  }

  // Branch Management
  async createBranch(
    documentId: string,
    name: string,
    headVersionId: string,
    createdBy: string,
    description?: string
  ): Promise<VersionBranch> {
    const version = this.versions.get(headVersionId);
    if (!version || version.documentId !== documentId) {
      throw new Error('Invalid head version for branch');
    }

    const branchId = this.generateId();
    const branch: VersionBranch = {
      id: branchId,
      name,
      documentId,
      headVersionId,
      versions: [headVersionId],
      createdAt: new Date(),
      createdBy,
      description,
      isActive: true
    };

    this.branches.set(branchId, branch);
    this.emit('branchCreated', branch);
    return branch;
  }

  async getBranch(branchId: string): Promise<VersionBranch | null> {
    return this.branches.get(branchId) || null;
  }

  async getDocumentBranches(documentId: string): Promise<VersionBranch[]> {
    return Array.from(this.branches.values())
      .filter(branch => branch.documentId === documentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteBranch(branchId: string): Promise<boolean> {
    const branch = this.branches.get(branchId);
    if (!branch) return false;

    // Don't allow deletion of active branches with versions
    if (branch.isActive && branch.versions.length > 1) {
      throw new Error('Cannot delete active branch with multiple versions');
    }

    this.branches.delete(branchId);
    this.emit('branchDeleted', { branchId });
    return true;
  }

  // Merge Management
  async createMerge(
    sourceBranchId: string,
    targetBranchId: string,
    createdBy: string
  ): Promise<VersionMerge> {
    const sourceBranch = this.branches.get(sourceBranchId);
    const targetBranch = this.branches.get(targetBranchId);

    if (!sourceBranch || !targetBranch) {
      throw new Error('Invalid branch IDs');
    }

    if (sourceBranch.documentId !== targetBranch.documentId) {
      throw new Error('Cannot merge branches from different documents');
    }

    const mergeId = this.generateId();
    const merge: VersionMerge = {
      id: mergeId,
      sourceBranchId,
      targetBranchId,
      sourceVersionId: sourceBranch.headVersionId,
      targetVersionId: targetBranch.headVersionId,
      status: 'pending',
      conflicts: [],
      createdAt: new Date(),
      createdBy
    };

    // Detect conflicts
    merge.conflicts = await this.detectConflicts(sourceBranch.headVersionId, targetBranch.headVersionId);

    this.merges.set(mergeId, merge);
    this.emit('mergeCreated', merge);
    return merge;
  }

  async executeMerge(
    mergeId: string,
    conflictResolutions?: { path: string; resolution: 'source' | 'target' }[]
  ): Promise<DocumentVersion> {
    const merge = this.merges.get(mergeId);
    if (!merge) {
      throw new Error('Merge not found');
    }

    if (merge.status !== 'pending') {
      throw new Error('Merge is not in pending status');
    }

    merge.status = 'in_progress';

    try {
      // Apply conflict resolutions
      if (conflictResolutions) {
        for (const resolution of conflictResolutions) {
          const conflict = merge.conflicts.find(c => c.path === resolution.path);
          if (conflict) {
            conflict.resolution = resolution.resolution;
          }
        }
      }

      // Get source and target versions
      const sourceVersion = this.versions.get(merge.sourceVersionId);
      const targetVersion = this.versions.get(merge.targetVersionId);

      if (!sourceVersion || !targetVersion) {
        throw new Error('Source or target version not found');
      }

      // Download content
      const sourceContentResult = await this.ipfsService.downloadFile(sourceVersion.ipfsHash);
      const targetContentResult = await this.ipfsService.downloadFile(targetVersion.ipfsHash);

      if (!sourceContentResult.success || !targetContentResult.success) {
        throw new Error('Failed to download version content');
      }

      // Merge content (placeholder implementation)
      const mergedContent = await this.mergeContent(
        sourceContentResult.data,
        targetContentResult.data,
        merge.conflicts
      );

      // Create merged version
      const mergedVersion = await this.createVersion(
        sourceVersion.documentId,
        mergedContent,
        {
          contentType: sourceVersion.contentType,
          changes: `Merge from branch ${merge.sourceBranchId} to ${merge.targetBranchId}`,
          createdBy: merge.createdBy,
          parentVersionId: targetVersion.id,
          customMetadata: {
            ...targetVersion.metadata,
            ...sourceVersion.metadata,
            mergeId: merge.id
          }
        }
      );

      // Update merge
      merge.mergedVersionId = mergedVersion.id;
      merge.status = 'completed';
      merge.completedAt = new Date();

      // Update branches
      const targetBranch = this.branches.get(merge.targetBranchId);
      if (targetBranch) {
        targetBranch.headVersionId = mergedVersion.id;
        targetBranch.versions.push(mergedVersion.id);
      }

      const sourceBranch = this.branches.get(merge.sourceBranchId);
      if (sourceBranch) {
        sourceBranch.mergedInto = merge.targetBranchId;
        sourceBranch.isActive = false;
      }

      this.emit('mergeCompleted', merge);
      return mergedVersion;
    } catch (error) {
      merge.status = 'failed';
      merge.completedAt = new Date();
      this.emit('mergeFailed', { mergeId, error });
      throw error;
    }
  }

  private async detectConflicts(
    sourceVersionId: string,
    targetVersionId: string
  ): Promise<VersionMerge['conflicts']> {
    // Compare versions to detect conflicts
    const diff = await this.compareVersions(sourceVersionId, targetVersionId);
    
    const conflicts: VersionMerge['conflicts'] = [];

    // Content conflicts
    for (const change of diff.contentChanges.modified) {
      conflicts.push({
        path: 'content',
        type: 'content',
        description: `Content modified: ${change.old.substring(0, 50)}...`
      });
    }

    // Metadata conflicts
    for (const change of diff.metadataChanges.modified) {
      conflicts.push({
        path: `metadata.${change.key}`,
        type: 'metadata',
        description: `Metadata ${change.key} changed`
      });
    }

    return conflicts;
  }

  private async mergeContent(
    sourceContent: Buffer,
    targetContent: Buffer,
    conflicts: VersionMerge['conflicts']
  ): Promise<Buffer> {
    // This is a placeholder for content merging
    // In a real implementation, you'd use sophisticated merge algorithms
    // For now, just return the target content (target wins by default)
    
    // Apply conflict resolutions
    let mergedContent = targetContent.toString();
    
    for (const conflict of conflicts) {
      if (conflict.resolution === 'source' && conflict.type === 'content') {
        // Use source content for this conflict
        mergedContent = sourceContent.toString();
      }
    }

    return Buffer.from(mergedContent);
  }

  // History and Statistics
  async getDocumentHistory(documentId: string): Promise<VersionHistory> {
    const versions = await this.getDocumentVersions(documentId);
    const branches = await this.getDocumentBranches(documentId);
    
    const merges = Array.from(this.merges.values()).filter(merge => {
      const sourceBranch = this.branches.get(merge.sourceBranchId);
      const targetBranch = this.branches.get(merge.targetBranchId);
      return sourceBranch?.documentId === documentId || targetBranch?.documentId === documentId;
    });

    return {
      documentId,
      versions,
      branches,
      merges,
      totalVersions: versions.length,
      totalBranches: branches.length,
      totalMerges: merges.length
    };
  }

  async getStats(): Promise<VersionStats> {
    const allVersions = Array.from(this.versions.values());
    const recentActivity: VersionStats['recentActivity'] = [];

    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const version of allVersions) {
      if (version.createdAt >= sevenDaysAgo) {
        recentActivity.push({
          date: version.createdAt,
          action: VersionAction.CREATE,
          versionId: version.id,
          userId: version.createdBy
        });
      }
    }

    const versionsByStatus: Record<VersionStatus, number> = {
      [VersionStatus.DRAFT]: 0,
      [VersionStatus.ACTIVE]: 0,
      [VersionStatus.ARCHIVED]: 0,
      [VersionStatus.DEPRECATED]: 0
    };

    const versionsByUser: Record<string, number> = {};

    for (const version of allVersions) {
      versionsByStatus[version.status]++;
      versionsByUser[version.createdBy] = (versionsByUser[version.createdBy] || 0) + 1;
    }

    return {
      totalVersions: allVersions.length,
      activeVersions: versionsByStatus[VersionStatus.ACTIVE],
      archivedVersions: versionsByStatus[VersionStatus.ARCHIVED],
      deprecatedVersions: versionsByStatus[VersionStatus.DEPRECATED],
      averageVersionsPerDocument: this.documentVersions.size > 0 
        ? allVersions.length / this.documentVersions.size 
        : 0,
      totalSize: allVersions.reduce((sum, v) => sum + v.size, 0),
      averageVersionSize: allVersions.length > 0 
        ? allVersions.reduce((sum, v) => sum + v.size, 0) / allVersions.length 
        : 0,
      versionsByStatus,
      versionsByUser,
      recentActivity: recentActivity.sort((a, b) => b.date.getTime() - a.date.getTime())
    };
  }

  // Utility Methods
  private calculateHash(content: Buffer): string {
    // Simple hash calculation (placeholder for proper hash function)
    return content.toString('base64').substring(0, 32);
  }

  private generateId(): string {
    return `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    const activeVersionsRatio = stats.activeVersions / (stats.totalVersions || 1);

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (stats.totalVersions === 0) {
      status = 'degraded';
    } else if (activeVersionsRatio < 0.1) {
      status = 'unhealthy';
    }

    return {
      status,
      details: {
        totalVersions: stats.totalVersions,
        activeVersions: stats.activeVersions,
        totalBranches: this.branches.size,
        pendingMerges: Array.from(this.merges.values()).filter(m => m.status === 'pending').length,
        documentsTracked: this.documentVersions.size
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    const versions = Array.from(this.versions.values());
    
    if (format === 'json') {
      return JSON.stringify({
        versions,
        branches: Array.from(this.branches.values()),
        merges: Array.from(this.merges.values())
      }, null, 2);
    } else {
      // CSV export for versions
      const headers = [
        'ID', 'Document ID', 'Version Number', 'Status', 'Hash', 'Size',
        'Content Type', 'Created By', 'Created At', 'Changes', 'Tags'
      ];
      
      const rows = versions.map(v => [
        v.id,
        v.documentId,
        v.versionNumber,
        v.status,
        v.hash,
        v.size,
        v.contentType,
        v.createdBy,
        v.createdAt.toISOString(),
        v.changes,
        v.tags.join(';')
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
