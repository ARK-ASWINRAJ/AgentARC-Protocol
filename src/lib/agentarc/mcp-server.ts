import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { runPipeline, safeStringify } from './pipeline';
import type { PipelineResult, StageResult } from './pipeline';

// Re-export pipeline types and functions for convenience
export { runPipeline, safeStringify };
export type { PipelineResult, StageResult };

/**
 * Create the AgentARC MCP Server.
 * 
 * This is the core of the project — a real MCP server that exposes
 * `execute_secure_transaction` as a Tool. Any MCP-compatible agent
 * framework (LangChain, CrewAI, Claude Desktop) can connect to this
 * and get automatic transaction security.
 */
export function createAgentArcMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'AgentARC Protocol',
      version: '2.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
      instructions:
        'AgentARC is a security middleware for autonomous Web3 agents. ' +
        'Use the execute_secure_transaction tool to validate and execute ' +
        'blockchain transactions through a 4-stage security pipeline before signing.',
    }
  );

  // --- Register the core tool ---
  server.tool(
    'execute_secure_transaction',
    'Validates a blockchain transaction through AgentARC\'s 4-stage security pipeline ' +
    '(Intent Analysis → Policy Validation → Simulation → LLM Threat Detection). ' +
    'If approved, routes to KeeperHub for guaranteed execution. ' +
    'If blocked, logs the threat to 0G Storage.',
    {
      to: z.string().describe('The target contract address (0x-prefixed hex string)'),
      calldata: z.string().describe('The encoded function call data (0x-prefixed hex string)'),
      value: z.string().optional().describe('Optional ETH value to send in wei (default: "0")'),
      chain: z.string().optional().describe('Target chain (default: "ethereum"). Supports: ethereum, sepolia, base'),
      model: z.string().optional().describe('LLM model for threat detection. Options: gemini-3.1-pro-preview, claude-3-5-sonnet-20241022, mock'),
    },
    async (args) => {
      try {
        const tx = {
          to: args.to,
          data: args.calldata,
          value: args.value || '0',
          chainId: args.chain === 'sepolia' ? 11155111 : args.chain === 'base' ? 8453 : 1,
        };
        const model = args.model || 'gemini-3.1-pro-preview';

        const result = await runPipeline(tx, model);

        // TODO Phase 2: If approved, submit to KeeperHub
        // TODO Phase 3: Log to 0G Storage

        if (result.approved) {
          return {
            content: [
              {
                type: 'text' as const,
                text: safeStringify(
                  {
                    status: 'approved',
                    message: `Transaction approved: ${result.llmAnalysis.reason}`,
                    stages: result.stages.map((s) => ({ name: s.name, status: s.status, details: s.details })),
                    intent: result.intent.description,
                    keeperHub: { status: 'Pending KeeperHub integration' },
                    zeroG: { status: 'Audit log pending 0G integration' },
                  },
                  2
                ),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text' as const,
                text: safeStringify(
                  {
                    status: 'blocked',
                    message: `Transaction BLOCKED: ${result.llmAnalysis.reason}`,
                    stages: result.stages.map((s) => ({ name: s.name, status: s.status, details: s.details })),
                    intent: result.intent.description,
                    policyErrors: result.policyResult.errors,
                    policyWarnings: result.policyResult.warnings,
                    threatAnalysis: result.llmAnalysis,
                    zeroG: { status: 'Threat report pending 0G integration' },
                  },
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      } catch (error: any) {
        console.error('AgentARC MCP Tool Error:', error.stack || error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `AgentARC internal error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // --- Register a resource for the security policy config ---
  server.resource(
    'security-policy',
    'agentarc://policy/current',
    { description: 'Current AgentARC security policy configuration' },
    async () => ({
      contents: [
        {
          uri: 'agentarc://policy/current',
          mimeType: 'application/json',
          text: safeStringify(
            {
              maxSpendUsdc: 1000,
              blockedAddresses: ['0xbad0000000000000000000000000000000000000'],
              allowlistedProtocols: ['0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'],
              description: 'Default AgentARC security policy. Max spend 1000 USDC. One blocked drainer address. Uniswap V2 Router allowlisted.',
            },
            2
          ),
        },
      ],
    })
  );

  return server;
}
