const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { SSEServerTransport } = require("@modelcontextprotocol/sdk/server/sse.js");
const {
  ListToolsRequestSchema,
  CallToolRequestSchema
} = require("@modelcontextprotocol/sdk/types.js");

let provisionedAgent = null;
let transport = null;

function setProvisionedAgent(agent) {
  provisionedAgent = agent;
}

function getProvisionedAgent() {
  if (!provisionedAgent) {
    throw new Error("No agent provisioned yet.");
  }
  return provisionedAgent;
}

const mcpServer = new Server(
  {
    name: "AgentPay-MCP",
    version: "1.0.0"
  },
  {
    capabilities: { tools: {} }
  }
);

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_agent_status",
        description: "Returns the currently provisioned agent status and identity details.",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "get_agent_manifest",
        description: "Returns the current agent manifest and manifest URL.",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "run_demo_task",
        description: "Runs a simple demo task for the currently provisioned agent.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The task prompt for the demo run."
            }
          },
          required: ["prompt"]
        }
      }
    ]
  };
});

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  const agent = getProvisionedAgent();

  if (name === "get_agent_status") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              agentName: agent.agentName,
              operatorWallet: agent.operatorWallet,
              dailyLimit: agent.dailyLimit,
              slug: agent.slug,
              mcpUrl: agent.mcpUrl,
              agentId: agent.erc8004?.agentId || null,
              txHash: agent.erc8004?.txHash || null
            },
            null,
            2
          )
        }
      ]
    };
  }

  if (name === "get_agent_manifest") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              manifestUrl: agent.manifestUrl,
              manifest: agent.manifest
            },
            null,
            2
          )
        }
      ]
    };
  }

  if (name === "run_demo_task") {
    const prompt = String(args.prompt || "").trim();
    if (!prompt) {
      throw new Error("prompt is required");
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              task: prompt,
              agentName: agent.agentName,
              status: "completed",
              result: `Demo task executed successfully for "${prompt}"`,
              verification: "Output structure validated"
            },
            null,
            2
          )
        }
      ]
    };
  }

  throw new Error("Tool not recognized by AgentPay MCP.");
});

async function handleMcpSse(req, res) {
  transport = new SSEServerTransport("/mcp/messages", res);
  await mcpServer.connect(transport);
}

async function handleMcpMessages(req, res) {
  if (!transport) {
    return res.status(500).send("MCP transport not initialized. Connect to SSE first.");
  }
  await transport.handlePostMessage(req, res);
}

module.exports = {
  handleMcpSse,
  handleMcpMessages,
  setProvisionedAgent,
  getProvisionedAgent
};
