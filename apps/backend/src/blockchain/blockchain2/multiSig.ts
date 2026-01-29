import { EventEmitter } from 'events'
import { ethers } from 'ethers'
import { Logger } from '../utils/logger'
import { CHAIN_CONFIGS } from './chainConfig'
import { TransactionBuilder, BuiltTransaction } from './transactionBuilder'
import { MultiSigWallet, MultiSigWalletDocument } from '../models/MultiSigWallet'
import { MultiSigTransaction, MultiSigTransactionDocument, Signature } from '../models/MultiSigTransaction'

// Multi-signature status enum (matching the model)
export enum MultiSigStatus {
  PENDING = 'pending',
  PARTIALLY_SIGNED = 'partially_signed',
  READY = 'ready',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

// Multi-signature service
export class MultiSig extends EventEmitter {
  private logger: Logger
  private isMultiSig: boolean = false
  private defaultTimeout: number = 86400 // 24 hours
  private maxSigners: number = 10

  constructor(logger: Logger) {
    super()
    this.logger = logger
  }

  // Start multi-signature service
  async start(): Promise<void> {
    if (this.isMultiSig) {
      this.logger.warn('Multi-signature service already started')
      return
    }

    this.isMultiSig = true
    this.logger.info('Starting multi-signature service with DB persistence...')

    // Start cleanup intervals
    this.startCleanupIntervals()

    this.logger.info('Multi-signature service started')
    this.emit('multisig:started')
  }

  // Stop multi-signature service
  async stop(): Promise<void> {
    if (!this.isMultiSig) {
      return
    }

    this.isMultiSig = false
    this.logger.info('Stopping multi-signature service...')
    this.logger.info('Multi-signature service stopped')
    this.emit('multisig:stopped')
  }

  // Create multi-signature wallet
  async createWallet(config: {
    id: string
    name: string
    description: string
    owners: string[]
    requiredSignatures: number
    chainId: number
    dailyLimit?: string
    monthlyLimit?: string
    allowedContracts?: string[]
  }): Promise<MultiSigWalletDocument> {
    try {
      this.logger.debug(`Creating multi-sig wallet: ${config.id}`)

      // Validate configuration
      this.validateWalletConfig(config)

      // Get next nonce
      const nonce = await this.getNextNonce(config.owners[0], config.chainId)

      const wallet = await MultiSigWallet.create({
        id: config.id,
        address: await this.generateWalletAddress(config.owners, config.requiredSignatures, config.chainId),
        owners: config.owners,
        requiredSignatures: config.requiredSignatures,
        chainId: config.chainId,
        nonce,
        dailyLimit: config.dailyLimit,
        monthlyLimit: config.monthlyLimit,
        enabled: true
      })

      this.logger.info(`Multi-sig wallet created: ${config.id}`)
      this.emit('wallet:created', { wallet })

      return wallet

    } catch (error) {
      this.logger.error(`Failed to create multi-sig wallet: ${config.id}`, error)
      this.emit('wallet:error', { error, config })
      throw error
    }
  }

  // Create multi-signature transaction
  async createTransaction(options: {
    walletId: string
    to: string
    value?: string
    data?: string
    gasLimit?: string
    gasPrice?: string
    timeout?: number
    metadata?: any
  }): Promise<MultiSigTransactionDocument> {
    try {
      this.logger.debug(`Creating multi-sig transaction: ${options.walletId}`)

      const wallet = await MultiSigWallet.findOne({ id: options.walletId })
      if (!wallet) {
        throw new Error(`Wallet not found: ${options.walletId}`)
      }

      // Validate transaction
      await this.validateTransaction(wallet, options)

      const transactionId = this.generateTransactionId()
      const expiresAt = new Date(Date.now() + (options.timeout || this.defaultTimeout) * 1000)

      const transaction = await MultiSigTransaction.create({
        id: transactionId,
        walletId: wallet.id,
        from: wallet.address,
        to: options.to,
        value: options.value || '0',
        data: options.data || '0x',
        gasLimit: options.gasLimit || '21000',
        gasPrice: options.gasPrice,
        nonce: wallet.nonce,
        chainId: wallet.chainId,
        requiredSignatures: wallet.requiredSignatures,
        signers: wallet.owners,
        signatures: [],
        status: MultiSigStatus.PENDING,
        expiresAt,
        metadata: options.metadata || {}
      })

      this.logger.info(`Multi-sig transaction created: ${transactionId}`)
      this.emit('transaction:created', { transaction })

      return transaction

    } catch (error) {
      this.logger.error(`Failed to create multi-sig transaction:`, error)
      this.emit('transaction:error', { error, options })
      throw error
    }
  }

