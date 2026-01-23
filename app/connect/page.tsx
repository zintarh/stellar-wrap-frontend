'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useWrapperStore } from '../store/useWrapperStore';
import { connectFreighter } from '../utils/walletConnect';

export default function ConnectPage() {
  const router = useRouter();
  const { setAddress, setConnecting, setError, error, isConnecting } = useWrapperStore();
  const [walletAddress, setWalletAddress] = useState('');

  const handleFreighterConnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      const publicKey = await connectFreighter();
      setAddress(publicKey);
      // Redirect to loading page after successful connection
      router.push('/loading');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect wallet';
      setError(errorMessage);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (walletAddress.trim()) {
      setAddress(walletAddress.trim());
      router.push('/loading');
    }
  };

  const handleDemoMode = () => {
    // Demo mode with a sample Stellar address
    setAddress('GDEMOADDRESSFORSTELLARWRAPDEMOPURPOSES12345678');
    router.push('/loading');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-primary">
      {/* Subtle Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-subtle opacity-20 pointer-events-none" />

      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 z-30 flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
        <span className="text-sm font-medium">BACK</span>
      </button>

      {/* Main Content */}
      <main className="relative z-20 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="w-full max-w-md mx-auto space-y-10">
          {/* Header */}
          <div className="text-center space-y-6 animate-fade-in">
            <h1 className="text-6xl sm:text-7xl font-black leading-none tracking-tight">
              <span className="gradient-text block">CONNECT</span>
              <span className="block text-text-primary mt-2">WALLET</span>
            </h1>
            <p className="text-base text-text-secondary max-w-sm mx-auto leading-relaxed">
              Enter your Stellar wallet address to unwrap your 2026 journey
            </p>
          </div>

          {/* Manual Address Input Form */}
          <form 
            onSubmit={handleManualSubmit} 
            className="space-y-5 animate-fade-in-up delay-200"
          >
            <div className="relative">
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 text-center">
                Manual Entry
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="G... (Stellar Address)"
                className={`w-full px-6 py-4.5 bg-bg-elevated border-2 ${
                  error ? 'border-red-500' : 'border-muted hover:border-accent-primary/50'
                } rounded-2xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-all text-center font-mono text-sm tracking-wide`}
              />
            </div>

            <button
              type="submit"
              disabled={!walletAddress.trim() || isConnecting}
              className="w-full btn-primary flex items-center justify-center gap-2 text-base font-bold py-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              START WRAPPING
            </button>
          </form>

          {/* Divider */}
          <div className="relative py-2 animate-fade-in delay-400">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-6 bg-bg-primary text-text-muted text-xs font-medium uppercase tracking-wider">
                Or Use Wallet
              </span>
            </div>
          </div>

          {/* Freighter Connect Button */}
          <div className="space-y-3 animate-fade-in-up delay-600">
            <button
              onClick={handleFreighterConnect}
              disabled={isConnecting}
              className={`w-full px-6 py-5 bg-bg-elevated border-2 ${
                error ? 'border-red-500' : 'border-accent-primary/30 hover:border-accent-primary'
              } rounded-2xl text-text-primary font-bold hover:bg-accent-primary/5 transition-all flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-bg-elevated`}
            >
              {isConnecting ? (
                <>
                  <div className="w-5 h-5 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-base">Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-7 h-7 text-accent-primary transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                  </svg>
                  <span className="text-base">Connect with Freighter</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border-2 border-red-500/50 rounded-xl text-red-400 text-sm text-center animate-fade-in font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Footer Links */}
          <div className="text-center space-y-4 pt-6 animate-fade-in delay-800">
            <p className="text-xs text-text-muted leading-relaxed">
              Don&apos;t have a Stellar wallet?{' '}
              <a
                href="https://stellar.org/wallets"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:text-accent-primary-hover font-medium underline decoration-1 underline-offset-2 transition-colors"
              >
                Get one here
              </a>
            </p>
            <button
              onClick={handleDemoMode}
              className="text-xs text-text-secondary hover:text-accent-primary transition-colors font-medium flex items-center justify-center gap-2 mx-auto group"
            >
              <span>Try demo mode</span>
              <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
