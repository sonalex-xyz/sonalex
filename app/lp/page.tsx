export default function LPPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Liquidity Provider</h1>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Connect Wallet
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LP Stats */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Your Liquidity</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Liquidity Provided</span>
                <span className="text-white font-mono">-- SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">LP Shares</span>
                <span className="text-white font-mono">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fees Earned (24h)</span>
                <span className="text-green-400 font-mono">+-- SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Fees Earned</span>
                <span className="text-green-400 font-mono">+-- SOL</span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-4">
                <span className="text-gray-400 font-semibold">APY</span>
                <span className="text-green-400 font-mono font-bold">--%</span>
              </div>
            </div>
          </div>

          {/* Pool Stats */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Pool Overview</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Pool Liquidity</span>
                <span className="text-white font-mono">-- SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">24h Volume</span>
                <span className="text-white font-mono">-- SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">24h Fees</span>
                <span className="text-green-400 font-mono">-- SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Your Pool Share</span>
                <span className="text-white font-mono">--%</span>
              </div>
            </div>
          </div>

          {/* Add Liquidity */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Add Liquidity</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Amount (SOL)</label>
                <input
                  type="number"
                  placeholder="0.0"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Price Range (Optional for AMM)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min price"
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                  <input
                    type="number"
                    placeholder="Max price"
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">You will receive</span>
                  <span className="text-white font-mono">-- LP tokens</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Share of pool</span>
                  <span className="text-white font-mono">--%</span>
                </div>
              </div>
              <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
                Add Liquidity
              </button>
            </div>
          </div>

          {/* Remove Liquidity */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Remove Liquidity</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">LP Shares to Remove</label>
                <input
                  type="number"
                  placeholder="0.0"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm">
                  25%
                </button>
                <button className="flex-1 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm">
                  50%
                </button>
                <button className="flex-1 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm">
                  75%
                </button>
                <button className="flex-1 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm">
                  MAX
                </button>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">You will receive</span>
                  <span className="text-white font-mono">-- SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fees earned</span>
                  <span className="text-green-400 font-mono">+-- SOL</span>
                </div>
              </div>
              <button className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">
                Remove Liquidity
              </button>
            </div>
          </div>

          {/* Active Positions */}
          <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Your LP Positions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-gray-400 text-sm border-b border-gray-700">
                  <tr>
                    <th className="pb-3">Market</th>
                    <th className="pb-3">Liquidity</th>
                    <th className="pb-3">Shares</th>
                    <th className="pb-3">Fees Earned</th>
                    <th className="pb-3">APY</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-8">
                      No active LP positions
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
