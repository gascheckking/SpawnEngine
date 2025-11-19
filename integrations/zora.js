// /integrations/zora.js
export async function getZoraActivity(wallet) {
  try {
    const res = await fetch(
      `https://api.zora.co/discover/activity/${wallet}`,
      { headers: { accept: "application/json" } }
    );
    return await res.json();
  } catch (err) {
    return { error: String(err) };
  }
}