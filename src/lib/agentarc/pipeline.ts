import { analyzeIntent, validatePolicy } from './parser';
import { simulateTransaction, type SimulationResult } from './simulator';
import { detectThreatLLM } from './llm';
import { submitToKeeperHub } from './keeperhub';
import { uploadThreatReport } from './zero-g';

/**
 * BigInt-safe JSON serializer. Ethers.js v6 returns BigInt values
 * which cause 'Do not know how to serialize a BigInt' with JSON.stringify.
 */
export function safeStringify(obj: any, indent?: number): string {
  return JSON.stringify(obj, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value,
    indent
  );
}

/**
 * Stage result passed to the frontend for pipeline visualization.
 */
export interface StageResult {
  id: number;
  name: string;
  status: 'pending' | 'success' | 'warning' | 'error';
  details?: string;
}

/**
 * The full result of running a transaction through the AgentARC pipeline.
 */
export interface PipelineResult {
  approved: boolean;
  stages: StageResult[];
  intent: {
    parsed: any;
    description: string;
  };
  policyResult: {
    valid: boolean;
    warnings: string[];
    errors: string[];
  };
  simulation: SimulationResult;
  llmAnalysis: {
    isThreat: boolean;
    confidence: number;
    reason: string;
  };
  keeperHub?: any;
  zeroG?: any;
}

/**
 * Run the 4-stage AgentARC security pipeline on a transaction.
 * 
 * This is the core engine shared by both the MCP Server tool
 * and the Next.js API route — ensuring 1:1 parity.
 */
export async function runPipeline(
  tx: any, 
  model: string = 'gemini-3.1-pro-preview'
): Promise<PipelineResult> {
  // --- Stage 1: Intent Analysis ---
  const intentResult = analyzeIntent(tx);

  // --- Stage 2: Policy Validation ---
  const policyResult = validatePolicy(tx, intentResult.parsed);
  const stage2Status = policyResult.valid
    ? policyResult.warnings.length > 0
      ? 'warning'
      : 'success'
    : 'error';

  // --- Stage 3: Transaction Simulation ---
  const simulation = await simulateTransaction(tx);

  // --- Stage 4: LLM Threat Detection ---
  const allWarnings = [
    ...policyResult.warnings,
    ...policyResult.errors,
    ...(simulation.status !== 'success' ? [simulation.details] : []),
  ];

  const llmAnalysis: any = await detectThreatLLM(
    {
      to: tx.to,
      intent: intentResult.description,
      parsedArgs: intentResult.parsed?.args,
      simulationResult: simulation.details,
    },
    allWarnings,
    model
  );

  const isBlocked = !policyResult.valid || llmAnalysis?.isThreat;

  const stages: StageResult[] = [
    { id: 1, name: 'Stage 1: Intent Analysis', status: 'success', details: intentResult.description },
    { id: 2, name: 'Stage 2: Policy Validation', status: stage2Status as StageResult['status'], details: [...policyResult.warnings, ...policyResult.errors].join('; ') || 'All policies passed' },
    { id: 3, name: 'Stage 3: Transaction Simulation', status: simulation.status, details: simulation.details },
    { id: 4, name: 'Stage 4: Threat Detection', status: llmAnalysis?.isThreat ? 'error' : 'success', details: llmAnalysis?.reason || 'No threats detected' },
  ];

  let keeperHubResult;
  let zeroGResult;

  if (!isBlocked) {
    // Phase 2: If safe, route to KeeperHub for execution
    keeperHubResult = await submitToKeeperHub({
      to: tx.to,
      data: tx.data,
      value: tx.value || '0',
      chainId: tx.chainId || 1,
    });
  } else {
    // Phase 3: If blocked, upload threat report to 0G Storage
    zeroGResult = await uploadThreatReport({
      timestamp: new Date().toISOString(),
      agentId: 'agentarc-demo-agent',
      intent: intentResult.description,
      stages,
      verdict: 'blocked',
      reason: llmAnalysis?.reason || 'Unknown',
    });
  }

  // Sanitize the result to convert any BigInt values to strings
  // (ethers.js v6 returns BigInt which JSON.stringify can't handle)
  const rawResult = {
    approved: !isBlocked,
    stages,
    intent: { parsed: intentResult.parsed, description: intentResult.description },
    policyResult,
    simulation,
    llmAnalysis: {
      isThreat: llmAnalysis?.isThreat ?? false,
      confidence: llmAnalysis?.confidence ?? 0,
      reason: llmAnalysis?.reason ?? 'Unknown',
    },
    keeperHub: keeperHubResult,
    zeroG: zeroGResult,
  };

  return JSON.parse(safeStringify(rawResult));
}
