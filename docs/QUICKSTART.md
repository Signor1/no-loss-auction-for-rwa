# Quick Start Guide

Get up and running with the No Loss Auction dApp in minutes!

## 🚀 Quick Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Build all packages
pnpm build

# 3. Start development servers
pnpm dev
```

That's it! Your apps are now running:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

## 📋 Common Commands

### Development
```bash
pnpm dev              # Run all apps
pnpm dev:frontend     # Frontend only
pnpm dev:backend      # Backend only
```

### Building
```bash
pnpm build            # Build all
pnpm build:frontend   # Frontend only
pnpm build:backend    # Backend only
pnpm build:contracts  # Contracts only
```

### Testing
```bash
pnpm test             # All tests
pnpm test:contracts   # Smart contract tests
```

### Code Quality
```bash
pnpm lint             # Lint all code
pnpm format           # Format all code (including Solidity)
```

## 🏗️ Project Structure

```
no-loss-auction/
├── apps/
│   ├── frontend/     # Next.js app
│   └── backend/      # Express API
├── packages/
│   ├── types/        # TypeScript types
│   ├── utils/        # Utility functions
│   └── shared/       # Re-exports
└── contracts/        # Solidity contracts
```

## 🔧 Smart Contracts

The project uses Foundry at `/home/labidev/.foundry/bin/forge`:

```bash
cd contracts

# Compile
pnpm build

# Test
pnpm test

# Format
pnpm format
```

## 📝 Next Steps

1. **Set up environment variables** - Create `.env.local` files
2. **Configure RPC endpoints** - Add your blockchain RPC URLs
3. **Deploy contracts** - Deploy to testnet/mainnet
4. **Start building** - Add your features!

## 🆘 Need Help?

- See [SETUP.md](./SETUP.md) for detailed setup instructions
- See [README.md](./README.md) for full documentation
- Check individual package READMEs for package-specific info
