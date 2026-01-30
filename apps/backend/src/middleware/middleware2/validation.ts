import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationError } from 'express-validator'

// Validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: any) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }))

    return res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors
    })
  }

  next()
}

// Custom validation rules
export const customValidations = {
  // Validate Ethereum address
  isEthereumAddress: (value: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(value)
  },

  // Validate strong password
  isStrongPassword: (value: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value)
  },

  // Validate phone number
  isPhoneNumber: (value: string) => {
    return /^\+?[1-9]\d{1,14}$/.test(value)
  },

  // Validate country code
  isCountryCode: (value: string) => {
    return /^[A-Z]{2}$/.test(value)
  },

  // Validate language code
  isLanguageCode: (value: string) => {
    return /^[a-z]{2}(-[A-Z]{2})?$/.test(value)
  },

  // Validate UUID
  isUUID: (value: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  },

  // Validate auction title
  isAuctionTitle: (value: string) => {
    return value.length >= 5 && value.length <= 100
  },

  // Validate bid amount
  isBidAmount: (value: number) => {
    return value > 0 && value <= 1000 // Max 1000 ETH
  },

  // Validate file size (in bytes)
  isFileSizeValid: (size: number, maxSize: number = 10 * 1024 * 1024) => {
    return size <= maxSize
  },

  // Validate file type
  isFileTypeValid: (filename: string, allowedTypes: string[]) => {
    const extension = filename.split('.').pop()?.toLowerCase()
    return extension ? allowedTypes.includes(extension) : false
  }
}

// Error messages
export const errorMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  password: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  ethereumAddress: 'Please enter a valid Ethereum address',
  phoneNumber: 'Please enter a valid phone number',
  countryCode: 'Please enter a valid 2-letter country code',
  languageCode: 'Please enter a valid language code (e.g., en, en-US)',
  uuid: 'Please enter a valid UUID',
  auctionTitle: 'Auction title must be between 5 and 100 characters',
  bidAmount: 'Bid amount must be greater than 0 and less than or equal to 1000 ETH',
  fileSize: 'File size must be less than 10MB',
  fileType: 'Invalid file type',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
  min: (min: number) => `Must be at least ${min}`,
  max: (max: number) => `Must be no more than ${max}`,
  numeric: 'Must be a number',
  integer: 'Must be an integer',
  positive: 'Must be a positive number',
  date: 'Must be a valid date',
  url: 'Must be a valid URL',
  array: 'Must be an array',
  object: 'Must be an object',
  boolean: 'Must be true or false'
}

// Sanitization functions
export const sanitization = {
  // Trim whitespace
  trim: (value: string) => value.trim(),

  // Convert to lowercase
  toLowerCase: (value: string) => value.toLowerCase(),

  // Remove HTML tags
  stripHTML: (value: string) => value.replace(/<[^>]*>/g, ''),

  // Escape HTML
  escapeHTML: (value: string) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return value.replace(/[&<>"']/g, (m) => map[m])
  },

  // Remove special characters
  removeSpecialChars: (value: string) => value.replace(/[^a-zA-Z0-9]/g, ''),

  // Format phone number
  formatPhone: (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `+1${cleaned}`
    }
    return value
  },

  // Format Ethereum address
  formatEthereumAddress: (value: string) => {
    if (!value.startsWith('0x')) {
      return `0x${value}`
    }
    return value
  }
}

