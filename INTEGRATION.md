# Sonalex + Percolator Integration Guide

This document outlines the integration strategy between the Sonalex frontend and Percolator protocol.

## Overview

**Sonalex** is the web frontend (Next.js) that provides a user interface for the **Percolator** perpetual futures protocol on Solana.

```
┌─────────────────────────────────────────┐
│         Sonalex (Next.js UI)            │
│  - Trader Interface (/trader)           │
│  - LP Interface (/lp)                   │
│  - Admin Interface (/admin)             │
└──────────────┬──────────────────────────┘
               │
               │ uses
               v
┌─────────────────────────────────────────┐
│      Percolator SDK (TypeScript)        │
│  - PercolatorClient                     │
│  - Instruction Builders                 │
│  - PDA Helpers                          │
│  - Type Definitions                     │
└──────────────┬──────────────────────────┘
               │
               │ interacts with
               v
┌─────────────────────────────────────────┐
│    Percolator Programs (Solana)         │
│  - Router (margin, portfolios)          │
│  - Slab (order books)                   │
│  - AMM (liquidity pools)                │
│  - Oracle (price feeds)                 │
└─────────────────────────────────────────┘
```

## What We've Built

### 1. Percolator SDK (`/sdk`)

A complete TypeScript SDK for interacting with Percolator programs:

#### Structure:
```
sdk/
├── client.ts              # High-level PercolatorClient class
├── constants/
│   └── index.ts          # Program IDs, discriminators, limits
├── types/
│   └── index.ts          # TypeScript types matching Rust structs
├── pda/
│   └── index.ts          # PDA derivation helpers
├── instructions/
│   └── router.ts         # Transaction instruction builders
├── examples/
│   └── basic-usage.ts    # Usage examples
├── index.ts              # Main SDK exports
├── tsconfig.json         # TypeScript config
└── README.md             # SDK documentation
```

#### Key Features:

✅ **High-level Client API**
- `initializePortfolio()` - Setup user portfolio
- `deposit()` / `withdraw()` - Manage collateral
- `placeOrder()` - Execute trades
- `addLiquidity()` / `removeLiquidity()` - LP operations
- `liquidateUser()` - Liquidation engine

✅ **Type-safe Instruction Builders**
- Router instructions (deposit, withdraw, trade, liquidate)
- Slab instructions (order placement, matching)
- Proper account metadata and data serialization

✅ **PDA Derivation**
- Portfolio, Vault, Escrow PDAs
- LP Seat, Venue PnL PDAs
- `create_with_seed` support for large accounts

✅ **Complete Type Definitions**
- Matches Rust structs exactly
- Enums: Side, TimeInForce, MakerClass, OrderState
- Accounts: Portfolio, Order, Position, Trade, etc.

## Next Steps for Integration

### Step 1: Deploy Percolator Programs

Before using the SDK, you need to deploy the programs:

```bash
cd ../percolator

# Build programs
cargo build-sbf

# Deploy to devnet
solana program deploy \
  target/deploy/percolator_router.so \
  --program-id router-keypair.json

solana program deploy \
  target/deploy/percolator_slab.so \
  --program-id slab-keypair.json
```

### Step 2: Update Program IDs

Update `/sdk/constants/index.ts` with your deployed program IDs:

```typescript
export const ROUTER_PROGRAM_ID = new PublicKey('YOUR_ROUTER_PROGRAM_ID');
export const SLAB_PROGRAM_ID = new PublicKey('YOUR_SLAB_PROGRAM_ID');
export const AMM_PROGRAM_ID = new PublicKey('YOUR_AMM_PROGRAM_ID');
```

### Step 3: Integrate SDK into Sonalex Pages

#### Example: Trader Interface

Update `/app/trader/page.tsx`:

```typescript
'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PercolatorClient, Side, TimeInForce } from '@/sdk';
import { useEffect, useState } from 'react';

export default function TraderPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [client, setClient] = useState<PercolatorClient | null>(null);
  const [portfolio, setPortfolio] = useState(null);

  // Initialize client
  useEffect(() => {
    if (connection) {
      const percolatorClient = new PercolatorClient({
        connection,
        routerProgramId: ROUTER_PROGRAM_ID,
        slabProgramId: SLAB_PROGRAM_ID,
      });
      setClient(percolatorClient);
    }
  }, [connection]);

  // Fetch portfolio
  useEffect(() => {
    if (client && wallet.publicKey) {
      client.getPortfolio(wallet.publicKey).then(setPortfolio);
    }
  }, [client, wallet.publicKey]);

  // Handle deposit
  async function handleDeposit(amount: bigint) {
    if (!client || !wallet.signTransaction) return;

    await client.deposit(wallet as any, {
      amount,
      mint: NATIVE_MINT,
    });

    // Refresh portfolio
    const updated = await client.getPortfolio(wallet.publicKey!);
    setPortfolio(updated);
  }

  // Handle place order
  async function handlePlaceOrder(params: PlaceOrderParams) {
    if (!client || !wallet.signTransaction) return;

    await client.placeOrder(
      wallet as any,
      SLAB_PUBKEY,
      ORACLE_PUBKEY,
      params
    );
  }

  return (
    <div>
      {/* Display portfolio data */}
      <div>Equity: {portfolio?.equity?.toString()}</div>

      {/* Order form */}
      <button onClick={() => handlePlaceOrder({
        instrumentIdx: 0,
        side: Side.Buy,
        size: 1_000_000n,
        price: 50_000_000_000n,
        timeInForce: TimeInForce.GTC,
      })}>
        Place Buy Order
      </button>
    </div>
  );
}
```

