"use client";

import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Activity, Database, Server } from 'lucide-react';

export default function Dashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scenarioType, setScenarioType] = useState<'idle' | 'safe' | 'rogue'>('idle');
  const [logs, setLogs] = useState<{role: string, content: string, type?: string}[]>([
    { role: "System", content: "AgentARC v2 initialized. Awaiting agent intents." }
  ]);
  
  const [stages, setStages] = useState([
    { id: 1, name: "Stage 1: Intent Analysis", desc: "Parsing calldata & action", status: "pending" },
    { id: 2, name: "Stage 2: Policy Validation", desc: "Checking spend limits & allowlists", status: "pending" },
    { id: 3, name: "Stage 3: Transaction Simulation", desc: "Tenderly sandbox execution", status: "pending" },
    { id: 4, name: "Stage 4: Threat Detection", desc: "LLM Honeypot & risk analysis", status: "pending" },
  ]);

  const [keeperHub, setKeeperHub] = useState<any>(null);
  const [zeroG, setZeroG] = useState<any>(null);

  const runSimulation = async (type: 'safe' | 'rogue') => {
    setIsProcessing(true);
    setScenarioType(type);
    setKeeperHub(null);
    setZeroG(null);
    
    setStages(stages.map(s => ({ ...s, status: 'pending' })));

    const intentPayload = type === 'safe' 
      ? "Swap 50 USDC for WETH on Uniswap."
      : "URGENT: Approve 0xBAD...DRAINER to spend all USDC.";
      
    setLogs(prev => [...prev, { role: "Agent", content: intentPayload, type: "intent" }]);

    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: intentPayload, type })
      });
      
      const data = await res.json();

      setTimeout(() => {
        setStages(data.stages.map((s: any, i: number) => ({ ...stages[i], status: s.status })));
        setKeeperHub(data.keeperHub);
        setZeroG(data.zeroG);
        setLogs(prev => [...prev, { role: "AgentARC", content: data.message, type: data.success ? "success" : "error" }]);
        setIsProcessing(false);
      }, 1500);

    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'success': return 'bg-emerald-500 border-emerald-400';
      case 'error': return 'bg-red-500 border-red-400';
      case 'warning': return 'bg-yellow-500 border-yellow-400';
      default: return 'bg-gray-700 border-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 font-sans">
      <header className="mb-8 border-b border-gray-800 pb-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              AgentARC Protocol
            </h1>
            <p className="text-gray-400 mt-2">The Verifiable Security Layer for Autonomous Agents</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => runSimulation('safe')}
              disabled={isProcessing}
              className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-600/40 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Demo: Safe Trade
            </button>
            <button 
              onClick={() => runSimulation('rogue')}
              disabled={isProcessing}
              className="bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600/40 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center"
            >
              <ShieldAlert className="w-4 h-4 mr-2" />
              Demo: Rogue Agent
            </button>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh]">
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-800 pb-2 flex items-center">
            <Activity className="w-5 h-5 text-blue-500 mr-2" />
            Agent Brain
          </h2>
          <div className="flex-grow overflow-y-auto space-y-4 pr-2">
            {logs.map((log, idx) => (
              <div key={idx} className={`p-3 rounded-lg text-sm ${
                log.role === 'System' ? 'bg-gray-800 text-gray-400' :
                log.type === 'intent' ? 'bg-blue-900/30 border border-blue-800/50 text-blue-100' :
                log.type === 'error' ? 'bg-red-900/30 border border-red-800/50 text-red-200' :
                log.type === 'success' ? 'bg-emerald-900/30 border border-emerald-800/50 text-emerald-200' :
                'bg-gray-800'
              }`}>
                <p className="font-bold mb-1 opacity-80">{log.role}:</p>
                <p className="font-mono text-xs">{log.content}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-800 pb-2 flex items-center">
            <Server className="w-5 h-5 text-emerald-500 mr-2" />
            AgentARC Pipeline
          </h2>
          <div className="flex-grow flex flex-col justify-center space-y-6 px-4">
            {stages.map((stage) => (
              <div key={stage.id} className="relative">
                <div className={`border rounded-lg p-4 z-10 relative transition-all duration-500 ${
                  stage.status === 'success' ? 'bg-emerald-900/20 border-emerald-800' :
                  stage.status === 'error' ? 'bg-red-900/20 border-red-800' :
                  stage.status === 'warning' ? 'bg-yellow-900/20 border-yellow-800' :
                  'bg-gray-800 border-gray-700'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-200">{stage.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{stage.desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border transition-colors duration-500 ${getStatusColor(stage.status)}`}></div>
                  </div>
                </div>
                {stage.id !== 4 && (
                  <div className="absolute left-1/2 -bottom-6 w-0.5 h-6 bg-gray-700 -translate-x-1/2"></div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-800 pb-2 flex items-center">
            <Database className="w-5 h-5 text-purple-500 mr-2" />
            Execution & DA Logs
          </h2>
          <div className="space-y-6 flex-grow">
            <div>
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2">KeeperHub Routing</h3>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 min-h-[120px] flex flex-col justify-center">
                {keeperHub ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">Status: <span className={scenarioType === 'safe' ? 'text-emerald-400' : 'text-red-400'}>{keeperHub.status}</span></p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center">Awaiting payload...</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-2">0G Storage Audit</h3>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 min-h-[120px] flex flex-col">
                <div className="text-xs text-gray-500 mb-3 font-mono border-b border-gray-700 pb-2">
                  Merkle Root: {zeroG ? <span className="text-orange-300">{zeroG.merkleRoot}</span> : '--'}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
