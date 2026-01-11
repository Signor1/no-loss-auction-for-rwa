// Chain configuration interface
export interface ChainConfig {
  chainId: number
  name: string
  network: string
  rpcUrl: string
  wsUrl: string
  blockExplorerUrl: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  contracts: {
    auction: string
    asset: string
    payment: string
    user: string
  }
  startBlock: number
  confirmations: number
  blockTime: number
  gasLimit: {
    default: number
    max: number
  }
  retry: {
    maxAttempts: number
    delay: number
    backoff: number
  }
}

// Multi-chain configuration
export const CHAIN_CONFIGS: ChainConfig[] = [
  {
    chainId: 1,
    name: 'Ethereum Mainnet',
    network: 'mainnet',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/',
    wsUrl: process.env.ETHEREUM_WS_URL || 'wss://mainnet.infura.io/ws/v3/',
    blockExplorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    contracts: {
      auction: process.env.ETHEREUM_AUCTION_CONTRACT || '0x...',
      asset: process.env.ETHEREUM_ASSET_CONTRACT || '0x...',
      payment: process.env.ETHEREUM_PAYMENT_CONTRACT || '0x...',
      user: process.env.ETHEREUM_USER_CONTRACT || '0x...'
    },
    startBlock: 18500000, // Approximate start block
    confirmations: 12,
    blockTime: 12000, // 12 seconds
    gasLimit: {
      default: 300000,
      max: 8000000
    },
    retry: {
      maxAttempts: 5,
      delay: 1000,
      backoff: 2
    }
  },
  {
    chainId: 3,
    name: 'Ethereum Testnet',
    network: 'goerli',
    rpcUrl: process.env.ETHEREUM_TESTNET_RPC_URL || 'https://goerli.infura.io/v3/',
    wsUrl: process.env.ETHEREUM_TESTNET_WS_URL || 'wss://goerli.infura.io/ws/v3/',
    blockExplorerUrl: 'https://goerli.etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    contracts: {
      auction: process.env.ETHEREUM_TESTNET_AUCTION_CONTRACT || '0x...',
      asset: process.env.ETHEREUM_TESTNET_ASSET_CONTRACT || '0x...',
      payment: process.env.ETHEREUM_TESTNET_PAYMENT_CONTRACT || '0x...',
      user: process.env.ETHEREUM_TESTNET_USER_CONTRACT || '0x...'
    },
    startBlock: 0,
    confirmations: 3,
    blockTime: 15000, // 15 seconds
    gasLimit: {
      default: 300000,
      max: 8000000
    },
    retry: {
      maxAttempts: 3,
      delay: 500,
      backoff: 2
    }
  },
  {
    chainId: 137,
    name: 'Polygon Mainnet',
    network: 'mainnet',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    wsUrl: process.env.POLYGON_WS_URL || 'wss://polygon-rpc.com',
    blockExplorerUrl: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18
    },
    contracts: {
      auction: process.env.POLYGON_AUCTION_CONTRACT || '0x...',
      asset: process.env.POLYGON_ASSET_CONTRACT || '0x...',
      payment: process.env.POLYGON_PAYMENT_CONTRACT || '0x...',
      user: process.env.POLYGON_USER_CONTRACT || '0x...'
    },
    startBlock: 0,
    confirmations: 20,
    blockTime: 2000, // 2 seconds
    gasLimit: {
      default: 20000000,
      max: 200000000
    },
    retry: {
      maxAttempts: 5,
      delay: 2000,
      backoff: 2
    }
  },
  {
    chainId: 80001,
    name: 'Polygon Mumbai',
    network: 'mumbai',
    rpcUrl: process.env.POLYGON_MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
    wsUrl: process.env.POLYGON_MUMBAI_WS_URL || 'wss://rpc-mumbai.maticvigil.com',
    blockExplorerUrl: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18
    },
    contracts: {
      auction: process.env.POLYGON_MUMBAI_AUCTION_CONTRACT || '0x...',
      asset: process.env.POLYGON_MUMBAI_ASSET_CONTRACT || '0x...',
      payment: process.env.POLYGON_MUMBAI_PAYMENT_CONTRACT || '0x...',
      user: process.env.POLYGON_MUMBAI_USER_CONTRACT || '0x...'
    },
    startBlock: 0,
    confirmations: 5,
    blockTime: 3000, // 3 seconds
    gasLimit: {
      default: 20000000,
      max: 200000000
    },
    retry: {
      maxAttempts: 3,
      delay: 1000,
      backoff: 2
    }
  },
  {
    chainId: 56,
    name: 'BSC Mainnet',
    network: 'mainnet',
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    wsUrl: process.env.BSC_WS_URL || 'wss://bsc-ws-node.nariox.org',
    blockExplorerUrl: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    contracts: {
      auction: process.env.BSC_AUCTION_CONTRACT || '0x...',
      asset: process.env.BSC_ASSET_CONTRACT || '0x...',
      payment: process.env.BSC_PAYMENT_CONTRACT || '0x...',
      user: process.env.BSC_USER_CONTRACT || '0x...'
    },
    startBlock: 0,
    confirmations: 3,
    blockTime: 3000, // 3 seconds
    gasLimit: {
      default: 5000000,
      max: 30000000
    },
    retry: {
      maxAttempts: 5,
      delay: 1500,
      backoff: 2
    }
  },
  {
    chainId: 97,
    name: 'BSC Testnet',
    network: 'testnet',
    rpcUrl: process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-testnet.binance.org',
    wsUrl: process.env.BSC_TESTNET_WS_URL || 'wss://bsc-testnet-ws-node.nariox.org',
    blockExplorerUrl: 'https://testnet.bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    contracts: {
      auction: process.env.BSC_TESTNET_AUCTION_CONTRACT || '0x...',
      asset: process.env.BSC_TESTNET_ASSET_CONTRACT || '0x...',
      payment: process.env.BSC_TESTNET_PAYMENT_CONTRACT || '0x...',
      user: process.env.BSC_TESTNET_USER_CONTRACT || '0x...'
    },
    startBlock: 0,
    confirmations: 3,
    blockTime: 3000, // 3 seconds
    gasLimit: {
      default: 5000000,
      max: 30000000
    },
    retry: {
      maxAttempts: 3,
      delay: 1000,
      backoff: 2
    }
  },
  {
    chainId: 43114,
    name: 'Avalanche Mainnet',
    network: 'mainnet',
    rpcUrl: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
    wsUrl: process.env.AVALANCHE_WS_URL || 'wss://api.avax.network/ext/bc/C/ws',
    blockExplorerUrl: 'https://snowtrace.io',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    contracts: {
      auction: process.env.AVALANCHE_AUCTION_CONTRACT || '0x...',
      asset: process.env.AVALANCHE_ASSET_CONTRACT || '0x...',
      payment: process.env.AVALANCHE_PAYMENT_CONTRACT || '0x...',
      user: process.env.AVALANCHE_USER_CONTRACT || '0x...'
    },
    startBlock: 0,
    confirmations: 1,
    blockTime: 1000, // 1 second
    gasLimit: {
      default: 8000000,
      max: 8000000
    },
    retry: {
      maxAttempts: 5,
      delay: 1000,
      backoff: 2
    }
  },
  {
    chainId: 43113,
    name: 'Avalanche Testnet',
    network: 'testnet',
    rpcUrl: process.env.AVALANCHE_TESTNET_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
    wsUrl: process.env.AVALANCHE_TESTNET_WS_URL || 'wss://api.avax-test.network/ext/bc/C/ws',
    blockExplorerUrl: 'https://testnet.snowtrace.io',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    contracts: {
      auction: process.env.AVALANCHE_TESTNET_AUCTION_CONTRACT || '0x...',
      asset: process.env.AVALANCHE_TESTNET_ASSET_CONTRACT || '0x...',
      payment: process.env.AVALANCHE_TESTNET_PAYMENT_CONTRACT || '0x...',
      user: process.env.AVALANCHE_TESTNET_USER_CONTRACT || '0x...'
    },
    startBlock: 0,
    confirmations: 1,
    blockTime: 1000, // 1 second
    gasLimit: {
      default: 8000000,
      max: 8000000
    },
    retry: {
      maxAttempts: 3,
      delay: 500,
      backoff: 2
    }
  }
]