#### Example: LP Interface

Update `/app/lp/page.tsx`:

```typescript
'use client';

import { PercolatorClient } from '@/sdk';

export default function LPPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [client, setClient] = useState<PercolatorClient | null>(null);

  async function handleAddLiquidity(amount: bigint) {
    if (!client || !wallet.signTransaction) return;

    await client.addLiquidity(
      wallet as any,
      SLAB_STATE_PUBKEY,
      {
        amount,
        priceRange: {
          lower: 45_000_000_000n,
          upper: 55_000_000_000n,
        },
      },
      0 // context_id
    );
  }

  return (
    <div>
      <button onClick={() => handleAddLiquidity(100_000_000n)}>
        Add Liquidity
      </button>
    </div>
  );
}
```

### Step 4: Add Wallet Provider

Wrap your app with Solana wallet providers in `/app/layout.tsx`:

```typescript
'use client';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useMemo } from 'react';

export default function RootLayout({ children }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => 'https://api.devnet.solana.com', []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <html lang="en">
      <body>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              {children}
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </body>
    </html>
  );
}
```

### Step 5: Implement Account Deserialization

Currently, `getPortfolio()` returns placeholder data. You need to implement proper deserialization:

```typescript
// sdk/deserializers/portfolio.ts

import { PublicKey } from '@solana/web3.js';
import type { Portfolio } from '../types';

export function deserializePortfolio(data: Buffer): Portfolio {
  // Read from buffer matching Rust struct layout
  let offset = 0;

  const owner = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  const equity = data.readBigInt64LE(offset);
  offset += 8;

  // ... continue for all fields

  return {
    owner,
    equity,
    marginUsed,
    // ... all fields
  };
}
```

### Step 6: Add Real-time Updates (Optional)

Use WebSocket subscriptions for live updates:

```typescript
// Listen for portfolio changes
connection.onAccountChange(
  portfolioAddress,
  (accountInfo) => {
    const portfolio = deserializePortfolio(accountInfo.data);
    setPortfolio(portfolio);
  },
  'confirmed'
);
```

### Step 7: Error Handling

Add custom error types matching program errors:

```typescript
// sdk/errors.ts

export enum PercolatorError {
  InsufficientMargin = 0x1001,
  PositionNotFound = 0x1002,
  InvalidPrice = 0x1003,
  // ... match Rust error codes
}

export function parsePercolatorError(logs: string[]): PercolatorError | null {
  // Parse program logs to extract error
}
```

## TODO Items

### SDK Improvements

- [ ] Implement account deserialization (Portfolio, Vault, LpSeat)
- [ ] Add AMM instruction builders
- [ ] Complete RouterLiquidity instruction (ObAdd/AmmAdd intents)
- [ ] Add custom error types matching Rust errors
- [ ] Add WebSocket subscription helpers
- [ ] Write comprehensive tests
- [ ] Add JSDoc comments for all public APIs

### Frontend Integration

- [ ] Add wallet provider to layout
- [ ] Implement trader interface with SDK
- [ ] Implement LP interface with SDK
- [ ] Implement admin interface with SDK
- [ ] Add error handling and loading states
- [ ] Add real-time portfolio updates
- [ ] Add transaction confirmation UI
- [ ] Add order book visualization
- [ ] Add position management UI

### Testing & Deployment

- [ ] Deploy Percolator programs to devnet
- [ ] Update program IDs in constants
- [ ] Test SDK with deployed programs
- [ ] Add E2E tests for UI flows
- [ ] Set up CI/CD pipeline
- [ ] Add monitoring and analytics

## Resources

- **Percolator Repository**: `../percolator`
- **Percolator CLI**: `../percolator/cli/src/` (Rust reference implementation)
- **SDK Documentation**: `/sdk/README.md`
- **Usage Examples**: `/sdk/examples/basic-usage.ts`

## Architecture Benefits

✅ **Type Safety** - Full TypeScript types matching Rust structs
✅ **Reusability** - SDK can be used by any frontend/tool
✅ **Abstraction** - High-level client hides complexity
✅ **Testability** - Easy to mock and test
✅ **Documentation** - Clear examples and JSDoc

## Getting Help

1. Check SDK README: `/sdk/README.md`
2. Review examples: `/sdk/examples/basic-usage.ts`
3. Reference Percolator CLI: `../percolator/cli/src/`
4. Read Percolator docs: `../percolator/README.md`

---

**Status**: ✅ SDK Complete - Ready for frontend integration

**Next Action**: Deploy Percolator programs and update program IDs in `/sdk/constants/index.ts`
