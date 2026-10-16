import { network } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const { ethers } = await network.connect();
  const sv = process.env.SAVINGS_VAULT_ADDRESS!;
  const me = (await ethers.getSigners())[0].address;

  const c = new ethers.Contract(sv, [
    "function musdToken() view returns (address)",
    "function yieldToken() view returns (address)",
    "function yieldIndex() view returns (uint256)",
    "function pendingYield() view returns (uint256)",
    "function claimableYield(address) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function strategy() view returns (address)",
    "function pcv() view returns (address)",
    "function vault() view returns (address)",
    "function vaultGauge() view returns (address)",
    "function token() view returns (address)",
  ], ethers.provider);

  for (const fn of ["musdToken","yieldToken","yieldIndex","pendingYield","totalSupply","strategy","pcv","vault","vaultGauge","token"]) {
    try { console.log(fn.padEnd(12), "->", (await (c as any)[fn]()).toString()); }
    catch (e: any) { console.log(fn.padEnd(12), "FAILED:", e.shortMessage ?? e.message); }
  }
  try { console.log("claimableYield(me) ->", (await c.claimableYield(me)).toString()); }
  catch (e: any) { console.log("claimableYield FAILED:", e.shortMessage ?? e.message); }

  const musd = process.env.MUSD_ADDRESS!;
  const erc = new ethers.Contract(musd, ["function balanceOf(address) view returns (uint256)"], ethers.provider);
  console.log("MUSD held by savings contract:", (await erc.balanceOf(sv)).toString());
}
main();