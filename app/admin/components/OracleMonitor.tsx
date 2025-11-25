'use client';

import { useEffect, useState, useCallback } from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import {
  fetchAllOracles,
  createUpdatePriceInstruction,
} from '../../../sdk/instructions/oracle';

/**
 * Oracle status interface for display
 */
interface OracleDisplayStatus {
  instrument: string;
  address: PublicKey;
  price: bigint;
  timestamp: number;
  confidence: bigint;
  authority: PublicKey;
  isStale: boolean;
  age: number; // seconds since last update
  status: 'healthy' | 'warning' | 'stale' | 'error';
}

// Staleness thresholds in seconds
const HEALTHY_THRESHOLD = 30;
const WARNING_THRESHOLD = 60;

/**
 * Get Oracle Program ID from environment
 */
function getOracleProgramId(): PublicKey | null {
  const programId = process.env.NEXT_PUBLIC_ORACLE_PROGRAM_ID;
  if (!programId) return null;
  try {
    return new PublicKey(programId);
  } catch {
    return null;
  }
}

/**
 * Classify oracle status based on age
 */
function classifyStatus(age: number): 'healthy' | 'warning' | 'stale' | 'error' {
  if (age < 0) return 'error';
  if (age <= HEALTHY_THRESHOLD) return 'healthy';
  if (age <= WARNING_THRESHOLD) return 'warning';
  return 'stale';
}

/**
 * Oracle Monitor Component
 *
 * Displays and manages price oracles for all instruments
 */
