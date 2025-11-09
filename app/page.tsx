import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">
          Percolator DEX
        </h1>
        <p className="text-xl text-gray-300 mb-12">
          A formally-verified perpetual futures exchange on Solana
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Trader Interface */}
          <Link
            href="/trader"
            className="group relative overflow-hidden rounded-lg border border-gray-700 bg-gray-800 p-8 hover:border-blue-500 transition-all duration-300"
          >
            <div className="flex flex-col items-center">
              <div className="text-5xl mb-4">📈</div>
              <h2 className="text-2xl font-semibold text-white mb-2 group-hover:text-blue-400">
                Trader
              </h2>
              <p className="text-gray-400 text-center">
                Trade perpetual futures with cross-margin
              </p>
            </div>
          </Link>

          {/* LP Interface */}
          <Link
            href="/lp"
            className="group relative overflow-hidden rounded-lg border border-gray-700 bg-gray-800 p-8 hover:border-green-500 transition-all duration-300"
          >
            <div className="flex flex-col items-center">
              <div className="text-5xl mb-4">💧</div>
              <h2 className="text-2xl font-semibold text-white mb-2 group-hover:text-green-400">
                Liquidity Provider
              </h2>
              <p className="text-gray-400 text-center">
                Provide liquidity and earn fees
              </p>
            </div>
          </Link>

          {/* Admin Interface */}
          <Link
            href="/admin"
            className="group relative overflow-hidden rounded-lg border border-gray-700 bg-gray-800 p-8 hover:border-purple-500 transition-all duration-300"
          >
            <div className="flex flex-col items-center">
              <div className="text-5xl mb-4">⚙️</div>
              <h2 className="text-2xl font-semibold text-white mb-2 group-hover:text-purple-400">
                Admin
              </h2>
              <p className="text-gray-400 text-center">
                Manage exchange parameters
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>⚠️ Educational use only - Not audited for production</p>
        </div>
      </div>
    </main>
  );
}
