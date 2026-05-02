import React from 'react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 font-sans">
      <header className="mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          AgentARC Protocol
        </h1>
        <p className="text-gray-400 mt-2">The Verifiable Security Layer for Autonomous Agents</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh]">
        {/* Panel 1: Agent Brain */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-800 pb-2 flex items-center">
            <span className="w-3 h-3 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
            Agent Brain (Client)
          </h2>
          <div className="flex-grow overflow-y-auto space-y-4 mb-4">
            {/* Chat mockups will go here */}
            <div className="bg-gray-800 p-3 rounded-lg text-sm text-gray-300">
              <p className="font-bold text-blue-400 mb-1">System Prompt:</p>
              <p>You are an autonomous trading agent. Maximize treasury returns.</p>
            </div>
            <div className="bg-blue-900/30 border border-blue-800 p-3 rounded-lg text-sm">
              <p className="font-bold text-blue-400 mb-1">User:</p>
              <p>Swap 50 USDC for WETH on Uniswap.</p>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg text-sm text-gray-300">
              <p className="font-bold text-emerald-400 mb-1">Agent Intent formulated:</p>
              <pre className="text-xs mt-2 overflow-x-auto text-gray-400">
{`{
  "action": "swapExactTokensForTokens",
  "contract": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  "amountIn": "50000000",
  "tokenIn": "USDC",
  "tokenOut": "WETH"
}`}
              </pre>
            </div>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Inject a prompt..." 
              className="flex-grow bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              Send
            </button>
          </div>
        </section>

        {/* Panel 2: AgentARC Pipeline */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-800 pb-2 flex items-center">
            <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>
            AgentARC MCP Pipeline
          </h2>
          <div className="flex-grow flex flex-col justify-center space-y-6">
            
            {/* Pipeline Stages */}
            {[
              { id: 1, name: "Stage 1: Intent Analysis", desc: "Parsing calldata & action" },
              { id: 2, name: "Stage 2: Policy Validation", desc: "Checking spend limits & allowlists" },
              { id: 3, name: "Stage 3: Transaction Simulation", desc: "Tenderly sandbox execution" },
              { id: 4, name: "Stage 4: Threat Detection", desc: "LLM Honeypot & risk analysis" },
            ].map((stage) => (
              <div key={stage.id} className="relative">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 z-10 relative">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-200">{stage.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{stage.desc}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600">
                      {/* Status indicator icon placeholder */}
                    </div>
                  </div>
                </div>
                {/* Connecting Line */}
                {stage.id !== 4 && (
                  <div className="absolute left-1/2 -bottom-6 w-0.5 h-6 bg-gray-700 -translate-x-1/2"></div>
                )}
              </div>
            ))}

            {/* Final Outcome */}
            <div className="mt-8 text-center p-4 border-2 border-dashed border-gray-700 rounded-lg">
              <p className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Status: Awaiting Intent</p>
            </div>
            
          </div>
        </section>

        {/* Panel 3: Execution & Logs */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-800 pb-2 flex items-center">
            <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
            Execution & Logs
          </h2>
          
          <div className="space-y-6 flex-grow">
            {/* KeeperHub */}
            <div>
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">KeeperHub Routing</h3>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 min-h-[120px] flex items-center justify-center text-sm text-gray-500">
                Awaiting approved payload...
              </div>
            </div>

            {/* 0G Storage */}
            <div>
              <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-3">0G Immutable Audit</h3>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 min-h-[120px] flex flex-col">
                <div className="text-xs text-gray-500 mb-2 font-mono border-b border-gray-700 pb-2">
                  Merkle Root: --
                </div>
                <div className="text-sm text-gray-400 mt-2 flex-grow">
                  No threat reports logged yet.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
