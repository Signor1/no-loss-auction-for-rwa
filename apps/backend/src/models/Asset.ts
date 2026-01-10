import mongoose, { Document, Schema } from 'mongoose'

// Asset interface
export interface IAsset extends Document {
  id: string
  title: string
  description: string
  category: string
  subcategory?: string
  condition: 'new' | 'like-new' | 'excellent' | 'very-good' | 'good' | 'fair' | 'poor'
  location: {
    country: string
    city: string
    address?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  specifications: Record<string, any>
  images: Array<{
    url: string
    alt: string
    order: number
    isPrimary: boolean
  }>
  videos?: Array<{
    url: string
    title: string
    duration: number
    thumbnail: string
  }>
  documents?: Array<{
    title: string
    url: string
    type: string
    size: number
  }>
  valuation: {
    estimatedValue: number
    currency: string
    appraisalDate?: Date
    appraisalReport?: string
  }
  ownership: {
    currentOwner: string
    ownershipHistory: Array<{
      owner: string
      acquisitionDate: Date
      acquisitionMethod: string
      price?: number
    }>
    provenance?: string
    certificates?: Array<{
      type: string
      issuer: string
      number: string
      issueDate: Date
      url: string
    }>
  }
  metadata: {
    tags: string[]
    keywords: string[]
    attributes: Record<string, any>
    rarity?: 'common' | 'uncommon' | 'rare' | 'very-rare' | 'legendary'
    edition?: string
    series?: string
    artist?: string
    manufacturer?: string
    model?: string
    year?: number
    serialNumber?: string
  }
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'sold' | 'withdrawn'
  visibility: 'public' | 'private' | 'unlisted'
  featured: boolean
  priority: number
  views: number
  likes: number
  shares: number
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  expiresAt?: Date
}

// Asset schema
const AssetSchema = new Schema<IAsset>({
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
  category: {
    type: String,
    required: true,
    enum: ['art', 'collectibles', 'real-estate', 'vehicles', 'electronics', 'jewelry', 'watches', 'furniture', 'books', 'music', 'sports', 'other'],
    index: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    required: true,
    enum: ['new', 'like-new', 'excellent', 'very-good', 'good', 'fair', 'poor']
  },
  location: {
    country: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
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
  specifications: {
    type: Schema.Types.Mixed,
    default: {}
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      default: 0
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  videos: [{
    url: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    thumbnail: {
      type: String,
      required: true
    }
  }],
  documents: [{
    title: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  }],
  valuation: {
    estimatedValue: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      enum: ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'INR', 'BRL', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'RUB', 'ZAR', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'VES', 'ETH', 'BTC'],
      default: 'USD'
    },
    appraisalDate: Date,
    appraisalReport: String
  },
  ownership: {
    currentOwner: {
      type: String,
      required: true,
      ref: 'User',
      index: true
    },
    ownershipHistory: [{
      owner: {
        type: String,
        required: true,
        ref: 'User'
      },
      acquisitionDate: {
        type: Date,
        required: true
      },
      acquisitionMethod: {
        type: String,
        required: true,
        enum: ['purchase', 'inheritance', 'gift', 'trade', 'found', 'created', 'other']
      },
      price: Number
    }],
    provenance: String,
    certificates: [{
      type: {
        type: String,
        required: true
      },
      issuer: {
        type: String,
        required: true
      },
      number: {
        type: String,
        required: true
      },
      issueDate: {
        type: Date,
        required: true
      },
      url: {
        type: String,
        required: true
      }
    }]
  },
  metadata: {
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    attributes: {
      type: Schema.Types.Mixed,
      default: {}
    },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'very-rare', 'legendary']
    },
    edition: String,
    series: String,
    artist: String,
    manufacturer: String,
    model: String,
    year: {
      type: Number,
      min: 1000,
      max: new Date().getFullYear() + 1
    },
    serialNumber: String
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'pending', 'approved', 'rejected', 'active', 'sold', 'withdrawn'],
    default: 'draft',
    index: true
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
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  shares: {
    type: Number,
    default: 0,
    min: 0
  },
  publishedAt: Date,
  expiresAt: Date
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      return ret
    }
  }
})

// Indexes
AssetSchema.index({ title: 'text', description: 'text', 'metadata.tags': 'text', 'metadata.keywords': 'text' })
AssetSchema.index({ category: 1, status: 1 })
AssetSchema.index({ 'ownership.currentOwner': 1, status: 1 })
AssetSchema.index({ featured: 1, priority: -1, createdAt: -1 })
AssetSchema.index({ views: -1 })
AssetSchema.index({ likes: -1 })
AssetSchema.index({ publishedAt: -1 })
AssetSchema.index({ expiresAt: 1 })

// Pre-save middleware
AssetSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'approved' && !this.publishedAt) {
    this.publishedAt = new Date()
  }
  next()
})

// Instance methods
AssetSchema.methods.incrementViews = async function() {
  this.views += 1
  return this.save()
}

AssetSchema.methods.incrementLikes = async function() {
  this.likes += 1
  return this.save()
}

AssetSchema.methods.decrementLikes = async function() {
  if (this.likes > 0) {
    this.likes -= 1
  }
  return this.save()
}

AssetSchema.methods.incrementShares = async function() {
  this.shares += 1
  return this.save()
}

AssetSchema.methods.getPrimaryImage = function() {
  const primaryImage = this.images.find(img => img.isPrimary)
  return primaryImage || this.images[0]
}

AssetSchema.methods.addOwnershipRecord = function(ownerId: string, acquisitionMethod: string, price?: number) {
  this.ownership.ownershipHistory.push({
    owner: ownerId,
    acquisitionDate: new Date(),
    acquisitionMethod,
    price
  })
  this.ownership.currentOwner = ownerId
  return this.save()
}

// Static methods
AssetSchema.statics.findByOwner = function(ownerId: string) {
  return this.find({ 'ownership.currentOwner': userId })
}

AssetSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, status: 'approved' })
}

AssetSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ featured: true, status: 'approved' })
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit)
}

AssetSchema.statics.searchAssets = function(query: string, filters: any = {}) {
  const searchQuery: any = {
    $text: { $search: query },
    status: 'approved',
    visibility: 'public'
  }

  if (filters.category) {
    searchQuery.category = filters.category
  }

  if (filters.condition) {
    searchQuery.condition = filters.condition
  }

  if (filters.minPrice || filters.maxPrice) {
    searchQuery['valuation.estimatedValue'] = {}
    if (filters.minPrice) {
      searchQuery['valuation.estimatedValue'].$gte = filters.minPrice
    }
    if (filters.maxPrice) {
      searchQuery['valuation.estimatedValue'].$lte = filters.maxPrice
    }
  }

  if (filters.location) {
    searchQuery['location.country'] = filters.location
  }

  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
}

// Virtual fields
AssetSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date()
})

AssetSchema.virtual('isAvailable').get(function() {
  return this.status === 'approved' && this.visibility === 'public' && !this.isExpired
})

AssetSchema.virtual('averageRating').get(function() {
  // This would be calculated from reviews in a real implementation
  return 0
})

// Create and export Asset model
export const Asset = mongoose.model<IAsset>('Asset', AssetSchema)
