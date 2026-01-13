'use client';

import { createPublicClient, http, fallback, type PublicClient, type Transport } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// ============ TYPES ============

export interface BaseApiConfig {
  chainId: number;
  rpcUrls: string[];
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  batchSize?: number;
  rateLimitPerSecond?: number;
}

export interface RateLimiter {
  tokens: number;
  lastRefill: number;
  maxTokens: number;
  refillRate: number;
}

export interface ApiCallOptions {
  skipCache?: boolean;
  priority?: 'high' | 'normal' | 'low';
  timeout?: number;
}

export interface ApiMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  avgResponseTime: number;
  rateLimitHits: number;
  cacheHits: number;
  cacheMisses: number;
}

// ============ BASE API CLASS ============

export class BaseAPI {
  private config: Required<BaseApiConfig>;
  private publicClient: PublicClient;
  private rateLimiter: RateLimiter;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  private metrics: ApiMetrics;
  private callQueue: Array<() => Promise<any>>;
  private isProcessingQueue: boolean;

  constructor(config: BaseApiConfig) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      batchSize: 100,
      rateLimitPerSecond: 10,
      ...config,
    };

    // Initialize rate limiter
    this.rateLimiter = {
      tokens: this.config.rateLimitPerSecond,
      lastRefill: Date.now(),
      maxTokens: this.config.rateLimitPerSecond,
      refillRate: 1000 / this.config.rateLimitPerSecond, // ms per token
    };

    // Initialize cache and metrics
    this.cache = new Map();
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      avgResponseTime: 0,
      rateLimitHits: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    this.callQueue = [];
    this.isProcessingQueue = false;

    // Create transport with fallback
    const transports = config.rpcUrls.map((url) =>
      http(url, {
        timeout: this.config.timeout,
        retryCount: this.config.maxRetries,
        retryDelay: this.config.retryDelay,
      })
    );

    const transport = transports.length > 1 ? fallback(transports) : transports[0];

    // Create public client
    const chain = config.chainId === base.id ? base : baseSepolia;
    this.publicClient = createPublicClient({
      chain,
      transport,
    });
  }

  // ============ RATE LIMITING ============

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.rateLimiter.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.rateLimiter.refillRate);

    if (tokensToAdd > 0) {
      this.rateLimiter.tokens = Math.min(
        this.rateLimiter.maxTokens,
        this.rateLimiter.tokens + tokensToAdd
      );
      this.rateLimiter.lastRefill = now;
    }
  }

  private async acquireToken(): Promise<void> {
    this.refillTokens();

    if (this.rateLimiter.tokens > 0) {
      this.rateLimiter.tokens--;
      return;
    }

    // Wait for next token
    this.metrics.rateLimitHits++;
    const waitTime = this.rateLimiter.refillRate;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    return this.acquireToken();
  }

  // ============ CACHING ============

  private getCacheKey(method: string, params: any): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) {
      this.metrics.cacheMisses++;
      return null;
    }

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      this.metrics.cacheMisses++;
      return null;
    }

    this.metrics.cacheHits++;
    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Limit cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  // ============ QUEUE MANAGEMENT ============

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.callQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.callQueue.length > 0) {
      const call = this.callQueue.shift();
      if (call) {
        try {
          await this.acquireToken();
          await call();
        } catch (error) {
          console.error('[BaseAPI] Queue processing error:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private enqueue<T>(call: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.callQueue.push(async () => {
        try {
          const result = await call();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  // ============ API METHODS ============

  async call<T = any>(
    method: string,
    params: any = {},
    options: ApiCallOptions = {}
  ): Promise<T> {
    const cacheKey = this.getCacheKey(method, params);

    // Check cache
    if (!options.skipCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) {
        return cached as T;
      }
    }

    // Track metrics
    this.metrics.totalCalls++;
    const startTime = Date.now();

    try {
      // Acquire rate limit token
      await this.acquireToken();

      // Make the call through the queue
      let result: any;

      switch (method) {
        case 'getBlockNumber':
          result = await this.publicClient.getBlockNumber();
          break;
        case 'getBlock':
          result = await this.publicClient.getBlock(params);
          break;
        case 'getBalance':
          result = await this.publicClient.getBalance(params);
          break;
        case 'getTransaction':
          result = await this.publicClient.getTransaction(params);
          break;
        case 'getTransactionReceipt':
          result = await this.publicClient.getTransactionReceipt(params);
          break;
        case 'getGasPrice':
          result = await this.publicClient.getGasPrice();
          break;
        case 'estimateGas':
          result = await this.publicClient.estimateGas(params);
          break;
        case 'readContract':
          result = await this.publicClient.readContract(params);
          break;
        default:
          throw new Error(`Unknown method: ${method}`);
      }

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.metrics.successfulCalls++;
      this.metrics.avgResponseTime =
        (this.metrics.avgResponseTime * (this.metrics.successfulCalls - 1) + responseTime) /
        this.metrics.successfulCalls;

      // Cache the result
      if (!options.skipCache) {
        this.setCache(cacheKey, result);
      }

      return result as T;
    } catch (error) {
      this.metrics.failedCalls++;
      console.error(`[BaseAPI] ${method} error:`, error);
      throw error;
    }
  }

  // ============ BATCH OPERATIONS ============

  async batchCall<T = any>(calls: Array<{ method: string; params?: any }>): Promise<T[]> {
    const results: T[] = [];

    // Process in batches
    for (let i = 0; i < calls.length; i += this.config.batchSize) {
      const batch = calls.slice(i, i + this.config.batchSize);
      const batchResults = await Promise.all(
        batch.map((call) => this.call<T>(call.method, call.params))
      );
      results.push(...batchResults);
    }

    return results;
  }

  // ============ CONVENIENCE METHODS ============

  async getBlockNumber(): Promise<bigint> {
    return this.call('getBlockNumber');
  }

  async getBlock(params: any) {
    return this.call('getBlock', params);
  }

  async getBalance(params: any): Promise<bigint> {
    return this.call('getBalance', params);
  }

  async getTransaction(params: any) {
    return this.call('getTransaction', params);
  }

  async getTransactionReceipt(params: any) {
    return this.call('getTransactionReceipt', params);
  }

  async getGasPrice(): Promise<bigint> {
    return this.call('getGasPrice');
  }

  async estimateGas(params: any): Promise<bigint> {
    return this.call('estimateGas', params);
  }

  async readContract<T = any>(params: any): Promise<T> {
    return this.call<T>('readContract', params);
  }

  // ============ METRICS & MONITORING ============

  getMetrics(): ApiMetrics {
    return { ...this.metrics };
  }

  getHealthStatus(): {
    healthy: boolean;
    successRate: number;
    avgResponseTime: number;
    cacheHitRate: number;
  } {
    const successRate =
      this.metrics.totalCalls > 0
        ? this.metrics.successfulCalls / this.metrics.totalCalls
        : 0;

    const totalCacheAccess = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate =
      totalCacheAccess > 0 ? this.metrics.cacheHits / totalCacheAccess : 0;

    return {
      healthy: successRate > 0.95 && this.metrics.avgResponseTime < 5000,
      successRate,
      avgResponseTime: this.metrics.avgResponseTime,
      cacheHitRate,
    };
  }

  resetMetrics(): void {
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      avgResponseTime: 0,
      rateLimitHits: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  // ============ CONFIGURATION ============

  updateRateLimit(requestsPerSecond: number): void {
    this.rateLimiter.maxTokens = requestsPerSecond;
    this.rateLimiter.refillRate = 1000 / requestsPerSecond;
  }

  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  getConfig(): Required<BaseApiConfig> {
    return { ...this.config };
  }
}

// ============ DEFAULT CONFIGURATIONS ============

export const BASE_MAINNET_CONFIG: BaseApiConfig = {
  chainId: base.id,
  rpcUrls: [
    'https://mainnet.base.org',
    'https://base.publicnode.com',
    'https://base.gateway.tenderly.co',
  ],
  rateLimitPerSecond: 10,
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  batchSize: 100,
};

export const BASE_SEPOLIA_CONFIG: BaseApiConfig = {
  chainId: baseSepolia.id,
  rpcUrls: [
    'https://sepolia.base.org',
    'https://base-sepolia.publicnode.com',
  ],
  rateLimitPerSecond: 10,
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  batchSize: 100,
};

// ============ SINGLETON INSTANCE ============

let baseApiInstance: BaseAPI | null = null;

export function getBaseAPI(chainId: number = base.id): BaseAPI {
  if (!baseApiInstance || baseApiInstance.getConfig().chainId !== chainId) {
    const config = chainId === base.id ? BASE_MAINNET_CONFIG : BASE_SEPOLIA_CONFIG;
    baseApiInstance = new BaseAPI(config);
  }

  return baseApiInstance;
}

export default BaseAPI;
