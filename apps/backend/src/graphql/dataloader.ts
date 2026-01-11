import DataLoader from 'dataloader'
import { User } from '../models/User'
import { Asset } from '../models/Asset'
import { Auction } from '../models/Auction'
import { ObjectId } from 'mongodb'

// User DataLoader
export const userLoader = new DataLoader(async (ids: string[]) => {
  const objectIds = ids.map(id => new ObjectId(id))
  const users = await User.find({ _id: { $in: objectIds } })
  
  return ids.map(id => {
    const user = users.find(u => u.id === id)
    if (!user) {
      throw new Error(`User with id ${id} not found`)
    }
    return user
  })
})

// Asset DataLoader
export const assetLoader = new DataLoader(async (ids: string[]) => {
  const objectIds = ids.map(id => new ObjectId(id))
  const assets = await Asset.find({ _id: { $in: objectIds } })
    .populate('ownership.currentOwner', 'firstName lastName email')
    .populate('ownership.ownershipHistory.owner', 'firstName lastName email')
  
  return ids.map(id => {
    const asset = assets.find(a => a.id === id)
    if (!asset) {
      throw new Error(`Asset with id ${id} not found`)
    }
    return asset
  })
})

// Auction DataLoader
export const auctionLoader = new DataLoader(async (ids: string[]) => {
  const objectIds = ids.map(id => new ObjectId(id))
  const auctions = await Auction.find({ _id: { $in: objectIds } })
    .populate('sellerId', 'firstName lastName email')
    .populate('assetId')
    .populate('bids.bidderId', 'firstName lastName email')
    .populate('winner.userId', 'firstName lastName email')
  
  return ids.map(id => {
    const auction = auctions.find(a => a.id === id)
    if (!auction) {
      throw new Error(`Auction with id ${id} not found`)
    }
    return auction
  })
})

// Bid DataLoader
export const bidLoader = new DataLoader(async (auctionIds: string[]) => {
  const objectIds = auctionIds.map(id => new ObjectId(id))
  const auctions = await Auction.find({ _id: { $in: objectIds } })
    .populate('bids.bidderId', 'firstName lastName email')
  
  return auctionIds.map(auctionId => {
    const auction = auctions.find(a => a.id === auctionId)
    if (!auction) {
      throw new Error(`Auction with id ${auctionId} not found`)
    }
    return auction.bids
  })
})

// User assets DataLoader
export const userAssetsLoader = new DataLoader(async (userIds: string[]) => {
  const objectIds = userIds.map(id => new ObjectId(id))
  const assets = await Asset.find({ 'ownership.currentOwner': { $in: objectIds } })
    .populate('ownership.currentOwner', 'firstName lastName email')
  
  return userIds.map(userId => {
    return assets.filter(asset => 
      asset.ownership.currentOwner && asset.ownership.currentOwner.id === userId
    )
  })
})

// User auctions DataLoader
export const userAuctionsLoader = new DataLoader(async (userIds: string[]) => {
  const objectIds = userIds.map(id => new ObjectId(id))
  const auctions = await Auction.find({ sellerId: { $in: objectIds } })
    .populate('sellerId', 'firstName lastName email')
    .populate('assetId')
    .populate('bids.bidderId', 'firstName lastName email')
  
  return userIds.map(userId => {
    return auctions.filter(auction => auction.sellerId && auction.sellerId.id === userId)
  })
})

// User bids DataLoader
export const userBidsLoader = new DataLoader(async (userIds: string[]) => {
  const objectIds = userIds.map(id => new ObjectId(id))
  const auctions = await Auction.find({ 'bids.bidderId': { $in: objectIds } })
    .populate('bids.bidderId', 'firstName lastName email')
    .populate('sellerId', 'firstName lastName email')
    .populate('assetId')
  
  return userIds.map(userId => {
    const userBids = []
    auctions.forEach(auction => {
      auction.bids.forEach(bid => {
        if (bid.bidderId && bid.bidderId.id === userId) {
          userBids.push({
            ...bid.toObject(),
            auction: {
              id: auction.id,
              title: auction.title,
              endTime: auction.endTime,
              status: auction.status
            }
          })
        }
      })
    })
    return userBids
  })
})

