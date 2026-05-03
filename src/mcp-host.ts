import express from "express";
import cors from "cors";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { server } from "./lib/agentarc/mcp-server.js";

const app = express();

app.use(cors());

let transport: SSEServerTransport;

// Endpoint to establish SSE connection
app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  
  // Ensure connection is established
  await server.connect(transport);

  console.log("Client connected via SSE.");

  // Keep connection open
  req.on('close', () => {
    console.log("Client disconnected");
  });
});

// Endpoint to receive messages from the client
app.post("/messages", async (req, res) => {
  if (!transport) {
    return res.status(400).send("SSE connection not established. Connect to /sse first.");
  }
  
  await transport.handlePostMessage(req, res);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`AgentARC MCP Server listening on port ${PORT}`);
  console.log(`SSE Endpoint: http://localhost:${PORT}/sse`);
});
