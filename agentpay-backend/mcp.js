const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { SSEServerTransport } = require("@modelcontextprotocol/sdk/server/sse.js");
const { ListToolsRequestSchema, CallToolRequestSchema } = require("@modelcontextprotocol/sdk/types.js");

// 1. Initialize the MCP Server
const mcpServer = new Server({
    name: "AgentPay-Node",
    version: "1.0.0"
}, {
    capabilities: { tools: {} }
});

// 2. Define the Tools Claude is allowed to use
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "pay_x402_invoice",
                description: "Pays an x402 HTTP invoice using the agent's Lit Protocol wallet to access premium API data.",
                inputSchema: {
                    type: "object",
                    properties: {
                        targetUrl: { type: "string", description: "The API endpoint demanding payment" },
                        amountUSDC: { type: "number", description: "The amount of USDC required" }
                    },
                    required: ["targetUrl", "amountUSDC"]
                }
            },
            {
                name: "check_wallet_balance",
                description: "Checks the remaining daily USDC spend limit for the agent.",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                }
            }
        ]
    };
});

// 3. Execute the Tools when Claude calls them
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "pay_x402_invoice") {
        console.log(`🤖 Claude requested to pay ${args.amountUSDC} USDC to ${args.targetUrl}`);
        
        // TODO: This is where we will call Lit Protocol to actually sign the USDC transfer
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating blockchain TX

        return {
            content: [{ 
                type: "text", 
                text: `SUCCESS: Authorized payment of ${args.amountUSDC} USDC via Lit Action. Access to ${args.targetUrl} granted.` 
            }]
        };
    }

    if (name === "check_wallet_balance") {
        return {
            content: [{ type: "text", text: "Remaining Daily Limit: 4.50 USDC" }]
        };
    }

    throw new Error("Tool not recognized by AgentPay MCP.");
});

// 4. Setup the Express Transports
let transport;

async function handleMcpSse(req, res) {
    console.log("🔌 Claude Desktop connected to MCP Stream!");
    // We tell Claude where to send its execution messages
    transport = new SSEServerTransport("/mcp/messages", res);
    await mcpServer.connect(transport);
}

async function handleMcpMessages(req, res) {
    if (!transport) {
        return res.status(500).send("MCP Transport not initialized. Connect to SSE first.");
    }
    await transport.handlePostMessage(req, res);
}

module.exports = { handleMcpSse, handleMcpMessages };