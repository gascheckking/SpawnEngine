// /onchain/base.js
import { ethers } from "ethers";

const rpc = process.env.BASE_MAINNET_RPC || process.env.BASE_SEPOLIA_RPC;

export function getBaseProvider() {
  return new ethers.JsonRpcProvider(rpc);
}

export async function getContractEvents(address, abi, fromBlock = 0) {
  const provider = getBaseProvider();
  const contract = new ethers.Contract(address, abi, provider);

  const logs = await provider.getLogs({
    fromBlock,
    toBlock: "latest",
    address
  });

  return logs.map(l => {
    try {
      return contract.interface.parseLog(l);
    } catch (err) {
      return null;
    }
  }).filter(Boolean);
}