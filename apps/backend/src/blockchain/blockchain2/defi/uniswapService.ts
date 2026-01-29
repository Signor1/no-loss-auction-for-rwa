import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import logger from '../../utils/logger'

// Uniswap V3 contract addresses on Base
const UNISWAP_V3_BASE_ADDRESSES = {
  FACTORY: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
  SWAP_ROUTER: '0x2626664c2603336E57B271c5C0b26F421741e4815',
  QUOTER: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B579a',
  NONFUNGIBLE_POSITION_MANAGER: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
  WETH9: '0x4200000000000000000000000000000000000006'
}

// Token interfaces
export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

export interface Pool {
  id: string
  token0: Token
  token1: Token
  fee: number
  liquidity: string
  sqrtPriceX96: string
  tick: number
  tickSpacing: number
  volume24h: string
  tvl: string
}

export interface Position {
  id: string
  owner: string
  pool: Pool
  tokenId: string
  liquidity: string
  tickLower: number
  tickUpper: number
  tokensOwed0: string
  tokensOwed1: string
  feeGrowthInside0LastX128: string
  feeGrowthInside1LastX128: string
}

export interface SwapQuote {
  amountIn: string
  amountOut: string
  amountOutMin: string
  path: string[]
  priceImpact: string
  gasEstimate: string
}

export interface SwapParams {
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOutMin: string
  recipient: string
  deadline: number
  fee: number
}

export interface PoolInfo {
  poolAddress: string
  token0: Token
  token1: Token
  fee: number
  liquidity: string
  sqrtPriceX96: string
  tick: number
  tickSpacing: number
  token0Price: string
  token1Price: string
  volume24h: string
  tvl: string
  apr: string
}

/**
 * Uniswap V3 Integration Service for Base
 * Provides comprehensive Uniswap V3 functionality on Base network
 */
