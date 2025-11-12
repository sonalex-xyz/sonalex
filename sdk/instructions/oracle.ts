/**
 * Oracle program instruction builders
 * Matches: percolator/programs/oracle and percolator/cli/src/tests.rs
 */

import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';

/**
 * Oracle instruction discriminators
 */
export enum OracleInstruction {
  Initialize = 0,
  UpdatePrice = 1,
}

/**
 * Size of PriceOracle account in bytes
 */
export const PRICE_ORACLE_SIZE = 128;

/**
 * Build instructions to create and initialize a new price oracle
 *
 * Creates a new oracle account for an instrument with initial price data.
 * Only the authority can update prices later.
 *
 * Matches: percolator/cli/src/tests.rs::initialize_oracle
 *
 * @param oracleKeypair - Keypair for the new oracle account
 * @param authority - Who can update prices (admin wallet)
 * @param instrument - Instrument this oracle is for (can be PublicKey.default for tests)
 * @param initialPrice - Initial price (scaled by 1_000_000)
 * @param programId - The oracle program ID
 * @param rentLamports - Lamports for rent exemption
 * @returns Array of instructions: [create account, initialize oracle]
 */
export function createInitializeOracleInstructions(
  oracleKeypair: PublicKey,
  authority: PublicKey,
  instrument: PublicKey,
  initialPrice: bigint,
  programId: PublicKey,
  rentLamports: number
): TransactionInstruction[] {
  // Instruction 1: Create the oracle account
  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: authority,
    newAccountPubkey: oracleKeypair,
    lamports: rentLamports,
    space: PRICE_ORACLE_SIZE,
    programId,
  });

  // Instruction 2: Initialize the oracle
  // Data format: discriminator (1) + initial_price (8) + bump (1)
  const bump = 0; // Not a PDA
  const instructionData = Buffer.alloc(10);
  instructionData.writeUInt8(OracleInstruction.Initialize, 0);
  instructionData.writeBigInt64LE(initialPrice, 1);
  instructionData.writeUInt8(bump, 9);

  const initializeIx = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: oracleKeypair, isSigner: false, isWritable: true }, // Oracle account
      { pubkey: authority, isSigner: true, isWritable: false },     // Authority (signer)
      { pubkey: instrument, isSigner: false, isWritable: false },   // Instrument
    ],
    data: instructionData,
  });

  return [createAccountIx, initializeIx];
}

/**
 * Build instruction to update oracle price
 *
 * Updates the price data in an existing oracle. Only the oracle's authority
 * can call this instruction.
 *
 * Matches: percolator/programs/oracle/src/instructions.rs::process_update_price
 *
 * @param oracleAccount - The oracle account to update
 * @param authority - Oracle authority (must match oracle.authority)
 * @param price - New price (scaled by 1_000_000)
 * @param confidence - Price confidence interval (scaled by 1_000_000)
 * @param programId - The oracle program ID
 * @returns UpdatePrice instruction
 */
export function createUpdatePriceInstruction(
  oracleAccount: PublicKey,
  authority: PublicKey,
  price: bigint,
  confidence: bigint,
  programId: PublicKey
): TransactionInstruction {
  // Data format: discriminator (1) + price (8) + confidence (8)
  const instructionData = Buffer.alloc(17);
  instructionData.writeUInt8(OracleInstruction.UpdatePrice, 0);
  instructionData.writeBigInt64LE(price, 1);
  instructionData.writeBigInt64LE(confidence, 9);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: oracleAccount, isSigner: false, isWritable: true }, // Oracle account (writable)
      { pubkey: authority, isSigner: true, isWritable: false },     // Authority (signer)
    ],
    data: instructionData,
  });
}

/**
 * Batch update multiple oracles
 *
 * Helper function to create update instructions for multiple oracles at once.
 * Useful for updating all instrument prices from a price feed.
 *
 * @param updates - Array of oracle updates
 * @param programId - The oracle program ID
 * @returns Array of UpdatePrice instructions
 */
export function createBatchUpdatePriceInstructions(
  updates: Array<{
    oracleAccount: PublicKey;
    authority: PublicKey;
    price: bigint;
    confidence: bigint;
  }>,
  programId: PublicKey
): TransactionInstruction[] {
  return updates.map(({ oracleAccount, authority, price, confidence }) =>
    createUpdatePriceInstruction(oracleAccount, authority, price, confidence, programId)
  );
}
