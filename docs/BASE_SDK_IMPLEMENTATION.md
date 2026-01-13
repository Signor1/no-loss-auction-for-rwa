# Base SDK Implementation Guide

## Overview

This document provides a comprehensive guide for the Base Developer Tools integration implemented across the No Loss Auction platform.

---

## Implementation Summary

### 3.1 Base SDK Integration ✅

#### Frontend Implementation

**Location:** `apps/frontend/src/lib/base-sdk.ts`

**Features Implemented:**
- Complete Base SDK wrapper using Viem
- React hooks for easy integration (`useBaseSDK`, `useContractWrite`)
- Contract read/write operations
- Transaction management with automatic receipt polling
- Gas estimation and optimization
- Event watching and log retrieval
- Token balance and metadata fetching
- Built-in error handling and retry logic

**Key Components:**
```typescript
// Base SDK Class
class BaseSDK {
  - readContract()
  - readContractBatch()
  - getTransactionReceipt()
  - getBlockNumber()
  - getGasPrice()
  - estimateGas()
  - watchContractEvent()
  - getContractLogs()
  - getBalance()
  - getTokenBalance()
  - getTokenMetadata()
}

// React Hooks
- useBaseSDK() // Main hook for SDK access
- useContractWrite() // Hook for contract writes with state
```

**Usage Example:**
```typescript
import { useBaseSDK, useContractWrite } from '@/lib/base-sdk';

function MyComponent() {
  const { readContract, isReady } = useBaseSDK();
  const { write, isLoading, hash } = useContractWrite();

  const placeBid = async () => {
    await write({
      address: auctionAddress,
      abi: auctionAbi,
      functionName: 'placeBid',
      args: [auctionId],
      value: bidAmount,
    });
  };
}
```

#### Backend Implementation

**Location:** `apps/backend/src/blockchain/baseSdkService.ts`

**Features Implemented:**
- Comprehensive backend SDK service
- Public and wallet client management
- Contract interaction (read/write)
- Transaction building and sending
- Event listening and monitoring
- Gas price optimization
- Block and transaction queries
- Singleton pattern for global access

**Key Components:**
```typescript
class BaseSdkService {
  // Read Operations
  - readContract()
  - readContractBatch()
  - getBalance()
  - getTokenBalance()
  - getTokenMetadata()

  // Write Operations
  - writeContract()
  - sendTransaction()
  - waitForTransaction()

  // Gas Operations
  - getGasPrice()
  - estimateGas()
  - getFeeData()

  // Block Operations
  - getBlockNumber()
  - getBlock()
  - getTransaction()
  - getTransactionReceipt()

  // Event Operations
  - getContractLogs()
  - watchContractEvent()
  - watchBlocks()
}
```

**Usage Example:**
```typescript
import { initializeBaseSdk } from './blockchain/baseSdkService';

// Initialize SDK
const baseSdk = initializeBaseSdk(8453); // Base Mainnet

// Read contract
const balance = await baseSdk.getBalance(userAddress);

// Write contract (if private key configured)
const hash = await baseSdk.writeContract({
  address: contractAddress,
  abi: contractAbi,
  functionName: 'transfer',
  args: [recipient, amount],
});
```

---

### 3.2 Base API Integration ✅

#### Base Explorer (Basescan) API

**Location:** `apps/frontend/src/lib/base-explorer-api.ts`

**Features Implemented:**
- Complete Basescan API client
- Transaction history tracking
- Token transfer queries
- NFT transfer tracking
- Contract verification
- Gas oracle integration
- Address analytics
- Multi-address balance queries
- Built-in caching mechanism

**Key Features:**
```typescript
class BasescanAPI {
  // Transaction APIs
  - getTransactionsByAddress()
  - getInternalTransactions()
  - getTokenTransfers()
  - getNFTTransfers()
  - getTransactionStatus()
  - getTransactionReceiptStatus()

  // Account APIs
  - getBalance()
  - getMultipleBalances()
  - getTokenBalance()

  // Contract APIs
  - getContractSourceCode()
  - getContractABI()
  - verifyContract()

  // Gas APIs
  - getGasOracle()
  - getEstimatedConfirmationTime()

  // Block APIs
  - getBlockNumber()
  - getBlockByNumber()
  - getTransactionByHash()
  - getTransactionReceipt()

  // Token APIs
  - getTokenSupply()
}
```