export class UniswapV3Service extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private factoryAbi: any[] = []
  private routerAbi: any[] = []
  private quoterAbi: any[] = []
  private positionManagerAbi: any[] = []
  private poolAbi: any[] = []
  private tokenCache: Map<string, Token> = new Map()
  private poolCache: Map<string, Pool> = new Map()

  constructor(baseSdk: BaseSdkService, loggerInstance: typeof logger) {
    super()
    this.baseSdk = baseSdk
    this.logger = logger
    this.initializeABIs()
  }

  // Initialize contract ABIs
  private initializeABIs(): void {
    // Factory ABI - create pool, get pool
    this.factoryAbi = [
      'function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)',
      'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
      'function owner() external view returns (address)',
      'function feeAmountTickSpacing(uint24) external view returns (int24)',
      'function getPool(address,address,uint24) external view returns (address)',
      'function allPairsLength() external view returns (uint)',
      'function allPairs(uint) external view returns (address)',
      'function setOwner(address) external',
      'function setFeeTo(address) external',
      'function setFeeToSetter(address) external'
    ]

    // Swap Router ABI
    this.routerAbi = [
      'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
      'function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)',
      'function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)',
      'function exactOutput((bytes path, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum)) external payable returns (uint256 amountIn)',
      'function multicall(bytes[] data) external payable returns (bytes[] results)',
      'function unwrapWETH9(uint256 amountMinimum, address recipient) external payable',
      'function refundETH() external payable',
      'function sweepToken(address token, uint256 amountMinimum, address recipient) external payable'
    ]

    // Quoter ABI
    this.quoterAbi = [
      'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
      'function quoteExactInput(bytes path, uint256 amountIn) external returns (uint256 amountOut)',
      'function quoteExactOutputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountOut, uint160 sqrtPriceLimitX96) external returns (uint256 amountIn)',
      'function quoteExactOutput(bytes path, uint256 amountOut) external returns (uint256 amountIn)'
    ]

    // Position Manager ABI
    this.positionManagerAbi = [
      'function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
      'function increaseLiquidity((uint256 tokenId, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint128 liquidity, uint256 amount0, uint256 amount1)',
      'function decreaseLiquidity((uint256 tokenId, uint128 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint256 amount0, uint256 amount1)',
      'function collect((uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max)) external payable returns (uint256 amount0, uint256 amount1)',
      'function burn(uint256 tokenId) external payable',
      'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
      'function ownerOf(uint256 tokenId) external view returns (address)',
      'function balanceOf(address owner) external view returns (uint256)',
      'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
      'function totalSupply() external view returns (uint256)',
      'function tokenURI(uint256 tokenId) external view returns (string)',
      'function approve(address to, uint256 tokenId) external',
      'function getApproved(uint256 tokenId) external view returns (address)',
      'function setApprovalForAll(address operator, bool approved) external',
      'function isApprovedForAll(address owner, address operator) external view returns (bool)',
      'function transferFrom(address from, address to, uint256 tokenId) external',
      'function safeTransferFrom(address from, address to, uint256 tokenId) external',
      'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) external'
    ]

    // Pool ABI
    this.poolAbi = [
      'function token0() external view returns (address)',
      'function token1() external view returns (address)',
      'function fee() external view returns (uint24)',
      'function tickSpacing() external view returns (int24)',
      'function liquidity() external view returns (uint128)',
      'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
      'function ticks(int24 tick) external view returns (uint128 liquidityGross, int128 liquidityNet, uint256 feeGrowthOutside0X128, uint256 feeGrowthOutside1X128, int56 tickCumulativeOutside, uint160 secondsPerLiquidityOutsideX128, uint32 secondsOutside, bool initialized)',
      'function tickBitmap(int16 wordPosition) external view returns (uint256)',
      'function positions(bytes32 key) external view returns (uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
      'function observations(uint256 index) external view returns (uint32 blockTimestamp, int56 tickCumulative, uint160 secondsPerLiquidityCumulativeX128, bool initialized)',
      'function observe(uint32[] secondsAgos) external view returns (int56[] tickCumulatives, uint160[] secondsPerLiquidityCumulativeX128s)',
      'function snapshotCumulativesInside(int24 tickLower, int24 tickUpper) external view returns (int56 tickCumulativeInside, uint160 secondsPerLiquidityInsideX128, uint32 secondsInside)',
      'function protocolFees() external view returns (uint128 token0, uint128 token1)',
      'function factory() external view returns (address)',
      'function maxLiquidityPerTick() external view returns (uint128)',
      'function flash(address recipient, uint256 amount0, uint256 amount1, bytes data) external',
      'function collect(address recipient, int24 tickLower, int24 tickUpper, uint128 amount0Requested, uint128 amount1Requested) external returns (uint128 amount0, uint128 amount1)',
      'function collectProtocol(address recipient, uint128 amount0Requested, uint128 amount1Requested) external returns (uint128 amount0, uint128 amount1)',
      'function setFeeProtocol(uint8 feeProtocol0, uint8 feeProtocol1) external',
      'function increaseObservationCardinalityNext(uint16 observationCardinalityNext) external'
    ]
  }

  // ============ TOKEN OPERATIONS ============

  /**
   * Get token information
   */
  async getToken(tokenAddress: string): Promise<Token> {
    try {
      // Check cache first
      if (this.tokenCache.has(tokenAddress)) {
        return this.tokenCache.get(tokenAddress)!
      }

      // Get token metadata
      const metadata = await this.baseSdk.getTokenMetadata(tokenAddress)

      const token: Token = {
        address: tokenAddress,
        symbol: metadata.symbol,
        name: metadata.name,
        decimals: metadata.decimals
      }

      // Cache token
      this.tokenCache.set(tokenAddress, token)

      return token
    } catch (error) {
      this.logger.error(`Failed to get token ${tokenAddress}:`, error)
      throw error
    }
  }

  /**
   * Get multiple tokens
   */
  async getTokens(tokenAddresses: string[]): Promise<Token[]> {
    const promises = tokenAddresses.map(address => this.getToken(address))
    return await Promise.all(promises)
  }

  // ============ POOL OPERATIONS ============

  /**
   * Get pool address
   */
  async getPoolAddress(tokenA: string, tokenB: string, fee: number): Promise<string | null> {
    try {
      const result = await this.baseSdk.readContract({
        address: UNISWAP_V3_BASE_ADDRESSES.FACTORY,
        abi: this.factoryAbi,
        functionName: 'getPool',
        args: [tokenA, tokenB, fee]
      })

      return result as string
    } catch (error) {
      this.logger.error(`Failed to get pool address for ${tokenA}/${tokenB}/${fee}:`, error)
      return null
    }
  }

  /**
   * Get pool information
   */
  async getPoolInfo(tokenA: string, tokenB: string, fee: number): Promise<PoolInfo | null> {
    try {
      const poolAddress = await this.getPoolAddress(tokenA, tokenB, fee)
      if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') {
        return null
      }

      // Get pool data
      const [token0Address, token1Address, poolFee, tickSpacing, liquidity, slot0] =
        await this.baseSdk.readContractBatch([
          { address: poolAddress, abi: this.poolAbi, functionName: 'token0' },
          { address: poolAddress, abi: this.poolAbi, functionName: 'token1' },
          { address: poolAddress, abi: this.poolAbi, functionName: 'fee' },
          { address: poolAddress, abi: this.poolAbi, functionName: 'tickSpacing' },
          { address: poolAddress, abi: this.poolAbi, functionName: 'liquidity' },
          { address: poolAddress, abi: this.poolAbi, functionName: 'slot0' }
        ])

      // Get tokens
      const [token0, token1] = await this.getTokens([token0Address, token1Address])

      // Calculate prices
      const sqrtPriceX96 = slot0[0]
      const tick = slot0[1]
      const token0Price = this.calculateTokenPrice(sqrtPriceX96, token0.decimals, token1.decimals, false)
      const token1Price = this.calculateTokenPrice(sqrtPriceX96, token0.decimals, token1.decimals, true)

      // Mock volume and TVL (would need subgraph or external data)
      const volume24h = '0'
      const tvl = (Number(liquidity) / 10 ** 18).toString() // Simple ETH conversion
      const apr = '0' // Would need additional calculation

      return {
        poolAddress,
        token0,
        token1,
        fee: poolFee,
        liquidity: liquidity.toString(),
        sqrtPriceX96: sqrtPriceX96.toString(),
        tick,
        tickSpacing,
        token0Price,
        token1Price,
        volume24h,
        tvl,
        apr
      }
    } catch (error) {
      this.logger.error(`Failed to get pool info for ${tokenA}/${tokenB}/${fee}:`, error)
      return null
    }
  }

  /**
   * Get all pools for a token
   */
  async getTokenPools(tokenAddress: string): Promise<PoolInfo[]> {
    try {
      // This would typically use a subgraph query
      // For now, return empty array
      this.logger.warn('getTokenPools not fully implemented - requires subgraph integration')
      return []
    } catch (error) {
      this.logger.error(`Failed to get pools for token ${tokenAddress}:`, error)
      return []
    }
  }

  // ============ SWAP OPERATIONS ============

  /**
   * Get swap quote
   */
  async getSwapQuote(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    fee?: number
  }): Promise<SwapQuote | null> {
    try {
      const fee = params.fee || 3000 // 0.3% default fee

      const amountOut = await this.baseSdk.readContract({
        address: UNISWAP_V3_BASE_ADDRESSES.QUOTER,
        abi: this.quoterAbi,
        functionName: 'quoteExactInputSingle',
        args: [params.tokenIn, params.tokenOut, fee, params.amountIn, 0]
      })

      // Calculate price impact (simplified)
      const priceImpact = '0.1' // Would need more complex calculation

      // Estimate gas
      const gasEstimate = '150000'

      return {
        amountIn: params.amountIn,
        amountOut: amountOut.toString(),
        amountOutMin: (BigInt(amountOut.toString()) * 95n / 100n).toString(), // 5% slippage
        path: [params.tokenIn, params.tokenOut],
        priceImpact,
        gasEstimate
      }
    } catch (error) {
      this.logger.error('Failed to get swap quote:', error)
      return null
    }
  }

  /**
   * Execute swap
   */
  async executeSwap(params: SwapParams): Promise<string> {
    try {
      // Prepare swap data
      const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1800 // 30 minutes

      const swapParams = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        fee: params.fee,
        recipient: params.recipient,
        deadline,
        amountIn: params.amountIn,
        amountOutMinimum: params.amountOutMin,
        sqrtPriceLimitX96: 0
      }

      // Execute swap
      const hash = await this.baseSdk.writeContract({
        address: UNISWAP_V3_BASE_ADDRESSES.SWAP_ROUTER,
        abi: this.routerAbi,
        functionName: 'exactInputSingle',
        args: [swapParams]
      })

      this.logger.info(`Swap executed: ${hash}`)
      this.emit('swap:executed', { hash, params })

      return hash
    } catch (error) {
      this.logger.error('Failed to execute swap:', error)
      this.emit('swap:error', { error, params })
      throw error
    }
  }

  /**
   * Get swap history for address
   */
  async getSwapHistory(address: string, limit: number = 50): Promise<any[]> {
    try {
      // This would typically use event indexing or subgraph
      // For now, return empty array
      this.logger.warn('getSwapHistory not fully implemented - requires event indexing')
      return []
    } catch (error) {
      this.logger.error(`Failed to get swap history for ${address}:`, error)
      return []
    }
  }

  // ============ LIQUIDITY OPERATIONS ============

  /**
   * Get user positions
   */
  async getUserPositions(userAddress: string): Promise<Position[]> {
    try {
      // Get position count
      const balance = await this.baseSdk.readContract({
        address: UNISWAP_V3_BASE_ADDRESSES.NONFUNGIBLE_POSITION_MANAGER,
        abi: this.positionManagerAbi,
        functionName: 'balanceOf',
        args: [userAddress]
      })

      const positions: Position[] = []

      for (let i = 0; i < balance; i++) {
        try {
          // Get token ID
          const tokenId = await this.baseSdk.readContract({
            address: UNISWAP_V3_BASE_ADDRESSES.NONFUNGIBLE_POSITION_MANAGER,
            abi: this.positionManagerAbi,
            functionName: 'tokenOfOwnerByIndex',
            args: [userAddress, i]
          })

          // Get position data
          const positionData = await this.baseSdk.readContract({
            address: UNISWAP_V3_BASE_ADDRESSES.NONFUNGIBLE_POSITION_MANAGER,
            abi: this.positionManagerAbi,
            functionName: 'positions',
            args: [tokenId]
          })

          // Parse position data
          const [
            nonce,
            operator,
            token0Address,
            token1Address,
            fee,
            tickLower,
            tickUpper,
            liquidity,
            feeGrowthInside0LastX128,
            feeGrowthInside1LastX128,
            tokensOwed0,
            tokensOwed1
          ] = positionData

          // Get tokens
          const [token0, token1] = await this.getTokens([token0Address, token1Address])

          // Get pool info
          const pool = await this.getPoolInfo(token0Address, token1Address, fee)
          if (!pool) continue

          const position: Position = {
            id: tokenId.toString(),
            owner: userAddress,
            pool: pool as Pool,
            tokenId: tokenId.toString(),
            liquidity: liquidity.toString(),
            tickLower,
            tickUpper,
            tokensOwed0: tokensOwed0.toString(),
            tokensOwed1: tokensOwed1.toString(),
            feeGrowthInside0LastX128: feeGrowthInside0LastX128.toString(),
            feeGrowthInside1LastX128: feeGrowthInside1LastX128.toString()
          }

          positions.push(position)
        } catch (error) {
          this.logger.error(`Failed to get position ${i} for ${userAddress}:`, error)
        }
      }

      return positions
    } catch (error) {
      this.logger.error(`Failed to get positions for ${userAddress}:`, error)
      return []
    }
  }

  /**
   * Add liquidity to pool
   */
  async addLiquidity(params: {
    token0: string
    token1: string
    fee: number
    tickLower: number
    tickUpper: number
    amount0Desired: string
    amount1Desired: string
    amount0Min: string
    amount1Min: string
    recipient: string
    deadline?: number
  }): Promise<{
    tokenId: string
    liquidity: string
    amount0: string
    amount1: string
  }> {
    try {
      const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1800 // 30 minutes

      const mintParams = {
        token0: params.token0,
        token1: params.token1,
        fee: params.fee,
        tickLower: params.tickLower,
        tickUpper: params.tickUpper,
        amount0Desired: params.amount0Desired,
        amount1Desired: params.amount1Desired,
        amount0Min: params.amount0Min,
        amount1Min: params.amount1Min,
        recipient: params.recipient,
        deadline
      }

      const result = await this.baseSdk.writeContract({
        address: UNISWAP_V3_BASE_ADDRESSES.NONFUNGIBLE_POSITION_MANAGER,
        abi: this.positionManagerAbi,
        functionName: 'mint',
        args: [mintParams]
      })

      this.logger.info(`Liquidity added: ${result}`)
      this.emit('liquidity:added', { hash: result, params })

      // Parse result (would need to decode actual return values)
      return {
        tokenId: '0', // Would be parsed from transaction receipt
        liquidity: '0',
        amount0: '0',
        amount1: '0'
      }
    } catch (error) {
      this.logger.error('Failed to add liquidity:', error)
      this.emit('liquidity:error', { error, params })
      throw error
    }
  }

  /**
   * Remove liquidity from position
   */
  async removeLiquidity(params: {
    tokenId: string
    liquidity: string
    amount0Min: string
    amount1Min: string
    deadline?: number
  }): Promise<{
    amount0: string
    amount1: string
  }> {
    try {
      const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1800 // 30 minutes

      const decreaseParams = {
        tokenId: params.tokenId,
        liquidity: params.liquidity,
        amount0Min: params.amount0Min,
        amount1Min: params.amount1Min,
        deadline
      }

      const hash = await this.baseSdk.writeContract({
        address: UNISWAP_V3_BASE_ADDRESSES.NONFUNGIBLE_POSITION_MANAGER,
        abi: this.positionManagerAbi,
        functionName: 'decreaseLiquidity',
        args: [decreaseParams]
      })

      this.logger.info(`Liquidity removed: ${hash}`)
      this.emit('liquidity:removed', { hash, params })

      // Would parse actual amounts from transaction receipt
      return {
        amount0: '0',
        amount1: '0'
      }
    } catch (error) {
      this.logger.error('Failed to remove liquidity:', error)
      this.emit('liquidity:error', { error, params })
      throw error
    }
  }

  /**
   * Collect fees from position
   */
  async collectFees(params: {
    tokenId: string
    recipient: string
    amount0Max: string
    amount1Max: string
  }): Promise<{
    amount0: string
    amount1: string
  }> {
    try {
      const collectParams = {
        tokenId: params.tokenId,
        recipient: params.recipient,
        amount0Max: params.amount0Max,
        amount1Max: params.amount1Max
      }

      const hash = await this.baseSdk.writeContract({
        address: UNISWAP_V3_BASE_ADDRESSES.NONFUNGIBLE_POSITION_MANAGER,
        abi: this.positionManagerAbi,
        functionName: 'collect',
        args: [collectParams]
      })

      this.logger.info(`Fees collected: ${hash}`)
      this.emit('fees:collected', { hash, params })

      // Would parse actual amounts from transaction receipt
      return {
        amount0: '0',
        amount1: '0'
      }
    } catch (error) {
      this.logger.error('Failed to collect fees:', error)
      this.emit('fees:error', { error, params })
      throw error
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Calculate token price from sqrt price
   */
  private calculateTokenPrice(
    sqrtPriceX96: bigint,
    token0Decimals: number,
    token1Decimals: number,
    invert: boolean = false
  ): string {
    try {
      const price = (Number(sqrtPriceX96) / 2 ** 96) ** 2
      const adjustedPrice = price * (10 ** token0Decimals) / (10 ** token1Decimals)
      return invert ? (1 / adjustedPrice).toString() : adjustedPrice.toString()
    } catch (error) {
      this.logger.error('Failed to calculate token price:', error)
      return '0'
    }
  }

  /**
   * Get fee tiers
   */
  getFeeTiers(): number[] {
    return [500, 3000, 10000] // 0.05%, 0.3%, 1%
  }

  /**
   * Get tick spacing for fee
   */
  async getTickSpacing(fee: number): Promise<number> {
    try {
      const spacing = await this.baseSdk.readContract({
        address: UNISWAP_V3_BASE_ADDRESSES.FACTORY,
        abi: this.factoryAbi,
        functionName: 'feeAmountTickSpacing',
        args: [fee]
      })

      return Number(spacing)
    } catch (error) {
      this.logger.error(`Failed to get tick spacing for fee ${fee}:`, error)
      return 60 // Default spacing
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
        cachedTokens: this.tokenCache.size,
        cachedPools: this.poolCache.size
      }
    }
  }

  /**
   * Clear caches
   */
  clearCaches(): void {
    this.tokenCache.clear()
    this.poolCache.clear()
    this.logger.info('Uniswap V3 caches cleared')
  }
}

export default UniswapV3Service