// Validation schemas
export const validationSchemas = {
  // User registration
  register: {
    email: {
      isEmail: true,
      normalizeEmail: true,
      errorMessage: errorMessages.email
    },
    password: {
      isLength: { options: { min: 8 } },
      matches: {
        options: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/]
      },
      errorMessage: errorMessages.password
    },
    firstName: {
      isLength: { options: { min: 2, max: 50 } },
      trim: true,
      errorMessage: 'First name must be between 2 and 50 characters'
    },
    lastName: {
      isLength: { options: { min: 2, max: 50 } },
      trim: true,
      errorMessage: 'Last name must be between 2 and 50 characters'
    },
    walletAddress: {
      optional: true,
      matches: {
        options: [/^0x[a-fA-F0-9]{40}$/]
      },
      errorMessage: errorMessages.ethereumAddress
    }
  },

  // User login
  login: {
    email: {
      isEmail: true,
      normalizeEmail: true,
      errorMessage: errorMessages.email
    },
    password: {
      notEmpty: true,
      errorMessage: errorMessages.required
    }
  },

  // Auction creation
  createAuction: {
    title: {
      isLength: { options: { min: 5, max: 100 } },
      trim: true,
      errorMessage: errorMessages.auctionTitle
    },
    description: {
      isLength: { options: { min: 10, max: 2000 } },
      trim: true,
      errorMessage: 'Description must be between 10 and 2000 characters'
    },
    startingBid: {
      isFloat: { options: { min: 0.01, max: 1000 } },
      errorMessage: 'Starting bid must be between 0.01 and 1000 ETH'
    },
    endTime: {
      isISO8601: true,
      custom: {
        options: (value: string) => {
          const endTime = new Date(value)
          const now = new Date()
          const minEndTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
          const maxEndTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          return endTime > minEndTime && endTime < maxEndTime
        }
      },
      errorMessage: 'End time must be between 1 hour and 30 days from now'
    },
    category: {
      isIn: {
        options: [['art', 'collectibles', 'real-estate', 'vehicles', 'electronics', 'jewelry', 'other']]
      },
      errorMessage: 'Invalid category'
    }
  },

  // Bid placement
  placeBid: {
    amount: {
      isFloat: { options: { min: 0.01, max: 1000 } },
      errorMessage: 'Bid amount must be between 0.01 and 1000 ETH'
    },
    auctionId: {
      isUUID: true,
      errorMessage: errorMessages.uuid
    }
  },

  // Profile update
  updateProfile: {
    firstName: {
      optional: true,
      isLength: { options: { min: 2, max: 50 } },
      trim: true,
      errorMessage: 'First name must be between 2 and 50 characters'
    },
    lastName: {
      optional: true,
      isLength: { options: { min: 2, max: 50 } },
      trim: true,
      errorMessage: 'Last name must be between 2 and 50 characters'
    },
    bio: {
      optional: true,
      isLength: { options: { max: 500 } },
      trim: true,
      errorMessage: 'Bio must be no more than 500 characters'
    },
    phone: {
      optional: true,
      matches: {
        options: [/^\+?[1-9]\d{1,14}$/]
      },
      errorMessage: errorMessages.phoneNumber
    },
    country: {
      optional: true,
      matches: {
        options: [/^[A-Z]{2}$/]
      },
      errorMessage: errorMessages.countryCode
    }
  },

  // Password change
  changePassword: {
    currentPassword: {
      notEmpty: true,
      errorMessage: 'Current password is required'
    },
    newPassword: {
      isLength: { options: { min: 8 } },
      matches: {
        options: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/]
      },
      errorMessage: errorMessages.password
    }
  },

  // File upload
  fileUpload: {
    filename: {
      notEmpty: true,
      errorMessage: 'Filename is required'
    },
    mimetype: {
      isIn: {
        options: [['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']]
      },
      errorMessage: 'Invalid file type'
    },
    size: {
      isInt: { options: { max: 10 * 1024 * 1024 } },
      errorMessage: errorMessages.fileSize
    }
  },

  // Payment creation
  createPayment: {
    auctionId: {
      optional: true,
      isMongoId: true,
      errorMessage: 'Invalid auction ID'
    },
    amount: {
      isFloat: { options: { min: 0.01 } },
      errorMessage: 'Amount must be at least 0.01'
    },
    currency: {
      isIn: { options: [['ETH', 'USDC', 'USDT']] },
      errorMessage: 'Invalid currency'
    },
    type: {
      isIn: { options: [['bid', 'refund', 'fee', 'withdrawal']] },
      errorMessage: 'Invalid payment type'
    },
    method: {
      isIn: { options: [['crypto', 'fiat']] },
      errorMessage: 'Invalid payment method'
    },
    gateway: {
      isIn: { options: [['on-chain', 'stripe', 'coinbase-pay']] },
      errorMessage: 'Invalid gateway'
    }
  },

  // Refund processing
  processRefund: {
    paymentId: {
      isMongoId: true,
      errorMessage: 'Invalid payment ID'
    },
    amount: {
      optional: true,
      isFloat: { options: { min: 0.01 } },
      errorMessage: 'Refund amount must be at least 0.01'
    },
    reason: {
      optional: true,
      isString: true,
      isLength: { options: { max: 500 } },
      errorMessage: 'Reason must be a string up to 500 characters'
    }
  },

  // Financial summary query
  financialDateRange: {
    startDate: {
      optional: true,
      isISO8601: true,
      errorMessage: 'Invalid start date'
    },
    endDate: {
      optional: true,
      isISO8601: true,
      errorMessage: 'Invalid end date'
    }
  },

  // Payout history query
  payoutHistory: {
    userId: {
      optional: true,
      isMongoId: true,
      errorMessage: 'Invalid user ID'
    },
    limit: {
      optional: true,
      isInt: { options: { min: 1, max: 100 } },
      errorMessage: 'Limit must be between 1 and 100'
    },
    offset: {
      optional: true,
      isInt: { options: { min: 0 } },
      errorMessage: 'Offset must be a non-negative integer'
    }
  }
}

// Async validation functions
export const asyncValidations = {
  // Check if email is unique
  isEmailUnique: async (email: string, excludeUserId?: string) => {
    const User = require('../models/User').User
    const query: any = { email: email.toLowerCase() }
    if (excludeUserId) {
      query._id = { $ne: excludeUserId }
    }
    const existingUser = await User.findOne(query)
    return !existingUser
  },

  // Check if wallet address is unique
  isWalletAddressUnique: async (walletAddress: string, excludeUserId?: string) => {
    const User = require('../models/User').User
    const query: any = { walletAddress: walletAddress.toLowerCase() }
    if (excludeUserId) {
      query._id = { $ne: excludeUserId }
    }
    const existingUser = await User.findOne(query)
    return !existingUser
  },

  // Check if auction exists
  doesAuctionExist: async (auctionId: string) => {
    const Auction = require('../models/Auction').Auction
    const auction = await Auction.findById(auctionId)
    return !!auction
  },

  // Check if user owns auction
  doesUserOwnAuction: async (auctionId: string, userId: string) => {
    const Auction = require('../models/Auction').Auction
    const auction = await Auction.findOne({ _id: auctionId, sellerId: userId })
    return !!auction
  },

  // Check if bid amount is valid
  isValidBidAmount: async (auctionId: string, bidAmount: number) => {
    const Auction = require('../models/Auction').Auction
    const auction = await Auction.findById(auctionId)
    if (!auction) return false

    // Check if bid is higher than current bid and meets minimum bid increment
    const minBid = auction.currentBid + auction.minBidIncrement
    return bidAmount >= minBid
  }
}
