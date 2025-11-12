/**
 * Constants for Percolator Protocol
 */

import { PublicKey } from '@solana/web3.js';

// ============================================================================
// Program IDs (Update these with your deployed program addresses)
// ============================================================================

export const ROUTER_PROGRAM_ID = new PublicKey('11111111111111111111111111111111'); // TODO: Update after deployment
export const SLAB_PROGRAM_ID = new PublicKey('11111111111111111111111111111111'); // TODO: Update after deployment
export const AMM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111'); // TODO: Update after deployment

// ============================================================================
// Instruction Discriminators (from Router program)
// ============================================================================

export enum RouterInstruction {
  Initialize = 0,
  InitializePortfolio = 1,
  InitializeVault = 2,
  Deposit = 3,
  Withdraw = 4,
  ExecuteCrossSlab = 5,
  LiquidateUser = 6,
  BurnLpShares = 7,
  CancelLpOrders = 8,
  RouterReserve = 9,
  RouterRelease = 10,
  RouterLiquidity = 11,
  TopUpInsurance = 12,
  WithdrawInsurance = 13,
  GlobalHaircut = 14,
  UpdateRiskParams = 15,
}

// ============================================================================
// Instruction Discriminators (from Slab program)
// ============================================================================

export enum SlabInstruction {
  Initialize = 0,
  CommitFill = 1,
  AdapterLiquidity = 2, // Production LP path
  UpdateFunding = 3,
  HaltTrading = 4,
  ResumeTrading = 5,
}

// ============================================================================
// PDA Seeds
// ============================================================================

export const VAULT_SEED = Buffer.from('vault');
export const ESCROW_SEED = Buffer.from('escrow');
export const CAP_SEED = Buffer.from('cap');
export const PORTFOLIO_SEED = Buffer.from('portfolio');
export const REGISTRY_SEED = Buffer.from('registry');
export const AUTHORITY_SEED = Buffer.from('authority');
export const ROUTER_SIGNER_SEED = Buffer.from('router_signer');
export const INSURANCE_VAULT_SEED = Buffer.from('insurance_vault');
export const LP_SEAT_SEED = Buffer.from('lp_seat');
export const VENUE_PNL_SEED = Buffer.from('venue_pnl');

// ============================================================================
// Limits and Constants (from common/types.rs)
// ============================================================================

export const MAX_SLABS = 256;
export const MAX_INSTRUMENTS = 32;
export const MAX_ACCOUNTS = 5_000;
export const MAX_ORDERS = 30_000;
export const MAX_POSITIONS = 30_000;
export const MAX_RESERVATIONS = 4_000;
export const MAX_SLICES = 16_000;
export const MAX_TRADES = 10_000;
export const MAX_DLP = 100;
export const MAX_AGGRESSOR_ENTRIES = 4_000;

/** Maximum TTL for capabilities: 2 minutes in milliseconds */
export const MAX_CAP_TTL_MS = 120_000;

/** Maximum slab size: 10 MB */
export const MAX_SLAB_SIZE = 10 * 1024 * 1024;

// ============================================================================
// Math Constants
// ============================================================================

/** Scale factor for crisis module (Q64.64 fixed-point) */
export const CRISIS_SCALE = 1_000_000n;

/** Basis points denominator */
export const BASIS_POINTS = 10_000;