// Chain configuration manager class
export class ChainConfigManager {
  private configs: Map<number, ChainConfig>
  private activeChains: Set<number>

  constructor() {
    this.configs = new Map()
    this.activeChains = new Set()
    this.initializeConfigs()
  }

  // Initialize configurations
  private initializeConfigs(): void {
    for (const config of CHAIN_CONFIGS) {
      this.configs.set(config.chainId, config)
    }
  }

  // Get chain configuration
  getChainConfig(chainId: number): ChainConfig | null {
    return this.configs.get(chainId) || null
  }

  // Get all chain configurations
  getAllChainConfigs(): ChainConfig[] {
    return Array.from(this.configs.values())
  }

  // Get active chain configurations
  getActiveChainConfigs(): ChainConfig[] {
    return Array.from(this.activeChains).map(chainId => 
      this.configs.get(chainId)
    ).filter(Boolean) as ChainConfig[]
  }

  // Add chain configuration
  addChainConfig(config: ChainConfig): void {
    this.configs.set(config.chainId, config)
  }

  // Update chain configuration
  updateChainConfig(chainId: number, updates: Partial<ChainConfig>): void {
    const existingConfig = this.configs.get(chainId)
    if (existingConfig) {
      const updatedConfig = { ...existingConfig, ...updates }
      this.configs.set(chainId, updatedConfig)
    }
  }

