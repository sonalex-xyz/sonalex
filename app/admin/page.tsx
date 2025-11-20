'use client';

import OracleMonitor from './components/OracleMonitor';
import { PermissionGuard, Permission, AuthorityBadge } from './components/PermissionGuard';
import { WalletButton } from './components/WalletButton';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-2">Exchange Management & Monitoring</p>
            <div className="mt-3">
              <AuthorityBadge />
            </div>
          </div>
          <WalletButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exchange Stats */}
          <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Exchange Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total Value Locked</p>
                <p className="text-2xl font-mono text-white mt-1">-- SOL</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">24h Volume</p>
                <p className="text-2xl font-mono text-white mt-1">-- SOL</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-mono text-white mt-1">--</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Open Positions</p>
                <p className="text-2xl font-mono text-white mt-1">--</p>
              </div>
            </div>
          </div>

          {/* Insurance Fund */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Insurance Fund</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Balance</span>
                <span className="text-white font-mono">-- SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Utilization</span>
                <span className="text-white font-mono">--%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">24h Payouts</span>
                <span className="text-red-400 font-mono">-- SOL</span>
              </div>
            </div>
            <button className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
              Manage Insurance Fund
            </button>
          </div>

          {/* Risk Parameters - Governance Only */}
          <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Risk Parameters</h2>
            <PermissionGuard requiredPermission={Permission.GOVERNANCE}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Initial Margin Ratio (%)</label>
                    <input
                      type="number"
                      defaultValue="10"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Maintenance Margin Ratio (%)</label>
                    <input
                      type="number"
                      defaultValue="5"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Liquidation Band (bps)</label>
                    <input
                      type="number"
                      defaultValue="200"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Max Oracle Staleness (s)</label>
                    <input
                      type="number"
                      defaultValue="60"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
                  Update Parameters
                </button>
              </div>
            </PermissionGuard>
          </div>

          {/* Fee Configuration */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Fee Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Maker Fee (bps)</label>
                <input
                  type="number"
                  defaultValue="2"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Taker Fee (bps)</label>
                <input
                  type="number"
                  defaultValue="5"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">AMM Fee (bps)</label>
                <input
                  type="number"
                  defaultValue="5"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Update Fees
              </button>
            </div>
          </div>

          {/* Liquidations Monitor */}
          <div className="lg:col-span-3 bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-8">
                      No recent activity
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Oracle Monitor - Governance Only */}
          <div className="lg:col-span-3 bg-gray-800 border border-gray-700 rounded-lg p-6">
            <PermissionGuard requiredPermission={Permission.GOVERNANCE}>
              <OracleMonitor />
            </PermissionGuard>
          </div>

          {/* Circuit Breakers - Governance Only */}
          <div className="lg:col-span-3 bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Emergency Controls</h2>
            <PermissionGuard requiredPermission={Permission.GOVERNANCE}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold">
                  Pause Trading
                </button>
                <button className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold">
                  Pause Withdrawals
                </button>
                <button className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">
                  Emergency Shutdown
                </button>
              </div>
              <p className="text-yellow-400 text-sm mt-4">
                ⚠️ Use these controls only in emergency situations
              </p>
            </PermissionGuard>
          </div>
        </div>
      </div>
    </div>
  );
}
