/**
 * TypeScript types matching Percolator Rust structs
 */

import { PublicKey } from '@solana/web3.js';

// ============================================================================
// Enums (matching Rust repr(u8) enums)
// ============================================================================

/** Order side */
export enum Side {
  Buy = 0,
  Sell = 1,
}

/** Time in force for orders */
export enum TimeInForce {
  /** Good till cancel */
  GTC = 0,
  /** Immediate or cancel */
  IOC = 1,
  /** Fill or kill */
  FOK = 2,
}

/** Maker class for order priority */
export enum MakerClass {
  /** Regular - goes to pending queue */
  REG = 0,
  /** Designated LP - posts immediately */
  DLP = 1,
}

/** Order state in the book */
export enum OrderState {
  /** Active in book */
  LIVE = 0,
  /** Waiting for promotion */
  PENDING = 1,
}

// ============================================================================
// Account Structures
// ============================================================================

/**
 * Account state for tracking within slab
 * Matches: common/types.rs::AccountState
 */
export interface AccountState {
  /** Account pubkey */
  key: PublicKey;
  /** Local cash balance (signed, i128) */
  cash: bigint;
  /** Initial margin requirement (u128) */
  im: bigint;
  /** Maintenance margin requirement (u128) */
  mm: bigint;
  /** Head of position linked list */
  positionHead: number;
  /** Account index */
  index: number;
  /** Account active flag */
  active: boolean;
}

/**
 * Instrument definition
 * Matches: common/types.rs::Instrument
 */
export interface Instrument {
  /** Instrument symbol (8 bytes, e.g., "BTC-PERP") */
  symbol: string;
  /** Contract size (e.g., 0.001 BTC) */
  contractSize: bigint;
  /** Tick size (minimum price increment) */
  tick: bigint;
  /** Lot size (minimum quantity increment) */
  lot: bigint;
  /** Current index price (from oracle) */
  indexPrice: bigint;
  /** Current funding rate (basis points per hour) */
  fundingRate: bigint;
  /** Cumulative funding */
  cumFunding: bigint;
  /** Last funding timestamp */
  lastFundingTs: bigint;
  /** Bids book head */
  bidsHead: number;
  /** Asks book head */
  asksHead: number;
  /** Pending bids head */
  bidsPendingHead: number;
  /** Pending asks head */
  asksPendingHead: number;
  /** Current epoch */
  epoch: number;
  /** Instrument index */
  index: number;
  /** Batch open timestamp */
  batchOpenMs: bigint;
  /** Freeze until timestamp */
  freezeUntilMs: bigint;
}

/**
 * Order in the book
 * Matches: common/types.rs::Order
 */
export interface Order {
  /** Order ID (monotonic) */
  orderId: bigint;
  /** Account index */
  accountIdx: number;
  /** Instrument index */
  instrumentIdx: number;
  /** Order side */
  side: Side;
  /** Time in force */
  tif: TimeInForce;
  /** Maker class */
  makerClass: MakerClass;
  /** Order state */
  state: OrderState;
  /** Eligible epoch for promotion */
  eligibleEpoch: number;
  /** Creation timestamp */
  createdMs: bigint;
  /** Price */
  price: bigint;
  /** Quantity */
  qty: bigint;
  /** Reserved quantity (locked for reservations) */
  reservedQty: bigint;
  /** Original quantity */
  qtyOrig: bigint;
  /** Next order in book */
  next: number;
  /** Previous order in book */
  prev: number;
  /** Next in freelist */
  nextFree: number;
  /** Used flag */
  used: boolean;
}

/**
 * Position
 * Matches: common/types.rs::Position
 */
export interface Position {
  /** Account index */
  accountIdx: number;
  /** Instrument index */
  instrumentIdx: number;
  /** Position quantity (signed: positive = long, negative = short) */
  qty: bigint;
  /** Entry VWAP price */
  entryPx: bigint;
  /** Last funding snapshot */
  lastFunding: bigint;
  /** Next position for this account */
  nextInAccount: number;
  /** Position index in pool */
  index: number;
  /** Used flag */
  used: boolean;
}

/**
 * Slice in a reservation
 * Matches: common/types.rs::Slice
 */
export interface Slice {
  /** Order index being reserved */
  orderIdx: number;
  /** Quantity reserved from this order */
  qty: bigint;
  /** Next slice in reservation */
  next: number;
  /** Slice index */
  index: number;
  /** Used flag */
  used: boolean;
}

/**
 * Reservation hold
 * Matches: common/types.rs::Reservation
 */
export interface Reservation {
  /** Unique hold ID */
  holdId: bigint;
  /** Route ID from router */
  routeId: bigint;
  /** Account index */
  accountIdx: number;
  /** Instrument index */
  instrumentIdx: number;
  /** Side */
  side: Side;
  /** Quantity to fill */
  qty: bigint;
  /** VWAP price of reserved slices */
  vwapPx: bigint;
  /** Worst price in reservation */
  worstPx: bigint;
  /** Maximum charge (fees + notional) */
  maxCharge: bigint;
  /** Commitment hash for commit-reveal */
  commitmentHash: Uint8Array;
  /** Salt for commitment */
  salt: Uint8Array;
  /** Book sequence number at hold time */
  bookSeqno: bigint;
  /** Expiry timestamp */
  expiryMs: bigint;
  /** Head of slice linked list */
  sliceHead: number;
  /** Reservation index */
  index: number;
  /** Used flag */
  used: boolean;
  /** Committed flag */
  committed: boolean;
}

/**
 * Trade record in ring buffer
 * Matches: common/types.rs::Trade
 */
