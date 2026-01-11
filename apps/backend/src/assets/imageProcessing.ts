import { EventEmitter } from 'events';
import { IPFSIntegrationService } from './ipfsIntegration';

// Enums
export enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
  GIF = 'gif',
  AVIF = 'avif',
  TIFF = 'tiff',
  BMP = 'bmp'
}

export enum ImageQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra'
}

export enum ResizeMode {
  CONTAIN = 'contain',
  COVER = 'cover',
  FILL = 'fill',
  INSIDE = 'inside',
  OUTSIDE = 'outside'
}

export enum FilterType {
  NONE = 'none',
  GRAYSCALE = 'grayscale',
  SEPIA = 'sepia',
  BLUR = 'blur',
  SHARPEN = 'sharpen',
  BRIGHTNESS = 'brightness',
  CONTRAST = 'contrast',
  SATURATION = 'saturation'
}

// Interfaces
export interface ImageMetadata {
  width: number;
  height: number;
  format: ImageFormat;
  size: number;
  colorSpace: string;
  hasAlpha: boolean;
  orientation: number;
  density?: number;
  profile?: string;
}

export interface ProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
  resizeMode?: ResizeMode;
  filter?: FilterType;
  filterIntensity?: number;
  progressive?: boolean;
  optimize?: boolean;
  stripMetadata?: boolean;
}

export interface SizeVariant {
  name: string;
  width: number;
  height: number;
  quality: number;
  format: ImageFormat;
  url: string;
  size: number;
  hash: string;
}

export interface ImageInfo {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  metadata: ImageMetadata;
  url: string;
  hash: string;
  variants: SizeVariant[];
  thumbnail?: SizeVariant;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  altText?: string;
  description?: string;
}

export interface UploadResult {
  image: ImageInfo;
  success: boolean;
  error?: string;
}

export interface ProcessingJob {
  id: string;
  imageId: string;
  options: ProcessingOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: SizeVariant;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface CDNConfig {
  provider: 'cloudflare' | 'cloudinary' | 'aws' | 'custom';
  domain: string;
  apiKey?: string;
  apiSecret?: string;
  region?: string;
  bucket?: string;
  customSettings?: Record<string, any>;
}

export interface ProcessingStats {
  totalImages: number;
  totalSize: number;
  averageSize: number;
  formatDistribution: Record<ImageFormat, number>;
  processingJobs: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  storageUsage: {
    original: number;
    variants: number;
    thumbnails: number;
  };
}

// Main Image Processing Service
export class ImageProcessingService extends EventEmitter {
  private ipfsService: IPFSIntegrationService;
  private images: Map<string, ImageInfo> = new Map();
  private processingJobs: Map<string, ProcessingJob> = new Map();
  private cdnConfig?: CDNConfig;
  private processingQueue: ProcessingJob[] = [];
  private isProcessing = false;
  private maxConcurrentJobs = 3;
  private currentJobs = 0;

  constructor(ipfsService: IPFSIntegrationService) {
    super();
    this.ipfsService = ipfsService;
    this.startProcessing();
  }

