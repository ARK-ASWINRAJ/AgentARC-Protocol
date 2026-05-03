/**
 * 0G Storage Integration
 *
 * This module connects AgentARC to 0G Storage SDK.
 * Threat reports for blocked transactions are uploaded as immutable audit logs.
 */

export interface ZeroGResult {
  status: 'pending' | 'success' | 'failed' | 'mocked' | string;
  merkleRoot?: string;
  txHash?: string;
  error?: string;
}

export async function uploadThreatReport(report: {
  timestamp: string;
  agentId: string;
  intent: string;
  stages: any[];
  verdict: 'approved' | 'blocked';
  reason: string;
}): Promise<ZeroGResult> {
  const privateKey = process.env.ZERO_G_PRIVATE_KEY;
  const evmRpc = process.env.ZERO_G_EVM_RPC;

  // Fallback to mock if API keys are missing (essential for hackathon dev/demo)
  if (!privateKey || !evmRpc) {
    console.log('⚠️ 0G keys missing. Using mock response for storage upload.');
    
    // Simulate some delay for realism in demo
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      status: 'mocked',
      merkleRoot: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };
  }

  try {
    // Dynamic import to prevent client-side Next.js issues if used incorrectly
    const { Indexer, MemData } = await import('@0gfoundation/0g-storage-ts-sdk');
    const { ethers } = await import('ethers');

    const indexerRpc = process.env.ZERO_G_INDEXER_RPC || 'https://indexer-storage-testnet-turbo.0g.ai';
    const provider = new ethers.JsonRpcProvider(evmRpc);
    const signer = new ethers.Wallet(privateKey, provider);
    const indexer = new Indexer(indexerRpc);

    const data = new TextEncoder().encode(JSON.stringify(report, null, 2));
    const memData = new MemData(data);
    const [tree, treeErr] = await memData.merkleTree();
    
    if (treeErr !== null) throw new Error(`Merkle tree error: ${treeErr}`);
    
    const [tx, err] = await indexer.upload(memData, evmRpc, signer);
    if (err !== null) throw new Error(`Upload error: ${err}`);

    let txHashToReturn = '0xUnknownTxHash';
    if (tx) {
        if ('txHash' in tx) {
            txHashToReturn = tx.txHash as string;
        } else if ('txHashes' in tx && Array.isArray((tx as any).txHashes) && (tx as any).txHashes.length > 0) {
            txHashToReturn = (tx as any).txHashes[0];
        } else if (typeof tx === 'string') {
            txHashToReturn = tx;
        }
    }

    return {
      status: 'success',
      merkleRoot: tree && tree.rootHash() ? tree.rootHash()! : '0xUnknownRoot',
      txHash: txHashToReturn
    };
  } catch (error: any) {
    console.error('0G Storage upload failed:', error);
    return {
      status: 'failed',
      error: error.message || String(error),
    };
  }
}
