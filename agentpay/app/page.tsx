'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Shield, Zap, ArrowRight } from 'lucide-react';

const BACKEND_URL = 'https://ideal-goldfish-6qxqw75v6573xwg-3001.app.github.dev';

export default function Home() {
  const { address, isConnected } = useAccount();

  const [agentName, setAgentName] = useState('AgentPay Alpha');
  const [dailyLimit, setDailyLimit] = useState(5);
  const [status, setStatus] = useState<'idle' | 'deploying' | 'success'>('idle');
  const [deploymentData, setDeploymentData] = useState<any>(null);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      alert('Please connect your wallet first.');
      return;
    }

    setStatus('deploying');

    try {
      const res = await fetch(`${BACKEND_URL}/api/provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operatorWallet: address,
          agentName,
          dailyLimit
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Provision failed');
      }

      setDeploymentData(data);
      setStatus('success');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Provision failed');
      setStatus('idle');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/40 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/30 blur-[150px]"></div>
        <div className="absolute top-[40%] left-[50%] w-[800px] h-[400px] rounded-full bg-purple-900/20 blur-[150px] -translate-x-1/2"></div>
      </div>

      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-500 fill-blue-500" />
            <span className="text-xl font-bold tracking-tight">AgentPay</span>
          </div>
          <ConnectButton />
        </div>
      </nav>

      <main className="flex-1 relative z-10 w-full flex flex-col pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center w-full">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Agent Provisioning Live
            </div>

            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Give your AI an <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Identity.</span>
            </h1>

            <p className="text-xl text-gray-400 leading-relaxed max-w-lg">
              Connect your wallet, set a daily limit, provision an MCP endpoint,
              and register your agent identity on Base Sepolia.
            </p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>

            <div className="relative bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <div className="mb-8 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold">Deploy Agent</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Initialize identity and set spend parameters.
                </p>
              </div>

              {status === 'success' && deploymentData ? (
                <div className="space-y-6">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-4">
                    <Shield className="text-green-400 w-6 h-6 shrink-0" />
                    <div>
                      <h3 className="font-bold text-green-400">Agent Provisioned</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Copy the MCP Server URL into your MCP client.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 font-mono uppercase tracking-wider">Operator Wallet</label>
                      <code className="block mt-2 p-3 bg-black/50 border border-white/5 rounded-lg text-green-400 font-mono text-sm break-all">
                        {deploymentData.operatorWallet}
                      </code>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 font-mono uppercase tracking-wider">Agent ID</label>
                      <code className="block mt-2 p-3 bg-black/50 border border-white/5 rounded-lg text-purple-400 font-mono text-sm break-all">
                        {deploymentData.agentId || 'Not available'}
                      </code>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 font-mono uppercase tracking-wider">ERC-8004 TX</label>
                      <code className="block mt-2 p-3 bg-black/50 border border-white/5 rounded-lg text-yellow-400 font-mono text-sm break-all">
                        {deploymentData.erc8004TxHash || 'Not available'}
                      </code>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 font-mono uppercase tracking-wider">MCP Server URL</label>
                      <code className="block mt-2 p-3 bg-black/50 border border-white/5 rounded-lg text-blue-400 font-mono text-sm break-all">
                        {deploymentData.mcpUrl}
                      </code>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 font-mono uppercase tracking-wider">Agent Manifest</label>
                      <code className="block mt-2 p-3 bg-black/50 border border-white/5 rounded-lg text-indigo-400 font-mono text-sm break-all">
                        {deploymentData.manifestUrl}
                      </code>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setStatus('idle');
                      setDeploymentData(null);
                    }}
                    className="w-full mt-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors"
                  >
                    Provision Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleProvision} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Operator Wallet
                    </label>
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300">
                      {isConnected && address ? address : 'Connect wallet first'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Agent Designation
                    </label>
                    <input
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Daily Spend Limit
                      </label>
                      <span className="text-blue-400 font-mono font-bold">
                        {dailyLimit}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={dailyLimit}
                      onChange={(e) => setDailyLimit(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!isConnected || status === 'deploying'}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    {status === 'deploying' ? 'Deploying...' : 'Deploy Infrastructure'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
