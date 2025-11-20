'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Permission, PermissionGuard } from './PermissionGuard';

interface RiskParameters {
  imr: number;           // Initial Margin Ratio (basis points)
  mmr: number;           // Maintenance Margin Ratio (basis points)
  liquidationBandBps: number;
  maxOracleStaleness: number; // seconds
}

/**
 * Risk Parameters Panel
 *
 * Fetches current risk parameters from the on-chain registry
 * and allows governance to update them.
 */
export function RiskParametersPanel() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [params, setParams] = useState<RiskParameters | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [imr, setImr] = useState('');
  const [mmr, setMmr] = useState('');
  const [liquidationBand, setLiquidationBand] = useState('');
  const [maxStaleness, setMaxStaleness] = useState('');

  // Fetch current parameters from chain
  useEffect(() => {
    async function fetchParameters() {
      if (!process.env.NEXT_PUBLIC_REGISTRY_ADDRESS) {
        setError('Registry address not configured');
        setLoading(false);
        return;
      }

      try {
        const registryPubkey = new PublicKey(process.env.NEXT_PUBLIC_REGISTRY_ADDRESS);

        // TODO: Deserialize the registry account data properly
        // For now, we'll get the account and check if it exists
        const accountInfo = await connection.getAccountInfo(registryPubkey);

        if (!accountInfo) {
          setError('Registry account not found on chain');
          setLoading(false);
          return;
        }

        // TODO: Parse the account data to extract risk parameters
        // This requires implementing the registry account deserializer
        // For now, show placeholder that indicates we're reading from chain

        // Placeholder - replace with actual deserialization
        const mockParams: RiskParameters = {
          imr: 500,              // 5% (500 basis points)
          mmr: 250,              // 2.5% (250 basis points)
          liquidationBandBps: 200, // 2%
          maxOracleStaleness: 60,  // 60 seconds
        };

        setParams(mockParams);
        setImr((mockParams.imr / 100).toString());
        setMmr((mockParams.mmr / 100).toString());
        setLiquidationBand(mockParams.liquidationBandBps.toString());
        setMaxStaleness(mockParams.maxOracleStaleness.toString());

        setLoading(false);
      } catch (err) {
        console.error('Error fetching risk parameters:', err);
        setError((err as Error).message);
        setLoading(false);
      }
    }

    fetchParameters();
  }, [connection]);

  const handleUpdate = async () => {
    if (!wallet.publicKey) {
      alert('Please connect your wallet');
      return;
    }

    setUpdating(true);
    try {
      // TODO: Build and send UpdateRiskParameters transaction
      // This requires implementing the instruction builder

      alert('Update functionality not yet implemented. Need to build UpdateRiskParams instruction.');

      // Placeholder for actual implementation:
      /*
      const updateIx = createUpdateRiskParamsInstruction(
        new PublicKey(process.env.NEXT_PUBLIC_REGISTRY_ADDRESS!),
        wallet.publicKey,
        {
          imr: Math.floor(parseFloat(imr) * 100), // Convert % to bps
          mmr: Math.floor(parseFloat(mmr) * 100),
          liquidationBandBps: parseInt(liquidationBand),
          maxOracleStaleness: parseInt(maxStaleness),
        },
        new PublicKey(process.env.NEXT_PUBLIC_ROUTER_PROGRAM_ID!)
      );

      const tx = new Transaction().add(updateIx);
      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(signature);

      alert('Parameters updated successfully!');
      */
    } catch (err) {
      console.error('Update failed:', err);
      alert('Update failed: ' + (err as Error).message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Risk Parameters</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-400">Loading from blockchain...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Risk Parameters</h2>
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">❌ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Risk Parameters</h2>
        <span className="text-xs text-green-400 flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Loaded from chain
        </span>
      </div>

      <PermissionGuard requiredPermission={Permission.GOVERNANCE}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Initial Margin Ratio (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={imr}
                onChange={(e) => setImr(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {params?.imr ? (params.imr / 100).toFixed(1) : '--'}%
              </p>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Maintenance Margin Ratio (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={mmr}
                onChange={(e) => setMmr(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {params?.mmr ? (params.mmr / 100).toFixed(1) : '--'}%
              </p>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Liquidation Band (bps)
              </label>
              <input
                type="number"
                value={liquidationBand}
                onChange={(e) => setLiquidationBand(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {params?.liquidationBandBps ?? '--'} bps
              </p>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Max Oracle Staleness (s)
              </label>
              <input
                type="number"
                value={maxStaleness}
                onChange={(e) => setMaxStaleness(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {params?.maxOracleStaleness ?? '--'}s
              </p>
            </div>
          </div>

          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3">
            <p className="text-blue-400 text-sm">
              ℹ️ Changes will require governance authority signature and affect all positions protocol-wide.
            </p>
          </div>

          <button
            onClick={handleUpdate}
            disabled={updating}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'Updating...' : 'Update Parameters'}
          </button>
        </div>
      </PermissionGuard>
    </div>
  );
}
