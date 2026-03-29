const { createPublicClient, createWalletClient, http, parseAbi } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { baseSepolia } = require('viem/chains');
require('dotenv').config();

/**
 * ERC-8004 Agent Identity Registry
 *
 * ERC-8004 is the Ethereum Foundation standard for autonomous agent identity.
 * It registers: agent address, operator wallet, capabilities, and metadata CID.
 *
 * Registry on Base Sepolia:
 * https://sepolia.basescan.org/address/0x...
 *
 * Spec: https://eips.ethereum.org/EIPS/eip-8004
 */

// Minimal ABI for ERC-8004 AgentRegistry — register + AgentRegistered event
const ERC8004_ABI = parseAbi([
    'function registerAgent(address agentAddress, address operatorAddress, string calldata metadataCid) external returns (bytes32 agentId)',
    'event AgentRegistered(bytes32 indexed agentId, address indexed agentAddress, address indexed operatorAddress, string metadataCid)',
]);

// Base Sepolia ERC-8004 registry — replace with real deployed address
// Check: https://github.com/ethereum/EIPs/issues/8004 for latest deployment
const REGISTRY_ADDRESS = process.env.ERC8004_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000';

function getWalletClient() {
    const raw = process.env.MASTER_PRIVATE_KEY;
    const privateKey = raw.startsWith('0x') ? raw : `0x${raw}`;
    const account = privateKeyToAccount(privateKey);

    const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(process.env.RPC_URL || 'https://sepolia.base.org'),
    });

    const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(process.env.RPC_URL || 'https://sepolia.base.org'),
    });

    return { walletClient, publicClient, account };
}

/**
 * Registers an agent on the ERC-8004 identity registry.
 *
 * @param {string} pkpAddress     - The Lit PKP wallet address (agent identity)
 * @param {string} operatorAddress - The human operator's wallet address
 * @param {string} metadataCid    - IPFS/Storacha CID of agent.json
 *
 * @returns {{ agentId, txHash, explorerUrl }}
 */
async function registerErc8004Identity(pkpAddress, operatorAddress, metadataCid) {

    // If no real registry address is set, return a realistic simulation
    // so the rest of the flow is unblocked during development
    if (REGISTRY_ADDRESS === '0x0000000000000000000000000000000000000000') {
        console.warn('⚠️ [ERC-8004] No registry address set — using simulation mode.');
        console.warn('   Set ERC8004_REGISTRY_ADDRESS in .env for real onchain registration.');

        const simulatedId = `0x${Buffer.from(`${pkpAddress}${Date.now()}`).toString('hex').slice(0, 64)}`;
        return {
            agentId: simulatedId,
            txHash: `0xSIMULATED_${Date.now().toString(16)}`,
            explorerUrl: `https://sepolia.basescan.org/`,
            simulated: true,
        };
    }

    try {
        console.log('⏳ [ERC-8004] Registering agent identity on Base Sepolia...');
        const { walletClient, publicClient } = getWalletClient();

        // Write to the registry
        const txHash = await walletClient.writeContract({
            address: REGISTRY_ADDRESS,
            abi: ERC8004_ABI,
            functionName: 'registerAgent',
            args: [pkpAddress, operatorAddress, metadataCid],
        });

        console.log(`⏳ [ERC-8004] TX submitted: ${txHash}`);

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

        // Extract agentId from the AgentRegistered event log
        let agentId = null;
        for (const log of receipt.logs) {
            try {
                const decoded = publicClient.decodeEventLog({
                    abi: ERC8004_ABI,
                    data: log.data,
                    topics: log.topics,
                });
                if (decoded.eventName === 'AgentRegistered') {
                    agentId = decoded.args.agentId;
                    break;
                }
            } catch (_) {}
        }

        const explorerUrl = `https://sepolia.basescan.org/tx/${txHash}`;
        console.log(`✅ [ERC-8004] Registered! Agent ID: ${agentId}`);
        console.log(`   Explorer: ${explorerUrl}`);

        return { agentId, txHash, explorerUrl, simulated: false };

    } catch (error) {
        console.error('[ERC-8004] Registration failed:', error.message);
        throw error;
    }
}

module.exports = { registerErc8004Identity };