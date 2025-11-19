// /services/activity.js
import { getZoraActivity } from "../integrations/zora.js";
import { getFarcasterProfile } from "../integrations/farcaster.js";
import { getContractEvents } from "../onchain/base.js";

export async function getUnifiedActivity(wallet, contracts = []) {
  const out = {};

  // Zora
  out.zora = await getZoraActivity(wallet);

  // Farcaster
  out.farcaster = await getFarcasterProfile(wallet.fid || "");

  // Onchain pack events
  out.onchain = [];
  for (const c of contracts) {
    const events = await getContractEvents(c.address, c.abi, 0);
    out.onchain.push({ address: c.address, events });
  }

  return out;
}