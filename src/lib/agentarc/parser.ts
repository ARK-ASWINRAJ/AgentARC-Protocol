import { Interface, parseUnits } from 'ethers';

// Standard ABIs for parsing
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

const UNISWAP_V2_ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)"
];

const erc20Interface = new Interface(ERC20_ABI);
const uniswapInterface = new Interface(UNISWAP_V2_ROUTER_ABI);

export const POLICIES = {
  MAX_SPEND_USDC: parseUnits("1000", 6), // Max 1000 USDC
  BLOCKED_ADDRESSES: [
    "0xbad0000000000000000000000000000000000000" // Updated to valid hex
  ],
  ALLOWLISTED_PROTOCOLS: [
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D".toLowerCase() // Uniswap V2 Router
  ]
};

export function analyzeIntent(tx: { to: string, data: string }) {
  let parsed: any = { type: 'unknown', details: null };
  let description = "Unknown transaction";

  try {
    const erc20Tx = erc20Interface.parseTransaction(tx);
    if (erc20Tx) {
      parsed = { type: 'erc20', name: erc20Tx.name, args: erc20Tx.args };
      description = "ERC20 " + erc20Tx.name + " to " + erc20Tx.args[0];
      return { parsed, description, success: true };
    }
  } catch (e) {}

  try {
    const uniTx = uniswapInterface.parseTransaction(tx);
    if (uniTx) {
      parsed = { type: 'dex', name: uniTx.name, args: uniTx.args };
      description = "DEX Swap: " + uniTx.name;
      return { parsed, description, success: true };
    }
  } catch (e) {}

  return { parsed, description, success: true };
}

export function validatePolicy(tx: { to: string, data: string }, parsedIntent: any) {
  const warnings: string[] = [];
  const errors: string[] = [];
  const targetAddress = tx.to.toLowerCase();

  if (POLICIES.BLOCKED_ADDRESSES.includes(targetAddress)) {
    errors.push("Target address is on the global denylist (Known Drainer).");
  } else if (!POLICIES.ALLOWLISTED_PROTOCOLS.includes(targetAddress) && parsedIntent.type !== 'erc20') {
    warnings.push("Target contract is not on the verified protocol allowlist.");
  }

  if (parsedIntent.type === 'erc20' && parsedIntent.name === 'approve') {
    const spender = parsedIntent.args[0].toLowerCase();
    const amount = parsedIntent.args[1];

    if (POLICIES.BLOCKED_ADDRESSES.includes(spender)) {
      errors.push("Spender address is on the global denylist!");
    } else if (!POLICIES.ALLOWLISTED_PROTOCOLS.includes(spender)) {
      warnings.push("Approving an unknown contract to spend tokens.");
    }

    if (amount >= parseUnits("1000000", 6)) {
      warnings.push("Infinite or dangerously high token approval requested.");
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors
  };
}
