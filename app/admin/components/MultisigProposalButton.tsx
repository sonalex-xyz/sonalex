'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, clusterApiUrl } from '@solana/web3.js';
import { isSquadsMultisig, getMultisigInfo } from '@/lib/multisig';
import { ConfirmationModal } from './ConfirmationModal';

interface MultisigProposalButtonProps {
  governanceAddress: string;
  buildTransaction: () => Promise<Transaction>;
  actionName: string;
  actionDescription: string;
  danger?: boolean;
  requireTyping?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Smart button that handles both single wallet and multisig governance
 *
 * - If governance is a single wallet: Executes transaction directly
 * - If governance is a multisig: Shows instructions to create proposal in Squads UI
 *
 * This component automatically detects which mode to use.
 */
export function MultisigProposalButton({
  governanceAddress,
  buildTransaction,
  actionName,
  actionDescription,
  danger = false,
  requireTyping,
  className,
  children,
}: MultisigProposalButtonProps) {
  const wallet = useWallet();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isMultisig, setIsMultisig] = useState<boolean | null>(null);
  const [showSquadsInstructions, setShowSquadsInstructions] = useState(false);
  const [proposalInstructions, setProposalInstructions] = useState<string>('');

  const handleClick = async () => {
    if (!wallet.publicKey) {
      alert('Please connect your wallet');
      return;
    }

    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl('devnet'),
        'confirmed'
      );

      const govPubkey = new PublicKey(governanceAddress);

      // Check if governance is a multisig
      const isMultisigAccount = await isSquadsMultisig(connection, govPubkey);
      setIsMultisig(isMultisigAccount);

      if (isMultisigAccount) {
        // Multisig mode - show instructions
        await handleMultisigFlow(connection, govPubkey);
      } else {
        // Single wallet mode - show confirmation modal
        setShowConfirmation(true);
      }
    } catch (error) {
      console.error('Error handling action:', error);
      alert('Error: ' + (error as Error).message);
    }
  };

  const handleMultisigFlow = async (connection: Connection, multisigPubkey: PublicKey) => {
    // Get multisig info
    const multisigInfo = await getMultisigInfo(connection, multisigPubkey);

    if (!multisigInfo) {
      alert('Error: Could not fetch multisig information');
      return;
    }

    // Build the transaction
    const tx = await buildTransaction();

    // Serialize transaction for display
    const serializedTx = tx.serialize({ requireAllSignatures: false }).toString('base64');

    // Generate instructions
    const instructions = `
# Create Squads Proposal: ${actionName}

This action requires multisig approval (${multisigInfo.threshold} of ${multisigInfo.members.length} signatures).

## Option 1: Use Squads UI (Recommended)

1. Go to https://v4.squads.so/
2. Connect your wallet
3. Select your multisig: ${multisigPubkey.toBase58()}
4. Click "New Transaction"
5. Choose "Custom Transaction"
6. Paste this serialized transaction:

\`\`\`
${serializedTx}
\`\`\`

7. Add memo: "${actionDescription}"
8. Submit proposal
9. Share with team members for approval

## Option 2: Export Transaction

Copy this transaction and share with your team:

\`\`\`json
{
  "transaction": "${serializedTx}",
  "memo": "${actionDescription}",
  "multisig": "${multisigPubkey.toBase58()}"
}
\`\`\`

## Multisig Details

- Address: ${multisigPubkey.toBase58()}
- Threshold: ${multisigInfo.threshold} of ${multisigInfo.members.length}
- Members: ${multisigInfo.members.map(m => m.key.toBase58()).join(', ')}
    `;

    setProposalInstructions(instructions);
    setShowSquadsInstructions(true);
  };

  const handleConfirm = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      alert('Wallet not connected');
      return;
    }

    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl('devnet'),
        'confirmed'
      );

      // Build and send transaction
      const tx = await buildTransaction();
      const signed = await wallet.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      alert(`Success! Transaction: ${signature}`);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed: ' + (error as Error).message);
      throw error;
    }
  };

  return (
    <>
      <button onClick={handleClick} className={className}>
        {children}
      </button>

      {/* Single wallet confirmation modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirm}
        title={actionName}
        message={actionDescription}
        danger={danger}
        requireTyping={requireTyping}
      />

      {/* Multisig instructions modal */}
      {showSquadsInstructions && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white">
                🔐 Multisig Approval Required
              </h3>
            </div>

            <div className="px-6 py-4">
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-4">
                <p className="text-blue-400 text-sm">
                  ℹ️ This action requires approval from {proposalInstructions.match(/Threshold: (\d+)/)?.[1]} team members.
                  Follow the instructions below to create a proposal in Squads.
                </p>
              </div>

              <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-gray-300 text-sm overflow-x-auto whitespace-pre-wrap">
                {proposalInstructions}
              </pre>
            </div>

            <div className="px-6 py-4 border-t border-gray-700">
              <button
                onClick={() => setShowSquadsInstructions(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
