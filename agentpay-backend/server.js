const express = require('express');
const cors = require('cors');
const { mintAgentWallet } = require('./lit');
const { handleMcpSse, handleMcpMessages } = require('./mcp'); 

const app = express();
const PORT = 3001;

// Global Middleware
app.use(cors());
// ⚠️ We purposefully do NOT use app.use(express.json()) globally here, 
// because it destroys the raw data stream that the MCP SDK requires!

// ==========================================
// --- 1. NEXT.JS PROVISIONING ENDPOINT ---
// ==========================================
// We apply express.json() ONLY to this specific route so your frontend dashboard can send JSON
app.post('/api/provision', express.json(), async (req, res) => {
    try {
        const { operatorWallet, agentName, dailyLimit } = req.body;

        console.log(`\n[+] New Agent Provisioning Request Received!`);
        console.log(`- Operator: ${operatorWallet}`);
        console.log(`- Agent Name: ${agentName}`);

        // Call the Lit Protocol Network (via lit.js)
        const litData = await mintAgentWallet(operatorWallet);

        // Send the payload back to the Next.js frontend
        res.status(200).json({
            success: true,
            pkpAddress: litData.pkpAddress,
            txHash: litData.txHash,
            // Expose the MCP connection URL for the dashboard
            mcpUrl: `http://localhost:3001/mcp/sse`
        });

    } catch (error) {
        console.error("Provisioning Error:", error);
        res.status(500).json({ success: false, error: "Failed to mint Agent Wallet on Lit Protocol." });
    }
});

// ==========================================
// --- 2. CLAUDE MCP ENDPOINTS ---
// ==========================================

// Claude connects here to establish the persistent Server-Sent Events stream
app.get('/mcp/sse', handleMcpSse);

// Claude sends its tool execution requests here (Leaves the raw stream intact!)
app.post('/mcp/messages', handleMcpMessages);

// ==========================================
// --- 3. SERVER BOOTUP ---
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 AgentPay Backend live on http://localhost:${PORT}`);
    console.log(`🔌 MCP Server listening on http://localhost:${PORT}/mcp/sse`);
});