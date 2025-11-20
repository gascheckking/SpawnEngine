// services/activity.js
// Frontend helper: fetch unified activity from the API.
// If API fails, it falls back to a local mock so UI still works.

export async function getUnifiedActivity(wallet, contracts = []) {
  const params = new URLSearchParams();
  if (wallet) params.set("wallet", wallet);
  if (contracts.length) params.set("contracts", contracts.join(","));

  const url = `/api/wield/unified-activity?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Unified activity failed, using mock:", err);

    const now = Date.now();

    return {
      wallet: wallet || "0x0000…mock",
      source: "mock-local",
      events: [
        {
          id: "e-pack-1",
          ts: now - 45_000,
          kind: "pack_open",
          label: "Opened Tiny Legends style pack",
          detail: "2x rare · 1x epic · 4x commons",
        },
        {
          id: "e-burn-1",
          ts: now - 120_000,
          kind: "burn",
          label: "Burned 5 commons → 2 new packs",
          detail: "burnCommonsForTwo()",
        },
        {
          id: "e-zora-1",
          ts: now - 180_000,
          kind: "zora",
          label: "Minted creator coin on Base",
          detail: "Zora coin reward from pack",
        },
        {
          id: "e-cast-1",
          ts: now - 240_000,
          kind: "cast",
          label: "Farcaster cast: live pull recap",
          detail: "#onchain activity ping",
        },
      ],
    };
  }
}