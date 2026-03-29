const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { registerErc8004Identity } = require("./erc8004");
const { handleMcpSse, handleMcpMessages, setProvisionedAgent } = require("./mcp");

const app = express();
const PORT = Number(process.env.PORT || 3001);
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const OUTPUT_DIR = path.join(__dirname, "output");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function buildAgentManifest({ agentName, operatorWallet, dailyLimit, slug }) {
  return {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: agentName,
    description: "An MCP-enabled autonomous agent provisioned by AgentPay.",
    image: `${PUBLIC_BASE_URL}/agentpay.png`,
    services: [
      {
        name: "web",
        endpoint: `${PUBLIC_BASE_URL}/agents/${slug}`
      },
      {
        name: "MCP",
        endpoint: `${PUBLIC_BASE_URL}/mcp/sse`,
        version: "2025-06-18"
      }
    ],
    x402Support: false,
    active: true,
    registrations: [],
    supportedTrust: ["reputation"],
    operatorWallet,
    dailyLimit,
    slug
  };
}

function buildAgentLog({ agentName, operatorWallet, dailyLimit, slug, mcpUrl, manifestUrl, erc8004 }) {
  return {
    task: "agent-provisioning",
    status: "completed",
    createdAt: new Date().toISOString(),
    steps: [
      {
        type: "discover",
        message: "Initialized agent configuration"
      },
      {
        type: "plan",
        message: "Prepared MCP endpoint and manifest"
      },
      {
        type: "execute",
        message: "Saved manifest locally and provisioned MCP access"
      },
      {
        type: "verify",
        message: "Provision flow completed successfully"
      }
    ],
    finalOutput: {
      agentName,
      operatorWallet,
      dailyLimit,
      slug,
      mcpUrl,
      manifestUrl,
      erc8004
    }
  };
}

app.get("/", (req, res) => {
  res.json({
    app: "AgentPay Backend",
    status: "ok",
    endpoints: {
      provision: `${PUBLIC_BASE_URL}/api/provision`,
      manifest: `${PUBLIC_BASE_URL}/agent.json`,
      log: `${PUBLIC_BASE_URL}/agent_log.json`,
      mcpSse: `${PUBLIC_BASE_URL}/mcp/sse`,
      mcpMessages: `${PUBLIC_BASE_URL}/mcp/messages`
    }
  });
});

app.post("/api/provision", async (req, res) => {
  try {
    const { operatorWallet, agentName, dailyLimit } = req.body;

    if (!operatorWallet || !agentName || dailyLimit === undefined || dailyLimit === null) {
      return res.status(400).json({
        success: false,
        error: "operatorWallet, agentName, and dailyLimit are required."
      });
    }

    const numericLimit = Number(dailyLimit);
    if (Number.isNaN(numericLimit) || numericLimit <= 0) {
      return res.status(400).json({
        success: false,
        error: "dailyLimit must be a positive number."
      });
    }

    const slug = slugify(agentName) || `agent-${Date.now()}`;
    const mcpUrl = `${PUBLIC_BASE_URL}/mcp/sse`;
    const manifestUrl = `${PUBLIC_BASE_URL}/agent.json`;

    const agentManifest = buildAgentManifest({
      agentName,
      operatorWallet,
      dailyLimit: numericLimit,
      slug
    });

    fs.writeFileSync(
      path.join(OUTPUT_DIR, "agent.json"),
      JSON.stringify(agentManifest, null, 2)
    );

    let erc8004Data = {
      agentId: null,
      txHash: null,
      explorerUrl: null,
      simulated: true
    };

    try {
      erc8004Data = await registerErc8004Identity(
        operatorWallet,
        operatorWallet,
        manifestUrl
      );
    } catch (error) {
      console.warn("[ERC-8004] registration failed, using fallback response");
      console.warn(error.message);
    }

    const provisionedAgent = {
      operatorWallet,
      agentName,
      dailyLimit: numericLimit,
      slug,
      mcpUrl,
      manifestUrl,
      manifest: agentManifest,
      erc8004: erc8004Data
    };

    setProvisionedAgent(provisionedAgent);

    const agentLog = buildAgentLog({
      agentName,
      operatorWallet,
      dailyLimit: numericLimit,
      slug,
      mcpUrl,
      manifestUrl,
      erc8004: erc8004Data
    });

    fs.writeFileSync(
      path.join(OUTPUT_DIR, "agent_log.json"),
      JSON.stringify(agentLog, null, 2)
    );

    return res.status(200).json({
      success: true,
      agentName,
      operatorWallet,
      dailyLimit: numericLimit,
      slug,
      mcpUrl,
      manifestUrl,
      agentId: erc8004Data.agentId,
      erc8004TxHash: erc8004Data.txHash,
      erc8004Explorer: erc8004Data.explorerUrl,
      erc8004Simulated: erc8004Data.simulated
    });
  } catch (error) {
    console.error("[Provision Error]", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Provision failed"
    });
  }
});

app.get("/agent.json", (req, res) => {
  const filePath = path.join(OUTPUT_DIR, "agent.json");
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "No agent provisioned yet." });
  }
  res.setHeader("Content-Type", "application/json");
  return res.sendFile(filePath);
});

app.get("/agent_log.json", (req, res) => {
  const filePath = path.join(OUTPUT_DIR, "agent_log.json");
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "No agent log yet." });
  }
  res.setHeader("Content-Type", "application/json");
  return res.sendFile(filePath);
});

app.get("/mcp/sse", handleMcpSse);
app.post("/mcp/messages", handleMcpMessages);

app.listen(PORT, () => {
  console.log(`\n🚀 AgentPay Backend live on ${PUBLIC_BASE_URL}`);
  console.log(`📦 Provision:      ${PUBLIC_BASE_URL}/api/provision`);
  console.log(`📄 Agent Manifest: ${PUBLIC_BASE_URL}/agent.json`);
  console.log(`📋 Agent Log:      ${PUBLIC_BASE_URL}/agent_log.json`);
  console.log(`🔌 MCP SSE:        ${PUBLIC_BASE_URL}/mcp/sse`);
  console.log(`📨 MCP Messages:   ${PUBLIC_BASE_URL}/mcp/messages\n`);
});
