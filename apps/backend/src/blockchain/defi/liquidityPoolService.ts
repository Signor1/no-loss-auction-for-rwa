import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import UniswapV3Service from './uniswapService'
import AerodromeService from './aerodromeService'
import VelodromeService from './velodromeService'
import logger from '../../utils/logger'

// Interfaces
export interface LiquidityPosition {
  id: string
  protocol: 'uniswap' | 'aerodrome' | 'velodrome'
  poolAddress: string
  token0: {
    address: string
    symbol: string
    amount: string
    valueUSD: string
  }
  token1: {
    address: string
    symbol: string
    amount: string
    valueUSD: string
  }
  liquidity: string
  feesEarned: {
    token0: string
    token1: string
    totalUSD: string
  }
  apr: string
  impermanentLoss: string
  owner: string
  createdAt: Date
  updatedAt: Date
}

export interface PoolMetrics {
  protocol: string
  poolAddress: string
  tvl: string
  volume24h: string
  fees24h: string
  apr: string
  utilization: string
  impermanentLossRisk: 'low' | 'medium' | 'high'
  volatility: string
}

export interface RebalanceRecommendation {
  positionId: string
  action: 'add' | 'remove' | 'rebalance' | 'harvest'
  reason: string
  expectedImprovement: {
    apr: string
    impermanentLoss: string
    netGain: string
  }
  urgency: 'low' | 'medium' | 'high'
  suggestedParams?: any
}

export interface LiquidityPoolConfig {
  protocol: string
  tokenA: string
  tokenB: string
  fee?: number
  stable?: boolean
  minLiquidity: string
  maxSlippage: number
  rebalanceThreshold: number
  autoCompound: boolean
  autoRebalance: boolean
}

/**
 * Comprehensive Liquidity Pool Management Service
 * Manages liquidity positions across multiple DEX protocols on Base
 */
