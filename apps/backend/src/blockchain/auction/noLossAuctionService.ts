import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import logger from '../../utils/logger'

// Auction interfaces
export interface Auction {
  id: string
  assetId: string
  assetType: string
  auctionType: AuctionType
  status: AuctionStatus
  seller: AuctionParticipant
  bidders: AuctionParticipant[]
  startingPrice: number
  reservePrice?: number
  currentPrice: number
  minimumBidIncrement: number
  startTime: Date
  endTime: Date
  extendedEndTime?: Date
  timeExtensionEnabled: boolean
  timeExtensionSeconds: number
  bids: Bid[]
  winner?: AuctionParticipant
  finalPrice?: number
  settlementStatus: SettlementStatus
  auctionConfig: AuctionConfig
  rules: AuctionRules
  metadata: AuctionMetadata
  createdAt: Date
  updatedAt: Date
}

export interface Bid {
  id: string
  auctionId: string
  bidder: AuctionParticipant
  amount: number
  bidTime: Date
  bidType: BidType
  status: BidStatus
  transactionHash?: string
  blockNumber?: number
  isWinning: boolean
  outbidNotificationSent: boolean
  metadata: BidMetadata
}

export interface AuctionParticipant {
  id: string
  type: 'user' | 'institution' | 'system'
  name: string
  address: string
  contact: ParticipantContact
  kycStatus: KYCStatus
  reputation: number
  balance: number
  currency: string
  preferences: ParticipantPreferences
}

export interface AuctionConfig {
  allowProxyBidding: boolean
  allowAutoBidding: boolean
  requireDeposit: boolean
  depositAmount?: number
  maxBidders?: number
  bidHistoryVisible: boolean
  anonymousBidding: boolean
  internationalBidding: boolean
  currency: string
  paymentTerms: PaymentTerms
}

export interface AuctionRules {
  biddingRules: BiddingRules
  eligibilityRules: EligibilityRules
  terminationRules: TerminationRules
  disputeRules: DisputeRules
}

export interface BiddingRules {
  minimumBidIncrement: number
  maximumBidAmount?: number
  bidIncrementType: 'fixed' | 'percentage'
  bidIncrementValue: number
  proxyBidAllowed: boolean
  autoBidAllowed: boolean
  bidCancellationAllowed: boolean
  bidCancellationWindow: number // minutes
  bidValidationRules: BidValidationRule[]
}

export interface EligibilityRules {
  minimumReputation: number
  kycRequired: boolean
  geographicRestrictions: string[]
  institutionalOnly: boolean
  accreditedInvestorRequired: boolean
  minimumBalance: number
  maximumParticipations: number
}

export interface TerminationRules {
  noBidTermination: boolean
  noBidTerminationTime: number // minutes after start
  earlyTerminationAllowed: boolean
  earlyTerminationConditions: string[]
  forceMajeureTermination: boolean
}

export interface DisputeRules {
  disputeWindow: number // days after auction end
  arbitrationRequired: boolean
  arbitrationProvider: string
  disputeResolutionTime: number // days
  appealAllowed: boolean
}

export interface PaymentTerms {
  paymentMethod: 'immediate' | 'escrow' | 'installment'
  paymentDeadline: number // days after auction end
  currency: string
  paymentProcessor: string
  escrowService?: string
  installmentTerms?: InstallmentTerms
}

export interface InstallmentTerms {
  downPayment: number
  numberOfInstallments: number
  installmentFrequency: 'monthly' | 'quarterly' | 'annually'
  interestRate: number
  latePaymentPenalty: number
}

export interface BidValidationRule {
  ruleType: 'balance_check' | 'increment_check' | 'time_check' | 'eligibility_check' | 'custom'
  parameters: Record<string, any>
  errorMessage: string
  severity: 'error' | 'warning'
}

export interface AuctionMetadata {
  title: string
  description: string
  images: string[]
  documents: AuctionDocument[]
  tags: string[]
  category: string
  subCategory?: string
  featured: boolean
  priority: number
  visibility: 'public' | 'private' | 'invite_only'
  invitationList?: string[]
}

export interface AuctionDocument {
  type: 'prospectus' | 'valuation_report' | 'legal_docs' | 'inspection_report' | 'other'
  name: string
  url: string
  uploadedBy: string
  uploadedAt: Date
  required: boolean
}

export interface ParticipantContact {
  email: string
  phone?: string
  address?: string
  taxId?: string
  preferredLanguage: string
  timezone: string
}

export interface ParticipantPreferences {
  notifications: NotificationPreferences
  bidding: BiddingPreferences
  privacy: PrivacyPreferences
}

export interface NotificationPreferences {
  bidUpdates: boolean
  outbidAlerts: boolean
  auctionEndAlerts: boolean
  paymentReminders: boolean
  marketingEmails: boolean
}

export interface BiddingPreferences {
  autoBidEnabled: boolean
  maxAutoBidAmount?: number
  bidIncrement: number
  proxyBiddingEnabled: boolean
}

export interface PrivacyPreferences {
  showNameInBids: boolean
  showContactInfo: boolean
  allowDataSharing: boolean
}

