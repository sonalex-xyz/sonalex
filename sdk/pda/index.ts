/**
 * Program Derived Address (PDA) helpers
 * Matches: percolator/programs/router/src/pda.rs
 */

import { PublicKey } from '@solana/web3.js';
import {
  VAULT_SEED,
  ESCROW_SEED,
  CAP_SEED,
  PORTFOLIO_SEED,
  REGISTRY_SEED,
  AUTHORITY_SEED,
  ROUTER_SIGNER_SEED,
  INSURANCE_VAULT_SEED,
  LP_SEAT_SEED,
  VENUE_PNL_SEED,
} from '../constants';

/**
 * Result of PDA derivation
 */
export interface PdaResult {
  /** The derived PDA address */
  address: PublicKey;
  /** The bump seed used for derivation */
  bump: number;
}

/**
 * Derive router authority PDA
 *
 * This PDA is used as the router's signing authority for CPIs to slabs.
 * Slabs should be initialized with this PDA as their router_id.
 *
 * @param programId - The router program ID
 * @returns PDA and bump seed
 */
export function deriveAuthorityPda(programId: PublicKey): PdaResult {
  const [address, bump] = PublicKey.findProgramAddressSync(
    [AUTHORITY_SEED],
    programId
  );
  return { address, bump };
}

/**
 * Derive router signer PDA for matcher CPIs
 *
 * This PDA is used as a signer for all Router → Matcher CPIs.
 * Matchers verify this PDA's derivation to authenticate the Router.
 *
 * @param programId - The router program ID
 * @returns PDA and bump seed
 */
export function deriveRouterSignerPda(programId: PublicKey): PdaResult {
  const [address, bump] = PublicKey.findProgramAddressSync(
    [ROUTER_SIGNER_SEED],
    programId
  );
  return { address, bump };
}

/**
 * Derive insurance vault PDA
 *
 * This PDA holds the insurance fund's lamports and is controlled by the program.
 * Lamports are transferred to/from this vault during insurance operations.
 *
 * @param programId - The router program ID
 * @returns PDA and bump seed
 */
export function deriveInsuranceVaultPda(programId: PublicKey): PdaResult {
  const [address, bump] = PublicKey.findProgramAddressSync(
    [INSURANCE_VAULT_SEED],
    programId
  );
  return { address, bump };
}

/**
 * Derive vault PDA for a given mint
 *
 * Vault stores collateral for a specific mint (e.g., USDC, SOL)
 *
 * @param mint - The mint pubkey for which to derive the vault
 * @param programId - The router program ID
 * @returns PDA and bump seed
 */
export function deriveVaultPda(mint: PublicKey, programId: PublicKey): PdaResult {
  const [address, bump] = PublicKey.findProgramAddressSync(
    [VAULT_SEED, mint.toBuffer()],
    programId
  );
  return { address, bump };
}

/**
 * Derive escrow PDA for a user on a specific slab with a specific mint
 *
 * Escrow holds user funds pledged to a specific slab
 *
 * @param user - The user's pubkey
 * @param slab - The slab program's pubkey
 * @param mint - The mint pubkey
 * @param programId - The router program ID
 * @returns PDA and bump seed
 */
export function deriveEscrowPda(
  user: PublicKey,
  slab: PublicKey,
  mint: PublicKey,
  programId: PublicKey
): PdaResult {
  const [address, bump] = PublicKey.findProgramAddressSync(
    [ESCROW_SEED, user.toBuffer(), slab.toBuffer(), mint.toBuffer()],
    programId
  );
  return { address, bump };
}

/**
 * Derive capability token PDA
 *
 * Capability tokens authorize scoped debits from escrows
 *
 * @param user - The user's pubkey
 * @param slab - The slab program's pubkey
 * @param mint - The mint pubkey
 * @param nonce - Unique nonce to allow multiple concurrent caps
 * @param programId - The router program ID
 * @returns PDA and bump seed
 */
