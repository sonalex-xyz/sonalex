/**
 * Basic usage examples for Percolator SDK
 *
 * This file demonstrates common operations with the Percolator Protocol.
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  PercolatorClient,
  Side,
  TimeInForce,
  ROUTER_PROGRAM_ID,
  SLAB_PROGRAM_ID,
} from '../index';

/**
 * Example 1: Initialize client and portfolio
 */
async function example1_InitializePortfolio() {
  console.log('=== Example 1: Initialize Portfolio ===\n');

  // Setup connection
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Create client
  const client = new PercolatorClient({
    connection,
    routerProgramId: ROUTER_PROGRAM_ID,
    slabProgramId: SLAB_PROGRAM_ID,
  });

  // Generate or load wallet
  const wallet = Keypair.generate();
  console.log('Wallet:', wallet.publicKey.toBase58());

  // Check if portfolio exists
  const exists = await client.portfolioExists(wallet.publicKey);
  console.log('Portfolio exists:', exists);

  if (!exists) {
    // Initialize portfolio
    console.log('Initializing portfolio...');
    const signature = await client.initializePortfolio(wallet);
    console.log('Portfolio initialized:', signature);
  }

  console.log('');
}

/**
 * Example 2: Deposit and withdraw collateral
 */
async function example2_DepositWithdraw() {
  console.log('=== Example 2: Deposit & Withdraw ===\n');

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const client = new PercolatorClient({
    connection,
    routerProgramId: ROUTER_PROGRAM_ID,
  });

  const wallet = Keypair.generate(); // Use actual wallet

  // SOL mint (native)
  const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

  // Deposit 1 SOL
  console.log('Depositing 1 SOL...');
  const depositSig = await client.deposit(wallet, {
    amount: 1_000_000_000n, // 1 SOL = 1e9 lamports
    mint: SOL_MINT,
  });
  console.log('Deposit signature:', depositSig);

  // Check portfolio
  const portfolio = await client.getPortfolio(wallet.publicKey);
  console.log('Portfolio equity:', portfolio?.equity);

  // Withdraw 0.5 SOL
  console.log('\nWithdrawing 0.5 SOL...');
  const withdrawSig = await client.withdraw(wallet, {
    amount: 500_000_000n, // 0.5 SOL
    mint: SOL_MINT,
  });
  console.log('Withdraw signature:', withdrawSig);

  console.log('');
}

/**
 * Example 3: Place a limit order
 */
async function example3_PlaceLimitOrder() {
  console.log('=== Example 3: Place Limit Order ===\n');

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const client = new PercolatorClient({
    connection,
    routerProgramId: ROUTER_PROGRAM_ID,
    slabProgramId: SLAB_PROGRAM_ID,
  });

  const wallet = Keypair.generate(); // Use actual wallet

  // Slab and oracle addresses (replace with actual addresses)
  const slabPubkey = new PublicKey('11111111111111111111111111111111'); // TODO
  const oraclePubkey = new PublicKey('11111111111111111111111111111111'); // TODO

  // Place a buy order for BTC-PERP at $50,000
  console.log('Placing buy order...');
  const orderSig = await client.placeOrder(
    wallet,
    slabPubkey,
    oraclePubkey,
    {
      instrumentIdx: 0, // BTC-PERP
      side: Side.Buy,
      size: 1_000_000n, // 1.0 contracts (6 decimals)
      price: 50_000_000_000n, // $50,000 (6 decimals)
      timeInForce: TimeInForce.GTC, // Good till cancel
    }
  );
  console.log('Order placed:', orderSig);

  console.log('');
}

/**
 * Example 4: Market order (limit price = 0)
 */
async function example4_PlaceMarketOrder() {
  console.log('=== Example 4: Place Market Order ===\n');

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const client = new PercolatorClient({
    connection,
    routerProgramId: ROUTER_PROGRAM_ID,
    slabProgramId: SLAB_PROGRAM_ID,
  });

  const wallet = Keypair.generate();

  const slabPubkey = new PublicKey('11111111111111111111111111111111');
  const oraclePubkey = new PublicKey('11111111111111111111111111111111');

  // Market sell order (price = 0 or very high/low limit)
  console.log('Placing market sell order...');
  const orderSig = await client.placeOrder(
    wallet,
    slabPubkey,
    oraclePubkey,
    {
      instrumentIdx: 0,
      side: Side.Sell,
      size: 1_000_000n, // 1.0 contracts
      price: 0n, // Market order (no price limit)
      timeInForce: TimeInForce.IOC, // Immediate or cancel
    }
  );
  console.log('Market order placed:', orderSig);

  console.log('');
}

/**
 * Example 5: Add liquidity to a slab
 */
