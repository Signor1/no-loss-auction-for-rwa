import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import logger from '../../utils/logger'

// Aerodrome contract addresses on Base
const AERODROME_BASE_ADDRESSES = {
  FACTORY: '0x420DD381b31aEf6683db6B902084cB0FFECAfFdA',
  ROUTER: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
  VOTER: '0x16613524e02ad97eDfeF371bC883F2F5d6C480A5',
  GAUGE_FACTORY: '0xAAA2564DEb4A1C0e0F6a8883bB4F65f8f1d2c0f',
  VE_ART_PROXY: '0xebf418fe2512e7e6bd9b87a8f0f294acdc67e6b4',
  MINTER: '0x09098d84fb1af7e4779a77b8c85a59e4b2b2f3a5',
  POOL: '0x5e7bb104d84c7cb9b682aa15a11a8ea67a0a3f4d'
}

// Aerodrome ABIs (simplified)
const AERODROME_ABIS = {
  FACTORY: [
    'function createPair(address tokenA, address tokenB, bool stable) external returns (address pair)',
    'function getPair(address tokenA, address tokenB, bool stable) external view returns (address pair)',
    'function allPairs(uint) external view returns (address pair)',
    'function allPairsLength() external view returns (uint)',
    'function isPair(address pair) external view returns (bool)',
    'function getInitializable() external view returns (address, address, bool)',
    'function isPaused() external view returns (bool)',
    'function pairCodeHash() external pure returns (bytes32)',
    'function getFee(bool stable) external view returns (uint256)',
    'function MAX_FEE() external pure returns (uint256)'
  ],

  ROUTER: [
    'function addLiquidity(address tokenA, address tokenB, bool stable, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
    'function removeLiquidity(address tokenA, address tokenB, bool stable, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    'function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    'function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)',
    'function getAmountsIn(uint amountOut, address[] memory path) external view returns (uint[] memory amounts)',
    'function removeLiquidityETH(address token, bool stable, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)',
    'function removeLiquidityWithPermit(address tokenA, address tokenB, bool stable, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint amountA, uint amountB)',
    'function removeLiquidityETHWithPermit(address token, bool stable, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint amountToken, uint amountETH)',
    'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
    'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
    'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external'
  ],

  PAIR: [
    'function name() external view returns (string)',
    'function symbol() external view returns (string)',
    'function decimals() external view returns (uint8)',
    'function totalSupply() external view returns (uint)',
    'function balanceOf(address) external view returns (uint)',
    'function allowance(address, address) external view returns (uint)',
    'function approve(address spender, uint value) external returns (bool)',
    'function transfer(address to, uint value) external returns (bool)',
    'function transferFrom(address from, address to, uint value) external returns (bool)',
    'function DOMAIN_SEPARATOR() external view returns (bytes32)',
    'function PERMIT_TYPEHASH() external pure returns (bytes32)',
    'function nonces(address) external view returns (uint)',
    'function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s) external',
    'function MINIMUM_LIQUIDITY() external pure returns (uint)',
    'function factory() external view returns (address)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function price0CumulativeLast() external view returns (uint)',
    'function price1CumulativeLast() external view returns (uint)',
    'function kLast() external view returns (uint)',
    'function mint(address to) external returns (uint liquidity)',
    'function burn(address to) external returns (uint amount0, uint amount1)',
    'function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external',
    'function skim(address to) external',
    'function sync() external',
    'function initialize(address, address) external',
    'function stable() external view returns (bool)',
    'function getAmountOut(uint amountIn, address tokenIn) external view returns (uint)',
    'function currentCumulativePrices() external view returns (uint reserve0Cumulative, uint reserve1Cumulative, uint blockTimestamp)',
    'function claimFees() external returns (uint claimed0, uint claimed1)',
    'function claimable0(address) external view returns (uint)',
    'function claimable1(address) external view returns (uint)',
    'function index0() external view returns (uint)',
    'function index1() external view returns (uint)',
    'function supplyIndex0(address) external view returns (uint)',
    'function supplyIndex1(address) external view returns (uint)'
  ],

  VOTER: [
    'function ve() external view returns (address)',
    'function governor() external view returns (address)',
    'function emergencyCouncil() external view returns (address)',
    'function attachTokenToGauge(uint _tokenId, address account) external',
    'function detachTokenFromGauge(uint _tokenId, address account) external',
    'function emitDeposit(uint _tokenId, address account, uint amount) external',
    'function emitWithdraw(uint _tokenId, address account, uint amount) external',
    'function isWhitelisted(address) external view returns (bool)',
    'function notifyRewardAmount(uint amount) external',
    'function distribute(address _gauge) external',
    'function gauges(address) external view returns (address)',
    'function gaugeToFees(address) external view returns (address)',
    'function gaugeToBribes(address) external view returns (address)',
    'function votes(uint, address) external view returns (uint)',
    'function weights(address) external view returns (uint)',
    'function usedWeights(uint) external view returns (uint)',
    'function lastVoted(uint) external view returns (uint)',
    'function poolVote(uint, uint) external view returns (address)',
    'function votesLength(uint tokenId) external view returns (uint)',
    'function poke(uint tokenId) external',
    'function reset(uint _tokenId) external',
    'function vote(uint tokenId, address[] calldata _poolVote, uint[] calldata _weights) external',
    'function abstain(uint tokenId) external',
    'function increase_amount(uint tokenId, uint mamount) external',
    'function increase_unlock_time(uint tokenId, uint _lock_duration) external',
    'function claimRewards(address[] memory _gauges) external',
    'function claimBribes(address[] memory _bribes, address[][] memory _tokens) external',
    'function claimFees(address[] memory _fees, address[][] memory _tokens) external',
    'function setGovernor(address _governor) external',
    'function setEmergencyCouncil(address _emergencyCouncil) external',
    'function whitelist(address _token) external',
    'function blacklist(address _token) external'
  ]
}