export interface Trade {
  /** Timestamp */
  ts: bigint;
  /** Maker order ID */
  orderIdMaker: bigint;
  /** Taker order ID / route ID */
  orderIdTaker: bigint;
  /** Instrument index */
  instrumentIdx: number;
  /** Side (from taker perspective) */
  side: Side;
  /** Price */
  price: bigint;
  /** Quantity */
  qty: bigint;
  /** Optional hash for delayed reveal */
  hash: Uint8Array;
  /** Reveal timestamp */
  revealMs: bigint;
}

/**
 * Aggressor ledger entry for anti-sandwich
 * Matches: common/types.rs::AggressorEntry
 */
export interface AggressorEntry {
  /** Account index */
  accountIdx: number;
  /** Instrument index */
  instrumentIdx: number;
  /** Current epoch */
  epoch: number;
  /** Buy quantity this batch */
  buyQty: bigint;
  /** Buy notional this batch */
  buyNotional: bigint;
  /** Sell quantity this batch */
  sellQty: bigint;
  /** Sell notional this batch */
  sellNotional: bigint;
  /** Used flag */
  used: boolean;
}

// ============================================================================
// Portfolio and Router Types (to be extracted from router state)
// ============================================================================

/**
 * Portfolio account state
 * TODO: Extract full structure from router/src/state
 */
export interface Portfolio {
  /** Owner pubkey */
  owner: PublicKey;
  /** Total equity (collateral + unrealized PnL) */
  equity: bigint;
  /** Margin used across all positions */
  marginUsed: bigint;
  /** Available balance for trading */
  availableBalance: bigint;
  /** Unrealized PnL */
  unrealizedPnl: bigint;
  /** Realized PnL */
  realizedPnl: bigint;
  /** Total deposits */
  totalDeposits: bigint;
  /** Total withdrawals */
  totalWithdrawals: bigint;
  /** Number of open positions */
  positionCount: number;
  /** Bump seed for PDA derivation */
  bump: number;
}

/**
 * Vault account state
 * Stores collateral for a specific mint
 */
export interface Vault {
  /** Mint pubkey */
  mint: PublicKey;
  /** Total collateral balance */
  balance: bigint;
  /** Authority pubkey */
  authority: PublicKey;
  /** Bump seed */
  bump: number;
}

/**
 * LP Seat state
 * Tracks liquidity provision for router × matcher × portfolio × context
 */
export interface LpSeat {
  /** Router program ID */
  routerId: PublicKey;
  /** Matcher state account */
  matcherState: PublicKey;
  /** Portfolio providing liquidity */
  portfolio: PublicKey;
  /** Context ID for multiple seats */
  contextId: number;
  /** Collateral locked in this seat */
  collateralLocked: bigint;
  /** Bump seed */
  bump: number;
}

/**
 * Venue PnL state
 * Aggregate PnL metrics for a venue (matcher)
 */
export interface VenuePnl {
  /** Router program ID */
  routerId: PublicKey;
  /** Matcher state account */
  matcherState: PublicKey;
  /** Total fees earned */
  feesEarned: bigint;
  /** Venue fees */
  venueFees: bigint;
  /** Realized PnL */
  realizedPnl: bigint;
  /** Bump seed */
  bump: number;
}

// ============================================================================
// Oracle Types
// ============================================================================

/**
 * Price Oracle state
 * Matches: oracle/state.rs::PriceOracle
 */
export interface PriceOracle {
  /** Magic bytes for validation */
  magic: bigint;
  /** Version */
  version: number;
  /** Bump seed for PDA */
  bump: number;
  /** Authority that can update prices */
  authority: PublicKey;
  /** Instrument this oracle is for */
  instrument: PublicKey;
  /** Current price (scaled by 1_000_000) */
  price: bigint;
  /** Last update timestamp (Unix timestamp) */
  timestamp: bigint;
  /** Price confidence interval (scaled by 1_000_000) */
  confidence: bigint;
}

/**
 * Oracle status for monitoring
 */
export interface OracleStatus {
  /** Oracle account address */
  address: PublicKey;
  /** Instrument name/symbol */
  instrument: string;
  /** Oracle data */
  data: PriceOracle;
  /** Age in seconds since last update */
  age: number;
  /** Is oracle stale (exceeds max staleness) */
  isStale: boolean;
  /** Status classification */
  status: 'healthy' | 'warning' | 'stale' | 'error';
}

// ============================================================================
// Instruction Parameters
// ============================================================================

/** Parameters for deposit instruction */
export interface DepositParams {
  /** Amount to deposit (in lamports or token base units) */
  amount: bigint;
  /** Mint of the token being deposited */
  mint: PublicKey;
}

/** Parameters for withdraw instruction */
export interface WithdrawParams {
  /** Amount to withdraw (in lamports or token base units) */
  amount: bigint;
  /** Mint of the token being withdrawn */
  mint: PublicKey;
}

/** Parameters for placing an order */
export interface PlaceOrderParams {
  /** Instrument to trade */
  instrumentIdx: number;
  /** Order side */
  side: Side;
  /** Order size */
  size: bigint;
  /** Limit price (0 for market orders) */
  price: bigint;
  /** Time in force */
  timeInForce: TimeInForce;
  /** Maker class */
  makerClass?: MakerClass;
}

/** Parameters for adding liquidity */
export interface AddLiquidityParams {
  /** Amount to add */
  amount: bigint;
  /** Optional price range for concentrated liquidity */
  priceRange?: {
    lower: bigint;
    upper: bigint;
  };
}

/** Parameters for removing liquidity */
export interface RemoveLiquidityParams {
  /** Amount or percentage to remove */
  amount: bigint;
  /** Whether amount is a percentage (0-100) */
  isPercentage?: boolean;
}
