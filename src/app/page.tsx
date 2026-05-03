"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Activity, Database, Server, ChevronRight, Zap, Cpu, FileCode, Clock, ExternalLink, ArrowRight, Lock, CheckCircle } from 'lucide-react';
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

function Dashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scenarioType, setScenarioType] = useState<'idle' | 'safe' | 'rogue'>('idle');
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro-preview');
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
      ? "Execute Transfer: 0.001 Native Token to Dev Wallet"
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
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
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
                            <a href={`https://chainscan-galileo.0g.ai/tx/${keeperHub.txHash}`} target="_blank" rel="noreferrer" className="text-[11px] font-mono text-emerald-400 bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                              {keeperHub.txHash.slice(0,10)}...{keeperHub.txHash.slice(-8)}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
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
                          <a href={zeroG.txHash ? `https://chainscan-galileo.0g.ai/tx/${zeroG.txHash}` : `https://chainscan-galileo.0g.ai`} target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                            0G Explorer <ExternalLink className="w-3 h-3" />
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

function LandingPage({ onDemoClick }: { onDemoClick: () => void }) {
  return (
    <div className="min-h-screen bg-[#030712] text-gray-200 font-sans relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030712] to-[#030712]"></div>
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 lg:px-12 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AgentARC</span>
        </div>
        <button 
          onClick={onDemoClick}
          className="px-6 py-2.5 bg-white hover:bg-gray-200 text-black rounded-full text-sm font-semibold transition-colors"
        >
          See the Demo
        </button>
      </nav>

      <main className="relative z-10 flex flex-col items-center pt-24 pb-32 px-6">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto mb-24"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verifiable Security Layer for Autonomous Agents
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-white leading-tight">
            Stop Rogue AI <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400">Before It Transacts</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            AgentARC is the ultimate middleware security protocol that intercepts, simulates, and audits every transaction an autonomous AI agent attempts to make.
          </p>
          <button 
            onClick={onDemoClick}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-gray-200 rounded-full text-lg font-medium transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          >
            See the Demo 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* How It Works Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-6xl mx-auto"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">How AgentARC Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">A robust 4-stage pipeline ensuring your smart contracts remain safe from hallucinating or malicious AI agents.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
                <Cpu className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">1. Intent Analysis</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                The MCP server intercepts the raw transaction calldata generated by the AI agent and statically analyzes its true intent (e.g., ERC20 transfer, DEX swap).
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors"></div>
              <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">2. Policy Validation</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                We check the transaction against hardcoded organizational limits. Are they spending too much? Is the target contract a known honeypot?
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">3. RPC Simulation</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                The payload is simulated using `ethers.js` against a public Ethereum node. If the transaction would revert, AgentARC catches the error before gas is wasted.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/30 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors"></div>
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mb-6">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">4. Threat Detection</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                All context is fed into an LLM (Gemini/Claude) which acts as the ultimate security auditor, looking for sophisticated phishing or logical exploits.
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 flex items-start gap-5 hover:bg-white/[0.02] transition-colors">
                <div className="w-12 h-12 shrink-0 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center mt-1">
                  <Server className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">KeeperHub Execution</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">If the transaction safely passes all four stages, it is securely relayed to the blockchain through KeeperHub's Direct Execution API.</p>
                </div>
             </div>
             <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 flex items-start gap-5 hover:bg-white/[0.02] transition-colors">
                <div className="w-12 h-12 shrink-0 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center mt-1">
                  <Database className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">0G Storage Audit Logs</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">Regardless of the final verdict, an immutable cryptographic hash of the threat report is stored on the decentralized 0G network for absolute compliance.</p>
                </div>
             </div>
          </div>
        </motion.div>

        {/* The Architecture Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-5xl mx-auto mt-24"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">The AgentARC Flow</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">From an AI's intent to final immutable execution.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-indigo-500/20 via-emerald-500/20 to-orange-500/20 -z-10 transform -translate-y-1/2"></div>
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center w-full md:w-1/4">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4 relative">
                <Cpu className="w-8 h-8 text-indigo-400" />
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full">AI</div>
              </div>
              <h4 className="font-semibold text-white mb-1">Agent Request</h4>
              <p className="text-xs text-gray-400">AI attempts to send funds or call a contract via MCP.</p>
            </div>

            <ChevronRight className="w-6 h-6 text-gray-600 hidden md:block" />
            <div className="w-0.5 h-6 bg-gray-800 md:hidden my-2"></div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center w-full md:w-1/4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <ShieldCheck className="w-8 h-8 text-cyan-400" />
              </div>
              <h4 className="font-semibold text-white mb-1">AgentARC Pipeline</h4>
              <p className="text-xs text-gray-400">Intercepts, simulates, and LLM-audits the payload.</p>
            </div>

            <ChevronRight className="w-6 h-6 text-gray-600 hidden md:block" />
            <div className="w-0.5 h-6 bg-gray-800 md:hidden my-2"></div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center w-full md:w-1/4">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
                <Server className="w-8 h-8 text-purple-400" />
              </div>
              <h4 className="font-semibold text-white mb-1">KeeperHub Relay</h4>
              <p className="text-xs text-gray-400">Secure execution to the blockchain (if approved).</p>
            </div>

            <ChevronRight className="w-6 h-6 text-gray-600 hidden md:block" />
            <div className="w-0.5 h-6 bg-gray-800 md:hidden my-2"></div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center w-full md:w-1/4">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-4">
                <Database className="w-8 h-8 text-orange-400" />
              </div>
              <h4 className="font-semibold text-white mb-1">0G Storage Audit</h4>
              <p className="text-xs text-gray-400">Cryptographic hash posted for immutable compliance.</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function App() {
  const [showDemo, setShowDemo] = useState(false);
  return showDemo ? <Dashboard /> : <LandingPage onDemoClick={() => setShowDemo(true)} />;
}
