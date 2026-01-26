import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

// User interface
export interface IUser extends Document {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  walletAddress?: string
  role: 'user' | 'admin' | 'moderator'
  isActive: boolean
  emailVerified: boolean
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  twoFactorEnabled: boolean
  twoFactorSecret?: string
  recoveryCodes: string[]
  securityQuestions: Array<{
    question: string
    answer: string
  }>
  kycVerified: boolean
  kycDocuments?: Array<{
    type: string
    url: string
    uploadedAt: Date
    status: 'pending' | 'approved' | 'rejected'
  }>
  profile: {
    avatar?: string
    bio?: string
    phone?: string
    country?: string
    dateOfBirth?: Date
  }
  preferences: {
    language: string
    timezone: string
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
      auction: boolean
      bid: boolean
      payment: boolean
    }
    privacy: {
      showProfile: boolean
      showActivity: boolean
      allowMessages: boolean
    }
  }
  security: {
    lastPasswordChange?: Date
    lastLoginAt?: Date
    loginAttempts: number
    lockUntil?: Date
    passwordChangedAt?: Date
  }
  apiKeys: Array<{
    name: string
    key: string
    permissions: string[]
    createdAt: Date
    lastUsed?: Date
    isActive: boolean
  }>
  refreshTokens: string[]
  passwordResetToken?: string
  passwordResetExpires?: Date
  onboarding: {
    status: 'new' | 'in-progress' | 'completed'
    completedSteps: string[]
    lastStep: string
  }
  createdAt: Date
  updatedAt: Date
}

// User schema
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  walletAddress: {
    type: String,
    validate: {
      validator: function (v: string) {
        return /^0x[a-fA-F0-9]{40}$/.test(v)
      },
      message: 'Invalid Ethereum address format'
    },
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  recoveryCodes: [{
    type: String,
    select: false
  }],
  securityQuestions: [{
    question: String,
    answer: {
      type: String,
      select: false
    }
  }],
  kycVerified: {
    type: Boolean,
    default: false
  },
  kycDocuments: [{
    type: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  profile: {
    avatar: String,
    bio: {
      type: String,
      maxlength: 500
    },
    phone: {
      type: String,
      validate: {
        validator: function (v: string) {
          return /^\+?[1-9]\d{1,14}$/.test(v)
        },
        message: 'Invalid phone number format'
      }
    },
    country: {
      type: String,
      validate: {
        validator: function (v: string) {
          return /^[A-Z]{2}$/.test(v)
        },
        message: 'Invalid country code (use ISO 3166-1 alpha-2)'
      }
    },
    dateOfBirth: Date
  },
  preferences: {
    language: {
      type: String,
      default: 'en',
      validate: {
        validator: function (v: string) {
          return /^[a-z]{2}(-[A-Z]{2})?$/.test(v)
        },
        message: 'Invalid language code format'
      }
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      auction: {
        type: Boolean,
        default: true
      },
      bid: {
        type: Boolean,
        default: true
      },
      payment: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      showProfile: {
        type: Boolean,
        default: true
      },
      showActivity: {
        type: Boolean,
        default: true
      },
      allowMessages: {
        type: Boolean,
        default: true
      }
    }
  },
  security: {
    lastPasswordChange: Date,
    lastLoginAt: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,
    passwordChangedAt: Date
  },
  apiKeys: [{
    name: {
      type: String,
      required: true
    },
    key: {
      type: String,
      required: true,
      unique: true
    },
    permissions: [{
      type: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastUsed: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  refreshTokens: [{
    type: String,
    select: false
  }],
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  onboarding: {
    status: {
      type: String,
      enum: ['new', 'in-progress', 'completed'],
      default: 'new'
    },
    completedSteps: [String],
    lastStep: String
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.password
      delete ret.refreshTokens
      delete ret.emailVerificationToken
      delete ret.emailVerificationExpires
      delete ret.passwordResetToken
      delete ret.passwordResetExpires
      delete ret.twoFactorSecret
      return ret
    }
  }
})

// Indexes
UserSchema.index({ email: 1 })
UserSchema.index({ walletAddress: 1 })
UserSchema.index({ 'apiKeys.key': 1 })
UserSchema.index({ createdAt: -1 })

// Pre-save middleware for password hashing
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const saltRounds = 12
    this.password = await bcrypt.hash(this.password, saltRounds)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Instance methods
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.lockUntil': 1 },
      $set: { 'security.loginAttempts': 1 }
    })
  }

  const updates: any = { $inc: { 'security.loginAttempts': 1 } }

  // Lock account after 5 failed attempts for 2 hours
  if (this.security.loginAttempts + 1 >= 5 && !this.security.lockUntil) {
    updates.$set = { 'security.lockUntil': Date.now() + 2 * 60 * 60 * 1000 }
  }

  return this.updateOne(updates)
}

UserSchema.methods.isLocked = function (): boolean {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now())
}

// Static methods
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() })
}

UserSchema.statics.findByWalletAddress = function (walletAddress: string) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() })
}

// Virtual fields
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`
})

UserSchema.virtual('isAccountLocked').get(function () {
  return this.isLocked()
})

// Create and export User model
export const User = mongoose.model<IUser>('User', UserSchema)
