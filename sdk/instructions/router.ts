/**
 * Router program instruction builders
 * Matches: percolator/programs/router and percolator/cli/src/
 */

import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { RouterInstruction } from '../constants';
import {
  derivePortfolioPda,
  deriveVaultPda,
  deriveRegistryPda,
  deriveAuthorityPda,
  createPortfolioAddress,
} from '../pda';
import type { DepositParams, WithdrawParams, PlaceOrderParams } from '../types';

/**
 * Build instruction to initialize a new portfolio account
 *
 * This creates a portfolio account for tracking user's positions and margin.
 * Uses create_with_seed to bypass 10KB CPI limit.
 *
 * Matches: percolator/cli/src/margin.rs::initialize_portfolio
 *
 * @param user - The user's pubkey (owner of the portfolio)
 * @param programId - The router program ID
 * @returns Array of instructions: [create account, initialize portfolio]
 */
export function createInitializePortfolioInstructions(
  user: PublicKey,
  programId: PublicKey,
  portfolioSize: number,
  rentLamports: number
): TransactionInstruction[] {
  const seed = 'portfolio';
  const portfolioAddress = createPortfolioAddress(user, programId);

  // Instruction 1: Create the portfolio account using create_account_with_seed
  const createAccountIx = SystemProgram.createAccountWithSeed({
    fromPubkey: user,
    newAccountPubkey: portfolioAddress,
    basePubkey: user,
    seed,
    lamports: rentLamports,
    space: portfolioSize,
    programId,
  });

  // Instruction 2: Initialize the created account
  const instructionData = Buffer.alloc(33);
  instructionData.writeUInt8(RouterInstruction.InitializePortfolio, 0);
  user.toBuffer().copy(instructionData, 1);

  const initializeIx = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: portfolioAddress, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: true },
    ],
    data: instructionData,
  });

  return [createAccountIx, initializeIx];
}

/**
 * Build instruction to deposit collateral into portfolio
 *
 * Matches: percolator/cli/src/margin.rs::deposit_collateral
 *
 * @param user - The user's pubkey
 * @param params - Deposit parameters (amount, mint)
 * @param programId - The router program ID
 * @returns Deposit instruction
 */
export function createDepositInstruction(
  user: PublicKey,
  params: DepositParams,
  programId: PublicKey
): TransactionInstruction {
  const portfolioAddress = createPortfolioAddress(user, programId);

  // Build instruction data: [discriminator (1), amount (8)]
  const instructionData = Buffer.alloc(9);
  instructionData.writeUInt8(RouterInstruction.Deposit, 0);
  instructionData.writeBigUInt64LE(params.amount, 1);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: portfolioAddress, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });
}

/**
 * Build instruction to withdraw collateral from portfolio
 *
 * Matches: percolator/cli/src/margin.rs::withdraw_collateral
 *
 * @param user - The user's pubkey
 * @param params - Withdraw parameters (amount, mint)
 * @param programId - The router program ID
 * @returns Withdraw instruction
 */
export function createWithdrawInstruction(
  user: PublicKey,
  params: WithdrawParams,
  programId: PublicKey
): TransactionInstruction {
  const portfolioAddress = createPortfolioAddress(user, programId);

  // Build instruction data: [discriminator (1), amount (8)]
  const instructionData = Buffer.alloc(9);
  instructionData.writeUInt8(RouterInstruction.Withdraw, 0);
  instructionData.writeBigUInt64LE(params.amount, 1);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: portfolioAddress, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });
}

/**
 * Build instruction to execute cross-slab trade (place order and match)
 *
 * Matches: percolator/cli/src/trading.rs::place_limit_order
 *
 * @param user - The user's pubkey
 * @param slabPubkey - The slab (order book) to trade on
 * @param oraclePubkey - The oracle account for price feed
 * @param params - Order parameters
 * @param programId - The router program ID
 * @returns ExecuteCrossSlab instruction
 */
