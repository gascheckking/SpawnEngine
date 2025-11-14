import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  // 1. Deploy ReserveGuard
  const Guard = await ethers.getContractFactory("ReserveGuard");
  const guard = await Guard.deploy();
  await guard.waitForDeployment();
  console.log("Guard deployed at:", await guard.getAddress());

  // 2. Deploy PackFactory
  const Factory = await ethers.getContractFactory("PackFactory");
  const factory = await Factory.deploy(await guard.getAddress());
  await factory.waitForDeployment();
  console.log("Factory deployed at:", await factory.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
