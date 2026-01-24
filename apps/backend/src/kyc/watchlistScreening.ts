import { EventEmitter } from 'events';
import {
  WatchlistScreening,
  IWatchlistScreening,
  WatchlistType,
  ScreeningStatus,
  MatchLevel,
  WatchlistProvider
} from '../models/WatchlistScreening';

// Re-export enums
export { WatchlistType, ScreeningStatus, MatchLevel, WatchlistProvider };

export interface WatchlistEntity {
  id: string;
  type: WatchlistType;
  provider: WatchlistProvider;
  externalId: string;
  name: string;
  aliases: string[];
  dateOfBirth?: string;
  nationality?: string;
  address?: string;
  identificationNumbers?: Record<string, string>;
  additionalInfo?: Record<string, any>;
  lastUpdated: Date;
  isActive: boolean;
}

export interface ScreeningMatch {
  id: string;
  requestId: string;
  entityId: string;
  matchLevel: MatchLevel;
  confidenceScore: number;
  matchedFields: string[];
  differences: string[];
  explanation: string;
  requiresManualReview: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewDecision?: 'true_positive' | 'false_positive' | 'inconclusive';
  reviewNotes?: string;
}

export interface WatchlistConfig {
  provider: WatchlistProvider;
  apiKey: string;
  apiUrl: string;
  enabled: boolean;
  priority: number;
  rateLimitPerMinute: number;
  timeoutMs: number;
  retryAttempts: number;
  customSettings?: Record<string, any>;
}

export interface ScreeningRule {
  id: string;
  name: string;
  description: string;
  watchlistTypes: WatchlistType[];
  conditions: ScreeningCondition[];
  actions: ScreeningAction[];
  isActive: boolean;
  priority: number;
}

export interface ScreeningCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex';
  value: string;
  caseSensitive: boolean;
}

export interface ScreeningAction {
  type: 'flag' | 'block' | 'require_review' | 'notify' | 'log';
  parameters?: Record<string, any>;
}

export interface WatchlistAnalytics {
  totalScreenings: number;
  screeningsByStatus: Record<ScreeningStatus, number>;
  screeningsByType: Record<WatchlistType, number>;
  averageProcessingTime: number;
  matchRate: number;
  falsePositiveRate: number;
  topMatchedEntities: Array<{
    entityId: string;
    name: string;
    matchCount: number;
  }>;
  providerPerformance: Array<{
    provider: WatchlistProvider;
    screenings: number;
    averageTime: number;
    successRate: number;
  }>;
  dailyStats: Array<{
    date: string;
    screenings: number;
    matches: number;
    manualReviews: number;
    // approvals: 0, rejections: 0 - omitted to match previous interface partial
  }>;
}

export class WatchlistScreeningService extends EventEmitter {
  private watchlists: Map<string, WatchlistEntity> = new Map();
  // Request and Results are now in Mongo
  private rules: Map<string, ScreeningRule> = new Map();
  private configs: Map<WatchlistProvider, WatchlistConfig> = new Map();
  private analytics: WatchlistAnalytics;

  constructor() {
    super();
    this.analytics = this.initializeAnalytics();
    this.initializeDefaultConfigs();
    this.initializeDefaultRules();
    this.loadSampleWatchlists();
  }

  private initializeAnalytics(): WatchlistAnalytics {
    return {
      totalScreenings: 0,
      screeningsByStatus: {
        [ScreeningStatus.PENDING]: 0,
        [ScreeningStatus.IN_PROGRESS]: 0,
        [ScreeningStatus.COMPLETED]: 0,
        [ScreeningStatus.FAILED]: 0,
        [ScreeningStatus.MANUAL_REVIEW]: 0
      },
      screeningsByType: {
        [WatchlistType.SANCTIONS]: 0,
        [WatchlistType.PEP]: 0,
        [WatchlistType.ADVERSE_MEDIA]: 0,
        [WatchlistType.BLOCKLIST]: 0,
        [WatchlistType.CUSTOM]: 0
      },
      averageProcessingTime: 0,
      matchRate: 0,
      falsePositiveRate: 0,
      topMatchedEntities: [],
      providerPerformance: [],
      dailyStats: []
    };
  }

