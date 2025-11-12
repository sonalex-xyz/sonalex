'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState, ReactNode } from 'react';

/**
 * Permission levels for admin dashboard
 */
export enum Permission {
  PUBLIC = 'public',           // Anyone (read-only)
  GOVERNANCE = 'governance',   // Full admin control
  INSURANCE = 'insurance',     // Insurance fund only
}

interface PermissionGuardProps {
  requiredPermission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Permission Guard Component
 *
 * Controls access to admin features based on wallet authority.
 * On-chain validation is the real security - this is UI convenience.
 */
export function PermissionGuard({
  requiredPermission,
  children,
  fallback,
}: PermissionGuardProps) {
  const wallet = useWallet();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      setLoading(true);

      // Public permission - always allowed
      if (requiredPermission === Permission.PUBLIC) {
        setHasPermission(true);
        setLoading(false);
        return;
      }

      // Require wallet connection for non-public
      if (!wallet.publicKey) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        // TODO: Fetch registry from blockchain to check authorities
        // For now, use environment variables (replace with actual on-chain check)
        const governanceWallet = process.env.NEXT_PUBLIC_GOVERNANCE_WALLET
          ? new PublicKey(process.env.NEXT_PUBLIC_GOVERNANCE_WALLET)
          : null;

        const insuranceAuthority = process.env.NEXT_PUBLIC_INSURANCE_AUTHORITY
          ? new PublicKey(process.env.NEXT_PUBLIC_INSURANCE_AUTHORITY)
          : null;

        if (requiredPermission === Permission.GOVERNANCE) {
          setHasPermission(
            governanceWallet !== null &&
            wallet.publicKey.equals(governanceWallet)
          );
        } else if (requiredPermission === Permission.INSURANCE) {
          setHasPermission(
            insuranceAuthority !== null &&
            wallet.publicKey.equals(insuranceAuthority)
          );
        }
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      }

      setLoading(false);
    }

    checkPermission();
  }, [wallet.publicKey, requiredPermission]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-yellow-400 text-xl">🔒</span>
          <div>
            <p className="text-yellow-400 font-semibold">Access Restricted</p>
            <p className="text-yellow-300 text-sm mt-1">
              {!wallet.connected && 'Connect your wallet to access this feature.'}
              {wallet.connected && requiredPermission === Permission.GOVERNANCE && (
                'Governance authority required. Your wallet is not authorized.'
              )}
              {wallet.connected && requiredPermission === Permission.INSURANCE && (
                'Insurance authority required. Your wallet is not authorized.'
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook to check user permissions
 */
export function usePermissions() {
  const wallet = useWallet();
  const [permissions, setPermissions] = useState({
    isGovernance: false,
    isInsuranceAuth: false,
    loading: true,
  });

  useEffect(() => {
    async function checkPermissions() {
      if (!wallet.publicKey) {
        setPermissions({
          isGovernance: false,
          isInsuranceAuth: false,
          loading: false,
        });
        return;
      }

      try {
        // TODO: Fetch from blockchain
        const governanceWallet = process.env.NEXT_PUBLIC_GOVERNANCE_WALLET
          ? new PublicKey(process.env.NEXT_PUBLIC_GOVERNANCE_WALLET)
          : null;

        const insuranceAuthority = process.env.NEXT_PUBLIC_INSURANCE_AUTHORITY
          ? new PublicKey(process.env.NEXT_PUBLIC_INSURANCE_AUTHORITY)
          : null;

        setPermissions({
          isGovernance: governanceWallet !== null && wallet.publicKey.equals(governanceWallet),
          isInsuranceAuth: insuranceAuthority !== null && wallet.publicKey.equals(insuranceAuthority),
          loading: false,
        });
      } catch (error) {
        console.error('Error checking permissions:', error);
        setPermissions({
          isGovernance: false,
          isInsuranceAuth: false,
          loading: false,
        });
      }
    }

    checkPermissions();
  }, [wallet.publicKey]);

  return permissions;
}

/**
 * Authority Badge Component
 *
 * Displays the user's authority level
 */
export function AuthorityBadge() {
  const { isGovernance, isInsuranceAuth, loading } = usePermissions();

  if (loading) return null;

  if (isGovernance) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full">
        <span className="text-purple-400 text-sm">👑</span>
        <span className="text-purple-400 text-sm font-semibold">Governance</span>
      </div>
    );
  }

  if (isInsuranceAuth) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full">
        <span className="text-blue-400 text-sm">🛡️</span>
        <span className="text-blue-400 text-sm font-semibold">Insurance Authority</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-500/20 border border-gray-500/50 rounded-full">
      <span className="text-gray-400 text-sm">👁️</span>
      <span className="text-gray-400 text-sm font-semibold">View Only</span>
    </div>
  );
}
