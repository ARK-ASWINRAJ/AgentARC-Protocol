/**
 * AgentARC MCP Server — End-to-End Test
 * 
 * This script creates the real MCP server, connects a client via InMemoryTransport,
 * and calls the `execute_secure_transaction` tool with both safe and rogue payloads.
 * 
 * Usage: npx tsx src/lib/agentarc/test-mcp.ts
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createAgentArcMcpServer } from './mcp-server.js';
import { Interface } from 'ethers';

async function main() {
  console.log('\n🛡️  AgentARC MCP Server — End-to-End Test\n');
  console.log('='.repeat(60));

  // 1. Create the MCP Server
  const mcpServer = createAgentArcMcpServer();

  // 2. Create an MCP Client
  const client = new Client(
    { name: 'Test Agent', version: '1.0.0' },
    { capabilities: {} }
  );

  // 3. Connect via InMemoryTransport (no network needed)
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([
    client.connect(clientTransport),
    mcpServer.connect(serverTransport),
  ]);

  console.log('✅ MCP Client ↔ Server connected via InMemoryTransport\n');

  // 4. List available tools
  const tools = await client.listTools();
  console.log('📋 Available MCP Tools:');
  for (const tool of tools.tools) {
    console.log(`   • ${tool.name}: ${tool.description?.slice(0, 80)}...`);
  }
  console.log();

  // 5. List available resources
  const resources = await client.listResources();
  console.log('📋 Available MCP Resources:');
  for (const resource of resources.resources) {
    console.log(`   • ${resource.name} (${resource.uri})`);
  }
  console.log();

  // ── TEST 1: Safe Transaction ──────────────────────────────────
  console.log('='.repeat(60));
  console.log('🟢 TEST 1: Safe Uniswap Swap (should be APPROVED)');
  console.log('='.repeat(60));

  const uniIface = new Interface([
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)',
  ]);
  const safeCalldata = uniIface.encodeFunctionData('swapExactTokensForTokens', [
    50000000, 0,
    ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'],
    '0x1234567890123456789012345678901234567890',
    1900000000,
  ]);

  const safeResult = await client.callTool({
    name: 'execute_secure_transaction',
    arguments: {
      to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      calldata: safeCalldata,
      model: 'mock',
    },
  });

  const safeResultText = (safeResult.content as any)[0].text;
  console.log('\n   Raw result:', safeResultText.slice(0, 200));
  
  let safeData: any;
  try {
    safeData = JSON.parse(safeResultText);
  } catch {
    console.log('   ⚠️ Result is not JSON, raw output:', safeResultText);
    safeData = { status: 'error', message: safeResultText, stages: [] };
  }
  console.log(`\n   Status: ${safeData.status}`);
  console.log(`   Message: ${safeData.message}`);
  console.log('   Stages:');
  for (const stage of safeData.stages) {
    const icon = stage.status === 'success' ? '✅' : stage.status === 'warning' ? '⚠️' : '❌';
    console.log(`     ${icon} ${stage.name}: ${stage.status}`);
  }
  console.log();

  // ── TEST 2: Rogue Transaction ─────────────────────────────────
  console.log('='.repeat(60));
  console.log('🔴 TEST 2: Rogue Infinite Approve to Drainer (should be BLOCKED)');
  console.log('='.repeat(60));

  const erc20Iface = new Interface(['function approve(address spender, uint256 amount)']);
  const rogueCalldata = erc20Iface.encodeFunctionData('approve', [
    '0xbad0000000000000000000000000000000000000',
    '115792089237316195423570985008687907853269984665640564039457584007913129639935',
  ]);

  const rogueResult = await client.callTool({
    name: 'execute_secure_transaction',
    arguments: {
      to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      calldata: rogueCalldata,
      model: 'mock',
    },
  });

  const rogueResultText = (rogueResult.content as any)[0].text;
  let rogueData: any;
  try {
    rogueData = JSON.parse(rogueResultText);
  } catch {
    console.log('   ⚠️ Result is not JSON, raw output:', rogueResultText);
    rogueData = { status: 'error', message: rogueResultText, stages: [] };
  }
  console.log(`\n   Status: ${rogueData.status}`);
  console.log(`   Message: ${rogueData.message}`);
  console.log('   Stages:');
  for (const stage of rogueData.stages) {
    const icon = stage.status === 'success' ? '✅' : stage.status === 'warning' ? '⚠️' : '❌';
    console.log(`     ${icon} ${stage.name}: ${stage.status}`);
  }
  if (rogueData.policyErrors) {
    console.log('   Policy Errors:', rogueData.policyErrors.join(', '));
  }
  console.log();

  // ── TEST 3: Read Security Policy Resource ─────────────────────
  console.log('='.repeat(60));
  console.log('📖 TEST 3: Read Security Policy Resource');
  console.log('='.repeat(60));

  const policyResource = await client.readResource({ uri: 'agentarc://policy/current' });
  const policyData = JSON.parse((policyResource.contents as any)[0].text);
  console.log('\n   Policy:', JSON.stringify(policyData, null, 4).split('\n').map(l => `   ${l}`).join('\n'));
  console.log();

  // ── Summary ───────────────────────────────────────────────────
  console.log('='.repeat(60));
  const test1Pass = safeData.status === 'approved';
  const test2Pass = rogueData.status === 'blocked';
  console.log(`\n   Test 1 (Safe): ${test1Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Test 2 (Rogue): ${test2Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Test 3 (Resource): ✅ PASS`);
  console.log(`\n   Overall: ${test1Pass && test2Pass ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
  console.log('='.repeat(60));

  // Cleanup
  await client.close();
  await mcpServer.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
