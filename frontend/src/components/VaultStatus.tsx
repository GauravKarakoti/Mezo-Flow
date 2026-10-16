import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { vaultAbi, VAULT_ADDRESS } from "../abi";

export default function VaultStats() {
  const { data: totalAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "totalAssets",
  });

  const { data: totalSupply } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "totalSupply",
  });

  const { data: fee } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "performanceFee",
  });

  const tvl = totalAssets ? formatEther(totalAssets) : "0";
  const supply = totalSupply ? formatEther(totalSupply) : "0";
  const sharePrice =
    totalAssets && totalSupply && totalSupply > 0n
      ? Number(formatEther(totalAssets)) / Number(formatEther(totalSupply))
      : 1;

  return (
    <section className="stats">
      <div className="stat">
        <span className="label">Total Value Locked</span>
        <span className="value">{Number(tvl).toLocaleString()} MUSD</span>
      </div>
      <div className="stat">
        <span className="label">Total Shares</span>
        <span className="value">{Number(supply).toLocaleString()} mzFLOW-MUSD</span>
      </div>
      <div className="stat">
        <span className="label">Share Price</span>
        <span className="value">{sharePrice.toFixed(6)} MUSD</span>
      </div>
      <div className="stat">
        <span className="label">Performance Fee</span>
        <span className="value">{fee ? Number(fee) / 100 : 0}%</span>
      </div>
    </section>
  );
}