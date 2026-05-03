import { NextResponse } from 'next/server';
import { Interface } from 'ethers';
import { runPipeline } from '@/lib/agentarc/pipeline';

/**
 * Generate test payloads for the "Rogue Agent Arena" demo.
 * These simulate what an AI agent would send to the MCP tool.
 */
function getMockPayload(type: string) {
  if (type === 'safe') {
    const uniIface = new Interface([
      'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)',
    ]);
    const data = uniIface.encodeFunctionData('swapExactTokensForTokens', [
      50000000,
      0,
      [
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      ],
      '0x1234567890123456789012345678901234567890',
      1900000000,
    ]);
    return {
      to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      data: data,
      chainId: 1,
    };
  } else {
    const erc20Iface = new Interface([
      'function approve(address spender, uint256 amount)',
    ]);
    const data = erc20Iface.encodeFunctionData('approve', [
      '0xbad0000000000000000000000000000000000000',
      '115792089237316195423570985008687907853269984665640564039457584007913129639935',
    ]);
    return {
      to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      data: data,
      chainId: 1,
    };
  }
}

/**
 * POST /api/mcp
 *
 * Runs a transaction through the full AgentARC 4-stage security pipeline.
 *
 * Request body:
 *   - type: 'safe' | 'rogue' (selects demo payload)
 *   - model: 'gemini-3.1-pro' | 'claude-3-5-sonnet-20241022' | 'mock' (LLM for Stage 4)
 *
 * This API route runs the SAME pipeline code that the MCP Server exposes
 * via the `execute_secure_transaction` tool — ensuring 1:1 parity.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, model } = body;

    const txPayload = getMockPayload(type);

    // Run the full 4-stage pipeline (shared with MCP server)
    const result = await runPipeline(txPayload, model || 'gemini-3.1-pro');

    if (result.approved) {
      return NextResponse.json({
        success: true,
        message: 'Transaction Approved: ' + result.llmAnalysis.reason,
        stages: result.stages,
        intent: result.intent,
        policyResult: result.policyResult,
        simulation: result.simulation,
        llmAnalysis: result.llmAnalysis,
        // Phase 2 & 3 will populate these with real data
        keeperHub: result.keeperHub || {
          status: 'Pending KeeperHub integration',
          txHash: null,
          gasSaved: null,
        },
        zeroG: result.zeroG || {
          merkleRoot: null,
          status: 'Audit log pending 0G integration',
        },
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Transaction Blocked: ' + result.llmAnalysis.reason,
        stages: result.stages,
        intent: result.intent,
        policyResult: result.policyResult,
        simulation: result.simulation,
        llmAnalysis: result.llmAnalysis,
        keeperHub: { status: 'Rejected by AgentARC — Transaction Blocked' },
        zeroG: result.zeroG || {
          merkleRoot: null,
          status: 'Threat report pending 0G integration',
        },
      });
    }
  } catch (error) {
    console.error('AgentARC Pipeline Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(error) },
      { status: 500 }
    );
  }
}