export class LiquidityPoolService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private uniswapService: UniswapV3Service
  private aerodromeService: AerodromeService
  private velodromeService: VelodromeService
  private positions: Map<string, LiquidityPosition> = new Map()
  private poolConfigs: Map<string, LiquidityPoolConfig> = new Map()
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    uniswapService: UniswapV3Service,
    aerodromeService: AerodromeService,
    velodromeService: VelodromeService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.uniswapService = uniswapService
    this.aerodromeService = aerodromeService
    this.velodromeService = velodromeService
    this.logger = loggerInstance
  }

  // ============ POSITION MANAGEMENT ============

  /**
   * Add liquidity to a pool
   */
  async addLiquidity(params: {
    protocol: 'uniswap' | 'aerodrome' | 'velodrome'
    tokenA: string
    tokenB: string
    amountA: string
    amountB: string
    fee?: number
    stable?: boolean
    slippage?: number
    owner: string
  }): Promise<LiquidityPosition> {
    try {
      const slippage = params.slippage || 0.5 // 0.5% default slippage
      const amountAMin = (BigInt(params.amountA) * BigInt((100 - slippage) * 100) / 10000n).toString()
      const amountBMin = (BigInt(params.amountB) * BigInt((100 - slippage) * 100) / 10000n).toString()

      let result: any
      let positionId: string

      switch (params.protocol) {
        case 'uniswap':
          result = await this.uniswapService.addLiquidity({
            token0: params.tokenA,
            token1: params.tokenB,
            fee: params.fee || 3000,
            tickLower: -887272, // Full range
            tickUpper: 887272,  // Full range
            amount0Desired: params.amountA,
            amount1Desired: params.amountB,
            amount0Min: amountAMin,
            amount1Min: amountBMin,
            recipient: params.owner,
            deadline: Math.floor(Date.now() / 1000) + 1800
          })
          positionId = result.tokenId
          break

        case 'aerodrome':
          result = await this.aerodromeService.addLiquidity({
            tokenA: params.tokenA,
            tokenB: params.tokenB,
            stable: params.stable || false,
            amountADesired: params.amountA,
            amountBDesired: params.amountB,
            amountAMin: amountAMin,
            amountBMin: amountBMin,
            to: params.owner,
            deadline: Math.floor(Date.now() / 1000) + 1800
          })
          positionId = `${params.protocol}-${params.tokenA}-${params.tokenB}-${Date.now()}`
          break

        case 'velodrome':
          result = await this.velodromeService.addLiquidity({
            tokenA: params.tokenA,
            tokenB: params.tokenB,
            stable: params.stable || false,
            amountADesired: params.amountA,
            amountBDesired: params.amountB,
            amountAMin: amountAMin,
            amountBMin: amountBMin,
            to: params.owner,
            deadline: Math.floor(Date.now() / 1000) + 1800
          })
          positionId = `${params.protocol}-${params.tokenA}-${params.tokenB}-${Date.now()}`
          break

        default:
          throw new Error(`Unsupported protocol: ${params.protocol}`)
      }

      // Create position record
      const position: LiquidityPosition = {
        id: positionId,
        protocol: params.protocol,
        poolAddress: await this.getPoolAddress(params.protocol, params.tokenA, params.tokenB, params.fee, params.stable),
        token0: {
          address: params.tokenA,
          symbol: await this.getTokenSymbol(params.tokenA),
          amount: result.amountA || params.amountA,
          valueUSD: '0' // Would need price data
        },
        token1: {
          address: params.tokenB,
          symbol: await this.getTokenSymbol(params.tokenB),
          amount: result.amountB || params.amountB,
          valueUSD: '0' // Would need price data
        },
        liquidity: result.liquidity || '0',
        feesEarned: {
          token0: '0',
          token1: '0',
          totalUSD: '0'
        },
        apr: '0', // Would need calculation
        impermanentLoss: '0',
        owner: params.owner,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.positions.set(positionId, position)
      this.emit('position:created', { position, params })

      return position
    } catch (error) {
      this.logger.error('Failed to add liquidity:', error)
      this.emit('liquidity:error', { error, params })
      throw error
    }
  }

  /**
   * Remove liquidity from a position
   */
  async removeLiquidity(params: {
    positionId: string
    liquidity: string
    amountAMin: string
    amountBMin: string
    owner: string
  }): Promise<{
    amountA: string
    amountB: string
  }> {
    try {
      const position = this.positions.get(params.positionId)
      if (!position) {
        throw new Error(`Position ${params.positionId} not found`)
      }

      let result: any

      switch (position.protocol) {
        case 'uniswap':
          // For Uniswap, we need the tokenId
          result = await this.uniswapService.removeLiquidity({
            tokenId: position.id,
            liquidity: params.liquidity,
            amount0Min: params.amountAMin,
            amount1Min: params.amountBMin,
            deadline: Math.floor(Date.now() / 1000) + 1800
          })
          break

        case 'aerodrome':
          result = await this.aerodromeService.removeLiquidity({
            tokenA: position.token0.address,
            tokenB: position.token1.address,
            stable: false, // Would need to store this in position
            liquidity: params.liquidity,
            amountAMin: params.amountAMin,
            amountBMin: params.amountBMin,
            to: params.owner,
            deadline: Math.floor(Date.now() / 1000) + 1800
          })
          break

        case 'velodrome':
          result = await this.velodromeService.removeLiquidity({
            tokenA: position.token0.address,
            tokenB: position.token1.address,
            stable: false, // Would need to store this in position
            liquidity: params.liquidity,
            amountAMin: params.amountAMin,
            amountBMin: params.amountBMin,
            to: params.owner,
            deadline: Math.floor(Date.now() / 1000) + 1800
          })
          break

        default:
          throw new Error(`Unsupported protocol: ${position.protocol}`)
      }

      // Update position
      position.liquidity = (BigInt(position.liquidity) - BigInt(params.liquidity)).toString()
      position.updatedAt = new Date()
      this.positions.set(params.positionId, position)

      this.emit('position:updated', { position, action: 'remove', params })

      return {
        amountA: result.amountA || params.amountAMin,
        amountB: result.amountB || params.amountBMin
      }
    } catch (error) {
      this.logger.error('Failed to remove liquidity:', error)
      this.emit('liquidity:error', { error, params })
      throw error
    }
  }

  /**
   * Harvest fees from a position
   */
  async harvestFees(positionId: string): Promise<{
    token0Fees: string
    token1Fees: string
    totalUSD: string
  }> {
    try {
      const position = this.positions.get(positionId)
      if (!position) {
        throw new Error(`Position ${positionId} not found`)
      }

      let result: any

      switch (position.protocol) {
        case 'uniswap':
          result = await this.uniswapService.collectFees({
            tokenId: position.id,
            recipient: position.owner,
            amount0Max: '115792089237316195423570985008687907853269984665640564039457584007913129639935', // 2^256 - 1
            amount1Max: '115792089237316195423570985008687907853269984665640564039457584007913129639935'  // 2^256 - 1
          })
          break

        case 'aerodrome':
        case 'velodrome':
          // These protocols have different fee collection mechanisms
          // Would need specific implementation
          result = { amount0: '0', amount1: '0' }
          break

        default:
          throw new Error(`Unsupported protocol: ${position.protocol}`)
      }

      // Update position fees
      position.feesEarned.token0 = (BigInt(position.feesEarned.token0) + BigInt(result.amount0 || '0')).toString()
      position.feesEarned.token1 = (BigInt(position.feesEarned.token1) + BigInt(result.amount1 || '0')).toString()
      position.updatedAt = new Date()

      this.positions.set(positionId, position)
      this.emit('fees:harvested', { position, fees: result })

      return {
        token0Fees: result.amount0 || '0',
        token1Fees: result.amount1 || '0',
        totalUSD: '0' // Would need price calculation
      }
    } catch (error) {
      this.logger.error('Failed to harvest fees:', error)
      this.emit('fees:error', { error, positionId })
      throw error
    }
  }

  // ============ POSITION MONITORING ============

  /**
   * Get user's liquidity positions
   */
  async getUserPositions(userAddress: string): Promise<LiquidityPosition[]> {
    try {
      const userPositions: LiquidityPosition[] = []

      // Get positions from all protocols
      const [uniswapPositions] = await Promise.all([
        this.uniswapService.getUserPositions(userAddress)
      ])

      // Note: Aerodrome and Velodrome position tracking would need additional implementation
      const aerodromePositions: any[] = []
      const velodromePositions: any[] = []

      // Convert and add Uniswap positions
      for (const pos of uniswapPositions) {
        const position: LiquidityPosition = {
          id: pos.tokenId,
          protocol: 'uniswap',
          poolAddress: pos.pool.id,
          token0: {
            address: pos.pool.token0.address,
            symbol: pos.pool.token0.symbol,
            amount: pos.tokensOwed0,
            valueUSD: '0'
          },
          token1: {
            address: pos.pool.token1.address,
            symbol: pos.pool.token1.symbol,
            amount: pos.tokensOwed1,
            valueUSD: '0'
          },
          liquidity: pos.liquidity,
          feesEarned: {
            token0: pos.tokensOwed0,
            token1: pos.tokensOwed1,
            totalUSD: '0'
          },
          apr: '0',
          impermanentLoss: '0',
          owner: userAddress,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        userPositions.push(position)
        this.positions.set(pos.tokenId, position)
      }

      // Add Aerodrome and Velodrome positions (simplified)
      // Would need proper implementation based on their position tracking

      return userPositions
    } catch (error) {
      this.logger.error(`Failed to get user positions for ${userAddress}:`, error)
      return []
    }
  }

  /**
   * Get position by ID
   */
  getPosition(positionId: string): LiquidityPosition | null {
    return this.positions.get(positionId) || null
  }

  /**
   * Get all positions
   */
  getAllPositions(): LiquidityPosition[] {
    return Array.from(this.positions.values())
  }

  // ============ POOL METRICS & ANALYTICS ============

  /**
   * Get pool metrics
   */
  async getPoolMetrics(protocol: string, poolAddress: string): Promise<PoolMetrics | null> {
    try {
      let pool: any = null

      // Get pool data based on protocol
      switch (protocol) {
        case 'uniswap':
          // Would need to get pool info from Uniswap service
          break
        case 'aerodrome':
          // Would need to get pool info from Aerodrome service
          break
        case 'velodrome':
          // Would need to get pool info from Velodrome service
          break
      }

      if (!pool) return null

      // Calculate metrics
      const metrics: PoolMetrics = {
        protocol,
        poolAddress,
        tvl: pool.tvl || '0',
        volume24h: pool.volume24h || '0',
        fees24h: pool.fees24h || '0',
        apr: pool.apr || '0',
        utilization: '0', // Would need calculation
        impermanentLossRisk: 'medium', // Would need calculation
        volatility: '0' // Would need calculation
      }

      return metrics
    } catch (error) {
      this.logger.error(`Failed to get pool metrics for ${protocol}/${poolAddress}:`, error)
      return null
    }
  }

  /**
   * Calculate impermanent loss for a position
   */
  calculateImpermanentLoss(
    initialToken0Amount: string,
    initialToken1Amount: string,
    currentToken0Amount: string,
    currentToken1Amount: string,
    initialPrice: number,
    currentPrice: number
  ): string {
    try {
      // Simplified IL calculation
      const initialValue = parseFloat(initialToken0Amount) + parseFloat(initialToken1Amount) * initialPrice
      const currentValue = parseFloat(currentToken0Amount) + parseFloat(currentToken1Amount) * currentPrice

      const hodlValue = parseFloat(initialToken0Amount) + parseFloat(initialToken1Amount) * currentPrice

      if (hodlValue === 0) return '0'

      const il = ((hodlValue - currentValue) / hodlValue) * 100
      return il.toFixed(2)
    } catch (error) {
      this.logger.error('Failed to calculate impermanent loss:', error)
      return '0'
    }
  }

  // ============ AUTOMATED MANAGEMENT ============

  /**
   * Configure automated liquidity management
   */
  configureAutomatedManagement(
    positionId: string,
    config: LiquidityPoolConfig
  ): void {
    this.poolConfigs.set(positionId, config)

    // Start monitoring if auto features are enabled
    if (config.autoRebalance || config.autoCompound) {
      this.startPositionMonitoring(positionId, config)
    }

    this.logger.info(`Automated management configured for position ${positionId}`)
  }

  /**
   * Start monitoring a position for automated actions
   */
  private startPositionMonitoring(positionId: string, config: LiquidityPoolConfig): void {
    // Clear existing interval
    const existingInterval = this.monitoringIntervals.get(positionId)
    if (existingInterval) {
      clearInterval(existingInterval)
    }

    // Start new monitoring interval (every 5 minutes)
    const interval = setInterval(async () => {
      try {
        await this.checkAndExecuteAutomatedActions(positionId, config)
      } catch (error) {
        this.logger.error(`Error in automated monitoring for ${positionId}:`, error)
      }
    }, 5 * 60 * 1000)

    this.monitoringIntervals.set(positionId, interval)
  }

  /**
   * Check and execute automated actions
   */
  private async checkAndExecuteAutomatedActions(
    positionId: string,
    config: LiquidityPoolConfig
  ): Promise<void> {
    const position = this.positions.get(positionId)
    if (!position) return

    // Check rebalance conditions
    if (config.autoRebalance) {
      const recommendation = await this.getRebalanceRecommendation(positionId)
      if (recommendation && recommendation.urgency === 'high') {
        await this.executeRebalanceAction(positionId, recommendation)
      }
    }

    // Check compound conditions
    if (config.autoCompound) {
      await this.harvestFees(positionId)
    }
  }

  /**
   * Get rebalance recommendation for a position
   */
  async getRebalanceRecommendation(positionId: string): Promise<RebalanceRecommendation | null> {
    try {
      const position = this.positions.get(positionId)
      if (!position) return null

      // Analyze position metrics
      const metrics = await this.getPoolMetrics(position.protocol, position.poolAddress)
      if (!metrics) return null

      // Simple rebalance logic (would need more sophisticated analysis)
      const utilizationRate = parseFloat(metrics.utilization)
      const impermanentLoss = parseFloat(position.impermanentLoss)

      let recommendation: RebalanceRecommendation | null = null

      if (utilizationRate > 80) {
        recommendation = {
          positionId,
          action: 'remove',
          reason: 'High utilization rate indicates potential impermanent loss',
          expectedImprovement: {
            apr: '-5',
            impermanentLoss: '-10',
            netGain: '-2'
          },
          urgency: 'high'
        }
      } else if (impermanentLoss > 15) {
        recommendation = {
          positionId,
          action: 'rebalance',
          reason: 'High impermanent loss detected',
          expectedImprovement: {
            apr: '2',
            impermanentLoss: '-8',
            netGain: '1'
          },
          urgency: 'medium'
        }
      }

      return recommendation
    } catch (error) {
      this.logger.error(`Failed to get rebalance recommendation for ${positionId}:`, error)
      return null
    }
  }

  /**
   * Execute automated rebalance action
   */
  private async executeRebalanceAction(
    positionId: string,
    recommendation: RebalanceRecommendation
  ): Promise<void> {
    try {
      const position = this.positions.get(positionId)
      if (!position) return

      switch (recommendation.action) {
        case 'harvest':
          await this.harvestFees(positionId)
          break
        case 'rebalance':
          // Would implement rebalancing logic
          this.logger.info(`Rebalancing position ${positionId}`)
          break
        case 'remove':
          // Would implement partial removal logic
          this.logger.info(`Reducing position ${positionId} due to high risk`)
          break
      }

      this.emit('rebalance:executed', { positionId, recommendation })
    } catch (error) {
      this.logger.error(`Failed to execute rebalance action for ${positionId}:`, error)
      this.emit('rebalance:error', { positionId, recommendation, error })
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Get pool address for a protocol
   */
  private async getPoolAddress(
    protocol: string,
    tokenA: string,
    tokenB: string,
    fee?: number,
    stable?: boolean
  ): Promise<string> {
    switch (protocol) {
      case 'uniswap':
        return await this.uniswapService.getPoolAddress(tokenA, tokenB, fee || 3000) || ''
      case 'aerodrome':
        return await this.aerodromeService.getPoolAddress(tokenA, tokenB, stable || false) || ''
      case 'velodrome':
        return await this.velodromeService.getPoolAddress(tokenA, tokenB, stable || false) || ''
      default:
        return ''
    }
  }

  /**
   * Get token symbol
   */
  private async getTokenSymbol(tokenAddress: string): Promise<string> {
    try {
      const metadata = await this.baseSdk.getTokenMetadata(tokenAddress)
      return metadata.symbol
    } catch (error) {
      this.logger.error(`Failed to get token symbol for ${tokenAddress}:`, error)
      return 'UNKNOWN'
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
        activePositions: this.positions.size,
        monitoredPositions: this.monitoringIntervals.size,
        configuredPools: this.poolConfigs.size
      }
    }
  }

  /**
   * Stop all monitoring
   */
  stopAllMonitoring(): void {
    for (const [positionId, interval] of this.monitoringIntervals) {
      clearInterval(interval)
      this.logger.info(`Stopped monitoring for position ${positionId}`)
    }
    this.monitoringIntervals.clear()
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.positions.clear()
    this.poolConfigs.clear()
    this.stopAllMonitoring()
    this.logger.info('All liquidity pool data cleared')
  }
}

export default LiquidityPoolService
