# Oracle Management Guide for Sonalex

This guide explains how to manage price oracles for your Percolator exchange.

## Overview

**Oracles** provide price feeds for all instruments (BTC-PERP, ETH-PERP, SOL-PERP, etc.) traded on your exchange. They are critical infrastructure that YOU (the exchange operator) must maintain.

## Oracle Responsibility

### ❌ NOT LP Responsibility
Liquidity providers (LPs) do NOT manage oracles. LPs only:
- Deposit collateral
- Provide liquidity to order books/AMMs
- Earn fees

### ✅ YOUR Responsibility (Exchange Operator)
As the Percolator operator, you are responsible for:
- Deploying oracle accounts
- Initializing price feeds for each instrument
- Updating prices regularly
- Monitoring oracle health
- Ensuring price accuracy

## Oracle Architecture

### Testing/Educational (Current)
```
Your Admin Wallet
    |
    v
Percolator Oracle Program (deployed)
    |
    v
Oracle Accounts (one per instrument)
    - BTC-PERP Oracle
    - ETH-PERP Oracle
    - SOL-PERP Oracle
    - etc.
```

### Production (Recommended)
```
Pyth Network / Switchboard
    |
    v
Your Exchange
(reads prices automatically)
```

## Oracle Account Structure

Each oracle account stores:
```typescript
interface PriceOracle {
  magic: bigint;              // Validation bytes
  version: number;            // Oracle version
  authority: PublicKey;       // Who can update (YOUR admin wallet)
  instrument: PublicKey;      // Which instrument
  price: bigint;              // Current price (1e6 scale)
  timestamp: bigint;          // Last update time
  confidence: bigint;         // Price confidence (±)
}
```

## Initial Setup

### Step 1: Deploy Oracle Program

```bash
cd ../percolator

# Build oracle program
cargo build-sbf

# Deploy to devnet (only if using Percolator oracle for testing)
solana program deploy target/deploy/percolator_oracle.so

# Save the program ID
export ORACLE_PROGRAM_ID="<your-oracle-program-id>"
```

### Step 2: Update SDK Configuration

Edit `sdk/constants/index.ts`:
```typescript
export const ROUTER_PROGRAM_ID = new PublicKey('YOUR_ROUTER_ID');
export const SLAB_PROGRAM_ID = new PublicKey('YOUR_SLAB_ID');
export const AMM_PROGRAM_ID = new PublicKey('YOUR_AMM_ID');

// Add oracle program ID (optional for production with Pyth)
export const ORACLE_PROGRAM_ID = new PublicKey('YOUR_ORACLE_ID');
```

### Step 3: Create Oracle Accounts

For each instrument you want to trade:

```typescript
import { Keypair } from '@solana/web3.js';
import {
  createInitializeOracleInstructions,
  PRICE_ORACLE_SIZE,
} from '@/sdk';

async function createOracle(instrument: string, initialPrice: bigint) {
  // Generate keypair for oracle account
  const oracleKeypair = Keypair.generate();

  // Get rent exemption
  const rent = await connection.getMinimumBalanceForRentExemption(
    PRICE_ORACLE_SIZE
  );

  // Create and initialize oracle
  const instructions = createInitializeOracleInstructions(
    oracleKeypair.publicKey,
    adminWallet.publicKey,      // YOU are the authority
    instrumentPubkey,
    initialPrice,               // e.g., 65000_000000n for $65k BTC
    ORACLE_PROGRAM_ID,
    rent
  );

  // Build transaction
  const transaction = new Transaction().add(...instructions);

  // Sign with both admin and oracle keypair
  await sendAndConfirmTransaction(
    connection,
    transaction,
    [adminWallet, oracleKeypair]
  );

  console.log('Oracle created:', oracleKeypair.publicKey.toBase58());

  // SAVE THIS ADDRESS - you'll need it for trading!
  return oracleKeypair.publicKey;
}

// Create oracles for all instruments
const btcOracle = await createOracle('BTC-PERP', 65000_000000n);
const ethOracle = await createOracle('ETH-PERP', 3200_000000n);
const solOracle = await createOracle('SOL-PERP', 145_000000n);
```

