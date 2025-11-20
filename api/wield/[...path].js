// api/wield/[...path].js
// 1) Unified activity endpoint: /api/wield/unified-activity?wallet=0x...&contracts=0xA,0xB
// 2) Simple proxy till Wield API för framtiden (GET only).

const WIELD_BASE = "https://api.wield.xyz";

function parseUrl(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname.replace(/^\/api\/wield\/?/, "");
  const segments = pathname.split("/").filter(Boolean);
  return { url, segments };
}

async function handleUnifiedActivity(req, res, url) {
  const wallet = url.searchParams.get("wallet") || "";
  const contractsParam = url.searchParams.get("contracts") || "";
  const contracts = contractsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const now = Date.now();

  const body = {
    wallet,
    contracts,
    source: "mock-api",
    events: [
      {
        id: "api-pack-1",
        ts: now - 60_000,
        kind: "pack_open",
        label: "SpawnEngine pack opened",
        detail: "1x mythic · 1x legendary · 3x rares",
      },
      {
        id: "api-burn-1",
        ts: now - 150_000,
        kind: "burn",
        label: "Mythic burned for 10 packs",
        detail: "burnMythicForTen()",
      },
      {
        id: "api-zora-1",
        ts: now - 210_000,
        kind: "zora",
        label: "Zora mint event",
        detail: "Creator coin claim from pack",
      },
      {
        id: "api-cast-1",
        ts: now - 270_000,
        kind: "cast",
        label: "Farcaster interaction",
        detail: "Cast linked to pack open",
      },
    ],
  };

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

// very simple GET proxy to Wield (future use)
async function handleWieldProxy(req, res, url, segments) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Only GET is supported in this proxy for now." }));
    return;
  }

  const apiPath = segments.join("/");
  if (!apiPath) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Missing Wield path." }));
    return;
  }

  const upstream = `${WIELD_BASE}/${apiPath}${url.search}`;

  try {
    const upstreamRes = await fetch(upstream, {
      headers: {
        "x-api-key": process.env.WIELD_API_KEY || "",
        accept: "application/json",
      },
    });

    const text = await upstreamRes.text();

    res.statusCode = upstreamRes.status;
    res.setHeader("Content-Type", upstreamRes.headers.get("content-type") || "application/json");
    res.end(text);
  } catch (err) {
    console.error("Wield proxy error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Wield proxy failed", detail: String(err) }));
  }
}

module.exports = async function handler(req, res) {
  const { url, segments } = parseUrl(req);
  const head = segments[0] || "";

  if (head === "unified-activity") {
    return handleUnifiedActivity(req, res, url);
  }

  return handleWieldProxy(req, res, url, segments);
};