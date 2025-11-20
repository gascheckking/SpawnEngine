// integrations/zora.js
// Placeholder för Zora-integration (coins, mints, trades).

const ZORA_ENDPOINT = "https://api.zora.co/graphql";

/**
 * Fetch Zora activity for a wallet (placeholder).
 */
async function fetchZoraEventsForWallet(wallet) {
  if (!wallet) return [];

  // TODO: call Zora GraphQL här.
  // För nu returnerar vi en tom lista.
  return [];
}

module.exports = {
  fetchZoraEventsForWallet,
};