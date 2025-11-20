// integrations/farcaster.js
// Placeholder för Neynar / Farcaster-integration.
// Nu returnerar vi bara tomma listor – kan fyllas på senare.

const NEYNAR_KEY = process.env.NEYNAR_API_KEY || "";

// future: map wallet → fid → casts
async function fetchFarcasterEventsForWallet(wallet) {
  if (!NEYNAR_KEY || !wallet) {
    return [];
  }

  // TODO: call Neynar / other API and map to {ts, text, url}
  return [];
}

module.exports = {
  fetchFarcasterEventsForWallet,
};