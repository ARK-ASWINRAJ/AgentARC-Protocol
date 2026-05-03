"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Activity, Database, Server, ChevronRight, Zap, Cpu, FileCode, Clock, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Typewriter component for the "Agent Thinking" animation
const TypewriterText = ({ text, delay = 0, speed = 30 }: { text: string, delay?: number, speed?: number }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const startTyping = () => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedText(text.substring(0, i));
        i++;
        if (i > text.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    };

    if (delay > 0) {
      timeout = setTimeout(startTyping, delay);
      return () => clearTimeout(timeout);
    } else {
      return startTyping();
    }
  }, [text, delay, speed]);

  return <span>{displayedText}</span>;
};

export default function Dashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scenarioType, setScenarioType] = useState<'idle' | 'safe' | 'rogue'>('idle');
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro');
  const [logs, setLogs] = useState<{role: string, content: string, type?: string}[]>([
    { role: "System", content: "AgentARC v2 Initialized. Awaiting MCP connection..." }
  ]);
  const [historyLogs, setHistoryLogs] = useState<{time: string, type: string, hash: string}[]>([]);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  
  const [stages, setStages] = useState([
    { id: 1, name: "Stage 1: Intent Analysis", desc: "Parsing calldata & action", status: "pending", details: "" },
    { id: 2, name: "Stage 2: Policy Validation", desc: "Checking spend limits & allowlists", status: "pending", details: "" },
    { id: 3, name: "Stage 3: Transaction Simulation", desc: "Tenderly sandbox execution", status: "pending", details: "" },
    { id: 4, name: "Stage 4: Threat Detection", desc: "LLM Honeypot & risk analysis", status: "pending", details: "" },
  ]);

  const [keeperHub, setKeeperHub] = useState<any>(null);
  const [zeroG, setZeroG] = useState<any>(null);

  const runSimulation = async (type: 'safe' | 'rogue') => {
    setIsProcessing(true);
    setScenarioType(type);
    setKeeperHub(null);
    setZeroG(null);
    setShowBlockedModal(false);
    setTransactionDetails(null);
    
    setStages(stages.map(s => ({ ...s, status: 'pending' })));

    const intentPayload = type === 'safe' 
      ? "Execute Swap: 50 USDC -> WETH (Uniswap V3)"
      : "URGENT: Approve 0xBAD...DRAINER to spend infinite USDC";
      
    setLogs(prev => [...prev, { role: "Agent", content: intentPayload, type: "intent" }]);

    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: intentPayload, type, model: selectedModel })
      });
      
      const data = await res.json();
      setTransactionDetails(data);

      for (let i = 0; i < data.stages.length; i++) {
        await new Promise(r => setTimeout(r, 600)); 
        setStages(prev => {
          const newStages = [...prev];
          newStages[i].status = data.stages[i].status;
          newStages[i].details = data.stages[i].details;
          return newStages;
        });
        
        if (data.stages[i].status === 'error') break;
      }

      setTimeout(() => {
        setKeeperHub(data.keeperHub);
        setZeroG(data.zeroG);
        setLogs(prev => [...prev, { role: "AgentARC", content: data.message, type: data.success ? "success" : "error" }]);
        setIsProcessing(false);
        
        if (!data.success) {
          setShowBlockedModal(true);
        }

        const now = new Date();
        setHistoryLogs(prev => [{
          time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
          type: type.toUpperCase(),
          hash: data.success ? (data.keeperHub?.txHash || 'Pending') : 'BLOCKED'
        }, ...prev].slice(0, 5));

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
    <div className="min-h-screen bg-[#030712] text-gray-200 p-4 md:p-8 font-sans bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] relative">
      
      {/* Full Screen Blocked Modal */}
      <AnimatePresence>
        {showBlockedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 100 }}
              className="bg-[#0f0f0f] border-2 border-red-500/50 rounded-2xl p-8 flex flex-col items-center shadow-[0_0_100px_rgba(239,68,68,0.3)] max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-orange-500"></div>
              <ShieldAlert className="w-20 h-20 text-red-500 mb-4 animate-pulse" />
              <h2 className="text-3xl font-bold text-red-500 mb-2 tracking-wide">THREAT DETECTED</h2>
              <p className="text-gray-300 text-center mb-6">
                Transaction automatically blocked. Honeypot/Drainer identified.
              </p>
              
              <div className="w-full bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                 <p className="text-sm font-mono text-red-300 line-clamp-3">
                   {transactionDetails?.message || "Critical policy violation."}
                 </p>
              </div>

              <button 
                onClick={() => setShowBlockedModal(false)}
                className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/50 transition-colors font-medium w-full"
              >
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-10 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-white/5 pb-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
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
          className="flex flex-col md:flex-row gap-4 items-center w-full xl:w-auto"
        >
          <div className="flex items-center gap-2 bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm w-full md:w-auto">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isProcessing}
              className="bg-transparent text-gray-300 font-medium focus:outline-none cursor-pointer disabled:opacity-50 w-full"
            >
              <optgroup label="Google Models" className="bg-[#0a0a0a]">
                <option value="gemini-3.1-pro">Gemini 3.1 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </optgroup>
              <optgroup label="Anthropic Models" className="bg-[#0a0a0a]">
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
              </optgroup>
              <optgroup label="Testing" className="bg-[#0a0a0a]">
                <option value="mock">Local Mock Engine</option>
              </optgroup>
            </select>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={() => runSimulation('safe')}
              disabled={isProcessing}
              className="flex-1 md:flex-none relative px-6 py-2.5 bg-[#0f0f0f] hover:bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center justify-center gap-2 relative z-10 text-emerald-100 group-hover:text-emerald-300">
                <ShieldCheck className="w-4 h-4" />
                Safe Trade
              </div>
            </button>
            
            <button 
              onClick={() => runSimulation('rogue')}
              disabled={isProcessing}
              className="flex-1 md:flex-none relative px-6 py-2.5 bg-[#0f0f0f] hover:bg-red-500/10 border border-red-500/30 hover:border-red-500/60 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center justify-center gap-2 relative z-10 text-red-100 group-hover:text-red-300">
                <ShieldAlert className="w-4 h-4" />
                Rogue Agent
              </div>
            </button>
          </div>
        </motion.div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[75vh]">
        
        {/* Left Column: Agent Brain & History */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <motion.section 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 flex flex-col shadow-xl relative overflow-hidden h-[400px]"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <h2 className="text-lg font-medium mb-4 text-gray-100 flex items-center">
              <Activity className="w-5 h-5 text-indigo-400 mr-3" />
              Agent Brain
            </h2>
            
            <div className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
              <AnimatePresence>
                {logs.map((log, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    className={`p-3.5 rounded-xl text-[13px] border ${
                      log.role === 'System' ? 'bg-[#151515] border-white/5 text-gray-400' :
                      log.type === 'intent' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200' :
                      log.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-200' :
                      log.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' :
                      'bg-[#151515] border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 opacity-70">
                      <span className="font-semibold text-[11px] tracking-wide uppercase">{log.role}</span>
                    </div>
                    <p className="font-mono leading-relaxed">
                      {idx === logs.length - 1 && isProcessing ? (
                        <TypewriterText text={log.content} speed={20} />
                      ) : (
                        log.content
                      )}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isProcessing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-indigo-400/70 text-xs font-mono p-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  Generating MCP payload...
                </motion.div>
              )}
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 flex flex-col shadow-xl relative overflow-hidden flex-grow"
          >
             <h2 className="text-sm font-medium mb-4 text-gray-400 flex items-center uppercase tracking-wider">
              <Clock className="w-4 h-4 mr-2" />
              History
            </h2>
            <div className="space-y-3">
              {historyLogs.length === 0 ? (
                <div className="text-xs text-gray-600 font-mono">No history yet.</div>
              ) : (
                historyLogs.map((h, i) => (
                  <div key={i} className="flex flex-col gap-1 p-2 bg-[#151515] rounded border border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500">{h.time}</span>
                      <span className={`text-[10px] font-bold ${h.type === 'SAFE' ? 'text-emerald-500' : 'text-red-500'}`}>{h.type}</span>
                    </div>
                    <span className="text-xs font-mono text-gray-400 truncate">{h.hash}</span>
                  </div>
                ))
              )}
            </div>
          </motion.section>
        </div>

        {/* Middle Column: Pipeline */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-5 bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 lg:p-8 flex flex-col shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
          <h2 className="text-xl font-medium mb-8 text-gray-100 flex items-center">
            <Server className="w-6 h-6 text-emerald-400 mr-3" />
            AgentARC Pipeline
          </h2>
          
          <div className="flex-grow flex flex-col justify-center space-y-6 relative">
            <div className="absolute left-8 lg:left-12 top-10 bottom-10 w-0.5 bg-gradient-to-b from-white/10 via-white/5 to-transparent z-0"></div>

            {stages.map((stage) => {
              const conf = getStatusConfig(stage.status);
              return (
                <motion.div 
                  key={stage.id} 
                  layout
                  className={`relative z-10 flex items-start gap-4 lg:gap-6 transition-all duration-500`}
                >
                  <div className={`mt-2 w-10 h-10 shrink-0 rounded-full border flex items-center justify-center transition-all duration-500 bg-[#0f0f0f] ${conf.border} ${conf.glow}`}>
                    {stage.status === 'success' && <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />}
                    {stage.status === 'error' && <div className="w-3 h-3 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]" />}
                    {stage.status === 'warning' && <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />}
                    {stage.status === 'pending' && <div className="w-3 h-3 rounded-full bg-gray-700" />}
                  </div>
                  
                  <div className={`flex-grow border rounded-xl p-4 lg:p-5 transition-all duration-500 ${conf.bg} ${conf.border}`}>
                    <h3 className={`font-medium text-[15px] transition-colors duration-500 ${stage.status !== 'pending' ? 'text-white' : 'text-gray-400'}`}>
                      {stage.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1.5">{stage.desc}</p>
                    
                    {/* Expandable details when error or warning */}
                    <AnimatePresence>
                      {stage.status !== 'pending' && stage.details && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                          className="overflow-hidden"
                        >
                          <div className={`text-xs font-mono p-2 rounded ${
                            stage.status === 'error' ? 'bg-red-500/10 text-red-300' : 
                            stage.status === 'warning' ? 'bg-amber-500/10 text-amber-300' :
                            'bg-emerald-500/10 text-emerald-300'
                          }`}>
                            {stage.details}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Right Column: Execution & Tx Details */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <motion.section 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 flex flex-col shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <h2 className="text-lg font-medium mb-4 text-gray-100 flex items-center">
              <Database className="w-5 h-5 text-purple-400 mr-3" />
              Execution Layer
            </h2>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                  KeeperHub Routing
                </h3>
                <div className="bg-[#151515] border border-white/5 rounded-xl p-4 min-h-[110px] flex flex-col justify-center transition-all duration-300">
                  <AnimatePresence mode="wait">
                    {keeperHub ? (
                      <motion.div 
                        key="active"
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="space-y-2.5"
                      >
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-xs text-gray-400">Status</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${scenarioType === 'safe' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {keeperHub.status}
                          </span>
                        </div>
                        {keeperHub.txHash && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Tx Hash</span>
                            <span className="text-[11px] font-mono text-gray-300 bg-white/5 px-2 py-1 rounded">{keeperHub.txHash.slice(0,10)}...{keeperHub.txHash.slice(-8)}</span>
                          </div>
                        )}
                        {keeperHub.gasSaved && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Gas Saved</span>
                            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">{keeperHub.gasSaved}</span>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                       <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center text-gray-600 gap-2">
                        <Server className="w-5 h-5 opacity-20" />
                        <span className="text-[11px] font-mono">Awaiting approved payload...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  0G Storage Audit
                </h3>
                <div className="bg-[#151515] border border-white/5 rounded-xl p-4 min-h-[110px] flex flex-col justify-center transition-all duration-300 relative overflow-hidden">
                  {zeroG && <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>}
                  
                  <AnimatePresence mode="wait">
                    {zeroG ? (
                      <motion.div key="active" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-xs text-gray-400">Merkle Root</span>
                          <span className="text-[10px] font-mono text-orange-300 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                            {zeroG.merkleRoot ? `${zeroG.merkleRoot.slice(0, 14)}...` : 'Failed'}
                          </span>
                        </div>
                        <div className="pt-1 flex items-center justify-between">
                          <span className={`text-[11px] font-medium flex items-center gap-1.5 ${scenarioType === 'rogue' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {scenarioType === 'rogue' ? <ShieldAlert className="w-3.5 h-3.5"/> : <ShieldCheck className="w-3.5 h-3.5"/>}
                            {scenarioType === 'rogue' ? 'Threat archived' : 'Execution archived'}
                          </span>
                          <a href="#" className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                            Explorer <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex flex-col items-center justify-center text-gray-600 gap-2">
                        <Database className="w-5 h-5 opacity-20" />
                        <span className="text-[11px] font-mono">No DA events logged.</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 flex flex-col shadow-xl flex-grow"
          >
             <h2 className="text-lg font-medium mb-4 text-gray-100 flex items-center">
              <FileCode className="w-5 h-5 text-gray-400 mr-3" />
              Tx Context
            </h2>
            {transactionDetails?.intent ? (
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Action</span>
                  <p className="text-sm text-gray-300 mt-1">{transactionDetails.intent.description}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Target Contract</span>
                  <p className="text-[11px] font-mono text-gray-400 mt-1 bg-[#151515] p-2 rounded border border-white/5 break-all">
                    {transactionDetails.intent.parsed?.args?.[0] || '0x...'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center text-gray-600">
                <span className="text-xs font-mono">No transaction context</span>
              </div>
            )}
          </motion.section>
        </div>
      </main>
    </div>
  );
}
