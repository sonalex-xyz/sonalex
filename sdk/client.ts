/**
 * High-level Percolator Protocol Client
 *
 * Provides a convenient interface for interacting with Percolator programs
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Signer,
  sendAndConfirmTransaction,
  Commitment,
} from '@solana/web3.js';
import {
  createInitializePortfolioInstructions,
  createDepositInstruction,
  createWithdrawInstruction,
  createExecuteCrossSlabInstruction,
  createRouterReserveInstruction,
  createRouterReleaseInstruction,
  createLiquidateUserInstruction,
} from './instructions/router';
import { createPortfolioAddress } from './pda';
import type {
  DepositParams,
  WithdrawParams,
  PlaceOrderParams,
  AddLiquidityParams,
  RemoveLiquidityParams,
  Portfolio,
} from './types';

/**
 * Configuration for PercolatorClient
 */
export interface PercolatorClientConfig {
  /** Solana RPC connection */
  connection: Connection;
  /** Router program ID */
  routerProgramId: PublicKey;
  /** Slab program ID (optional, for order book trading) */
  slabProgramId?: PublicKey;
  /** AMM program ID (optional, for AMM trading) */
  ammProgramId?: PublicKey;
  /** Oracle program ID (optional, for price feeds) */
  oracleProgramId?: PublicKey;
  /** Default commitment level */
  commitment?: Commitment;
}

/**
 * High-level client for Percolator Protocol
 *
 * @example
 * ```typescript
 * const client = new PercolatorClient({
 *   connection: new Connection('https://api.devnet.solana.com'),
 *   routerProgramId: new PublicKey('...'),
 * });
 *
 * // Initialize portfolio
 * await client.initializePortfolio(wallet);
 *
 * // Deposit collateral
 * await client.deposit(wallet, { amount: 1000000000n, mint: NATIVE_MINT });
 *
 * // Place order
 * await client.placeOrder(wallet, slabPubkey, oraclePubkey, {
 *   instrumentIdx: 0,
 *   side: Side.Buy,
 *   size: 1000000n,
 *   price: 50000000000n,
 *   timeInForce: TimeInForce.GTC,
 * });
 * ```
 */
export class PercolatorClient {
  readonly connection: Connection;
  readonly routerProgramId: PublicKey;
  readonly slabProgramId?: PublicKey;
  readonly ammProgramId?: PublicKey;
  readonly oracleProgramId?: PublicKey;
  readonly commitment: Commitment;

  constructor(config: PercolatorClientConfig) {
    this.connection = config.connection;
    this.routerProgramId = config.routerProgramId;
    this.slabProgramId = config.slabProgramId;
    this.ammProgramId = config.ammProgramId;
    this.oracleProgramId = config.oracleProgramId;
    this.commitment = config.commitment || 'confirmed';
  }

  // ============================================================================
  // Portfolio Management
  // ============================================================================

  /**
   * Get the portfolio address for a user
   *
   * @param user - User's public key
   * @returns Portfolio address
   */
  getPortfolioAddress(user: PublicKey): PublicKey {
    return createPortfolioAddress(user, this.routerProgramId);
  }

  /**
   * Check if a portfolio exists for a user
   *
   * @param user - User's public key
   * @returns True if portfolio exists
   */
  async portfolioExists(user: PublicKey): Promise<boolean> {
    const portfolioAddress = this.getPortfolioAddress(user);
    const accountInfo = await this.connection.getAccountInfo(
      portfolioAddress,
      this.commitment
    );
    return accountInfo !== null && accountInfo.owner.equals(this.routerProgramId);
  }

  /**
   * Initialize a new portfolio for a user
   *
   * @param signer - User's wallet signer
   * @returns Transaction signature
   */
  async initializePortfolio(signer: Signer): Promise<string> {
    const user = signer.publicKey;

    // Check if portfolio already exists
    if (await this.portfolioExists(user)) {
      throw new Error('Portfolio already exists for this user');
    }

    // Get portfolio size and rent
    // TODO: Get actual portfolio size from program
    const portfolioSize = 135_000; // ~135KB based on router implementation
    const rentLamports = await this.connection.getMinimumBalanceForRentExemption(
      portfolioSize,
      this.commitment
    );

    const instructions = createInitializePortfolioInstructions(
      user,
      this.routerProgramId,
      portfolioSize,
      rentLamports
    );

    const transaction = new Transaction().add(...instructions);
    return await this.sendAndConfirmTransaction(transaction, [signer]);
  }

  /**
   * Fetch portfolio data for a user
   *
   * @param user - User's public key
   * @returns Portfolio data
   */
  async getPortfolio(user: PublicKey): Promise<Portfolio | null> {
    const portfolioAddress = this.getPortfolioAddress(user);
    const accountInfo = await this.connection.getAccountInfo(
      portfolioAddress,
      this.commitment
    );

    if (!accountInfo || !accountInfo.owner.equals(this.routerProgramId)) {
      return null;
    }

    // TODO: Deserialize portfolio data from account
    // For now, return placeholder data
    return {
      owner: user,
      equity: 0n,
      marginUsed: 0n,
      availableBalance: 0n,
      unrealizedPnl: 0n,
      realizedPnl: 0n,
      totalDeposits: 0n,
      totalWithdrawals: 0n,
      positionCount: 0,
      bump: 0,
    };
  }

  // ============================================================================
  // Collateral Management
  // ============================================================================