export function deriveCapPda(
  user: PublicKey,
  slab: PublicKey,
  mint: PublicKey,
  nonce: bigint,
  programId: PublicKey
): PdaResult {
  const nonceBuffer = Buffer.alloc(8);
  nonceBuffer.writeBigUInt64LE(nonce);

  const [address, bump] = PublicKey.findProgramAddressSync(
    [CAP_SEED, user.toBuffer(), slab.toBuffer(), mint.toBuffer(), nonceBuffer],
    programId
  );
  return { address, bump };
}

/**
 * Derive portfolio PDA for a user
 *
 * Portfolio aggregates user's positions and margin across all slabs
 *
 * @param user - The user's pubkey
 * @param programId - The router program ID
 * @returns PDA and bump seed
 */
export function derivePortfolioPda(user: PublicKey, programId: PublicKey): PdaResult {
  const [address, bump] = PublicKey.findProgramAddressSync(
    [PORTFOLIO_SEED, user.toBuffer()],
    programId
  );
  return { address, bump };
}

/**
 * Derive slab registry PDA
 *
 * Registry maintains list of approved slabs
 *
 * @param programId - The router program ID
 * @returns PDA and bump seed
 */
export function deriveRegistryPda(programId: PublicKey): PdaResult {
  const [address, bump] = PublicKey.findProgramAddressSync(
    [REGISTRY_SEED],
    programId
  );
  return { address, bump };
}

/**
 * Derive LP seat PDA for adapter pattern
 *
 * LP seat tracks liquidity provision for a specific (router × matcher × portfolio × context).
 * Seats provide isolation between different LPs on the same matcher.
 *
 * @param routerId - The router program ID (for cross-program authentication)
 * @param matcherState - The matcher state account
 * @param portfolio - The portfolio account providing liquidity
 * @param contextId - Context ID to allow multiple seats per portfolio × matcher
 * @param programId - The router program ID (used for derivation)
 * @returns PDA and bump seed
 */
export function deriveLpSeatPda(
  routerId: PublicKey,
  matcherState: PublicKey,
  portfolio: PublicKey,
  contextId: number,
  programId: PublicKey
): PdaResult {
  const contextIdBuffer = Buffer.alloc(4);
  contextIdBuffer.writeUInt32LE(contextId);

  const [address, bump] = PublicKey.findProgramAddressSync(
    [
      LP_SEAT_SEED,
      routerId.toBuffer(),
      matcherState.toBuffer(),
      portfolio.toBuffer(),
      contextIdBuffer,
    ],
    programId
  );
  return { address, bump };
}

/**
 * Derive venue PnL PDA for LP adapter pattern
 *
 * Venue PnL tracks aggregate PnL metrics across all LP seats for a given venue (matcher).
 * This provides venue-level accounting for fee credits, venue fees, and realized PnL.
 *
 * @param routerId - The router program ID (for cross-program authentication)
 * @param matcherState - The matcher state account
 * @param programId - The router program ID (used for derivation)
 * @returns PDA and bump seed
 */
export function deriveVenuePnlPda(
  routerId: PublicKey,
  matcherState: PublicKey,
  programId: PublicKey
): PdaResult {
  const [address, bump] = PublicKey.findProgramAddressSync(
    [VENUE_PNL_SEED, routerId.toBuffer(), matcherState.toBuffer()],
    programId
  );
  return { address, bump };
}

/**
 * Create portfolio account address using create_with_seed
 *
 * NOTE: This creates a regular account (not PDA) at a deterministic address.
 * This bypasses the 10KB CPI limit since creation happens from the client.
 * Matches the CLI implementation in percolator/cli/src/margin.rs
 *
 * @param user - The user's pubkey (base)
 * @param programId - The router program ID (owner)
 * @returns The derived account address
 */
export function createPortfolioAddress(
  user: PublicKey,
  programId: PublicKey
): PublicKey {
  const seed = 'portfolio';
  return PublicKey.createWithSeed(user, seed, programId);
}
