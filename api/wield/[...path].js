// SpawnEngine/api/wield/[...path].js

module.exports = async function handler(req, res) {
  try {
    const apiKey = process.env.WIELD_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Missing WIELD_API_KEY in environment" });
    }

    const { path = [] } = req.query;
    const joinedPath = Array.isArray(path) ? path.join("/") : String(path || "");
    const baseUrl = "https://build.wield.xyz";

    const query = new URLSearchParams(req.query);
    query.delete("path");

    const target =
      `${baseUrl}/${joinedPath}` +
      (query.toString() ? `?${query.toString()}` : "");

    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : JSON.stringify(req.body || {}),
    });

    const text = await upstream.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    res.status(upstream.status).json(json);
  } catch (err) {
    console.error("Wield proxy error:", err);
    res.status(500).json({ error: "Proxy error", detail: String(err) });
  }
};