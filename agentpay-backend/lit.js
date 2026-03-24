require('dotenv').config();
const { LitNodeClient } = require('@lit-protocol/lit-node-client');
const { LitContracts } = require('@lit-protocol/contracts-sdk');
const { ethers } = require('ethers');

// Initialize the Lit Node Client on the current testnet using the explicit string
const litNodeClient = new LitNodeClient({
  litNetwork: 'datil-test',
  debug: false
});

async function mintAgentWallet(userWalletAddress) {
    try {
        console.log("🟡 Connecting to Lit Protocol Datil-Test Network...");
        await litNodeClient.connect();

        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const masterWallet = new ethers.Wallet(process.env.MASTER_PRIVATE_KEY, provider);

        console.log("🟡 Connecting to Base Sepolia Contracts...");
        const litContracts = new LitContracts({
            signer: masterWallet,
            // Use the explicit string here too
            network: 'datil-test',
        });
        await litContracts.connect();

        console.log(`🟡 Minting PKP for operator: ${userWalletAddress}...`);
        
        const mintTx = await litContracts.pkpNftContract.write.mintNext(2, {
            value: 0, 
        });
        
        console.log(`🟡 Waiting for transaction confirmation...`);
        const receipt = await mintTx.wait();

        const pkpInfo = await litContracts.pkpNftContract.read.getTokensByAddress(masterWallet.address);
        const latestPkp = pkpInfo[pkpInfo.length - 1];

        const agentWalletAddress = await litContracts.pubkeyRouterContract.read.ethAddress(latestPkp);

        console.log(`🟢 Success! Agent Wallet Minted: ${agentWalletAddress}`);
        
        return {
            pkpAddress: agentWalletAddress,
            tokenId: latestPkp.toString(),
            txHash: receipt.hash
        };

    } catch (error) {
        console.error("🔴 Lit Protocol Error:", error);
        throw error;
    }
}

module.exports = { mintAgentWallet };