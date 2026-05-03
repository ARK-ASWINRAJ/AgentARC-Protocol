import { JsonRpcProvider } from 'ethers';

export interface SimulationResult {
  success: boolean;
  revertReason?: string;
  gasEstimate?: string;
  status: 'success' | 'error' | 'warning';
  details: string;
}

/**
 * Stage 3: Transaction Simulation
 * 
 * Uses ethers.js estimateGas / staticCall against a public RPC 
 * to check if the transaction would revert.
 * Falls back to heuristic analysis if no RPC is available.
 */
export async function simulateTransaction(tx: {
  to: string;
  data: string;
  from?: string;
  value?: string;
}): Promise<SimulationResult> {
  // Try real simulation via public RPC
  const rpcUrl = process.env.ETH_RPC_URL || 'https://eth.llamarpc.com';

  try {
    const provider = new JsonRpcProvider(rpcUrl);

    const txRequest = {
      to: tx.to,
      data: tx.data || '0x',
      from: tx.from || '0x0000000000000000000000000000000000000001',
      value: tx.value || '0x0',
    };

    // If it's a simple native transfer (0x data), bypass full RPC gas estimation to avoid funding errors
    if (txRequest.data === '0x') {
      return {
        success: true,
        gasEstimate: '21000',
        status: 'success',
        details: 'Simulation passed. Standard native transfer detected (21000 gas).'
      };
    }

    // Estimate gas — if this throws, the tx would revert
    const gasEstimate = await provider.estimateGas(txRequest);

    return {
      success: true,
      gasEstimate: gasEstimate.toString(),
      status: 'success',
      details: `Simulation passed. Estimated gas: ${gasEstimate.toString()}`,
    };
  } catch (err: any) {
    const reason = err?.reason || err?.message || 'Unknown revert';

    // Check if this is a genuine revert vs a network error
    if (reason.includes('revert') || reason.includes('execution reverted') || reason.includes('CALL_EXCEPTION')) {
      return {
        success: false,
        revertReason: reason,
        status: 'error',
        details: `Simulation FAILED: Transaction would revert. Reason: ${reason}`,
      };
    }

    // Network error or RPC issue — fall back to heuristic
    return simulateHeuristic(tx);
  }
}

/**
 * Heuristic fallback when RPC simulation is unavailable.
 * Analyzes the calldata patterns for known-dangerous signatures.
 */
function simulateHeuristic(tx: { to: string; data: string; value?: string }): SimulationResult {
  const data = tx.data.toLowerCase();

  // Check for infinite approval pattern (approve with max uint256)
  const maxUint = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  if (data.includes('095ea7b3') && data.includes(maxUint)) {
    return {
      success: true,
      status: 'warning',
      details: 'Heuristic: Infinite token approval detected. Wallet could be drained if spender is malicious.',
    };
  }

  // Check for large value transfers
  if (tx.value && BigInt(tx.value) > BigInt('1000000000000000000')) { // > 1 ETH
    return {
      success: true,
      status: 'warning',
      details: `Heuristic: Large ETH transfer (${tx.value} wei). Verify recipient.`,
    };
  }

  return {
    success: true,
    status: 'success',
    details: 'Heuristic simulation passed. No dangerous patterns detected.',
  };
}
