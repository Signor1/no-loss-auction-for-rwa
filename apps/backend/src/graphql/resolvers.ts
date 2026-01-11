import { AuthenticationError, AuthorizationError, NotFoundError } from '../middleware/errorHandler'
import { User } from '../models/User'
import { Asset } from '../models/Asset'
import { Auction } from '../models/Auction'
import { generateToken, generateRefreshToken, comparePassword } from '../middleware/auth'
import { PubSub } from 'graphql-subscriptions'
import { withFilter } from 'graphql-subscriptions/dist/with-filter'
import { GraphQLUpload } from 'graphql-upload'
import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language'
import DataLoader from 'dataloader'

// PubSub instance for subscriptions
const pubsub = new PubSub()

// DataLoader instances for efficient data fetching
const userLoader = new DataLoader(async (ids: string[]) => {
  const users = await User.find({ _id: { $in: ids } })
  return ids.map(id => users.find(user => user.id === id))
})

const assetLoader = new DataLoader(async (ids: string[]) => {
  const assets = await Asset.find({ _id: { $in: ids } })
  return ids.map(id => assets.find(asset => asset.id === id))
})

const auctionLoader = new DataLoader(async (ids: string[]) => {
  const auctions = await Auction.find({ _id: { $in: ids } })
  return ids.map(id => auctions.find(auction => auction.id === id))
})

// Custom scalar types
const DateTime = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: any) {
    return value instanceof Date ? value.toISOString() : null
  },
  parseValue(value: any) {
    return new Date(value)
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value)
    }
    return null
  }
})

const Upload = GraphQLUpload

const JSON = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value: any) {
    return value
  },
  parseValue(value: any) {
    return value
  },
  parseLiteral(ast) {
    return null
  }
})

const BigInt = new GraphQLScalarType({
  name: 'BigInt',
  description: 'BigInt custom scalar type',
  serialize(value: any) {
    return value.toString()
  },
  parseValue(value: any) {
    return BigInt(value)
  },
  parseLiteral(ast) {
    return null
  }
})

// Utility functions
const createCursor = (item: any, sortField: string) => {
  return Buffer.from(`${item[sortField]}|${item.id}`).toString('base64')
}

const decodeCursor = (cursor: string) => {
  const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
  const [value, id] = decoded.split('|')
  return { value, id }
}

const paginateResults = async (
  model: any,
  filter: any = {},
  sort: any = { createdAt: -1 },
  pagination: any = { page: 1, limit: 20 }
) => {
  const { page, limit } = pagination
  const skip = (page - 1) * limit

  const items = await model
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('ownership.currentOwner', 'firstName lastName email')
    .populate('sellerId', 'firstName lastName email')

  const total = await model.countDocuments(filter)
  const totalPages = Math.ceil(total / limit)

  const edges = items.map((item: any) => ({
    node: item,
    cursor: createCursor(item, Object.keys(sort)[0])
  }))

  const pageInfo = {
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    startCursor: edges.length > 0 ? edges[0].cursor : null,
    endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
    totalPages,
    currentPage: page,
    totalItems: total
  }

  return { edges, pageInfo }
}