// Interfaces
export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
}

export interface Pool {
  id: string
  address: string
  token0: Token
  token1: Token
  stable: boolean
  reserve0: string
  reserve1: string
  totalSupply: string
  liquidity: string
  volume24h: string
  fees24h: string
  apr: string
}

export interface SwapQuote {
  amountIn: string
  amountOut: string
  amountOutMin: string
  path: string[]
  priceImpact: string
  gasEstimate: string
  fee: string
}

export interface AddLiquidityParams {
  tokenA: string
  tokenB: string
  stable: boolean
  amountADesired: string
  amountBDesired: string
  amountAMin: string
  amountBMin: string
  to: string
  deadline?: number
}

export interface RemoveLiquidityParams {
  tokenA: string
  tokenB: string
  stable: boolean
  liquidity: string
  amountAMin: string
  amountBMin: string
  to: string
  deadline?: number
}

export interface SwapParams {
  amountIn: string
  amountOutMin: string
  path: string[]
  to: string
  deadline?: number
}

/**
 * Aerodrome Integration Service for Base
 * Provides comprehensive Aerodrome DEX functionality on Base network
 */
export class AerodromeService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private factoryAbi: any[] = []
  private routerAbi: any[] = []
  private pairAbi: any[] = []
  private voterAbi: any[] = []
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
    this.factoryAbi = AERODROME_ABIS.FACTORY
    this.routerAbi = AERODROME_ABIS.ROUTER
    this.pairAbi = AERODROME_ABIS.PAIR
    this.voterAbi = AERODROME_ABIS.VOTER
  }

  // ============ POOL OPERATIONS ============

  /**
   * Get pool address
   */
  async getPoolAddress(tokenA: string, tokenB: string, stable: boolean): Promise<string | null> {
    try {
      const result = await this.baseSdk.readContract({
        address: AERODROME_BASE_ADDRESSES.FACTORY,
        abi: this.factoryAbi,
        functionName: 'getPair',
        args: [tokenA, tokenB, stable]
      })

      return result as string
    } catch (error) {
      this.logger.error(`Failed to get pool address for ${tokenA}/${tokenB}/${stable}:`, error)
      return null
    }
  }

  /**
   * Get pool information
   */
  async getPoolInfo(tokenA: string, tokenB: string, stable: boolean): Promise<Pool | null> {
    try {
      const poolAddress = await this.getPoolAddress(tokenA, tokenB, stable)
      if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') {
        return null
      }

      // Get pool data
      const [token0Address, token1Address, reserves, totalSupply, stableFlag] =
        await this.baseSdk.readContractBatch([
          { address: poolAddress, abi: this.pairAbi, functionName: 'token0' },
          { address: poolAddress, abi: this.pairAbi, functionName: 'token1' },
          { address: poolAddress, abi: this.pairAbi, functionName: 'getReserves' },
          { address: poolAddress, abi: this.pairAbi, functionName: 'totalSupply' },
          { address: poolAddress, abi: this.pairAbi, functionName: 'stable' }
        ])

      // Get tokens
      const [token0, token1] = await this.getTokens([token0Address, token1Address])

      const pool: Pool = {
        id: poolAddress,
        address: poolAddress,
        token0,
        token1,
        stable: stableFlag,
        reserve0: reserves[0].toString(),
        reserve1: reserves[1].toString(),
        totalSupply: totalSupply.toString(),
        liquidity: totalSupply.toString(),
        volume24h: '0', // Would need external data
        fees24h: '0',   // Would need external data
        apr: '0'        // Would need calculation
      }

      return pool
    } catch (error) {
      this.logger.error(`Failed to get pool info for ${tokenA}/${tokenB}/${stable}:`, error)
      return null
    }
  }

  /**
   * Get all pairs from factory
   */
  async getAllPairs(): Promise<string[]> {
    try {
      const length = await this.baseSdk.readContract({
        address: AERODROME_BASE_ADDRESSES.FACTORY,
        abi: this.factoryAbi,
        functionName: 'allPairsLength'
      })

      const pairs: string[] = []
      const batchSize = 10

      for (let i = 0; i < length; i += batchSize) {
        const batchPromises = []
        const end = Math.min(i + batchSize, length)

        for (let j = i; j < end; j++) {
          batchPromises.push(
            this.baseSdk.readContract({
              address: AERODROME_BASE_ADDRESSES.FACTORY,
              abi: this.factoryAbi,
              functionName: 'allPairs',
              args: [j]
            })
          )
        }

        const batchResults = await Promise.all(batchPromises)
        pairs.push(...batchResults.map(result => result as string))
      }

      return pairs
    } catch (error) {
      this.logger.error('Failed to get all pairs:', error)
      return []
    }
  }

  // ============ LIQUIDITY OPERATIONS ============

  /**
   * Add liquidity to pool
   */
  async addLiquidity(params: AddLiquidityParams): Promise<{
    amountA: string
    amountB: string
    liquidity: string
  }> {
    try {
      const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1800 // 30 minutes

      const result = await this.baseSdk.writeContract({
        address: AERODROME_BASE_ADDRESSES.ROUTER,
        abi: this.routerAbi,
        functionName: 'addLiquidity',
        args: [
          params.tokenA,
          params.tokenB,
          params.stable,
          params.amountADesired,
          params.amountBDesired,
          params.amountAMin,
          params.amountBMin,
          params.to,
          deadline
        ]
      })

      this.logger.info(`Liquidity added to Aerodrome: ${result}`)
      this.emit('liquidity:added', { hash: result, params })

      // Parse result (would need to decode actual return values)
      return {
        amountA: '0',
        amountB: '0',
        liquidity: '0'
      }
    } catch (error) {
      this.logger.error('Failed to add liquidity:', error)
      this.emit('liquidity:error', { error, params })
      throw error
    }
  }

  /**
   * Remove liquidity from pool
   */
  async removeLiquidity(params: RemoveLiquidityParams): Promise<{
    amountA: string
    amountB: string
  }> {
    try {
      const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1800 // 30 minutes

      const result = await this.baseSdk.writeContract({
        address: AERODROME_BASE_ADDRESSES.ROUTER,
        abi: this.routerAbi,
        functionName: 'removeLiquidity',
        args: [
          params.tokenA,
          params.tokenB,
          params.stable,
          params.liquidity,
          params.amountAMin,
          params.amountBMin,
          params.to,
          deadline
        ]
      })

      this.logger.info(`Liquidity removed from Aerodrome: ${result}`)
      this.emit('liquidity:removed', { hash: result, params })

      // Parse result (would need to decode actual return values)
      return {
        amountA: '0',
        amountB: '0'
      }
    } catch (error) {
      this.logger.error('Failed to remove liquidity:', error)
      this.emit('liquidity:error', { error, params })
      throw error
    }
  }

  // ============ SWAP OPERATIONS ============

  /**
   * Get swap quote
   */
  async getSwapQuote(params: {
    amountIn: string
    path: string[]
    stable?: boolean[]
  }): Promise<SwapQuote | null> {
    try {
      const amounts = await this.baseSdk.readContract({
        address: AERODROME_BASE_ADDRESSES.ROUTER,
        abi: this.routerAbi,
        functionName: 'getAmountsOut',
        args: [params.amountIn, params.path]
      })

      const amountOut = amounts[amounts.length - 1].toString()
      const amountOutMin = (BigInt(amountOut) * 95n / 100n).toString() // 5% slippage

      // Calculate price impact (simplified)
      const priceImpact = '0.1'

      // Estimate gas
      const gasEstimate = '200000'

      // Calculate fee (0.3% for volatile, 0.05% for stable)
      const fee = params.stable?.[0] ? '0.05' : '0.3'

      return {
        amountIn: params.amountIn,
        amountOut,
        amountOutMin,
        path: params.path,
        priceImpact,
        gasEstimate,
        fee
      }
    } catch (error) {
      this.logger.error('Failed to get swap quote:', error)
      return null
    }
  }

  /**
   * Execute token swap
   */
  async swapTokens(params: SwapParams): Promise<string> {
    try {
      const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1800 // 30 minutes

      const result = await this.baseSdk.writeContract({
        address: AERODROME_BASE_ADDRESSES.ROUTER,
        abi: this.routerAbi,
        functionName: 'swapExactTokensForTokens',
        args: [
          params.amountIn,
          params.amountOutMin,
          params.path,
          params.to,
          deadline
        ]
      })

      this.logger.info(`Tokens swapped on Aerodrome: ${result}`)
      this.emit('swap:executed', { hash: result, params })

      return result
    } catch (error) {
      this.logger.error('Failed to swap tokens:', error)
      this.emit('swap:error', { error, params })
      throw error
    }
  }

  /**
   * Get amounts out for a given path
   */
  async getAmountsOut(amountIn: string, path: string[]): Promise<string[]> {
    try {
      const amounts = await this.baseSdk.readContract({
        address: AERODROME_BASE_ADDRESSES.ROUTER,
        abi: this.routerAbi,
        functionName: 'getAmountsOut',
        args: [amountIn, path]
      })

      return amounts.map((amount: any) => amount.toString())
    } catch (error) {
      this.logger.error('Failed to get amounts out:', error)
      return []
    }
  }

  /**
   * Get amounts in for a given path
   */
  async getAmountsIn(amountOut: string, path: string[]): Promise<string[]> {
    try {
      const amounts = await this.baseSdk.readContract({
        address: AERODROME_BASE_ADDRESSES.ROUTER,
        abi: this.routerAbi,
        functionName: 'getAmountsIn',
        args: [amountOut, path]
      })

      return amounts.map((amount: any) => amount.toString())
    } catch (error) {
      this.logger.error('Failed to get amounts in:', error)
      return []
    }
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

  // ============ VOTING & GAUGES ============

  /**
   * Get voter contract information
   */
  async getVoterInfo(): Promise<{
    ve: string
    governor: string
    emergencyCouncil: string
  }> {
    try {
      const [ve, governor, emergencyCouncil] = await this.baseSdk.readContractBatch([
        { address: AERODROME_BASE_ADDRESSES.VOTER, abi: this.voterAbi, functionName: 've' },
        { address: AERODROME_BASE_ADDRESSES.VOTER, abi: this.voterAbi, functionName: 'governor' },
        { address: AERODROME_BASE_ADDRESSES.VOTER, abi: this.voterAbi, functionName: 'emergencyCouncil' }
      ])

      return {
        ve: ve as string,
        governor: governor as string,
        emergencyCouncil: emergencyCouncil as string
      }
    } catch (error) {
      this.logger.error('Failed to get voter info:', error)
      throw error
    }
  }

  /**
   * Vote for pools
   */
  async vote(tokenId: string, poolVotes: string[], weights: string[]): Promise<string> {
    try {
      const result = await this.baseSdk.writeContract({
        address: AERODROME_BASE_ADDRESSES.VOTER,
        abi: this.voterAbi,
        functionName: 'vote',
        args: [tokenId, poolVotes, weights]
      })

      this.logger.info(`Vote submitted: ${result}`)
      this.emit('vote:submitted', { hash: result, tokenId, poolVotes, weights })

      return result
    } catch (error) {
      this.logger.error('Failed to vote:', error)
      this.emit('vote:error', { error, tokenId, poolVotes, weights })
      throw error
    }
  }

  /**
   * Claim rewards
   */
  async claimRewards(gauges: string[]): Promise<string> {
    try {
      const result = await this.baseSdk.writeContract({
        address: AERODROME_BASE_ADDRESSES.VOTER,
        abi: this.voterAbi,
        functionName: 'claimRewards',
        args: [gauges]
      })

      this.logger.info(`Rewards claimed: ${result}`)
      this.emit('rewards:claimed', { hash: result, gauges })

      return result
    } catch (error) {
      this.logger.error('Failed to claim rewards:', error)
      this.emit('rewards:error', { error, gauges })
      throw error
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Calculate optimal swap path
   */
  async findOptimalPath(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<{
    path: string[]
    stable: boolean[]
    amountOut: string
  }> {
    try {
      // Try volatile pool first
      const volatilePath = [tokenIn, tokenOut]
      const volatileAmounts = await this.getAmountsOut(amountIn, volatilePath)

      // Try stable pool
      const stablePoolAddress = await this.getPoolAddress(tokenIn, tokenOut, true)
      const stablePath = stablePoolAddress ? [tokenIn, tokenOut] : null

      let stableAmounts: string[] = []
      if (stablePath) {
        stableAmounts = await this.getAmountsOut(amountIn, stablePath)
      }

      // Compare amounts and return best path
      const volatileAmount = parseFloat(volatileAmounts[volatileAmounts.length - 1] || '0')
      const stableAmount = parseFloat(stableAmounts[stableAmounts.length - 1] || '0')

      if (stableAmount > volatileAmount) {
        return {
          path: stablePath!,
          stable: [true],
          amountOut: stableAmounts[stableAmounts.length - 1]
        }
      } else {
        return {
          path: volatilePath,
          stable: [false],
          amountOut: volatileAmounts[volatileAmounts.length - 1]
        }
      }
    } catch (error) {
      this.logger.error('Failed to find optimal path:', error)
      // Return basic path as fallback
      return {
        path: [tokenIn, tokenOut],
        stable: [false],
        amountOut: '0'
      }
    }
  }

  /**
   * Get fee for pool type
   */
  async getFee(stable: boolean): Promise<string> {
    try {
      const fee = await this.baseSdk.readContract({
        address: AERODROME_BASE_ADDRESSES.FACTORY,
        abi: this.factoryAbi,
        functionName: 'getFee',
        args: [stable]
      })

      return fee.toString()
    } catch (error) {
      this.logger.error(`Failed to get fee for ${stable ? 'stable' : 'volatile'} pool:`, error)
      return stable ? '500' : '3000' // Default fees
    }
  }

  /**
   * Check if address is a valid pair
   */
  async isPair(pairAddress: string): Promise<boolean> {
    try {
      const result = await this.baseSdk.readContract({
        address: AERODROME_BASE_ADDRESSES.FACTORY,
        abi: this.factoryAbi,
        functionName: 'isPair',
        args: [pairAddress]
      })

      return result as boolean
    } catch (error) {
      this.logger.error(`Failed to check if ${pairAddress} is a pair:`, error)
      return false
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
    this.logger.info('Aerodrome caches cleared')
  }

  /**
   * Get contract addresses
   */
  getContractAddresses(): typeof AERODROME_BASE_ADDRESSES {
    return AERODROME_BASE_ADDRESSES
  }
}

export default AerodromeService
