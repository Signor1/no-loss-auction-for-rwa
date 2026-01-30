import { gql } from 'apollo-server-express'

// Scalar types
export const typeDefs = gql`
  scalar DateTime
  scalar Upload
  scalar JSON
  scalar BigInt

  # Enum types
  enum UserRole {
    USER
    ADMIN
    MODERATOR
  }

  enum AssetCategory {
    ART
    COLLECTIBLES
    REAL_ESTATE
    VEHICLES
    ELECTRONICS
    JEWELRY
    WATCHES
    FURNITURE
    BOOKS
    MUSIC
    SPORTS
    OTHER
  }

  enum AssetCondition {
    NEW
    LIKE_NEW
    EXCELLENT
    VERY_GOOD
    GOOD
    FAIR
    POOR
  }

  enum AssetStatus {
    DRAFT
    PENDING
    APPROVED
    REJECTED
    ACTIVE
    SOLD
    WITHDRAWN
  }

  enum AssetVisibility {
    PUBLIC
    PRIVATE
    UNLISTED
  }

  enum AuctionType {
    ENGLISH
    DUTCH
    SEALED_BID
    NO_LOSS
  }

  enum AuctionStatus {
    DRAFT
    PENDING
    ACTIVE
    ENDED
    CANCELLED
    SOLD
  }

  enum BidStatus {
    PENDING
    CONFIRMED
    FAILED
  }

  enum TransactionStatus {
    PENDING
    CONFIRMED
    FAILED
    CANCELLED
    COMPLETED
  }

  enum TransactionType {
    BID
    PAYMENT
    REFUND
    WITHDRAWAL
    DEPOSIT
    FEE
  }

  enum SortOrder {
    ASC
    DESC
  }

  enum Currency {
    USD
    EUR
    GBP
    JPY
    CNY
    KRW
    INR
    BRL
    CAD
    AUD
    CHF
    SEK
    NOK
    DKK
    PLN
    RUB
    ZAR
    MXN
    ARS
    CLP
    COP
    PEN
    UYU
    VES
    ETH
    BTC
  }

  # Input types
  input LocationInput {
    country: String!
    city: String!
    address: String
    coordinates: CoordinatesInput
  }

  input CoordinatesInput {
    lat: Float!
    lng: Float!
  }

  input AssetFilterInput {
    category: AssetCategory
    condition: AssetCondition
    status: AssetStatus
    visibility: AssetVisibility
    featured: Boolean
    minPrice: Float
    maxPrice: Float
    location: String
    search: String
    tags: [String]
    sellerId: String
  }

  input AuctionFilterInput {
    category: AssetCategory
    status: AuctionStatus
    auctionType: AuctionType
    featured: Boolean
    minPrice: Float
    maxPrice: Float
    location: String
    search: String
    sellerId: String
    endingSoon: Boolean
    hasBids: Boolean
  }

  input PaginationInput {
    page: Int = 1
    limit: Int = 20
  }

  input SortInput {
    field: String!
    order: SortOrder!
  }

  input UserProfileInput {
    firstName: String
    lastName: String
    bio: String
    phone: String
    country: String
    dateOfBirth: DateTime
  }

  input UserPreferencesInput {
    language: String
    timezone: String
    notifications: NotificationPreferencesInput
    privacy: PrivacyPreferencesInput
  }

  input NotificationPreferencesInput {
    email: Boolean
    push: Boolean
    sms: Boolean
    auction: Boolean
    bid: Boolean
    payment: Boolean
  }

  input PrivacyPreferencesInput {
    showProfile: Boolean
    showActivity: Boolean
    allowMessages: Boolean
  }

  input CreateAssetInput {
    title: String!
    description: String!
    category: AssetCategory!
    subcategory: String
    condition: AssetCondition!
    location: LocationInput!
    specifications: JSON
    valuation: ValuationInput!
    metadata: AssetMetadataInput
    visibility: AssetVisibility = PUBLIC
    tags: [String]
  }

  input ValuationInput {
    estimatedValue: Float!
    currency: Currency!
    appraisalDate: DateTime
    appraisalReport: String
  }

  input AssetMetadataInput {
    tags: [String]
    keywords: [String]
    attributes: JSON
    rarity: String
    edition: String
    series: String
    artist: String
    manufacturer: String
    model: String
    year: Int
    serialNumber: String
  }

  input CreateAuctionInput {
    title: String!
    description: String!
    assetId: String!
    category: AssetCategory!
    startingBid: Float!
    minBidIncrement: Float = 1
    reservePrice: Float
    buyNowPrice: Float
    endTime: DateTime!
    auctionType: AuctionType = ENGLISH
    visibility: AssetVisibility = PUBLIC
    featured: Boolean = false
    settings: AuctionSettingsInput
    location: LocationInput!
    shipping: ShippingInput
    terms: AuctionTermsInput
    tags: [String]
  }

  input AuctionSettingsInput {
    autoExtend: Boolean = false
    extendDuration: Int = 10
    maxExtensions: Int = 3
    requireVerification: Boolean = true
    allowProxyBidding: Boolean = true
    showBidderNames: Boolean = false
    enableBuyNow: Boolean = false
    enableReserve: Boolean = true
  }

  input ShippingInput {
    method: String = BOTH
    cost: Float = 0
    costType: String = FIXED
    sellerPays: Boolean = false
    international: Boolean = false
    restrictions: [String]
  }

  input AuctionTermsInput {
    paymentDeadline: Int = 7
    returnPolicy: String!
    warranty: String
    conditions: [String]
    specialTerms: String
  }

  input PlaceBidInput {
    auctionId: String!
    amount: Float!
    transactionHash: String
  }

  # Core types
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    fullName: String!
    walletAddress: String
    role: UserRole!
    emailVerified: Boolean!
    twoFactorEnabled: Boolean!
    kycVerified: Boolean!
    profile: UserProfile!
    preferences: UserPreferences!
    security: UserSecurity!
    createdAt: DateTime!
    updatedAt: DateTime!
    lastLoginAt: DateTime
  }

  type UserProfile {
    avatar: String
    bio: String
    phone: String
    country: String
    dateOfBirth: DateTime
  }

  type UserPreferences {
    language: String!
    timezone: String!
    notifications: NotificationPreferences!
    privacy: PrivacyPreferences!
  }

  type NotificationPreferences {
    email: Boolean!
    push: Boolean!
    sms: Boolean!
    auction: Boolean!
    bid: Boolean!
    payment: Boolean!
  }

  type PrivacyPreferences {
    showProfile: Boolean!
    showActivity: Boolean!
    allowMessages: Boolean!
  }

  type UserSecurity {
    lastPasswordChange: DateTime
    lastLoginAt: DateTime
    loginAttempts: Int!
    isLocked: Boolean!
  }

  type Coordinates {
    lat: Float!
    lng: Float!
  }

  type Location {
    country: String!
    city: String!
    address: String
    coordinates: Coordinates
  }

  type AssetImage {
    url: String!
    alt: String!
    order: Int!
    isPrimary: Boolean!
  }

  type AssetVideo {
    url: String!
    title: String!
    duration: Int!
    thumbnail: String!
  }

  type AssetDocument {
    title: String!
    url: String!
    type: String!
    size: Int!
  }

  type Valuation {
    estimatedValue: Float!
    currency: Currency!
    appraisalDate: DateTime
    appraisalReport: String
  }

  type OwnershipHistory {
    owner: User!
    acquisitionDate: DateTime!
    acquisitionMethod: String!
    price: Float
  }

  type Certificate {
    type: String!
    issuer: String!
    number: String!
    issueDate: DateTime!
    url: String!
  }

  type AssetOwnership {
    currentOwner: User!
    ownershipHistory: [OwnershipHistory!]!
    provenance: String
    certificates: [Certificate!]!
  }

  type AssetMetadata {
    tags: [String!]!
    keywords: [String!]!
    attributes: JSON!
    rarity: String
    edition: String
    series: String
    artist: String
    manufacturer: String
    model: String
    year: Int
    serialNumber: String
  }

  type Asset {
    id: ID!
    title: String!
    description: String!
    category: AssetCategory!
    subcategory: String
    condition: AssetCondition!
    location: Location!
    specifications: JSON!
    images: [AssetImage!]!
    videos: [AssetVideo!]!
    documents: [AssetDocument!]!
    valuation: Valuation!
    ownership: AssetOwnership!
    metadata: AssetMetadata!
    status: AssetStatus!
    visibility: AssetVisibility!
    featured: Boolean!
    priority: Int!
    views: Int!
    likes: Int!
    shares: Int!
    isExpired: Boolean!
    isAvailable: Boolean!
    averageRating: Float!
    createdAt: DateTime!
    updatedAt: DateTime!
    publishedAt: DateTime
    expiresAt: DateTime
  }

  type Bid {
    id: ID!
    bidder: User!
    amount: Float!
    timestamp: DateTime!
    isWinning: Boolean!
    transactionHash: String
    status: BidStatus!
  }

  type AuctionMetrics {
    views: Int!
    watchers: Int!
    bids: Int!
    uniqueBidders: Int!
    totalValue: Float!
    averageBid: Float!
    bidHistory: [BidHistory!]!
  }

  type BidHistory {
    timestamp: DateTime!
    amount: Float!
    bidder: User!
  }

  type AuctionFees {
    platformFee: Float!
    paymentProcessorFee: Float!
    totalFees: Float!
    feeStructure: String!
  }

  type AuctionTimeline {
    createdAt: DateTime!
    publishedAt: DateTime
    startedAt: DateTime
    endedAt: DateTime
    lastBidAt: DateTime
    extendedAt: [DateTime!]!
  }

  type AuctionSettings {
    autoExtend: Boolean!
    extendDuration: Int!
    maxExtensions: Int!
    currentExtensions: Int!
    requireVerification: Boolean!
    allowProxyBidding: Boolean!
    showBidderNames: Boolean!
    enableBuyNow: Boolean!
    enableReserve: Boolean!
  }

  type AuctionShipping {
    method: String!
    cost: Float!
    costType: String!
    sellerPays: Boolean!
    international: Boolean!
    restrictions: [String!]!
  }

  type AuctionTerms {
    paymentDeadline: Int!
    returnPolicy: String!
    warranty: String
    conditions: [String!]!
    specialTerms: String
  }

  type AuctionWinner {
    userId: User!
    amount: Float!
    timestamp: DateTime!
    transactionHash: String
  }

  type Auction {
    id: ID!
    title: String!
    description: String!
    asset: Asset!
    seller: User!
    category: AssetCategory!
    startingBid: Float!
    currentBid: Float!
    minBidIncrement: Float!
    reservePrice: Float
    buyNowPrice: Float
    endTime: DateTime!
    status: AuctionStatus!
    auctionType: AuctionType!
    visibility: AssetVisibility!
    featured: Boolean!
    priority: Int!
    bids: [Bid!]!
    winner: AuctionWinner
    metrics: AuctionMetrics!
    settings: AuctionSettings!
    fees: AuctionFees!
    timeline: AuctionTimeline!
    location: Location!
    shipping: AuctionShipping!
    terms: AuctionTerms!
    tags: [String!]!
    metadata: JSON!
    isExpired: Boolean!
    timeRemaining: Int!
    bidCount: Int!
    highestBid: Float!
    hasWinner: Boolean!
    nextMinimumBid: Float!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Transaction {
    id: ID!
    user: User!
    auction: Auction
    type: TransactionType!
    amount: Float!
    currency: Currency!
    status: TransactionStatus!
    transactionHash: String
    fromAddress: String
    toAddress: String
    gasUsed: Int
    gasPrice: Float
    blockNumber: Int
    blockHash: String
    confirmations: Int!
    metadata: JSON!
    createdAt: DateTime!
    updatedAt: DateTime!
    confirmedAt: DateTime
  }

  type Notification {
    id: ID!
    user: User!
    type: String!
    title: String!
    message: String!
    data: JSON!
    read: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Pagination types
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
    totalPages: Int!
    currentPage: Int!
    totalItems: Int!
  }

  type AssetConnection {
    edges: [AssetEdge!]!
    pageInfo: PageInfo!
  }

  type AssetEdge {
    node: Asset!
    cursor: String!
  }

  type AuctionConnection {
    edges: [AuctionEdge!]!
    pageInfo: PageInfo!
  }

  type AuctionEdge {
    node: Auction!
    cursor: String!
  }

  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
  }

  type UserEdge {
    node: User!
    cursor: String!
  }

  type BidConnection {
    edges: [BidEdge!]!
    pageInfo: PageInfo!
  }

  type BidEdge {
    node: Bid!
    cursor: String!
  }

  type TransactionConnection {
    edges: [TransactionEdge!]!
    pageInfo: PageInfo!
  }

  type TransactionEdge {
    node: Transaction!
    cursor: String!
  }

  type NotificationConnection {
    edges: [NotificationEdge!]!
    pageInfo: PageInfo!
  }

  type NotificationEdge {
    node: Notification!
    cursor: String!
  }

  # Query root
  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users(filter: UserFilterInput, pagination: PaginationInput, sort: SortInput): UserConnection!
    
    # Asset queries
    asset(id: ID!): Asset
    assets(filter: AssetFilterInput, pagination: PaginationInput, sort: SortInput): AssetConnection!
    myAssets(filter: AssetFilterInput, pagination: PaginationInput, sort: SortInput): AssetConnection!
    featuredAssets(pagination: PaginationInput): AssetConnection!
    
    # Auction queries
    auction(id: ID!): Auction
    auctions(filter: AuctionFilterInput, pagination: PaginationInput, sort: SortInput): AuctionConnection!
    myAuctions(filter: AuctionFilterInput, pagination: PaginationInput, sort: SortInput): AuctionConnection!
    activeAuctions(pagination: PaginationInput): AuctionConnection!
    endingSoonAuctions(hours: Int = 24, pagination: PaginationInput): AuctionConnection!
    featuredAuctions(pagination: PaginationInput): AuctionConnection!
    
    # Bid queries
    bid(id: ID!): Bid
    bids(auctionId: ID!, pagination: PaginationInput, sort: SortInput): BidConnection!
    myBids(pagination: PaginationInput, sort: SortInput): BidConnection!
    
    # Transaction queries
    transaction(id: ID!): Transaction
    transactions(filter: TransactionFilterInput, pagination: PaginationInput, sort: SortInput): TransactionConnection!
    myTransactions(filter: TransactionFilterInput, pagination: PaginationInput, sort: SortInput): TransactionConnection!
    
    # Notification queries
    notifications(pagination: PaginationInput, unreadOnly: Boolean): NotificationConnection!
    notificationCount(unreadOnly: Boolean): Int!
    
    # Search queries
    searchAssets(query: String!, filter: AssetFilterInput, pagination: PaginationInput): AssetConnection!
    searchAuctions(query: String!, filter: AuctionFilterInput, pagination: PaginationInput): AuctionConnection!
    searchUsers(query: String!, pagination: PaginationInput): UserConnection!
    
    # Analytics queries
    userStats: UserStats!
    platformStats: PlatformStats!
    auctionStats(auctionId: ID!): AuctionStats!
  }

  # Mutation root
  type Mutation {
    # Authentication mutations
    login(email: String!, password: String!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    refreshToken(refreshToken: String!): AuthPayload!
    logout(refreshToken: String!): Boolean!
    logoutAll: Boolean!
    changePassword(currentPassword: String!, newPassword: String!): Boolean!
    forgotPassword(email: String!): Boolean!
    resetPassword(token: String!, newPassword: String!): Boolean!
    verifyEmail(token: String!): Boolean!
    
    # User mutations
    updateProfile(input: UserProfileInput!): User!
    updatePreferences(input: UserPreferencesInput!): User!
    uploadAvatar(file: Upload!): String!
    deleteAccount(password: String!): Boolean!
    
    # Asset mutations
    createAsset(input: CreateAssetInput!): Asset!
    updateAsset(id: ID!, input: UpdateAssetInput!): Asset!
    deleteAsset(id: ID!): Boolean!
    uploadAssetImages(assetId: ID!, files: [Upload!]!): [AssetImage!]!
    uploadAssetVideo(assetId: ID!, file: Upload!, title: String!, duration: Int!): AssetVideo!
    uploadAssetDocuments(assetId: ID!, files: [Upload!]!): [AssetDocument!]!
    likeAsset(id: ID!): Asset!
    unlikeAsset(id: ID!): Asset!
    shareAsset(id: ID!): Asset!
    
    # Auction mutations
    createAuction(input: CreateAuctionInput!): Auction!
    updateAuction(id: ID!, input: UpdateAuctionInput!): Auction!
    deleteAuction(id: ID!): Boolean!
    publishAuction(id: ID!): Auction!
    cancelAuction(id: ID!, reason: String): Auction!
    extendAuction(id: ID!): Auction!
    
    # Bid mutations
    placeBid(input: PlaceBidInput!): Bid!
    withdrawBid(auctionId: ID!): Boolean!
    
    # Transaction mutations
    createTransaction(input: CreateTransactionInput!): Transaction!
    confirmTransaction(id: ID!, transactionHash: String!): Transaction!
    cancelTransaction(id: ID!): Transaction!
    
    # Notification mutations
    markNotificationAsRead(id: ID!): Notification!
    markAllNotificationsAsRead: Boolean!
    deleteNotification(id: ID!): Boolean!
    clearNotifications: Boolean!
    
    # Admin mutations
    approveAsset(id: ID!): Asset!
    rejectAsset(id: ID!, reason: String!): Asset!
    approveAuction(id: ID!): Auction!
    rejectAuction(id: ID!, reason: String!): Auction!
    updateUserRole(userId: ID!, role: UserRole!): User!
    deactivateUser(userId: ID!): User!
    activateUser(userId: ID!): User!
  }

  # Subscription root
  type Subscription {
    # User subscriptions
    userUpdated(userId: ID!): User!
    userLoggedIn(userId: ID!): User!
    userRegistered: User!
    
    # Asset subscriptions
    assetCreated: Asset!
    assetUpdated(assetId: ID!): Asset!
    assetDeleted(assetId: ID!): Asset!
    assetLiked(assetId: ID!): Asset!
    
    # Auction subscriptions
    auctionCreated: Auction!
    auctionUpdated(auctionId: ID!): Auction!
    auctionEnded(auctionId: ID!): Auction!
    auctionCancelled(auctionId: ID!): Auction!
    
    # Bid subscriptions
    bidPlaced(auctionId: ID!): Bid!
    bidWithdrawn(auctionId: ID!): Bid!
    outbid(auctionId: ID!): Bid!
    
    # Transaction subscriptions
    transactionCreated(userId: ID!): Transaction!
    transactionUpdated(transactionId: ID!): Transaction!
    
    # Notification subscriptions
    notificationReceived(userId: ID!): Notification!
    notificationRead(userId: ID!): Notification!
    
    # Real-time subscriptions
    auctionActivity(auctionId: ID!): AuctionActivity!
    platformStats: PlatformStats!
  }

  # Additional types for mutations
  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    walletAddress: String
  }

  input UpdateAssetInput {
    title: String
    description: String
    category: AssetCategory
    subcategory: String
    condition: AssetCondition
    location: LocationInput
    specifications: JSON
    valuation: ValuationInput
    metadata: AssetMetadataInput
    visibility: AssetVisibility
    featured: Boolean
    tags: [String]
  }

  input UpdateAuctionInput {
    title: String
    description: String
    startingBid: Float
    minBidIncrement: Float
    reservePrice: Float
    buyNowPrice: Float
    endTime: DateTime
    visibility: AssetVisibility
    featured: Boolean
    settings: AuctionSettingsInput
    location: LocationInput
    shipping: ShippingInput
    terms: AuctionTermsInput
    tags: [String]
  }

  input CreateTransactionInput {
    auctionId: String!
    type: TransactionType!
    amount: Float!
    currency: Currency!
    fromAddress: String
    toAddress: String
    metadata: JSON
  }

  input TransactionFilterInput {
    type: TransactionType
    status: TransactionStatus
    userId: String
    auctionId: String
    minAmount: Float
    maxAmount: Float
    dateFrom: DateTime
    dateTo: DateTime
  }

  input UserFilterInput {
    role: UserRole
    emailVerified: Boolean
    kycVerified: Boolean
    active: Boolean
    search: String
  }

  type AuthPayload {
    user: User!
    tokens: AuthTokens!
  }

  type AuthTokens {
    accessToken: String!
    refreshToken: String!
    expiresIn: Int!
  }

  type UserStats {
    totalAssets: Int!
    totalAuctions: Int!
    totalBids: Int!
    totalTransactions: Int!
    totalValue: Float!
    averageBidAmount: Float!
    winRate: Float!
    reputation: Float!
  }

  type PlatformStats {
    totalUsers: Int!
    totalAssets: Int!
    totalAuctions: Int!
    totalBids: Int!
    totalTransactions: Int!
    totalVolume: Float!
    activeAuctions: Int!
    activeUsers: Int!
    newUsersToday: Int!
    newAuctionsToday: Int!
    topCategories: [CategoryStats!]!
    topLocations: [LocationStats!]!
  }

  type CategoryStats {
    category: AssetCategory!
    count: Int!
    value: Float!
  }

  type LocationStats {
    country: String!
    count: Int!
    value: Float!
  }

  type AuctionActivity {
    type: String!
    auction: Auction!
    user: User
    data: JSON!
    timestamp: DateTime!
  }
`
