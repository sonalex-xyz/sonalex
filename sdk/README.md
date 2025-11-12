# Percolator Protocol SDK

TypeScript SDK for interacting with the Percolator perpetual futures exchange on Solana.

## Overview

The Percolator SDK provides a high-level interface for:

- **Portfolio Management** - Initialize portfolios, manage cross-margin positions
- **Trading** - Place orders on order books (slabs)
- **Collateral Management** - Deposit and withdraw funds
- **Liquidity Provision** - Add/remove liquidity to order books and AMMs
- **Liquidations** - Liquidate underwater positions

## Installation

```bash
# Not yet published to npm
# For now, import directly from the sdk/ directory
```

## Quick Start

### Initialize Client

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { PercolatorClient } from './sdk';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

const client = new PercolatorClient({
  connection,
  routerProgramId: new PublicKey('YOUR_ROUTER_PROGRAM_ID'),
  slabProgramId: new PublicKey('YOUR_SLAB_PROGRAM_ID'),
  oracleProgramId: new PublicKey('YOUR_ORACLE_PROGRAM_ID'),
});
```

### Initialize Portfolio

Before trading, users must initialize a portfolio account:

```typescript
import { Keypair } from '@solana/web3.js';

const wallet = Keypair.generate(); // Or use actual wallet

// Initialize portfolio (one-time setup)
const signature = await client.initializePortfolio(wallet);
console.log('Portfolio initialized:', signature);
```

### Deposit Collateral

```typescript
import { NATIVE_MINT } from '@solana/spl-token';

// Deposit 1 SOL (1_000_000_000 lamports)
await client.deposit(wallet, {
  amount: 1_000_000_000n,
  mint: NATIVE_MINT, // SOL
});
```

### Place an Order

```typescript
import { Side, TimeInForce } from './sdk';

const slabPubkey = new PublicKey('SLAB_ACCOUNT_ADDRESS');
const oraclePubkey = new PublicKey('ORACLE_ACCOUNT_ADDRESS');

// Place a buy order
await client.placeOrder(wallet, slabPubkey, oraclePubkey, {
  instrumentIdx: 0,
  side: Side.Buy,
  size: 1_000_000n, // 1.0 (with 6 decimals)
  price: 50_000_000_000n, // $50,000 (with 6 decimals)
  timeInForce: TimeInForce.GTC,
});
```

### Check Portfolio

```typescript
const portfolio = await client.getPortfolio(wallet.publicKey);

console.log('Equity:', portfolio.equity);
console.log('Margin Used:', portfolio.marginUsed);
console.log('Available Balance:', portfolio.availableBalance);
console.log('Unrealized PnL:', portfolio.unrealizedPnl);
```

### Withdraw Collateral

```typescript
// Withdraw 0.5 SOL
await client.withdraw(wallet, {
  amount: 500_000_000n,
  mint: NATIVE_MINT,
});
```

## Low-Level API

For more control, you can use the instruction builders directly:

```typescript
import {
  createDepositInstruction,
  createExecuteCrossSlabInstruction,
} from './sdk';
import { Transaction } from '@solana/web3.js';

// Build deposit instruction
const depositIx = createDepositInstruction(
  wallet.publicKey,
  { amount: 1_000_000_000n, mint: NATIVE_MINT },
  routerProgramId
);

// Build transaction
const transaction = new Transaction().add(depositIx);

// Sign and send manually
// ...
```

## PDA Derivation

The SDK provides helpers for deriving Program Derived Addresses (PDAs):

```typescript
import { derivePortfolioPda, deriveVaultPda } from './sdk';

// Derive portfolio PDA
const { address, bump } = derivePortfolioPda(
  userPubkey,
  routerProgramId
);

// Or use the simpler create_with_seed approach (used in production)
import { createPortfolioAddress } from './sdk';
const portfolioAddress = createPortfolioAddress(userPubkey, routerProgramId);
```

## Architecture

### Components

1. **Router Program** - Central authority managing portfolios, margin, and liquidations
2. **Slab Program** - Order book matcher with price-time priority
3. **AMM Program** - Constant product market maker
4. **Oracle Program** - Price feed provider

### Account Structure

```
User Wallet
    |
    v
Portfolio (PDA)
    |
    +-- Positions (cross-margin)
    +-- Collateral
    +-- LP Seats (liquidity provision)
    |
    v
Venues (Slabs/AMMs)
    |
    +-- Order Books
    +-- Liquidity Pools
```

## Constants

### Enums

```typescript
enum Side {
  Buy = 0,
  Sell = 1,
}

enum TimeInForce {
  GTC = 0, // Good till cancel
  IOC = 1, // Immediate or cancel
  FOK = 2, // Fill or kill
}

enum MakerClass {
  REG = 0, // Regular - goes to pending queue
  DLP = 1, // Designated LP - posts immediately
}
```

### Limits

- `MAX_SLABS = 256` - Maximum number of slabs
- `MAX_INSTRUMENTS = 32` - Maximum instruments per slab
- `MAX_ACCOUNTS = 5,000` - Maximum accounts per slab
- `MAX_ORDERS = 30,000` - Maximum orders per slab
- `MAX_CAP_TTL_MS = 120,000` - Capability timeout (2 minutes)

## Important Notes

### Educational Use Only

⚠️ **This protocol is for educational purposes only and has not been audited for production use.**

### Program IDs

Before using the SDK, you must:

1. Deploy the Percolator programs (Router, Slab, AMM, Oracle)
2. Update the program IDs in `sdk/constants/index.ts`

### Decimal Precision

All amounts use **6 decimal places** (1e6 scale):

- Price: 50,000 USD = `50_000_000_000n`
- Size: 1.0 contracts = `1_000_000n`
- Collateral: 1 SOL = `1_000_000_000n` lamports (9 decimals for SOL)

### Transaction Size

Portfolio initialization requires ~135KB of account space, which exceeds the 10KB CPI limit. The SDK uses `createAccountWithSeed` to bypass this limitation.

## Development

### TODO Items

The SDK is functional but has some TODOs:

1. **Account Deserialization** - Implement proper Portfolio/Vault/LpSeat deserialization
2. **AMM Integration** - Add AMM-specific instruction builders
3. **LP Operations** - Complete RouterLiquidity instruction building
4. **Error Handling** - Add custom error types matching program errors
5. **Account Subscriptions** - Add WebSocket support for real-time updates
6. **Testing** - Add comprehensive unit and integration tests

### Integration with Sonalex UI

This SDK is designed to be used by the Sonalex Next.js frontend:

```typescript
// app/trader/page.tsx
import { useWallet } from '@solana/wallet-adapter-react';
import { PercolatorClient } from '@/sdk';

function TraderPage() {
  const { publicKey, signTransaction } = useWallet();

  // Initialize client with wallet
  const client = new PercolatorClient({ ... });

  // Use client methods
  await client.deposit(wallet, { ... });
}
```

## References

- [Percolator Repository](https://github.com/yourusername/percolator)
- [Percolator CLI](../percolator/cli/) - Reference implementation in Rust
- [Sonalex Frontend](../) - Next.js UI for Percolator

## License

MIT License - Educational use only, not audited for production.
