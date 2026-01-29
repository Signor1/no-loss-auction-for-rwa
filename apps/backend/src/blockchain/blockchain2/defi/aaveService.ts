import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import logger from '../../utils/logger'

// Aave V3 contract addresses on Base
const AAVE_V3_BASE_ADDRESSES = {
  POOL: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5c',
  POOL_ADDRESSES_PROVIDER: '0xe20fCBdBfFC4Dd138cE8b2E6FBb6CB49777ad64D',
  POOL_DATA_PROVIDER: '0x2d8A3C5677189723C4cF88757E83CB7634DE30100',
  PRICE_ORACLE: '0x2Cc0Fc26Ed4563A5ce5e8bdcfe1A2878676Ae156f',
  ACL_MANAGER: '0x43955b0899Ab7232E3a454CF84AedD22Ad46FD33',
  COLLECTOR: '0x2e549104c516b8657A7D888494D825e7a131C067',
  UI_POOL_DATA_PROVIDER: '0x174446a6741300cD2A86b030F11A5aE7FCbbEF8d',
  UI_INCENTIVE_DATA_PROVIDER: '0x6F634c6135D2EBD550000ac92F494F9CB8183dAe',
  WALLET_BALANCE_PROVIDER: '0x5779b29e80F8d91197BB1C6a4C3d1C5B0F3bB6b'
}

