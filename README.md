### Burn/Gamble (now live in TokenPackSeries)
- burnCommonsForTwo(uint256[] tokenIds) — needs 5 opened commons → 20% → mint 2 packs
- burnRareForTwo(uint256 tokenId) — 30% → 2 packs
- burnLegendaryForFive(uint256 tokenId) — 40% → 5 packs
- burnMythicForTen(uint256 tokenId) — 45% → 10 packs

All burns are final (true _burn). Rewards mint new unopened packs (no treasury impact).

# Spawniz Pack Engine — MVP (Base Sepolia)

**Architecture:** 4 core contracts to start; no protocol-imposed limits — unlimited series via the Factory.

## Quick Start (GitHub-only)

1) Push repo to GitHub (`main`).
2) Repo → **Settings → Secrets → Actions**: add
   - `BASE_SEPOLIA_RPC` = https://sepolia.base.org
   - `PRIVATE_KEY` = your deployer pk (no 0x prefix needed for some runners; here keep 0x)
   - `PLATFORM_FEE_RECIPIENT` = your wallet
   - (optional) `PAYOUT_TOKEN`, `PACK_PRICE_WEI`, `CREATOR_WALLET`
3) **Actions → Deploy Contracts (Base Sepolia) → Run workflow**  
   - Set `deploy_demo_series = yes` if you filled optional secrets.
4) Copy `ReserveGuard` + `PackFactory` addresses from logs.
5) If demo disabled: run `scripts/deploySeries.ts` later (set `FACTORY`, `GUARD` as env).
6) Pages builds `docs/` automatically → open your Pages URL.
7) In the UI: Connect → paste **TokenPackSeries** address → Approve → **Buy** → **Open**.

## Contracts
- `PackFactory.sol` — deploys series, enforces split (50/35/15)
- `TokenPackSeries.sol` — buy/open ERC20 pack, payouts, reserve checks
- `ReserveGuard.sol` — two-mythic safety + buffer
- `UtilityPackRouter.sol` — social/XP stubs (for Farcaster)

## Next
- Replace `_rand()` with Chainlink VRF
- Add burn ladder + relics
- Creator dashboard (deploy new series from UI)
- Zora/Hybrid packs as presets on the same TokenPackSeries
- NFTPackSeries (phase 2)
