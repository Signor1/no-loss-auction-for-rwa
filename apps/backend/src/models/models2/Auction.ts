import mongoose, { Document, Schema } from 'mongoose'

// Auction interface
export interface IAuction extends Document {
  id: string
  title: string
  description: string
  assetId: string
  sellerId: string
  category: string
  startingBid: number
  currentBid: number
  minBidIncrement: number
  reservePrice?: number
  buyNowPrice?: number
  endTime: Date
  status: 'draft' | 'pending' | 'active' | 'ended' | 'cancelled' | 'sold'
  auctionType: 'english' | 'dutch' | 'sealed-bid' | 'no-loss'
  visibility: 'public' | 'private' | 'unlisted'
  featured: boolean
  priority: number
  bids: Array<{
    id: string
    bidderId: string
    amount: number
    timestamp: Date
    isWinning: boolean
    transactionHash?: string
    status: 'pending' | 'confirmed' | 'failed'
  }>
  winner?: {
    userId: string
    amount: number
    timestamp: Date
    transactionHash?: string
  }
  metrics: {
    views: number
    watchers: number
    bids: number
    uniqueBidders: number
    totalValue: number
    averageBid: number
    bidHistory: Array<{
      timestamp: Date
      amount: number
      bidderId: string
    }>
  }
  settings: {
    autoExtend: boolean
    extendDuration: number // in minutes
    maxExtensions: number
    currentExtensions: number
    requireVerification: boolean
    allowProxyBidding: boolean
    showBidderNames: boolean
    enableBuyNow: boolean
    enableBuyNow: boolean
    enableReserve: boolean
    withdrawalPenaltyBps: number
    withdrawalLockPeriod: number
    bidExpirationPeriod: number
    autoSettle: boolean
    secureEscrow: boolean
  }
  paymentToken: string
  fees: {
    platformFee: number
    paymentProcessorFee: number
    totalFees: number
    feeStructure: 'percentage' | 'fixed' | 'hybrid'
  }
  timeline: {
    createdAt: Date
    publishedAt?: Date
    startedAt?: Date
    endedAt?: Date
    lastBidAt?: Date
    extendedAt?: Array<Date>
  }
  location: {
    country: string
    city: string
    address?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  shipping: {
    method: 'pickup' | 'delivery' | 'both'
    cost: number
    costType: 'fixed' | 'percentage'
    sellerPays: boolean
    international: boolean
    restrictions?: string[]
  }
  terms: {
    paymentDeadline: number // in days
    returnPolicy: string
    warranty?: string
    conditions: string[]
    specialTerms?: string
  }
  tags: string[]
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// Auction schema
const AuctionSchema = new Schema<IAuction>({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 5000
  },
  assetId: {
    type: String,
    required: true,
    ref: 'Asset',
    index: true
  },
  sellerId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['art', 'collectibles', 'real-estate', 'vehicles', 'electronics', 'jewelry', 'watches', 'furniture', 'books', 'music', 'sports', 'other'],
    index: true
  },
  startingBid: {
    type: Number,
    required: true,
    min: 0
  },
  currentBid: {
    type: Number,
    default: 0,
    min: 0
  },
  minBidIncrement: {
    type: Number,
    required: true,
    min: 0.01,
    default: 1
  },
  reservePrice: {
    type: Number,
    min: 0
  },
  buyNowPrice: {
    type: Number,
    min: 0
  },
  endTime: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'pending', 'active', 'ended', 'cancelled', 'sold'],
    default: 'draft',
    index: true
  },
  auctionType: {
    type: String,
    required: true,
    enum: ['english', 'dutch', 'sealed-bid', 'no-loss'],
    default: 'english'
  },
  visibility: {
    type: String,
    required: true,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: Number,
    default: 0,
    index: true
  },
  bids: [{
    id: {
      type: String,
      required: true
    },
    bidderId: {
      type: String,
      required: true,
      ref: 'User'
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isWinning: {
      type: Boolean,
      default: false
    },
    transactionHash: String,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending'
    }
  }],
  winner: {
    userId: {
      type: String,
      ref: 'User'
    },
    amount: Number,
    timestamp: Date,
    transactionHash: String
  },
  metrics: {
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    watchers: {
      type: Number,
      default: 0,
      min: 0
    },
    bids: {
      type: Number,
      default: 0,
      min: 0
    },
    uniqueBidders: {
      type: Number,
      default: 0,
      min: 0
    },
    totalValue: {
      type: Number,
      default: 0,
      min: 0
    },
    averageBid: {
      type: Number,
      default: 0,
      min: 0
    },
    bidHistory: [{
      timestamp: {
        type: Date,
        default: Date.now
      },
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      bidderId: {
        type: String,
        required: true,
        ref: 'User'
      }
    }]
  },
  settings: {
    autoExtend: {
      type: Boolean,
      default: false
    },
    extendDuration: {
      type: Number,
      default: 10, // 10 minutes
      min: 1,
      max: 60
    },
    maxExtensions: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    },
    currentExtensions: {
      type: Number,
      default: 0,
      min: 0
    },
    requireVerification: {
      type: Boolean,
      default: true
    },
    allowProxyBidding: {
      type: Boolean,
      default: true
    },
    showBidderNames: {
      type: Boolean,
      default: false
    },
    enableBuyNow: {
      type: Boolean,
      default: false
    },
    enableReserve: {
      type: Boolean,
      default: true
    },
    withdrawalPenaltyBps: {
      type: Number,
      default: 0,
      min: 0,
      max: 10000
    },
    withdrawalLockPeriod: {
      type: Number,
      default: 0,
      min: 0
    },
    bidExpirationPeriod: {
      type: Number,
      default: 0,
      min: 0
    },
    autoSettle: {
      type: Boolean,
      default: false
    },
    secureEscrow: {
      type: Boolean,
      default: true
    }
  },
  paymentToken: {
    type: String,
    default: '0x0000000000000000000000000000000000000000' // ETH default
  },
  fees: {
    platformFee: {
      type: Number,
      default: 2.5,
      min: 0,
      max: 20
    },
    paymentProcessorFee: {
      type: Number,
      default: 2.9,
      min: 0,
      max: 10
    },
    totalFees: {
      type: Number,
      default: 5.4,
      min: 0
    },
    feeStructure: {
      type: String,
      enum: ['percentage', 'fixed', 'hybrid'],
      default: 'percentage'
    }
  },
  timeline: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    publishedAt: Date,
    startedAt: Date,
    endedAt: Date,
    lastBidAt: Date,
    extendedAt: [Date]
  },
  location: {
    country: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^[A-Z]{2}$/.test(v)
        },
        message: 'Invalid country code (use ISO 3166-1 alpha-2)'
      }
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    coordinates: {
      lat: {
        type: Number,
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  shipping: {
    method: {
      type: String,
      required: true,
      enum: ['pickup', 'delivery', 'both'],
      default: 'both'
    },
    cost: {
      type: Number,
      default: 0,
      min: 0
    },
    costType: {
      type: String,
      enum: ['fixed', 'percentage'],
      default: 'fixed'
    },
    sellerPays: {
      type: Boolean,
      default: false
    },
    international: {
      type: Boolean,
      default: false
    },
    restrictions: [String]
  },
  terms: {
    paymentDeadline: {
      type: Number,
      default: 7,
      min: 1,
      max: 30
    },
    returnPolicy: {
      type: String,
      required: true,
      trim: true
    },
    warranty: String,
    conditions: [{
      type: String,
      trim: true
    }],
    specialTerms: {
      type: String,
      trim: true
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      return ret
    }
  }
})