// Aave V3 ABIs (simplified for main functions)
const AAVE_V3_ABIS = {
  POOL: [
    'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
    'function withdraw(address asset, uint256 amount, address to) external returns (uint256)',
    'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external',
    'function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external returns (uint256)',
    'function repayWithPermit(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf, uint256 deadline, uint8 permitV, bytes32 permitR, bytes32 permitS) external returns (uint256)',
    'function swapBorrowRateMode(address asset, uint256 interestRateMode) external',
    'function rebalanceStableBorrowRate(address asset, address user) external',
    'function setUserUseReserveAsCollateral(address asset, bool useAsCollateral) external',
    'function liquidationCall(address collateralAsset, address debtAsset, address user, uint256 debtToCover, bool receiveAToken) external',
    'function flashLoan(address receiverAddress, address[] calldata assets, uint256[] calldata amounts, uint256[] interestRateModes, address onBehalfOf, bytes calldata params, uint16 referralCode) external',
    'function flashLoanSimple(address receiverAddress, address asset, uint256 amount, bytes calldata params, uint16 referralCode) external',
    'function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
    'function getReserveData(address asset) external view returns (tuple(uint256 unbacked, uint256 accruedToTreasuryScaled, uint256 totalAToken, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp))',
    'function getUserConfiguration(address user) external view returns (uint256)',
    'function getConfiguration(address asset) external view returns (tuple(uint256 data))',
    'function getReserveTokensAddresses(address asset) external view returns (address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress)',
    'function getReservesList() external view returns (address[] memory)',
    'function getReserveAddressById(uint16 id) external view returns (address)',
    'function MAX_STABLE_RATE_BORROW_SIZE_PERCENT() external view returns (uint256)',
    'function FLASHLOAN_PREMIUM_TOTAL() external view returns (uint128)',
    'function BRIDGE_PROTOCOL_FEE() external view returns (uint256)',
    'function FLASHLOAN_PREMIUM_TO_PROTOCOL() external view returns (uint128)',
    'function MAX_NUMBER_RESERVES() external view returns (uint16)',
    'function mintUnbacked(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
    'function backUnbacked(address asset, uint256 amount, uint256 fee) external returns (uint256)',
    'function supplyWithPermit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode, uint256 deadline, uint8 permitV, bytes32 permitR, bytes32 permitS) external',
    'function borrowWithPermit(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf, uint256 deadline, uint8 permitV, bytes32 permitR, bytes32 permitS) external'
  ],

  POOL_DATA_PROVIDER: [
    'function getReserveConfigurationData(address asset) external view returns (uint256 decimals, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen)',
    'function getReserveData(address asset) external view returns (uint256 availableLiquidity, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp)',
    'function getUserReserveData(address asset, address user) external view returns (uint256 currentATokenBalance, uint256 currentStableDebt, uint256 currentVariableDebt, uint256 principalStableDebt, uint256 scaledVariableDebt, uint256 stableBorrowRate, uint256 liquidityRate, uint40 stableRateLastUpdated, bool usageAsCollateralEnabledOnUser)',
    'function getReserveTokensAddresses(address asset) external view returns (address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress)',
    'function getAllReservesTokens() external view returns (tuple(string symbol, address tokenAddress)[] memory)',
    'function getAllATokens() external view returns (tuple(string symbol, address tokenAddress)[] memory)',
    'function getDebtCeiling(address asset) external view returns (uint256)'
  ],

  PRICE_ORACLE: [
    'function getAssetPrice(address asset) external view returns (uint256)',
    'function getAssetsPrices(address[] calldata assets) external view returns (uint256[] memory)',
    'function getSourceOfAsset(address asset) external view returns (address)',
    'function getFallbackOracle() external view returns (address)',
    'function BASE_CURRENCY() external view returns (address)',
    'function BASE_CURRENCY_UNIT() external view returns (uint256)'
  ],

  UI_POOL_DATA_PROVIDER: [
    'function getReservesData(address provider) external view returns (tuple(tuple(string symbol, address underlyingAsset, uint256 price, uint256 totalLiquidity, uint256 totalLiquidityUSD, uint256 availableLiquidity, uint256 availableLiquidityUSD, uint256 totalBorrows, uint256 totalBorrowsUSD, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 stableDebtLastUpdateTimestamp, uint256 totalStableDebt, uint256 totalStableDebtUSD, uint256 totalVariableDebt, uint256 totalVariableDebtUSD, uint256 reserveFactor, tuple(uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus, address priceSource, uint256 label, bool isActive, bool isFrozen, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isAssetActive, bool usageAsCollateralEnabled) configuration)[] memory)',
    'function getUserReservesData(address provider, address user) external view returns (tuple(address underlyingAsset, uint256 scaledATokenBalance, bool usageAsCollateralEnabledOnUser, uint256 stableBorrowRate, uint256 scaledVariableDebt, uint256 principalStableDebt, uint256 stableBorrowLastUpdateTimestamp)[] memory)',
    'function getReservesList(address provider) external view returns (tuple(string symbol, address underlyingAsset)[] memory)'
  ],

  UI_INCENTIVE_DATA_PROVIDER: [
    'function getReservesIncentivesData(address provider) external view returns (tuple(address underlyingAsset, tuple(uint256 emissionPerSecond, uint256 incentivesLastUpdateTimestamp, uint256 tokenIncentivesIndex, uint256 emissionEndTimestamp, address tokenAddress, address rewardTokenAddress, address incentiveControllerAddress, uint8 rewardTokenDecimals, string rewardTokenSymbol) aIncentiveData, tuple(uint256 emissionPerSecond, uint256 incentivesLastUpdateTimestamp, uint256 tokenIncentivesIndex, uint256 emissionEndTimestamp, address tokenAddress, address rewardTokenAddress, address incentiveControllerAddress, uint8 rewardTokenDecimals, string rewardTokenSymbol) vIncentiveData, tuple(uint256 emissionPerSecond, uint256 incentivesLastUpdateTimestamp, uint256 tokenIncentivesIndex, uint256 emissionEndTimestamp, address tokenAddress, address rewardTokenAddress, address incentiveControllerAddress, uint8 rewardTokenDecimals, string rewardTokenSymbol) sIncentiveData)[] memory)',
    'function getUserReservesIncentivesData(address provider, address user) external view returns (tuple(address underlyingAsset, tuple(uint256 tokenincentivesUserIndex, uint256 userUnclaimedRewards, address tokenAddress, address rewardTokenAddress, address incentiveControllerAddress, uint8 rewardTokenDecimals, string rewardTokenSymbol) aTokenincentivesUserData, tuple(uint256 tokenincentivesUserIndex, uint256 userUnclaimedRewards, address tokenAddress, address rewardTokenAddress, address incentiveControllerAddress, uint8 rewardTokenDecimals, string rewardTokenSymbol) vTokenincentivesUserData, tuple(uint256 tokenincentivesUserIndex, uint256 userUnclaimedRewards, address tokenAddress, address rewardTokenAddress, address incentiveControllerAddress, uint8 rewardTokenDecimals, string rewardTokenSymbol) sTokenincentivesUserData)[] memory)',
    'function getFullReservesIncentiveData(address provider, address user) external view returns (tuple(address underlyingAsset, tuple(uint256 emissionPerSecond, uint256 incentivesLastUpdateTimestamp, uint256 tokenIncentivesIndex, uint256 emissionEndTimestamp, address tokenAddress, address rewardTokenAddress, address incentiveControllerAddress, uint8 rewardTokenDecimals, string rewardTokenSymbol) aIncentiveData, tuple(uint256 emissionPerSecond, uint256 incentivesLastUpdateTimestamp, uint256 tokenIncentivesIndex, uint256 emissionEndTimestamp, address tokenAddress, address rewardTokenAddress, address incentiveControllerAddress, uint8 rewardTokenDecimals, string rewardTokenSymbol) vIncentiveData, tuple(uint256 emissionPerSecond, uint256 incentivesLastUpdateTimestamp, uint256 tokenIncentivesIndex, uint256 emissionEndTimestamp, address tokenAddress, address rewardTokenAddress, address incentiveControllerAddress, uint8 rewardTokenDecimals, string rewardTokenSymbol) sIncentiveData, tuple(uint256 tokenincentivesUserIndex, uint256 userUnclaimedRewards, address tokenAddress, address rewardTokenAddress, address incentiveControllerAddress, uint8 rewardTokenDecimals, string rewardTokenSymbol) aTokenincentivesUserData, tuple(uint256 tokenincentivesUserIndex, uint256 userUnclaimedRewards, address tokenAddress, address rewardTokenAddress, address incentiveControllerAddress, uint8 rewardTokenDecimals, string rewardTokenSymbol) vTokenincentivesUserData, tuple(uint256 tokenincentivesUserIndex, uint256 userUnclaimedRewards, address tokenAddress, address rewardTokenAddress, address incentiveControllerAddress, uint8 rewardTokenDecimals, string rewardTokenSymbol) sTokenincentivesUserData)[] memory)'
  ]
}

