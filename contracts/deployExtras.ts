import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const platform =
    process.env.PLATFORM_FEE_RECIPIENT || (await deployer.getAddress());

  console.log("Deploying extras with:");
  console.log("  Deployer:", deployer.address);
  console.log("  Fee / platform wallet:", platform);

  // PackTradeHub
  const Trade = await ethers.getContractFactory("PackTradeHub");
  const trade = await Trade.deploy(platform);
  await trade.waitForDeployment();
  const tradeAddr = await trade.getAddress();
  console.log("PackTradeHub deployed at:", tradeAddr);

  // Reward token
  const Reward = await ethers.getContractFactory("SpawnRewardToken");
  const reward = await Reward.deploy();
  await reward.waitForDeployment();
  const rewardAddr = await reward.getAddress();
  console.log("SpawnRewardToken deployed at:", rewardAddr);

  // Lootbox1155
  const Loot = await ethers.getContractFactory("Lootbox1155");
  const loot = await Loot.deploy("ipfs://lootbox-base-uri/");
  await loot.waitForDeployment();
  const lootAddr = await loot.getAddress();
  console.log("Lootbox1155 deployed at:", lootAddr);

  // UtilityPass
  const Pass = await ethers.getContractFactory("UtilityPass");
  const pass = await Pass.deploy(
    "SpawnEngine Utility Pass",
    "SPAWNPASS",
    "ipfs://utility-pass-base-uri/"
  );
  await pass.waitForDeployment();
  const passAddr = await pass.getAddress();
  console.log("UtilityPass deployed at:", passAddr);

  console.log("==== COPY / SAVE ====");
  console.log("PackTradeHub:", tradeAddr);
  console.log("SpawnRewardToken:", rewardAddr);
  console.log("Lootbox1155:", lootAddr);
  console.log("UtilityPass:", passAddr);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});