export function createExecuteCrossSlabInstruction(
  user: PublicKey,
  slabPubkey: PublicKey,
  oraclePubkey: PublicKey,
  params: PlaceOrderParams,
  programId: PublicKey
): TransactionInstruction {
  const portfolioAddress = createPortfolioAddress(user, programId);
  const { address: vaultPda } = deriveVaultPda(
    new PublicKey('So11111111111111111111111111111111111111112'), // SOL mint for MVP
    programId
  );
  const { address: registryPda } = deriveRegistryPda(programId);
  const { address: authorityPda } = deriveAuthorityPda(programId);

  // Derive receipt PDA
  const [receiptPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('receipt'), portfolioAddress.toBuffer(), slabPubkey.toBuffer()],
    programId
  );

  // Build instruction data for ExecuteCrossSlab
  // Layout: discriminator (1) + num_splits (1) + [side (1) + qty (8) + limit_px (8)] per split
  const numSplits = 1;
  const instructionData = Buffer.alloc(1 + 1 + 17);

  instructionData.writeUInt8(RouterInstruction.ExecuteCrossSlab, 0);
  instructionData.writeUInt8(numSplits, 1);

  // Split data: side (1 byte) + qty (8 bytes, i64) + limit_px (8 bytes, i64)
  const sideByte = params.side === 0 ? 0 : 1; // Buy = 0, Sell = 1
  instructionData.writeUInt8(sideByte, 2);
  instructionData.writeBigInt64LE(params.size, 3);
  instructionData.writeBigInt64LE(params.price, 11);

  // Build account list
  // 0. [writable] Portfolio account
  // 1. [signer] User account
  // 2. [writable] Vault account
  // 3. [writable] Registry account
  // 4. [] Router authority PDA
  // 5. [] System program
  // 6. [] Oracle account
  // 7. [writable] Slab account
  // 8. [writable] Receipt PDA
  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: portfolioAddress, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: false },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: registryPda, isSigner: false, isWritable: true },
      { pubkey: authorityPda, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: oraclePubkey, isSigner: false, isWritable: false },
      { pubkey: slabPubkey, isSigner: false, isWritable: true },
      { pubkey: receiptPda, isSigner: false, isWritable: true },
    ],
    data: instructionData,
  });
}

/**
 * Build instruction to reserve liquidity for LP operations
 *
 * @param user - The user's pubkey
 * @param matcherState - The matcher (slab/AMM) state account
 * @param amount - Amount to reserve
 * @param contextId - Context ID for multiple LP seats
 * @param programId - The router program ID
 * @returns RouterReserve instruction
 */
export function createRouterReserveInstruction(
  user: PublicKey,
  matcherState: PublicKey,
  amount: bigint,
  contextId: number,
  programId: PublicKey
): TransactionInstruction {
  const portfolioAddress = createPortfolioAddress(user, programId);

  // Derive LP seat PDA
  const [lpSeatPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('lp_seat'),
      programId.toBuffer(),
      matcherState.toBuffer(),
      portfolioAddress.toBuffer(),
      Buffer.from(new Uint32Array([contextId]).buffer),
    ],
    programId
  );

  // Build instruction data: [discriminator (1), amount (8), context_id (4)]
  const instructionData = Buffer.alloc(13);
  instructionData.writeUInt8(RouterInstruction.RouterReserve, 0);
  instructionData.writeBigUInt64LE(amount, 1);
  instructionData.writeUInt32LE(contextId, 9);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: portfolioAddress, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: false },
      { pubkey: matcherState, isSigner: false, isWritable: false },
      { pubkey: lpSeatPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });
}

/**
 * Build instruction to release reserved liquidity
 *
 * @param user - The user's pubkey
 * @param matcherState - The matcher (slab/AMM) state account
 * @param contextId - Context ID for the LP seat
 * @param programId - The router program ID
 * @returns RouterRelease instruction
 */
export function createRouterReleaseInstruction(
  user: PublicKey,
  matcherState: PublicKey,
  contextId: number,
  programId: PublicKey
): TransactionInstruction {
  const portfolioAddress = createPortfolioAddress(user, programId);

  // Derive LP seat PDA
  const [lpSeatPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('lp_seat'),
      programId.toBuffer(),
      matcherState.toBuffer(),
      portfolioAddress.toBuffer(),
      Buffer.from(new Uint32Array([contextId]).buffer),
    ],
    programId
  );

  // Build instruction data: [discriminator (1), context_id (4)]
  const instructionData = Buffer.alloc(5);
  instructionData.writeUInt8(RouterInstruction.RouterRelease, 0);
  instructionData.writeUInt32LE(contextId, 1);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: portfolioAddress, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: false },
      { pubkey: matcherState, isSigner: false, isWritable: false },
      { pubkey: lpSeatPda, isSigner: false, isWritable: true },
    ],
    data: instructionData,
  });
}

/**
 * Build instruction to liquidate an underwater user
 *
 * @param liquidator - The liquidator's pubkey
 * @param targetUser - The user to liquidate
 * @param programId - The router program ID
 * @returns LiquidateUser instruction
 */
export function createLiquidateUserInstruction(
  liquidator: PublicKey,
  targetUser: PublicKey,
  programId: PublicKey
): TransactionInstruction {
  const liquidatorPortfolio = createPortfolioAddress(liquidator, programId);
  const targetPortfolio = createPortfolioAddress(targetUser, programId);

  // Build instruction data: [discriminator (1), target_user (32)]
  const instructionData = Buffer.alloc(33);
  instructionData.writeUInt8(RouterInstruction.LiquidateUser, 0);
  targetUser.toBuffer().copy(instructionData, 1);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: liquidatorPortfolio, isSigner: false, isWritable: true },
      { pubkey: liquidator, isSigner: true, isWritable: false },
      { pubkey: targetPortfolio, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });
}
