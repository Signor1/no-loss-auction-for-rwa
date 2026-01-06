# Setup Instructions

Complete guide to set up the No Loss Auction dApp monorepo.

## Initial Setup

### 1. Install Prerequisites

#### Node.js and pnpm

```bash
# Install Node.js (if not already installed)
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install pnpm
npm install -g pnpm@8.15.0
```

#### Foundry (for Solidity)

The project uses Foundry at `/home/labidev/.foundry/bin/forge`. If you need to install Foundry:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Verify installation:
```bash
/home/labidev/.foundry/bin/forge --version
```

### 2. Clone and Install

```bash
# Navigate to project directory
cd /home/labidev/talent-protocol-dapps/no-loss-auction

# Install all dependencies
pnpm install
```

### 3. Build All Packages

```bash
# Build shared packages first, then apps
pnpm build
```

This will build packages in the correct order:
1. `@no-loss-auction/types`
2. `@no-loss-auction/utils`
3. `@no-loss-auction/shared`
4. Frontend, Backend, and Contracts

## Development Workflow

### Running Development Servers

```bash
# Run all apps simultaneously
pnpm dev

# Or run individually
pnpm dev:frontend  # http://localhost:3000
pnpm dev:backend   # http://localhost:3001
```

### Working with Smart Contracts

```bash
# Navigate to contracts directory
cd contracts

# Compile contracts
pnpm build
# or directly: /home/labidev/.foundry/bin/forge build

# Run tests
pnpm test
# or directly: /home/labidev/.foundry/bin/forge test

# Format Solidity code
pnpm format
# or directly: /home/labidev/.foundry/bin/forge fmt
```

### Working with Frontend

```bash
cd apps/frontend

# Development
pnpm dev

# Build
pnpm build

# Type check
pnpm type-check
```

### Working with Backend

```bash
cd apps/backend

# Development (with hot reload)
pnpm dev

# Build
pnpm build

# Start production server
pnpm start
```

## Project Structure Explained

### Apps (`apps/`)

- **frontend/**: Next.js application for the user interface
- **backend/**: Express API server for backend logic

### Packages (`packages/`)

- **types/**: Shared TypeScript type definitions
- **utils/**: Shared utility functions
- **shared/**: Convenience package that re-exports types and utils

### Contracts (`contracts/`)

- **src/**: Solidity source files
- **test/**: Foundry test files
- **script/**: Deployment scripts

## Adding New Dependencies

### To a specific package:

```bash
# Add to frontend
pnpm --filter @no-loss-auction/frontend add <package>

# Add to backend
pnpm --filter @no-loss-auction/backend add <package>

# Add to a shared package
pnpm --filter @no-loss-auction/types add <package>
```

### To root (dev dependencies):

```bash
pnpm add -D -w <package>
```

## Troubleshooting

### pnpm workspace issues

If you encounter workspace dependency issues:

```bash
# Clean install
rm -rf node_modules **/node_modules
pnpm install
```

### Foundry issues

If forge commands fail:

```bash
# Verify forge path
which forge
/home/labidev/.foundry/bin/forge --version

# Update Foundry
foundryup
```

### Build issues

If builds fail:

```bash
# Clean everything
pnpm clean

# Rebuild
pnpm build
```

## Next Steps

1. Set up environment variables (see main README.md)
2. Configure your blockchain RPC endpoints
3. Deploy smart contracts to testnet
4. Start developing features!

## Useful Commands Reference

```bash
# Development
pnpm dev                    # Run all apps
pnpm dev:frontend          # Frontend only
pnpm dev:backend           # Backend only

# Building
pnpm build                 # Build all
pnpm build:frontend        # Frontend only
pnpm build:backend         # Backend only
pnpm build:contracts       # Contracts only

# Testing
pnpm test                  # All tests
pnpm test:frontend         # Frontend tests
pnpm test:backend          # Backend tests
pnpm test:contracts        # Contract tests

# Code Quality
pnpm lint                  # Lint all
pnpm format                # Format all (including Solidity)

# Cleanup
pnpm clean                 # Clean all build artifacts
```
