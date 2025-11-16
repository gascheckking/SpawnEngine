import { ethers } from "hardhat";

async function main() {
  const factoryAddr = process.env.FACTORY!;
  const payoutToken = process.env.PAYOUT_TOKEN!;
  const packPriceWei = process.env.PACK_PRICE_WEI!;
  const creator = process.env.CREATOR_WALLET!;
  const guardAddr = process.env.GUARD!;

  if (!factoryAddr || !payoutToken || !packPriceWei || !creator || !guardAddr) {
    throw new Error(
      "Missing env: FACTORY, PAYOUT_TOKEN, PACK_PRICE_WEI, CREATOR_WALLET, GUARD"
    );
  }

  console.log("Deploying TokenPackSeries via Factory:", factoryAddr);
  console.log("  payoutToken:", payoutToken);
  console.log("  packPriceWei:", packPriceWei);
  console.log("  creator:", creator);
  console.log("  guard:", guardAddr);

  const factory = await ethers.getContractAt("PackFactory", factoryAddr);
  const tx = await factory.deployTokenSeries(
    payoutToken,
    BigInt(packPriceWei),
    creator,
    guardAddr
  );
  const rc = await tx.wait();
  console.log("deployTokenSeries tx:", rc?.hash);
  console.log(
    "Check explorer logs for SeriesDeployed to get TokenPackSeries address."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