  /**
   * Deposit collateral into portfolio
   *
   * @param signer - User's wallet signer
   * @param params - Deposit parameters
   * @returns Transaction signature
   */
  async deposit(signer: Signer, params: DepositParams): Promise<string> {
    const user = signer.publicKey;

    // Check if portfolio exists
    if (!(await this.portfolioExists(user))) {
      throw new Error('Portfolio does not exist. Initialize portfolio first.');
    }

    const instruction = createDepositInstruction(user, params, this.routerProgramId);
    const transaction = new Transaction().add(instruction);

    return await this.sendAndConfirmTransaction(transaction, [signer]);
  }

  /**
   * Withdraw collateral from portfolio
   *
   * @param signer - User's wallet signer
   * @param params - Withdraw parameters
   * @returns Transaction signature
   */
  async withdraw(signer: Signer, params: WithdrawParams): Promise<string> {
    const user = signer.publicKey;

    // Check if portfolio exists
    if (!(await this.portfolioExists(user))) {
      throw new Error('Portfolio does not exist.');
    }

    const instruction = createWithdrawInstruction(user, params, this.routerProgramId);
    const transaction = new Transaction().add(instruction);

    return await this.sendAndConfirmTransaction(transaction, [signer]);
  }

  // ============================================================================
  // Trading
  // ============================================================================

  /**
   * Place an order on a slab (order book)
   *
   * @param signer - User's wallet signer
   * @param slabPubkey - Slab account to trade on
   * @param oraclePubkey - Oracle account for price feed
   * @param params - Order parameters
   * @returns Transaction signature
   */
  async placeOrder(
    signer: Signer,
    slabPubkey: PublicKey,
    oraclePubkey: PublicKey,
    params: PlaceOrderParams
  ): Promise<string> {
    const user = signer.publicKey;

    // Check if portfolio exists
    if (!(await this.portfolioExists(user))) {
      throw new Error('Portfolio does not exist. Initialize portfolio first.');
    }

    const instruction = createExecuteCrossSlabInstruction(
      user,
      slabPubkey,
      oraclePubkey,
      params,
      this.routerProgramId
    );

    const transaction = new Transaction().add(instruction);
    return await this.sendAndConfirmTransaction(transaction, [signer]);
  }

  // ============================================================================
  // Liquidity Provision
  // ============================================================================

  /**
   * Add liquidity to a matcher (slab or AMM)
   *
   * @param signer - User's wallet signer
   * @param matcherState - Matcher state account
   * @param params - Liquidity parameters
   * @param contextId - Context ID for multiple LP positions
   * @returns Transaction signature
   */
  async addLiquidity(
    signer: Signer,
    matcherState: PublicKey,
    params: AddLiquidityParams,
    contextId: number = 0
  ): Promise<string> {
    const user = signer.publicKey;

    // Check if portfolio exists
    if (!(await this.portfolioExists(user))) {
      throw new Error('Portfolio does not exist. Initialize portfolio first.');
    }

    // Reserve liquidity
    const reserveIx = createRouterReserveInstruction(
      user,
      matcherState,
      params.amount,
      contextId,
      this.routerProgramId
    );

    // TODO: Add RouterLiquidity instruction for actual LP placement
    // This requires matcher-specific logic (ObAdd for slab, AmmAdd for AMM)

    const transaction = new Transaction().add(reserveIx);
    return await this.sendAndConfirmTransaction(transaction, [signer]);
  }

  /**
   * Remove liquidity from a matcher
   *
   * @param signer - User's wallet signer
   * @param matcherState - Matcher state account
   * @param params - Removal parameters
   * @param contextId - Context ID for the LP position
   * @returns Transaction signature
   */
  async removeLiquidity(
    signer: Signer,
    matcherState: PublicKey,
    params: RemoveLiquidityParams,
    contextId: number = 0
  ): Promise<string> {
    const user = signer.publicKey;

    // TODO: Add CancelLpOrders or BurnLpShares instruction

    // Release liquidity
    const releaseIx = createRouterReleaseInstruction(
      user,
      matcherState,
      contextId,
      this.routerProgramId
    );

    const transaction = new Transaction().add(releaseIx);
    return await this.sendAndConfirmTransaction(transaction, [signer]);
  }

  // ============================================================================
  // Liquidations
  // ============================================================================

  /**
   * Liquidate an underwater user
   *
   * @param liquidator - Liquidator's wallet signer
   * @param targetUser - User to liquidate
   * @returns Transaction signature
   */
  async liquidateUser(liquidator: Signer, targetUser: PublicKey): Promise<string> {
    const instruction = createLiquidateUserInstruction(
      liquidator.publicKey,
      targetUser,
      this.routerProgramId
    );

    const transaction = new Transaction().add(instruction);
    return await this.sendAndConfirmTransaction(transaction, [liquidator]);
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Send and confirm a transaction
   *
   * @param transaction - Transaction to send
   * @param signers - Transaction signers
   * @returns Transaction signature
   */
  private async sendAndConfirmTransaction(
    transaction: Transaction,
    signers: Signer[]
  ): Promise<string> {
    return await sendAndConfirmTransaction(
      this.connection,
      transaction,
      signers,
      { commitment: this.commitment }
    );
  }

  /**
   * Build a transaction without sending it
   *
   * @param instructions - Instructions to include
   * @returns Built transaction
   */
  async buildTransaction(
    instructions: TransactionInstruction[]
  ): Promise<Transaction> {
    const transaction = new Transaction().add(...instructions);
    const { blockhash } = await this.connection.getLatestBlockhash(this.commitment);
    transaction.recentBlockhash = blockhash;
    return transaction;
  }
}