// Indexes
AuctionSchema.index({ title: 'text', description: 'text', tags: 'text' })
AuctionSchema.index({ category: 1, status: 1 })
AuctionSchema.index({ sellerId: 1, status: 1 })
AuctionSchema.index({ endTime: 1, status: 1 })
AuctionSchema.index({ featured: 1, priority: -1, endTime: -1 })
AuctionSchema.index({ 'metrics.views': -1 })
AuctionSchema.index({ 'metrics.bids': -1 })
AuctionSchema.index({ 'metrics.uniqueBidders': -1 })
AuctionSchema.index({ createdAt: -1 })

// Pre-save middleware
AuctionSchema.pre('save', function (next) {
  // Update metrics
  this.metrics.bids = this.bids.length
  this.metrics.uniqueBidders = new Set(this.bids.map(bid => bid.bidderId.toString())).size
  this.metrics.totalValue = this.bids.reduce((sum, bid) => sum + bid.amount, 0)
  this.metrics.averageBid = this.metrics.bids > 0 ? this.metrics.totalValue / this.metrics.bids : 0

  // Update current bid
  if (this.bids.length > 0) {
    const highestBid = this.bids.reduce((max, bid) => bid.amount > max.amount ? bid : max)
    this.currentBid = highestBid.amount
    this.timeline.lastBidAt = highestBid.timestamp
  }

  // Update bid history
  this.metrics.bidHistory = this.bids.map(bid => ({
    timestamp: bid.timestamp,
    amount: bid.amount,
    bidderId: bid.bidderId
  }))

  next()
})

// Instance methods
AuctionSchema.methods.addBid = function (bidderId: string, amount: number, transactionHash?: string) {
  const bid = {
    id: new mongoose.Types.ObjectId().toString(),
    bidderId,
    amount,
    timestamp: new Date(),
    isWinning: false,
    transactionHash,
    status: 'pending'
  }

  // Mark previous winning bid as not winning
  this.bids.forEach(b => b.isWinning = false)

  // Mark new bid as winning
  bid.isWinning = true

  this.bids.push(bid)
  return this.save()
}

