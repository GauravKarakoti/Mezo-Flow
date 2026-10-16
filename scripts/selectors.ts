import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  const impl = "0x92d12f0a60906b39d81acd9bf8977b6c824cd98c";
  const code = (await ethers.provider.getCode(impl)).toLowerCase();
  console.log("impl code bytes:", (code.length - 2) / 2);

  const sigs = [
    "asset()", "totalAssets()", "totalSupply()", "totalShares()",
    "deposit(uint256)", "deposit(uint256,address)",
    "withdraw(uint256)", "withdraw(uint256,address,address)", "withdraw(uint256,address)",
    "redeem(uint256)", "redeem(uint256,address,address)", "redeem(uint256,address)",
    "stake(uint256)", "unstake(uint256)", "claim()", "getReward()",
    "balanceOf(address)", "sharesOf(address)", "shares(address)", "assetsOf(address)",
    "balanceOfUnderlying(address)", "maxWithdraw(address)", "maxRedeem(address)",
    "previewDeposit(uint256)", "previewWithdraw(uint256)", "previewRedeem(uint256)",
    "convertToShares(uint256)", "convertToAssets(uint256)",
    "sharePrice()", "pricePerShare()", "exchangeRate()", "rate()", "index()",
    "musd()", "MUSD()", "token()", "underlying()", "depositToken()",
    "transfer(address,uint256)", "approve(address,uint256)", "transferFrom(address,address,uint256)",
    "owner()", "name()", "symbol()", "decimals()",
  ];

  for (const s of sigs) {
    const sel = ethers.id(s).slice(2, 10);
    console.log(code.includes(sel) ? "FOUND  " : "absent ", s, sel);
  }
}
main();