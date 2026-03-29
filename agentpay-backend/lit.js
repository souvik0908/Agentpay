const { Wallet } = require("ethers");
require("dotenv").config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

const state = {
  currentAgent: null
};

async function loadVincentExpressMiddleware() {
  return import("@lit-protocol/vincent-app-sdk/expressMiddleware");
}

async function loadVincentAbilityClient() {
  return import("@lit-protocol/vincent-app-sdk/abilityClient");
}

async function loadSendTokensAbility() {
  return import("@saucereon/send-tokens-ability");
}

async function buildAuthHelpers() {
  const { getAuthenticateUserExpressHandler, authenticatedRequestHandler } =
    await loadVincentExpressMiddleware();

  const authenticateUser = getAuthenticateUserExpressHandler(
    requireEnv("VINCENT_ALLOWED_AUDIENCE")
  );

  return {
    authenticateUser,
    authenticatedRequestHandler
  };
}

function setProvisionedAgent(agent) {
  state.currentAgent = agent;
}

function getProvisionedAgent() {
  if (!state.currentAgent) {
    throw new Error("No provisioned Vincent agent session found. Run /api/provision first.");
  }
  return state.currentAgent;
}

/**
 * This is where you may need to tweak the ability param names after testing,
 * because the generic Vincent docs explain execute(params) but do not provide
 * the exact schema for @saucereon/send-tokens-ability. The rest of the flow is real.
 */
function buildSendTokensAbilityParams({
  recipientAddress,
  amount,
  tokenAddress
}) {
  if (tokenAddress) {
    return {
      to: recipientAddress,
      amount: String(amount),
      tokenAddress
    };
  }

  return {
    to: recipientAddress,
    amount: String(amount)
  };
}

async function executeBaseSepoliaSend({
  recipientAddress,
  amount,
  tokenAddress
}) {
  const { getVincentAbilityClient } = await loadVincentAbilityClient();
  const sendTokensModule = await loadSendTokensAbility();

  const bundledVincentAbility =
    sendTokensModule.bundledVincentAbility ||
    sendTokensModule.default ||
    sendTokensModule;

  const delegateeSigner = new Wallet(
    requireEnv("VINCENT_DELEGATEE_PRIVATE_KEY")
  );

  const abilityClient = getVincentAbilityClient({
    ethersSigner: delegateeSigner,
    bundledVincentAbility
  });

  const agent = getProvisionedAgent();

  const abilityParams = buildSendTokensAbilityParams({
    recipientAddress,
    amount,
    tokenAddress
  });

  const context = {
    delegatorPkpEthAddress: agent.pkpAddress,
    agentAddress: agent.agentAddress || agent.pkpAddress
  };

  const precheckResult = await abilityClient.precheck(abilityParams, context);

  if (!precheckResult || precheckResult.success !== true) {
    throw new Error(
      `Vincent precheck failed: ${JSON.stringify(precheckResult)}`
    );
  }

  const executeResult = await abilityClient.execute(abilityParams, context);

  return {
    precheckResult,
    executeResult,
    abilityParams,
    context
  };
}

module.exports = {
  buildAuthHelpers,
  setProvisionedAgent,
  getProvisionedAgent,
  executeBaseSepoliaSend
};