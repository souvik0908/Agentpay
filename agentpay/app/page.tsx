'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Shield, Terminal, Zap, Fingerprint, Database, ArrowRight } from 'lucide-react';

export default function Home() {
  // Wagmi automatically handles getting the wallet address and connection status!
  const { address, isConnected } = useAccount(); 
  
  const [agentName, setAgentName] = useState('AgentPay Alpha');
  const [dailyLimit, setDailyLimit] = useState(5);
  const [status, setStatus] = useState('idle'); 
  const [deploymentData, setDeploymentData] = useState<any>(null);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return alert("Please connect your wallet first!");
    
    setStatus('deploying');
    
    // Fake 2.5s delay to simulate backend Node.js creation
    setTimeout(() => {
      setDeploymentData({
        pkpAddress: "0xLitPKP...882a",
        mcpUrl: `http://localhost:3000/mcp/${agentName.toLowerCase().replace(/\s+/g, '-')}`
      });
      setStatus('success');
    }, 2500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/40 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/30 blur-[150px]"></div>
        <div className="absolute top-[40%] left-[50%] w-[800px] h-[400px] rounded-full bg-purple-900/20 blur-[150px] -translate-x-1/2"></div>
      </div>

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-500 fill-blue-500" />
            <span className="text-xl font-bold tracking-tight">AgentPay</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#network" className="hover:text-white transition-colors">Network</a>
            <a href="https://github.com" target="_blank" className="hover:text-white transition-colors">Docs</a>
          </div>
          
          {/* RAINBOWKIT CONNECT BUTTON IN HEADER */}
          <ConnectButton />
          
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 relative z-10 w-full flex flex-col pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center w-full mb-24">
          
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              AgentFabric 2.0 is Live
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Give your AI a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Wallet.</span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-lg">
              Provision secure, bounded Lit Protocol wallets and ERC-8004 identities for your AI agents to autonomously navigate the x402 paid internet.
            </p>
            <div className="flex gap-4">
              <a href="#provision" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold flex items-center gap-2 transition-all">
                Start Building <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#features" className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md rounded-lg font-bold transition-all">
                View Architecture
              </a>
            </div>
          </div>

          <div id="provision" className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              
              <div className="mb-8 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold">Deploy Agent</h2>
                <p className="text-sm text-gray-400 mt-1">Initialize identity and set spend parameters.</p>
              </div>

              {status === 'success' && deploymentData ? (
                <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-4">
                    <Shield className="text-green-400 w-6 h-6 shrink-0" />
                    <div>
                      <h3 className="font-bold text-green-400">Agent Live on Base Sepolia</h3>
                      <p className="text-sm text-gray-400 mt-1">Copy your MCP Server URL and paste it into Claude Desktop to begin autonomous execution.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 font-mono uppercase tracking-wider">Lit PKP Wallet</label>
                      <code className="block mt-2 p-3 bg-black/50 border border-white/5 rounded-lg text-green-400 font-mono text-sm break-all">{deploymentData.pkpAddress}</code>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-mono uppercase tracking-wider">MCP Server URL</label>
                      <code className="block mt-2 p-3 bg-black/50 border border-white/5 rounded-lg text-blue-400 font-mono text-sm break-all">{deploymentData.mcpUrl}</code>
                    </div>
                  </div>
                  
                  <button onClick={() => setStatus('idle')} className="w-full mt-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors">
                    Provision Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleProvision} className="space-y-6">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Operator Wallet</label>
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                      {/* RAINBOWKIT CONNECT BUTTON IN FORM */}
                      <ConnectButton showBalance={false} chainStatus="icon" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Agent Designation</label>
                    <input type="text" value={agentName} onChange={(e) => setAgentName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-sm font-medium text-gray-300">Daily Spend Limit</label>
                      <span className="text-blue-400 font-mono font-bold">{dailyLimit} USDC</span>
                    </div>
                    <input type="range" min="1" max="20" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} className="w-full accent-blue-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
                  </div>

                  <button type="submit" disabled={!isConnected || status === 'deploying'} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20">
                    {status === 'deploying' ? (
                      <><Terminal className="w-5 h-5 animate-pulse" /> Provisioning Node...</>
                    ) : (
                      <><Zap className="w-5 h-5" /> Deploy Infrastructure</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="w-full mt-auto py-24 border-t border-white/5 bg-black/40 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">The Trust Fabric for Agents</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">Built natively on Base Sepolia using enterprise-grade cryptographic primitives.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                <Shield className="w-10 h-10 text-blue-400 mb-6" />
                <h3 className="text-xl font-bold mb-3">Lit Protocol Guardrails</h3>
                <p className="text-gray-400 leading-relaxed">Agents are assigned PKPs with hard-coded Lit Actions. If an agent attempts to spend past its daily USDC limit, the network physically refuses to sign the transaction.</p>
              </div>
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                <Fingerprint className="w-10 h-10 text-indigo-400 mb-6" />
                <h3 className="text-xl font-bold mb-3">ERC-8004 Identity</h3>
                <p className="text-gray-400 leading-relaxed">No more anonymous bot traffic. Every agent mints a verifiable identity on the Ethereum Foundation registry, linking it directly to the human operator.</p>
              </div>
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                <Database className="w-10 h-10 text-purple-400 mb-6" />
                <h3 className="text-xl font-bold mb-3">Storacha Audit Logs</h3>
                <p className="text-gray-400 leading-relaxed">Total transparency. Every x402 invoice paid and every data packet purchased is bundled and permanently stored on the decentralized Filecoin network.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="shrink-0 w-full border-t border-white/10 bg-black py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gray-600" />
            <span>© 2026 AgentPay Network. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Base Sepolia Contract</a>
          </div>
        </div>
      </footer>
    </div>
  );
}