// Resolvers
export const resolvers = {
  // Custom scalars
  DateTime,
  Upload,
  JSON,
  BigInt,

  // Query resolvers
  Query: {
    // User queries
    me: async (_: any, __: any, { user }: any) => {
      if (!user) {
        throw new AuthenticationError('Authentication required')
      }
      return userLoader.load(user.id)
    },

    user: async (_: any, { id }: { id: string }) => {
      const user = await userLoader.load(id)
      if (!user) {
        throw new NotFoundError('User not found')
      }
      return user
    },

    users: async (_: any, { filter, pagination, sort }: any) => {
      const query: any = {}
      
      if (filter) {
        if (filter.role) query.role = filter.role
        if (filter.emailVerified !== undefined) query.emailVerified = filter.emailVerified
        if (filter.kycVerified !== undefined) query.kycVerified = filter.kycVerified
        if (filter.active !== undefined) query.isActive = filter.active
        if (filter.search) {
          query.$or = [
            { firstName: { $regex: filter.search, $options: 'i' } },
            { lastName: { $regex: filter.search, $options: 'i' } },
            { email: { $regex: filter.search, $options: 'i' } }
          ]
        }
      }

      const sortQuery = sort ? { [sort.field]: sort.order === 'ASC' ? 1 : -1 } : { createdAt: -1 }
      return paginateResults(User, query, sortQuery, pagination)
    },

    // Asset queries
    asset: async (_: any, { id }: { id: string }) => {
      const asset = await assetLoader.load(id)
      if (!asset) {
        throw new NotFoundError('Asset not found')
      }
      return asset
    },

    assets: async (_: any, { filter, pagination, sort }: any) => {
      const query: any = { visibility: 'public', status: 'approved' }
      
      if (filter) {
        if (filter.category) query.category = filter.category
        if (filter.condition) query.condition = filter.condition
        if (filter.status) query.status = filter.status
        if (filter.visibility) query.visibility = filter.visibility
        if (filter.featured !== undefined) query.featured = filter.featured
        if (filter.sellerId) query['ownership.currentOwner'] = filter.sellerId
        if (filter.location) query['location.country'] = filter.location
        if (filter.tags && filter.tags.length > 0) query['metadata.tags'] = { $in: filter.tags }
        if (filter.minPrice || filter.maxPrice) {
          query['valuation.estimatedValue'] = {}
          if (filter.minPrice) query['valuation.estimatedValue'].$gte = filter.minPrice
          if (filter.maxPrice) query['valuation.estimatedValue'].$lte = filter.maxPrice
        }
        if (filter.search) {
          query.$text = { $search: filter.search }
        }
      }

      const sortQuery = sort ? { [sort.field]: sort.order === 'ASC' ? 1 : -1 } : { createdAt: -1 }
      return paginateResults(Asset, query, sortQuery, pagination)
    },

    myAssets: async (_: any, { filter, pagination, sort }: any, { user }: any) => {
      if (!user) {
        throw new AuthenticationError('Authentication required')
      }

      const query: any = { 'ownership.currentOwner': user.id }
      
      if (filter) {
        if (filter.category) query.category = filter.category
        if (filter.condition) query.condition = filter.condition
        if (filter.status) query.status = filter.status
        if (filter.visibility) query.visibility = filter.visibility
        if (filter.featured !== undefined) query.featured = filter.featured
        if (filter.minPrice || filter.maxPrice) {
          query['valuation.estimatedValue'] = {}
          if (filter.minPrice) query['valuation.estimatedValue'].$gte = filter.minPrice
          if (filter.maxPrice) query['valuation.estimatedValue'].$lte = filter.maxPrice
        }
        if (filter.search) {
          query.$text = { $search: filter.search }
        }
      }

      const sortQuery = sort ? { [sort.field]: sort.order === 'ASC' ? 1 : -1 } : { createdAt: -1 }
      return paginateResults(Asset, query, sortQuery, pagination)
    },

    featuredAssets: async (_: any, { pagination }: any) => {
      const query = { featured: true, status: 'approved', visibility: 'public' }
      const sortQuery = { priority: -1, createdAt: -1 }
      return paginateResults(Asset, query, sortQuery, pagination)
    },

    // Auction queries
    auction: async (_: any, { id }: { id: string }) => {
      const auction = await auctionLoader.load(id)
      if (!auction) {
        throw new NotFoundError('Auction not found')
      }
      return auction
    },

    auctions: async (_: any, { filter, pagination, sort }: any) => {
      const query: any = { visibility: 'public', status: 'active', endTime: { $gt: new Date() } }
      
      if (filter) {
        if (filter.category) query.category = filter.category
        if (filter.auctionType) query.auctionType = filter.auctionType
        if (filter.sellerId) query.sellerId = filter.sellerId
        if (filter.location) query['location.country'] = filter.location
        if (filter.endingSoon) {
          const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
          query.endTime = { $lte: endTime, $gt: new Date() }
        }
        if (filter.hasBids !== undefined) {
          if (filter.hasBids) {
            query['metrics.bids'] = { $gt: 0 }
          } else {
            query['metrics.bids'] = 0
          }
        }
        if (filter.minPrice || filter.maxPrice) {
          query.startingBid = {}
          if (filter.minPrice) query.startingBid.$gte = filter.minPrice
          if (filter.maxPrice) query.startingBid.$lte = filter.maxPrice
        }
        if (filter.search) {
          query.$text = { $search: filter.search }
        }
      }

      const sortQuery = sort ? { [sort.field]: sort.order === 'ASC' ? 1 : -1 } : { endTime: 1 }
      return paginateResults(Auction, query, sortQuery, pagination)
    },

    myAuctions: async (_: any, { filter, pagination, sort }: any, { user }: any) => {
      if (!user) {
        throw new AuthenticationError('Authentication required')
      }

      const query: any = { sellerId: user.id }
      
      if (filter) {
        if (filter.category) query.category = filter.category
        if (filter.auctionType) query.auctionType = filter.auctionType
        if (filter.status) query.status = filter.status
        if (filter.minPrice || filter.maxPrice) {
          query.startingBid = {}
          if (filter.minPrice) query.startingBid.$gte = filter.minPrice
          if (filter.maxPrice) query.startingBid.$lte = filter.maxPrice
        }
        if (filter.search) {
          query.$text = { $search: filter.search }
        }
      }

      const sortQuery = sort ? { [sort.field]: sort.order === 'ASC' ? 1 : -1 } : { createdAt: -1 }
      return paginateResults(Auction, query, sortQuery, pagination)
    },

    activeAuctions: async (_: any, { pagination }: any) => {
      const query = { status: 'active', visibility: 'public', endTime: { $gt: new Date() } }
      const sortQuery = { endTime: 1 }
      return paginateResults(Auction, query, sortQuery, pagination)
    },

    endingSoonAuctions: async (_: any, { hours = 24, pagination }: any) => {
      const endTime = new Date(Date.now() + hours * 60 * 60 * 1000)
      const query = { 
        status: 'active', 
        visibility: 'public', 
        endTime: { $lte: endTime, $gt: new Date() } 
      }
      const sortQuery = { endTime: 1 }
      return paginateResults(Auction, query, sortQuery, pagination)
    },

    featuredAuctions: async (_: any, { pagination }: any) => {
      const query = { featured: true, status: 'active', visibility: 'public', endTime: { $gt: new Date() } }
      const sortQuery = { priority: -1, endTime: 1 }
      return paginateResults(Auction, query, sortQuery, pagination)
    },

    // Bid queries
    bid: async (_: any, { id }: { id: string }) => {
      const auction = await Auction.findOne({ 'bids.id': id })
      if (!auction) {
        throw new NotFoundError('Bid not found')
      }
      return auction.bids.find((bid: any) => bid.id === id)
    },

    bids: async (_: any, { auctionId, pagination, sort }: any) => {
      const auction = await auctionLoader.load(auctionId)
      if (!auction) {
        throw new NotFoundError('Auction not found')
      }

      const sortQuery = sort ? { [`bids.${sort.field}`]: sort.order === 'ASC' ? 1 : -1 } : { 'bids.timestamp': -1 }
      const sortedBids = [...auction.bids].sort((a: any, b: any) => {
        const field = Object.keys(sortQuery)[0].replace('bids.', '')
        const multiplier = sortQuery[`bids.${field}`]
        return a[field] > b[field] ? multiplier : -multiplier
      })

      const page = pagination?.page || 1
      const limit = pagination?.limit || 20
      const skip = (page - 1) * limit

      const paginatedBids = sortedBids.slice(skip, skip + limit)
      const totalPages = Math.ceil(sortedBids.length / limit)

      const edges = paginatedBids.map((bid: any) => ({
        node: bid,
        cursor: createCursor(bid, 'timestamp')
      }))

      const pageInfo = {
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        startCursor: edges.length > 0 ? edges[0].cursor : null,
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        totalPages,
        currentPage: page,
        totalItems: sortedBids.length
      }

      return { edges, pageInfo }
    },

    myBids: async (_: any, { pagination, sort }: any, { user }: any) => {
      if (!user) {
        throw new AuthenticationError('Authentication required')
      }

      const auctions = await Auction.find({ 'bids.bidderId': user.id })
      const allBids = auctions.flatMap((auction: any) => 
        auction.bids
          .filter((bid: any) => bid.bidderId.toString() === user.id)
          .map((bid: any) => ({ ...bid, auction }))
      )

      const sortQuery = sort ? { [sort.field]: sort.order === 'ASC' ? 1 : -1 } : { timestamp: -1 }
      const sortedBids = allBids.sort((a: any, b: any) => {
        const multiplier = sortQuery[sort.field]
        return a[sort.field] > b[sort.field] ? multiplier : -multiplier
      })

      const page = pagination?.page || 1
      const limit = pagination?.limit || 20
      const skip = (page - 1) * limit

      const paginatedBids = sortedBids.slice(skip, skip + limit)
      const totalPages = Math.ceil(sortedBids.length / limit)

      const edges = paginatedBids.map((bid: any) => ({
        node: bid,
        cursor: createCursor(bid, 'timestamp')
      }))

      const pageInfo = {
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        startCursor: edges.length > 0 ? edges[0].cursor : null,
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        totalPages,
        currentPage: page,
        totalItems: sortedBids.length
      }

      return { edges, pageInfo }
    },

    // Search queries
    searchAssets: async (_: any, { query, filter, pagination }: any) => {
      const searchQuery = {
        $text: { $search: query },
        visibility: 'public',
        status: 'approved'
      }

      if (filter) {
        if (filter.category) searchQuery.category = filter.category
        if (filter.condition) searchQuery.condition = filter.condition
        if (filter.minPrice || filter.maxPrice) {
          searchQuery['valuation.estimatedValue'] = {}
          if (filter.minPrice) searchQuery['valuation.estimatedValue'].$gte = filter.minPrice
          if (filter.maxPrice) searchQuery['valuation.estimatedValue'].$lte = filter.maxPrice
        }
        if (filter.location) searchQuery['location.country'] = filter.location
      }

      const sortQuery = { score: { $meta: 'textScore' } }
      return paginateResults(Asset, searchQuery, sortQuery, pagination)
    },

    searchAuctions: async (_: any, { query, filter, pagination }: any) => {
      const searchQuery = {
        $text: { $search: query },
        visibility: 'public',
        status: 'active',
        endTime: { $gt: new Date() }
      }

      if (filter) {
        if (filter.category) searchQuery.category = filter.category
        if (filter.auctionType) searchQuery.auctionType = filter.auctionType
        if (filter.minPrice || filter.maxPrice) {
          searchQuery.startingBid = {}
          if (filter.minPrice) searchQuery.startingBid.$gte = filter.minPrice
          if (filter.maxPrice) searchQuery.startingBid.$lte = filter.maxPrice
        }
        if (filter.location) searchQuery['location.country'] = filter.location
      }

      const sortQuery = { score: { $meta: 'textScore' } }
      return paginateResults(Auction, searchQuery, sortQuery, pagination)
    },

    searchUsers: async (_: any, { query, pagination }: any) => {
      const searchQuery = {
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ],
        isActive: true
      }

      const sortQuery = { firstName: 1, lastName: 1 }
      return paginateResults(User, searchQuery, sortQuery, pagination)
    },

    // Analytics queries
    userStats: async (_: any, __: any, { user }: any) => {
      if (!user) {
        throw new AuthenticationError('Authentication required')
      }

      const stats = {
        totalAssets: await Asset.countDocuments({ 'ownership.currentOwner': user.id }),
        totalAuctions: await Auction.countDocuments({ sellerId: user.id }),
        totalBids: await Auction.countDocuments({ 'bids.bidderId': user.id }),
        totalTransactions: 0, // Would be calculated from Transaction model
        totalValue: 0,
        averageBidAmount: 0,
        winRate: 0,
        reputation: 0
      }

      return stats
    },

    platformStats: async () => {
      const stats = {
        totalUsers: await User.countDocuments({ isActive: true }),
        totalAssets: await Asset.countDocuments({ status: 'approved' }),
        totalAuctions: await Auction.countDocuments({ status: 'active' }),
        totalBids: await Auction.aggregate([
          { $unwind: '$bids' },
          { $group: { _id: null, count: { $sum: 1 } } }
        ]).then(result => result[0]?.count || 0),
        totalTransactions: 0,
        totalVolume: 0,
        activeAuctions: await Auction.countDocuments({ status: 'active', endTime: { $gt: new Date() } }),
        activeUsers: await User.countDocuments({ 
          isActive: true,
          'security.lastLoginAt': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }),
        newUsersToday: await User.countDocuments({
          isActive: true,
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }),
        newAuctionsToday: await Auction.countDocuments({
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }),
        topCategories: [],
        topLocations: []
      }

      return stats
    }
  },

  // Mutation resolvers
  Mutation: {
    // Authentication mutations
    login: async (_: any, { email, password }: { email: string, password: string }) => {
      const user = await User.findOne({ email: email.toLowerCase() })
      if (!user || !await comparePassword(password, user.password)) {
        throw new AuthenticationError('Invalid credentials')
      }

      if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated')
      }

      const accessToken = generateToken(user)
      const refreshToken = generateRefreshToken(user)

      user.refreshTokens.push(refreshToken)
      user.security.lastLoginAt = new Date()
      await user.save()

      pubsub.publish('USER_LOGGED_IN', { userLoggedIn: user })

      return {
        user,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 86400 // 24 hours
        }
      }
    },

    register: async (_: any, { input }: { input: any }) => {
      const existingUser = await User.findOne({ email: input.email.toLowerCase() })
      if (existingUser) {
        throw new AuthenticationError('User already exists')
      }

      const user = new User({
        ...input,
        email: input.email.toLowerCase(),
        role: 'USER',
        isActive: true,
        emailVerified: false
      })

      await user.save()

      const accessToken = generateToken(user)
      const refreshToken = generateRefreshToken(user)

      user.refreshTokens.push(refreshToken)
      await user.save()

      pubsub.publish('USER_REGISTERED', { userRegistered: user })

      return {
        user,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 86400
        }
      }
    },

    // Asset mutations
    createAsset: async (_: any, { input }: { input: any }, { user }: any) => {
      if (!user) {
        throw new AuthenticationError('Authentication required')
      }

      const asset = new Asset({
        ...input,
        ownership: {
          currentOwner: user.id,
          ownershipHistory: [{
            owner: user.id,
            acquisitionDate: new Date(),
            acquisitionMethod: 'created'
          }]
        },
        status: 'draft'
      })

      await asset.save()

      pubsub.publish('ASSET_CREATED', { assetCreated: asset })

      return asset
    },

    updateAsset: async (_: any, { id, input }: { id: string, input: any }, { user }: any) => {
      if (!user) {
        throw new AuthenticationError('Authentication required')
      }

      const asset = await Asset.findById(id)
      if (!asset) {
        throw new NotFoundError('Asset not found')
      }

      if (asset.ownership.currentOwner.toString() !== user.id && user.role !== 'ADMIN') {
        throw new AuthorizationError('Access denied')
      }

      Object.assign(asset, input)
      await asset.save()

      pubsub.publish('ASSET_UPDATED', { assetUpdated: asset, assetId: id })

      return asset
    },

    deleteAsset: async (_: any, { id }: { id: string }, { user }: any) => {
      if (!user) {
        throw new AuthenticationError('Authentication required')
      }

      const asset = await Asset.findById(id)
      if (!asset) {
        throw new NotFoundError('Asset not found')
      }

      if (asset.ownership.currentOwner.toString() !== user.id && user.role !== 'ADMIN') {
        throw new AuthorizationError('Access denied')
      }

      await Asset.findByIdAndDelete(id)

      pubsub.publish('ASSET_DELETED', { assetDeleted: asset, assetId: id })

      return true
    },

    // Auction mutations
    createAuction: async (_: any, { input }: { input: any }, { user }: any) => {
      if (!user) {
        throw new AuthenticationError('Authentication required')
      }

      const auction = new Auction({
        ...input,
        sellerId: user.id,
        status: 'draft'
      })

      await auction.save()

      pubsub.publish('AUCTION_CREATED', { auctionCreated: auction })

      return auction
    },

    placeBid: async (_: any, { input }: { input: any }, { user }: any) => {
      if (!user) {
        throw new AuthenticationError('Authentication required')
      }

      const auction = await Auction.findById(input.auctionId)
      if (!auction) {
        throw new NotFoundError('Auction not found')
      }

      if (auction.status !== 'active') {
        throw new AuthenticationError('Auction is not active')
      }

      if (new Date() > auction.endTime) {
        throw new AuthenticationError('Auction has ended')
      }

      if (!auction.canBid(input.amount)) {
        throw new AuthenticationError('Invalid bid amount')
      }

      const bid = await auction.addBid(user.id, input.amount, input.transactionHash)

      pubsub.publish('BID_PLACED', { bidPlaced: bid, auctionId: input.auctionId })

      // Check if user was outbid
      const previousBids = auction.bids.filter((b: any) => b.bidderId.toString() !== user.id)
      if (previousBids.length > 0) {
        const highestPreviousBid = previousBids.reduce((max, b) => b.amount > max.amount ? b : max)
        pubsub.publish('OUTBID', { outbid: highestPreviousBid, auctionId: input.auctionId })
      }

      return bid
    }
  },

  // Subscription resolvers
  Subscription: {
    userLoggedIn: {
      subscribe: withFilter(() => pubsub.asyncIterator(['USER_LOGGED_IN']), (payload: any, variables: any) => {
        return !variables.userId || payload.userLoggedIn.id === variables.userId
      })
    },

    userRegistered: {
      subscribe: () => pubsub.asyncIterator(['USER_REGISTERED'])
    },

    assetCreated: {
      subscribe: () => pubsub.asyncIterator(['ASSET_CREATED'])
    },

    assetUpdated: {
      subscribe: withFilter(() => pubsub.asyncIterator(['ASSET_UPDATED']), (payload: any, variables: any) => {
        return !variables.assetId || payload.assetUpdated.id === variables.assetId
      })
    },

    assetDeleted: {
      subscribe: withFilter(() => pubsub.asyncIterator(['ASSET_DELETED']), (payload: any, variables: any) => {
        return !variables.assetId || payload.assetId === variables.assetId
      })
    },

    auctionCreated: {
      subscribe: () => pubsub.asyncIterator(['AUCTION_CREATED'])
    },

    auctionUpdated: {
      subscribe: withFilter(() => pubsub.asyncIterator(['AUCTION_UPDATED']), (payload: any, variables: any) => {
        return !variables.auctionId || payload.auctionUpdated.id === variables.auctionId
      })
    },

    bidPlaced: {
      subscribe: withFilter(() => pubsub.asyncIterator(['BID_PLACED']), (payload: any, variables: any) => {
        return !variables.auctionId || payload.auctionId === variables.auctionId
      })
    },

    outbid: {
      subscribe: withFilter(() => pubsub.asyncIterator(['OUTBID']), (payload: any, variables: any) => {
        return !variables.auctionId || payload.auctionId === variables.auctionId
      })
    },

    platformStats: {
      subscribe: () => pubsub.asyncIterator(['PLATFORM_STATS'])
    }
  }
}

export default resolvers