  // Image Upload and Storage
  async uploadImage(
    imageData: Buffer,
    originalName: string,
    mimeType: string,
    options: {
      generateVariants?: boolean;
      generateThumbnail?: boolean;
      tags?: string[];
      altText?: string;
      description?: string;
    } = {}
  ): Promise<UploadResult> {
    try {
      // Validate image
      const validation = this.validateImage(imageData, mimeType);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Extract metadata
      const metadata = await this.extractMetadata(imageData, mimeType);

      // Store original image on IPFS
      const ipfsResult = await this.ipfsService.uploadFile(imageData, originalName);
      if (!ipfsResult.success) {
        return {
          success: false,
          error: 'Failed to store image on IPFS'
        };
      }

      // Create image info
      const imageId = this.generateId();
      const image: ImageInfo = {
        id: imageId,
        originalName,
        mimeType,
        size: imageData.length,
        metadata,
        url: ipfsResult.url,
        hash: ipfsResult.hash,
        variants: [],
        tags: options.tags || [],
        altText: options.altText,
        description: options.description,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store image
      this.images.set(imageId, image);

      // Generate variants if requested
      if (options.generateVariants) {
        await this.generateDefaultVariants(imageId);
      }

      // Generate thumbnail if requested
      if (options.generateThumbnail) {
        await this.generateThumbnail(imageId);
      }

      this.emit('imageUploaded', image);

      return {
        success: true,
        image
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getImage(imageId: string): Promise<ImageInfo | null> {
    return this.images.get(imageId) || null;
  }

  async updateImage(
    imageId: string,
    updates: {
      tags?: string[];
      altText?: string;
      description?: string;
    }
  ): Promise<boolean> {
    const image = this.images.get(imageId);
    if (!image) return false;

    if (updates.tags) image.tags = updates.tags;
    if (updates.altText !== undefined) image.altText = updates.altText;
    if (updates.description !== undefined) image.description = updates.description;

    image.updatedAt = new Date();
    this.emit('imageUpdated', image);
    return true;
  }

  async deleteImage(imageId: string): Promise<boolean> {
    const image = this.images.get(imageId);
    if (!image) return false;

    // Remove from IPFS
    try {
      await this.ipfsService.unpinFile(image.hash);
    } catch (error) {
      // Continue even if unpin fails
    }

    // Remove variants from IPFS
    for (const variant of image.variants) {
      try {
        await this.ipfsService.unpinFile(variant.hash);
      } catch (error) {
        // Continue even if unpin fails
      }
    }

    // Remove thumbnail from IPFS
    if (image.thumbnail) {
      try {
        await this.ipfsService.unpinFile(image.thumbnail.hash);
      } catch (error) {
        // Continue even if unpin fails
      }
    }

    // Remove from storage
    this.images.delete(imageId);
    this.emit('imageDeleted', { imageId });
    return true;
  }

  // Image Optimization
  async optimizeImage(
    imageId: string,
    options: ProcessingOptions
  ): Promise<ProcessingJob> {
    const image = this.images.get(imageId);
    if (!image) {
      throw new Error('Image not found');
    }

    const jobId = this.generateId();
    const job: ProcessingJob = {
      id: jobId,
      imageId,
      options,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    this.processingJobs.set(jobId, job);
    this.processingQueue.push(job);
    this.emit('jobCreated', job);

    return job;
  }

  private async processImage(job: ProcessingJob): Promise<void> {
    try {
      job.status = 'processing';
      job.startedAt = new Date();
      job.progress = 10;
      this.emit('jobStarted', job);

      const image = this.images.get(job.imageId);
      if (!image) {
        throw new Error('Image not found');
      }

      // Download original image from IPFS
      const originalData = await this.ipfsService.downloadFile(image.hash);
      if (!originalData.success) {
        throw new Error('Failed to download original image');
      }

      job.progress = 30;

      // Process image (placeholder for actual image processing)
      const processedData = await this.performImageProcessing(
        originalData.data,
        job.options,
        (progress) => {
          job.progress = 30 + (progress * 0.6); // 30-90%
        }
      );

      job.progress = 90;

      // Store processed image on IPFS
      const variantName = `${image.originalName}_${job.options.width || 'auto'}x${job.options.height || 'auto'}`;
      const ipfsResult = await this.ipfsService.uploadFile(
        processedData,
        variantName
      );

      if (!ipfsResult.success) {
        throw new Error('Failed to store processed image');
      }

      // Create variant
      const variant: SizeVariant = {
        name: variantName,
        width: job.options.width || image.metadata.width,
        height: job.options.height || image.metadata.height,
        quality: job.options.quality || 80,
        format: job.options.format || image.metadata.format,
        url: ipfsResult.url,
        size: processedData.length,
        hash: ipfsResult.hash
      };

      job.result = variant;
      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 100;

      // Add variant to image
      image.variants.push(variant);
      image.updatedAt = new Date();

      this.emit('jobCompleted', job);
      this.emit('variantCreated', { imageId: job.imageId, variant });
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      this.emit('jobFailed', job);
    }
  }

  private async performImageProcessing(
    imageData: Buffer,
    options: ProcessingOptions,
    onProgress?: (progress: number) => void
  ): Promise<Buffer> {
    // This is a placeholder for actual image processing
    // In a real implementation, you would use libraries like sharp, jimp, or canvas
    
    onProgress?.(0.1);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    onProgress?.(0.5);
    
    // For now, just return the original data
    // In a real implementation, this would:
    // - Resize the image
    // - Change format
    // - Apply filters
    // - Optimize compression
    // - Strip metadata if requested
    
    onProgress?.(1.0);
    
    return imageData;
  }

  // Thumbnail Generation
  async generateThumbnail(
    imageId: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
    } = {}
  ): Promise<SizeVariant | null> {
    const image = this.images.get(imageId);
    if (!image) return null;

    const thumbnailOptions: ProcessingOptions = {
      width: options.width || 150,
      height: options.height || 150,
      quality: options.quality || 70,
      resizeMode: ResizeMode.CONTAIN,
      format: ImageFormat.WEBP,
      optimize: true
    };

    const job = await this.optimizeImage(imageId, thumbnailOptions);
    
    // Wait for job completion
    return new Promise((resolve) => {
      const checkJob = () => {
        const currentJob = this.processingJobs.get(job.id);
        if (!currentJob) {
          resolve(null);
          return;
        }

        if (currentJob.status === 'completed' && currentJob.result) {
          image.thumbnail = currentJob.result;
          image.updatedAt = new Date();
          this.emit('thumbnailGenerated', { imageId, thumbnail: currentJob.result });
          resolve(currentJob.result);
        } else if (currentJob.status === 'failed') {
          resolve(null);
        } else {
          setTimeout(checkJob, 100);
        }
      };
      checkJob();
    });
  }

  // Multiple Size Variants
  async generateDefaultVariants(imageId: string): Promise<SizeVariant[]> {
    const image = this.images.get(imageId);
    if (!image) return [];

    const defaultVariants = [
      { width: 320, height: 240, name: 'small' },
      { width: 640, height: 480, name: 'medium' },
      { width: 1024, height: 768, name: 'large' },
      { width: 1920, height: 1080, name: 'xlarge' }
    ];

    const variants: SizeVariant[] = [];

    for (const variantConfig of defaultVariants) {
      const options: ProcessingOptions = {
        width: variantConfig.width,
        height: variantConfig.height,
        quality: 80,
        resizeMode: ResizeMode.CONTAIN,
        format: image.metadata.format,
        optimize: true
      };

      const job = await this.optimizeImage(imageId, options);
      
      // Wait for job completion
      const variant = await new Promise<SizeVariant | null>((resolve) => {
        const checkJob = () => {
          const currentJob = this.processingJobs.get(job.id);
          if (!currentJob) {
            resolve(null);
            return;
          }

          if (currentJob.status === 'completed' && currentJob.result) {
            resolve(currentJob.result);
          } else if (currentJob.status === 'failed') {
            resolve(null);
          } else {
            setTimeout(checkJob, 100);
          }
        };
        checkJob();
      });

      if (variant) {
        variants.push(variant);
      }
    }

    return variants;
  }

  async createCustomVariant(
    imageId: string,
    name: string,
    options: ProcessingOptions
  ): Promise<SizeVariant | null> {
    const job = await this.optimizeImage(imageId, options);
    
    return new Promise((resolve) => {
      const checkJob = () => {
        const currentJob = this.processingJobs.get(job.id);
        if (!currentJob) {
          resolve(null);
          return;
        }

        if (currentJob.status === 'completed' && currentJob.result) {
          const variant = { ...currentJob.result, name };
          const image = this.images.get(imageId);
          if (image) {
            image.variants.push(variant);
            image.updatedAt = new Date();
          }
          resolve(variant);
        } else if (currentJob.status === 'failed') {
          resolve(null);
        } else {
          setTimeout(checkJob, 100);
        }
      };
      checkJob();
    });
  }

  // CDN Integration
  configureCDN(config: CDNConfig): void {
    this.cdnConfig = config;
    this.emit('cdnConfigured', config);
  }

  async syncToCDN(imageId: string): Promise<boolean> {
    if (!this.cdnConfig) {
      throw new Error('CDN not configured');
    }

    const image = this.images.get(imageId);
    if (!image) return false;

    try {
      // This is a placeholder for CDN sync logic
      // In a real implementation, you would:
      // - Upload original image to CDN
      // - Upload all variants to CDN
      // - Update URLs to point to CDN
      // - Handle CDN-specific features like caching, purging, etc.

      this.emit('cdnSynced', { imageId });
      return true;
    } catch (error) {
      this.emit('cdnSyncFailed', { imageId, error });
      return false;
    }
  }

  async purgeFromCDN(imageId: string): Promise<boolean> {
    if (!this.cdnConfig) {
      throw new Error('CDN not configured');
    }

    try {
      // Placeholder for CDN purge logic
      this.emit('cdnPurged', { imageId });
      return true;
    } catch (error) {
      this.emit('cdnPurgeFailed', { imageId, error });
      return false;
    }
  }

  // Image Metadata Extraction
  async extractMetadata(
    imageData: Buffer,
    mimeType: string
  ): Promise<ImageMetadata> {
    // This is a placeholder for metadata extraction
    // In a real implementation, you would use libraries like:
    // - sharp for basic image info
    // - exif-reader for EXIF data
    // - image-size for dimensions
    
    return {
      width: 1920, // Placeholder
      height: 1080, // Placeholder
      format: this.getFormatFromMimeType(mimeType),
      size: imageData.length,
      colorSpace: 'sRGB',
      hasAlpha: mimeType.includes('png'),
      orientation: 1,
      density: 72,
      profile: 'sRGB'
    };
  }

  async updateMetadata(imageId: string): Promise<ImageMetadata | null> {
    const image = this.images.get(imageId);
    if (!image) return null;

    // Download image from IPFS
    const imageData = await this.ipfsService.downloadFile(image.hash);
    if (!imageData.success) return null;

    // Extract new metadata
    const metadata = await this.extractMetadata(imageData.data, image.mimeType);
    
    // Update image metadata
    image.metadata = metadata;
    image.updatedAt = new Date();
    
    this.emit('metadataUpdated', { imageId, metadata });
    return metadata;
  }

  // Search and Filter
  async searchImages(query: {
    tags?: string[];
    format?: ImageFormat;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    minSize?: number;
    maxSize?: number;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<ImageInfo[]> {
    let results = Array.from(this.images.values());

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(image =>
        query.tags!.some(tag => image.tags.includes(tag))
      );
    }

    // Filter by format
    if (query.format) {
      results = results.filter(image =>
        image.metadata.format === query.format
      );
    }

    // Filter by dimensions
    if (query.minWidth) {
      results = results.filter(image =>
        image.metadata.width >= query.minWidth!
      );
    }
    if (query.maxWidth) {
      results = results.filter(image =>
        image.metadata.width <= query.maxWidth!
      );
    }
    if (query.minHeight) {
      results = results.filter(image =>
        image.metadata.height >= query.minHeight!
      );
    }
    if (query.maxHeight) {
      results = results.filter(image =>
        image.metadata.height <= query.maxHeight!
      );
    }

    // Filter by size
    if (query.minSize) {
      results = results.filter(image =>
        image.size >= query.minSize!
      );
    }
    if (query.maxSize) {
      results = results.filter(image =>
        image.size <= query.maxSize!
      );
    }

    // Filter by date
    if (query.dateFrom) {
      results = results.filter(image =>
        image.createdAt >= query.dateFrom!
      );
    }
    if (query.dateTo) {
      results = results.filter(image =>
        image.createdAt <= query.dateTo!
      );
    }

    // Sort by creation date (newest first)
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    return results.slice(offset, offset + limit);
  }

  // Job Management
  async getJob(jobId: string): Promise<ProcessingJob | null> {
    return this.processingJobs.get(jobId) || null;
  }

  async getJobs(imageId?: string): Promise<ProcessingJob[]> {
    let jobs = Array.from(this.processingJobs.values());
    
    if (imageId) {
      jobs = jobs.filter(job => job.imageId === imageId);
    }

    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.processingJobs.get(jobId);
    if (!job || job.status !== 'pending') return false;

    job.status = 'failed';
    job.error = 'Cancelled by user';
    job.completedAt = new Date();

    // Remove from queue
    const queueIndex = this.processingQueue.indexOf(job);
    if (queueIndex > -1) {
      this.processingQueue.splice(queueIndex, 1);
    }

    this.emit('jobCancelled', job);
    return true;
  }

  // Statistics
  async getStats(): Promise<ProcessingStats> {
    const images = Array.from(this.images.values());
    const jobs = Array.from(this.processingJobs.values());

    const formatDistribution: Record<ImageFormat, number> = {} as any;
    for (const image of images) {
      formatDistribution[image.metadata.format] = 
        (formatDistribution[image.metadata.format] || 0) + 1;
    }

    const storageUsage = {
      original: images.reduce((sum, img) => sum + img.size, 0),
      variants: images.reduce((sum, img) => 
        sum + img.variants.reduce((vSum, variant) => vSum + variant.size, 0), 0),
      thumbnails: images.reduce((sum, img) => 
        sum + (img.thumbnail?.size || 0), 0)
    };

    return {
      totalImages: images.length,
      totalSize: images.reduce((sum, img) => sum + img.size, 0),
      averageSize: images.length > 0 ? images.reduce((sum, img) => sum + img.size, 0) / images.length : 0,
      formatDistribution,
      processingJobs: {
        pending: jobs.filter(j => j.status === 'pending').length,
        processing: jobs.filter(j => j.status === 'processing').length,
        completed: jobs.filter(j => j.status === 'completed').length,
        failed: jobs.filter(j => j.status === 'failed').length
      },
      storageUsage
    };
  }

  // Processing Queue Management
  private startProcessing(): void {
    setInterval(() => {
      this.processQueue();
    }, 1000);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.currentJobs >= this.maxConcurrentJobs) {
      return;
    }

    this.isProcessing = true;

    while (
      this.processingQueue.length > 0 && 
      this.currentJobs < this.maxConcurrentJobs
    ) {
      const job = this.processingQueue.shift();
      if (!job) break;

      this.currentJobs++;
      this.processImage(job).finally(() => {
        this.currentJobs--;
      });
    }

    this.isProcessing = false;
  }

  // Utility Methods
  private validateImage(imageData: Buffer, mimeType: string): {
    valid: boolean;
    error?: string;
  } {
    // Check file size (max 50MB)
    if (imageData.length > 50 * 1024 * 1024) {
      return {
        valid: false,
        error: 'Image size exceeds 50MB limit'
      };
    }

    // Check MIME type
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
      'image/tiff',
      'image/bmp'
    ];

    if (!validTypes.includes(mimeType)) {
      return {
        valid: false,
        error: 'Unsupported image format'
      };
    }

    // Basic image signature validation
    const signatures: Record<string, number[]> = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/webp': [0x52, 0x49, 0x46, 0x46],
      'image/gif': [0x47, 0x49, 0x46, 0x38],
      'image/avif': [0x00, 0x00, 0x00, 0x20],
      'image/tiff': [0x49, 0x49, 0x2A, 0x00],
      'image/bmp': [0x42, 0x4D]
    };

    const expectedSignature = signatures[mimeType];
    if (expectedSignature) {
      const actualSignature = Array.from(imageData.slice(0, expectedSignature.length));
      if (!expectedSignature.every((byte, index) => actualSignature[index] === byte)) {
        return {
          valid: false,
          error: 'Invalid image format'
        };
      }
    }

    return { valid: true };
  }

  private getFormatFromMimeType(mimeType: string): ImageFormat {
    const formatMap: Record<string, ImageFormat> = {
      'image/jpeg': ImageFormat.JPEG,
      'image/png': ImageFormat.PNG,
      'image/webp': ImageFormat.WEBP,
      'image/gif': ImageFormat.GIF,
      'image/avif': ImageFormat.AVIF,
      'image/tiff': ImageFormat.TIFF,
      'image/bmp': ImageFormat.BMP
    };

    return formatMap[mimeType] || ImageFormat.JPEG;
  }

  private generateId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Lifecycle Management
  async start(): Promise<void> {
    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    // Cancel all pending jobs
    for (const job of this.processingQueue) {
      await this.cancelJob(job.id);
    }

    this.emit('serviceStopped');
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const stats = await this.getStats();
    const failedJobsRatio = stats.processingJobs.failed / 
      (stats.processingJobs.completed + stats.processingJobs.failed || 1);

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (failedJobsRatio > 0.5) {
      status = 'unhealthy';
    } else if (failedJobsRatio > 0.2) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalImages: stats.totalImages,
        processingJobs: stats.processingJobs,
        queueLength: this.processingQueue.length,
        currentJobs: this.currentJobs,
        maxConcurrentJobs: this.maxConcurrentJobs,
        cdnConfigured: !!this.cdnConfig
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    const images = Array.from(this.images.values());
    
    if (format === 'json') {
      return JSON.stringify(images, null, 2);
    } else {
      // CSV export
      const headers = [
        'ID', 'Original Name', 'MIME Type', 'Size', 'Width', 'Height',
        'Format', 'URL', 'Hash', 'Tags', 'Created At'
      ];
      
      const rows = images.map(img => [
        img.id,
        img.originalName,
        img.mimeType,
        img.size,
        img.metadata.width,
        img.metadata.height,
        img.metadata.format,
        img.url,
        img.hash,
        img.tags.join(';'),
        img.createdAt.toISOString()
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
