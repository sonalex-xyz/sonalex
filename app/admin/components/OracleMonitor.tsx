'use client';

import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';

/**
 * Oracle status interface
 */
interface OracleStatus {
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

/**
 * Oracle Monitor Component
 *
 * Displays and manages price oracles for all instruments
 */
export default function OracleMonitor() {
  const [oracles, setOracles] = useState<OracleStatus[]>([]);
  const [selectedOracle, setSelectedOracle] = useState<string | null>(null);
  const [updatePrice, setUpdatePrice] = useState<string>('');
  const [updateConfidence, setUpdateConfidence] = useState<string>('');

  // TODO: Fetch oracle data from blockchain
  useEffect(() => {
    // Mock data for now
    const mockOracles: OracleStatus[] = [
      {
        instrument: 'BTC-PERP',
        address: new PublicKey('11111111111111111111111111111111'),
        price: 65000_000000n, // $65,000 (6 decimals)
        timestamp: Date.now() / 1000 - 30, // 30 seconds ago
        confidence: 50_000000n, // $50 confidence
        authority: new PublicKey('11111111111111111111111111111111'),
        isStale: false,
        age: 30,
        status: 'healthy',
      },
      {
        instrument: 'ETH-PERP',
        address: new PublicKey('2222222222222222222222222222222222222222222'),
        price: 3200_000000n, // $3,200
        timestamp: Date.now() / 1000 - 45, // 45 seconds ago
        confidence: 10_000000n, // $10 confidence
        authority: new PublicKey('11111111111111111111111111111111111111111111'),
        isStale: false,
        age: 45,
        status: 'warning',
      },
      {
        instrument: 'SOL-PERP',
        address: new PublicKey('3333333333333333333333333333333333333333333'),
        price: 145_000000n, // $145
        timestamp: Date.now() / 1000 - 90, // 90 seconds ago
        confidence: 1_000000n, // $1 confidence
        authority: new PublicKey('11111111111111111111111111111111111111111111'),
        isStale: true,
        age: 90,
        status: 'stale',
      },
    ];
    setOracles(mockOracles);
  }, []);

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

  const handleUpdatePrice = async (instrument: string) => {
    // TODO: Call SDK to update oracle price
    console.log('Updating oracle price:', instrument, updatePrice, updateConfidence);
    alert(`Update oracle price for ${instrument} to $${updatePrice} (confidence: $${updateConfidence})`);
  };

  const handleCreateOracle = () => {
    // TODO: Call SDK to create new oracle
    alert('Create new oracle - not implemented yet');
  };

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
          onClick={handleCreateOracle}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm"
        >
          + Create Oracle
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700 text-gray-300 text-sm">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Instrument</th>
                <th className="px-6 py-3 text-left font-semibold">Price</th>
                <th className="px-6 py-3 text-left font-semibold">Confidence</th>
                <th className="px-6 py-3 text-left font-semibold">Last Update</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {oracles.map((oracle) => (
                <tr key={oracle.instrument} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-semibold">{oracle.instrument}</p>
                      <p className="text-gray-400 text-xs font-mono">
                        {oracle.address.toBase58().slice(0, 8)}...
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white font-mono text-lg">
                      ${(Number(oracle.price) / 1_000_000).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
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
                      <p className="text-white">{oracle.age}s ago</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(oracle.timestamp * 1000).toLocaleTimeString()}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(oracle.status)}`}>
                      {oracle.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedOracle(oracle.instrument)}
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
      </div>

      {/* Update Price Modal */}
      {selectedOracle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Update Oracle Price: {selectedOracle}
            </h3>

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
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">
                  ⚠️ This will immediately update the oracle price. Ensure the price is accurate.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleUpdatePrice(selectedOracle)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                >
                  Update Price
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
              <button className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                Update All Stale Oracles
              </button>
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
              <li>• <strong>Healthy:</strong> Updated within 30 seconds</li>
              <li>• <strong>Warning:</strong> Updated 30-60 seconds ago</li>
              <li>• <strong>Stale:</strong> No update for over 60 seconds (max staleness threshold)</li>
              <li>• <strong>Authority:</strong> Only admin wallet can update prices</li>
            </ul>
            <p className="text-blue-300 text-sm mt-2">
              💡 <strong>Production Note:</strong> Replace with Pyth/Switchboard oracles for automatic price updates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