async function example5_AddLiquidity() {
  console.log('=== Example 5: Add Liquidity ===\n');

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const client = new PercolatorClient({
    connection,
    routerProgramId: ROUTER_PROGRAM_ID,
    slabProgramId: SLAB_PROGRAM_ID,
  });

  const wallet = Keypair.generate();

  const slabState = new PublicKey('11111111111111111111111111111111');

  // Add 100 units of liquidity
  console.log('Adding liquidity...');
  const lpSig = await client.addLiquidity(
    wallet,
    slabState,
    {
      amount: 100_000_000n, // 100.0 (6 decimals)
      // Optional: price range for concentrated liquidity
      priceRange: {
        lower: 45_000_000_000n, // $45,000
        upper: 55_000_000_000n, // $55,000
      },
    },
    0 // context_id
  );
  console.log('Liquidity added:', lpSig);

  console.log('');
}

/**
 * Example 6: Liquidate underwater user
 */
async function example6_Liquidation() {
  console.log('=== Example 6: Liquidation ===\n');

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const client = new PercolatorClient({
    connection,
    routerProgramId: ROUTER_PROGRAM_ID,
  });

  const liquidator = Keypair.generate();
  const targetUser = new PublicKey('USER_TO_LIQUIDATE'); // TODO

  // Check if target user is underwater (would need to fetch portfolio first)
  // const targetPortfolio = await client.getPortfolio(targetUser);
  // if (targetPortfolio.equity < targetPortfolio.marginUsed) {
  //   // User is underwater, can liquidate
  // }

  console.log('Liquidating user...');
  const liqSig = await client.liquidateUser(liquidator, targetUser);
  console.log('Liquidation executed:', liqSig);

  console.log('');
}

/**
 * Example 7: Using low-level instruction builders
 */
async function example7_LowLevelInstructions() {
  console.log('=== Example 7: Low-Level Instructions ===\n');

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const wallet = Keypair.generate();

  // Import instruction builders
  const {
    createDepositInstruction,
    createWithdrawInstruction,
  } = await import('../instructions/router');

  const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

  // Build deposit instruction manually
  const depositIx = createDepositInstruction(
    wallet.publicKey,
    { amount: 1_000_000_000n, mint: SOL_MINT },
    ROUTER_PROGRAM_ID
  );

  console.log('Deposit instruction created');
  console.log('Program ID:', depositIx.programId.toBase58());
  console.log('Accounts:', depositIx.keys.length);
  console.log('Data length:', depositIx.data.length);

  // You can now add this to a transaction manually
  // const transaction = new Transaction().add(depositIx);
  // ... sign and send

  console.log('');
}

/**
 * Example 8: PDA derivation
 */
async function example8_PDADerivation() {
  console.log('=== Example 8: PDA Derivation ===\n');

  const {
    derivePortfolioPda,
    deriveVaultPda,
    createPortfolioAddress,
  } = await import('../pda');

  const userPubkey = new PublicKey('USER_PUBKEY'); // TODO
  const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

  // Method 1: PDA derivation
  const portfolioPda = derivePortfolioPda(userPubkey, ROUTER_PROGRAM_ID);
  console.log('Portfolio PDA:', portfolioPda.address.toBase58());
  console.log('Bump:', portfolioPda.bump);

  // Method 2: create_with_seed (used in production)
  const portfolioAddress = createPortfolioAddress(userPubkey, ROUTER_PROGRAM_ID);
  console.log('\nPortfolio Address (with seed):', portfolioAddress.toBase58());

  // Derive vault PDA
  const vaultPda = deriveVaultPda(SOL_MINT, ROUTER_PROGRAM_ID);
  console.log('\nVault PDA:', vaultPda.address.toBase58());
  console.log('Bump:', vaultPda.bump);

  console.log('');
}

// ============================================================================
// Run examples
// ============================================================================

async function main() {
  console.log('\n🚀 Percolator SDK Examples\n');
  console.log('=' .repeat(60));
  console.log('\n');

  try {
    // Uncomment the examples you want to run:

    // await example1_InitializePortfolio();
    // await example2_DepositWithdraw();
    // await example3_PlaceLimitOrder();
    // await example4_PlaceMarketOrder();
    // await example5_AddLiquidity();
    // await example6_Liquidation();
    // await example7_LowLevelInstructions();
    await example8_PDADerivation();

  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  example1_InitializePortfolio,
  example2_DepositWithdraw,
  example3_PlaceLimitOrder,
  example4_PlaceMarketOrder,
  example5_AddLiquidity,
  example6_Liquidation,
  example7_LowLevelInstructions,
  example8_PDADerivation,
};