  // Remove chain configuration
  removeChainConfig(chainId: number): void {
    this.configs.delete(chainId)
    this.activeChains.delete(chainId)
  }

  // Activate chain
  activateChain(chainId: number): void {
    const config = this.configs.get(chainId)
    if (config) {
      this.activeChains.add(chainId)
    }
  }

  // Deactivate chain
  deactivateChain(chainId: number): void {
    this.activeChains.delete(chainId)
  }

  // Get chain by name
  getChainByName(name: string): ChainConfig | null {
    for (const config of this.configs.values()) {
      if (config.name.toLowerCase() === name.toLowerCase()) {
        return config
      }
    }
    return null
  }

  // Get chain by network
  getChainsByNetwork(network: string): ChainConfig[] {
    return Array.from(this.configs.values()).filter(config =>
      config.network.toLowerCase() === network.toLowerCase()
    )
  }

  // Validate chain configuration
  validateChainConfig(config: ChainConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate required fields
    if (!config.chainId || config.chainId < 0) {
      errors.push('Invalid chainId')
    }

    if (!config.name || config.name.trim() === '') {
      errors.push('Chain name is required')
    }

    if (!config.network || config.network.trim() === '') {
      errors.push('Network is required')
    }

    if (!config.rpcUrl || config.rpcUrl.trim() === '') {
      errors.push('RPC URL is required')
    }

    if (!config.wsUrl || config.wsUrl.trim() === '') {
      errors.push('WebSocket URL is required')
    }

    // Validate URLs
    try {
      new URL(config.rpcUrl)
      new URL(config.wsUrl)
      new URL(config.blockExplorerUrl)
    } catch (error) {
      errors.push('Invalid URL format')
    }

    // Validate native currency
    if (!config.nativeCurrency) {
      errors.push('Native currency configuration is required')
    } else {
      if (!config.nativeCurrency.name || config.nativeCurrency.name.trim() === '') {
        errors.push('Native currency name is required')
      }
      if (!config.nativeCurrency.symbol || config.nativeCurrency.symbol.trim() === '') {
        errors.push('Native currency symbol is required')
      }
      if (!config.nativeCurrency.decimals || config.nativeCurrency.decimals <= 0) {
        errors.push('Native currency decimals must be positive')
      }
    }

    // Validate contracts
    if (!config.contracts) {
      errors.push('Contracts configuration is required')
    } else {
      const requiredContracts = ['auction', 'asset', 'payment', 'user']
      for (const contract of requiredContracts) {
        if (!config.contracts[contract] || config.contracts[contract].trim() === '') {
          errors.push(`${contract} contract address is required`)
        }
      }
    }

    // Validate numeric values
    if (config.startBlock !== undefined && config.startBlock < 0) {
      errors.push('Start block must be non-negative')
    }

    if (config.confirmations !== undefined && config.confirmations <= 0) {
      errors.push('Confirmations must be positive')
    }

    if (config.blockTime !== undefined && config.blockTime <= 0) {
      errors.push('Block time must be positive')
    }

    // Validate gas limits
    if (config.gasLimit) {
      if (!config.gasLimit.default || config.gasLimit.default <= 0) {
        errors.push('Default gas limit must be positive')
      }
      if (!config.gasLimit.max || config.gasLimit.max <= 0) {
        errors.push('Max gas limit must be positive')
      }
      if (config.gasLimit.default > config.gasLimit.max) {
        errors.push('Default gas limit cannot exceed max gas limit')
      }
    }

    // Validate retry configuration
    if (config.retry) {
      if (!config.retry.maxAttempts || config.retry.maxAttempts <= 0) {
        errors.push('Max retry attempts must be positive')
      }
      if (!config.retry.delay || config.retry.delay < 0) {
        errors.push('Retry delay must be non-negative')
      }
      if (!config.retry.backoff || config.retry.backoff <= 0) {
        errors.push('Retry backoff must be positive')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Get supported chains
  getSupportedChains(): Array<{
    chainId: number
    name: string
    network: string
    nativeCurrency: {
      name: string
      symbol: string
      decimals: number
    }
  }> {
    return Array.from(this.configs.values()).map(config => ({
      chainId: config.chainId,
      name: config.name,
      network: config.network,
      nativeCurrency: config.nativeCurrency
    }))
  }

  // Get testnet chains
  getTestnetChains(): ChainConfig[] {
    return Array.from(this.configs.values()).filter(config =>
      config.network === 'testnet'
    )
  }

  // Get mainnet chains
  getMainnetChains(): ChainConfig[] {
    return Array.from(this.configs.values()).filter(config =>
      config.network === 'mainnet'
    )
  }

  // Get chain by RPC URL
  getChainByRpcUrl(rpcUrl: string): ChainConfig | null {
    for (const config of this.configs.values()) {
      if (config.rpcUrl === rpcUrl) {
        return config
      }
    }
    return null
  }

  // Export configuration
  exportConfig(chainId: number): string {
    const config = this.configs.get(chainId)
    if (!config) {
      throw new Error(`Chain configuration not found for chainId: ${chainId}`)
    }

    return JSON.stringify(config, null, 2)
  }

  // Import configuration
  importConfig(configJson: string): ChainConfig {
    try {
      const config = JSON.parse(configJson)
      
      // Validate configuration
      const validation = this.validateChainConfig(config)
      if (!validation.valid) {
        throw new Error(`Invalid chain configuration: ${validation.errors.join(', ')}`)
      }

      // Add configuration
      this.addChainConfig(config)
      
      return config
    } catch (error) {
      throw new Error(`Failed to import chain configuration: ${error.message}`)
    }
  }

  // Get chain statistics
  getChainStatistics(): {
    totalChains: number
    activeChains: number
    mainnetChains: number
    testnetChains: number
    chainsByNetwork: Record<string, number>
    chainsByNativeCurrency: Record<string, number>
  } {
    const chains = Array.from(this.configs.values())
    
    return {
      totalChains: chains.length,
      activeChains: this.activeChains.size,
      mainnetChains: chains.filter(c => c.network === 'mainnet').length,
      testnetChains: chains.filter(c => c.network === 'testnet').length,
      chainsByNetwork: chains.reduce((acc, chain) => {
        acc[chain.network] = (acc[chain.network] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      chainsByNativeCurrency: chains.reduce((acc, chain) => {
        acc[chain.nativeCurrency.symbol] = (acc[chain.nativeCurrency.symbol] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }
}

export default {
  CHAIN_CONFIGS,
  ChainConfigManager
}
