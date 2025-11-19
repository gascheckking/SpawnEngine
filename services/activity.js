// services/activity.js

const { getContractEvents } = require("../onchain/base");

/**
 * Base / TokenPackSeries side.
 * contracts = array of { address, abi, label }
 */
async function fetchBasePackEvents(wallet, contracts = []) {
  const lower = wallet?.toLowerCase?.() || "";
  const out = [];

  for (const c of contracts) {
    try {
      const events = await getContractEvents(c.address, c.abi, 0);
      for (const ev of events) {
        // very loose matching — refine later
        const args = ev.args || [];
        const joined = Object.values(args)
          .map((x) => String(x).toLowerCase())
          .join(" ");

        if (!lower || joined.includes(lower)) {
          out.push({
            source: `Base · ${c.label || "TokenPackSeries"}`,
            text: `${ev.name} – ${c.label || c.address.slice(0, 10)}`,
            ts: Date.now(),
          });
        }
      }
    } catch (err) {
      console.error("fetchBasePackEvents error for", c.address, err.message);
    }
  }

  return out;
}

/**
 * Vibe.market activity (placeholder).
 * Later: call Vibe API / subgraph once available.
 */
async function fetchVibeEvents(wallet) {
  if (!wallet) return [];
  return [
    {
      source: "Vibe.market",
      text: `Listed 3× Foil Realms booster packs from ${short(wallet)}`,
      ts: Date.now() - 3 * 60 * 1000,
    },
  ];
}

/**
 * Zora activity (placeholder).
 */
async function fetchZoraEvents(wallet) {
  if (!wallet) return [];
  return [
    {
      source: "Zora",
      text: `Minted a Rodeo-linked PackMesh drop from ${short(wallet)}`,
      ts: Date.now() - 15 * 60 * 1000,
    },
  ];
}

/**
 * Farcaster / Neynar activity (placeholder).
 */
async function fetchFarcasterEvents(wallet) {
  if (!wallet) return [];
  return [
    {
      source: "Farcaster",
      text: `Cast tipped for sharing a PackMesh pull clip`,
      ts: Date.now() - 30 * 60 * 1000,
    },
  ];
}

/**
 * The Base App activity (placeholder).
 */
async function fetchBaseAppEvents(wallet) {
  if (!wallet) return [];
  return [
    {
      source: "The Base App",
      text: `Bridged +0.42 ETH to fuel pack openings`,
      ts: Date.now() - 60 * 60 * 1000,
    },
  ];
}

/**
 * Rodeo activity (placeholder).
 */
async function fetchRodeoEvents(wallet) {
  if (!wallet) return [];
  return [
    {
      source: "Rodeo.club",
      text: `High-score run using Tiny Legends 2 cards`,
      ts: Date.now() - 2 * 60 * 60 * 1000,
    },
  ];
}

function short(addr) {
  if (!addr || addr.length < 10) return addr || "";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

/**
 * Unified feed used by API layer (server-side).
 * wallet: full address
 * contracts: [{ address, abi, label }]
 */
async function getUnifiedActivity(wallet, contracts = []) {
  const [
    baseEvents,
    vibeEvents,
    zoraEvents,
    farcasterEvents,
    baseAppEvents,
    rodeoEvents,
  ] = await Promise.all([
    fetchBasePackEvents(wallet, contracts),
    fetchVibeEvents(wallet),
    fetchZoraEvents(wallet),
    fetchFarcasterEvents(wallet),
    fetchBaseAppEvents(wallet),
    fetchRodeoEvents(wallet),
  ]);

  const events = [
    ...baseEvents,
    ...vibeEvents,
    ...zoraEvents,
    ...farcasterEvents,
    ...baseAppEvents,
    ...rodeoEvents,
  ].sort((a, b) => b.ts - a.ts);

  return {
    wallet,
    contracts,
    events,
  };
}

module.exports = {
  getUnifiedActivity,
};