**Usage Example:**
```typescript
import { useBasescanAPI } from '@/lib/base-explorer-api';

function TransactionHistory() {
  const { getTransactions, getTokenTransfers } = useBasescanAPI();

  const transactions = await getTransactions(userAddress, {
    page: 1,
    offset: 10,
    sort: 'desc'
  });

  const tokenTxs = await getTokenTransfers(userAddress);
}
```

**API Endpoints Covered:**
- Account API (transactions, balances, tokens)
- Contract API (source code, ABI, verification)
- Transaction API (status, receipts)
- Gas Tracker API (gas oracle, estimates)
- Proxy API (eth_* methods)
- Stats API (token supply)

---

### 3.3 Base Analytics Integration ✅

#### Frontend Analytics Service

**Location:** `apps/frontend/src/lib/base-analytics.ts`

**Features Implemented:**
- Comprehensive event tracking system
- Transaction analytics with success/failure tracking
- Gas usage analytics and optimization
- User behavior analytics
- Real-time analytics summaries
- Local storage persistence
- Export functionality

**Analytics Event Types:**
```typescript
enum AnalyticsEventType {
  // Transaction Events
  TRANSACTION_INITIATED
  TRANSACTION_CONFIRMED
  TRANSACTION_FAILED

  // Contract Events
  CONTRACT_READ
  CONTRACT_WRITE
  CONTRACT_DEPLOY

  // User Events
  WALLET_CONNECTED
  WALLET_DISCONNECTED
  NETWORK_SWITCHED

  // Auction Events
  AUCTION_VIEWED
  BID_PLACED
  AUCTION_WON
  AUCTION_LOST

  // Asset Events
  ASSET_VIEWED
  ASSET_LISTED
  ASSET_PURCHASED

  // Gas Events
  GAS_ESTIMATED
  GAS_OPTIMIZED

  // Error Events
  ERROR_OCCURRED
  RPC_ERROR
}
```

**Key Features:**
```typescript
class BaseAnalytics {
  // Event Tracking
  - trackEvent()
  - trackTransaction()
  - trackGas()

  // Data Retrieval
  - getUserAnalytics()
  - getTransactionAnalytics()
  - getGasAnalytics()
  - getEvents()
  - getAnalyticsSummary()

  // Management
  - clear()
  - export()
}
```

**Usage Example:**
```typescript
import { useBaseAnalytics, AnalyticsEventType } from '@/lib/base-analytics';

function MyComponent() {
  const { trackEvent, trackTransaction, summary } = useBaseAnalytics(userAddress);

  // Track custom event
  trackEvent({
    type: AnalyticsEventType.BID_PLACED,
    address: userAddress,
    chainId: 8453,
    data: { auctionId, bidAmount },
  });

  // Track transaction
  trackTransaction({
    hash: txHash,
    from: userAddress,
    to: contractAddress,
    value: '1000000000000000000',
    gasUsed: '21000',
    gasPrice: '1000000000',
    gasCost: '21000000000000',
    status: 'success',
    timestamp: Date.now(),
  });

  // Access analytics summary
  console.log(summary.totalTransactions);
  console.log(summary.successRate);
  console.log(summary.totalGasSpent);
}
```

**Analytics Metrics Tracked:**
- Total events by type
- Transaction success/failure rates
- Gas usage and costs
- User activity patterns
- Most used chains
- Average gas prices
- Transaction confirmations

---

## Configuration

### Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
# Base Network
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Basescan API
BASESCAN_API_KEY=your_api_key
NEXT_PUBLIC_BASESCAN_API_KEY=your_api_key

# Contract Addresses
BASE_AUCTION_CONTRACT=0x...
BASE_ASSET_CONTRACT=0x...

# Analytics
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### Getting API Keys