  // Sign transaction
  async signTransaction(transactionId: string, signerAddress: string, privateKey: string): Promise<MultiSigTransactionDocument> {
    try {
      this.logger.debug(`Signing multi-sig transaction: ${transactionId} by ${signerAddress}`)

      const transaction = await MultiSigTransaction.findOne({ id: transactionId })
      if (!transaction) {
        throw new Error(`Transaction not found: ${transactionId}`)
      }

      // Validate signer
      if (!transaction.signers.includes(signerAddress)) {
        throw new Error(`Signer not authorized: ${signerAddress}`)
      }

      // Check if already signed
      const existingSignature = transaction.signatures.find(sig => sig.signer === signerAddress)
      if (existingSignature) {
        throw new Error(`Transaction already signed by: ${signerAddress}`)
      }

      // Check if expired
      if (transaction.expiresAt && new Date() > transaction.expiresAt) {
        transaction.status = MultiSigStatus.EXPIRED as any
        await transaction.save()
        throw new Error('Transaction has expired')
      }

      // Create signature
      const signature = await this.createSignature(transaction, signerAddress, privateKey)

      // Add signature
      transaction.signatures.push(signature)

      // Update status
      if (transaction.signatures.length >= transaction.requiredSignatures) {
        transaction.status = MultiSigStatus.READY as any
      } else {
        transaction.status = MultiSigStatus.PARTIALLY_SIGNED as any
      }

      await transaction.save()

      this.logger.info(`Multi-sig transaction signed: ${transactionId} by ${signerAddress}`)
      this.emit('transaction:signed', { transaction, signer: signerAddress, signature })

      return transaction

    } catch (error) {
      this.logger.error(`Failed to sign multi-sig transaction: ${transactionId}`, error)
      this.emit('sign:error', { error, transactionId, signerAddress })
      throw error
    }
  }

  // Execute transaction
  async executeTransaction(transactionId: string, executorPrivateKey: string): Promise<BuiltTransaction> {
    try {
      this.logger.debug(`Executing multi-sig transaction: ${transactionId}`)

      const transaction = await MultiSigTransaction.findOne({ id: transactionId })
      if (!transaction) {
        throw new Error(`Transaction not found: ${transactionId}`)
      }

      // Validate execution
      if (transaction.status !== MultiSigStatus.READY) {
        throw new Error(`Transaction not ready for execution: ${transaction.status}`)
      }

      // Check if expired
      if (transaction.expiresAt && new Date() > transaction.expiresAt) {
        transaction.status = MultiSigStatus.EXPIRED as any
        await transaction.save()
        throw new Error('Transaction has expired')
      }

      // Create transaction builder
      const transactionBuilder = new TransactionBuilder(this.logger)
      await transactionBuilder.start()

      // Build transaction with all signatures
      const builtTransaction = await this.buildMultiSigTransaction(transaction, executorPrivateKey, transactionBuilder)

      // Update status
      transaction.status = MultiSigStatus.EXECUTED as any
      transaction.executedAt = new Date()
      transaction.transactionHash = builtTransaction.signature || ''

      await transaction.save()

      this.logger.info(`Multi-sig transaction executed: ${transactionId}`)
      this.emit('transaction:executed', { transaction, builtTransaction })

      return builtTransaction

    } catch (error) {
      this.logger.error(`Failed to execute multi-sig transaction: ${transactionId}`, error)
      this.emit('execution:error', { error, transactionId })
      throw error
    }
  }

