/**
 * Percolator Protocol SDK
 *
 * TypeScript SDK for interacting with the Percolator perpetual futures exchange
 * on Solana.
 *
 * @module @sonalex/percolator-sdk
 */

// ============================================================================
// Client
// ============================================================================

export { PercolatorClient } from './client';
export type { PercolatorClientConfig } from './client';

// ============================================================================
// Constants
// ============================================================================

export {
  ROUTER_PROGRAM_ID,
  SLAB_PROGRAM_ID,
  AMM_PROGRAM_ID,
  RouterInstruction,
  SlabInstruction,
  MAX_SLABS,
  MAX_INSTRUMENTS,
  MAX_ACCOUNTS,
  MAX_ORDERS,
  MAX_POSITIONS,
  MAX_CAP_TTL_MS,
  BASIS_POINTS,
  CRISIS_SCALE,
} from './constants';

// ============================================================================
// Types
// ============================================================================

export {
  Side,
  TimeInForce,
  MakerClass,
  OrderState,
} from './types';

export type {
  AccountState,
  Instrument,
  Order,
  Position,
  Slice,
  Reservation,
  Trade,
  AggressorEntry,
  Portfolio,
  Vault,
  LpSeat,
  VenuePnl,
  PriceOracle,
  OracleStatus,
  DepositParams,
  WithdrawParams,
  PlaceOrderParams,
  AddLiquidityParams,
  RemoveLiquidityParams,
} from './types';

// ============================================================================
// PDA Helpers
// ============================================================================

export {
  deriveAuthorityPda,
  deriveRouterSignerPda,
  deriveInsuranceVaultPda,
  deriveVaultPda,
  deriveEscrowPda,
  deriveCapPda,
  derivePortfolioPda,
  deriveRegistryPda,
  deriveLpSeatPda,
  deriveVenuePnlPda,
  createPortfolioAddress,
} from './pda';

export type { PdaResult } from './pda';

// ============================================================================
// Instruction Builders
// ============================================================================

export {
  createInitializePortfolioInstructions,
  createDepositInstruction,
  createWithdrawInstruction,
  createExecuteCrossSlabInstruction,
  createRouterReserveInstruction,
  createRouterReleaseInstruction,
  createLiquidateUserInstruction,
} from './instructions/router';

export {
  createInitializeOracleInstructions,
  createUpdatePriceInstruction,
  createBatchUpdatePriceInstructions,
  OracleInstruction,
  PRICE_ORACLE_SIZE,
} from './instructions/oracle';
