# No Loss Auction dApp

A decentralized application for Real World Asset (RWA) tokenization with no-loss auction mechanism.

## 🏗️ Project Structure

This is a monorepo built with pnpm and Turborepo, containing:

```
no-loss-auction/
├── apps/
│   ├── frontend/      # Next.js frontend application
│   └── backend/       # Node.js/Express backend API
├── packages/
│   ├── shared/        # Shared code (re-exports types & utils)
│   ├── types/         # Shared TypeScript types
│   └── utils/         # Shared utility functions
├── contracts/         # Solidity smart contracts (Foundry)
├── package.json       # Root package.json
├── pnpm-workspace.yaml # pnpm workspace configuration
└── turbo.json         # Turborepo configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Foundry** (for Solidity development)
  - The project uses Foundry at `/home/labidev/.foundry/bin/forge`

### Installation

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Build all packages:**
   ```bash
   pnpm build
   ```

3. **Run development servers:**
   ```bash
   # Run all apps in parallel
   pnpm dev

   # Or run individually
   pnpm dev:frontend  # Frontend on http://localhost:3000
   pnpm dev:backend   # Backend on http://localhost:3001
   ```

## 📦 Available Scripts

### Root Level

- `pnpm dev` - Run all apps in development mode
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
- `pnpm format` - Format all code (including Solidity)
- `pnpm clean` - Clean all build artifacts

### Frontend

- `pnpm dev:frontend` - Start Next.js dev server
- `pnpm build:frontend` - Build Next.js app
- `pnpm test:frontend` - Run frontend tests

### Backend

- `pnpm dev:backend` - Start backend dev server
- `pnpm build:backend` - Build backend
- `pnpm test:backend` - Run backend tests

### Contracts

- `pnpm build:contracts` - Compile Solidity contracts
- `pnpm test:contracts` - Run contract tests
- `pnpm deploy:contracts` - Deploy contracts

## 🛠️ Development

### Frontend

The frontend is built with Next.js 14, React, TypeScript, Tailwind CSS, and Wagmi for Web3 integration.

**Key dependencies:**
- Next.js 14
- React 18
- Wagmi & Viem (Web3)
- TanStack Query
- Zustand (state management)

### Backend

The backend is built with Node.js, Express, and TypeScript.

**Key dependencies:**
- Express
- TypeScript
- Zod (validation)

### Smart Contracts

Smart contracts are developed with Solidity and Foundry.

**Key tools:**
- Foundry (forge, cast, anvil)
- Solidity 0.8.23

### Shared Packages

- **@no-loss-auction/types** - Shared TypeScript types
- **@no-loss-auction/utils** - Shared utility functions
- **@no-loss-auction/shared** - Convenience package that re-exports types and utils

## 📝 Environment Variables

Create `.env.local` files in each app directory as needed:

### Frontend (.env.local)
```env
NEXT_PUBLIC_RPC_URL=your_rpc_url
NEXT_PUBLIC_CHAIN_ID=1
```

### Backend (.env.local)
```env
PORT=3001
DATABASE_URL=your_database_url
```

### Contracts (.env)
```env
PRIVATE_KEY=your_private_key
RPC_URL=your_rpc_url
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test:frontend
pnpm test:backend
pnpm test:contracts
```

## 📚 Documentation

- [Frontend README](./apps/frontend/README.md)
- [Backend README](./apps/backend/README.md)
- [Contracts README](./contracts/README.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

Private project - All rights reserved