1. **Basescan API Key:**
   - Visit https://basescan.org/apis
   - Sign up for a free account
   - Generate an API key
   - Add to environment variables

---

## Package Dependencies

### Frontend

The existing `package.json` already includes the necessary dependencies:
```json
{
  "dependencies": {
    "viem": "^2.7.6",
    "wagmi": "^2.5.7",
    "@tanstack/react-query": "^5.17.9"
  }
}
```

### Backend

The backend also has the required dependencies:
```json
{
  "dependencies": {
    "viem": "^2.7.6"
  }
}
```

**Note:** Viem is already installed and includes all Base chain configurations by default.

---

## Integration Examples

### Example 1: Place Bid with Full Analytics

```typescript
import { useBaseSDK, useContractWrite } from '@/lib/base-sdk';
import { useBaseAnalytics, AnalyticsEventType } from '@/lib/base-analytics';

function PlaceBid({ auctionId, bidAmount }) {
  const { estimateGas } = useBaseSDK();
  const { write, isLoading, hash, receipt } = useContractWrite();
  const { trackEvent, trackTransaction, trackGas } = useBaseAnalytics();

  const handleBid = async () => {
    // Estimate gas
    const gasEstimate = await estimateGas({
      address: auctionAddress,
      abi: auctionAbi,
      functionName: 'placeBid',
      args: [auctionId],
      value: bidAmount,
    });

    // Track gas estimation
    trackGas({
      timestamp: Date.now(),
      chainId: 8453,
      gasPrice: gasEstimate.toString(),
      estimatedCost: formatEther(gasEstimate * gasPrice),
    });

    // Execute transaction
    const { hash, receipt } = await write({
      address: auctionAddress,
      abi: auctionAbi,
      functionName: 'placeBid',
      args: [auctionId],
      value: bidAmount,
    });

    // Track bid event
    trackEvent({
      type: AnalyticsEventType.BID_PLACED,
      address: userAddress,
      chainId: 8453,
      data: { auctionId, bidAmount: bidAmount.toString() },
    });

    // Track transaction
    trackTransaction({
      hash,
      from: userAddress,
      to: auctionAddress,
      value: bidAmount.toString(),
      gasUsed: receipt.gasUsed.toString(),
      gasPrice: receipt.effectiveGasPrice.toString(),
      gasCost: (receipt.gasUsed * receipt.effectiveGasPrice).toString(),
      status: receipt.status === 'success' ? 'success' : 'failed',
      timestamp: Date.now(),
      blockNumber: Number(receipt.blockNumber),
    });
  };

  return (
    <button onClick={handleBid} disabled={isLoading}>
      {isLoading ? 'Placing Bid...' : 'Place Bid'}
    </button>
  );
}
```

### Example 2: Query Transaction History

```typescript
import { useBasescanAPI } from '@/lib/base-explorer-api';

function TransactionHistory({ address }) {
  const { getTransactions, getTokenTransfers } = useBasescanAPI();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    async function fetchHistory() {
      // Get regular transactions
      const txs = await getTransactions(address, {
        page: 1,
        offset: 20,
        sort: 'desc',
      });

      // Get token transfers
      const tokenTxs = await getTokenTransfers(address);

      setTransactions([...txs, ...tokenTxs]);
    }

    fetchHistory();
  }, [address]);

  return (
    <div>
      {transactions.map(tx => (
        <div key={tx.hash}>
          <p>Hash: {tx.hash}</p>
          <p>Value: {formatEther(BigInt(tx.value))} ETH</p>
          <p>Status: {tx.txreceipt_status === '1' ? 'Success' : 'Failed'}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Backend Event Monitoring

```typescript
import { initializeBaseSdk } from './blockchain/baseSdkService';

// Initialize SDK
const baseSdk = initializeBaseSdk(8453);

// Watch auction events
const unwatch = baseSdk.watchContractEvent({
  address: auctionContractAddress,
  abi: auctionAbi,
  eventName: 'BidPlaced',
  onLogs: (logs) => {
    logs.forEach(log => {
      const { auctionId, bidder, amount } = log.args;
      
      // Process bid event
      console.log(`New bid: ${amount} from ${bidder} on auction ${auctionId}`);
      
      // Store in database
      // Send notifications
      // Update analytics
    });
  },
  onError: (error) => {
    console.error('Event watch error:', error);
  },
});