// Interfaces
export interface ReserveData {
  symbol: string
  underlyingAsset: string
  price: string
  totalLiquidity: string
  totalLiquidityUSD: string
  availableLiquidity: string
  availableLiquidityUSD: string
  totalBorrows: string
  totalBorrowsUSD: string
  liquidityRate: string
  variableBorrowRate: string
  stableBorrowRate: string
  averageStableBorrowRate: string
  totalStableDebt: string
  totalStableDebtUSD: string
  totalVariableDebt: string
  totalVariableDebtUSD: string
  reserveFactor: string
  configuration: ReserveConfiguration
}

export interface ReserveConfiguration {
  ltv: number
  liquidationThreshold: number
  liquidationBonus: number
  isActive: boolean
  isFrozen: boolean
  borrowingEnabled: boolean
  stableBorrowRateEnabled: boolean
  usageAsCollateralEnabled: boolean
}

export interface UserReserveData {
  underlyingAsset: string
  scaledATokenBalance: string
  usageAsCollateralEnabledOnUser: boolean
  stableBorrowRate: string
  scaledVariableDebt: string
  principalStableDebt: string
  stableBorrowLastUpdateTimestamp: number
}

export interface UserAccountData {
  totalCollateralBase: string
  totalDebtBase: string
  availableBorrowsBase: string
  currentLiquidationThreshold: number
  ltv: number
  healthFactor: string
}

