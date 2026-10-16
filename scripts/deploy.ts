import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  const MUSD_ADDRESS = process.env.MUSD_ADDRESS!;
  const SAVINGS_VAULT_ADDRESS = process.env.SAVINGS_VAULT_ADDRESS!;
  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || deployer.address;

  if (!MUSD_ADDRESS || !SAVINGS_VAULT_ADDRESS) {
    throw new Error("Set MUSD_ADDRESS and SAVINGS_VAULT_ADDRESS in .env");
  }

  console.log("\nDeploying MezoFlowVault...");
  const Vault = await ethers.getContractFactory("MezoFlowVault");
  const vault = await Vault.deploy(
    MUSD_ADDRESS,
    SAVINGS_VAULT_ADDRESS,
    TREASURY_ADDRESS,
    "Mezo Flow MUSD",
    "mzFLOW-MUSD"
  );
  await vault.waitForDeployment();

  const vaultAddress = await vault.getAddress();
  console.log("MezoFlowVault deployed to:", vaultAddress);
  console.log("Asset (MUSD):", await vault.asset());
  console.log("Savings vault:", await vault.savingsVault());
  console.log("Treasury:", await vault.treasury());

  console.log("\nVerification command:");
  console.log(
    `npx hardhat verify --network mezoTestnet ${vaultAddress} ${MUSD_ADDRESS} ${SAVINGS_VAULT_ADDRESS} ${TREASURY_ADDRESS} "Mezo Flow MUSD" "mzFLOW-MUSD"`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});