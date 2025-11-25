/**
 * Oracle program instruction builders
 * Matches: percolator/programs/oracle and percolator/cli/src/tests.rs
 */

import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  Connection,
  Keypair,
} from '@solana/web3.js';
import { PriceOracle } from '../types';

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

/**
 * Magic bytes for oracle validation: "PRCLORCL"
 */
export const ORACLE_MAGIC = 0x4c43524f4c435250n; // "PRCLORCL" in little-endian

/**
 * Parse oracle account data into PriceOracle struct
 *
 * @param data - Raw account data buffer
 * @returns Parsed PriceOracle or null if invalid
 */
export function parseOracleData(data: Buffer): PriceOracle | null {
  if (data.length < PRICE_ORACLE_SIZE) {
    return null;
  }

  const magic = data.readBigUInt64LE(0);
  if (magic !== ORACLE_MAGIC) {
    return null;
  }

  const version = data.readUInt8(8);
  const bump = data.readUInt8(9);
  // padding at 10-15
  const authority = new PublicKey(data.subarray(16, 48));
  const instrument = new PublicKey(data.subarray(48, 80));
  const price = data.readBigInt64LE(80);
  const timestamp = data.readBigInt64LE(88);
  const confidence = data.readBigInt64LE(96);

  return {
    magic,
    version,
    bump,
    authority,
    instrument,
    price,
    timestamp,
    confidence,
  };
}

/**
 * Fetch all oracle accounts for the program
 *
 * @param connection - Solana connection
 * @param programId - Oracle program ID
 * @returns Array of oracle accounts with their addresses and parsed data
 */
export async function fetchAllOracles(
  connection: Connection,
  programId: PublicKey
): Promise<Array<{ address: PublicKey; data: PriceOracle }>> {
  const accounts = await connection.getProgramAccounts(programId, {
    filters: [
      { dataSize: PRICE_ORACLE_SIZE },
    ],
  });

  const oracles: Array<{ address: PublicKey; data: PriceOracle }> = [];

  for (const { pubkey, account } of accounts) {
    const parsed = parseOracleData(Buffer.from(account.data));
    if (parsed) {
      oracles.push({ address: pubkey, data: parsed });
    }
  }

  return oracles;
}

/**
 * Fetch a single oracle account
 *
 * @param connection - Solana connection
 * @param oracleAddress - Oracle account address
 * @returns Parsed oracle data or null if not found/invalid
 */
export async function fetchOracle(
  connection: Connection,
  oracleAddress: PublicKey
): Promise<PriceOracle | null> {
  const accountInfo = await connection.getAccountInfo(oracleAddress);
  if (!accountInfo) {
    return null;
  }

  return parseOracleData(Buffer.from(accountInfo.data));
}
