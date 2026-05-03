# AgentARC  Protocol

A verifiable, plug-and-play security middleware for autonomous Web3 AI agents.

## The Problem

"Human-in-the-Loop Governance" and "circuit breakers" are critical unsolved problems for autonomous AI agents operating on-chain. When agents execute transactions (e.g. trading, interacting with smart contracts), there is no safety net if the agent hallucinations or is tricked into interacting with a malicious contract (e.g. honeypots, drainers). 

## The Solution

**AgentARC** solves this by acting as a universal, framework-agnostic safety layer. When an AI agent (built in LangChain, CrewAI, Claude Desktop, etc.) wants to execute a blockchain transaction, it does *not* sign it directly. Instead, it calls the **AgentARC MCP Server**, which runs the transaction through a rigorous **4-stage pre-signature validation pipeline**.

If the transaction is safe, it's routed to **KeeperHub** for guaranteed execution. If it is rogue or a threat is detected, it is immediately blocked and an immutable threat report is saved to **0G Storage**.

## Architecture: The 4-Stage Security Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANY AGENT FRAMEWORK                          │
│            (LangChain / CrewAI / Claude Desktop)                │
│                                                                 │
│  Agent decides: "Swap 50 USDC for WETH on Uniswap"             │
│  Agent calls MCP Tool: execute_secure_transaction()             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ MCP Tool Call
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AGENTARC MCP SERVER                           │
│                                                                 │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐ │
│  │ Stage 1   │──▶│ Stage 2   │──▶│ Stage 3   │──▶│ Stage 4   │ │
│  │ Intent    │   │ Policy    │   │ Simulate  │   │ LLM       │ │
│  │ Parser    │   │ Engine    │   │ (ethers)  │   │ Auditor   │ │
│  └───────────┘   └───────────┘   └───────────┘   └─────┬─────┘ │
│                                                         │       │
│                                    ┌────────────────────┤       │
│                                    │                    │       │
│                              ✅ SAFE              🚫 BLOCKED   │
│                                    │                    │       │
│                                    ▼                    ▼       │
│                            ┌─────────────┐    ┌──────────────┐  │
│                            │ KeeperHub   │    │ 0G Storage   │  │
│                            │ Direct Exec │    │ Threat Report│  │
│                            │ API         │    │ Upload       │  │
│                            └──────┬──────┘    └──────┬───────┘  │
│                                   │                  │          │
└───────────────────────────────────┼──────────────────┼──────────┘
                                    │                  │
                                    ▼                  ▼
                              ┌──────────┐      ┌──────────┐
                              │ txHash   │      │ Merkle   │
                              │ gasSaved │      │ Root     │
                              └──────────┘      └──────────┘
```

### The 4 Stages

1. **Intent Analysis:** Decodes raw EVM calldata into human-readable function calls using ABIs.
2. **Policy Validation:** Checks the parsed action against configurable rules (spend limits, denylists, allowlists).
3. **Transaction Simulation:** Simulates the transaction using `ethers.js` against a public RPC to check for reverts or unexpected token drainage.
4. **LLM Threat Detection:** A secondary security LLM (e.g. Gemini 3.1 Pro Preview, Claude 3.5 Sonnet) acts as an auditor to analyze the context for honeypots or drainers.

## Sponsor Integrations

- **Model Context Protocol (MCP):** AgentARC exposes its entire pipeline as an MCP Tool (`execute_secure_transaction`), meaning any MCP-compatible framework can immediately plug in and get world-class security with zero code changes.
- **KeeperHub:** Approved transactions are routed to the KeeperHub Direct Execution API, ensuring reliable, gas-optimized transaction processing.
- **0G Storage:** If a transaction is blocked, the threat details, intent, and LLM reasoning are uploaded as an immutable audit log to 0G Storage, producing a verifiable Merkle root.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React, TailwindCSS, Framer Motion
- **Core Security:** Ethers.js v6, Zod, Model Context Protocol (MCP) SDK
- **AI Models:** `@google/generative-ai`, `@anthropic-ai/sdk`
- **Integrations:** KeeperHub API, 0G Storage SDK

## Getting Started

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment Variables
Create a \`.env\` file in the root directory:
\`\`\`env
# AI Provider Keys
GEMINI_API_KEY="..."
ANTHROPIC_API_KEY="..."

# KeeperHub Integration
KEEPERHUB_API_KEY="..."
KEEPERHUB_WALLET_ID="..."

# 0G Storage
ZERO_G_PRIVATE_KEY="..."
ZERO_G_EVM_RPC="https://evmrpc-testnet.0g.ai"
ZERO_G_INDEXER_RPC="https://indexer-storage-testnet-turbo.0g.ai"
\`\`\`
*(Note: If KeeperHub or 0G keys are missing, the protocol will intelligently fallback to local mock responses for demo purposes.)*

### 3. Run the Development Server
\`\`\`bash
npm run dev
\`\`\`
Navigate to `http://localhost:3000` to view the **Rogue Agent Arena** dashboard.

### 4. Test the MCP Server
To run a full end-to-end test of the AgentARC MCP Server without starting the UI:
\`\`\`bash
npm run test:mcp
\`\`\`

## Hackathon Team

- **Developer:** AgentARC Protocol Team (ETHGlobal Open Agents 2026)
