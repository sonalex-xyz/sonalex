'use client';

import dynamic from 'next/dynamic';

/**
 * Wallet button that only renders on client side to avoid hydration errors
 */
export const WalletButton = dynamic(
  async () => {
    const { WalletMultiButton } = await import('@solana/wallet-adapter-react-ui');
    return WalletMultiButton;
  },
  {
    ssr: false,
    loading: () => (
      <button className="wallet-adapter-button wallet-adapter-button-trigger" disabled>
        Loading...
      </button>
    ),
  }
);