// Featured assets DataLoader
export const featuredAssetsLoader = new DataLoader(async (params: any[]) => {
  const limit = params[0]?.limit || 10
  const assets = await Asset.find({ 
    featured: true, 
    status: 'approved', 
    visibility: 'public' 
  })
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit)
    .populate('ownership.currentOwner', 'firstName lastName email')
  
  return [assets]
})

// Active auctions DataLoader
export const activeAuctionsLoader = new DataLoader(async (params: any[]) => {
  const limit = params[0]?.limit || 20
  const auctions = await Auction.find({ 
    status: 'active', 
    visibility: 'public', 
    endTime: { $gt: new Date() } 
  })
    .sort({ endTime: 1 })
    .limit(limit)
    .populate('sellerId', 'firstName lastName email')
    .populate('assetId')
    .populate('bids.bidderId', 'firstName lastName email')
  
  return [auctions]
})

// Ending soon auctions DataLoader
export const endingSoonAuctionsLoader = new DataLoader(async (params: any[]) => {
  const hours = params[0]?.hours || 24
  const limit = params[0]?.limit || 20
  const endTime = new Date(Date.now() + hours * 60 * 60 * 1000)
  
  const auctions = await Auction.find({ 
    status: 'active', 
    visibility: 'public', 
    endTime: { $lte: endTime, $gt: new Date() } 
  })
    .sort({ endTime: 1 })
    .limit(limit)
    .populate('sellerId', 'firstName lastName email')
    .populate('assetId')
    .populate('bids.bidderId', 'firstName lastName email')
  
  return [auctions]
})

// Search assets DataLoader
export const searchAssetsLoader = new DataLoader(async (params: any[]) => {
  const { query, filters, pagination } = params[0] || {}
  
  const searchQuery: any = {
    $text: { $search: query },
    visibility: 'public',
    status: 'approved'
  }
  
  if (filters) {
    if (filters.category) searchQuery.category = filters.category
    if (filters.condition) searchQuery.condition = filters.condition
    if (filters.minPrice || filters.maxPrice) {
      searchQuery['valuation.estimatedValue'] = {}
      if (filters.minPrice) searchQuery['valuation.estimatedValue'].$gte = filters.minPrice
      if (filters.maxPrice) searchQuery['valuation.estimatedValue'].$lte = filters.maxPrice
    }
    if (filters.location) searchQuery['location.country'] = filters.location
  }
  
  const page = pagination?.page || 1
  const limit = pagination?.limit || 20
  const skip = (page - 1) * limit
  
  const assets = await Asset.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limit)
    .populate('ownership.currentOwner', 'firstName lastName email')
  
  return [assets]
})

// Search auctions DataLoader
export const searchAuctionsLoader = new DataLoader(async (params: any[]) => {
  const { query, filters, pagination } = params[0] || {}
  
  const searchQuery: any = {
    $text: { $search: query },
    visibility: 'public',
    status: 'active',
    endTime: { $gt: new Date() }
  }
  
  if (filters) {
    if (filters.category) searchQuery.category = filters.category
    if (filters.auctionType) searchQuery.auctionType = filters.auctionType
    if (filters.sellerId) searchQuery.sellerId = filters.sellerId
    if (filters.minPrice || filters.maxPrice) {
      searchQuery.startingBid = {}
      if (filters.minPrice) searchQuery.startingBid.$gte = filters.minPrice
      if (filters.maxPrice) searchQuery.startingBid.$lte = filters.maxPrice
    }
    if (filters.location) searchQuery['location.country'] = filters.location
  }
  
  const page = pagination?.page || 1
  const limit = pagination?.limit || 20
  const skip = (page - 1) * limit
  
  const auctions = await Auction.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limit)
    .populate('sellerId', 'firstName lastName email')
    .populate('assetId')
    .populate('bids.bidderId', 'firstName lastName email')
  
  return [auctions]
})

