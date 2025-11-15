/**
 * Squads Multisig Integration
 *
 * Utilities for working with Squads Protocol multisigs.
 * Allows governance to be controlled by M-of-N multisig instead of single wallet.
 *
 * Squads Protocol: https://squads.so/
 * SDK Docs: https://github.com/Squads-Protocol/v4
 */

import { Connection, PublicKey } from '@solana/web3.js';
import * as multisig from '@sqds/multisig';

/**
 * Check if a public key is a Squads multisig account
 */
export async function isSquadsMultisig(
  connection: Connection,
  address: PublicKey
): Promise<boolean> {
  try {
    const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
      connection,
      address
    );
    return multisigAccount !== null;
  } catch (error) {
    // Not a multisig account
    return false;
  }
}

/**
 * Check if a wallet is a member of a Squads multisig
 */
export async function isMultisigMember(
  connection: Connection,
  multisigAddress: PublicKey,
  walletAddress: PublicKey
): Promise<boolean> {
  try {
    const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
      connection,
      multisigAddress
    );

    // Check if wallet is in the members list
    return multisigAccount.members.some(member =>
      member.key.equals(walletAddress)
    );
  } catch (error) {
    console.error('Error checking multisig membership:', error);
    return false;
  }
}

/**
 * Get multisig account details
 */
export async function getMultisigInfo(
  connection: Connection,
  multisigAddress: PublicKey
) {
  try {
    const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
      connection,
      multisigAddress
    );

    return {
      address: multisigAddress,
      threshold: multisigAccount.threshold,
      members: multisigAccount.members.map(member => ({
        key: member.key,
        permissions: member.permissions,
      })),
      transactionIndex: multisigAccount.transactionIndex,
      rentCollector: multisigAccount.rentCollector,
    };
  } catch (error) {
    console.error('Error fetching multisig info:', error);
    return null;
  }
}

/**
 * Check if a wallet has permission to perform an action
 *
 * This checks:
 * 1. Direct match (wallet == governance address)
 * 2. Multisig member (wallet is member of governance multisig)
 */
export async function hasGovernancePermission(
  connection: Connection,
  governanceAddress: PublicKey,
  walletAddress: PublicKey
): Promise<boolean> {
  // Check 1: Direct match (single wallet governance)
  if (walletAddress.equals(governanceAddress)) {
    return true;
  }

  // Check 2: Wallet is member of governance multisig
  const isMultisig = await isSquadsMultisig(connection, governanceAddress);
  if (isMultisig) {
    return await isMultisigMember(connection, governanceAddress, walletAddress);
  }

  return false;
}

/**
 * Get pending proposals for a multisig that require approval
 */
export async function getPendingProposals(
  connection: Connection,
  multisigAddress: PublicKey,
  walletAddress: PublicKey
) {
  try {
    const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
      connection,
      multisigAddress
    );

    // Get all proposals
    const proposals = await multisig.accounts.Proposal.gpaBuilder()
      .addFilter('multisig', multisigAddress)
      .run(connection);

    // Filter to pending proposals where wallet hasn't approved yet
    const pending = [];
    for (const proposalAccount of proposals) {
      const proposal = proposalAccount.account;

      // Check if proposal is still active
      if (proposal.status.__kind === 'Active') {
        // Check if wallet hasn't approved yet
        const hasApproved = proposal.approved.some(approval =>
          approval.equals(walletAddress)
        );

        if (!hasApproved) {
          pending.push({
            address: proposalAccount.pubkey,
            transactionIndex: proposal.transactionIndex,
            approved: proposal.approved.length,
            required: multisigAccount.threshold,
          });
        }
      }
    }

    return pending;
  } catch (error) {
    console.error('Error fetching pending proposals:', error);
    return [];
  }
}

/**
 * Create a multisig proposal for a transaction
 *
 * Note: This creates a proposal that team members can approve in the Squads UI
 * or via SDK. The transaction won't execute until threshold signatures are met.
 */
export async function createMultisigProposal(
  connection: Connection,
  multisigAddress: PublicKey,
  creator: PublicKey,
  transactionMessage: any,
  memo?: string
) {
  // This is a placeholder - actual implementation would use Squads SDK
  // to create a proposal. For now, we'll document the flow.

  throw new Error(
    'Creating proposals programmatically not yet implemented. ' +
    'Please use the Squads UI at https://squads.so/ to create proposals.'
  );
}

/**
 * Types for better TypeScript support
 */
export interface MultisigMember {
  key: PublicKey;
  permissions: {
    mask: number;
  };
}

export interface MultisigInfo {
  address: PublicKey;
  threshold: number;
  members: MultisigMember[];
  transactionIndex: bigint;
  rentCollector: PublicKey | null;
}

export interface PendingProposal {
  address: PublicKey;
  transactionIndex: bigint;
  approved: number;
  required: number;
}