  // Create signature
  private async createSignature(
    transaction: MultiSigTransactionDocument,
    signerAddress: string,
    privateKey: string
  ): Promise<Signature> {
    const wallet = new ethers.Wallet(privateKey)

    // Create message hash
    const messageHash = ethers.utils.solidityKeccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['address', 'uint256', 'bytes', 'uint256'],
        [transaction.to, transaction.value, transaction.data, transaction.nonce]
      )
    )

    // Sign message
    const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash))

    // Split signature
    const { v, r, s } = ethers.utils.splitSignature(signature)

    return {
      signer: signerAddress,
      signature,
      timestamp: new Date(),
      v,
      r,
      s
    }
  }

  // Build multi-sig transaction
  private async buildMultiSigTransaction(
    transaction: MultiSigTransactionDocument,
    executorPrivateKey: string,
    transactionBuilder: TransactionBuilder
  ): Promise<BuiltTransaction> {
    const executorWallet = new ethers.Wallet(executorPrivateKey)

    // Encode multi-sig data
    const multiSigData = ethers.utils.defaultAbiCoder.encode(
      ['address', 'uint256', 'bytes', 'uint256', 'uint8', 'bytes32[]'],
      [
        transaction.to,
        transaction.value,
        transaction.data,
        transaction.nonce,
        transaction.signatures.length,
        transaction.signatures.map(sig => sig.signature)
      ]
    )

    // Create transaction
    const builtTransaction: BuiltTransaction = {
      id: this.generateTransactionId(),
      type: 'transfer' as any,
      from: transaction.from,
      to: transaction.to,
      value: transaction.value,
      data: multiSigData,
      gasLimit: transaction.gasLimit,
      gasPrice: transaction.gasPrice,
      nonce: transaction.nonce,
      chainId: transaction.chainId,
      type: 0,
      priority: 2 as any,
      metadata: {
        multiSig: true,
        originalTransactionId: transaction.id,
        signers: transaction.signatures
      },
      createdAt: new Date()
    }

    // Sign with executor
    return await transactionBuilder.signTransaction(builtTransaction, executorPrivateKey)
  }

  // Generate wallet address
  private async generateWalletAddress(owners: string[], requiredSignatures: number, chainId: number): Promise<string> {
    // This would generate a deterministic address based on owners and required signatures
    // For now, return a mock address
    return ethers.utils.getAddress(ethers.utils.createAddress().substring(2))
  }

  // Get next nonce
  private async getNextNonce(address: string, chainId: number): Promise<number> {
    try {
      const provider = await this.getProvider(chainId)
      return await provider.getTransactionCount(address, 'pending')
    } catch (error) {
      this.logger.error(`Failed to get nonce for ${address}:`, error)
      return 0
    }
  }

  // Validate wallet configuration
  private validateWalletConfig(config: any): void {
    if (!config.owners || config.owners.length === 0) {
      throw new Error('At least one owner is required')
    }

    if (config.owners.length > this.maxSigners) {
      throw new Error(`Maximum ${this.maxSigners} owners allowed`)
    }

    if (config.requiredSignatures < 1 || config.requiredSignatures > config.owners.length) {
      throw new Error('Invalid required signatures count')
    }

    if (!config.chainId) {
      throw new Error('Chain ID is required')
    }
  }

  // Validate transaction
  private async validateTransaction(wallet: MultiSigWalletDocument, options: any): Promise<void> {
    // Check daily limit
    if (wallet.dailyLimit) {
      const dailySpent = await this.getDailySpent(wallet.id)
      if (parseFloat(dailySpent) + parseFloat(options.value || '0') > parseFloat(wallet.dailyLimit)) {
        throw new Error('Daily limit exceeded')
      }
    }

    // Check monthly limit
    if (wallet.monthlyLimit) {
      const monthlySpent = await this.getMonthlySpent(wallet.id)
      if (parseFloat(monthlySpent) + parseFloat(options.value || '0') > parseFloat(wallet.monthlyLimit)) {
        throw new Error('Monthly limit exceeded')
      }
    }
  }

  // Get daily spent
  private async getDailySpent(walletId: string): Promise<string> {
    // This would calculate actual daily spent from transactions
    return '0'
  }

  // Get monthly spent
  private async getMonthlySpent(walletId: string): Promise<string> {
    // This would calculate actual monthly spent from transactions
    return '0'
  }

  // Get provider for chain
  private async getProvider(chainId: number): Promise<ethers.providers.Provider> {
    const chainConfig = CHAIN_CONFIGS.find(config => config.chainId === chainId)

    if (!chainConfig) {
      throw new Error(`Chain configuration not found: ${chainId}`)
    }

    return new ethers.providers.JsonRpcProvider(chainConfig.rpcUrl)
  }

  // Start cleanup intervals
  private startCleanupIntervals(): void {
    // Clean expired transactions every hour
    setInterval(() => {
      this.cleanupExpiredTransactions()
    }, 3600000) // Every hour

    // Update wallet nonces every 5 minutes
    setInterval(() => {
      this.updateWalletNonces()
    }, 300000) // Every 5 minutes
  }

  // Cleanup expired transactions
  private async cleanupExpiredTransactions(): Promise<void> {
    const now = new Date()
    const result = await MultiSigTransaction.updateMany(
      { expiresAt: { $lt: now }, status: MultiSigStatus.PENDING },
      { status: MultiSigStatus.EXPIRED }
    )

    if (result.modifiedCount > 0) {
      this.logger.info(`Cleaned up ${result.modifiedCount} expired transactions`)
    }
  }

  // Update wallet nonces
  private async updateWalletNonces(): Promise<void> {
    const wallets = await MultiSigWallet.find({ enabled: true })
    for (const wallet of wallets) {
      try {
        const nonce = await this.getNextNonce(wallet.address, wallet.chainId)
        if (nonce > wallet.nonce) {
          wallet.nonce = nonce
          wallet.updatedAt = new Date()
          await wallet.save()
        }
      } catch (error) {
        this.logger.error(`Failed to update nonce for wallet ${wallet.id}:`, error)
      }
    }
  }

  // Generate transaction ID
  private generateTransactionId(): string {
    return `multisig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get wallet by ID
  async getWallet(walletId: string): Promise<MultiSigWalletDocument | null> {
    return MultiSigWallet.findOne({ id: walletId })
  }

  // Get all wallets
  async getAllWallets(): Promise<MultiSigWalletDocument[]> {
    return MultiSigWallet.find()
  }

  // Get transaction by ID
  async getTransaction(transactionId: string): Promise<MultiSigTransactionDocument | null> {
    return MultiSigTransaction.findOne({ id: transactionId })
  }

  // Get transactions by wallet
  async getTransactionsByWallet(walletId: string): Promise<MultiSigTransactionDocument[]> {
    const wallet = await this.getWallet(walletId)
    if (!wallet) return []
    return MultiSigTransaction.find({ from: wallet.address }).sort({ createdAt: -1 })
  }

  // Get pending transactions
  async getPendingTransactions(): Promise<MultiSigTransactionDocument[]> {
    return MultiSigTransaction.find({
      status: { $in: [MultiSigStatus.PENDING, MultiSigStatus.PARTIALLY_SIGNED] }
    }).sort({ createdAt: 1 })
  }

  // Get ready transactions
  async getReadyTransactions(): Promise<MultiSigTransactionDocument[]> {
    return MultiSigTransaction.find({ status: MultiSigStatus.READY }).sort({ createdAt: 1 })
  }
}

export default MultiSig