**IMPORTANT:** Save all oracle addresses! You'll need them when users place trades.

## Ongoing Management

### Updating Prices (Manual)

For testing/educational use, update prices manually:

```typescript
import { createUpdatePriceInstruction } from '@/sdk';

async function updateOraclePrice(
  oracleAccount: PublicKey,
  newPrice: bigint,
  confidence: bigint
) {
  const instruction = createUpdatePriceInstruction(
    oracleAccount,
    adminWallet.publicKey,  // Only YOU can update
    newPrice,               // e.g., 65500_000000n
    confidence,             // e.g., 50_000000n (±$50)
    ORACLE_PROGRAM_ID
  );

  const transaction = new Transaction().add(instruction);
  await sendAndConfirmTransaction(connection, transaction, [adminWallet]);
}

// Update BTC price to $65,500
await updateOraclePrice(
  btcOracle,
  65500_000000n,
  50_000000n  // ±$50 confidence
);
```

### Batch Updates

Update multiple oracles at once:

```typescript
import { createBatchUpdatePriceInstructions } from '@/sdk';

async function updateAllPrices(prices: {
  btc: bigint,
  eth: bigint,
  sol: bigint
}) {
  const instructions = createBatchUpdatePriceInstructions([
    {
      oracleAccount: btcOracle,
      authority: adminWallet.publicKey,
      price: prices.btc,
      confidence: 50_000000n,
    },
    {
      oracleAccount: ethOracle,
      authority: adminWallet.publicKey,
      price: prices.eth,
      confidence: 10_000000n,
    },
    {
      oracleAccount: solOracle,
      authority: adminWallet.publicKey,
      price: prices.sol,
      confidence: 1_000000n,
    },
  ], ORACLE_PROGRAM_ID);

  const transaction = new Transaction().add(...instructions);
  await sendAndConfirmTransaction(connection, transaction, [adminWallet]);
}
```

### Automated Price Updates (Bot)

For testing, create a simple price updater bot:

```typescript
import axios from 'axios';

async function fetchRealPrices() {
  // Fetch from CoinGecko, Binance, etc.
  const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');

  return {
    btc: BigInt(Math.floor(response.data.bitcoin.usd * 1_000_000)),
    eth: BigInt(Math.floor(response.data.ethereum.usd * 1_000_000)),
    sol: BigInt(Math.floor(response.data.solana.usd * 1_000_000)),
  };
}

// Run every 30 seconds
setInterval(async () => {
  try {
    const prices = await fetchRealPrices();
    await updateAllPrices(prices);
    console.log('Prices updated:', prices);
  } catch (error) {
    console.error('Failed to update prices:', error);
  }
}, 30_000);
```

## Admin UI Oracle Monitoring

Your admin dashboard now includes an **Oracle Monitor** component that shows:

### Real-time Status
- ✅ **Healthy** - Updated within 30 seconds
- ⚠️ **Warning** - Updated 30-60 seconds ago
- 🔴 **Stale** - No update for over 60 seconds (exceeds max staleness)

### Monitoring Features
1. **Price Display** - Current price for each instrument
2. **Confidence Intervals** - Price accuracy range
3. **Last Update Time** - Age in seconds
4. **Status Badges** - Visual health indicators
5. **Quick Update** - Manual price update modal
6. **Alerts** - Warnings for stale oracles

### Using the Admin UI

1. Navigate to `/admin` in Sonalex
2. Scroll to "Price Oracles" section
3. Monitor all oracle statuses
4. Click "Update" to manually set prices
5. Watch for stale oracle warnings

## Oracle Configuration (Registry)

Oracle staleness threshold is set in the Router Registry:

```typescript
// In registry initialization
max_oracle_staleness_secs: 60  // 60 seconds
```

**Default: 60 seconds**

If an oracle hasn't been updated in 60 seconds, trades will be rejected.

## Trading Flow with Oracles

When a user places an order:

```typescript
// User calls placeOrder
await client.placeOrder(wallet, slabPubkey, oraclePubkey, params);
```

Internally:
1. Router reads oracle price
2. Checks `oracle.is_stale(current_time, 60)`
3. If stale → reject trade
4. If fresh → use price for margin calculations

**This is why you MUST keep oracles updated!**

## Production Migration Path

### Phase 1: Percolator Oracle (Testing)
✅ Use for development/testing
✅ Manual or bot updates
✅ Full control

### Phase 2: Pyth Integration (Production)

Pyth provides professional, real-time price feeds:

```typescript
import { PythHttpClient, getPythProgramKeyForCluster } from '@pythnetwork/client';

// Replace your oracle reads with Pyth
const pythClient = new PythHttpClient(connection, getPythProgramKeyForCluster('devnet'));

const priceData = await pythClient.getData();
const btcPrice = priceData.productPrice.get('Crypto.BTC/USD');

// Pyth updates automatically - no manual updates needed!
```

**Benefits:**
- 🔄 Automatic updates (sub-second)
- 🌐 Global price aggregation
- ✅ Production-grade reliability
- 🔒 Cryptographic security
- 💰 Already on Solana mainnet

**Migration Steps:**
1. Deploy to mainnet
2. Replace Percolator oracle with Pyth
3. Update Router to read Pyth accounts
4. Remove manual update bot
5. Monitor Pyth uptime

## Common Issues

### Issue: "Oracle is stale"
**Cause:** Haven't updated oracle in 60+ seconds
**Fix:** Run update bot or manually update via admin UI

### Issue: "Invalid authority"
**Cause:** Trying to update oracle with wrong wallet
**Fix:** Only admin wallet (oracle.authority) can update

### Issue: "Oracle account not found"
**Cause:** Oracle not initialized for this instrument
**Fix:** Create oracle using `createInitializeOracleInstructions`

### Issue: "Price seems wrong"
**Cause:** Manual price update error
**Fix:** Check price scaling (must multiply by 1_000_000)

## Price Scaling

All prices use **6 decimal precision**:

```typescript
// ✅ Correct
const btcPrice = 65000_000000n;  // $65,000.00

// ❌ Wrong
const btcPrice = 65000n;  // Will be read as $0.065000!
```

**Formula:**
```
price_scaled = price_usd * 1_000_000
```

**Examples:**
- $65,000 BTC → `65000_000000n`
- $3,200 ETH → `3200_000000n`
- $145.50 SOL → `145_500000n`
- $0.25 token → `0_250000n`

## Security Considerations

### 1. Authority Protection
- Oracle authority = admin wallet
- Store admin private key securely
- Consider using multisig for production

### 2. Price Accuracy
- Verify prices before updating
- Use confidence intervals
- Monitor for anomalies

### 3. Update Frequency
- Balance freshness vs. transaction costs
- Recommended: 30-60 seconds for testing
- Production (Pyth): sub-second updates

### 4. Backup Plan
- Have fallback price sources
- Monitor oracle health
- Emergency pause if oracles fail

## Summary

✅ **Oracle = Your Responsibility** (not LPs)
✅ **Create Oracle for Each Instrument** (BTC, ETH, SOL, etc.)
✅ **Update Prices Regularly** (< 60 seconds)
✅ **Monitor via Admin UI** (Oracle Monitor component)
✅ **Migrate to Pyth for Production** (automatic updates)

---

**Need Help?**
- Check admin UI: `/admin` → Oracle Monitor
- Review SDK: `sdk/instructions/oracle.ts`
- Test locally before deploying
- Use Pyth for production
