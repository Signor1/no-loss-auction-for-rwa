# Smart Contracts

This package contains the Solidity smart contracts for the No Loss Auction dApp.

## Setup

Make sure you have Foundry installed. The project uses the Foundry installation at `/home/labidev/.foundry/bin/forge`.

## Commands

- `pnpm build` - Compile contracts
- `pnpm test` - Run tests
- `pnpm test:coverage` - Run tests with coverage
- `pnpm test:gas` - Run tests with gas reporting
- `pnpm format` - Format Solidity code
- `pnpm lint` - Check formatting
- `pnpm clean` - Clean build artifacts

## Direct Forge Commands

If you need to use forge directly:

```bash
/home/labidev/.foundry/bin/forge build
/home/labidev/.foundry/bin/forge test
/home/labidev/.foundry/bin/forge script
```

## Project Structure

```
contracts/
├── src/          # Solidity source files
├── test/         # Test files
├── script/       # Deployment scripts
└── lib/          # Dependencies (forge-std)
```