  private initializeDefaultConfigs(): void {
    const defaultConfigs: WatchlistConfig[] = [
      {
        provider: WatchlistProvider.OFAC,
        apiKey: process.env.OFAC_API_KEY || '',
        apiUrl: 'https://api.ofac.gov',
        enabled: true,
        priority: 1,
        rateLimitPerMinute: 100,
        timeoutMs: 30000,
        retryAttempts: 3
      },
      {
        provider: WatchlistProvider.COMPLY_ADVANTAGE,
        apiKey: process.env.COMPLY_ADVANTAGE_API_KEY || '',
        apiUrl: 'https://api.complyadvantage.com',
        enabled: true,
        priority: 2,
        rateLimitPerMinute: 200,
        timeoutMs: 25000,
        retryAttempts: 3
      },
      {
        provider: WatchlistProvider.WORLD_CHECK,
        apiKey: process.env.WORLD_CHECK_API_KEY || '',
        apiUrl: 'https://api.world-check.com',
        enabled: true,
        priority: 3,
        rateLimitPerMinute: 150,
        timeoutMs: 35000,
        retryAttempts: 2
      }
    ];

    defaultConfigs.forEach(config => {
      this.configs.set(config.provider, config);
    });
  }

  private initializeDefaultRules(): void {
    const defaultRules: ScreeningRule[] = [
      {
        id: 'high_priority_sanctions',
        name: 'High Priority Sanctions Match',
        description: 'Flag exact matches on sanctions lists',
        watchlistTypes: [WatchlistType.SANCTIONS],
        conditions: [
          {
            field: 'name',
            operator: 'equals',
            value: '',
            caseSensitive: false
          }
        ],
        actions: [
          {
            type: 'block',
            parameters: { reason: 'Sanctions match' }
          },
          {
            type: 'notify',
            parameters: { recipients: ['compliance@company.com'] }
          }
        ],
        isActive: true,
        priority: 1
      },
      {
        id: 'pep_review_required',
        name: 'PEP Review Required',
        description: 'Require manual review for PEP matches',
        watchlistTypes: [WatchlistType.PEP],
        conditions: [
          {
            field: 'matchLevel',
            operator: 'equals',
            value: 'medium',
            caseSensitive: false
          }
        ],
        actions: [
          {
            type: 'require_review',
            parameters: { priority: 'high' }
          }
        ],
        isActive: true,
        priority: 2
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  private loadSampleWatchlists(): void {
    const sampleEntities: WatchlistEntity[] = [
      {
        id: 'wl_001',
        type: WatchlistType.SANCTIONS,
        provider: WatchlistProvider.OFAC,
        externalId: 'OFAC12345',
        name: 'John Doe',
        aliases: ['Jonathan Doe', 'J. Doe'],
        dateOfBirth: '1980-01-01',
        nationality: 'US',
        address: '123 Main St, New York, NY',
        identificationNumbers: {
          passport: 'US123456789',
          ssn: '123-45-6789'
        },
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: 'wl_002',
        type: WatchlistType.PEP,
        provider: WatchlistProvider.WORLD_CHECK,
        externalId: 'WC67890',
        name: 'Jane Smith',
        aliases: ['Janet Smith'],
        nationality: 'UK',
        address: '456 Park Ave, London, UK',
        lastUpdated: new Date(),
        isActive: true
      }
    ];

    sampleEntities.forEach(entity => {
      this.watchlists.set(entity.id, entity);
    });
  }

  async createScreeningRequest(data: Partial<IWatchlistScreening>): Promise<IWatchlistScreening> {
    const request = new WatchlistScreening({
      userId: data.userId,
      entityType: data.entityType || 'individual',
      name: data.name,
      aliases: data.aliases || [],
      dateOfBirth: data.dateOfBirth,
      nationality: data.nationality,
      address: data.address,
      identificationNumbers: data.identificationNumbers || {},
      watchlistTypes: data.watchlistTypes || [WatchlistType.SANCTIONS],
      providers: data.providers || [WatchlistProvider.OFAC],
      status: ScreeningStatus.PENDING,
      priority: data.priority || 'medium'
    });

    await request.save();

    this.analytics.totalScreenings++;
    this.analytics.screeningsByStatus.pending++;

    this.emit('screeningRequestCreated', request);

    // Start screening process
    this.processScreeningRequest(request.id).catch(err => {
      console.error(`Error processing screening request ${request.id}:`, err);
    });

    return request;
  }

  private async processScreeningRequest(requestId: string): Promise<void> {
    const request = await WatchlistScreening.findById(requestId);
    if (!request) return;

    try {
      request.status = ScreeningStatus.IN_PROGRESS;
      await request.save();

      this.analytics.screeningsByStatus.pending--;
      this.analytics.screeningsByStatus.in_progress++;
      this.emit('screeningStarted', request);

      const startTime = Date.now();
      const result = await this.performScreening(request);
      const processingTime = Date.now() - startTime;

      this.updateAnalyticsAfterScreening(request, result, processingTime);
      this.emit('screeningCompleted', request); // Emit updated request with result

    } catch (error) {
      request.status = ScreeningStatus.FAILED;
      request.result = {
        totalMatches: 0,
        matches: [],
        matchesByLevel: {} as any,
        matchesByType: {} as any,
        riskScore: 0,
        recommendations: ['Screening failed.'],
        requiresManualReview: false,
        processedBy: [],
        errors: [error instanceof Error ? error.message : String(error)]
      };

      await request.save();

      this.analytics.screeningsByStatus.in_progress--;
      this.analytics.screeningsByStatus.failed++;

      this.emit('screeningFailed', { request, error });
    }
  }

  private async performScreening(request: IWatchlistScreening): Promise<IWatchlistScreening['result']> {
    const matches: ScreeningMatch[] = [];
    const processedBy: WatchlistProvider[] = [];

    // Assuming providers is an array of strings
    if (request.providers) {
      for (const provider of request.providers) {
        const config = this.configs.get(provider as WatchlistProvider);
        if (!config || !config.enabled) continue;

        try {
          const providerMatches = await this.screenWithProvider(request, provider as WatchlistProvider);
          matches.push(...providerMatches);
          processedBy.push(provider as WatchlistProvider);
        } catch (error) {
          console.error(`Provider ${provider} screening failed:`, error);
        }
      }
    }

    // Apply screening rules
    const processedMatches = this.applyScreeningRules(matches, request);

    const result = {
      totalMatches: processedMatches.length,
      matchesByLevel: this.groupMatchesByLevel(processedMatches),
      matchesByType: this.groupMatchesByType(processedMatches),
      matches: processedMatches as any, // Cast because match IDs are generated here, not Mongo IDs yet
      riskScore: this.calculateRiskScore(processedMatches),
      recommendations: this.generateRecommendations(processedMatches),
      requiresManualReview: processedMatches.some(m => m.requiresManualReview),
      processedBy,
      errors: []
    };

    request.status = ScreeningStatus.COMPLETED;
    request.result = result;
    request.completedAt = new Date();
    await request.save();

    return result as any;
  }

  private async screenWithProvider(request: IWatchlistScreening, provider: WatchlistProvider): Promise<ScreeningMatch[]> {
    // Simulate provider API call
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const matches: ScreeningMatch[] = [];
    const relevantEntities = Array.from(this.watchlists.values())
      .filter(entity => entity.provider === provider && request.watchlistTypes.includes(entity.type));

    for (const entity of relevantEntities) {
      const match = this.compareRequestToEntity(request, entity);
      if (match.matchLevel !== MatchLevel.NONE) {
        matches.push(match);
      }
    }

    return matches;
  }

  private compareRequestToEntity(request: IWatchlistScreening, entity: WatchlistEntity): ScreeningMatch {
    const match: ScreeningMatch = {
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestId: request.id,
      entityId: entity.id,
      matchLevel: MatchLevel.NONE,
      confidenceScore: 0,
      matchedFields: [],
      differences: [],
      explanation: '',
      requiresManualReview: false
    };

    // Name comparison
    const nameSimilarity = this.calculateStringSimilarity(request.name.toLowerCase(), entity.name.toLowerCase());
    if (nameSimilarity > 0.8) {
      match.matchLevel = nameSimilarity > 0.95 ? MatchLevel.EXACT : MatchLevel.HIGH;
      match.confidenceScore = nameSimilarity;
      match.matchedFields.push('name');
    } else if (nameSimilarity > 0.6) {
      match.matchLevel = MatchLevel.MEDIUM;
      match.confidenceScore = nameSimilarity;
      match.matchedFields.push('name_partial');
    } else if (nameSimilarity > 0.4) {
      match.matchLevel = MatchLevel.LOW;
      match.confidenceScore = nameSimilarity;
      match.matchedFields.push('name_weak');
    }

    // Check aliases
    if (request.aliases && request.aliases.length > 0) {
      for (const alias of request.aliases) {
        const aliasSimilarity = this.calculateStringSimilarity(alias.toLowerCase(), entity.name.toLowerCase());
        if (aliasSimilarity > match.confidenceScore) {
          match.confidenceScore = aliasSimilarity;
          match.matchedFields.push('alias');
        }
      }
    }

    // Date of birth comparison
    if (request.dateOfBirth && entity.dateOfBirth) {
      if (request.dateOfBirth === entity.dateOfBirth) {
        match.confidenceScore += 0.2;
        match.matchedFields.push('date_of_birth');
      }
    }

    // Nationality comparison
    if (request.nationality && entity.nationality) {
      if (request.nationality.toLowerCase() === entity.nationality.toLowerCase()) {
        match.confidenceScore += 0.1;
        match.matchedFields.push('nationality');
      }
    }

    // Generate explanation
    match.explanation = this.generateMatchExplanation(match, request, entity);

    // Determine if manual review is required
    match.requiresManualReview = match.matchLevel === MatchLevel.MEDIUM ||
      (match.matchLevel === MatchLevel.HIGH && match.confidenceScore < 0.9);

    // Cap confidence score at 1.0
    match.confidenceScore = Math.min(match.confidenceScore, 1.0);

    return match;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private generateMatchExplanation(match: ScreeningMatch, request: IWatchlistScreening, entity: WatchlistEntity): string {
    const explanations: string[] = [];

    if (match.matchedFields.includes('name')) {
      explanations.push(`Name match: "${request.name}" vs "${entity.name}"`);
    }
    if (match.matchedFields.includes('alias')) {
      explanations.push('Alias match found');
    }
    if (match.matchedFields.includes('date_of_birth')) {
      explanations.push('Date of birth matches');
    }
    if (match.matchedFields.includes('nationality')) {
      explanations.push('Nationality matches');
    }

    return explanations.join('; ') || 'Weak similarity detected';
  }

  private applyScreeningRules(matches: ScreeningMatch[], request: IWatchlistScreening): ScreeningMatch[] {
    const processedMatches = [...matches];

    for (const rule of Array.from(this.rules.values()).filter(r => r.isActive)) {
      for (const match of processedMatches) {
        if (this.evaluateRule(rule, match, request)) {
          this.applyRuleActions(rule, match, request);
        }
      }
    }

    return processedMatches;
  }

  private evaluateRule(rule: ScreeningRule, match: ScreeningMatch, request: IWatchlistScreening): boolean {
    const entity = this.watchlists.get(match.entityId);
    if (!entity) return false;

    return rule.conditions.every(condition => {
      let fieldValue = '';

      switch (condition.field) {
        case 'name':
          fieldValue = request.name;
          break;
        case 'matchLevel':
          fieldValue = match.matchLevel;
          break;
        case 'confidenceScore':
          fieldValue = match.confidenceScore.toString();
          break;
        default:
          return false;
      }

      return this.evaluateCondition(fieldValue, condition);
    });
  }

  private evaluateCondition(value: string, condition: ScreeningCondition): boolean {
    const compareValue = condition.caseSensitive ? value : value.toLowerCase();
    const conditionValue = condition.caseSensitive ? condition.value : condition.value.toLowerCase();

    switch (condition.operator) {
      case 'equals':
        return compareValue === conditionValue;
      case 'contains':
        return compareValue.includes(conditionValue);
      case 'starts_with':
        return compareValue.startsWith(conditionValue);
      case 'ends_with':
        return compareValue.endsWith(conditionValue);
      case 'regex':
        return new RegExp(condition.value, condition.caseSensitive ? 'g' : 'gi').test(compareValue);
      default:
        return false;
    }
  }

  private applyRuleActions(rule: ScreeningRule, match: ScreeningMatch, request: IWatchlistScreening): void {
    for (const action of rule.actions) {
      switch (action.type) {
        case 'flag':
          // Match is already flagged by default
          break;
        case 'block':
          match.requiresManualReview = true;
          break;
        case 'require_review':
          match.requiresManualReview = true;
          break;
        case 'notify':
          this.emit('ruleActionTriggered', {
            ruleId: rule.id,
            action,
            match,
            request
          });
          break;
        case 'log':
          console.log(`Rule ${rule.id} triggered for match ${match.id}`);
          break;
      }
    }
  }

  private groupMatchesByLevel(matches: ScreeningMatch[]): Record<MatchLevel, number> {
    const groups: Record<MatchLevel, number> = {
      none: 0,
      low: 0,
      medium: 0,
      high: 0,
      exact: 0
    };

    matches.forEach(match => {
      groups[match.matchLevel]++;
    });

    return groups;
  }

  private groupMatchesByType(matches: ScreeningMatch[]): Record<WatchlistType, number> {
    const groups: Record<WatchlistType, number> = {
      sanctions: 0,
      pep: 0,
      adverse_media: 0,
      blocklist: 0,
      custom: 0
    };

    matches.forEach(match => {
      const entity = this.watchlists.get(match.entityId);
      if (entity) {
        groups[entity.type]++;
      }
    });

    return groups;
  }

  private calculateRiskScore(matches: ScreeningMatch[]): number {
    if (matches.length === 0) return 0;

    const weights = {
      [MatchLevel.LOW]: 0.2,
      [MatchLevel.MEDIUM]: 0.5,
      [MatchLevel.HIGH]: 0.8,
      [MatchLevel.EXACT]: 1.0
    };

    const totalScore = matches.reduce((sum, match) => sum + weights[match.matchLevel], 0);
    return Math.min(totalScore / matches.length, 1.0);
  }

  private generateRecommendations(matches: ScreeningMatch[]): string[] {
    const recommendations: string[] = [];

    if (matches.length === 0) {
      recommendations.push('No matches found. Proceed with normal processing.');
      return recommendations;
    }

    const highRiskMatches = matches.filter(m => m.matchLevel === MatchLevel.HIGH || m.matchLevel === MatchLevel.EXACT);
    const mediumRiskMatches = matches.filter(m => m.matchLevel === MatchLevel.MEDIUM);

    if (highRiskMatches.length > 0) {
      recommendations.push('High-risk matches detected. Immediate manual review required.');
      recommendations.push('Consider blocking transaction until review is completed.');
    }

    if (mediumRiskMatches.length > 0) {
      recommendations.push('Medium-risk matches found. Schedule manual review within 24 hours.');
    }

    if (matches.some(m => this.watchlists.get(m.entityId)?.type === WatchlistType.SANCTIONS)) {
      recommendations.push('Sanctions list match detected. Compliance team must be notified immediately.');
    }

    if (matches.some(m => this.watchlists.get(m.entityId)?.type === WatchlistType.PEP)) {
      recommendations.push('PEP match detected. Enhanced due diligence required.');
    }

    return recommendations;
  }

  private updateAnalyticsAfterScreening(request: IWatchlistScreening, result: any, processingTime: number): void {
    // In real world, we would have analytics aggregation or persisted metrics
    // Updating in-memory state is fine for now
    this.analytics.screeningsByStatus.in_progress--;
    this.analytics.screeningsByStatus.completed++;

    // Update screenings by type
    if (request.watchlistTypes) {
      request.watchlistTypes.forEach(type => {
        this.analytics.screeningsByType[type]++;
      });
    }
  }
}
