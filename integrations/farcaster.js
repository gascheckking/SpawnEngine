// /integrations/farcaster.js
export async function getFarcasterProfile(fid) {
  try {
    const res = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        accept: "application/json",
        "api_key": process.env.NEYNAR_API_KEY || "NEYNAR_DEV_KEY"
      }
    });
    return await res.json();
  } catch (err) {
    return { error: String(err) };
  }
}