export default function OracleMonitor() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [oracles, setOracles] = useState<OracleDisplayStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOracle, setSelectedOracle] = useState<string | null>(null);
  const [updatePrice, setUpdatePrice] = useState<string>('');
  const [updateConfidence, setUpdateConfidence] = useState<string>('');
  const [updating, setUpdating] = useState(false);


  /**
   * Fetch all oracles from the blockchain
   */
  const loadOracles = useCallback(async () => {
    const programId = getOracleProgramId();
    if (!programId) {
      setError('Oracle program ID not configured. Add NEXT_PUBLIC_ORACLE_PROGRAM_ID to .env.local');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const oracleAccounts = await fetchAllOracles(connection, programId);
      const now = Math.floor(Date.now() / 1000);

      const displayOracles: OracleDisplayStatus[] = oracleAccounts.map(({ address, data }) => {
        const timestamp = Number(data.timestamp);
        const age = timestamp > 0 ? now - timestamp : Infinity;
        const status = classifyStatus(age);

        // Try to derive instrument name from the instrument pubkey
        // In production, you'd map this to actual instrument names
        const instrumentName = data.instrument.toBase58().slice(0, 8) + '...';

        return {
          instrument: instrumentName,
          address,
          price: data.price,
          timestamp,
          confidence: data.confidence,
          authority: data.authority,
          isStale: status === 'stale',
          age: age === Infinity ? -1 : age,
          status,
        };
      });

      setOracles(displayOracles);
    } catch (err) {
      console.error('Failed to fetch oracles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch oracles');
    } finally {
      setLoading(false);
    }
  }, [connection]);

  // Initial load and periodic refresh
  useEffect(() => {
    loadOracles();

    // Refresh every 10 seconds
    const interval = setInterval(loadOracles, 10000);
    return () => clearInterval(interval);
  }, [loadOracles]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'stale': return 'text-red-400';
      case 'error': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'stale': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'error': return 'bg-red-600/20 text-red-600 border-red-600/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  /**
   * Update oracle price on-chain
   */
  const handleUpdatePrice = async (oracleAddress: string) => {
    const programId = getOracleProgramId();
    if (!programId || !wallet.publicKey || !wallet.signTransaction) {
      alert('Wallet not connected or oracle program not configured');
      return;
    }

    const priceNum = parseFloat(updatePrice);
    const confidenceNum = parseFloat(updateConfidence || '0');

    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      setUpdating(true);

      // Scale price and confidence by 1_000_000
      const scaledPrice = BigInt(Math.round(priceNum * 1_000_000));
      const scaledConfidence = BigInt(Math.round(confidenceNum * 1_000_000));

      const instruction = createUpdatePriceInstruction(
        new PublicKey(oracleAddress),
        wallet.publicKey,
        scaledPrice,
        scaledConfidence,
        programId
      );

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signed = await wallet.signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signed.serialize());

      await connection.confirmTransaction(txid, 'confirmed');

      alert(`Oracle updated! Transaction: ${txid}`);
      setSelectedOracle(null);
      setUpdatePrice('');
      setUpdateConfidence('');
      loadOracles();
    } catch (err) {
      console.error('Failed to update oracle:', err);
      alert(`Failed to update oracle: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };


  if (loading && oracles.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading oracles...</div>
      </div>
    );
  }

  if (error && oracles.length === 0) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadOracles}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Price Oracles</h2>
          <p className="text-gray-400 text-sm mt-1">
            Monitor and manage price feeds for all instruments
          </p>
        </div>
        <button
          onClick={loadOracles}
          disabled={loading}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-semibold text-sm disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Total Oracles</p>
          <p className="text-2xl font-mono text-white mt-1">{oracles.length}</p>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Healthy</p>
          <p className="text-2xl font-mono text-green-400 mt-1">
            {oracles.filter(o => o.status === 'healthy').length}
          </p>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Warning</p>
          <p className="text-2xl font-mono text-yellow-400 mt-1">
            {oracles.filter(o => o.status === 'warning').length}
          </p>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Stale</p>
          <p className="text-2xl font-mono text-red-400 mt-1">
            {oracles.filter(o => o.status === 'stale').length}
          </p>
        </div>
      </div>

      {/* Oracle Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {oracles.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>No oracles found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700 text-gray-300 text-sm">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Address</th>
                  <th className="px-6 py-3 text-left font-semibold">Price</th>
                  <th className="px-6 py-3 text-left font-semibold">Confidence</th>
                  <th className="px-6 py-3 text-left font-semibold">Last Update</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {oracles.map((oracle) => (
                  <tr key={oracle.address.toBase58()} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-mono text-sm">
                          {oracle.address.toBase58().slice(0, 8)}...{oracle.address.toBase58().slice(-4)}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Authority: {oracle.authority.toBase58().slice(0, 8)}...
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-mono text-lg">
                        ${(Number(oracle.price) / 1_000_000).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300 font-mono">
                        ±${(Number(oracle.confidence) / 1_000_000).toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white">
                          {oracle.age < 0 ? 'Never' : `${oracle.age}s ago`}
                        </p>
                        {oracle.timestamp > 0 && (
                          <p className="text-gray-400 text-xs">
                            {new Date(oracle.timestamp * 1000).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(oracle.status)}`}>
                        {oracle.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOracle(oracle.address.toBase58())}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Price Modal */}
      {selectedOracle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Update Oracle Price
            </h3>
            <p className="text-gray-400 text-sm mb-4 font-mono">
              {selectedOracle.slice(0, 16)}...{selectedOracle.slice(-8)}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  New Price (USD)
                </label>
                <input
                  type="number"
                  value={updatePrice}
                  onChange={(e) => setUpdatePrice(e.target.value)}
                  placeholder="65000.00"
                  step="0.000001"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Confidence (±USD)
                </label>
                <input
                  type="number"
                  value={updateConfidence}
                  onChange={(e) => setUpdateConfidence(e.target.value)}
                  placeholder="50.00"
                  step="0.01"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">
                  This will immediately update the oracle price. Ensure the price is accurate.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleUpdatePrice(selectedOracle)}
                  disabled={updating || !wallet.connected}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Price'}
                </button>
                <button
                  onClick={() => setSelectedOracle(null)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Banner */}
      {oracles.some(o => o.status === 'stale') && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-red-400 text-xl">⚠️</span>
            <div>
              <p className="text-red-400 font-semibold">Stale Oracles Detected</p>
              <p className="text-red-300 text-sm mt-1">
                {oracles.filter(o => o.status === 'stale').length} oracle(s) haven't been updated recently.
                This may affect trading and liquidations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-400 text-xl">ℹ️</span>
          <div>
            <p className="text-blue-400 font-semibold">Oracle Configuration</p>
            <ul className="text-blue-300 text-sm mt-2 space-y-1">
              <li>• <strong>Healthy:</strong> Updated within {HEALTHY_THRESHOLD} seconds</li>
              <li>• <strong>Warning:</strong> Updated {HEALTHY_THRESHOLD}-{WARNING_THRESHOLD} seconds ago</li>
              <li>• <strong>Stale:</strong> No update for over {WARNING_THRESHOLD} seconds</li>
              <li>• <strong>Authority:</strong> Only the oracle authority wallet can update prices</li>
            </ul>
            <p className="text-blue-300 text-sm mt-2">
              <strong>Production Note:</strong> Replace with Pyth/Switchboard oracles for automatic price updates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
