import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createAgentArcMcpServer } from "./mcp-server";

// Note: In a production Vercel environment, edge functions/lambdas are stateless.
// For a robust production SSE implementation, you need a long-running container (like Docker)
// or an external state store. This in-memory map will work well for local Next.js dev
// and low-traffic hackathon demos where the same Lambda remains warm.

export const transports = new Map<string, SSEServerTransport>();
export const server = createAgentArcMcpServer();