export interface BidMetadata {
  userAgent?: string
  ipAddress?: string
  deviceType?: string
  bidStrategy?: string
  notes?: string
}

export type AuctionType =
  | 'english' | 'dutch' | 'sealed_bid' | ' Vickrey' | 'reverse' | 'no_loss'

// Dutch Auction specific interfaces
export interface DutchAuctionConfig {
  startingPrice: number
  minimumPrice: number
  priceDecrement: number
  decrementInterval: number // seconds
  reservePrice?: number
  priceCurve: 'linear' | 'exponential' | 'custom'
  customPriceCurve?: PricePoint[]
}

export interface PricePoint {
  timeOffset: number // seconds from auction start
  price: number
}

export interface DutchAuctionState {
  currentPrice: number
  priceLastUpdated: Date
  nextPriceUpdate: Date
  bidsReceived: number
  timeElapsed: number
  priceHistory: PriceHistoryPoint[]
}

export interface PriceHistoryPoint {
  timestamp: Date
  price: number
  reason: 'scheduled' | 'bid_received' | 'auction_end'
}

export type AuctionStatus =
  | 'draft' | 'scheduled' | 'active' | 'extended' | 'ended' | 'cancelled'
  | 'settled' | 'disputed' | 'completed'

export type BidType =
  | 'manual' | 'proxy' | 'auto' | 'system'

export type BidStatus =
  | 'active' | 'outbid' | 'winning' | 'cancelled' | 'invalid'

export type SettlementStatus =
  | 'pending' | 'payment_due' | 'paid' | 'delivered' | 'completed' | 'disputed' | 'refunded'

export type KYCStatus =
  | 'not_required' | 'pending' | 'approved' | 'rejected' | 'expired'

/**
 * No-Loss Auction Service for RWA Tokenization
 * Comprehensive auction mechanism with multiple auction types,
 * real-time bidding, automated validation, and settlement processing
 */
