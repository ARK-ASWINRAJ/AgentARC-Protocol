"use client";

import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Activity, Database, Server, ChevronRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scenarioType, setScenarioType] = useState<'idle' | 'safe' | 'rogue'>('idle');
  const [logs, setLogs] = useState<{role: string, content: string, type?: string}[]>([
    { role: "System", content: "AgentARC v2 Initialized. Awaiting MCP connection..." }
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
      ? "Execute Swap: 50 USDC -> WETH (Uniswap V3)"
      : "URGENT: Approve 0xBAD...DRAINER to spend infinite USDC";
      
    setLogs(prev => [...prev, { role: "Agent", content: intentPayload, type: "intent" }]);

    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: intentPayload, type })
      });
      
      const data = await res.json();

      for (let i = 0; i < data.stages.length; i++) {
        await new Promise(r => setTimeout(r, 600)); 
        setStages(prev => {
          const newStages = [...prev];
          newStages[i].status = data.stages[i].status;
          return newStages;
        });
        
        if (data.stages[i].status === 'error') break;
      }

      setTimeout(() => {
        setKeeperHub(data.keeperHub);
        setZeroG(data.zeroG);
        setLogs(prev => [...prev, { role: "AgentARC", content: data.message, type: data.success ? "success" : "error" }]);
        setIsProcessing(false);
      }, 500);

    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'success': return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/30', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.2)]' };
      case 'error': return { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-500/30', glow: 'shadow-[0_0_15px_rgba(248,113,113,0.2)]' };
      case 'warning': return { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/30', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.2)]' };
      default: return { color: 'text-gray-500', bg: 'bg-white/5', border: 'border-white/10', glow: '' };
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 p-4 md:p-8 font-sans bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              AgentARC <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Protocol</span>
            </h1>
          </div>
          <p className="text-gray-400 text-lg ml-1">The Verifiable Security Layer for Autonomous Agents</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="flex gap-4"
        >
          <button 
            onClick={() => runSimulation('safe')}
            disabled={isProcessing}
            className="group relative px-5 py-2.5 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/50 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2 relative z-10 text-gray-300 group-hover:text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
              Demo: Safe Trade
            </div>
          </button>
          
          <button 
            onClick={() => runSimulation('rogue')}
            disabled={isProcessing}
            className="group relative px-5 py-2.5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/50 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2 relative z-10 text-gray-300 group-hover:text-red-300">
              <ShieldAlert className="w-4 h-4" />
              Demo: Rogue Agent
            </div>
          </button>
        </motion.div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[75vh]">
        
        <motion.section 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 to-transparent"></div>
          <h2 className="text-lg font-medium mb-5 text-gray-100 flex items-center">
            <Activity className="w-5 h-5 text-blue-400 mr-3" />
            Agent Brain
          </h2>
          
          <div className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
            <AnimatePresence>
              {logs.map((log, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  className={`p-4 rounded-xl text-sm border backdrop-blur-sm ${
                    log.role === 'System' ? 'bg-white/5 border-white/5 text-gray-400' :
                    log.type === 'intent' ? 'bg-blue-500/10 border-blue-500/20 text-blue-100' :
                    log.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-100' :
                    log.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100' :
                    'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5 opacity-70">
                    <span className="font-semibold text-xs tracking-wide uppercase">{log.role}</span>
                  </div>
                  <p className="font-mono text-[13px] leading-relaxed">{log.content}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isProcessing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-blue-400/70 text-xs font-mono p-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Generating MCP payload...
              </motion.div>
            )}
          </div>
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 to-transparent"></div>
          <h2 className="text-lg font-medium mb-8 text-gray-100 flex items-center">
            <Server className="w-5 h-5 text-emerald-400 mr-3" />
            AgentARC Pipeline
          </h2>
          
          <div className="flex-grow flex flex-col justify-center space-y-4 px-2 lg:px-6 relative">
            <div className="absolute left-8 lg:left-12 top-10 bottom-10 w-0.5 bg-white/5 z-0"></div>

            {stages.map((stage) => {
              const conf = getStatusConfig(stage.status);
              return (
                <motion.div 
                  key={stage.id} 
                  layout
                  className={`relative z-10 flex items-start gap-4 transition-all duration-500`}
                >
                  <div className={`mt-1 w-8 h-8 shrink-0 rounded-full border flex items-center justify-center transition-all duration-500 ${conf.bg} ${conf.border} ${conf.glow}`}>
                    {stage.status === 'success' && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                    {stage.status === 'error' && <div className="w-2 h-2 rounded-full bg-red-400" />}
                    {stage.status === 'warning' && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                    {stage.status === 'pending' && <div className="w-2 h-2 rounded-full bg-gray-600" />}
                  </div>
                  
                  <div className={`flex-grow border rounded-xl p-4 transition-all duration-500 ${conf.bg} ${conf.border} ${stage.status !== 'pending' ? 'backdrop-blur-sm' : ''}`}>
                    <h3 className={`font-medium text-sm transition-colors duration-500 ${stage.status !== 'pending' ? 'text-white' : 'text-gray-400'}`}>
                      {stage.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1.5">{stage.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/50 to-transparent"></div>
          <h2 className="text-lg font-medium mb-6 text-gray-100 flex items-center">
            <Database className="w-5 h-5 text-purple-400 mr-3" />
            Execution & DA Logs
          </h2>
          
          <div className="space-y-6 flex-grow flex flex-col">
            
            <motion.div layout className="flex flex-col gap-2">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50"></div>
                KeeperHub Routing
              </h3>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 min-h-[120px] flex flex-col justify-center transition-all duration-300">
                <AnimatePresence mode="wait">
                  {keeperHub ? (
                    <motion.div 
                      key="active"
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-sm text-gray-400">Status</span>
                        <span className={`text-sm font-medium ${scenarioType === 'safe' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {keeperHub.status}
                        </span>
                      </div>
                      {keeperHub.txHash && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Tx Hash</span>
                          <span className="text-xs font-mono text-gray-300">{keeperHub.txHash}</span>
                        </div>
                      )}
                      {keeperHub.gasSaved && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Optimization</span>
                          <span className="text-xs font-mono text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">{keeperHub.gasSaved}</span>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                     <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center text-gray-600 gap-3">
                      <ChevronRight className="w-6 h-6 opacity-20" />
                      <span className="text-xs font-mono">Awaiting approved payload...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div layout className="flex flex-col gap-2 mt-4">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50"></div>
                0G Storage Audit
              </h3>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 min-h-[120px] flex flex-col justify-center transition-all duration-300 relative overflow-hidden">
                {zeroG && <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl"></div>}
                
                <AnimatePresence mode="wait">
                  {zeroG ? (
                    <motion.div key="active" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 space-y-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-sm text-gray-400">Merkle Root</span>
                        <span className="text-xs font-mono text-orange-300 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">{zeroG.merkleRoot}</span>
                      </div>
                      <div className="pt-1">
                        <span className={`text-xs font-medium flex items-center gap-2 ${scenarioType === 'rogue' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {scenarioType === 'rogue' ? <ShieldAlert className="w-4 h-4"/> : <ShieldCheck className="w-4 h-4"/>}
                          {scenarioType === 'rogue' ? 'Threat Report archived.' : 'Execution log archived.'}
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex flex-col items-center justify-center text-gray-600 gap-3">
                      <Database className="w-6 h-6 opacity-20" />
                      <span className="text-xs font-mono">No DA events logged.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

          </div>
        </motion.section>
      </main>
    </div>
  );
}