export interface SupplyParams {
  asset: string
  amount: string
  onBehalfOf?: string
  referralCode?: number
}

export interface WithdrawParams {
  asset: string
  amount: string
  to?: string
}

export interface BorrowParams {
  asset: string
  amount: string
  interestRateMode: number // 1 = Stable, 2 = Variable
  onBehalfOf?: string
  referralCode?: number
}

export interface RepayParams {
  asset: string
  amount: string
  interestRateMode: number
  onBehalfOf?: string
}

export interface FlashLoanParams {
  receiverAddress: string
  assets: string[]
  amounts: string[]
  interestRateModes: number[]
  onBehalfOf?: string
  params?: string
  referralCode?: number
}

/**
 * Aave V3 Integration Service for Base
 * Provides comprehensive Aave V3 lending protocol functionality on Base network
 */
export class AaveV3Service extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private poolAbi: any[] = []
  private poolDataProviderAbi: any[] = []
  private priceOracleAbi: any[] = []
  private uiPoolDataProviderAbi: any[] = []
  private uiIncentiveDataProviderAbi: any[] = []
  private reserveCache: Map<string, ReserveData> = new Map()
  private userDataCache: Map<string, UserAccountData> = new Map()

  constructor(baseSdk: BaseSdkService, loggerInstance: typeof logger) {
    super()
    this.baseSdk = baseSdk
    this.logger = logger
    this.initializeABIs()
  }

  // Initialize contract ABIs
  private initializeABIs(): void {
    this.poolAbi = AAVE_V3_ABIS.POOL
    this.poolDataProviderAbi = AAVE_V3_ABIS.POOL_DATA_PROVIDER
    this.priceOracleAbi = AAVE_V3_ABIS.PRICE_ORACLE
    this.uiPoolDataProviderAbi = AAVE_V3_ABIS.UI_POOL_DATA_PROVIDER
    this.uiIncentiveDataProviderAbi = AAVE_V3_ABIS.UI_INCENTIVE_DATA_PROVIDER
  }

  // ============ LENDING OPERATIONS ============

  /**
   * Supply assets to the protocol
   */
  async supply(params: SupplyParams): Promise<string> {
    try {
      const supplyParams = {
        asset: params.asset,
        amount: params.amount,
        onBehalfOf: params.onBehalfOf || '0x0000000000000000000000000000000000000000',
        referralCode: params.referralCode || 0
      }

      const hash = await this.baseSdk.writeContract({
        address: AAVE_V3_BASE_ADDRESSES.POOL,
        abi: this.poolAbi,
        functionName: 'supply',
        args: [supplyParams.asset, supplyParams.amount, supplyParams.onBehalfOf, supplyParams.referralCode]
      })

      this.logger.info(`Asset supplied to Aave: ${hash}`)
      this.emit('supply:executed', { hash, params })

      return hash
    } catch (error) {
      this.logger.error('Failed to supply asset:', error)
      this.emit('supply:error', { error, params })
      throw error
    }
  }

  /**
   * Withdraw assets from the protocol
   */
  async withdraw(params: WithdrawParams): Promise<string> {
    try {
      const withdrawParams = {
        asset: params.asset,
        amount: params.amount,
        to: params.to || '0x0000000000000000000000000000000000000000'
      }

      const hash = await this.baseSdk.writeContract({
        address: AAVE_V3_BASE_ADDRESSES.POOL,
        abi: this.poolAbi,
        functionName: 'withdraw',
        args: [withdrawParams.asset, withdrawParams.amount, withdrawParams.to]
      })

      this.logger.info(`Asset withdrawn from Aave: ${hash}`)
      this.emit('withdraw:executed', { hash, params })

      return hash
    } catch (error) {
      this.logger.error('Failed to withdraw asset:', error)
      this.emit('withdraw:error', { error, params })
      throw error
    }
  }

  /**
   * Borrow assets from the protocol
   */
  async borrow(params: BorrowParams): Promise<string> {
    try {
      const borrowParams = {
        asset: params.asset,
        amount: params.amount,
        interestRateMode: params.interestRateMode,
        referralCode: params.referralCode || 0,
        onBehalfOf: params.onBehalfOf || '0x0000000000000000000000000000000000000000'
      }

      const hash = await this.baseSdk.writeContract({
        address: AAVE_V3_BASE_ADDRESSES.POOL,
        abi: this.poolAbi,
        functionName: 'borrow',
        args: [borrowParams.asset, borrowParams.amount, borrowParams.interestRateMode, borrowParams.referralCode, borrowParams.onBehalfOf]
      })

      this.logger.info(`Asset borrowed from Aave: ${hash}`)
      this.emit('borrow:executed', { hash, params })

      return hash
    } catch (error) {
      this.logger.error('Failed to borrow asset:', error)
      this.emit('borrow:error', { error, params })
      throw error
    }
  }

  /**
   * Repay borrowed assets
   */
  async repay(params: RepayParams): Promise<string> {
    try {
      const repayParams = {
        asset: params.asset,
        amount: params.amount,
        interestRateMode: params.interestRateMode,
        onBehalfOf: params.onBehalfOf || '0x0000000000000000000000000000000000000000'
      }

      const hash = await this.baseSdk.writeContract({
        address: AAVE_V3_BASE_ADDRESSES.POOL,
        abi: this.poolAbi,
        functionName: 'repay',
        args: [repayParams.asset, repayParams.amount, repayParams.interestRateMode, repayParams.onBehalfOf]
      })

      this.logger.info(`Asset repaid to Aave: ${hash}`)
      this.emit('repay:executed', { hash, params })

      return hash
    } catch (error) {
      this.logger.error('Failed to repay asset:', error)
      this.emit('repay:error', { error, params })
      throw error
    }
  }

  // ============ FLASH LOAN OPERATIONS ============

  /**
   * Execute flash loan
   */
  async flashLoan(params: FlashLoanParams): Promise<string> {
    try {
      const flashLoanParams = {
        receiverAddress: params.receiverAddress,
        assets: params.assets,
        amounts: params.amounts,
        interestRateModes: params.interestRateModes,
        onBehalfOf: params.onBehalfOf || '0x0000000000000000000000000000000000000000',
        params: params.params || '0x',
        referralCode: params.referralCode || 0
      }

      const hash = await this.baseSdk.writeContract({
        address: AAVE_V3_BASE_ADDRESSES.POOL,
        abi: this.poolAbi,
        functionName: 'flashLoan',
        args: [
          flashLoanParams.receiverAddress,
          flashLoanParams.assets,
          flashLoanParams.amounts,
          flashLoanParams.interestRateModes,
          flashLoanParams.onBehalfOf,
          flashLoanParams.params,
          flashLoanParams.referralCode
        ]
      })

      this.logger.info(`Flash loan executed: ${hash}`)
      this.emit('flashLoan:executed', { hash, params })

      return hash
    } catch (error) {
      this.logger.error('Failed to execute flash loan:', error)
      this.emit('flashLoan:error', { error, params })
      throw error
    }
  }

  // ============ DATA QUERY OPERATIONS ============

  /**
   * Get user account data
   */
  async getUserAccountData(userAddress: string): Promise<UserAccountData> {
    try {
      // Check cache first
      if (this.userDataCache.has(userAddress)) {
        return this.userDataCache.get(userAddress)!
      }

      const userData = await this.baseSdk.readContract({
        address: AAVE_V3_BASE_ADDRESSES.POOL,
        abi: this.poolAbi,
        functionName: 'getUserAccountData',
        args: [userAddress]
      })

      const accountData: UserAccountData = {
        totalCollateralBase: userData[0].toString(),
        totalDebtBase: userData[1].toString(),
        availableBorrowsBase: userData[2].toString(),
        currentLiquidationThreshold: Number(userData[3]) / 100, // Convert basis points to percentage
        ltv: Number(userData[4]) / 100,
        healthFactor: userData[5].toString()
      }

      // Cache user data (short-lived)
      this.userDataCache.set(userAddress, accountData)

      return accountData
    } catch (error) {
      this.logger.error(`Failed to get user account data for ${userAddress}:`, error)
      throw error
    }
  }

  /**
   * Get reserve data
   */
  async getReserveData(assetAddress: string): Promise<ReserveData | null> {
    try {
      // Check cache first
      if (this.reserveCache.has(assetAddress)) {
        return this.reserveCache.get(assetAddress)!
      }

      // Get reserve data from UI Pool Data Provider
      const reservesData = await this.baseSdk.readContract({
        address: AAVE_V3_BASE_ADDRESSES.UI_POOL_DATA_PROVIDER,
        abi: this.uiPoolDataProviderAbi,
        functionName: 'getReservesData',
        args: [AAVE_V3_BASE_ADDRESSES.POOL_ADDRESSES_PROVIDER]
      })

      // Find the specific reserve
      const reserve = reservesData.find((r: any) =>
        r.underlyingAsset.toLowerCase() === assetAddress.toLowerCase()
      )

      if (!reserve) {
        return null
      }

      const reserveData: ReserveData = {
        symbol: reserve.symbol,
        underlyingAsset: reserve.underlyingAsset,
        price: reserve.price.toString(),
        totalLiquidity: reserve.totalLiquidity.toString(),
        totalLiquidityUSD: reserve.totalLiquidityUSD.toString(),
        availableLiquidity: reserve.availableLiquidity.toString(),
        availableLiquidityUSD: reserve.availableLiquidityUSD.toString(),
        totalBorrows: reserve.totalBorrows.toString(),
        totalBorrowsUSD: reserve.totalBorrowsUSD.toString(),
        liquidityRate: reserve.liquidityRate.toString(),
        variableBorrowRate: reserve.variableBorrowRate.toString(),
        stableBorrowRate: reserve.stableBorrowRate.toString(),
        averageStableBorrowRate: reserve.averageStableBorrowRate.toString(),
        totalStableDebt: reserve.totalStableDebt.toString(),
        totalStableDebtUSD: reserve.totalStableDebtUSD.toString(),
        totalVariableDebt: reserve.totalVariableDebt.toString(),
        totalVariableDebtUSD: reserve.totalVariableDebtUSD.toString(),
        reserveFactor: reserve.reserveFactor.toString(),
        configuration: {
          ltv: reserve.configuration.ltv,
          liquidationThreshold: reserve.configuration.liquidationThreshold,
          liquidationBonus: reserve.configuration.liquidationBonus,
          isActive: reserve.configuration.isActive,
          isFrozen: reserve.configuration.isFrozen,
          borrowingEnabled: reserve.configuration.borrowingEnabled,
          stableBorrowRateEnabled: reserve.configuration.stableBorrowRateEnabled,
          usageAsCollateralEnabled: reserve.configuration.usageAsCollateralEnabled
        }
      }

      // Cache reserve data
      this.reserveCache.set(assetAddress, reserveData)

      return reserveData
    } catch (error) {
      this.logger.error(`Failed to get reserve data for ${assetAddress}:`, error)
      return null
    }
  }

  /**
   * Get user reserve data
   */
  async getUserReserveData(assetAddress: string, userAddress: string): Promise<UserReserveData | null> {
    try {
      const userReservesData = await this.baseSdk.readContract({
        address: AAVE_V3_BASE_ADDRESSES.UI_POOL_DATA_PROVIDER,
        abi: this.uiPoolDataProviderAbi,
        functionName: 'getUserReservesData',
        args: [AAVE_V3_BASE_ADDRESSES.POOL_ADDRESSES_PROVIDER, userAddress]
      })

      // Find the specific user reserve
      const userReserve = userReservesData.find((r: any) =>
        r.underlyingAsset.toLowerCase() === assetAddress.toLowerCase()
      )

      if (!userReserve) {
        return null
      }

      return {
        underlyingAsset: userReserve.underlyingAsset,
        scaledATokenBalance: userReserve.scaledATokenBalance.toString(),
        usageAsCollateralEnabledOnUser: userReserve.usageAsCollateralEnabledOnUser,
        stableBorrowRate: userReserve.stableBorrowRate.toString(),
        scaledVariableDebt: userReserve.scaledVariableDebt.toString(),
        principalStableDebt: userReserve.principalStableDebt.toString(),
        stableBorrowLastUpdateTimestamp: Number(userReserve.stableBorrowLastUpdateTimestamp)
      }
    } catch (error) {
      this.logger.error(`Failed to get user reserve data for ${assetAddress}/${userAddress}:`, error)
      return null
    }
  }

  /**
   * Get all reserves
   */
  async getAllReserves(): Promise<ReserveData[]> {
    try {
      const reservesData = await this.baseSdk.readContract({
        address: AAVE_V3_BASE_ADDRESSES.UI_POOL_DATA_PROVIDER,
        abi: this.uiPoolDataProviderAbi,
        functionName: 'getReservesData',
        args: [AAVE_V3_BASE_ADDRESSES.POOL_ADDRESSES_PROVIDER]
      })

      return reservesData.map((reserve: any) => ({
        symbol: reserve.symbol,
        underlyingAsset: reserve.underlyingAsset,
        price: reserve.price.toString(),
        totalLiquidity: reserve.totalLiquidity.toString(),
        totalLiquidityUSD: reserve.totalLiquidityUSD.toString(),
        availableLiquidity: reserve.availableLiquidity.toString(),
        availableLiquidityUSD: reserve.availableLiquidityUSD.toString(),
        totalBorrows: reserve.totalBorrows.toString(),
        totalBorrowsUSD: reserve.totalBorrowsUSD.toString(),
        liquidityRate: reserve.liquidityRate.toString(),
        variableBorrowRate: reserve.variableBorrowRate.toString(),
        stableBorrowRate: reserve.stableBorrowRate.toString(),
        averageStableBorrowRate: reserve.averageStableBorrowRate.toString(),
        totalStableDebt: reserve.totalStableDebt.toString(),
        totalStableDebtUSD: reserve.totalStableDebtUSD.toString(),
        totalVariableDebt: reserve.totalVariableDebt.toString(),
        totalVariableDebtUSD: reserve.totalVariableDebtUSD.toString(),
        reserveFactor: reserve.reserveFactor.toString(),
        configuration: {
          ltv: reserve.configuration.ltv,
          liquidationThreshold: reserve.configuration.liquidationThreshold,
          liquidationBonus: reserve.configuration.liquidationBonus,
          isActive: reserve.configuration.isActive,
          isFrozen: reserve.configuration.isFrozen,
          borrowingEnabled: reserve.configuration.borrowingEnabled,
          stableBorrowRateEnabled: reserve.configuration.stableBorrowRateEnabled,
          usageAsCollateralEnabled: reserve.configuration.usageAsCollateralEnabled
        }
      }))
    } catch (error) {
      this.logger.error('Failed to get all reserves:', error)
      return []
    }
  }

  /**
   * Get asset price from price oracle
   */
  async getAssetPrice(assetAddress: string): Promise<string> {
    try {
      const price = await this.baseSdk.readContract({
        address: AAVE_V3_BASE_ADDRESSES.PRICE_ORACLE,
        abi: this.priceOracleAbi,
        functionName: 'getAssetPrice',
        args: [assetAddress]
      })

      return price.toString()
    } catch (error) {
      this.logger.error(`Failed to get asset price for ${assetAddress}:`, error)
      return '0'
    }
  }

  /**
   * Get multiple asset prices
   */
  async getAssetsPrices(assetAddresses: string[]): Promise<Record<string, string>> {
    try {
      const prices = await this.baseSdk.readContract({
        address: AAVE_V3_BASE_ADDRESSES.PRICE_ORACLE,
        abi: this.priceOracleAbi,
        functionName: 'getAssetsPrices',
        args: [assetAddresses]
      })

      const priceMap: Record<string, string> = {}
      assetAddresses.forEach((address, index) => {
        priceMap[address] = prices[index].toString()
      })

      return priceMap
    } catch (error) {
      this.logger.error('Failed to get assets prices:', error)
      return {}
    }
  }

  // ============ COLLATERAL MANAGEMENT ============

  /**
   * Enable/disable asset as collateral
   */
  async setUserUseReserveAsCollateral(assetAddress: string, useAsCollateral: boolean): Promise<string> {
    try {
      const hash = await this.baseSdk.writeContract({
        address: AAVE_V3_BASE_ADDRESSES.POOL,
        abi: this.poolAbi,
        functionName: 'setUserUseReserveAsCollateral',
        args: [assetAddress, useAsCollateral]
      })

      this.logger.info(`Collateral setting updated: ${hash}`)
      this.emit('collateral:updated', { hash, assetAddress, useAsCollateral })

      return hash
    } catch (error) {
      this.logger.error('Failed to set collateral usage:', error)
      this.emit('collateral:error', { error, assetAddress, useAsCollateral })
      throw error
    }
  }

  // ============ LIQUIDATION OPERATIONS ============

  /**
   * Execute liquidation call
   */
  async liquidationCall(params: {
    collateralAsset: string
    debtAsset: string
    user: string
    debtToCover: string
    receiveAToken: boolean
  }): Promise<string> {
    try {
      const hash = await this.baseSdk.writeContract({
        address: AAVE_V3_BASE_ADDRESSES.POOL,
        abi: this.poolAbi,
        functionName: 'liquidationCall',
        args: [
          params.collateralAsset,
          params.debtAsset,
          params.user,
          params.debtToCover,
          params.receiveAToken
        ]
      })

      this.logger.info(`Liquidation executed: ${hash}`)
      this.emit('liquidation:executed', { hash, params })

      return hash
    } catch (error) {
      this.logger.error('Failed to execute liquidation:', error)
      this.emit('liquidation:error', { error, params })
      throw error
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Calculate health factor
   */
  calculateHealthFactor(totalCollateral: string, totalDebt: string, liquidationThreshold: number): string {
    try {
      const collateral = parseFloat(totalCollateral)
      const debt = parseFloat(totalDebt)

      if (debt === 0) return 'Infinity'

      const adjustedCollateral = collateral * (liquidationThreshold / 10000) // Convert basis points
      return (adjustedCollateral / debt).toString()
    } catch (error) {
      this.logger.error('Failed to calculate health factor:', error)
      return '0'
    }
  }

  /**
   * Calculate maximum borrow amount
   */
  calculateMaxBorrowAmount(
    availableBorrowsBase: string,
    assetPrice: string,
    decimals: number
  ): string {
    try {
      const availableBorrows = parseFloat(availableBorrowsBase)
      const price = parseFloat(assetPrice)

      if (price === 0) return '0'

      const maxBorrow = availableBorrows / price
      return (maxBorrow * Math.pow(10, decimals)).toString()
    } catch (error) {
      this.logger.error('Failed to calculate max borrow amount:', error)
      return '0'
    }
  }

  /**
   * Get interest rate modes
   */
  getInterestRateModes(): { [key: number]: string } {
    return {
      1: 'Stable',
      2: 'Variable'
    }
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
        cachedReserves: this.reserveCache.size,
        cachedUserData: this.userDataCache.size
      }
    }
  }

  /**
   * Clear caches
   */
  clearCaches(): void {
    this.reserveCache.clear()
    this.userDataCache.clear()
    this.logger.info('Aave V3 caches cleared')
  }

  /**
   * Get contract addresses
   */
  getContractAddresses(): typeof AAVE_V3_BASE_ADDRESSES {
    return AAVE_V3_BASE_ADDRESSES
  }
}

export default AaveV3Service