export class NoLossAuctionService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger

  // Data storage
  private auctions: Map<string, Auction> = new Map()
  private bids: Map<string, Bid[]> = new Map()
  private participants: Map<string, AuctionParticipant> = new Map()

  // Dutch auction specific storage
  private dutchAuctionStates: Map<string, DutchAuctionState> = new Map()
  private dutchAuctionConfigs: Map<string, DutchAuctionConfig> = new Map()

  // Active auction monitoring
  private activeAuctions: Set<string> = new Set()
  private auctionTimers: Map<string, NodeJS.Timeout> = new Map()
  private priceUpdateTimers: Map<string, NodeJS.Timeout> = new Map()

  // Monitoring
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(baseSdk: BaseSdkService, loggerInstance: typeof logger) {
    super()
    this.baseSdk = baseSdk
    this.logger = loggerInstance

    // Start auction monitoring
    this.startAuctionMonitoring()
  }

  // ============ AUCTION MONITORING AND SCHEDULING ============

  /**
   * Start auction monitoring
   */
  private startAuctionMonitoring(): void {
    // Check for auctions that should start
    setInterval(() => {
      this.checkScheduledAuctions()
    }, 60000) // Check every minute

    // Check for auctions that should end
    setInterval(() => {
      this.checkEndingAuctions()
    }, 30000) // Check every 30 seconds
  }

  /**
   * Check for scheduled auctions to start
   */
  private async checkScheduledAuctions(): Promise<void> {
    const now = new Date()

    for (const [auctionId, auction] of this.auctions) {
      if (auction.status === 'scheduled' && now >= auction.startTime) {
        try {
          await this.startAuction(auctionId)
        } catch (error) {
          this.logger.error(`Failed to auto-start auction ${auctionId}:`, error)
        }
      }
    }
  }

  /**
   * Check for auctions that should end
   */
  private async checkEndingAuctions(): Promise<void> {
    const now = new Date()

    for (const auctionId of this.activeAuctions) {
      const auction = this.auctions.get(auctionId)
      if (auction && auction.endTime && now >= auction.endTime) {
        try {
          await this.endAuction(auctionId, 'Time expired')
        } catch (error) {
          this.logger.error(`Failed to auto-end auction ${auctionId}:`, error)
        }
      }
    }
  }

  /**
   * Schedule auction end
   */
  private scheduleAuctionEnd(auctionId: string): void {
    const auction = this.auctions.get(auctionId)
    if (!auction || !auction.endTime) return

    const timeToEnd = auction.endTime.getTime() - Date.now()

    if (timeToEnd > 0) {
      const timer = setTimeout(async () => {
        try {
          await this.endAuction(auctionId, 'Scheduled end time reached')
        } catch (error) {
          this.logger.error(`Failed to end scheduled auction ${auctionId}:`, error)
        }
      }, timeToEnd)

      this.auctionTimers.set(auctionId, timer)
    }
  }

  /**
   * Reschedule auction end
   */
  private rescheduleAuctionEnd(auctionId: string): void {
    const existingTimer = this.auctionTimers.get(auctionId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    this.scheduleAuctionEnd(auctionId)
  }

  // ============ AUCTION CREATION AND MANAGEMENT ============

  /**
   * Create Dutch auction
   */
  async createDutchAuction(
    assetId: string,
    auctionData: Omit<Auction, 'id' | 'assetId' | 'auctionType' | 'status' | 'currentPrice' | 'bids' | 'createdAt' | 'updatedAt' | 'winner' | 'finalPrice' | 'settlementStatus'>,
    dutchConfig: DutchAuctionConfig
  ): Promise<Auction> {
    try {
      // Validate Dutch auction config
      this.validateDutchAuctionConfig(dutchConfig)

      const auction = await this.createAuction(assetId, {
        ...auctionData,
        auctionType: 'dutch',
        startingPrice: dutchConfig.startingPrice,
        reservePrice: dutchConfig.reservePrice
      })

      // Store Dutch auction configuration
      this.dutchAuctionConfigs.set(auction.id, dutchConfig)

      this.emit('dutch-auction:created', { auction, dutchConfig })

      return auction
    } catch (error) {
      this.logger.error(`Failed to create Dutch auction for asset ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Validate Dutch auction configuration
   */
  private validateDutchAuctionConfig(config: DutchAuctionConfig): void {
    if (config.startingPrice <= config.minimumPrice) {
      throw new Error('Starting price must be greater than minimum price')
    }

    if (config.priceDecrement <= 0) {
      throw new Error('Price decrement must be positive')
    }

    if (config.decrementInterval <= 0) {
      throw new Error('Decrement interval must be positive')
    }

    if (config.reservePrice && config.reservePrice < config.minimumPrice) {
      throw new Error('Reserve price cannot be less than minimum price')
    }

    if (config.priceCurve === 'custom' && (!config.customPriceCurve || config.customPriceCurve.length === 0)) {
      throw new Error('Custom price curve requires price points')
    }
  }

  /**
   * Create new auction
   */
  async createAuction(
    assetId: string,
    auctionData: Omit<Auction, 'id' | 'assetId' | 'status' | 'currentPrice' | 'bids' | 'createdAt' | 'updatedAt' | 'winner' | 'finalPrice' | 'settlementStatus'>
  ): Promise<Auction> {
    try {
      const auction: Auction = {
        id: `auction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        status: 'draft',
        currentPrice: auctionData.startingPrice,
        bids: [],
        settlementStatus: 'pending',
        ...auctionData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.auctions.set(auction.id, auction)

      this.emit('auction:created', { auction })

      return auction
    } catch (error) {
      this.logger.error(`Failed to create auction for asset ${assetId}:`, error)
      throw error
    }
  }

  /**
   * End auction
   */
  async endAuction(auctionId: string, reason?: string): Promise<Auction> {
    try {
      const auction = this.auctions.get(auctionId)
      if (!auction) {
        throw new Error(`Auction ${auctionId} not found`)
      }

      if (auction.status !== 'active' && auction.status !== 'extended') {
        throw new Error(`Cannot end auction with status: ${auction.status}`)
      }

      auction.status = 'ended'
      auction.endTime = new Date()
      auction.updatedAt = new Date()

      // Determine winner
      await this.determineAuctionWinner(auction)

      // Remove from active auctions
      this.activeAuctions.delete(auctionId)

      // Clear auction timer
      const timer = this.auctionTimers.get(auctionId)
      if (timer) {
        clearTimeout(timer)
        this.auctionTimers.delete(auctionId)
      }

      this.auctions.set(auctionId, auction)

      this.emit('auction:ended', { auction, reason })

      return auction
    } catch (error) {
      this.logger.error(`Failed to end auction ${auctionId}:`, error)
      throw error
    }
  }

  /**
   * Settle auction
   */
  async settleAuction(auctionId: string): Promise<Auction> {
    try {
      const auction = this.auctions.get(auctionId)
      if (!auction) {
        throw new Error(`Auction ${auctionId} not found`)
      }

      if (auction.status !== 'ended') {
        throw new Error(`Cannot settle auction with status: ${auction.status}`)
      }

      if (!auction.winner || !auction.finalPrice) {
        throw new Error('Auction has no winner or final price')
      }

      // Process payment
      await this.processAuctionPayment(auction)

      auction.settlementStatus = 'paid'
      auction.status = 'settled'
      auction.updatedAt = new Date()

      this.auctions.set(auctionId, auction)

      this.emit('auction:settled', { auction })

      return auction
    } catch (error) {
      this.logger.error(`Failed to settle auction ${auctionId}:`, error)
      throw error
    }
  }

  /**
   * Determine auction winner
   */
  private async determineAuctionWinner(auction: Auction): Promise<void> {
    const winningBid = auction.bids
      .filter(b => b.status === 'winning' || b.status === 'active')
      .sort((a, b) => b.amount - a.amount)[0]

    if (!winningBid) {
      // No bids - check if reserve was met
      if (auction.reservePrice && auction.currentPrice < auction.reservePrice) {
        auction.status = 'cancelled'
        this.emit('auction:cancelled', { auction, reason: 'Reserve price not met' })
        return
      }
    }

    if (winningBid) {
      auction.winner = winningBid.bidder
      auction.finalPrice = winningBid.amount

      // Mark bid as final winning bid
      winningBid.isWinning = true

      this.emit('auction:winner-determined', { auction, winningBid })
    }
  }

  /**
   * Process auction payment
   */
  private async processAuctionPayment(auction: Auction): Promise<void> {
    if (!auction.winner || !auction.finalPrice) {
      throw new Error('Auction has no winner or final price')
    }

    // Process payment based on terms
    switch (auction.auctionConfig.paymentTerms.paymentMethod) {
      case 'immediate':
        await this.processImmediatePayment(auction)
        break
      case 'escrow':
        await this.processEscrowPayment(auction)
        break
      case 'installment':
        await this.processInstallmentPayment(auction)
        break
    }

    this.emit('auction:payment-processed', { auction })
  }

  /**
   * Process immediate payment
   */
  private async processImmediatePayment(auction: Auction): Promise<void> {
    // Implementation would integrate with payment processor
    this.logger.info(`Processing immediate payment for auction ${auction.id}`)
  }

  /**
   * Process escrow payment
   */
  private async processEscrowPayment(auction: Auction): Promise<void> {
    // Implementation would integrate with escrow service
    this.logger.info(`Processing escrow payment for auction ${auction.id}`)
  }

  /**
   * Process installment payment
   */
  private async processInstallmentPayment(auction: Auction): Promise<void> {
    // Implementation would set up installment schedule
    this.logger.info(`Processing installment payment for auction ${auction.id}`)
  }

  /**
   * Validate bid
   */
  private async validateBid(auction: Auction, bidder: AuctionParticipant, bidAmount: number): Promise<void> {
    // Check bidder eligibility
    if (bidder.kycStatus === 'rejected') {
      throw new Error('Bidder KYC not approved')
    }

    if (bidder.reputation < auction.rules.eligibilityRules.minimumReputation) {
      throw new Error('Bidder reputation too low')
    }

    if (bidder.balance < bidAmount) {
      throw new Error('Insufficient balance')
    }

    // Check bid amount
    if (bidAmount <= auction.currentPrice) {
      throw new Error(`Bid must be higher than current price: ${auction.currentPrice}`)
    }

    // Check reserve price (if not met yet)
    if (auction.reservePrice && bidAmount < auction.reservePrice) {
      throw new Error('Bid below reserve price')
    }

    // Check auction timing
    const now = new Date()
    if (now < auction.startTime || now > auction.endTime!) {
      throw new Error('Auction not active')
    }

    // Check bidder participation limit
    const bidderParticipationCount = auction.bidders.filter(b => b.id === bidder.id).length
    if (bidderParticipationCount >= auction.rules.eligibilityRules.maximumParticipations) {
      throw new Error('Maximum participations reached')
    }

    // Apply custom validation rules
    for (const rule of auction.rules.biddingRules.bidValidationRules) {
      await this.applyBidValidationRule(rule, auction, bidder, bidAmount)
    }
  }

  /**
   * Apply bid validation rule
   */
  private async applyBidValidationRule(
    rule: BidValidationRule,
    auction: Auction,
    bidder: AuctionParticipant,
    bidAmount: number
  ): Promise<void> {
    switch (rule.ruleType) {
      case 'balance_check':
        if (bidder.balance < bidAmount * (rule.parameters.multiplier || 1)) {
          throw new Error(rule.errorMessage)
        }
        break

      case 'increment_check':
        const minIncrement = rule.parameters.minIncrement || auction.minimumBidIncrement
        if (bidAmount - auction.currentPrice < minIncrement) {
          throw new Error(rule.errorMessage)
        }
        break

      case 'time_check':
        const timeToEnd = auction.endTime!.getTime() - Date.now()
        if (timeToEnd < (rule.parameters.minTimeToEnd || 0)) {
          throw new Error(rule.errorMessage)
        }
        break

      case 'eligibility_check':
        if (rule.parameters.requireAccredited && !bidder.contact.taxId) {
          throw new Error(rule.errorMessage)
        }
        break
    }
  }

  // ============ PARTICIPANT MANAGEMENT ============

  /**
   * Register auction participant
   */
  async registerParticipant(participantData: Omit<AuctionParticipant, 'id'>): Promise<AuctionParticipant> {
    try {
      const participant: AuctionParticipant = {
        id: `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...participantData
      }

      this.participants.set(participant.id, participant)

      this.emit('participant:registered', { participant })

      return participant
    } catch (error) {
      this.logger.error('Failed to register participant:', error)
      throw error
    }
  }

  /**
   * Update participant balance
   */
  async updateParticipantBalance(participantId: string, amount: number, operation: 'add' | 'subtract'): Promise<AuctionParticipant> {
    try {
      const participant = this.participants.get(participantId)
      if (!participant) {
        throw new Error(`Participant ${participantId} not found`)
      }

      if (operation === 'subtract' && participant.balance < amount) {
        throw new Error('Insufficient balance')
      }

      participant.balance = operation === 'add'
        ? participant.balance + amount
        : participant.balance - amount

      this.participants.set(participantId, participant)

      this.emit('participant:balance-updated', { participant, amount, operation })

      return participant
    } catch (error) {
      this.logger.error(`Failed to update participant ${participantId} balance:`, error)
      throw error
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Get auction by ID
   */
  getAuction(auctionId: string): Auction | null {
    return this.auctions.get(auctionId) || null
  }

  /**
   * Get auctions by status
   */
  getAuctionsByStatus(status: AuctionStatus): Auction[] {
    return Array.from(this.auctions.values()).filter(auction => auction.status === status)
  }

  /**
   * Get auctions by asset
   */
  getAuctionsByAsset(assetId: string): Auction[] {
    return Array.from(this.auctions.values()).filter(auction => auction.assetId === assetId)
  }

  /**
   * Get participant auctions
   */
  getParticipantAuctions(participantId: string, role: 'seller' | 'bidder' = 'bidder'): Auction[] {
    return Array.from(this.auctions.values()).filter(auction => {
      if (role === 'seller') {
        return auction.seller.id === participantId
      } else {
        return auction.bidders.some(bidder => bidder.id === participantId)
      }
    })
  }

  /**
   * Get auction bids
   */
  getAuctionBids(auctionId: string): Bid[] {
    return this.bids.get(auctionId) || []
  }

  // ============ DUTCH AUCTION SPECIFIC METHODS ============

  /**
   * Start Dutch auction with price initialization
   */
  async startDutchAuction(auctionId: string): Promise<Auction> {
    try {
      const auction = await this.startAuction(auctionId)
      const dutchConfig = this.dutchAuctionConfigs.get(auctionId)

      if (!dutchConfig) {
        throw new Error('Dutch auction configuration not found')
      }

      // Initialize Dutch auction state
      const dutchState: DutchAuctionState = {
        currentPrice: dutchConfig.startingPrice,
        priceLastUpdated: new Date(),
        nextPriceUpdate: new Date(Date.now() + dutchConfig.decrementInterval * 1000),
        bidsReceived: 0,
        timeElapsed: 0,
        priceHistory: [{
          timestamp: new Date(),
          price: dutchConfig.startingPrice,
          reason: 'scheduled'
        }]
      }

      this.dutchAuctionStates.set(auctionId, dutchState)

      // Start price decrement timer
      this.schedulePriceUpdate(auctionId)

      this.emit('dutch-auction:started', { auction, dutchState })

      return auction
    } catch (error) {
      this.logger.error(`Failed to start Dutch auction ${auctionId}:`, error)
      throw error
    }
  }

  /**
   * Place bid on Dutch auction (first bidder wins current price)
   */
  async placeDutchBid(
    auctionId: string,
    bidderId: string,
    bidType: BidType = 'manual',
    metadata?: BidMetadata
  ): Promise<Bid> {
    try {
      const auction = this.auctions.get(auctionId)
      if (!auction) {
        throw new Error(`Auction ${auctionId} not found`)
      }

      if (auction.auctionType !== 'dutch') {
        throw new Error('This method is only for Dutch auctions')
      }

      if (auction.status !== 'active') {
        throw new Error(`Auction is not active. Status: ${auction.status}`)
      }

      const bidder = this.participants.get(bidderId)
      if (!bidder) {
        throw new Error(`Bidder ${bidderId} not found`)
      }

      const dutchState = this.dutchAuctionStates.get(auctionId)
      if (!dutchState) {
        throw new Error('Dutch auction state not found')
      }

      // Validate bidder eligibility for Dutch auction
      await this.validateDutchBid(auction, bidder)

      // Create bid at current price (first bidder wins)
      const bidAmount = dutchState.currentPrice

      const bid: Bid = {
        id: `bid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        auctionId,
        bidder,
        amount: bidAmount,
        bidTime: new Date(),
        bidType,
        status: 'winning',
        isWinning: true,
        outbidNotificationSent: false,
        metadata: metadata || {}
      }

      // Add bid to auction
      if (!this.bids.has(auctionId)) {
        this.bids.set(auctionId, [])
      }
      this.bids.get(auctionId)!.push(bid)
      auction.bids.push(bid)

      // Update Dutch auction state
      dutchState.bidsReceived++

      // End auction immediately (first bidder wins)
      auction.winner = bidder
      auction.finalPrice = bidAmount
      auction.currentPrice = bidAmount

      // Stop price updates
      this.clearPriceUpdateTimer(auctionId)

      this.emit('dutch-bid:placed', { auction, bid, dutchState })

      // End auction
      await this.endAuction(auctionId, 'First bidder accepted current price')

      return bid
    } catch (error) {
      this.logger.error(`Failed to place Dutch bid on auction ${auctionId}:`, error)
      throw error
    }
  }

  /**
   * Process bid placement for Dutch auction
   */
  private async processDutchBidPlacement(auction: Auction, newBid: Bid): Promise<void> {
    if (auction.auctionType !== 'dutch') {
      return // Skip Dutch-specific processing for non-Dutch auctions
    }

    const dutchState = this.dutchAuctionStates.get(auction.id)
    if (!dutchState) {
      throw new Error('Dutch auction state not found')
    }

    // For Dutch auctions, first bid wins at current price
    // This is handled in placeDutchBid method above
    // No additional processing needed here
  }

  /**
   * Validate Dutch bid
   */
  private async validateDutchBid(auction: Auction, bidder: AuctionParticipant): Promise<void> {
    // Check bidder eligibility
    if (bidder.kycStatus === 'rejected') {
      throw new Error('Bidder KYC not approved')
    }

    if (bidder.reputation < auction.rules.eligibilityRules.minimumReputation) {
      throw new Error('Bidder reputation too low')
    }

    // Check balance against current price
    const dutchState = this.dutchAuctionStates.get(auction.id)
    if (dutchState && bidder.balance < dutchState.currentPrice) {
      throw new Error('Insufficient balance for current price')
    }

    // Check auction timing
    const now = new Date()
    if (now < auction.startTime || now > auction.endTime!) {
      throw new Error('Auction not active')
    }

    // Check bidder participation limit
    const bidderParticipationCount = auction.bidders.filter(b => b.id === bidder.id).length
    if (bidderParticipationCount >= auction.rules.eligibilityRules.maximumParticipations) {
      throw new Error('Maximum participations reached')
    }
  }

  /**
   * Update Dutch auction price
   */
  private async updateDutchAuctionPrice(auctionId: string): Promise<void> {
    try {
      const auction = this.auctions.get(auctionId)
      const dutchConfig = this.dutchAuctionConfigs.get(auctionId)
      const dutchState = this.dutchAuctionStates.get(auctionId)

      if (!auction || !dutchConfig || !dutchState) {
        return
      }

      if (auction.status !== 'active') {
        return // Auction no longer active
      }

      const now = new Date()
      const timeElapsed = (now.getTime() - auction.startTime.getTime()) / 1000 // seconds

      // Calculate new price based on curve
      let newPrice: number

      if (dutchConfig.priceCurve === 'custom' && dutchConfig.customPriceCurve) {
        newPrice = this.calculateCustomPriceCurve(dutchConfig.customPriceCurve, timeElapsed)
      } else {
        newPrice = this.calculatePriceCurve(dutchConfig, timeElapsed)
      }

      // Ensure price doesn't go below minimum
      newPrice = Math.max(newPrice, dutchConfig.minimumPrice)

      // Check if price reached reserve floor
      if (dutchConfig.reservePrice && newPrice <= dutchConfig.reservePrice) {
        // End auction if reserve reached without bids
        if (dutchState.bidsReceived === 0) {
          await this.endAuction(auctionId, 'Reserve price reached without bids')
          return
        }
        newPrice = dutchConfig.reservePrice // Don't go below reserve
      }

      // Update state
      dutchState.currentPrice = newPrice
      dutchState.priceLastUpdated = now
      dutchState.nextPriceUpdate = new Date(now.getTime() + dutchConfig.decrementInterval * 1000)
      dutchState.timeElapsed = timeElapsed
      dutchState.priceHistory.push({
        timestamp: now,
        price: newPrice,
        reason: 'scheduled'
      })

      // Update auction current price
      auction.currentPrice = newPrice

      this.emit('dutch-price:updated', { auction, dutchState, newPrice })

      // Schedule next update
      this.schedulePriceUpdate(auctionId)

    } catch (error) {
      this.logger.error(`Failed to update Dutch auction price for ${auctionId}:`, error)
    }
  }

  /**
   * Calculate price based on curve
   */
  private calculatePriceCurve(config: DutchAuctionConfig, timeElapsed: number): number {
    const decrementAmount = (timeElapsed / config.decrementInterval) * config.priceDecrement

    if (config.priceCurve === 'linear') {
      return Math.max(config.startingPrice - decrementAmount, config.minimumPrice)
    } else if (config.priceCurve === 'exponential') {
      // Exponential decay: price = starting * e^(-decay_rate * time)
      const decayRate = config.priceDecrement / config.startingPrice
      return Math.max(config.startingPrice * Math.exp(-decayRate * timeElapsed), config.minimumPrice)
    }

    return config.startingPrice
  }

  /**
   * Calculate custom price curve
   */
  private calculateCustomPriceCurve(pricePoints: PricePoint[], timeElapsed: number): number {
    // Find the appropriate price point based on time elapsed
    const sortedPoints = pricePoints.sort((a, b) => a.timeOffset - b.timeOffset)

    // If before first point, return starting price
    if (timeElapsed <= sortedPoints[0].timeOffset) {
      return sortedPoints[0].price
    }

    // If after last point, return last price
    if (timeElapsed >= sortedPoints[sortedPoints.length - 1].timeOffset) {
      return sortedPoints[sortedPoints.length - 1].price
    }

    // Interpolate between points
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const currentPoint = sortedPoints[i]
      const nextPoint = sortedPoints[i + 1]

      if (timeElapsed >= currentPoint.timeOffset && timeElapsed <= nextPoint.timeOffset) {
        const timeRatio = (timeElapsed - currentPoint.timeOffset) /
                         (nextPoint.timeOffset - currentPoint.timeOffset)
        return currentPoint.price + (nextPoint.price - currentPoint.price) * timeRatio
      }
    }

    return sortedPoints[0].price
  }

  /**
   * Schedule price update for Dutch auction
   */
  private schedulePriceUpdate(auctionId: string): void {
    const dutchConfig = this.dutchAuctionConfigs.get(auctionId)
    const dutchState = this.dutchAuctionStates.get(auctionId)

    if (!dutchConfig || !dutchState) return

    const timeToNextUpdate = dutchState.nextPriceUpdate.getTime() - Date.now()

    if (timeToNextUpdate > 0) {
      const timer = setTimeout(async () => {
        await this.updateDutchAuctionPrice(auctionId)
      }, timeToNextUpdate)

      this.priceUpdateTimers.set(auctionId, timer)
    }
  }

  /**
   * Clear price update timer
   */
  private clearPriceUpdateTimer(auctionId: string): void {
    const timer = this.priceUpdateTimers.get(auctionId)
    if (timer) {
      clearTimeout(timer)
      this.priceUpdateTimers.delete(auctionId)
    }
  }

  /**
   * Get Dutch auction state
   */
  getDutchAuctionState(auctionId: string): DutchAuctionState | null {
    return this.dutchAuctionStates.get(auctionId) || null
  }

  /**
   * Get Dutch auction config
   */
  getDutchAuctionConfig(auctionId: string): DutchAuctionConfig | null {
    return this.dutchAuctionConfigs.get(auctionId) || null
  }

  // ============ OVERRIDE METHODS FOR DUTCH AUCTION SUPPORT ============

  /**
   * Override placeBid to support Dutch auctions
   */
  async placeBid(
    auctionId: string,
    bidderId: string,
    bidAmount: number,
    bidType: BidType = 'manual',
    metadata?: BidMetadata
  ): Promise<Bid> {
    const auction = this.auctions.get(auctionId)
    if (!auction) {
      throw new Error(`Auction ${auctionId} not found`)
    }

    // Route to appropriate bid handler
    if (auction.auctionType === 'dutch') {
      return this.placeDutchBid(auctionId, bidderId, bidType, metadata)
    } else {
      return this.placeEnglishBid(auctionId, bidderId, bidAmount, bidType, metadata)
    }
  }

  /**
   * Place English bid (renamed from original)
   */
  private async placeEnglishBid(
    auctionId: string,
    bidderId: string,
    bidAmount: number,
    bidType: BidType = 'manual',
    metadata?: BidMetadata
  ): Promise<Bid> {
    try {
      const auction = this.auctions.get(auctionId)
      if (!auction) {
        throw new Error(`Auction ${auctionId} not found`)
      }

      if (auction.status !== 'active') {
        throw new Error(`Auction is not active. Status: ${auction.status}`)
      }

      const bidder = this.participants.get(bidderId)
      if (!bidder) {
        throw new Error(`Bidder ${bidderId} not found`)
      }

      // Validate bid
      await this.validateBid(auction, bidder, bidAmount)

      const bid: Bid = {
        id: `bid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        auctionId,
        bidder,
        amount: bidAmount,
        bidTime: new Date(),
        bidType,
        status: 'active',
        isWinning: false,
        outbidNotificationSent: false,
        metadata: metadata || {}
      }

      // Add bid to auction
      if (!this.bids.has(auctionId)) {
        this.bids.set(auctionId, [])
      }
      this.bids.get(auctionId)!.push(bid)
      auction.bids.push(bid)

      // Update auction current price and handle outbidding
      await this.processBidPlacement(auction, bid)

      auction.updatedAt = new Date()
      this.auctions.set(auctionId, auction)

      this.emit('bid:placed', { auction, bid })

      return bid
    } catch (error) {
      this.logger.error(`Failed to place bid on auction ${auctionId}:`, error)
      throw error
    }
  }

  /**
   * Override processBidPlacement to support Dutch auctions
   */
  private async processBidPlacement(auction: Auction, newBid: Bid): Promise<void> {
    if (auction.auctionType === 'dutch') {
      await this.processDutchBidPlacement(auction, newBid)
    } else {
      await this.processEnglishBidPlacement(auction, newBid)
    }
  }

  /**
   * Process English bid placement (renamed from original)
   */
  private async processEnglishBidPlacement(auction: Auction, newBid: Bid): Promise<void> {
    if (auction.auctionType !== 'english') {
      throw new Error('Bid processing only supported for English auctions')
    }

    const previousWinningBid = auction.bids
      .filter(b => b.status === 'winning')
      .sort((a, b) => b.amount - a.amount)[0]

    // Check if bid meets minimum increment
    if (previousWinningBid) {
      const minimumBid = previousWinningBid.amount + auction.minimumBidIncrement
      if (newBid.amount < minimumBid) {
        throw new Error(`Bid must be at least ${minimumBid} (${auction.minimumBidIncrement} increment)`)
      }
    }

    // Update current price
    auction.currentPrice = newBid.amount

    // Mark previous winning bid as outbid
    if (previousWinningBid) {
      previousWinningBid.status = 'outbid'
      previousWinningBid.isWinning = false

      // Send outbid notification
      if (!previousWinningBid.outbidNotificationSent) {
        this.emit('bidder:outbid', {
          auction,
          bidder: previousWinningBid.bidder,
          newBid,
          previousBid: previousWinningBid
        })
        previousWinningBid.outbidNotificationSent = true
      }
    }

    // Mark new bid as winning
    newBid.status = 'winning'
    newBid.isWinning = true

    // Check reserve price
    if (auction.reservePrice && auction.currentPrice >= auction.reservePrice) {
      auction.reservePrice = undefined // Reserve met
    }

    // Handle time extension if enabled
    if (auction.timeExtensionEnabled && auction.endTime) {
      const now = new Date()
      const timeToEnd = auction.endTime.getTime() - now.getTime()
      const extensionThreshold = 5 * 60 * 1000 // 5 minutes

      if (timeToEnd <= extensionThreshold) {
        const newEndTime = new Date(now.getTime() + auction.timeExtensionSeconds * 1000)
        auction.endTime = newEndTime
        auction.extendedEndTime = newEndTime
        auction.status = 'extended'

        // Reschedule end timer
        this.rescheduleAuctionEnd(auction.id)
      }
    }
  }

  /**
   * Override startAuction to support Dutch auctions
   */
  async startAuction(auctionId: string): Promise<Auction> {
    const auction = this.auctions.get(auctionId)
    if (!auction) {
      throw new Error(`Auction ${auctionId} not found`)
    }

    if (auction.auctionType === 'dutch') {
      return this.startDutchAuction(auctionId)
    } else {
      return this.startEnglishAuction(auctionId)
    }
  }

  /**
   * Start English auction (renamed from original)
   */
  private async startEnglishAuction(auctionId: string): Promise<Auction> {
    try {
      const auction = this.auctions.get(auctionId)
      if (!auction) {
        throw new Error(`Auction ${auctionId} not found`)
      }

      if (auction.status !== 'scheduled' && auction.status !== 'draft') {
        throw new Error(`Cannot start auction with status: ${auction.status}`)
      }

      const now = new Date()
      if (now < auction.startTime) {
        throw new Error('Cannot start auction before scheduled time')
      }

      auction.status = 'active'
      auction.updatedAt = new Date()

      // Add to active auctions monitoring
      this.activeAuctions.add(auctionId)

      // Schedule auction end timer
      this.scheduleAuctionEnd(auctionId)

      this.auctions.set(auctionId, auction)

      this.emit('auction:started', { auction })

      return auction
    } catch (error) {
      this.logger.error(`Failed to start auction ${auctionId}:`, error)
      throw error
    }
  }

  /**
   * Get auction overview with Dutch auction support
   */
  getAuctionOverview(auctionId: string): {
    auction: Auction | null
    bids: Bid[]
    participants: AuctionParticipant[]
    timeRemaining: number | null
    isActive: boolean
    bidHistory: Bid[]
    winningBid: Bid | null
    dutchState?: DutchAuctionState
    dutchConfig?: DutchAuctionConfig
  } {
    const auction = this.auctions.get(auctionId) || null
    const bids = this.bids.get(auctionId) || []
    const participants = auction ? [auction.seller, ...auction.bidders] : []

    let timeRemaining: number | null = null
    let isActive = false

    if (auction && auction.status === 'active' && auction.endTime) {
      timeRemaining = Math.max(0, auction.endTime.getTime() - Date.now())
      isActive = timeRemaining > 0
    }

    const bidHistory = bids.sort((a, b) => b.bidTime.getTime() - a.bidTime.getTime())
    const winningBid = bids.find(bid => bid.isWinning) || null

    const overview: any = {
      auction,
      bids,
      participants,
      timeRemaining,
      isActive,
      bidHistory,
      winningBid
    }

    // Add Dutch auction specific data
    if (auction?.auctionType === 'dutch') {
      overview.dutchState = this.dutchAuctionStates.get(auctionId) || undefined
      overview.dutchConfig = this.dutchAuctionConfigs.get(auctionId) || undefined
    }

    return overview
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: Date
    metrics: any
  } {
    return {
      status: 'healthy',
      timestamp: new Date(),
      metrics: {
        totalAuctions: this.auctions.size,
        activeAuctions: Array.from(this.auctions.values()).filter(a => a.status === 'active').length,
        endedAuctions: Array.from(this.auctions.values()).filter(a => a.status === 'ended').length,
        settledAuctions: Array.from(this.auctions.values()).filter(a => a.settlementStatus === 'completed').length,
        totalBids: Array.from(this.bids.values()).flat().length,
        totalParticipants: this.participants.size,
        activeTimers: this.auctionTimers.size,
        dutchAuctions: this.dutchAuctionStates.size
      }
    }
  }

  /**
   * Clear all data with Dutch auction cleanup
   */
  clearAllData(): void {
    this.auctions.clear()
    this.bids.clear()
    this.participants.clear()
    this.activeAuctions.clear()
    this.dutchAuctionStates.clear()
    this.dutchAuctionConfigs.clear()

    // Clear timers
    for (const timer of this.auctionTimers.values()) {
      clearTimeout(timer)
    }
    this.auctionTimers.clear()

    // Clear price update timers
    for (const timer of this.priceUpdateTimers.values()) {
      clearTimeout(timer)
    }
    this.priceUpdateTimers.clear()

    // Clear intervals
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval)
    }
    this.monitoringIntervals.clear()

    this.logger.info('All auction data cleared')
  }
}

export default NoLossAuctionService