// Stop watching when needed
// unwatch();
```

---

## Testing

### Frontend Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { useBaseSDK } from '@/lib/base-sdk';

describe('Base SDK Integration', () => {
  it('should read contract data', async () => {
    const { result } = renderHook(() => useBaseSDK());
    
    const balance = await result.current.readContract({
      address: tokenAddress,
      abi: tokenAbi,
      functionName: 'balanceOf',
      args: [userAddress],
    });

    expect(balance).toBeDefined();
  });
});
```

### Backend Testing

```typescript
import { initializeBaseSdk } from './blockchain/baseSdkService';

describe('Base SDK Service', () => {
  let sdk: BaseSdkService;

  beforeAll(() => {
    sdk = initializeBaseSdk(84532); // Use Sepolia testnet
  });

  it('should get block number', async () => {
    const blockNumber = await sdk.getBlockNumber();
    expect(blockNumber).toBeGreaterThan(0n);
  });

  it('should get balance', async () => {
    const balance = await sdk.getBalance(testAddress);
    expect(balance).toBeGreaterThanOrEqual(0n);
  });
});
```

---

## Best Practices

### 1. Error Handling

```typescript
try {
  const result = await sdk.readContract(params);
} catch (error) {
  if (error.message.includes('execution reverted')) {
    // Handle revert
  } else if (error.message.includes('insufficient funds')) {
    // Handle insufficient funds
  } else {
    // Generic error handling
  }
}
```

### 2. Gas Optimization

```typescript
// Estimate gas before sending
const gasEstimate = await estimateGas(params);

// Add 20% buffer
const gasLimit = (gasEstimate * 120n) / 100n;

// Use optimized gas price
const { maxFeePerGas, maxPriorityFeePerGas } = await sdk.getFeeData();
```

### 3. Transaction Management

```typescript
// Always wait for receipt
const hash = await write(params);
const receipt = await waitForTransaction(hash);

// Check status
if (receipt.status === 'success') {
  // Success handling
} else {
  // Failure handling
}
```

### 4. Analytics Privacy

```typescript
// Anonymize sensitive data
trackEvent({
  type: AnalyticsEventType.BID_PLACED,
  address: hashAddress(userAddress), // Hash for privacy
  data: {
    auctionId,
    // Don't track bid amounts if sensitive
  },
});
```

---

## Performance Optimization

### Caching Strategy

```typescript
// Basescan API includes automatic caching
const api = new BasescanAPI(config);
api.setCacheTTL(60000); // 1 minute cache

// Clear cache when needed
api.clearCache();
```

### Batch Operations

```typescript
// Batch read multiple contracts
const results = await sdk.readContractBatch([
  { address: token1, abi, functionName: 'balanceOf', args: [user] },
  { address: token2, abi, functionName: 'balanceOf', args: [user] },
  { address: token3, abi, functionName: 'balanceOf', args: [user] },
]);
```

---

## Troubleshooting

### Common Issues

1. **RPC Rate Limiting:**
   - Use multiple RPC endpoints
   - Implement retry logic
   - Cache frequently accessed data

2. **Transaction Failures:**
   - Check gas limits
   - Verify contract addresses
   - Ensure sufficient balance

3. **Event Watching:**
   - Handle reconnection on disconnect
   - Implement error recovery
   - Use websocket connections

---

## Next Steps

1. Deploy contracts to Base network
2. Verify contracts on Basescan
3. Set up production monitoring
4. Implement comprehensive error tracking
5. Add advanced analytics dashboards

---

## Resources

- [Base Documentation](https://docs.base.org)
- [Basescan API Docs](https://docs.basescan.org)
- [Viem Documentation](https://viem.sh)
- [Wagmi Documentation](https://wagmi.sh)

---

## Support

For issues or questions:
- Check the troubleshooting section
- Review Base documentation
- Contact the development team
