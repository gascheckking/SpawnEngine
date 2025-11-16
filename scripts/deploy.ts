import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  const platform =
    process.env.PLATFORM_FEE_RECIPIENT || (await deployer.getAddress());

  console.log("Deploying SpawnEngine with:");
  console.log("  Deployer:", deployer.address);
  console.log("  Platform fee recipient:", platform);

  // ReserveGuard params
  const mythicMult = ethers.parseEther("200"); // 200x
  const bufferBps = 1000; // +10%

  const Guard = await ethers.getContractFactory("ReserveGuard");
  const guard = await Guard.deploy(mythicMult, bufferBps);
  await guard.waitForDeployment();
  const guardAddr = await guard.getAddress();
  console.log("ReserveGuard deployed at:", guardAddr);

  const Factory = await ethers.getContractFactory("PackFactory");
  const factory = await Factory.deploy(platform);
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log("PackFactory deployed at:", factoryAddr);

  console.log("==== COPY TO ACTIONS ENV OR NOTES ====");
  console.log("GUARD", guardAddr);
  console.log("FACTORY", factoryAddr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});