// Category statistics DataLoader
export const categoryStatsLoader = new DataLoader(async () => {
  const assetStats = await Asset.aggregate([
    { $match: { status: 'approved', visibility: 'public' } },
    { $group: { _id: '$category', count: { $sum: 1 }, value: { $sum: '$valuation.estimatedValue' } } },
    { $sort: { count: -1 } }
  ])
  
  const auctionStats = await Auction.aggregate([
    { $match: { status: 'active', visibility: 'public' } },
    { $group: { _id: '$category', count: { $sum: 1 }, value: { $sum: '$startingBid' } } },
    { $sort: { count: -1 } }
  ])
  
  // Combine stats
  const combinedStats = new Map()
  
  assetStats.forEach(stat => {
    combinedStats.set(stat._id, {
      category: stat._id,
      assetCount: stat.count,
      assetValue: stat.value,
      auctionCount: 0,
      auctionValue: 0
    })
  })
  
  auctionStats.forEach(stat => {
    const existing = combinedStats.get(stat._id) || {
      category: stat._id,
      assetCount: 0,
      assetValue: 0,
      auctionCount: 0,
      auctionValue: 0
    }
    existing.auctionCount = stat.count
    existing.auctionValue = stat.value
    combinedStats.set(stat._id, existing)
  })
  
  return [Array.from(combinedStats.values())]
})

// Location statistics DataLoader
export const locationStatsLoader = new DataLoader(async () => {
  const assetStats = await Asset.aggregate([
    { $match: { status: 'approved', visibility: 'public' } },
    { $group: { _id: '$location.country', count: { $sum: 1 }, value: { $sum: '$valuation.estimatedValue' } } },
    { $sort: { count: -1 } }
  ])
  
  const auctionStats = await Auction.aggregate([
    { $match: { status: 'active', visibility: 'public' } },
    { $group: { _id: '$location.country', count: { $sum: 1 }, value: { $sum: '$startingBid' } } },
    { $sort: { count: -1 } }
  ])
  
  // Combine stats
  const combinedStats = new Map()
  
  assetStats.forEach(stat => {
    combinedStats.set(stat._id, {
      country: stat._id,
      assetCount: stat.count,
      assetValue: stat.value,
      auctionCount: 0,
      auctionValue: 0
    })
  })
  
  auctionStats.forEach(stat => {
    const existing = combinedStats.get(stat._id) || {
      country: stat._id,
      assetCount: 0,
      assetValue: 0,
      auctionCount: 0,
      auctionValue: 0
    }
    existing.auctionCount = stat.count
    existing.auctionValue = stat.value
    combinedStats.set(stat._id, existing)
  })
  
  return [Array.from(combinedStats.values())]
})

// Clear all DataLoaders
export const clearAllLoaders = () => {
  userLoader.clearAll()
  assetLoader.clearAll()
  auctionLoader.clearAll()
  bidLoader.clearAll()
  userAssetsLoader.clearAll()
  userAuctionsLoader.clearAll()
  userBidsLoader.clearAll()
  featuredAssetsLoader.clearAll()
  activeAuctionsLoader.clearAll()
  endingSoonAuctionsLoader.clearAll()
  searchAssetsLoader.clearAll()
  searchAuctionsLoader.clearAll()
  categoryStatsLoader.clearAll()
  locationStatsLoader.clearAll()
}

// Prime DataLoaders with common data
export const primeLoaders = async () => {
  try {
    // Prime featured assets
    await featuredAssetsLoader.load({ limit: 10 })
    
    // Prime active auctions
    await activeAuctionsLoader.load({ limit: 20 })
    
    // Prime ending soon auctions
    await endingSoonAuctionsLoader.load({ hours: 24, limit: 10 })
    
    // Prime category stats
    await categoryStatsLoader.load({})
    
    // Prime location stats
    await locationStatsLoader.load({})
  } catch (error) {
    console.error('Error priming loaders:', error)
  }
}

// DataLoader configuration
export const dataLoaderConfig = {
  cache: true,
  maxBatchSize: 100,
  batchScheduleFn: (callback: any) => {
    setTimeout(callback, 0)
  },
}

export default {
  userLoader,
  assetLoader,
  auctionLoader,
  bidLoader,
  userAssetsLoader,
  userAuctionsLoader,
  userBidsLoader,
  featuredAssetsLoader,
  activeAuctionsLoader,
  endingSoonAuctionsLoader,
  searchAssetsLoader,
  searchAuctionsLoader,
  categoryStatsLoader,
  locationStatsLoader,
  clearAllLoaders,
  primeLoaders,
  dataLoaderConfig
}
