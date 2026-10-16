import { network } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const { ethers } = await network.connect();
  const sv = process.env.SAVINGS_VAULT_ADDRESS!;
  const musd = process.env.MUSD_ADDRESS!;

  console.log("savings vault code:", (await ethers.provider.getCode(sv)).length > 2 ? "present" : "NONE");
  console.log("musd code:", (await ethers.provider.getCode(musd)).length > 2 ? "present" : "NONE");

  const c = new ethers.Contract(
    sv,
    [
      "function asset() view returns (address)",
      "function convertToAssets(uint256) view returns (uint256)",
      "function balanceOf(address) view returns (uint256)",
    ],
    ethers.provider
  );
  for (const fn of ["asset", "convertToAssets", "balanceOf"]) {
    try {
      const r = fn === "asset" ? await c.asset()
        : fn === "convertToAssets" ? await c.convertToAssets(1n)
        : await c.balanceOf(ethers.ZeroAddress);
      console.log(fn, "->", r.toString());
    } catch (e: any) {
      console.log(fn, "FAILED:", e.shortMessage ?? e.message);
    }
  }
}
main();