AuctionSchema.methods.removeBid = function (bidId: string) {
  const bidIndex = this.bids.findIndex(bid => bid.id === bidId)
  if (bidIndex !== -1) {
    this.bids.splice(bidIndex, 1)

    // Recalculate winning bid
    if (this.bids.length > 0) {
      const highestBid = this.bids.reduce((max, bid) => bid.amount > max.amount ? bid : max)
      highestBid.isWinning = true
    }
  }

  return this.save()
}

AuctionSchema.methods.incrementViews = function () {
  this.metrics.views += 1
  return this.save()
}

AuctionSchema.methods.incrementWatchers = function () {
  this.metrics.watchers += 1
  return this.save()
}

AuctionSchema.methods.extendAuction = function () {
  if (this.settings.autoExtend && this.settings.currentExtensions < this.settings.maxExtensions) {
    const newEndTime = new Date(this.endTime.getTime() + this.settings.extendDuration * 60 * 1000)
    this.endTime = newEndTime
    this.settings.currentExtensions += 1
    this.timeline.extendedAt.push(newEndTime)
    return this.save()
  }
  return Promise.resolve(this)
}

AuctionSchema.methods.endAuction = function () {
  this.status = 'ended'
  this.timeline.endedAt = new Date()

  if (this.bids.length > 0) {
    const winningBid = this.bids.find(bid => bid.isWinning)
    if (winningBid) {
      this.winner = {
        userId: winningBid.bidderId,
        amount: winningBid.amount,
        timestamp: winningBid.timestamp,
        transactionHash: winningBid.transactionHash
      }
      this.status = 'sold'
    }
  }

  return this.save()
}

AuctionSchema.methods.cancelAuction = function (reason?: string) {
  this.status = 'cancelled'
  this.metadata.cancellationReason = reason
  this.timeline.endedAt = new Date()
  return this.save()
}

AuctionSchema.methods.canBid = function (bidAmount: number) {
  // Check if auction is active
  if (this.status !== 'active') return false

  // Check if auction has ended
  if (new Date() > this.endTime) return false

  // Check if bid meets minimum increment
  const minBid = this.currentBid + this.minBidIncrement
  if (bidAmount < minBid) return false

  // Check reserve price (if enabled)
  if (this.settings.enableReserve && this.reservePrice && bidAmount < this.reservePrice) {
    return false
  }

  return true
}

// Static methods
AuctionSchema.statics.findBySeller = function (sellerId: string) {
  return this.find({ sellerId })
}

AuctionSchema.statics.findByCategory = function (category: string) {
  return this.find({ category, status: 'active' })
}

AuctionSchema.statics.findActive = function () {
  return this.find({
    status: 'active',
    endTime: { $gt: new Date() },
    visibility: 'public'
  })
}

AuctionSchema.statics.findEndingSoon = function (hours = 24) {
  const endTime = new Date(Date.now() + hours * 60 * 60 * 1000)
  return this.find({
    status: 'active',
    endTime: { $lte: endTime, $gt: new Date() },
    visibility: 'public'
  }).sort({ endTime: 1 })
}

AuctionSchema.statics.findFeatured = function (limit = 10) {
  return this.find({
    featured: true,
    status: 'active',
    visibility: 'public'
  })
    .sort({ priority: -1, endTime: 1 })
    .limit(limit)
}

AuctionSchema.statics.searchAuctions = function (query: string, filters: any = {}) {
  const searchQuery: any = {
    $text: { $search: query },
    status: 'active',
    visibility: 'public',
    endTime: { $gt: new Date() }
  }

  if (filters.category) {
    searchQuery.category = filters.category
  }

  if (filters.minPrice || filters.maxPrice) {
    searchQuery.startingBid = {}
    if (filters.minPrice) {
      searchQuery.startingBid.$gte = filters.minPrice
    }
    if (filters.maxPrice) {
      searchQuery.startingBid.$lte = filters.maxPrice
    }
  }

  if (filters.location) {
    searchQuery['location.country'] = filters.location
  }

  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
}

// Virtual fields
AuctionSchema.virtual('isExpired').get(function () {
  return new Date() > this.endTime
})

AuctionSchema.virtual('timeRemaining').get(function () {
  const now = new Date()
  const endTime = new Date(this.endTime)
  return endTime.getTime() - now.getTime()
})

AuctionSchema.virtual('bidCount').get(function () {
  return this.bids.length
})

AuctionSchema.virtual('highestBid').get(function () {
  return this.bids.length > 0 ? Math.max(...this.bids.map(bid => bid.amount)) : this.startingBid
})

AuctionSchema.virtual('hasWinner').get(function () {
  return !!this.winner
})

AuctionSchema.virtual('nextMinimumBid').get(function () {
  return this.currentBid + this.minBidIncrement
})

// Create and export Auction model
export const Auction = mongoose.model<IAuction>('Auction', AuctionSchema)
