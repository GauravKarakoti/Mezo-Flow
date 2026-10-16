import { network } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const { ethers } = await network.connect();
  const addr = process.env.SAVINGS_VAULT_ADDRESS!;

  const sigs = [
    "name() view returns (string)",
    "symbol() view returns (string)",
    "decimals() view returns (uint8)",
    "totalSupply() view returns (uint256)",
    "owner() view returns (address)",
    "asset() view returns (address)",
    "token() view returns (address)",
    "musd() view returns (address)",
    "underlying() view returns (address)",
    "stakingToken() view returns (address)",
    "depositToken() view returns (address)",
    "totalAssets() view returns (uint256)",
    "totalDeposits() view returns (uint256)",
    "convertToShares(uint256) view returns (uint256)",
    "previewRedeem(uint256) view returns (uint256)",
    "previewDeposit(uint256) view returns (uint256)",
    "pricePerShare() view returns (uint256)",
    "exchangeRate() view returns (uint256)",
    "getPricePerFullShare() view returns (uint256)",
  ];

  for (const s of sigs) {
    const name = s.split("(")[0];
    const args = s.includes("(uint256)") ? [10n ** 18n] : [];
    try {
      const c = new ethers.Contract(addr, ["function " + s], ethers.provider);
      const r = await (c as any)[name](...args);
      console.log("OK  ", s, "->", r.toString());
    } catch {
      console.log("FAIL", s);
    }
  }

  // EIP-1967 implementation slot (is it a proxy?)
  const slot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
  console.log("impl slot:", await ethers.provider.getStorage(addr, slot));
}
main();