// onchain/base.js
// Node-side helper (används senare när vi hämtar riktiga Base-events)

const { ethers } = require("ethers");

const rpc =
  process.env.BASE_MAINNET_RPC ||
  process.env.BASE_SEPOLIA_RPC ||
  "";

function getBaseProvider() {
  if (!rpc) {
    throw new Error("Missing BASE_MAINNET_RPC or BASE_SEPOLIA_RPC in env");
  }
  return new ethers.JsonRpcProvider(rpc);
}

/**
 * Simple log fetcher för ett kontrakt.
 * @param {string} address
 * @param {Array} abi
 * @param {number} fromBlock
 */
async function getContractEvents(address, abi, fromBlock = 0) {
  const provider = getBaseProvider();
  const contract = new ethers.Contract(address, abi, provider);

  const logs = await provider.getLogs({
    address,
    fromBlock,
    toBlock: "latest",
  });

  return logs
    .map((l) => {
      try {
        return contract.interface.parseLog(l);
      } catch (err) {
        return null;
      }
    })
    .filter(Boolean);
}

module.exports = {
  getBaseProvider,
  getContractEvents,
};