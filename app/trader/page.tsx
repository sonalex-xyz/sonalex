export default function TraderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Trader Interface</h1>
          <div className="flex gap-4">
            {/* Wallet button will go here */}
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Connect Wallet
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Card */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Portfolio</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Equity</span>
                <span className="text-white font-mono">-- SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Margin Used</span>
                <span className="text-white font-mono">-- SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Available</span>
                <span className="text-green-400 font-mono">-- SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">PnL</span>
                <span className="text-green-400 font-mono">+-- SOL</span>
              </div>
            </div>
          </div>

          {/* Market Overview */}
          <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Market</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Mark Price</p>
                <p className="text-2xl font-mono text-white">--</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">24h Change</p>
                <p className="text-2xl font-mono text-green-400">--</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">24h Volume</p>
                <p className="text-xl font-mono text-white">--</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Open Interest</p>
                <p className="text-xl font-mono text-white">--</p>
              </div>
            </div>
          </div>

          {/* Trading Panel */}
          <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Place Order</h2>

            <div className="flex gap-2 mb-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Long
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Short
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Size</label>
                <input
                  type="number"
                  placeholder="0.0"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Price</label>
                <input
                  type="number"
                  placeholder="Market"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                Place Order
              </button>
            </div>
          </div>

          {/* Order Book */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Order Book</h2>
            <div className="space-y-1 text-sm font-mono">
              <div className="flex justify-between text-gray-400 mb-2">
                <span>Price</span>
                <span>Size</span>
              </div>
              <div className="flex justify-between text-red-400">
                <span>--</span>
                <span>--</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span>--</span>
                <span>--</span>
              </div>
            </div>
          </div>

          {/* Positions */}
          <div className="lg:col-span-3 bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Open Positions</h2>
            <div className="text-center text-gray-400 py-8">
              No open positions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
