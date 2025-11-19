// onchain/base.js

const { ethers } = require("ethers");

const rpc =
  process.env.BASE_MAINNET_RPC ||
  process.env.BASE_SEPOLIA_RPC ||
  "https://sepolia.base.org";

/**
 * Base JSON-RPC provider (mainnet fallback to sepolia).
 */
function getBaseProvider() {
  return new ethers.JsonRpcProvider(rpc);
}

/**
 * Generic helper: fetch and parse all logs for a contract from fromBlock → latest.
 * Returns an array of parsed events (ethers InterfaceLog objects).
 */
async function getContractEvents(address, abi, fromBlock = 0) {
  const provider = getBaseProvider();
  const contract = new ethers.Contract(address, abi, provider);

  const logs = await provider.getLogs({
    fromBlock,
    toBlock: "latest",
    address,
  });

  return logs
    .map((l) => {
      try {
        return contract.interface.parseLog(l);
      } catch (_) {
        return null;
      }
    })
    .filter(Boolean);
}

module.exports = {
  getBaseProvider,
  getContractEvents,
};